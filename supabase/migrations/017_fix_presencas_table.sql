-- Migration: Fix Presencas Table and Relationships
-- Description: Corrige a tabela presencas conforme especificado na tarefa 5
-- Date: 2025-08-06
-- Task: 5. Corrigir tabela presencas e relacionamentos

-- ========================================
-- 1. ADICIONAR CAMPOS FALTANTES
-- ========================================

-- Adicionar campo updated_at se não existir
ALTER TABLE presencas 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar campo data_confirmacao se não existir (renomear created_at semanticamente)
ALTER TABLE presencas 
ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrar dados do created_at para data_confirmacao se necessário
UPDATE presencas 
SET data_confirmacao = created_at 
WHERE data_confirmacao IS NULL AND created_at IS NOT NULL;

-- ========================================
-- 2. VERIFICAR E GARANTIR FOREIGN KEYS CORRETAS
-- ========================================

-- As foreign keys já existem no schema inicial, mas vamos garantir que estão corretas
-- Verificar se as constraints existem e recriar se necessário

DO $ 
BEGIN
    -- Verificar e recriar foreign key para eventos se necessário
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'presencas_evento_id_fkey' 
        AND table_name = 'presencas'
    ) THEN
        ALTER TABLE presencas 
        ADD CONSTRAINT presencas_evento_id_fkey 
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
    END IF;
    
    -- Verificar e recriar foreign key para usuarios se necessário
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'presencas_usuario_id_fkey' 
        AND table_name = 'presencas'
    ) THEN
        ALTER TABLE presencas 
        ADD CONSTRAINT presencas_usuario_id_fkey 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    END IF;
END $;

-- ========================================
-- 3. GARANTIR CONSTRAINT DE UNICIDADE
-- ========================================

-- A constraint de unicidade já existe no schema inicial
-- Mas vamos garantir que está presente
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'presencas_evento_id_usuario_id_key' 
        AND table_name = 'presencas'
    ) THEN
        ALTER TABLE presencas 
        ADD CONSTRAINT presencas_evento_id_usuario_id_key 
        UNIQUE (evento_id, usuario_id);
    END IF;
END $;

-- ========================================
-- 4. MELHORAR POLÍTICAS RLS
-- ========================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;

-- Remover política antiga genérica
DROP POLICY IF EXISTS "Manage own presences" ON presencas;

-- Criar políticas RLS mais granulares e seguras

-- Política para SELECT: Todos podem ver presenças (para contadores e listas)
CREATE POLICY "presencas_select_all" ON presencas
    FOR SELECT USING (true);

-- Política para INSERT: Usuários autenticados podem confirmar presença própria
CREATE POLICY "presencas_insert_own" ON presencas
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = usuario_id);

-- Política para UPDATE: Usuários podem atualizar apenas suas próprias presenças
CREATE POLICY "presencas_update_own" ON presencas
    FOR UPDATE USING (auth.uid() = usuario_id) 
    WITH CHECK (auth.uid() = usuario_id);

-- Política para DELETE: Usuários podem cancelar apenas suas próprias presenças
CREATE POLICY "presencas_delete_own" ON presencas
    FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 5. CRIAR ÍNDICES PARA CONSULTAS DE PARTICIPAÇÃO
-- ========================================

-- Índice para consultas por evento (listar participantes)
CREATE INDEX IF NOT EXISTS idx_presencas_evento ON presencas(evento_id);

-- Índice para consultas por usuário (eventos do usuário)
CREATE INDEX IF NOT EXISTS idx_presencas_usuario ON presencas(usuario_id);

-- Índice para consultas por status (participantes confirmados)
CREATE INDEX IF NOT EXISTS idx_presencas_status ON presencas(status);

-- Índice para consultas por data de confirmação (ordenação temporal)
CREATE INDEX IF NOT EXISTS idx_presencas_data_confirmacao ON presencas(data_confirmacao);

-- Índice composto para consultas frequentes (evento + status)
CREATE INDEX IF NOT EXISTS idx_presencas_evento_status ON presencas(evento_id, status);

-- Índice composto para consultas de usuário (usuario + status)
CREATE INDEX IF NOT EXISTS idx_presencas_usuario_status ON presencas(usuario_id, status);

-- ========================================
-- 6. IMPLEMENTAR TRIGGER DE UPDATED_AT
-- ========================================

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_presencas_updated_at ON presencas;
CREATE TRIGGER update_presencas_updated_at 
    BEFORE UPDATE ON presencas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. GARANTIR TRIGGER PARA CONTADORES AUTOMÁTICOS
-- ========================================

-- O trigger para contadores já foi criado na migração 016
-- Mas vamos garantir que existe e está funcionando corretamente

-- Verificar se a função existe e recriar se necessário
CREATE OR REPLACE FUNCTION update_evento_participantes_count()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmado' THEN
        UPDATE eventos SET participantes_count = participantes_count + 1 
        WHERE id = NEW.evento_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'confirmado' AND NEW.status = 'confirmado' THEN
            UPDATE eventos SET participantes_count = participantes_count + 1 
            WHERE id = NEW.evento_id;
        ELSIF OLD.status = 'confirmado' AND NEW.status != 'confirmado' THEN
            UPDATE eventos SET participantes_count = participantes_count - 1 
            WHERE id = NEW.evento_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmado' THEN
        UPDATE eventos SET participantes_count = participantes_count - 1 
        WHERE id = OLD.evento_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS trigger_update_participantes_count ON presencas;
CREATE TRIGGER trigger_update_participantes_count
    AFTER INSERT OR UPDATE OR DELETE ON presencas
    FOR EACH ROW EXECUTE FUNCTION update_evento_participantes_count();

-- ========================================
-- 8. ADICIONAR CONSTRAINTS DE VALIDAÇÃO
-- ========================================

DO $ 
BEGIN
    -- Garantir que evento_id e usuario_id não sejam nulos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'presencas_evento_id_not_null' 
        AND table_name = 'presencas'
    ) THEN
        -- Limpar dados inválidos primeiro
        DELETE FROM presencas WHERE evento_id IS NULL OR usuario_id IS NULL;
        
        -- Adicionar constraints NOT NULL
        ALTER TABLE presencas ALTER COLUMN evento_id SET NOT NULL;
        ALTER TABLE presencas ALTER COLUMN usuario_id SET NOT NULL;
    END IF;
END $;

-- ========================================
-- 9. DOCUMENTAÇÃO E COMENTÁRIOS
-- ========================================

COMMENT ON TABLE presencas IS 'Sistema de participação em eventos - relaciona usuários com eventos';
COMMENT ON COLUMN presencas.status IS 'Status da participação: confirmado, interessado, cancelado';
COMMENT ON COLUMN presencas.data_confirmacao IS 'Data/hora quando o usuário confirmou participação';
COMMENT ON COLUMN presencas.updated_at IS 'Data/hora da última atualização do registro';

-- ========================================
-- 10. VERIFICAÇÃO FINAL E RECÁLCULO DE CONTADORES
-- ========================================

-- Recalcular contadores de participantes para garantir consistência
UPDATE eventos SET participantes_count = (
    SELECT COUNT(*) 
    FROM presencas 
    WHERE presencas.evento_id = eventos.id 
    AND presencas.status = 'confirmado'
);

-- Verificação final
DO $ 
BEGIN
    RAISE NOTICE '🎉 Migração 017 - Correção da tabela presencas aplicada com sucesso!';
    RAISE NOTICE '📊 Resumo das correções:';
    RAISE NOTICE '   ✅ Campo updated_at adicionado';
    RAISE NOTICE '   ✅ Campo data_confirmacao adicionado';
    RAISE NOTICE '   ✅ Foreign keys verificadas e garantidas';
    RAISE NOTICE '   ✅ Constraint de unicidade (evento + usuario) garantida';
    RAISE NOTICE '   ✅ Políticas RLS granulares implementadas';
    RAISE NOTICE '   ✅ Índices otimizados para consultas de participação';
    RAISE NOTICE '   ✅ Trigger de updated_at implementado';
    RAISE NOTICE '   ✅ Trigger para contadores automáticos garantido';
    RAISE NOTICE '   ✅ Constraints de validação adicionadas';
    RAISE NOTICE '   ✅ Contadores de participantes recalculados';
    RAISE NOTICE '🔒 Tabela presencas agora está segura e otimizada!';
END $;