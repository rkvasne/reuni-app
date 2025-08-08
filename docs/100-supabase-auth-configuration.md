# Configuração de Autenticação do Supabase

## URLs de Redirecionamento

Para que o callback de autenticação funcione corretamente, configure as seguintes URLs no dashboard do Supabase:

### Desenvolvimento Local
```
http://localhost:3000/auth/callback
```

### Produção
```
https://seu-dominio.com/auth/callback
```

## Configuração no Dashboard do Supabase

### 1. Site URL
1. Acesse o dashboard do Supabase
2. Vá para **Authentication** > **Settings**
3. Na seção **Site URL**, configure:
   - **Desenvolvimento**: `http://localhost:3000`
   - **Produção**: `https://seu-dominio.com`

### 2. Redirect URLs
Na seção **Redirect URLs**, adicione todas as URLs necessárias:

**Para Desenvolvimento:**
```
http://localhost:3000/auth/callback
http://localhost:3000/welcome
http://localhost:3000/
```

**Para Produção:**
```
https://seu-dominio.com/auth/callback
https://seu-dominio.com/welcome
https://seu-dominio.com/
```

### 3. Configurações Adicionais
- **Enable email confirmations**: ✅ Habilitado
- **Enable secure email change**: ✅ Habilitado
- **Double confirm email changes**: ✅ Habilitado

## Configuração do Google OAuth

### 1. Configurar no Google Cloud Console

1. **Criar/Selecionar Projeto**
   - Acesse [Google Cloud Console](https://console.cloud.google.com)
   - Crie um novo projeto ou selecione um existente
   - Ative a API "Google Identity" ou "Google+ API"

2. **Configurar OAuth 2.0**
   - Vá em "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
   - Tipo de aplicação: "Web application"
   - Nome: "Reuni App"
   - **Authorized redirect URIs**:
     ```
     https://seu-projeto.supabase.co/auth/v1/callback
     ```

3. **Obter Credenciais**
   - Copie o "Client ID" e "Client Secret" gerados

### 2. Configurar no Supabase Dashboard

1. **Habilitar Provider**
   - Vá em "Authentication" > "Providers"
   - Encontre "Google" e clique para habilitar
   - Cole o "Client ID" e "Client Secret" do Google
   - Salve as configurações

2. **Configurar Scopes (Opcional)**
   - Scopes padrão: `openid email profile`
   - Para informações adicionais, adicione scopes específicos

### 3. Implementação no Frontend

O sistema já possui implementação completa:

```typescript
// Hook useAuth já implementado
const { signInWithGoogle } = useAuth()

// Componente AuthModal já implementado
<button onClick={handleGoogleSignIn}>
  Continuar com Google
</button>
```

### 4. Fluxo de Redirecionamento
O sistema implementa a seguinte lógica de redirecionamento:

1. **Usuário clica no link de confirmação** → `/auth/callback`
2. **Sistema verifica se é usuário novo**:
   - **Novo usuário** → `/welcome` (página de boas-vindas)
   - **Usuário existente** → `/` (página principal)
3. **Em caso de erro** → Exibe mensagem de erro com opções de recuperação

## Configuração de Email Templates

### Template de Confirmação de Email

1. Vá para **Authentication** > **Email Templates**
2. Selecione **Confirm signup**
3. Configure o template personalizado:

**Subject**: `Bem-vindo ao Reuni - Confirme seu acesso`

**Body (HTML)**:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
      Bem-vindo ao Reuni! 🎉
    </h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 40px; background: white;">
    <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">
      Confirme seu acesso
    </h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
      Você está a um clique de descobrir eventos incríveis na sua região! 
      O Reuni conecta pessoas através de experiências únicas e memoráveis.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold; 
                display: inline-block;
                font-size: 16px;">
        Confirmar Meu Acesso
      </a>
    </div>
    
    <div style="background-color: #f1f5f9; border-left: 4px solid #9B59B6; padding: 20px; margin: 30px 0;">
      <p style="margin: 0; color: #475569; font-size: 14px;">
        <strong>Próximos passos:</strong><br>
        • Clique no botão acima para confirmar sua conta<br>
        • Explore eventos incríveis na sua região<br>
        • Conecte-se com pessoas que compartilham seus interesses
      </p>
    </div>
    
    <p style="color: #999; font-size: 14px; text-align: center; margin-top: 40px;">
      Este link expira em 24 horas por segurança.<br>
      Se você não se cadastrou no Reuni, pode ignorar este email.
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">
      © 2024 Reuni - Conectando pessoas através de eventos
    </p>
  </div>
</div>
```

## Configurações de Segurança

### Tempo de Expiração do Token
- **Access Token Lifetime**: 3600 segundos (1 hora)
- **Refresh Token Lifetime**: 604800 segundos (7 dias)

### Configurações de Email
- **Enable email confirmations**: ✅ Habilitado
- **Enable email change confirmations**: ✅ Habilitado
- **Secure email change**: ✅ Habilitado

## Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no seu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

## Testando a Configuração

1. Faça um cadastro com um email válido
2. Verifique se o email de confirmação foi recebido
3. Clique no link de confirmação
4. Verifique se foi redirecionado para `/welcome` (novos usuários) ou `/` (usuários existentes)
5. Teste cenários de erro (link expirado, link inválido)

## Troubleshooting

### Email não recebido
- Verifique a pasta de spam
- Confirme se o SMTP está configurado corretamente
- Verifique os logs do Supabase
- Teste com diferentes provedores de email

### Erro de redirecionamento
- Confirme se as URLs de redirecionamento estão configuradas
- Verifique se a Site URL está correta
- Confirme se não há caracteres especiais nas URLs
- Teste em modo incógnito para evitar cache

### Link expirado ou inválido
- Links de confirmação expiram em 24 horas por padrão
- Usuário deve solicitar novo email de confirmação
- Verifique se o timestamp do token não foi alterado
- Confirme se o link não foi usado anteriormente

### Problemas com detecção de usuário novo
- Limpe o localStorage se necessário: `localStorage.clear()`
- Verifique se a tabela `usuarios` está acessível
- Confirme se as políticas RLS estão configuradas corretamente
- Teste com usuários em diferentes cenários (novo vs existente)

### Página de boas-vindas não aparece
- Verifique se a rota `/welcome` está configurada
- Confirme se o componente `WelcomePage` existe
- Teste a lógica de detecção de usuário novo
- Verifique os logs do console para erros JavaScript

### Erros de autenticação específicos
- **`invalid_token`**: Token malformado ou corrompido
- **`token_expired`**: Link usado após expiração
- **`email_not_confirmed`**: Email ainda não foi confirmado
- **`bad_jwt`**: Problema na estrutura do JWT
- **`network_error`**: Problemas de conectividade

### Comandos úteis para debug
```javascript
// Verificar estado de onboarding no console
import { getOnboardingStats } from '@/utils/onboardingUtils'
console.log(getOnboardingStats())

// Limpar dados de onboarding
import { cleanupExpiredOnboardingData } from '@/utils/onboardingUtils'
cleanupExpiredOnboardingData()

// Verificar sessão atual
const { data } = await supabase.auth.getSession()
console.log(data)
```