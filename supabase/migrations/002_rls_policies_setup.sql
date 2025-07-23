-- 🔒 Configuração de Políticas RLS - Sistema de Comunidades
-- Este script configura as políticas de Row Level Security

-- ========================================
-- 1. HABILITAR RLS NAS TABELAS
-- ========================================

ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_comunidade ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. POLÍTICAS PARA COMUNIDADES
-- ========================================

-- Visualização: comunidades públicas ou onde é membro
DROP POLICY IF EXISTS "Users can view communities" ON comunidades;
CREATE POLICY "Users can view communities" ON comunidades
FOR SELECT USING (
  tipo = 'publica' OR 
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND status = 'ativo'
  )
);

-- Criação: usuários autenticados podem criar
DROP POLICY IF EXISTS "Users can create communities" ON comunidades;
CREATE POLICY "Users can create communities" ON comunidades
FOR INSERT WITH CHECK (auth.uid() = criador_id);

-- Atualização: criador ou admin da comunidade
DROP POLICY IF EXISTS "Users can update communities" ON comunidades;
CREATE POLICY "Users can update communities" ON comunidades
FOR UPDATE USING (
  criador_id = auth.uid() OR
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND papel = 'admin' AND status = 'ativo'
  )
);

-- Exclusão: criador ou admin da comunidade
DROP POLICY IF EXISTS "Users can delete communities" ON comunidades;
CREATE POLICY "Users can delete communities" ON comunidades
FOR DELETE USING (
  criador_id = auth.uid() OR
  id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() AND papel = 'admin' AND status = 'ativo'
  )
);

-- ========================================
-- 3. POLÍTICAS PARA MEMBROS
-- ========================================

-- Visualização: membros de comunidades públicas ou onde participa
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

-- Inserção: participar de comunidades
DROP POLICY IF EXISTS "Users can join communities" ON membros_comunidade;
CREATE POLICY "Users can join communities" ON membros_comunidade
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Atualização: próprio registro ou admin/moderador
DROP POLICY IF EXISTS "Users can update membership" ON membros_comunidade;
CREATE POLICY "Users can update membership" ON membros_comunidade
FOR UPDATE USING (
  usuario_id = auth.uid() OR
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() 
    AND papel IN ('admin', 'moderador') 
    AND status = 'ativo'
  )
);

-- Exclusão: sair ou ser removido por admin
DROP POLICY IF EXISTS "Users can leave communities" ON membros_comunidade;
CREATE POLICY "Users can leave communities" ON membros_comunidade
FOR DELETE USING (
  usuario_id = auth.uid() OR
  comunidade_id IN (
    SELECT comunidade_id FROM membros_comunidade 
    WHERE usuario_id = auth.uid() 
    AND papel = 'admin' 
    AND status = 'ativo'
  )
);

-- ========================================
-- 4. VERIFICAÇÃO DAS POLÍTICAS
-- ========================================

DO $$ 
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '🔒 Políticas RLS configuradas!';
    RAISE NOTICE '📋 Políticas ativas:';
    
    FOR rec IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('comunidades', 'membros_comunidade')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE '   - %.%', rec.tablename, rec.policyname;
    END LOOP;
END $$;