# Middleware de Autenticação - Documentação

## Visão Geral

O middleware de autenticação do Reuni implementa verificação server-side de sessões usando Supabase SSR, fornecendo proteção automática de rotas e redirecionamento inteligente baseado no estado de autenticação do usuário.

## Funcionalidades Principais

### 1. Verificação de Sessão Server-Side
- Utiliza `@supabase/ssr` para verificação segura de tokens JWT
- Gerenciamento automático de cookies de sessão
- Fallback seguro em caso de erros

### 2. Proteção Automática de Rotas
- Identificação automática de rotas protegidas
- Redirecionamento para login preservando URL de destino
- Prevenção de acesso não autorizado

### 3. Redirecionamento Inteligente
- Preserva URL de destino após login
- Redireciona usuários autenticados das páginas de login
- Validação de segurança contra URLs maliciosas

### 4. Tratamento Robusto de Erros
- Logging estruturado para debug
- Fallback seguro que não quebra a aplicação
- Monitoramento de erros em produção

## Configuração de Rotas

### Rotas Protegidas
Requerem autenticação para acesso:
- `/dashboard/*` - Painel administrativo
- `/profile/*` - Perfil do usuário
- `/events/create/*` - Criação de eventos
- `/communities/create/*` - Criação de comunidades
- `/settings/*` - Configurações do usuário

### Rotas de Autenticação
Redirecionam usuários autenticados:
- `/login` - Página de login
- `/signup` - Página de cadastro
- `/auth/callback` - Callback de autenticação (exceção)

### Rotas Públicas
Acessíveis sem autenticação:
- `/` - Página inicial
- `/events/*` - Listagem e visualização de eventos
- `/communities/*` - Listagem e visualização de comunidades
- `/search/*` - Busca
- `/welcome` - Página de boas-vindas

## Fluxos de Usuário

### Usuário Não Autenticado

1. **Acesso a Rota Pública**: ✅ Permitido
2. **Acesso a Rota Protegida**: 
   - ❌ Bloqueado
   - 🔄 Redirecionado para `/login?redirectedFrom=<rota-original>`
3. **Acesso a Rota de Auth**: ✅ Permitido

### Usuário Autenticado

1. **Acesso a Rota Pública**: ✅ Permitido
2. **Acesso a Rota Protegida**: ✅ Permitido
3. **Acesso a Login/Signup**: 
   - ❌ Bloqueado
   - 🔄 Redirecionado para URL preservada ou `/`
4. **Acesso a Callback**: ✅ Permitido (sempre)

## Segurança

### Validação de URLs de Redirecionamento
- ✅ URLs internas (`/dashboard`, `/profile/edit`)
- ❌ URLs externas (`https://malicious.com`)
- ❌ URLs com dupla barra (`//malicious.com`)
- ✅ URLs com query params (`/events/create?type=public`)

### Prevenção de Loops
- Detecção de parâmetros RSC (`_rsc`)
- Logging de ações para monitoramento
- Fallback seguro em caso de erro

## Configuração

### Variáveis de Ambiente Necessárias
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### Matcher do Middleware
```javascript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*', 
    '/events/create/:path*',
    '/communities/create/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
    '/auth/callback',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}
```

## Logging e Monitoramento

### Estrutura de Log
```typescript
interface MiddlewareLogData {
  method: string
  pathname: string
  hasSession: boolean
  userId?: string
  action: 'allow' | 'redirect' | 'error'
  redirectTo?: string
  error?: string
}
```

### Exemplo de Log
```
[Middleware 2024-01-15T10:30:00.000Z] {
  method: 'GET',
  path: '/dashboard',
  session: 'user:abc123',
  action: 'allow'
}
```

## Testes

### Executar Testes
```bash
# Testes unitários dos utilitários
npm test -- __tests__/utils/middlewareUtils.test.ts

# Testes de integração
npm test -- __tests__/middleware.integration.test.ts

# Teste manual do comportamento
node scripts/test-middleware.js
```

### Cobertura de Testes
- ✅ Identificação de rotas protegidas/públicas/auth
- ✅ Processamento seguro de URLs de redirecionamento
- ✅ Cenários de fluxo completo de usuário
- ✅ Logging estruturado
- ✅ Tratamento de erros

## Troubleshooting

### Problemas Comuns

1. **Loops de Redirecionamento**
   - Verificar se as rotas estão corretamente categorizadas
   - Checar se o callback `/auth/callback` está funcionando

2. **Sessão Não Reconhecida**
   - Verificar variáveis de ambiente
   - Confirmar configuração do Supabase
   - Checar cookies no navegador

3. **Erros de CORS**
   - Verificar configuração do domínio no Supabase
   - Confirmar URLs permitidas

### Debug

1. **Ativar Logs de Debug**
   ```env
   NODE_ENV=development
   ```

2. **Verificar Configuração**
   ```bash
   node scripts/test-middleware.js
   ```

3. **Testar Rotas Específicas**
   - Usar DevTools do navegador
   - Verificar Network tab para redirecionamentos
   - Checar cookies de sessão

## Próximos Passos

1. **Integração com Monitoramento**
   - Sentry para erros em produção
   - Analytics de autenticação

2. **Otimizações de Performance**
   - Cache de verificação de sessão
   - Otimização de queries do Supabase

3. **Funcionalidades Avançadas**
   - Rate limiting
   - Detecção de dispositivos suspeitos
   - Logs de auditoria

## Referências

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Supabase Auth](https://supabase.com/docs/guides/auth)