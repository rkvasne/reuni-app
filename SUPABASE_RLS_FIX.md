# 🔒 Correção de Row Level Security (RLS) - Supabase

## ❌ Problema Identificado

**POLÍTICAS CONFLITANTES DETECTADAS!**

Sua tabela `usuarios` tem políticas RLS conflitantes que causam comportamento imprevisível:

### Políticas SELECT Conflitantes:
1. **"Usuários podem ver todos os perfis"** - Permite ver TODOS os perfis (`qual: "true"`)
2. **"Users can view own profile"** - Restringe apenas ao próprio perfil (`qual: "(auth.uid() = id)"`)

### Políticas UPDATE Duplicadas:
1. **"Usuários podem atualizar próprio perfil"** 
2. **"Users can update own profile"**

**Resultado:** Comportamento imprevisível e possíveis erros de acesso.

## ✅ Solução

Execute os seguintes comandos SQL no **SQL Editor** do Supabase:

### 1. PRIMEIRO: Remover Políticas Conflitantes
```sql
-- Remover políticas duplicadas/conflitantes
DROP POLICY "Usuários podem ver todos os perfis" ON usuarios;
DROP POLICY "Usuários podem atualizar próprio perfil" ON usuarios;
```

### 2. Verificar Políticas Restantes
```sql
-- Verificar quais políticas ainda existem
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'usuarios';
```

### 3. Criar Políticas Corretas (se necessário)
```sql
-- Política para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Política para permitir que usuários insiram seus próprios dados
CREATE POLICY "Users can insert own profile" ON usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para permitir que usuários atualizem seus próprios dados
CREATE POLICY "Users can update own profile" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que usuários deletem seus próprios dados
CREATE POLICY "Users can delete own profile" ON usuarios
    FOR DELETE USING (auth.uid() = id);
```

### 3. Habilitar RLS (se não estiver habilitado)
```sql
-- Habilitar RLS na tabela usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
```

### 4. Verificar Resultado Final
```sql
-- Verificar políticas finais (deve ter apenas 4 políticas em inglês)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'usuarios'
ORDER BY cmd;
```

**Resultado esperado:** Apenas 4 políticas em inglês:
- "Users can view own profile" (SELECT)
- "Users can insert own profile" (INSERT) 
- "Users can update own profile" (UPDATE)
- "Users can delete own profile" (DELETE)

## 🔧 Alternativa Temporária (Desenvolvimento)

Se você quiser desabilitar RLS temporariamente para desenvolvimento:

```sql
-- APENAS PARA DESENVOLVIMENTO - NÃO USE EM PRODUÇÃO
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
```

## ⚠️ Importante

- **RLS é essencial para segurança** - não desabilite em produção
- **Teste as políticas** após criá-las
- **Verifique se auth.uid()** está funcionando corretamente

## 🧪 Testar as Políticas

Após aplicar as políticas, teste:

1. **Login** com um usuário
2. **Acesse o perfil** - deve funcionar
3. **Tente acessar perfil de outro usuário** - deve ser bloqueado
4. **Crie/edite seu perfil** - deve funcionar

Execute estes comandos SQL no Supabase e o erro deve ser resolvido!