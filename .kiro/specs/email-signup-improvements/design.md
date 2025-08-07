# Design Document

## Overview

Este design implementa uma arquitetura de autenticação enterprise-grade para o Reuni, baseada nas melhores práticas observadas no sistema SIGA. A solução aborda problemas fundamentais através de cinco pilares: middleware de autenticação server-side, sincronização robusta de dados, callback confiável, políticas de segurança adequadas, e tratamento robusto de erros. O objetivo é criar um sistema que seja seguro, confiável e ofereça uma experiência de usuário consistente.

## Architecture

### Core Authentication Layer
- **Middleware de Autenticação**: Verificação server-side em todas as rotas protegidas
- **Session Management**: Gerenciamento seguro de tokens JWT via cookies
- **Route Protection**: Proteção automática baseada em configuração de rotas
- **Fallback Strategy**: Comportamento seguro em caso de falhas

### Data Synchronization Layer  
- **Dual-Table Strategy**: Sincronização entre auth.users e usuarios
- **Automatic Profile Creation**: Criação automática de perfis com retry
- **Consistency Checks**: Verificação e correção de inconsistências
- **Transaction Safety**: Operações atômicas para integridade de dados

### Security Layer
- **Row Level Security**: Políticas RLS robustas e testadas
- **Access Control**: Controle granular de permissões por usuário
- **Error Isolation**: Isolamento de erros sem exposição de dados sensíveis
- **Audit Trail**: Logging detalhado para monitoramento e debug

### User Experience Layer
- **Smart Routing**: Redirecionamento inteligente baseado no estado do usuário
- **Loop Prevention**: Detecção e prevenção de loops de redirecionamento
- **Progressive Enhancement**: Funcionalidade básica garantida mesmo com falhas
- **Graceful Degradation**: Fallbacks que mantêm a aplicação funcional

## Components and Interfaces

### 1. Authentication Middleware

**Middleware Configuration:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Prevent RSC loops
  if (request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Protected routes logic
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/profile') ||
                           request.nextUrl.pathname.startsWith('/events/create')
    
    const isAuthRoute = request.nextUrl.pathname === '/login' ||
                       request.nextUrl.pathname === '/signup'
    
    // Redirect unauthenticated users from protected routes
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Redirect authenticated users from auth routes
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return response
    
  } catch (error) {
    console.error('Middleware error:', error)
    // In case of error, allow access to prevent breaking the app
    return response
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*', 
    '/events/create/:path*',
    '/login',
    '/signup'
  ]
}
```

### 2. Enhanced AuthModal Component

**New States:**
```typescript
interface AuthModalState {
  emailSent: boolean
  canResend: boolean
  resendCooldown: number
  showSuccessMessage: boolean
}
```

**Success Message Component:**
```typescript
const EmailSentSuccess = ({ email, onResend, canResend, cooldown }) => (
  <div className="text-center space-y-4">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
      <Mail className="w-8 h-8 text-green-600" />
    </div>
    
    <h3 className="text-xl font-semibold text-neutral-800">
      Email enviado com sucesso! 📧
    </h3>
    
    <div className="space-y-2 text-neutral-600">
      <p>Enviamos um link de acesso para:</p>
      <p className="font-medium text-primary-600">{email}</p>
    </div>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
      <p className="font-medium mb-2">Próximos passos:</p>
      <ul className="text-left space-y-1">
        <li>• Verifique sua caixa de entrada</li>
        <li>• Não esqueça de olhar o spam/lixo eletrônico</li>
        <li>• Clique no link para acessar o Reuni</li>
      </ul>
    </div>
    
    {canResend ? (
      <button onClick={onResend} className="text-primary-600 hover:text-primary-700">
        Não recebeu? Reenviar email
      </button>
    ) : (
      <p className="text-sm text-neutral-500">
        Reenviar disponível em {cooldown}s
      </p>
    )}
  </div>
)
```

### 3. Welcome Page Component

**Route:** `/welcome`

```typescript
const WelcomePage = () => {
  const { user } = useAuth()
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🎉</span>
            </div>
            
            <h1 className="text-4xl font-bold text-neutral-800 mb-4">
              Bem-vindo ao Reuni, {user?.email?.split('@')[0]}!
            </h1>
            
            <p className="text-xl text-neutral-600 leading-relaxed">
              Você agora faz parte de uma comunidade que conecta pessoas 
              através de eventos incríveis. Vamos começar sua jornada!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <FeatureCard 
              icon="🔍"
              title="Descubra Eventos"
              description="Encontre eventos que combinam com seus interesses"
            />
            <FeatureCard 
              icon="👥"
              title="Conecte-se"
              description="Conheça pessoas com interesses similares"
            />
            <FeatureCard 
              icon="📅"
              title="Organize"
              description="Crie seus próprios eventos e construa comunidade"
            />
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="btn-primary text-lg px-8 py-4"
          >
            Explorar Eventos
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 4. Resend Email Functionality

**Hook Enhancement:**
```typescript
const useEmailResend = () => {
  const [canResend, setCanResend] = useState(true)
  const [cooldown, setCooldown] = useState(0)
  
  const resendEmail = async (email: string) => {
    if (!canResend) return
    
    setCanResend(false)
    setCooldown(60) // 60 seconds cooldown
    
    // Start countdown
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Resend logic
    return await signUpWithEmail(email)
  }
  
  return { resendEmail, canResend, cooldown }
}
```

## Data Models

### Email Status Tracking
```typescript
interface EmailStatus {
  email: string
  sentAt: Date
  status: 'pending' | 'sent' | 'confirmed' | 'failed'
  resendCount: number
  lastResendAt?: Date
}
```

### User Onboarding State
```typescript
interface OnboardingState {
  hasSeenWelcome: boolean
  completedSteps: string[]
  currentStep: 'email-confirmation' | 'welcome' | 'completed'
}
```

## Error Handling

### Email Sending Errors
- **Network Issues**: Retry mechanism with exponential backoff
- **Rate Limiting**: Clear messaging about cooldown periods
- **Invalid Email**: Validation before sending
- **Supabase Errors**: Graceful fallback with user-friendly messages

### User Experience Errors
- **Email Not Received**: Clear instructions and resend option
- **Link Expired**: Redirect to resend page with explanation
- **Already Confirmed**: Redirect to login with success message

## Testing Strategy

### Unit Tests
- Email validation functions
- Resend cooldown logic
- State management for email flow
- Component rendering with different states

### Integration Tests
- Complete signup flow from email to confirmation
- Resend email functionality
- Welcome page navigation
- Error scenarios and recovery

### User Acceptance Tests
- Email delivery and formatting
- Mobile responsiveness of email templates
- Cross-browser compatibility
- Accessibility compliance

### Email Testing
- Template rendering across email clients
- Link functionality and expiration
- Spam filter compatibility
- Mobile email client display