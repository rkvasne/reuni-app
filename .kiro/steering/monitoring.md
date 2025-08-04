---
inclusion: manual
---

# Monitoramento e Analytics

## Ferramentas Recomendadas

### 1. **Sentry** (Error Tracking)
```bash
npm install @sentry/nextjs
```

Configuração em `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 2. **Vercel Analytics**
```bash
npm install @vercel/analytics
```

### 3. **Google Analytics 4**
```bash
npm install gtag
```

### 4. **Performance Monitoring**
- Core Web Vitals tracking
- Bundle size monitoring
- API response time tracking
- Database query performance

## Métricas Importantes

### Performance
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

### Business
- Taxa de conversão de cadastro
- Tempo de permanência
- Eventos mais visualizados
- Comunidades mais ativas

### Técnicas
- Taxa de erro
- Tempo de resposta da API
- Uso de recursos do servidor
- Cache hit rate

## Alertas Configurados
- Erro rate > 5%
- Response time > 2s
- Build failures
- Dependency vulnerabilities