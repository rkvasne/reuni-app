-- 🔍 Verificação Rápida - O que está faltando?

-- 1. Verificar colunas da tabela comunidades
SELECT 'COMUNIDADES - Colunas existentes:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comunidades' 
ORDER BY ordinal_position;

-- 2. Verificar colunas da tabela membros_comunidade  
SELECT 'MEMBROS_COMUNIDADE - Colunas existentes:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'membros_comunidade' 
ORDER BY ordinal_position;

-- 3. Verificar se eventos tem coluna comunidade_id
SELECT 'EVENTOS - Coluna comunidade_id:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND column_name = 'comunidade_id';

-- 4. Verificar políticas RLS
SELECT 'POLÍTICAS RLS:' as info;
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('comunidades', 'membros_comunidade')
ORDER BY tablename, policyname;

-- 5. Verificar triggers
SELECT 'TRIGGERS:' as info;
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('comunidades', 'membros_comunidade', 'eventos')
ORDER BY event_object_table, trigger_name;

-- 6. Contar dados existentes
SELECT 'DADOS EXISTENTES:' as info;
SELECT 
    (SELECT COUNT(*) FROM comunidades) as total_comunidades,
    (SELECT COUNT(*) FROM membros_comunidade) as total_membros;