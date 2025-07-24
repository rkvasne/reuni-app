-- 🔧 Migração Simples - Adicionar max_participantes
-- Versão mais direta para resolver o erro

-- Adicionar coluna se não existir
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS max_participantes INTEGER;

-- Verificar se foi adicionada
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;