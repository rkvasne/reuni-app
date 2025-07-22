# Design Document

## Overview

Este design aborda a melhoria da experiência de cadastro por email no Reuni através de três componentes principais: personalização de emails do Supabase, feedback visual aprimorado na interface, e uma página de boas-vindas para novos usuários. A solução foca em criar uma experiência profissional e acolhedora desde o primeiro contato.

## Architecture

### Email Customization Strategy
- **Supabase Email Templates**: Personalização através do dashboard do Supabase
- **Custom SMTP (Opcional)**: Para controle total sobre emails
- **Fallback Strategy**: Manter funcionalidade mesmo com configuração básica

### Frontend Components
- **Enhanced AuthModal**: Feedback visual melhorado
- **Welcome Page**: Nova página para usuários confirmados
- **Resend Email Component**: Funcionalidade de reenvio

### State Management
- **Email Status Tracking**: Estados de envio, sucesso, erro
- **User Onboarding Flow**: Controle do fluxo de boas-vindas
- **Rate Limiting**: Controle de reenvios de email

## Components and Interfaces

### 1. Email Template Configuration

**Supabase Email Templates:**
```html
<!-- Template personalizado para confirmação -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao Reuni! 🎉</h1>
  </div>
  
  <div style="padding: 40px; background: white;">
    <h2 style="color: #333; margin-bottom: 20px;">Confirme seu acesso</h2>
    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
      Você está a um clique de descobrir eventos incríveis na sua região! 
      O Reuni conecta pessoas através de experiências únicas.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 15px 30px; text-decoration: none; 
                border-radius: 8px; font-weight: bold; display: inline-block;">
        Confirmar Meu Acesso
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; text-align: center;">
      Este link expira em 24 horas por segurança.
    </p>
  </div>
</div>
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