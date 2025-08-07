-- Migration: Fix usuarios table RLS policies
-- Description: Corrige as políticas RLS da tabela usuarios para permitir operações CRUD adequadas
-- Date: 2024-01-08

-- 1. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can insert own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;

-- 2. Garantir que RLS está habilitado na tabela usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS corretas e específicas

-- Política para SELECT (usuários podem visualizar apenas seu próprio perfil)
CREATE POLICY "usuarios_select_own" ON usuarios
    FOR SELECT 
    USING (auth.uid() = id);

-- Política para INSERT (usuários podem criar apenas seu próprio perfil)
CREATE POLICY "usuarios_insert_own" ON usuarios
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Política para UPDATE (usuários podem atualizar apenas seu próprio perfil)
CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Verificar se a tabela usuarios tem a estrutura correta
-- Garantir que a coluna email permite NULL (será preenchida automaticamente)
ALTER TABLE usuarios ALTER COLUMN email DROP NOT NULL;

-- 5. Criar índices para melhor performance se não existirem
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON usuarios(created_at);
CREATE INDEX IF NOT EXISTS idx_usuarios_nome ON usuarios(nome);

-- 6. Comentários para documentação
COMMENT ON POLICY "usuarios_select_own" ON usuarios IS 'Permite que usuários vejam apenas seu próprio perfil';
COMMENT ON POLICY "usuarios_insert_own" ON usuarios IS 'Permite que usuários criem apenas seu próprio perfil';
COMMENT ON POLICY "usuarios_update_own" ON usuarios IS 'Permite que usuários atualizem apenas seu próprio perfil';

-- 7. Verificação final - esta query deve retornar as 3 políticas criadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'usuarios'
-- ORDER BY policyname;