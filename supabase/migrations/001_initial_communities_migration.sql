-- 🔄 Migração Segura - Sistema de Comunidades v0.0.5
-- Este script adiciona apenas o que está faltando, sem quebrar dados existentes

-- ========================================
-- 1. ATUALIZAR TABELA COMUNIDADES
-- ========================================

-- Adicionar colunas que podem estar faltando
ALTER TABLE comunidades 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'publica',
ADD COLUMN IF NOT EXISTS membros_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS eventos_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Atualizar categoria para comunidades existentes sem categoria
UPDATE comunidades 
SET categoria = 'Outros' 
WHERE categoria IS NULL OR categoria = '';

-- Tornar categoria obrigatória
ALTER TABLE comunidades ALTER COLUMN categoria SET NOT NULL;

-- Adicionar constraint de tipo se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comunidades_tipo_check') THEN
        ALTER TABLE comunidades ADD CONSTRAINT comunidades_tipo_check 
        CHECK (tipo IN ('publica', 'privada', 'restrita'));
    END IF;
END $$;

-- ========================================
-- 2. CRIAR TABELA MEMBROS_COMUNIDADE
-- ========================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'membros_comunidade') THEN
        CREATE TABLE membros_comunidade (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE NOT NULL,
          usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
          papel VARCHAR(20) DEFAULT 'membro' CHECK (papel IN ('admin', 'moderador', 'membro')),
          status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'banido')),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(comunidade_id, usuario_id)
        );
        
        RAISE NOTICE 'Tabela membros_comunidade criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela membros_comunidade já existe, pulando criação...';
    END IF;
END $$;

-- ========================================
-- 3. ADICIONAR CRIADORES COMO ADMINS
-- ========================================

-- Inserir criadores das comunidades como admins (se não existirem)
INSERT INTO membros_comunidade (comunidade_id, usuario_id, papel, status)
SELECT 
    c.id, 
    c.criador_id, 
    'admin', 
    'ativo'
FROM comunidades c
WHERE NOT EXISTS (
    SELECT 1 FROM membros_comunidade mc 
    WHERE mc.comunidade_id = c.id 
    AND mc.usuario_id = c.criador_id
);

-- ========================================
-- 4. ATUALIZAR TABELA EVENTOS
-- ========================================

-- Adicionar coluna comunidade_id se não existir
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES comunidades(id);

-- ========================================
-- 5. CRIAR ÍNDICES DE PERFORMANCE
-- ========================================

-- Índices para comunidades
CREATE INDEX IF NOT EXISTS idx_comunidades_categoria ON comunidades(categoria);
CREATE INDEX IF NOT EXISTS idx_comunidades_criador ON comunidades(criador_id);
CREATE INDEX IF NOT EXISTS idx_comunidades_tipo ON comunidades(tipo);
CREATE INDEX IF NOT EXISTS idx_comunidades_created_at ON comunidades(created_at DESC);

-- Índices para membros
CREATE INDEX IF NOT EXISTS idx_membros_comunidade_id ON membros_comunidade(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_membros_usuario_id ON membros_comunidade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membros_papel ON membros_comunidade(papel);
CREATE INDEX IF NOT EXISTS idx_membros_status ON membros_comunidade(status);

-- Índice para eventos por comunidade
CREATE INDEX IF NOT EXISTS idx_eventos_comunidade ON eventos(comunidade_id);

-- ========================================
-- 6. VERIFICAÇÃO FINAL
-- ========================================

-- Mostrar estatísticas finais
DO $$ 
DECLARE
    total_comunidades INTEGER;
    total_membros INTEGER;
    total_eventos_com_comunidade INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_comunidades FROM comunidades;
    SELECT COUNT(*) INTO total_membros FROM membros_comunidade WHERE status = 'ativo';
    SELECT COUNT(*) INTO total_eventos_com_comunidade FROM eventos WHERE comunidade_id IS NOT NULL;
    
    RAISE NOTICE '✅ Migração inicial concluída com sucesso!';
    RAISE NOTICE '📊 Estatísticas:';
    RAISE NOTICE '   - Comunidades: %', total_comunidades;
    RAISE NOTICE '   - Membros ativos: %', total_membros;
    RAISE NOTICE '   - Eventos com comunidade: %', total_eventos_com_comunidade;
END $$;