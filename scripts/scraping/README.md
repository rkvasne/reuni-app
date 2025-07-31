# 🎉 Sistema de Scraping de Eventos - Brasil

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](tests/)

Sistema automatizado para coleta e organização de eventos no Brasil, com foco especial na região de Ji-Paraná/RO e cidades próximas.

## 🚀 Funcionalidades

- ✅ **Scraping Automatizado** - Coleta eventos do Eventbrite e Sympla
- ✅ **Armazenamento Inteligente** - Banco de dados Supabase com deduplicação
- ✅ **Relatórios Detalhados** - Análises e estatísticas em PDF/CSV
- ✅ **Monitoramento Contínuo** - Acompanha mudanças na estrutura dos sites
- ✅ **Interface Amigável** - Menu interativo para todas as operações
- ✅ **Rate Limiting Respeitoso** - Respeita os termos de serviço dos sites
- ✅ **Logs Estruturados** - Sistema completo de logging e auditoria
- ✅ **Deploy Simplificado** - Scripts automatizados para produção

## 📋 Pré-requisitos

- Node.js 18 ou superior
- Conta no [Supabase](https://supabase.com) (gratuita)
- 1GB de RAM disponível
- Conexão estável com a internet

## ⚡ Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/eventos-scraper-brasil.git
cd eventos-scraper-brasil

# 2. Instale as dependências
npm install

# 3. Configure o sistema (interativo)
npm run setup

# 4. Verifique a instalação
npm run check

# 5. Inicie o sistema
npm start
```

## 📖 Documentação Completa

- 📚 [**Guia de Instalação**](INSTALL.md) - Instruções detalhadas
- 🏗️ [**Arquitetura**](docs/ARCHITECTURE.md) - Como o sistema funciona
- 📡 [**API**](docs/API.md) - Documentação técnica
- ⚙️ [**Configuração**](docs/CONFIGURATION.md) - Todas as opções
- 🔧 [**Troubleshooting**](docs/TROUBLESHOOTING.md) - Solução de problemas
- 🚀 [**Deploy**](DEPLOYMENT.md) - Produção e PM2
- 🤝 [**Contribuição**](docs/CONTRIBUTING.md) - Como ajudar

## 🎯 Uso Básico

### Menu Interativo
```bash
npm start
```

### Comandos Diretos
```bash
npm run check    # Verificar sistema
npm run scrape   # Executar scraping
npm run report   # Gerar relatório
npm run monitor  # Monitorar estrutura
npm run clean    # Limpar dados antigos
```

## 🚀 Deploy em Produção

### Com PM2 (Recomendado)
```bash
npm run deploy:prepare
npm install -g pm2
pm2 start ecosystem.config.js
pm2 monit
```

## 🧪 Testes

```bash
npm test                    # Todos os testes
npm run test:coverage       # Testes com coverage
npm run test:integration    # Testes de integração
```

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Veja o [guia de contribuição](docs/CONTRIBUTING.md) para começar.

## 📜 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Feito com ❤️ para a comunidade de Ji-Paraná/RO e região**

⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!
