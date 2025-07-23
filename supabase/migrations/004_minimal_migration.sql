-- 🚀 Migração Mínima - Apenas o Essencial para v0.0.5

-- ========================================
-- 1. ADICIONAR COLUNAS ESSENCIAIS
-- ========================================

-- Comunidades: adicionar colunas que podem estar faltando
ALTER TABLE comunidades 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'Outros',
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'publica',
ADD COLUMN IF NOT EXISTS membros_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS eventos_count INTEGER DEFAULT 0;

-- Membros: adicionar colunas que podem estar faltando
ALTER TABLE membros_comunidade 
ADD COLUMN IF NOT EXISTS papel VARCHAR(20) DEFAULT 'membro',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- Eventos: adicionar referência para comunidade
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES comunidades(id);

-- ========================================
-- 2. CONFIGURAR VALORES PADRÃO
-- ========================================

-- Atualizar comunidades sem categoria
UPDATE comunidades 
SET categoria = 'Outros' 
WHERE categoria IS NULL OR categoria = '';

-- Atualizar membros sem papel
UPDATE membros_comunidade 
SET papel = 'membro' 
WHERE papel IS NULL OR papel = '';

-- Atualizar membros sem status
UPDATE membros_comunidade 
SET status = 'ativo' 
WHERE status IS NULL OR status = '';

-- ========================================
-- 3. ADICIONAR CONSTRAINTS BÁSICAS
-- ========================================

-- Constraint para tipo de comunidade
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comunidades_tipo_check') THEN
        ALTER TABLE comunidades ADD CONSTRAINT comunidades_tipo_check 
        CHECK (tipo IN ('publica', 'privada', 'restrita'));
    END IF;
END $$;

-- Constraint para papel de membro
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membros_comunidade_papel_check') THEN
        ALTER TABLE membros_comunidade ADD CONSTRAINT membros_comunidade_papel_check 
        CHECK (papel IN ('admin', 'moderador', 'membro'));
    END IF;
END $$;

-- Constraint para status de membro
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membros_comunidade_status_check') THEN
        ALTER TABLE membros_comunidade ADD CONSTRAINT membros_comunidade_status_check 
        CHECK (status IN ('ativo', 'pendente', 'banido'));
    END IF;
END $$;

-- ========================================
-- 4. HABILITAR RLS
-- ========================================

ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comunidade ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. POLÍTICAS RLS BÁSICAS
-- ========================================

-- Comunidades: ver públicas ou onde é membro
DROP POLICY IF EXISTS "Users can view communities" ON comunidades;
CREATE POLICY "Users can view communities" ON comunidades
FOR SELECT USING (
  tipo = 'publica' OR 
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Comunidades: criar (usuários autenticados)
DROP POLICY IF EXISTS "Users can create communities" ON comunidades;
CREATE POLICY "Users can create communities" ON comunidades
FOR INSERT WITH CHECK (auth.uid() = criador_id);

-- Membros: ver membros de comunidades públicas ou onde participa
DROP POLICY IF EXISTS "Users can view community members" ON membros_comunidade;
CREATE POLICY "Users can view community members" ON membros_comunidade
FOR SELECT USING (
  comunidade_id IN (
    SELECT id FROM comunidades WHERE tipo = 'publica'
  ) OR
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Membros: participar de comunidades
DROP POLICY IF EXISTS "Users can join communities" ON membros_comunidade;
CREATE POLICY "Users can join communities" ON membros_comunidade
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Membros: sair de comunidades
DROP POLICY IF EXISTS "Users can leave communities" ON membros_comunidade;
CREATE POLICY "Users can leave communities" ON membros_comunidade
FOR DELETE USING (usuario_id = auth.uid());

-- ========================================
-- 6. ÍNDICES BÁSICOS
-- ========================================

CREATE INDEX IF NOT EXISTS idx_comunidades_categoria ON comunidades(categoria);
CREATE INDEX IF NOT EXISTS idx_comunidades_tipo ON comunidades(tipo);
CREATE INDEX IF NOT EXISTS idx_membros_comunidade_id ON membros_comunidade(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_membros_usuario_id ON membros_comunidade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_comunidade ON eventos(comunidade_id);

-- ========================================
-- 7. GARANTIR CRIADORES COMO ADMINS
-- ========================================

-- Inserir criadores como admins (se não existirem)
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
)
ON CONFLICT (comunidade_id, usuario_id) DO NOTHING;

-- ========================================
-- 8. ATUALIZAR CONTADORES
-- ========================================

-- Recalcular contadores básicos
UPDATE comunidades SET 
  membros_count = COALESCE((
    SELECT COUNT(*) 
    FROM membros_comunidade 
    WHERE comunidade_id = comunidades.id 
    AND status = 'ativo'
  ), 0),
  eventos_count = COALESCE((
    SELECT COUNT(*) 
    FROM eventos 
    WHERE comunidade_id = comunidades.id
  ), 0);

-- ========================================
-- 9. VERIFICAÇÃO FINAL
-- ========================================

DO $$ 
DECLARE
    total_comunidades INTEGER;
    total_membros INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_comunidades FROM comunidades;
    SELECT COUNT(*) INTO total_membros FROM membros_comunidade WHERE status = 'ativo';
    
    RAISE NOTICE '✅ Migração mínima concluída!';
    RAISE NOTICE '📊 Comunidades: %, Membros ativos: %', total_comunidades, total_membros;
END $$;