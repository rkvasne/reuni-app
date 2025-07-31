#!/usr/bin/env node

/**
 * Script de Deploy/Produção
 * 
 * Prepara o sistema para execução em produção,
 * verificando configurações e otimizações.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const inquirer = require('inquirer');

class DeployManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.envPath = path.join(this.projectRoot, '.env.local');
    this.prodEnvPath = path.join(this.projectRoot, '.env.production');
  }

  async run() {
    console.log(chalk.cyan('\n🚀 Preparação para Deploy/Produção'));
    console.log(chalk.cyan('═'.repeat(45)));
    console.log(chalk.gray('Configurando sistema para ambiente de produção\n'));

    try {
      await this.checkPrerequisites();
      await this.createProductionConfig();
      await this.optimizeForProduction();
      await this.runProductionTests();
      await this.generateDeploymentGuide();
      await this.showCompletionMessage();
    } catch (error) {
      console.error(chalk.red('\n❌ Erro durante preparação:'), error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log(chalk.yellow('🔍 Verificando pré-requisitos para produção...'));

    // Verificar se sistema está configurado
    if (!fs.existsSync(this.envPath)) {
      throw new Error('Sistema não configurado. Execute "npm run setup" primeiro.');
    }

    // Verificar se testes passam
    try {
      console.log(chalk.gray('Executando testes...'));
      execSync('npm test', { cwd: this.projectRoot, stdio: 'pipe' });
      console.log(chalk.green('✅ Todos os testes passaram'));
    } catch (error) {
      throw new Error('Testes falharam. Corrija os problemas antes do deploy.');
    }

    // Verificar lint
    try {
      console.log(chalk.gray('Verificando qualidade do código...'));
      execSync('npm run lint', { cwd: this.projectRoot, stdio: 'pipe' });
      console.log(chalk.green('✅ Código está limpo'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Problemas de lint encontrados'));
      
      const { fixLint } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'fixLint',
          message: 'Tentar corrigir automaticamente?',
          default: true
        }
      ]);

      if (fixLint) {
        try {
          execSync('npm run lint:fix', { cwd: this.projectRoot, stdio: 'pipe' });
          console.log(chalk.green('✅ Problemas de lint corrigidos'));
        } catch (fixError) {
          console.log(chalk.yellow('⚠️  Alguns problemas precisam ser corrigidos manualmente'));
        }
      }
    }

    console.log('');
  }

  async createProductionConfig() {
    console.log(chalk.yellow('⚙️ Criando configuração de produção...'));

    const config = await this.collectProductionConfig();
    const prodEnvContent = this.generateProductionEnv(config);

    fs.writeFileSync(this.prodEnvPath, prodEnvContent);
    console.log(chalk.green('✅ Arquivo .env.production criado'));

    // Criar arquivo de configuração de produção
    const prodConfigPath = path.join(this.projectRoot, 'config.production.js');
    const prodConfigContent = this.generateProductionConfigFile(config);
    
    fs.writeFileSync(prodConfigPath, prodConfigContent);
    console.log(chalk.green('✅ Arquivo config.production.js criado\n'));
  }

  async collectProductionConfig() {
    console.log(chalk.gray('Configurando parâmetros de produção...\n'));

    return await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Ambiente de deploy:',
        choices: [
          { name: 'Produção (Máxima estabilidade)', value: 'production' },
          { name: 'Staging (Testes finais)', value: 'staging' },
          { name: 'Development (Desenvolvimento)', value: 'development' }
        ],
        default: 'production'
      },
      {
        type: 'list',
        name: 'performance',
        message: 'Perfil de performance:',
        choices: [
          { name: 'Conservador (Mais respeitoso)', value: 'conservative' },
          { name: 'Balanceado (Recomendado)', value: 'balanced' },
          { name: 'Agressivo (Mais rápido)', value: 'aggressive' }
        ],
        default: 'conservative'
      },
      {
        type: 'confirm',
        name: 'enableMonitoring',
        message: 'Habilitar monitoramento estrutural?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableReports',
        message: 'Gerar relatórios automaticamente?',
        default: true
      },
      {
        type: 'input',
        name: 'maxMemory',
        message: 'Limite de memória (MB):',
        default: '1024',
        validate: (input) => {
          const num = parseInt(input);
          return num > 0 && num <= 8192 ? true : 'Valor deve estar entre 1 e 8192';
        }
      },
      {
        type: 'input',
        name: 'logRetentionDays',
        message: 'Dias para manter logs:',
        default: '30',
        validate: (input) => {
          const num = parseInt(input);
          return num > 0 && num <= 365 ? true : 'Valor deve estar entre 1 e 365';
        }
      },
      {
        type: 'confirm',
        name: 'enableAlerts',
        message: 'Habilitar alertas por email/webhook?',
        default: false
      }
    ]);
  }

  generateProductionEnv(config) {
    const performanceSettings = {
      conservative: {
        maxRetries: 5,
        timeout: 60000,
        concurrency: 1,
        eventbriteRate: 4000,
        symplaRate: 3500
      },
      balanced: {
        maxRetries: 3,
        timeout: 45000,
        concurrency: 2,
        eventbriteRate: 2500,
        symplaRate: 2000
      },
      aggressive: {
        maxRetries: 2,
        timeout: 30000,
        concurrency: 3,
        eventbriteRate: 1500,
        symplaRate: 1200
      }
    };

    const settings = performanceSettings[config.performance];
    const currentEnv = fs.readFileSync(this.envPath, 'utf8');
    
    // Extrair URL e chave do Supabase do arquivo atual
    const supabaseUrl = currentEnv.match(/SUPABASE_URL=(.+)/)?.[1] || '';
    const supabaseKey = currentEnv.match(/SUPABASE_ANON_KEY=(.+)/)?.[1] || '';

    return `# 🚀 Configuração de Produção
# Gerado automaticamente em ${new Date().toISOString()}
# Ambiente: ${config.environment}

# 🗄️ Banco de Dados
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}

# 🕷️ Configurações de Scraping (Produção)
SCRAPING_MAX_RETRIES=${settings.maxRetries}
SCRAPING_TIMEOUT=${settings.timeout}
SCRAPING_MAX_CONCURRENCY=${settings.concurrency}
SCRAPING_USER_AGENT="EventScraper/1.0 (+https://github.com/seu-usuario/eventos-brasil)"

# ⏱️ Rate Limiting (Produção - Mais Respeitoso)
EVENTBRITE_RATE_LIMIT=${settings.eventbriteRate}
SYMPLA_RATE_LIMIT=${settings.symplaRate}

# 📝 Logging (Produção)
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_MAX_FILES=10
LOG_MAX_SIZE=10485760

# 🔐 Autenticação (Produção)
AUTH_HASH_ROUNDS=14
AUTH_SESSION_TIMEOUT=1800000
AUTH_MAX_ATTEMPTS=3

# 🎯 Configurações Regionais
PRIMARY_REGION="Ji-Paraná"
PRIMARY_STATE="RO"
NEARBY_CITIES="Ariquemes,Cacoal,Rolim de Moura,Vilhena"

# 🖥️ Puppeteer (Produção)
PUPPETEER_HEADLESS=true
PUPPETEER_NO_SANDBOX=true
PUPPETEER_DISABLE_SETUID_SANDBOX=true

# 📊 Relatórios
REPORTS_AUTO_GENERATE=${config.enableReports}
REPORTS_INCLUDE_CHARTS=true
REPORTS_COMPRESS=true

# 🔍 Monitoramento
STRUCTURE_MONITORING=${config.enableMonitoring}
MONITORING_INTERVAL=86400000
HEALTH_CHECK_INTERVAL=300000

# 🚨 Alertas
ALERT_ENABLED=${config.enableAlerts}
ALERT_EMAIL=
ALERT_WEBHOOK_URL=
ALERT_THRESHOLD_ERRORS=10
ALERT_THRESHOLD_FAILURES=5

# 🎛️ Configurações de Produção
NODE_ENV=production
MAX_MEMORY_USAGE=${config.maxMemory}
CLEANUP_OLD_LOGS_DAYS=${config.logRetentionDays}
CLEANUP_OLD_REPORTS_DAYS=90
AUTO_RESTART_ON_ERROR=true
GRACEFUL_SHUTDOWN_TIMEOUT=30000

# 🔒 Segurança
DISABLE_DEBUG_MODE=true
HIDE_STACK_TRACES=true
SECURE_HEADERS=true
`;
  }

  generateProductionConfigFile(config) {
    return `/**
 * Configuração de Produção
 * 
 * Configurações otimizadas para ambiente de produção
 * com foco em estabilidade e performance.
 */

module.exports = {
  environment: '${config.environment}',
  
  // Configurações de scraping otimizadas
  scraping: {
    respectful: true,
    maxConcurrency: ${config.performance === 'conservative' ? 1 : config.performance === 'balanced' ? 2 : 3},
    retryAttempts: ${config.performance === 'conservative' ? 5 : 3},
    gracefulShutdown: true
  },
  
  // Monitoramento e alertas
  monitoring: {
    enabled: ${config.enableMonitoring},
    healthChecks: true,
    performanceMetrics: true,
    errorTracking: true
  },
  
  // Configurações de logging
  logging: {
    level: 'info',
    toFile: true,
    rotation: true,
    maxFiles: 10,
    maxSize: '10MB'
  },
  
  // Configurações de segurança
  security: {
    hideErrors: true,
    secureHeaders: true,
    rateLimiting: true,
    inputValidation: true
  },
  
  // Configurações de performance
  performance: {
    memoryLimit: ${config.maxMemory},
    autoCleanup: true,
    compression: true,
    caching: true
  },
  
  // Configurações de manutenção
  maintenance: {
    logRetention: ${config.logRetentionDays},
    reportRetention: 90,
    autoUpdates: false,
    backups: true
  }
};
`;
  }

  async optimizeForProduction() {
    console.log(chalk.yellow('🔧 Otimizando para produção...'));

    // Criar diretórios de produção
    const prodDirs = ['logs/production', 'reports/production', 'backups'];
    for (const dir of prodDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(chalk.gray(`  Criado: ${dir}/`));
      }
    }

    // Criar script de inicialização
    const startScript = this.generateStartScript();
    const startScriptPath = path.join(this.projectRoot, 'start-production.js');
    fs.writeFileSync(startScriptPath, startScript);
    console.log(chalk.green('✅ Script de inicialização criado'));

    // Criar script de monitoramento
    const monitorScript = this.generateMonitorScript();
    const monitorScriptPath = path.join(this.projectRoot, 'monitor.js');
    fs.writeFileSync(monitorScriptPath, monitorScript);
    console.log(chalk.green('✅ Script de monitoramento criado'));

    // Criar arquivo de processo (PM2)
    const pm2Config = this.generatePM2Config();
    const pm2ConfigPath = path.join(this.projectRoot, 'ecosystem.config.js');
    fs.writeFileSync(pm2ConfigPath, pm2Config);
    console.log(chalk.green('✅ Configuração PM2 criada'));

    console.log('');
  }

  generateStartScript() {
    return `#!/usr/bin/env node

/**
 * Script de Inicialização para Produção
 */

const path = require('path');
const fs = require('fs');

// Configurar ambiente de produção
process.env.NODE_ENV = 'production';
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

// Configurar tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Configurar graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, finalizando graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recebido SIGINT, finalizando graciosamente...');
  process.exit(0);
});

// Iniciar aplicação
console.log('🚀 Iniciando sistema em modo produção...');
require('./index.js');
`;
  }

  generateMonitorScript() {
    return `#!/usr/bin/env node

/**
 * Script de Monitoramento
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionMonitor {
  constructor() {
    this.projectRoot = __dirname;
    this.logDir = path.join(this.projectRoot, 'logs', 'production');
  }

  async run() {
    console.log('🔍 Monitoramento de Produção - ' + new Date().toISOString());
    
    await this.checkSystemHealth();
    await this.checkLogs();
    await this.checkMemoryUsage();
    await this.generateHealthReport();
  }

  async checkSystemHealth() {
    try {
      const { SystemChecker } = require('./scripts/check-system');
      const checker = new SystemChecker();
      await checker.run();
    } catch (error) {
      console.error('Erro na verificação de saúde:', error.message);
    }
  }

  async checkLogs() {
    const logFiles = fs.readdirSync(this.logDir).filter(f => f.endsWith('.log'));
    
    for (const logFile of logFiles) {
      const logPath = path.join(this.logDir, logFile);
      const stats = fs.statSync(logPath);
      
      if (stats.size > 50 * 1024 * 1024) { // 50MB
        console.warn(\`Log file muito grande: \${logFile} (\${Math.round(stats.size / 1024 / 1024)}MB)\`);
      }
    }
  }

  async checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    console.log(\`Uso de memória: \${memUsedMB}MB\`);
    
    if (memUsedMB > 800) {
      console.warn('Alto uso de memória detectado');
    }
  }

  async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      version: process.version
    };
    
    const reportPath = path.join(this.logDir, 'health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }
}

if (require.main === module) {
  const monitor = new ProductionMonitor();
  monitor.run().catch(console.error);
}

module.exports = { ProductionMonitor };
`;
  }

  generatePM2Config() {
    return `module.exports = {
  apps: [{
    name: 'eventos-scraper',
    script: './start-production.js',
    instances: 1,
    exec_mode: 'fork',
    
    // Configurações de ambiente
    env: {
      NODE_ENV: 'production'
    },
    
    // Configurações de logging
    log_file: './logs/production/combined.log',
    out_file: './logs/production/out.log',
    error_file: './logs/production/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configurações de restart
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configurações de memória
    max_memory_restart: '1G',
    
    // Configurações de monitoramento
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'reports'],
    
    // Configurações de cron
    cron_restart: '0 2 * * *', // Restart diário às 2h
    
    // Configurações avançadas
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }]
};
`;
  }

  async runProductionTests() {
    console.log(chalk.yellow('🧪 Executando testes de produção...'));

    try {
      // Executar testes com configuração de produção
      process.env.NODE_ENV = 'production';
      execSync('npm test', { cwd: this.projectRoot, stdio: 'pipe' });
      console.log(chalk.green('✅ Testes de produção passaram'));
    } catch (error) {
      console.log(chalk.red('❌ Testes de produção falharam'));
      throw new Error('Corrija os testes antes do deploy');
    }

    console.log('');
  }

  async generateDeploymentGuide() {
    console.log(chalk.yellow('📋 Gerando guia de deployment...'));

    const deployGuide = `# 🚀 Guia de Deployment - Produção

## Pré-requisitos

- Node.js 18+ instalado
- PM2 instalado globalmente: \`npm install -g pm2\`
- Acesso ao banco Supabase configurado
- Servidor com pelo menos 1GB RAM

## Passos para Deploy

### 1. Preparação do Ambiente

\`\`\`bash
# Clone o repositório
git clone <seu-repositorio>
cd eventos-scraper

# Instale dependências
npm install

# Execute a configuração inicial
npm run setup

# Verifique o sistema
npm run check
\`\`\`

### 2. Configuração de Produção

\`\`\`bash
# Execute o script de deploy
npm run deploy:prepare

# Ou manualmente:
node scripts/deploy.js
\`\`\`

### 3. Inicialização com PM2

\`\`\`bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs eventos-scraper

# Monitoramento
pm2 monit
\`\`\`

### 4. Configuração de Cron (Opcional)

Para execução automática:

\`\`\`bash
# Adicionar ao crontab
crontab -e

# Executar diariamente às 6h
0 6 * * * cd /caminho/para/projeto && npm start

# Monitoramento a cada hora
0 * * * * cd /caminho/para/projeto && node monitor.js
\`\`\`

## Monitoramento

### Logs
- \`logs/production/\` - Logs de produção
- \`logs/production/error.log\` - Erros
- \`logs/production/combined.log\` - Logs combinados

### Comandos Úteis

\`\`\`bash
# Verificar saúde do sistema
npm run health

# Limpar logs antigos
npm run clean

# Reiniciar aplicação
pm2 restart eventos-scraper

# Parar aplicação
pm2 stop eventos-scraper
\`\`\`

## Troubleshooting

### Problemas Comuns

1. **Erro de memória**
   - Aumentar limite no \`.env.production\`
   - Verificar \`MAX_MEMORY_USAGE\`

2. **Rate limiting**
   - Ajustar \`EVENTBRITE_RATE_LIMIT\`
   - Verificar \`SYMPLA_RATE_LIMIT\`

3. **Conexão com banco**
   - Verificar \`SUPABASE_URL\`
   - Testar conectividade

### Logs de Debug

\`\`\`bash
# Habilitar debug temporariamente
LOG_LEVEL=debug pm2 restart eventos-scraper

# Ver logs em tempo real
pm2 logs eventos-scraper --lines 100
\`\`\`

## Backup e Recuperação

### Backup Automático
- Configurado em \`config.production.js\`
- Backup diário dos dados importantes

### Recuperação
\`\`\`bash
# Restaurar configuração
cp .env.production.backup .env.production

# Reiniciar sistema
pm2 restart eventos-scraper
\`\`\`

## Segurança

- Logs não contêm informações sensíveis
- Rate limiting ativo
- Validação de entrada habilitada
- Headers de segurança configurados

## Performance

- Configuração otimizada para produção
- Compressão de dados habilitada
- Cache inteligente ativo
- Limpeza automática de arquivos antigos

---

**Gerado em:** ${new Date().toISOString()}
**Versão:** 1.0.0
`;

    const guidePath = path.join(this.projectRoot, 'DEPLOYMENT.md');
    fs.writeFileSync(guidePath, deployGuide);
    console.log(chalk.green('✅ Guia de deployment criado (DEPLOYMENT.md)'));

    console.log('');
  }

  async showCompletionMessage() {
    console.log(chalk.cyan('🎉 Preparação para Produção Concluída!'));
    console.log(chalk.cyan('═'.repeat(40)));
    
    console.log(chalk.green('\n✅ Arquivos criados:'));
    console.log(chalk.gray('  • .env.production'));
    console.log(chalk.gray('  • config.production.js'));
    console.log(chalk.gray('  • start-production.js'));
    console.log(chalk.gray('  • monitor.js'));
    console.log(chalk.gray('  • ecosystem.config.js'));
    console.log(chalk.gray('  • DEPLOYMENT.md'));

    console.log(chalk.yellow('\n📋 Próximos passos:'));
    console.log(chalk.gray('  1. Revisar configurações em .env.production'));
    console.log(chalk.gray('  2. Testar em ambiente de staging'));
    console.log(chalk.gray('  3. Instalar PM2: npm install -g pm2'));
    console.log(chalk.gray('  4. Executar: pm2 start ecosystem.config.js'));
    console.log(chalk.gray('  5. Configurar monitoramento'));

    console.log(chalk.blue('\n📖 Documentação:'));
    console.log(chalk.gray('  • Leia DEPLOYMENT.md para instruções detalhadas'));
    console.log(chalk.gray('  • Configure alertas se necessário'));
    console.log(chalk.gray('  • Teste todos os cenários antes do deploy'));

    console.log(chalk.green('\n🚀 Sistema pronto para produção!'));
    console.log('');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const deployManager = new DeployManager();
  deployManager.run().catch(error => {
    console.error(chalk.red('Erro durante preparação para deploy:'), error);
    process.exit(1);
  });
}

module.exports = { DeployManager };