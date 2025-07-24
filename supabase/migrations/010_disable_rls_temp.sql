-- ⚠️ Desabilitação Temporária RLS - Apenas para Desenvolvimento
-- ATENÇÃO: Use apenas em ambiente de desenvolvimento!

-- ========================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- ========================================

-- Desabilitar RLS nas tabelas problemáticas
ALTER TABLE comunidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comunidade DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas (opcional)
DROP POLICY IF EXISTS "Users can view communities" ON comunidades;
DROP POLICY IF EXISTS "Users can create communities" ON comunidades;
DROP POLICY IF EXISTS "Users can update communities" ON comunidades;
DROP POLICY IF EXISTS "Users can delete communities" ON comunidades;
DROP POLICY IF EXISTS "Users can view community members" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can join communities" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can update membership" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can leave communities" ON membros_comunidade;

-- Remover políticas simples também
DROP POLICY IF EXISTS "view_communities" ON comunidades;
DROP POLICY IF EXISTS "create_communities" ON comunidades;
DROP POLICY IF EXISTS "update_communities" ON comunidades;
DROP POLICY IF EXISTS "delete_communities" ON comunidades;
DROP POLICY IF EXISTS "view_members" ON membros_comunidade;
DROP POLICY IF EXISTS "join_communities" ON membros_comunidade;
DROP POLICY IF EXISTS "update_membership" ON membros_comunidade;
DROP POLICY IF EXISTS "leave_communities" ON membros_comunidade;

-- ========================================
-- 2. VERIFICAR STATUS
-- ========================================

-- Verificar se RLS foi desabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('comunidades', 'membros_comunidade');

-- Verificar se políticas foram removidas
SELECT 
    tablename, 
    COUNT(*) as policies_count
FROM pg_policies 
WHERE tablename IN ('comunidades', 'membros_comunidade')
GROUP BY tablename;

-- ========================================
-- 3. TESTAR ACESSO
-- ========================================

-- Testar consultas básicas
SELECT 'Testando acesso às comunidades...' as status;
SELECT COUNT(*) as total_comunidades FROM comunidades;

SELECT 'Testando acesso aos membros...' as status;
SELECT COUNT(*) as total_membros FROM membros_comunidade;

-- ========================================
-- 4. AVISO IMPORTANTE
-- ========================================

DO $$ 
BEGIN
    RAISE NOTICE '⚠️  RLS DESABILITADO TEMPORARIAMENTE!';
    RAISE NOTICE '';
    RAISE NOTICE '🔓 Tabelas sem proteção RLS:';
    RAISE NOTICE '   - comunidades';
    RAISE NOTICE '   - membros_comunidade';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Para reabilitar RLS:';
    RAISE NOTICE '   1. Execute 010_fix_rls_recursion.sql';
    RAISE NOTICE '   2. Ou execute 001_initial_communities_migration.sql';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NÃO USE EM PRODUÇÃO!';
END $$;

-- ========================================
-- 5. SCRIPT PARA REABILITAR (COMENTADO)
-- ========================================

/*
-- Para reabilitar RLS mais tarde:

ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comunidade ENABLE ROW LEVEL SECURITY;

-- Depois execute 010_fix_rls_recursion.sql para criar políticas corretas
*/