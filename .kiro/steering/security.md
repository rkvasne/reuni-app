---
inclusion: always
---

# Padrões de Segurança

## Headers de Segurança
Configure em `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## Validação de Dados
- Use Zod para validação de schemas
- Sanitize inputs do usuário
- Valide uploads de arquivos
- Implemente rate limiting

## Autenticação e Autorização
- Use JWT tokens seguros
- Implemente refresh tokens
- Configure RLS no Supabase adequadamente
- Use HTTPS em produção

## Variáveis de Ambiente
- Nunca commite secrets
- Use `.env.local` para desenvolvimento
- Configure secrets no Vercel/deploy
- Rotacione chaves regularmente

## Dependências
- Audit regularmente com `npm audit`
- Use Dependabot para updates automáticos
- Monitore vulnerabilidades conhecidas
- Mantenha dependências atualizadas

## OWASP Top 10
- Injection attacks
- Broken authentication
- Sensitive data exposure
- XML external entities
- Broken access control
- Security misconfiguration
- Cross-site scripting
- Insecure deserialization
- Known vulnerabilities
- Insufficient logging