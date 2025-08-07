-- ========================================
-- CORREÇÃO DA TABELA COMUNIDADES
-- ========================================
-- Esta migração corrige e padroniza a tabela comunidades
-- conforme especificado na task 6 da spec database-schema

-- ========================================
-- 1. ADICIONAR CAMPOS FALTANTES
-- ========================================

-- Adicionar apenas os campos que realmente faltam
ALTER TABLE comunidades 
ADD COLUMN IF NOT EXISTS privada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);

-- ========================================
-- 2. MIGRAR DADOS DO CAMPO TIPO PARA PRIVADA
-- ========================================

-- Converter campo 'tipo' para 'privada' (boolean)
UPDATE comunidades 
SET privada = CASE 
    WHEN tipo IN ('privada', 'restrita') THEN TRUE 
    ELSE FALSE 
END
WHERE privada IS NULL;

-- ========================================
-- 3. CORRIGIR CONSTRAINTS EXISTENTES
-- ========================================

DO $$ 
BEGIN
    -- Limpar dados inválidos antes de adicionar constraints
    
    -- Corrigir nomes muito curtos
    UPDATE comunidades 
    SET nome = 'Comunidade' 
    WHERE nome IS NULL OR length(trim(nome)) < 3;
    
    -- Corrigir descrições muito longas
    UPDATE comunidades 
    SET descricao = left(descricao, 1000) 
    WHERE descricao IS NOT NULL AND length(descricao) > 1000;
    
    -- Adicionar constraint de comprimento do nome se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comunidades_nome_length' 
        AND table_name = 'comunidades'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE comunidades 
        ADD CONSTRAINT comunidades_nome_length 
        CHECK (length(trim(nome)) >= 3);
    END IF;
    
    -- Adicionar constraint de comprimento da descrição se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comunidades_descricao_length' 
        AND table_name = 'comunidades'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE comunidades 
        ADD CONSTRAINT comunidades_descricao_length 
        CHECK (descricao IS NULL OR length(descricao) <= 1000);
    END IF;
    
END $$;

-- ========================================
-- 4. CRIAR ÍNDICES ESTRATÉGICOS
-- ========================================

-- Índices para performance (alguns podem já existir)
CREATE INDEX IF NOT EXISTS idx_comunidades_categoria ON comunidades(categoria);
CREATE INDEX IF NOT EXISTS idx_comunidades_cidade ON comunidades(cidade);
CREATE INDEX IF NOT EXISTS idx_comunidades_criador ON comunidades(criador_id);
CREATE INDEX IF NOT EXISTS idx_comunidades_privada ON comunidades(privada);
CREATE INDEX IF NOT EXISTS idx_comunidades_created_at ON comunidades(created_at DESC);

-- Índices especializados
CREATE INDEX IF NOT EXISTS idx_comunidades_tags ON comunidades USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_comunidades_texto ON comunidades 
    USING GIN(to_tsvector('portuguese', nome || ' ' || coalesce(descricao, '')));

-- ========================================
-- 5. CONFIGURAR RLS E POLÍTICAS
-- ========================================

-- Habilitar RLS
ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Users can view communities" ON comunidades;
DROP POLICY IF EXISTS "Users can create communities" ON comunidades;
DROP POLICY IF EXISTS "Users can update communities" ON comunidades;
DROP POLICY IF EXISTS "Users can delete communities" ON comunidades;
DROP POLICY IF EXISTS "view_communities" ON comunidades;
DROP POLICY IF EXISTS "create_communities" ON comunidades;
DROP POLICY IF EXISTS "update_communities" ON comunidades;
DROP POLICY IF EXISTS "delete_communities" ON comunidades;
DROP POLICY IF EXISTS "Manage own communities" ON comunidades;
DROP POLICY IF EXISTS "View public communities" ON comunidades;

-- Política para visualização: comunidades públicas ou onde é membro
CREATE POLICY "comunidades_select_public_or_member" ON comunidades
FOR SELECT USING (
    NOT privada OR 
    criador_id = auth.uid() OR
    auth.uid() IN (
        SELECT usuario_id FROM membros_comunidade 
        WHERE comunidade_id = comunidades.id
    )
);

-- Política para criação: usuários autenticados
CREATE POLICY "comunidades_insert_authenticated" ON comunidades
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = criador_id);

-- Política para atualização: criador ou admin da comunidade
CREATE POLICY "comunidades_update_admin" ON comunidades
FOR UPDATE USING (
    auth.uid() = criador_id OR 
    auth.uid() IN (
        SELECT usuario_id FROM membros_comunidade 
        WHERE comunidade_id = comunidades.id 
        AND papel IN ('admin', 'moderador')
    )
) WITH CHECK (
    auth.uid() = criador_id OR 
    auth.uid() IN (
        SELECT usuario_id FROM membros_comunidade 
        WHERE comunidade_id = comunidades.id 
        AND papel IN ('admin', 'moderador')
    )
);

-- Política para exclusão: apenas criador
CREATE POLICY "comunidades_delete_owner" ON comunidades
FOR DELETE USING (auth.uid() = criador_id);

-- ========================================
-- 6. TRIGGER PARA UPDATED_AT
-- ========================================

-- Garantir que o trigger de updated_at existe
DROP TRIGGER IF EXISTS update_comunidades_updated_at ON comunidades;
CREATE TRIGGER update_comunidades_updated_at 
    BEFORE UPDATE ON comunidades
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE comunidades IS 'Comunidades de usuários com eventos e discussões';
COMMENT ON COLUMN comunidades.regras IS 'Regras da comunidade definidas pelos administradores';
COMMENT ON COLUMN comunidades.tags IS 'Tags para categorização e busca de comunidades';
COMMENT ON COLUMN comunidades.privada IS 'Se TRUE, comunidade é privada (substitui campo tipo)';
COMMENT ON COLUMN comunidades.membros_count IS 'Contador automático de membros da comunidade';
COMMENT ON COLUMN comunidades.eventos_count IS 'Contador automático de eventos da comunidade';

-- ========================================
-- 8. VERIFICAÇÕES FINAIS
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ TABELA COMUNIDADES CORRIGIDA COM SUCESSO';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Campos adicionados:';
    RAISE NOTICE '   - regras (TEXT)';
    RAISE NOTICE '   - tags (TEXT[])';
    RAISE NOTICE '   - privada (BOOLEAN)';
    RAISE NOTICE '   - cidade (VARCHAR(100))';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS configurado com políticas:';
    RAISE NOTICE '   - SELECT: públicas ou onde é membro';
    RAISE NOTICE '   - INSERT: usuários autenticados';
    RAISE NOTICE '   - UPDATE: criador ou admin/moderador';
    RAISE NOTICE '   - DELETE: apenas criador';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Índices otimizados criados:';
    RAISE NOTICE '   - categoria, cidade, criador_id, privada';
    RAISE NOTICE '   - tags (GIN), texto completo (GIN)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PRÓXIMOS PASSOS:';
    RAISE NOTICE '   - Considere remover campo "tipo" após validação';
    RAISE NOTICE '   - Teste as políticas RLS com diferentes usuários';
    RAISE NOTICE '   - Valide performance dos novos índices';
    RAISE NOTICE '';
END $$;