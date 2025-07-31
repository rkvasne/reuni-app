#!/usr/bin/env node

/**
 * Script de Configuração Inicial Simplificado
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log(chalk.cyan('\n🎫 Sistema de Scraping de Eventos Brasil'));
  console.log(chalk.cyan('══════════════════════════════════════════════════'));
  console.log(chalk.gray('Configuração Inicial Simplificada\n'));

  const projectRoot = path.join(__dirname, '..');
  const envPath = path.join(projectRoot, '.env.local');
  const envExamplePath = path.join(projectRoot, '.env.example');

  try {
    // Verificar se .env.local já existe
    if (fs.existsSync(envPath)) {
      console.log(chalk.yellow('⚠️  Arquivo .env.local já existe!'));
      const overwrite = await question('Deseja sobrescrever? (s/N): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log(chalk.gray('Configuração cancelada.'));
        rl.close();
        return;
      }
    }

    console.log(chalk.yellow('⚙️ Configurando variáveis de ambiente...\n'));

    // Coletar configurações do Supabase
    console.log(chalk.blue('📊 Configuração do Supabase:'));
    const supabaseUrl = await question('URL do projeto Supabase: ');
    const supabaseKey = await question('Chave anônima do Supabase: ');

    // Configurações regionais
    console.log(chalk.blue('\n🎯 Configurações regionais:'));
    const primaryRegion = await question('Região principal (padrão: Ji-Paraná): ') || 'Ji-Paraná';
    const primaryState = await question('Estado (padrão: RO): ') || 'RO';

    // Configurações de logging
    console.log(chalk.blue('\n📝 Configurações de logging:'));
    const logLevel = await question('Nível de log (debug/info/warn/error, padrão: info): ') || 'info';

    // Criar arquivo .env.local
    const envContent = `# 🎫 Configuração do Sistema de Scraping de Eventos
# Gerado automaticamente em ${new Date().toISOString()}

# 🗄️ Banco de Dados Supabase
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}

# 🕷️ Configurações de Scraping
SCRAPING_MAX_RETRIES=3
SCRAPING_TIMEOUT=30000
SCRAPING_MAX_CONCURRENCY=2
SCRAPING_USER_AGENT="EventScraper/1.0"

# ⏱️ Rate Limiting (ms entre requisições)
EVENTBRITE_RATE_LIMIT=2000
SYMPLA_RATE_LIMIT=2500

# 📝 Logging
LOG_LEVEL=${logLevel}
LOG_TO_FILE=true
LOG_MAX_FILES=5
LOG_MAX_SIZE=5242880

# 🔐 Autenticação
AUTH_HASH_ROUNDS=12
AUTH_SESSION_TIMEOUT=1800000
AUTH_MAX_ATTEMPTS=5

# 🎯 Configurações Regionais
PRIMARY_REGION="${primaryRegion}"
PRIMARY_STATE="${primaryState}"
NEARBY_CITIES="Ariquemes,Cacoal,Rolim de Moura,Vilhena"

# 🖥️ Puppeteer
PUPPETEER_HEADLESS=true
PUPPETEER_NO_SANDBOX=false
PUPPETEER_DISABLE_SETUID_SANDBOX=false

# 📊 Relatórios
REPORTS_AUTO_GENERATE=true
REPORTS_INCLUDE_CHARTS=true
REPORTS_COMPRESS=false

# 🔍 Monitoramento
STRUCTURE_MONITORING=true
MONITORING_INTERVAL=86400000
HEALTH_CHECK_INTERVAL=300000

# 🚨 Alertas
ALERT_ENABLED=false
ALERT_EMAIL=""
ALERT_WEBHOOK_URL=""
ALERT_THRESHOLD_ERRORS=10
ALERT_THRESHOLD_FAILURES=5
`;

    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green('\n✅ Arquivo .env.local criado com sucesso!'));

    // Criar diretórios necessários
    const dirs = ['logs', 'reports', 'temp', 'backups'];
    for (const dir of dirs) {
      const dirPath = path.join(projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(chalk.gray(`  Criado: ${dir}/`));
      }
    }

    console.log(chalk.green('\n🎉 Configuração concluída com sucesso!'));
    console.log(chalk.yellow('\n📋 Próximos passos:'));
    console.log(chalk.gray('  1. Execute "npm run check" para verificar o sistema'));
    console.log(chalk.gray('  2. Execute "npm start" para iniciar o sistema'));
    console.log(chalk.gray('  3. Consulte README.md para mais informações\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Erro durante configuração:'), error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setup();