#!/usr/bin/env node

/**
 * Gerador de Documentação
 * 
 * Gera documentação completa do sistema baseada no código
 * e configurações atuais.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class DocumentationGenerator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.docsDir = path.join(this.projectRoot, 'docs');
  }

  async run() {
    console.log(chalk.cyan('\n📚 Gerador de Documentação'));
    console.log(chalk.cyan('═'.repeat(35)));
    console.log(chalk.gray('Gerando documentação completa do sistema\n'));

    try {
      await this.createDocsDirectory();
      await this.generateAPIDocumentation();
      await this.generateArchitectureDoc();
      await this.generateConfigurationDoc();
      await this.generateTroubleshootingDoc();
      await this.generateContributingDoc();
      await this.updateMainReadme();
      await this.showCompletionMessage();
    } catch (error) {
      console.error(chalk.red('\n❌ Erro durante geração:'), error.message);
      process.exit(1);
    }
  }

  async createDocsDirectory() {
    if (!fs.existsSync(this.docsDir)) {
      fs.mkdirSync(this.docsDir, { recursive: true });
      console.log(chalk.green('✅ Diretório docs/ criado'));
    }
  }

  async generateAPIDocumentation() {
    console.log(chalk.yellow('📖 Gerando documentação da API...'));

    const apiDoc = `# 📡 Documentação da API

## Visão Geral

O sistema de scraping de eventos oferece uma API interna para interação com os dados coletados e configurações do sistema.

## Módulos Principais

### 1. Scrapers

#### EventbriteScraper
\`\`\`javascript
const scraper = new EventbriteScraper();
await scraper.scrapeEvents('Ji-Paraná', 'RO');
\`\`\`

**Métodos:**
- \`scrapeEvents(city, state)\` - Coleta eventos de uma cidade
- \`scrapeEventDetails(eventUrl)\` - Coleta detalhes de um evento específico
- \`validateEvent(eventData)\` - Valida dados do evento

#### SymplaScraper
\`\`\`javascript
const scraper = new SymplaScraper();
await scraper.scrapeEvents('Ji-Paraná', 'RO');
\`\`\`

**Métodos:**
- \`scrapeEvents(city, state)\` - Coleta eventos de uma cidade
- \`scrapeEventDetails(eventUrl)\` - Coleta detalhes de um evento específico
- \`validateEvent(eventData)\` - Valida dados do evento

### 2. Storage

#### SupabaseStorage
\`\`\`javascript
const storage = new SupabaseStorage();
await storage.saveEvent(eventData);
\`\`\`

**Métodos:**
- \`saveEvent(eventData)\` - Salva evento no banco
- \`getEvents(filters)\` - Busca eventos com filtros
- \`updateEvent(id, data)\` - Atualiza evento existente
- \`deleteEvent(id)\` - Remove evento

### 3. Processors

#### EventProcessor
\`\`\`javascript
const processor = new EventProcessor();
const processedData = await processor.process(rawEventData);
\`\`\`

**Métodos:**
- \`process(rawData)\` - Processa dados brutos
- \`normalize(data)\` - Normaliza formato dos dados
- \`validate(data)\` - Valida dados processados
- \`enrich(data)\` - Enriquece dados com informações adicionais

## Estrutura de Dados

### Evento
\`\`\`javascript
{
  id: 'string',
  title: 'string',
  description: 'string',
  date: 'ISO 8601 string',
  location: {
    venue: 'string',
    address: 'string',
    city: 'string',
    state: 'string'
  },
  price: {
    min: 'number',
    max: 'number',
    currency: 'string'
  },
  category: 'string',
  source: 'eventbrite|sympla',
  url: 'string',
  image: 'string',
  organizer: 'string',
  created_at: 'ISO 8601 string',
  updated_at: 'ISO 8601 string'
}
\`\`\`

## Rate Limiting

O sistema implementa rate limiting respeitoso:
- Eventbrite: 2-4 segundos entre requisições
- Sympla: 2-3.5 segundos entre requisições
- Configurável via variáveis de ambiente

## Tratamento de Erros

Todos os métodos podem lançar as seguintes exceções:
- \`ScrapingError\` - Erro durante scraping
- \`ValidationError\` - Erro de validação de dados
- \`StorageError\` - Erro de armazenamento
- \`NetworkError\` - Erro de rede/conectividade
`;

    fs.writeFileSync(path.join(this.docsDir, 'API.md'), apiDoc);
    console.log(chalk.green('✅ Documentação da API criada'));
  }

  async generateArchitectureDoc() {
    console.log(chalk.yellow('🏗️ Gerando documentação de arquitetura...'));
    
    const archDoc = `# 🏗️ Arquitetura do Sistema

## Visão Geral

O sistema de scraping de eventos é construído com uma arquitetura modular e escalável, focada em confiabilidade e manutenibilidade.

## Componentes Principais

### 1. Interface Layer
- **CLI Interface**: Menu interativo para operações manuais
- **Web Interface**: Dashboard para visualização (futuro)
- **Cron Jobs**: Execução automatizada

### 2. Core Application
- **Main Controller**: Orquestra todas as operações
- **Configuration Manager**: Gerencia configurações
- **Logger**: Sistema de logging estruturado
- **Error Handler**: Tratamento centralizado de erros

### 3. Scrapers Layer
- **Base Scraper**: Classe abstrata com funcionalidades comuns
- **Eventbrite Scraper**: Implementação específica para Eventbrite
- **Sympla Scraper**: Implementação específica para Sympla
- **Generic Scraper**: Para sites não específicos

### 4. Processing Layer
- **Data Validator**: Validação de dados coletados
- **Data Normalizer**: Padronização de formatos
- **Data Enricher**: Adição de informações complementares
- **Duplicate Detector**: Identificação de eventos duplicados

### 5. Storage Layer
- **Supabase Client**: Interface com banco de dados
- **File Storage**: Armazenamento de arquivos locais
- **Cache Manager**: Sistema de cache para performance

### 6. Reports Layer
- **Report Generator**: Geração de relatórios
- **Chart Generator**: Criação de gráficos
- **Export Manager**: Exportação em diferentes formatos

## Fluxo de Dados

### 1. Coleta de Dados
\`\`\`
User Input → Scraper Selection → Target Configuration → Data Extraction
\`\`\`

### 2. Processamento
\`\`\`
Raw Data → Validation → Normalization → Enrichment → Duplicate Check
\`\`\`

### 3. Armazenamento
\`\`\`
Processed Data → Database Storage → File Backup → Cache Update
\`\`\`

### 4. Relatórios
\`\`\`
Stored Data → Analysis → Report Generation → Export → Notification
\`\`\`
`;

    fs.writeFileSync(path.join(this.docsDir, 'ARCHITECTURE.md'), archDoc);
    console.log(chalk.green('✅ Documentação de arquitetura criada'));
  }

  async generateConfigurationDoc() {
    console.log(chalk.yellow('⚙️ Gerando documentação de configuração...'));
    
    const configDoc = `# ⚙️ Guia de Configuração

## Variáveis de Ambiente

### 🗄️ Banco de Dados
\`\`\`bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
\`\`\`

### 🕷️ Configurações de Scraping
\`\`\`bash
SCRAPING_MAX_RETRIES=3
SCRAPING_TIMEOUT=30000
SCRAPING_MAX_CONCURRENCY=2
SCRAPING_USER_AGENT="EventScraper/1.0"
\`\`\`

### ⏱️ Rate Limiting
\`\`\`bash
EVENTBRITE_RATE_LIMIT=2000
SYMPLA_RATE_LIMIT=2500
\`\`\`

### 📝 Logging
\`\`\`bash
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_MAX_FILES=5
LOG_MAX_SIZE=5242880
\`\`\`

### 🎯 Configurações Regionais
\`\`\`bash
PRIMARY_REGION="Ji-Paraná"
PRIMARY_STATE="RO"
NEARBY_CITIES="Ariquemes,Cacoal,Rolim de Moura,Vilhena"
\`\`\`
`;

    fs.writeFileSync(path.join(this.docsDir, 'CONFIGURATION.md'), configDoc);
    console.log(chalk.green('✅ Documentação de configuração criada'));
  }

  async generateTroubleshootingDoc() {
    console.log(chalk.yellow('🔧 Gerando guia de troubleshooting...'));
    
    const troubleshootingDoc = `# 🔧 Guia de Troubleshooting

## Problemas Comuns e Soluções

### 1. 🚫 Erro de Conexão com Supabase

**Sintomas:**
- Erro "Failed to connect to Supabase"
- Timeout em operações de banco
- Dados não são salvos

**Soluções:**
\`\`\`bash
# Verificar credenciais
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Testar conectividade
curl -I $SUPABASE_URL

# Verificar configuração
npm run check
\`\`\`

### 2. 🕷️ Falhas no Scraping

**Sintomas:**
- "No events found" consistentemente
- Timeout em requisições
- Elementos não encontrados

**Soluções:**
\`\`\`bash
# Aumentar rate limiting
EVENTBRITE_RATE_LIMIT=5000
SYMPLA_RATE_LIMIT=4000

# Executar em modo debug
LOG_LEVEL=debug npm start

# Testar com headless desabilitado
PUPPETEER_HEADLESS=false npm start
\`\`\`

### 3. 💾 Problemas de Memória

**Sintomas:**
- "JavaScript heap out of memory"
- Sistema lento ou travando
- Processo sendo morto pelo OS

**Soluções:**
\`\`\`bash
# Aumentar limite de memória Node.js
node --max-old-space-size=2048 index.js

# Reduzir concorrência
SCRAPING_MAX_CONCURRENCY=1

# Monitorar uso de memória
npm run monitor
\`\`\`

## Comandos de Diagnóstico

### Verificação Completa do Sistema
\`\`\`bash
npm run check
\`\`\`

### Limpeza do Sistema
\`\`\`bash
npm run clean
npm run reset
\`\`\`
`;

    fs.writeFileSync(path.join(this.docsDir, 'TROUBLESHOOTING.md'), troubleshootingDoc);
    console.log(chalk.green('✅ Guia de troubleshooting criado'));
  }

  async generateContributingDoc() {
    console.log(chalk.yellow('🤝 Gerando guia de contribuição...'));
    
    const contributingDoc = `# 🤝 Guia de Contribuição

## Bem-vindo!

Obrigado pelo interesse em contribuir com o projeto de scraping de eventos do Brasil!

## 🚀 Começando

### Pré-requisitos
- Node.js 18+
- Git
- Conta no GitHub
- Conhecimento básico de JavaScript/Node.js

### Setup do Ambiente
\`\`\`bash
# 1. Fork o repositório no GitHub

# 2. Clone seu fork
git clone https://github.com/seu-usuario/eventos-scraper-brasil.git
cd eventos-scraper-brasil

# 3. Instale dependências
npm install

# 4. Configure o ambiente
npm run setup

# 5. Execute os testes
npm test

# 6. Inicie o sistema
npm start
\`\`\`

## 📝 Padrões de Código

### Estilo de Código
- Use ESLint (configuração incluída)
- Indentação: 2 espaços
- Aspas simples para strings
- Ponto e vírgula obrigatório

### Convenções de Nomenclatura
- **Arquivos:** kebab-case (\`event-scraper.js\`)
- **Classes:** PascalCase (\`EventScraper\`)
- **Funções/Variáveis:** camelCase (\`scrapeEvents\`)
- **Constantes:** UPPER_SNAKE_CASE (\`MAX_RETRIES\`)

## 🧪 Testes

### Executar Testes
\`\`\`bash
npm test
npm run test:coverage
npm run test:watch
\`\`\`

## 🏷️ Convenções de Commit

Use [Conventional Commits](https://conventionalcommits.org/):

- \`feat:\` nova funcionalidade
- \`fix:\` correção de bug
- \`docs:\` mudanças na documentação
- \`test:\` adição ou correção de testes
- \`chore:\` tarefas de manutenção
`;

    fs.writeFileSync(path.join(this.docsDir, 'CONTRIBUTING.md'), contributingDoc);
    console.log(chalk.green('✅ Guia de contribuição criado'));
  }

  async updateMainReadme() {
    console.log(chalk.yellow('📄 Atualizando README principal...'));

    const mainReadme = `# 🎉 Sistema de Scraping de Eventos - Brasil

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

\`\`\`bash
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
\`\`\`

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
\`\`\`bash
npm start
\`\`\`

### Comandos Diretos
\`\`\`bash
npm run check    # Verificar sistema
npm run scrape   # Executar scraping
npm run report   # Gerar relatório
npm run monitor  # Monitorar estrutura
npm run clean    # Limpar dados antigos
\`\`\`

## 🚀 Deploy em Produção

### Com PM2 (Recomendado)
\`\`\`bash
npm run deploy:prepare
npm install -g pm2
pm2 start ecosystem.config.js
pm2 monit
\`\`\`

## 🧪 Testes

\`\`\`bash
npm test                    # Todos os testes
npm run test:coverage       # Testes com coverage
npm run test:integration    # Testes de integração
\`\`\`

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Veja o [guia de contribuição](docs/CONTRIBUTING.md) para começar.

## 📜 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Feito com ❤️ para a comunidade de Ji-Paraná/RO e região**

⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!
`;

    fs.writeFileSync(path.join(this.projectRoot, 'README.md'), mainReadme);
    console.log(chalk.green('✅ README principal atualizado'));
  }

  async showCompletionMessage() {
    console.log(chalk.cyan('📚 Documentação Completa Gerada!'));
    console.log(chalk.cyan('═'.repeat(40)));
    
    console.log(chalk.green('\n✅ Documentos criados:'));
    console.log(chalk.gray('  • docs/API.md - Documentação da API'));
    console.log(chalk.gray('  • docs/ARCHITECTURE.md - Arquitetura do sistema'));
    console.log(chalk.gray('  • docs/CONFIGURATION.md - Guia de configuração'));
    console.log(chalk.gray('  • docs/TROUBLESHOOTING.md - Solução de problemas'));
    console.log(chalk.gray('  • docs/CONTRIBUTING.md - Guia de contribuição'));
    console.log(chalk.gray('  • README.md - Documentação principal atualizada'));

    console.log(chalk.green('\n📚 Sistema totalmente documentado!'));
    console.log('');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const generator = new DocumentationGenerator();
  generator.run().catch(error => {
    console.error(chalk.red('Erro durante geração da documentação:'), error);
    process.exit(1);
  });
}

module.exports = { DocumentationGenerator };