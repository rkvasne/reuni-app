# 🧠 Contexto de Memória: Sistema de Login Reuni

> **Este arquivo deve ser lido por agentes de IA antes de qualquer modificação relacionada ao login**

---

## 🎯 Status Atual (2025-01-09)

### ✅ SISTEMA 100% FUNCIONAL
- Login email/password e Google OAuth
- Redirecionamento automático baseado em perfil
- Completar perfil obrigatório
- Middleware de segurança ativo
- Performance otimizada

### 🔒 ARQUITETURA CRÍTICA
- **Enterprise-grade** para milhões de usuários
- **RLS (Row Level Security)** no Supabase
- **Cache inteligente** com invalidação
- **Event system** para escalabilidade
- **Atomic operations** para consistência

---

## ⚠️ BUGS CRÍTICOS JÁ RESOLVIDOS - NÃO REINTRODUZIR

### 1. **Hook useUserSync Quebrado**
- **Sintoma:** "File is not a module"
- **Causa:** Arquivo corrompido/incompleto
- **Solução:** Implementação completa com atomic upsert
- **⚠️ Não remover:** Lógica de sincronização entre auth.users ↔ usuarios

### 2. **Middleware Bloqueando /profile/complete**
- **Sintoma:** Redirecionamento infinito para /login
- **Causa:** Rota considerada protegida
- **Solução:** Exceção em middlewareUtils.ts
- **⚠️ Não alterar:** Lista de exceções do middleware

### 3. **useUserProfile Loop Infinito**
- **Sintoma:** profileLoading: true permanente
- **Causa:** Condição !state.isLoading impedia carregamento
- **Solução:** Permitir carregamento inicial
- **⚠️ Não quebrar:** useEffect dependencies corretas

### 4. **Supabase 406/400 Errors**
- **Sintoma:** Falha ao criar/atualizar perfil
- **Causa:** Race condition entre SELECT e INSERT
- **Solução:** UPSERT atômico com onConflict
- **⚠️ Não usar:** SELECT seguido de INSERT

### 5. **Refresh Token Corrompido**
- **Sintoma:** "Invalid Refresh Token: Not Found"
- **Causa:** localStorage/sessionStorage corrompido
- **Solução:** authCleanup.ts com limpeza completa
- **⚠️ Não remover:** Auto-recovery de tokens

---

## 🛠️ COMPONENTES CRÍTICOS - MODIFICAR COM CUIDADO

### Hooks Enterprise (NÃO SIMPLIFICAR)
```typescript
useAuth()        // Estado principal de autenticação
useUserProfile() // Gerenciamento de perfil com cache
useUserSync()    // Sincronização auth ↔ database
```

### Páginas de Fluxo (TESTAR APÓS MUDANÇAS)
```typescript
app/page.tsx                 // Landing + Dashboard + Profile guard
app/auth/callback/page.tsx   // Pós-login + redirecionamento
app/profile/complete/page.tsx // Perfil obrigatório
```

### Segurança (NÃO QUEBRAR)
```typescript
middleware.ts                // Proteção server-side
utils/middlewareUtils.ts     // Exceções para rotas especiais
utils/authCleanup.ts         // Recovery de estado corrompido
```

---

## 🎯 FLUXO OBRIGATÓRIO - NÃO ALTERAR LÓGICA

```
1. Usuário acessa / (Landing)
2. Click "Começar agora" → AuthModal
3. Login success → auth/callback
4. Verificação perfil:
   - Incompleto (!nome || !avatar) → /profile/complete
   - Completo + novo usuário → /welcome
   - Completo + retorno → Dashboard
5. Completar perfil → Dashboard
```

### Verificações Críticas
```typescript
// SEMPRE verificar AMBOS
const isIncomplete = !profile?.nome || !profile?.avatar

// MIDDLEWARE deve permitir
const exceptions = ['/profile/complete'] // OBRIGATÓRIO

// UPSERT atômico
.upsert(data, { onConflict: 'id' }) // NUNCA SELECT+INSERT
```

---

## 🚨 PONTOS DE FALHA - MONITORAR

### 1. **useEffect Dependencies**
```typescript
// ✅ CORRETO
useEffect(() => {
  if (authUser && !state.profile) {
    fetchProfile()
  }
}, [authUser, fetchProfile]) // Dependencies certas

// ❌ ERRO COMUM
}, [authUser, state.profile, state.isLoading, fetchProfile]) // Muito dependente
```

### 2. **Middleware Exceptions**
```typescript
// ✅ MANTER
const exceptions = ['/profile/complete']

// ❌ NUNCA REMOVER
// Profile complete deve ser acessível para usuários com perfil incompleto
```

### 3. **Estado de Loading**
```typescript
// ✅ PERMITIR carregamento inicial
if (authUser && !state.profile) {
  setState(prev => ({ ...prev, isLoading: true }))
}

// ❌ NUNCA bloquear carregamento
if (authUser && !state.profile && !state.isLoading) {
  // NUNCA TRUE se isLoading começa true
}
```

---

## 📋 CHECKLIST OBRIGATÓRIO

### Antes de Modificar Login:
- [ ] Li documentação completa em `docs/LOGIN_SYSTEM_REFACTORING_REPORT.md`
- [ ] Entendo todos os bugs já resolvidos
- [ ] Identifico impacto nos hooks enterprise
- [ ] Verifico se middleware será afetado
- [ ] Confirmo que RLS não será quebrado

### Após Qualquer Mudança:
- [ ] `npm run build` sem erros
- [ ] Teste: Login → Profile check → Redirect
- [ ] Teste: Perfil incompleto → /profile/complete
- [ ] Teste: Perfil completo → Dashboard
- [ ] Teste: Logout e re-login

---

## 🎯 CASOS DE USO VÁLIDOS

### ✅ PODE MODIFICAR:
- UI/UX das páginas (sem alterar lógica)
- Validações adicionais (não substituir)
- Mensagens de texto
- Estilos CSS
- Features que não afetam auth flow

### ❌ NUNCA MODIFICAR:
- Lógica de redirecionamento
- Estados de loading dos hooks
- Operações Supabase existentes
- Middleware routing
- Cache/event systems
- RLS policies

---

## 📚 REFERÊNCIAS OBRIGATÓRIAS

### Documentação Principal:
1. `docs/LOGIN_SYSTEM_REFACTORING_REPORT.md` - **LEITURA OBRIGATÓRIA**
2. `docs/AI_AGENT_LOGIN_SYSTEM_GUIDE.md` - **GUIA RÁPIDO**
3. `.kiro/specs/database-schema/design.md` - **RLS POLICIES**

### Arquivos de Referência:
```
hooks/useAuth.ts           - Estado de autenticação
hooks/useUserProfile.ts    - Perfil com cache
hooks/useUserSync.ts       - Sincronização
utils/middlewareUtils.ts   - Proteção de rotas
utils/authCleanup.ts       - Recovery de erros
```

---

## 🚀 COMANDOS DE EMERGÊNCIA

### Estado Corrompido:
```javascript
// Browser console:
window.clearAuth()
// Depois: F5 (refresh)
```

### Rollback:
```bash
git log --oneline -5
git revert <commit_hash>
```

### Debug Temporário:
```typescript
// SEMPRE remover após debug
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info')
}
```

---

## 💡 PRINCÍPIOS FUNDAMENTAIS

### 1. **Preserve a Arquitetura**
"Este sistema foi projetado para milhões de usuários. Não simplifique."

### 2. **Teste Sempre**
"Uma mudança pequena pode quebrar todo o fluxo de login."

### 3. **Documente Tudo**
"Problemas futuros podem ser evitados com boa documentação."

### 4. **Quando em Dúvida, NÃO Altere**
"Consulte a documentação antes de qualquer modificação."

---

**🔒 SISTEMA CRÍTICO - ALTERAÇÕES REQUEREM EXTREMO CUIDADO**

**📅 Última atualização:** 2025-01-09  
**🎯 Status:** ✅ Funcional e Testado  
**⚠️ Próxima revisão:** Quando houver mudanças no auth flow
