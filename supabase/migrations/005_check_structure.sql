-- 🔍 Script para Verificar Estrutura Atual das Comunidades

-- 1. Verificar se tabelas existem
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE tablename IN ('comunidades', 'membros_comunidade')
ORDER BY tablename;

-- 2. Verificar estrutura da tabela comunidades
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'comunidades' 
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela membros_comunidade
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'membros_comunidade' 
ORDER BY ordinal_position;

-- 4. Verificar se coluna comunidade_id existe em eventos
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND column_name = 'comunidade_id';

-- 5. Verificar políticas RLS existentes
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename IN ('comunidades', 'membros_comunidade')
ORDER BY tablename, policyname;

-- 6. Verificar índices existentes
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('comunidades', 'membros_comunidade')
ORDER BY tablename, indexname;

-- 7. Verificar constraints
SELECT 
    conname, 
    contype, 
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid::regclass::text IN ('comunidades', 'membros_comunidade')
ORDER BY table_name, conname;

-- 8. Verificar triggers existentes
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('comunidades', 'membros_comunidade', 'eventos')
ORDER BY event_object_table, trigger_name;

-- 9. Contar registros existentes (se tabelas existirem)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'comunidades') THEN
        RAISE NOTICE 'Comunidades existentes: %', (SELECT COUNT(*) FROM comunidades);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'membros_comunidade') THEN
        RAISE NOTICE 'Membros existentes: %', (SELECT COUNT(*) FROM membros_comunidade);
    END IF;
END $$;