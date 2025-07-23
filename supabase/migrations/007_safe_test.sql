-- 🧪 Teste Seguro - Apenas Verificações (Sem Inserções)

-- ========================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

SELECT '=== ESTRUTURA COMUNIDADES ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'comunidades' 
ORDER BY ordinal_position;

SELECT '=== ESTRUTURA MEMBROS_COMUNIDADE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'membros_comunidade' 
ORDER BY ordinal_position;

SELECT '=== COLUNA COMUNIDADE_ID EM EVENTOS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
AND column_name = 'comunidade_id';

-- ========================================
-- 2. VERIFICAR POLÍTICAS RLS
-- ========================================

SELECT '=== POLÍTICAS RLS ===' as info;
SELECT 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Com condição'
        ELSE 'Sem condição'
    END as tem_condicao
FROM pg_policies 
WHERE tablename IN ('comunidades', 'membros_comunidade')
ORDER BY tablename, policyname;

-- ========================================
-- 3. VERIFICAR CONSTRAINTS
-- ========================================

SELECT '=== CONSTRAINTS ===' as info;
SELECT 
    conname, 
    contype,
    conrelid::regclass AS table_name,
    CASE contype
        WHEN 'c' THEN 'Check'
        WHEN 'f' THEN 'Foreign Key'
        WHEN 'p' THEN 'Primary Key'
        WHEN 'u' THEN 'Unique'
        ELSE contype::text
    END as constraint_type
FROM pg_constraint 
WHERE conrelid::regclass::text IN ('comunidades', 'membros_comunidade')
ORDER BY table_name, conname;

-- ========================================
-- 4. VERIFICAR ÍNDICES
-- ========================================

SELECT '=== ÍNDICES ===' as info;
SELECT 
    schemaname, 
    tablename, 
    indexname,
    CASE 
        WHEN indexname LIKE '%pkey%' THEN 'Primary Key'
        WHEN indexname LIKE '%key%' THEN 'Unique'
        ELSE 'Index'
    END as index_type
FROM pg_indexes 
WHERE tablename IN ('comunidades', 'membros_comunidade')
ORDER BY tablename, indexname;

-- ========================================
-- 5. VERIFICAR TRIGGERS
-- ========================================

SELECT '=== TRIGGERS ===' as info;
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('comunidades', 'membros_comunidade', 'eventos')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 6. DADOS EXISTENTES
-- ========================================

SELECT '=== ESTATÍSTICAS ATUAIS ===' as info;
SELECT 
    (SELECT COUNT(*) FROM comunidades) as total_comunidades,
    (SELECT COUNT(*) FROM membros_comunidade) as total_membros,
    (SELECT COUNT(*) FROM membros_comunidade WHERE status = 'ativo') as membros_ativos,
    (SELECT COUNT(*) FROM eventos WHERE comunidade_id IS NOT NULL) as eventos_com_comunidade;

-- ========================================
-- 7. VERIFICAR USUÁRIOS DISPONÍVEIS
-- ========================================

SELECT '=== USUÁRIOS PARA TESTE ===' as info;
SELECT id, nome, email, created_at 
FROM usuarios 
ORDER BY created_at DESC 
LIMIT 3;

-- ========================================
-- 8. COMUNIDADES EXISTENTES
-- ========================================

SELECT '=== COMUNIDADES EXISTENTES ===' as info;
SELECT 
    c.id,
    c.nome,
    c.categoria,
    c.tipo,
    c.membros_count,
    c.eventos_count,
    u.nome as criador
FROM comunidades c
LEFT JOIN usuarios u ON c.criador_id = u.id
ORDER BY c.created_at DESC
LIMIT 5;

-- ========================================
-- 9. VERIFICAÇÃO DE INTEGRIDADE
-- ========================================

SELECT '=== VERIFICAÇÃO DE INTEGRIDADE ===' as info;

-- Comunidades sem criador válido
SELECT 'Comunidades com criador inválido:' as problema;
SELECT c.nome, c.criador_id
FROM comunidades c
LEFT JOIN usuarios u ON c.criador_id = u.id
WHERE u.id IS NULL;

-- Membros sem usuário válido
SELECT 'Membros com usuário inválido:' as problema;
SELECT mc.id, mc.usuario_id
FROM membros_comunidade mc
LEFT JOIN usuarios u ON mc.usuario_id = u.id
WHERE u.id IS NULL;

-- Comunidades sem admin
SELECT 'Comunidades sem admin:' as problema;
SELECT c.nome
FROM comunidades c
WHERE NOT EXISTS (
    SELECT 1 FROM membros_comunidade mc 
    WHERE mc.comunidade_id = c.id 
    AND mc.papel = 'admin' 
    AND mc.status = 'ativo'
);

-- ========================================
-- 10. STATUS FINAL
-- ========================================

DO $$ 
DECLARE
    comunidades_count INTEGER;
    membros_count INTEGER;
    rls_enabled BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO comunidades_count FROM comunidades;
    SELECT COUNT(*) INTO membros_count FROM membros_comunidade WHERE status = 'ativo';
    
    SELECT rowsecurity INTO rls_enabled 
    FROM pg_tables 
    WHERE tablename = 'comunidades';
    
    RAISE NOTICE '✅ SISTEMA DE COMUNIDADES - STATUS:';
    RAISE NOTICE '   📊 Comunidades: %', comunidades_count;
    RAISE NOTICE '   👥 Membros ativos: %', membros_count;
    RAISE NOTICE '   🔒 RLS habilitado: %', rls_enabled;
    
    IF comunidades_count > 0 THEN
        RAISE NOTICE '   ✅ Sistema pronto para uso!';
    ELSE
        RAISE NOTICE '   ⚠️  Nenhuma comunidade criada ainda';
    END IF;
END $$;