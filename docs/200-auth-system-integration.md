# Integração do Sistema de Autenticação Enterprise-Grade

## Visão Geral

O sistema de autenticação enterprise-grade foi implementado com os seguintes hooks refatorados:

- `useAuth` - Gerenciamento robusto de estado de autenticação
- `useUserProfile` - Sincronização automática de perfil
- `useUserSync` - Sincronização entre auth.users e usuarios
- `useProfileGuard` - Coordenação inteligente de guards
- `useAuthHealthCheck` - Monitoramento de saúde do sistema
- `useAuthSystem` - Hook agregador que coordena todos os outros

## Como Usar

### 1. Configuração no Layout Principal

```tsx
// app/layout.tsx
import { AuthSystemProvider } from '@/components/AuthSystemProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthSystemProvider 
          options={{
            auth: {
              enableCache: true,
              cacheTimeout: 5 * 60 * 1000, // 5 minutos
              retryAttempts: 3,
              enableLogging: true
            },
            profileGuard: {
              requiredFields: ['nome'],
              redirectTo: '/profile/complete',
              allowIncomplete: false
            },
            enableHealthCheck: true,
            enableLoopProtection: true
          }}
          enableDebugPanel={process.env.NODE_ENV === 'development'}
        >
          {children}
        </AuthSystemProvider>
      </body>
    </html>
  )
}
```

### 2. Uso em Componentes

#### Uso Simples (Recomendado para a maioria dos casos)

```tsx
// components/Header.tsx
import { useSimpleAuth } from '@/components/AuthSystemProvider'

export function Header() {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    isLoading, 
    signOut 
  } = useSimpleAuth()

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (!isAuthenticated) {
    return <LoginButton />
  }

  return (
    <div className="flex items-center gap-4">
      <span>Olá, {profile?.nome || user?.email}</span>
      <button onClick={signOut}>Sair</button>
    </div>
  )
}
```

#### Uso Avançado (Para casos que precisam de controle total)

```tsx
// components/ProfileManager.tsx
import { useAuthSystemContext } from '@/components/AuthSystemProvider'

export function ProfileManager() {
  const { authSystem } = useAuthSystemContext()
  
  const {
    profile,
    sync,
    healthCheck,
    updateProfile,
    getDiagnostics
  } = authSystem

  const handleUpdateProfile = async (data: any) => {
    const result = await updateProfile(data)
    
    if (!result.success) {
      console.error('Erro ao atualizar perfil:', result.error)
    }
  }

  return (
    <div>
      <h2>Gerenciar Perfil</h2>
      
      {/* Status de sincronização */}
      <div className="mb-4">
        <span className={`badge ${sync.isConsistent ? 'badge-success' : 'badge-warning'}`}>
          {sync.isConsistent ? 'Sincronizado' : 'Sincronizando...'}
        </span>
      </div>

      {/* Saúde do sistema */}
      {healthCheck && (
        <div className="mb-4">
          <span className={`badge badge-${healthCheck.isHealthy ? 'success' : 'error'}`}>
            Sistema: {healthCheck.result?.status}
          </span>
        </div>
      )}

      {/* Formulário de perfil */}
      <ProfileForm 
        profile={profile.profile}
        onSubmit={handleUpdateProfile}
        isLoading={profile.isLoading}
      />

      {/* Debug (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <button onClick={() => console.log(getDiagnostics())}>
          Log Diagnostics
        </button>
      )}
    </div>
  )
}
```

### 3. Uso Individual dos Hooks (Casos Especiais)

```tsx
// Para casos que precisam de apenas um hook específico
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useAuthHealthCheck } from '@/hooks/useAuthHealthCheck'

export function SpecialComponent() {
  // Usar hooks individuais quando necessário
  const auth = useAuth({ enableLogging: false })
  const profile = useUserProfile({ autoSync: false })
  const health = useAuthHealthCheck({ healthCheckInterval: 60000 })

  // Lógica específica...
}
```

## Funcionalidades Principais

### 1. Cache Inteligente
- Cache automático de sessões e perfis
- TTL configurável
- Invalidação automática
- Estatísticas de cache

### 2. Sincronização Robusta
- Sincronização automática entre auth.users e usuarios
- Retry automático com backoff exponencial
- Detecção e correção de inconsistências
- Recuperação automática de dados corrompidos

### 3. Proteção Contra Loops
- Detecção automática de loops de redirecionamento
- Quebra automática com fallback seguro
- Coordenação entre múltiplos guards
- Logging detalhado para debug

### 4. Monitoramento de Saúde
- Health checks automáticos
- Métricas de performance
- Detecção de problemas
- Alertas e notificações

### 5. Tratamento de Erros
- Error boundaries específicos
- Retry automático
- Fallbacks seguros
- Logging estruturado

## Configurações Avançadas

### Opções do Sistema de Auth

```tsx
const authOptions = {
  autoSync: true,              // Sincronização automática
  enableCache: true,           // Cache inteligente
  cacheTimeout: 300000,        // 5 minutos
  retryAttempts: 3,           // Tentativas de retry
  retryDelay: 1000,           // Delay entre tentativas
  enableLogging: true,         // Logging detalhado
  healthCheckInterval: 30000   // Health check a cada 30s
}
```

### Opções do Profile Guard

```tsx
const guardOptions = {
  requiredFields: ['nome', 'email'],  // Campos obrigatórios
  redirectTo: '/profile/complete',    // Página de completar perfil
  allowIncomplete: false,             // Permitir perfil incompleto
  enableLogging: true                 // Logging de decisões
}
```

## Debugging e Monitoramento

### 1. Painel de Debug (Desenvolvimento)
- Ativado automaticamente em desenvolvimento
- Mostra estado em tempo real
- Métricas e estatísticas
- Ações de debug (restart, logs)

### 2. Logs Estruturados
```tsx
// Todos os hooks geram logs estruturados
console.log('🔐 Auth State Change:', { event, user, timestamp })
console.log('💾 Profile: Dados armazenados em cache')
console.log('🛡️ ProfileGuard: REDIRECT', { reason, redirectTo })
console.log('🏥 Health Check: healthy', { responseTime, checks })
```

### 3. Diagnósticos Completos
```tsx
const diagnostics = authSystem.getDiagnostics()
console.log('Sistema:', diagnostics.system)
console.log('Métricas:', diagnostics.metrics)
console.log('Hooks:', diagnostics.hooks)
console.log('Cache:', diagnostics.cache)
console.log('Eventos:', diagnostics.events)
```

## Migração do Sistema Atual

### 1. Substituir useAuth existente
```tsx
// Antes
import { useAuth } from '@/hooks/useAuth'

// Depois
import { useSimpleAuth } from '@/components/AuthSystemProvider'
// ou
import { useAuthSystemContext } from '@/components/AuthSystemProvider'
```

### 2. Remover guards manuais
```tsx
// Antes - guards manuais em cada página
const { user } = useAuth()
if (!user) router.push('/login')

// Depois - automático via middleware + ProfileGuard
// Não precisa de código manual
```

### 3. Simplificar gerenciamento de perfil
```tsx
// Antes - lógica manual de sincronização
const syncProfile = async () => {
  // código complexo de sincronização
}

// Depois - automático
const { profile, updateProfile } = useSimpleAuth()
// Sincronização automática em background
```

## Benefícios

1. **Robustez**: Sistema resistente a falhas com retry automático
2. **Performance**: Cache inteligente reduz chamadas desnecessárias
3. **Segurança**: Proteção contra loops e estados inconsistentes
4. **Observabilidade**: Monitoramento completo e debugging avançado
5. **Manutenibilidade**: Código centralizado e bem estruturado
6. **Experiência do Usuário**: Fluxos suaves sem travamentos

## Próximos Passos

1. Integrar o AuthSystemProvider no layout principal
2. Migrar componentes existentes para useSimpleAuth
3. Configurar opções específicas do projeto
4. Testar em diferentes cenários
5. Monitorar métricas em produção