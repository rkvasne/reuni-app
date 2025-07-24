-- 🔧 CORREÇÃO FINAL - Eventos Funcionais
-- Execute APENAS este arquivo para corrigir todos os problemas

-- ========================================
-- 1. ADICIONAR COLUNA MAX_PARTICIPANTES
-- ========================================

-- Adicionar coluna se não existir
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS max_participantes INTEGER;

-- ========================================
-- 2. CRIAR TABELA PARTICIPACOES
-- ========================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS participacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'interessado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(evento_id, usuario_id)
);

-- ========================================
-- 3. CRIAR ÍNDICES BÁSICOS
-- ========================================

CREATE INDEX IF NOT EXISTS idx_participacoes_evento_id ON participacoes(evento_id);
CREATE INDEX IF NOT EXISTS idx_participacoes_usuario_id ON participacoes(usuario_id);

-- ========================================
-- 4. CONFIGURAR RLS BÁSICO
-- ========================================

ALTER TABLE participacoes ENABLE ROW LEVEL SECURITY;

-- Política simples: todos podem ver, usuários autenticados podem gerenciar as próprias
DROP POLICY IF EXISTS "view_participations" ON participacoes;
CREATE POLICY "view_participations" ON participacoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "manage_own_participations" ON participacoes;
CREATE POLICY "manage_own_participations" ON participacoes FOR ALL USING (usuario_id = auth.uid());

-- ========================================
-- 5. VERIFICAÇÃO
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migração concluída!';
    RAISE NOTICE 'Coluna max_participantes: %', 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'eventos' AND column_name = 'max_participantes'
        ) THEN 'EXISTE' ELSE 'NÃO EXISTE' END;
    RAISE NOTICE 'Tabela participacoes: %',
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'participacoes'
        ) THEN 'EXISTE' ELSE 'NÃO EXISTE' END;
END $$;