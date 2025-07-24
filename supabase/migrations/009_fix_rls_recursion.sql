-- 🔧 Correção Permanente - Recursão Infinita RLS
-- Este script corrige as políticas RLS que causam recursão infinita

-- ========================================
-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS
-- ========================================

-- Remover todas as políticas existentes que podem causar recursão
DROP POLICY IF EXISTS "Users can view communities" ON comunidades;
DROP POLICY IF EXISTS "Users can create communities" ON comunidades;
DROP POLICY IF EXISTS "Users can update communities" ON comunidades;
DROP POLICY IF EXISTS "Users can delete communities" ON comunidades;
DROP POLICY IF EXISTS "Users can view community members" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can join communities" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can update membership" ON membros_comunidade;
DROP POLICY IF EXISTS "Users can leave communities" ON membros_comunidade;

-- ========================================
-- 2. CRIAR POLÍTICAS SIMPLES (SEM RECURSÃO)
-- ========================================

-- Comunidades: Visualização simples
CREATE POLICY "view_communities" ON comunidades
FOR SELECT USING (
  tipo = 'publica' OR criador_id = auth.uid()
);

-- Comunidades: Criação
CREATE POLICY "create_communities" ON comunidades
FOR INSERT WITH CHECK (auth.uid() = criador_id);

-- Comunidades: Atualização (apenas criador)
CREATE POLICY "update_communities" ON comunidades
FOR UPDATE USING (criador_id = auth.uid());

-- Comunidades: Exclusão (apenas criador)
CREATE POLICY "delete_communities" ON comunidades
FOR DELETE USING (criador_id = auth.uid());

-- Membros: Visualização (sem subconsultas recursivas)
CREATE POLICY "view_members" ON membros_comunidade
FOR SELECT USING (
  usuario_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM comunidades c 
    WHERE c.id = comunidade_id 
    AND (c.tipo = 'publica' OR c.criador_id = auth.uid())
  )
);

-- Membros: Inserção (participar)
CREATE POLICY "join_communities" ON membros_comunidade
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Membros: Atualização (próprio registro ou admin da comunidade)
CREATE POLICY "update_membership" ON membros_comunidade
FOR UPDATE USING (
  usuario_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM comunidades c 
    WHERE c.id = comunidade_id 
    AND c.criador_id = auth.uid()
  )
);

-- Membros: Exclusão (sair ou ser removido pelo admin)
CREATE POLICY "leave_communities" ON membros_comunidade
FOR DELETE USING (
  usuario_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM comunidades c 
    WHERE c.id = comunidade_id 
    AND c.criador_id = auth.uid()
  )
);

-- ========================================
-- 3. VERIFICAR SE RECURSÃO FOI RESOLVIDA
-- ========================================

-- Testar uma consulta simples
SELECT COUNT(*) as total_comunidades FROM comunidades;

-- Testar consulta com join
SELECT 
    c.nome,
    c.tipo,
    COUNT(mc.id) as membros
FROM comunidades c
LEFT JOIN membros_comunidade mc ON c.id = mc.comunidade_id
GROUP BY c.id, c.nome, c.tipo
LIMIT 5;

-- ========================================
-- 4. VERIFICAÇÃO FINAL
-- ========================================

DO $$ 
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '✅ Políticas RLS corrigidas!';
    RAISE NOTICE '📋 Políticas ativas:';
    
    FOR rec IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('comunidades', 'membros_comunidade')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE '   - %.%', rec.tablename, rec.policyname;
    END LOOP;
    
    RAISE NOTICE '🧪 Teste uma consulta para verificar se a recursão foi resolvida.';
END $$;