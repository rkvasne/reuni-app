-- Migration: Complete membros_comunidade Implementation
-- Description: Implementa completamente a tabela membros_comunidade conforme spec
-- Date: 2025-08-06
-- Task: 7. Implementar tabela membros_comunidade

-- ========================================
-- 1. VERIFICAR E AJUSTAR ESTRUTURA DA TABELA
-- ========================================

-- A tabela já existe, vamos verificar se tem todos os campos necessários
-- Adicionar campo joined_at se não existir (renomear created_at se necessário)
DO $ 
BEGIN
    -- Verificar se precisa renomear created_at para joined_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membros_comunidade' AND column_name = 'created_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membros_comunidade' AND column_name = 'joined_at'
    ) THEN
        ALTER TABLE membros_comunidade RENAME COLUMN created_at TO joined_at;
        RAISE NOTICE '✅ Campo created_at renomeado para joined_at';
    END IF;
    
    -- Adicionar joined_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membros_comunidade' AND column_name = 'joined_at'
    ) THEN
        ALTER TABLE membros_comunidade ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Campo joined_at adicionado';
    END IF;
END $;

-- ========================================
-- 2. AJUSTAR SISTEMA DE ROLES
-- ========================================

-- Atualizar constraint de papel para usar os roles corretos (admin, moderator, member)
DO $ 
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'membros_comunidade_papel_check' AND table_name = 'membros_comunidade'
    ) THEN
        ALTER TABLE membros_comunidade DROP CONSTRAINT membros_comunidade_papel_check;
        RAISE NOTICE '✅ Constraint antiga de papel removida';
    END IF;
    
    -- Atualizar dados existentes para usar os novos roles
    UPDATE membros_comunidade SET papel = 'admin' WHERE papel = 'admin';
    UPDATE membros_comunidade SET papel = 'moderator' WHERE papel = 'moderador';
    UPDATE membros_comunidade SET papel = 'member' WHERE papel = 'membro';
    
    -- Adicionar nova constraint com roles corretos
    ALTER TABLE membros_comunidade ADD CONSTRAINT membros_comunidade_role_check 
        CHECK (papel IN ('admin', 'moderator', 'member'));
    
    RAISE NOTICE '✅ Sistema de roles atualizado (admin, moderator, member)';
END $;

-- ========================================
-- 3. GARANTIR CONSTRAINT DE UNICIDADE
-- ========================================

-- Verificar se já existe constraint de unicidade
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'membros_comunidade_comunidade_id_usuario_id_key' 
        AND table_name = 'membros_comunidade'
    ) THEN
        -- Remover duplicatas antes de adicionar constraint
        DELETE FROM membros_comunidade 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM membros_comunidade 
            GROUP BY comunidade_id, usuario_id
        );
        
        -- Adicionar constraint de unicidade
        ALTER TABLE membros_comunidade 
        ADD CONSTRAINT membros_comunidade_comunidade_id_usuario_id_key 
        UNIQUE (comunidade_id, usuario_id);
        
        RAISE NOTICE '✅ Constraint de unicidade adicionada';
    ELSE
        RAISE NOTICE '✅ Constraint de unicidade já existe';
    END IF;
END $;

-- ========================================
-- 4. LIMPAR E RECRIAR POLÍTICAS RLS
-- ========================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Manage own membership" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can view community members" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can join communities" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can update membership" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can leave communities" ON membros_comunidade;
DROP POLICY IF EXISTS "view_members" ON membros_comunidade;
DROP POLICY IF EXISTS "join_communities" ON membros_comunidade;
DROP POLICY IF EXISTS "update_membership" ON membros_comunidade;
DROP POLICY IF EXISTS "leave_communities" ON membros_comunidade;

-- Garantir que RLS está habilitado
ALTER TABLE membros_comunidade ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: membros podem ver outros membros da mesma comunidade
CREATE POLICY "membros_select_community_members" ON membros_comunidade
    FOR SELECT USING (
        auth.uid() = usuario_id OR
        auth.uid() IN (
            SELECT mc2.usuario_id FROM membros_comunidade mc2 
            WHERE mc2.comunidade_id = membros_comunidade.comunidade_id
        )
    );

-- Política de INSERT: usuários autenticados podem se juntar a comunidades
CREATE POLICY "membros_insert_own" ON membros_comunidade
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- Política de UPDATE: próprio registro ou admins/moderadores da comunidade
CREATE POLICY "membros_update_own_or_admin" ON membros_comunidade
    FOR UPDATE USING (
        auth.uid() = usuario_id OR
        auth.uid() IN (
            SELECT mc2.usuario_id FROM membros_comunidade mc2 
            WHERE mc2.comunidade_id = membros_comunidade.comunidade_id 
            AND mc2.papel IN ('admin', 'moderator')
        )
    ) WITH CHECK (
        auth.uid() = usuario_id OR
        auth.uid() IN (
            SELECT mc2.usuario_id FROM membros_comunidade mc2 
            WHERE mc2.comunidade_id = membros_comunidade.comunidade_id 
            AND mc2.papel IN ('admin', 'moderator')
        )
    );

-- Política de DELETE: próprio registro ou admins/moderadores da comunidade
CREATE POLICY "membros_delete_own_or_admin" ON membros_comunidade
    FOR DELETE USING (
        auth.uid() = usuario_id OR
        auth.uid() IN (
            SELECT mc2.usuario_id FROM membros_comunidade mc2 
            WHERE mc2.comunidade_id = membros_comunidade.comunidade_id 
            AND mc2.papel IN ('admin', 'moderator')
        )
    );

-- ========================================
-- 5. GARANTIR ÍNDICES OTIMIZADOS
-- ========================================

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_membros_comunidade_id ON membros_comunidade(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_membros_usuario_id ON membros_comunidade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membros_papel ON membros_comunidade(papel);
CREATE INDEX IF NOT EXISTS idx_membros_status ON membros_comunidade(status);
CREATE INDEX IF NOT EXISTS idx_membros_joined_at ON membros_comunidade(joined_at);

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_membros_comunidade_papel ON membros_comunidade(comunidade_id, papel);
CREATE INDEX IF NOT EXISTS idx_membros_usuario_status ON membros_comunidade(usuario_id, status);

-- ========================================
-- 6. IMPLEMENTAR TRIGGER PARA CONTADOR DE MEMBROS
-- ========================================

-- Função para atualizar contador de membros
CREATE OR REPLACE FUNCTION update_comunidade_membros_count()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'ativo' THEN
        UPDATE comunidades SET membros_count = membros_count + 1 
        WHERE id = NEW.comunidade_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'ativo' AND NEW.status = 'ativo' THEN
            UPDATE comunidades SET membros_count = membros_count + 1 
            WHERE id = NEW.comunidade_id;
        ELSIF OLD.status = 'ativo' AND NEW.status != 'ativo' THEN
            UPDATE comunidades SET membros_count = GREATEST(0, membros_count - 1) 
            WHERE id = NEW.comunidade_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'ativo' THEN
        UPDATE comunidades SET membros_count = GREATEST(0, membros_count - 1) 
        WHERE id = OLD.comunidade_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_update_membros_count ON membros_comunidade;
DROP TRIGGER IF EXISTS trigger_update_comunidade_membros_count ON membros_comunidade;

-- Criar novo trigger
CREATE TRIGGER trigger_update_comunidade_membros_count
    AFTER INSERT OR UPDATE OR DELETE ON membros_comunidade
    FOR EACH ROW EXECUTE FUNCTION update_comunidade_membros_count();

-- ========================================
-- 7. IMPLEMENTAR FUNÇÃO PARA AUTO-ADMIN
-- ========================================

-- Função para criar admin automático quando comunidade é criada
CREATE OR REPLACE FUNCTION create_community_admin()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO membros_comunidade (comunidade_id, usuario_id, papel, status)
    VALUES (NEW.id, NEW.criador_id, 'admin', 'ativo')
    ON CONFLICT (comunidade_id, usuario_id) DO UPDATE SET
        papel = 'admin',
        status = 'ativo';
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_create_community_admin ON comunidades;

-- Criar trigger para auto-admin
CREATE TRIGGER trigger_create_community_admin
    AFTER INSERT ON comunidades
    FOR EACH ROW EXECUTE FUNCTION create_community_admin();

-- ========================================
-- 8. RECALCULAR CONTADORES EXISTENTES
-- ========================================

-- Recalcular contadores de membros para dados existentes
UPDATE comunidades SET membros_count = (
    SELECT COUNT(*) 
    FROM membros_comunidade 
    WHERE comunidade_id = comunidades.id 
    AND status = 'ativo'
);

-- ========================================
-- 9. GARANTIR ADMINS EXISTENTES
-- ========================================

-- Inserir criadores como admins se não existirem
INSERT INTO membros_comunidade (comunidade_id, usuario_id, papel, status)
SELECT c.id, c.criador_id, 'admin', 'ativo'
FROM comunidades c
WHERE NOT EXISTS (
    SELECT 1 FROM membros_comunidade mc 
    WHERE mc.comunidade_id = c.id 
    AND mc.usuario_id = c.criador_id
)
ON CONFLICT (comunidade_id, usuario_id) DO UPDATE SET
    papel = 'admin',
    status = 'ativo';

-- ========================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE membros_comunidade IS 'Relacionamento entre usuários e comunidades com sistema de roles';
COMMENT ON COLUMN membros_comunidade.papel IS 'Role do membro: admin, moderator, member';
COMMENT ON COLUMN membros_comunidade.status IS 'Status do membro: ativo, pendente, banido';
COMMENT ON COLUMN membros_comunidade.joined_at IS 'Data de entrada na comunidade';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

DO $ 
DECLARE
    total_membros INTEGER;
    total_admins INTEGER;
    total_comunidades INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_membros FROM membros_comunidade WHERE status = 'ativo';
    SELECT COUNT(*) INTO total_admins FROM membros_comunidade WHERE papel = 'admin' AND status = 'ativo';
    SELECT COUNT(*) INTO total_comunidades FROM comunidades;
    
    RAISE NOTICE '🎉 Tabela membros_comunidade implementada com sucesso!';
    RAISE NOTICE '📊 Estatísticas:';
    RAISE NOTICE '   - Total de comunidades: %', total_comunidades;
    RAISE NOTICE '   - Total de membros ativos: %', total_membros;
    RAISE NOTICE '   - Total de admins: %', total_admins;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Funcionalidades implementadas:';
    RAISE NOTICE '   - Sistema de roles (admin, moderator, member)';
    RAISE NOTICE '   - Constraint de unicidade por comunidade';
    RAISE NOTICE '   - Políticas RLS baseadas em membership';
    RAISE NOTICE '   - Triggers para contadores automáticos';
    RAISE NOTICE '   - Auto-admin para criadores de comunidades';
    RAISE NOTICE '   - Índices otimizados para performance';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Segurança: RLS habilitado com políticas granulares';
    RAISE NOTICE '⚡ Performance: Índices estratégicos criados';
    RAISE NOTICE '🔄 Automação: Triggers para contadores e admin automático';
END $;