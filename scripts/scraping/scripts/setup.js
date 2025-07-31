#!/usr/bin/env node

/**
 * Script de Configuração Inicial
 * 
 * Configura o sistema pela primeira vez, criando
 * arquivos necessários e verificando dependências.
 */

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer').default || require('inquirer');
const chalk = require('chalk');
const { execSync } = require('child_process');

class SetupWizard {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.envPath = path.join(this.projectRoot, '.env.local');
    this.envExamplePath = path.join(this.projectRoot, '.env.example');
  }

  async run() {
    console.log(chalk.cyan('\n🎫 Sistema de Scraping de Eventos Brasil'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.gray('Assistente de Configuração Inicial\n'));

    try {
      await this.checkPrerequisites();
      await this.createEnvironmentFile();
      await this.setupDatabase();
      await this.createDirectories();
      await this.runInitialTests();
      await this.showCompletionMessage();
    } catch (error) {
      console.error(chalk.red('\n❌ Erro durante configuração:'), error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log(chalk.yellow('🔍 Verificando pré-requisitos...'));

    // Verificar Node.js
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ é necessário. Versão atual: ${nodeVersion}`);
    }
    
    console.log(chalk.green(`✅ Node.js ${nodeVersion}`));

    // Verificar npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(chalk.green(`✅ npm ${npmVersion}`));
    } catch (error) {
      throw new Error('npm não encontrado');
    }

    // Verificar dependências
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json não encontrado');
    }

    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(chalk.yellow('📦 Instalando dependências...'));
      execSync('npm install', { cwd: this.projectRoot, stdio: 'inherit' });
    }

    console.log(chalk.green('✅ Dependências verificadas\n'));
  }

  async createEnvironmentFile() {
    console.log(chalk.yellow('⚙️ Configurando variáveis de ambiente...'));

    if (fs.existsSync(this.envPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Arquivo .env.local já existe. Deseja sobrescrever?',
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.gray('Mantendo arquivo .env.local existente\n'));
        return;
      }
    }

    const config = await this.collectEnvironmentConfig();
    const envContent = this.generateEnvContent(config);

    fs.writeFileSync(this.envPath, envContent);
    console.log(chalk.green('✅ Arquivo .env.local criado\n'));
  }

  async collectEnvironmentConfig() {
    console.log(chalk.gray('Coletando configurações do Supabase...\n'));

    return await inquirer.prompt([
      {
        type: 'input',
        name: 'supabaseUrl',
        message: 'URL do projeto Supabase:',
        validate: (input) => {
          if (!input.startsWith('https://') || !input.includes('supabase.co')) {
            return 'URL deve ser no formato: https://seu-projeto.supabase.co';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'supabaseKey',
        message: 'Chave anônima do Supabase:',
        validate: (input) => {
          if (input.length < 50) {
            return 'Chave parece muito curta. Verifique se copiou corretamente.';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'logLevel',
        message: 'Nível de logging:',
        choices: [
          { name: 'Info (Recomendado)', value: 'info' },
          { name: 'Debug (Desenvolvimento)', value: 'debug' },
          { name: 'Warning (Produção)', value: 'warn' },
          { name: 'Error (Mínimo)', value: 'error' }
        ],
        default: 'info'
      },
      {
        type: 'confirm',
        name: 'logToFile',
        message: 'Salvar logs em arquivo?',
        default: true
      },
      {
        type: 'list',
        name: 'performance',
        message: 'Perfil de performance:',
        choices: [
          { name: 'Balanceado (Recomendado)', value: 'balanced' },
          { name: 'Rápido (Menos respeitoso)', value: 'fast' },
          { name: 'Conservador (Mais respeitoso)', value: 'conservative' }
        ],
        default: 'balanced'
      }
    ]);
  }

  generateEnvContent(config) {
    const performanceSettings = {
      balanced: {
        maxRetries: 3,
        timeout: 30000,
        concurrency: 2,
        eventbriteRate: 2000,
        symplaRate: 1500
      },
      fast: {
        maxRetries: 2,
        timeout: 20000,
        concurrency: 3,
        eventbriteRate: 1000,
        symplaRate: 800
      },
      conservative: {
        maxRetries: 5,
        timeout: 45000,
        concurrency: 1,
        eventbriteRate: 3000,
        symplaRate: 2500
      }
    };

    const settings = performanceSettings[config.performance];

    return `# 🗄️ Banco de Dados (Supabase)
SUPABASE_URL=${config.supabaseUrl}
SUPABASE_ANON_KEY=${config.supabaseKey}

# 🕷️ Configurações de Scraping
SCRAPING_MAX_RETRIES=${settings.maxRetries}
SCRAPING_TIMEOUT=${settings.timeout}
SCRAPING_MAX_CONCURRENCY=${settings.concurrency}
SCRAPING_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ⏱️ Rate Limiting (em milissegundos)
EVENTBRITE_RATE_LIMIT=${settings.eventbriteRate}
SYMPLA_RATE_LIMIT=${settings.symplaRate}

# 📝 Logging
LOG_LEVEL=${config.logLevel}
LOG_TO_FILE=${config.logToFile}

# 🔐 Autenticação
AUTH_HASH_ROUNDS=12
AUTH_SESSION_TIMEOUT=3600000

# 🎯 Configurações Regionais
PRIMARY_REGION="Ji-Paraná"
PRIMARY_STATE="RO"
NEARBY_CITIES="Ariquemes,Cacoal,Rolim de Moura,Vilhena"

# 🖥️ Puppeteer
PUPPETEER_HEADLESS=true

# 📊 Relatórios
REPORTS_AUTO_GENERATE=true
REPORTS_INCLUDE_CHARTS=true

# 🔍 Monitoramento
STRUCTURE_MONITORING=true
MONITORING_INTERVAL=86400000

# 🎛️ Configurações Avançadas
MAX_MEMORY_USAGE=512
CLEANUP_OLD_LOGS_DAYS=30
CLEANUP_OLD_REPORTS_DAYS=90

# Gerado automaticamente em ${new Date().toISOString()}
`;
  }

  async setupDatabase() {
    console.log(chalk.yellow('🗄️ Configurando banco de dados...'));

    const { setupDb } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupDb',
        message: 'Deseja que eu ajude a configurar as tabelas do banco?',
        default: true
      }
    ]);

    if (setupDb) {
      console.log(chalk.gray('\nPara configurar o banco de dados:'));
      console.log(chalk.gray('1. Acesse seu projeto no Supabase'));
      console.log(chalk.gray('2. Vá para SQL Editor'));
      console.log(chalk.gray('3. Execute o script SQL que está em INSTALL.md'));
      console.log(chalk.gray('4. Verifique se as tabelas foram criadas corretamente\n'));

      await inquirer.prompt([
        {
          type: 'confirm',
          name: 'dbReady',
          message: 'Tabelas criadas no Supabase?',
          default: false
        }
      ]);
    }

    console.log(chalk.green('✅ Configuração do banco concluída\n'));
  }

  async createDirectories() {
    console.log(chalk.yellow('📁 Criando diretórios necessários...'));

    const directories = [
      'logs',
      'reports',
      'temp'
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(chalk.gray(`  Criado: ${dir}/`));
      }
    }

    // Criar arquivo .gitkeep para manter diretórios no git
    const gitkeepDirs = ['logs', 'reports', 'temp'];
    for (const dir of gitkeepDirs) {
      const gitkeepPath = path.join(this.projectRoot, dir, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '# Manter diretório no git\n');
      }
    }

    console.log(chalk.green('✅ Diretórios criados\n'));
  }

  async runInitialTests() {
    console.log(chalk.yellow('🧪 Executando testes iniciais...'));

    const { runTests } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'runTests',
        message: 'Executar testes para verificar instalação?',
        default: true
      }
    ]);

    if (runTests) {
      try {
        console.log(chalk.gray('Executando testes...'));
        execSync('npm test', { 
          cwd: this.projectRoot, 
          stdio: 'pipe',
          timeout: 60000
        });
        console.log(chalk.green('✅ Todos os testes passaram'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Alguns testes falharam, mas isso é normal na primeira execução'));
        console.log(chalk.gray('Execute "npm test" manualmente para ver detalhes'));
      }
    }

    console.log('');
  }

  async showCompletionMessage() {
    console.log(chalk.green('🎉 Configuração concluída com sucesso!\n'));
    
    console.log(chalk.cyan('Próximos passos:'));
    console.log(chalk.gray('1. Execute: npm start'));
    console.log(chalk.gray('2. Crie suas credenciais de acesso'));
    console.log(chalk.gray('3. Configure o scraping conforme necessário'));
    console.log(chalk.gray('4. Execute sua primeira coleta de eventos\n'));

    console.log(chalk.cyan('Comandos úteis:'));
    console.log(chalk.gray('• npm start          - Iniciar o sistema'));
    console.log(chalk.gray('• npm test           - Executar testes'));
    console.log(chalk.gray('• npm run dev        - Modo desenvolvimento'));
    console.log(chalk.gray('• npm run check      - Verificar configuração\n'));

    console.log(chalk.cyan('Documentação:'));
    console.log(chalk.gray('• README.md          - Documentação completa'));
    console.log(chalk.gray('• INSTALL.md         - Guia de instalação'));
    console.log(chalk.gray('• .env.example       - Exemplo de configuração\n'));

    console.log(chalk.green('Sistema pronto para uso! 🚀'));
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.run().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = { SetupWizard };