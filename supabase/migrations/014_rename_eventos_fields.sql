-- 🔄 MIGRAÇÃO: Renomear campos da tabela eventos
-- Data: 2025-08-03
-- Descrição: Alterar nomes dos campos para melhor semântica
--   - eventos.descricao → eventos.local
--   - eventos.local → eventos.cidade

-- ========================================
-- 1. VERIFICAR ESTRUTURA ATUAL
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '🔍 Verificando estrutura atual da tabela eventos...';
    
    -- Verificar se os campos existem
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos' AND column_name = 'descricao'
    ) THEN
        RAISE NOTICE '✅ Campo "descricao" existe';
    ELSE
        RAISE NOTICE '❌ Campo "descricao" NÃO existe';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos' AND column_name = 'local'
    ) THEN
        RAISE NOTICE '✅ Campo "local" existe';
    ELSE
        RAISE NOTICE '❌ Campo "local" NÃO existe';
    END IF;
END $$;

-- ========================================
-- 2. RENOMEAR CAMPOS
-- ========================================

-- Renomear descricao → local (temporário)
ALTER TABLE eventos RENAME COLUMN descricao TO local_temp;

-- Renomear local → cidade
ALTER TABLE eventos RENAME COLUMN local TO cidade;

-- Renomear local_temp → local
ALTER TABLE eventos RENAME COLUMN local_temp TO local;

-- ========================================
-- 3. ATUALIZAR COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN eventos.local IS 'Local/endereço do evento (ex: Centro de Convenções)';
COMMENT ON COLUMN eventos.cidade IS 'Cidade do evento (ex: São Paulo, SP)';

-- ========================================
-- 4. VERIFICAR RESULTADO
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '🔍 Verificando estrutura após renomeação...';
    
    -- Verificar se os novos campos existem
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos' AND column_name = 'local'
    ) THEN
        RAISE NOTICE '✅ Campo "local" existe (antigo descricao)';
    ELSE
        RAISE NOTICE '❌ Campo "local" NÃO existe';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos' AND column_name = 'cidade'
    ) THEN
        RAISE NOTICE '✅ Campo "cidade" existe (antigo local)';
    ELSE
        RAISE NOTICE '❌ Campo "cidade" NÃO existe';
    END IF;
    
    RAISE NOTICE '🎉 Migração concluída com sucesso!';
    RAISE NOTICE '📋 Resumo das alterações:';
    RAISE NOTICE '   - eventos.descricao → eventos.local';
    RAISE NOTICE '   - eventos.local → eventos.cidade';
END $$; 