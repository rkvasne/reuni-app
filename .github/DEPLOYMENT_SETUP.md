# 🚀 CI/CD Setup Guide - Reuni App

Este guia explica como configurar o sistema de CI/CD completo para o Reuni App no GitHub Actions + Vercel.

## 🎯 Visão Geral

O sistema inclui:
- ✅ **CI/CD Principal**: Build, test, deploy automático
- 🔒 **Testes RLS**: Validação de segurança do banco
- 🕷️ **Scraping Automatizado**: Coleta diária de eventos
- 📊 **Monitoramento**: Health checks e métricas

## 🔧 Configuração Obrigatória

### 1. 🔐 GitHub Secrets

Configure os seguintes secrets no GitHub (`Settings > Secrets and variables > Actions`):

#### Supabase (Obrigatório)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

#### Vercel (Para Deploy Automático)
```bash
VERCEL_TOKEN=seu_token_vercel
VERCEL_ORG_ID=seu_org_id_vercel  
VERCEL_PROJECT_ID=seu_project_id_vercel
```

### 2. 📋 Como Obter as Credenciais

#### Supabase:
1. Vá ao [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. `Settings > API`
4. Copie:
   - **URL**: Project URL
   - **anon key**: anon (public)  
   - **service_role key**: service_role (secret) ⚠️

#### Vercel:
1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel login`
3. Execute: `vercel --cwd . --confirm`
4. Para obter IDs: `vercel env ls`
5. Token: [Vercel Dashboard](https://vercel.com/account/tokens)

### 3. 🎛️ Configuração do Vercel

No painel do Vercel, configure as mesmas variáveis de ambiente:

```bash
# Environment Variables (Vercel Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 🔄 Workflows Configurados

### 1. 🚀 CI/CD Principal (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push para `main` ou `develop`  
- Pull Requests
- Manual dispatch

**Jobs:**
1. **Quality Checks**: ESLint + TypeScript
2. **Build & Test**: Next.js build + testes unitários
3. **Security Audit**: NPM audit
4. **Deploy Preview**: PRs → Preview Vercel
5. **Deploy Production**: main → Production Vercel  
6. **Health Check**: Verificação pós-deploy

### 2. 🔒 Testes RLS (`.github/workflows/rls-tests.yml`)

**Triggers:**
- Diariamente às 3h UTC
- Manual dispatch
- Push em migrações

**Funcionalidades:**
- Testes de políticas Row Level Security
- Validação de segurança  
- Edge cases e performance
- Relatórios detalhados

### 3. 🕷️ Scraping System (`.github/workflows/scraping.yml`)

**Triggers:**
- Diariamente às 6h UTC (3h Brasil)
- Manual dispatch

**Funcionalidades:**
- Scraping automatizado Eventbrite + Sympla
- 40+ cidades cobertas
- Sistema anti-duplicatas
- Health checks do banco

## 📊 Monitoramento

### GitHub Actions Dashboard
- **Status**: Todos os workflows no GitHub Actions tab
- **Logs**: Clique em qualquer run para ver logs detalhados
- **Summary**: Cada job gera relatórios automáticos

### Vercel Dashboard  
- **Deployments**: Histórico de todos os deploys
- **Performance**: Core Web Vitals automáticos
- **Analytics**: Métricas de uso

### Supabase Dashboard
- **Database**: Monitoramento de queries
- **Auth**: Estatísticas de usuários
- **Storage**: Uso de armazenamento

## 🎯 Fluxo de Desenvolvimento

### Para Desenvolvedores:

1. **Feature Development**:
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ... desenvolvimento ...
   git push origin feature/nova-funcionalidade
   ```

2. **Create Pull Request**:
   - PR automaticamente gera preview deploy
   - CI roda todos os checks
   - Review + merge

3. **Deploy Production**:
   - Merge para `main` = deploy automático
   - Health checks automáticos
   - Notificação de status

### Para Releases:

1. **Preparar Release**:
   ```bash
   npm version patch  # ou minor/major
   git push origin main --tags
   ```

2. **Deploy Manual** (se necessário):
   - GitHub Actions > CI/CD Pipeline > Run workflow
   - Escolher environment (preview/production)

## ⚠️ Troubleshooting

### Erros Comuns:

#### 1. "Secret not found"
**Solução**: Verificar se todos os secrets estão configurados no GitHub

#### 2. "Vercel deploy failed"  
**Solução**: Verificar VERCEL_TOKEN e project IDs

#### 3. "RLS tests failing"
**Solução**: Normal durante desenvolvimento - não bloqueia deploy

#### 4. "Build timeout"
**Solução**: Aumentar timeout nos workflows ou otimizar build

### Debug:

1. **Logs Detalhados**: 
   - GitHub Actions > Workflow run > Job > Step
   
2. **Vercel Logs**:
   - Vercel Dashboard > Deployment > Function Logs

3. **Local Testing**:
   ```bash
   # Testar build localmente
   npm run build
   
   # Testar com mesmas env vars
   NEXT_PUBLIC_SUPABASE_URL=... npm run build
   ```

## 🎉 Pronto!

Com essa configuração, você terá:

- ✅ **Deploy automático** em cada push
- 🔒 **Testes de segurança** diários
- 🕷️ **Dados sempre atualizados** via scraping
- 📊 **Monitoramento completo** da aplicação
- 🚀 **Preview automático** para PRs

### 📞 Suporte

Se precisar de ajuda:
1. Verificar logs do GitHub Actions
2. Consultar documentação do Vercel  
3. Revisar configurações do Supabase
4. Testar localmente primeiro

---

**🎯 Sistema configurado com sucesso = Reuni App deploy automático! 🚀**