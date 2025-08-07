# Guia da Solução Completa - Cadastro com Tabelas

## ✅ Implementação Restaurada

Restaurei a **solução completa** que usa as tabelas do banco de dados:

### 🔧 Mudanças Implementadas

1. **Hook `useUserProfile`**:
   - ✅ Busca usuários na tabela `usuarios`
   - ✅ Cria novos usuários automaticamente
   - ✅ Atualiza perfis no banco de dados
   - ✅ Trata erros de chave duplicada

2. **Callback de Autenticação**:
   - ✅ Verifica perfil real na tabela `usuarios`
   - ✅ Redireciona baseado no estado real do perfil
   - ✅ Logs detalhados para debug

3. **Fluxo de Cadastro**:
   - ✅ `signUp` real (não magic link)
   - ✅ Confirmação de email obrigatória
   - ✅ Criação automática na tabela `usuarios`

## 🚨 IMPORTANTE: Aplicar Migração de Correção

Para funcionar, você **DEVE** aplicar a migração de correção do banco:

### Passo 1: Aplicar Migração 016 (CRÍTICA)
```bash
# Via CLI do Supabase (recomendado)
supabase db push

# OU via SQL Editor no dashboard
# Cole e execute o conteúdo de supabase/migrations/016_fix_database_inconsistencies.sql
```

### Passo 2: Verificar Correções
Execute no SQL Editor para verificar:
```sql
-- Verificar políticas RLS (deve mostrar apenas 3)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- Verificar se tabelas novas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('curtidas_evento', 'posts_comunidade');
```

Deve mostrar apenas 3 políticas para usuarios:
- `usuarios_insert_own`
- `usuarios_select_own` 
- `usuarios_update_own`

## 🧪 Fluxo de Teste

### Novo Usuário
1. **Cadastro**: Email → Recebe confirmação
2. **Confirmação**: Clica link → `/auth/callback`
3. **Callback**: Cria usuário na tabela `usuarios` → `/welcome`
4. **Welcome**: Clica "Explorar" → `/`
5. **Guard**: Detecta nome vazio → `/profile/complete`
6. **Perfil**: Completa nome → Pode usar app

### Usuário Existente
1. **Login**: Email/senha → `/`
2. **Guard**: Verifica perfil na tabela
3. **Completo**: Usa app normalmente
4. **Incompleto**: Vai para `/profile/complete`

## 📊 Logs Esperados

### No Console (useUserProfile):
```
🔍 Buscando perfil do usuário na tabela usuarios...
📝 Usuário não encontrado, criando novo registro...
✅ Usuário criado com sucesso: {id, nome, email, ...}
```

### No Console (Callback):
```
🔍 Verificando perfil do usuário no banco...
✅ Usuário tem perfil completo: {id: "...", nome: "João"}
✅ Redirecionando para / - Usuário existente com perfil completo
```

## ⚠️ Possíveis Problemas

### Se ainda der erro 406/409:
1. **Aplique a migração 016**: `supabase db push`
2. **Verifique se foi aplicada**: Consulte as políticas RLS
3. **Limpe cache**: Ctrl+F5 no navegador
4. **Teste em incógnito**: Para evitar cache
5. **Verifique logs**: Console do navegador

### Se usuário não for criado:
1. **Verifique políticas**: Deve ter `usuarios_insert_own`
2. **Teste manualmente no SQL Editor**: 
   ```sql
   INSERT INTO usuarios (id, nome, email) 
   VALUES (auth.uid(), 'Teste', 'teste@email.com');
   ```
3. **Verifique se está autenticado**: `SELECT auth.uid();` deve retornar um UUID

## 🎯 Status Final

**Callback**: ✅ Usa tabela `usuarios`
**Perfil**: ✅ Salva no banco de dados  
**Cadastro**: ✅ Cria usuários reais
**Onboarding**: ✅ Baseado em dados reais

A solução está **completa e funcional** - só precisa aplicar a migração 016!

## 📋 Status Atual

- ✅ **Migração 016 criada**: Corrige todos os problemas identificados
- ✅ **Specs organizadas**: Sistema modular e bem documentado
- ✅ **Arquivos obsoletos removidos**: Docs limpos e atualizados
- ⚠️ **Ação necessária**: Aplicar migração 016 antes de implementar specs