# 📧 Guia de Configuração de Email Templates do Supabase

Este guia te ajudará a personalizar os emails de confirmação do Reuni para criar uma experiência mais profissional e acolhedora para novos usuários.

## 🎯 Objetivo

Substituir os emails genéricos do Supabase por templates personalizados com:
- Branding do Reuni
- Mensagens explicativas sobre a plataforma
- Design profissional e atrativo
- Call-to-action claro

## 🔧 Configuração no Dashboard do Supabase

### 1. Acessar as Configurações de Email

1. Faça login no [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto Reuni
3. Vá para **Authentication** > **Email Templates**

### 2. Configurar Template de Confirmação

Selecione **"Confirm signup"** e substitua o template padrão pelo código abaixo:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  
  <!-- Header com Branding -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">
      Bem-vindo ao Reuni! 🎉
    </h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
      Conectando pessoas através de eventos incríveis
    </p>
  </div>
  
  <!-- Conteúdo Principal -->
  <div style="padding: 40px 30px; background: white;">
    <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px; font-weight: 600;">
      Confirme seu acesso
    </h2>
    
    <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px; font-size: 16px;">
      Olá! Você está a apenas um clique de descobrir eventos incríveis na sua região. 
      O Reuni é uma plataforma que conecta pessoas através de experiências únicas e memoráveis.
    </p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
        O que você pode fazer no Reuni:
      </h3>
      <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>🔍 Descobrir eventos que combinam com seus interesses</li>
        <li>👥 Conhecer pessoas com hobbies similares</li>
        <li>📅 Organizar seus próprios eventos</li>
        <li>🌟 Construir uma rede social local</li>
      </ul>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600; 
                font-size: 16px;
                display: inline-block;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
        ✨ Confirmar Meu Acesso
      </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
        Este link expira em 24 horas por segurança.<br>
        Se você não se cadastrou no Reuni, pode ignorar este email.
      </p>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      © 2024 Reuni - Conectando pessoas através de eventos
    </p>
  </div>
  
</div>
```

### 3. Configurar Assunto do Email

No campo **"Subject"**, substitua por:
```
Bem-vindo ao Reuni - Confirme seu acesso 🎉
```

### 4. Salvar as Configurações

Clique em **"Save"** para aplicar o novo template.

## 🎨 Personalização Adicional

### Cores do Reuni
O template usa as cores oficiais do Reuni:
- **Primary**: `#667eea` (azul)
- **Secondary**: `#764ba2` (roxo)
- **Gradiente**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Modificações Opcionais

1. **Logo**: Substitua o emoji 🎉 por uma imagem do logo:
```html
<img src="https://seu-dominio.com/logo-reuni.png" alt="Reuni" style="height: 40px;">
```

2. **Cores personalizadas**: Ajuste as cores no gradiente conforme sua identidade visual

3. **Conteúdo**: Personalize as mensagens conforme necessário

## 🔧 Configuração SMTP Personalizada (Opcional)

Para ter controle total sobre os emails, você pode configurar um provedor SMTP:

### 1. Provedores Recomendados
- **SendGrid** (gratuito até 100 emails/dia)
- **Mailgun** (gratuito até 5.000 emails/mês)
- **Amazon SES** (muito barato)

### 2. Configuração no Supabase

1. Vá para **Settings** > **Authentication**
2. Role até **SMTP Settings**
3. Ative **"Enable custom SMTP"**
4. Configure com as credenciais do seu provedor

### 3. Exemplo de Configuração (SendGrid)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [sua-api-key-do-sendgrid]
SMTP Admin Email: noreply@reuni.com
```

## ✅ Teste da Configuração

1. Faça um teste de cadastro com um email real
2. Verifique se o email chegou com o novo design
3. Teste o link de confirmação
4. Confirme se o redirecionamento para `/welcome` funciona

## 🚨 Troubleshooting

### Email não chegou
- Verifique a pasta de spam
- Confirme se o SMTP está configurado corretamente
- Teste com diferentes provedores de email

### Template não aplicou
- Limpe o cache do navegador
- Aguarde alguns minutos para propagação
- Verifique se salvou corretamente no dashboard

### Link não funciona
- Confirme se a URL de redirecionamento está correta
- Verifique se o callback `/auth/callback` está funcionando

## 📋 Checklist de Implementação

- [ ] Template de confirmação personalizado aplicado
- [ ] Assunto do email personalizado
- [ ] Teste de envio realizado
- [ ] Link de confirmação funcionando
- [ ] Redirecionamento para página de boas-vindas
- [ ] Design responsivo em diferentes clientes de email
- [ ] Teste em diferentes provedores (Gmail, Outlook, etc.)

## 🎯 Próximos Passos

Após configurar os templates de email:

1. **Monitore métricas**: Taxa de abertura e cliques
2. **Colete feedback**: Pergunte aos usuários sobre a experiência
3. **Otimize**: Ajuste o conteúdo baseado nos resultados
4. **Expanda**: Configure templates para outros tipos de email (recuperação de senha, etc.)

---

**💡 Dica**: Mantenha o template simples e focado na ação principal (confirmar email). Emails muito complexos podem não renderizar bem em todos os clientes de email.