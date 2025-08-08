# 🤖 Guia para Agentes de IA: Sistema de Login Reuni

> **⚠️ LEIA ESTE DOCUMENTO ANTES DE MODIFICAR QUALQUER ARQUIVO RELACIONADO AO LOGIN**

---

## 🚨 REGRAS CRÍTICAS - NÃO QUEBRAR

### ❌ NUNCA FAÇA:
1. **Simplificar hooks enterprise** (useAuth, useUserProfile, useUserSync)
2. **Remover cache** ou event system
3. **Alterar RLS policies** sem consultar documentação
4. **Modificar middleware** sem entender exceções
5. **Quebrar atomic operations** no Supabase

### ✅ SEMPRE FAÇA:
1. **Ler documentação completa** em `docs/LOGIN_SYSTEM_REFACTORING_REPORT.md`
2. **Testar fluxo completo** após qualquer alteração
3. **Manter arquitetura enterprise** existente
4. **Preservar segurança** e performance

---

## 🔍 Arquivos CRÍTICOS - Cuidado Extremo

### 🏗️ Core do Sistema
```typescript
📁 hooks/useAuth.ts           // Estado de autenticação principal
📁 hooks/useUserProfile.ts    // Gerenciamento de perfil
📁 hooks/useUserSync.ts       // Sincronização auth ↔ database
📁 utils/middlewareUtils.ts   // Rotas protegidas + exceções
```

### 🛣️ Fluxo de Páginas
```typescript
📁 app/page.tsx                 // Landing + Dashboard + Profile check
📁 app/auth/callback/page.tsx   // Redirecionamento pós-login
📁 app/profile/complete/page.tsx // Completar perfil obrigatório
📁 middleware.ts                // Proteção de rotas server-side
```

---

## 🎯 Fluxo Funcional - NÃO QUEBRAR

```mermaid
graph LR
    A[Login] --> B[auth/callback]
    B --> C{Perfil completo?}
    C -->|Não| D[/profile/complete]
    C -->|Sim + Novo| E[/welcome]
    C -->|Sim + Return| F[Dashboard]
    D --> F
    E --> F
```

### Verificações Críticas
```typescript
// 1. Middleware permite /profile/complete (EXCEÇÃO)
// 2. useUserProfile carrega dados corretamente
// 3. Verificação: !profile?.nome || !profile?.avatar
// 4. Redirecionamento baseado em completude
```

---

## 🔧 Pontos de Falha Conhecidos

### 1. **useUserProfile Loop Infinito**
```typescript
// ❌ ERRO: Condição que nunca é true
if (authUser && !state.profile && !state.isLoading) {
  // NUNCA executa se isLoading começa true
}

// ✅ CORRETO: Permitir carregamento inicial
if (authUser && !state.profile) {
  setState(prev => ({ ...prev, isLoading: true }))
  fetchProfile()
}
```

### 2. **Middleware Bloqueando /profile/complete**
```typescript
// ❌ ERRO: Rota protegida sem exceção
const protectedPaths = ['/profile'] // Bloqueia /profile/complete

// ✅ CORRETO: Exceção para perfil incompleto
const exceptions = ['/profile/complete']
if (exceptions.some(exception => pathname.startsWith(exception))) {
  return false // NÃO protegida
}
```

### 3. **Race Condition no Supabase**
```typescript
// ❌ ERRO: SELECT depois INSERT
const { data } = await supabase.from('usuarios').select().eq('id', userId)
if (!data) {
  await supabase.from('usuarios').insert() // Race condition
}

// ✅ CORRETO: Operação atômica
await supabase.from('usuarios').upsert(data, { onConflict: 'id' })
```

---

## 🛡️ Checklist de Segurança

### Antes de Alterar Login:
- [ ] Li `docs/LOGIN_SYSTEM_REFACTORING_REPORT.md` completamente
- [ ] Entendo o fluxo atual (landing → login → profile check → redirect)
- [ ] Identificei dependências dos hooks (useAuth, useUserProfile, useUserSync)
- [ ] Verifiquei se middleware exceptions estão corretas
- [ ] Confirmei que RLS policies não serão afetadas

### Após Alteração:
- [ ] Testei login completo (email/password e Google)
- [ ] Verifiquei redirecionamento para /profile/complete
- [ ] Confirmei que perfil completo vai para dashboard
- [ ] Testei logout e login novamente
- [ ] Build compila sem erros/warnings

---

## 🚀 Comandos de Teste Rápido

```bash
# Build e verificação
npm run build

# TypeScript check
npx tsc --noEmit

# Teste manual obrigatório:
# 1. Login com perfil incompleto → /profile/complete
# 2. Completar perfil → dashboard
# 3. Logout → landing page
# 4. Login com perfil completo → dashboard direto
```

---

## 📞 Referências de Emergência

### Estado Quebrado?
```javascript
// Console do browser:
window.clearAuth() // Limpa dados corrompidos
// Depois: refresh da página
```

### Logs de Debug
```javascript
// Apenas em desenvolvimento:
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info')
}
```

### Rollback de Emergência
```bash
git log --oneline -10  # Ver commits recentes
git revert <commit>    # Reverter mudança específica
```

---

## 🎯 Casos de Uso Válidos para Modificação

### ✅ PODE ALTERAR:
- Estilização de páginas (CSS/UI)
- Mensagens de texto
- Validações adicionais (não substituir existentes)
- Logs de debug temporários (remover depois)
- Features novas que não afetam fluxo principal

### ❌ NÃO ALTERAR:
- Lógica de redirecionamento
- Estados de loading dos hooks
- Operações do Supabase (SELECT, UPSERT)
- Middleware routing logic
- Cache ou event systems

---

## 📚 Documentação Obrigatória

### Leitura Essencial:
1. `docs/LOGIN_SYSTEM_REFACTORING_REPORT.md` - **DOCUMENTO PRINCIPAL**
2. `hooks/useAuth.ts` - Comments inline
3. `utils/middlewareUtils.ts` - Exceções documentadas
4. `.kiro/specs/database-schema/design.md` - RLS policies

### Em Caso de Dúvida:
> **"Quando em dúvida, NÃO altere. Consulte a documentação primeiro."**

---

**⚠️ LEMBRETE FINAL:** Este sistema foi refatorado após múltiplos bugs críticos. A arquitetura atual é FUNCIONAL e TESTADA. Mudanças devem ser feitas com extremo cuidado.

**📧 Para Questões:** Consultar `docs/LOGIN_SYSTEM_REFACTORING_REPORT.md` antes de qualquer alteração.
