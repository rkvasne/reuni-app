#!/usr/bin/env node

/**
 * Script de Verificação do Sistema
 * 
 * Verifica se todas as configurações estão corretas
 * e o sistema está pronto para uso.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { DatabaseHandler } = require('../storage/database-handler');
const { StructureMonitor } = require('../monitoring/structure-monitor');
const config = require('../utils/config');

class SystemChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log(chalk.cyan('\n🔍 Verificação do Sistema'));
    console.log(chalk.cyan('═'.repeat(40)));
    console.log(chalk.gray('Verificando configurações e dependências...\n'));

    try {
      await this.checkEnvironment();
      await this.checkFiles();
      await this.checkDatabase();
      await this.checkScrapers();
      await this.checkDirectories();
      
      this.showResults();
    } catch (error) {
      console.error(chalk.red('\n❌ Erro durante verificação:'), error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log(chalk.yellow('⚙️ Verificando variáveis de ambiente...'));

    const envPath = path.join(this.projectRoot, '.env.local');
    
    if (!fs.existsSync(envPath)) {
      this.addError('Arquivo .env.local não encontrado');
      return;
    }

    // Verificar variáveis obrigatórias
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ];

    const missingVars = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      this.addError(`Variáveis obrigatórias não configuradas: ${missingVars.join(', ')}`);
    } else {
      this.addCheck('Variáveis de ambiente configuradas');
    }

    // Verificar formato das URLs
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('supabase.co')) {
      this.addWarning('SUPABASE_URL pode estar incorreta');
    }

    if (process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY.length < 50) {
      this.addWarning('SUPABASE_ANON_KEY parece muito curta');
    }
  }

  async checkFiles() {
    console.log(chalk.yellow('📁 Verificando arquivos essenciais...'));

    const essentialFiles = [
      'package.json',
      'index.js',
      'auth/authenticator.js',
      'utils/config.js',
      'utils/logger.js',
      'scrapers/scraper-factory.js'
    ];

    for (const file of essentialFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.addCheck(`${file} encontrado`);
      } else {
        this.addError(`${file} não encontrado`);
      }
    }

    // Verificar node_modules
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      this.addCheck('Dependências instaladas');
    } else {
      this.addError('Dependências não instaladas (execute: npm install)');
    }
  }

  async checkDatabase() {
    console.log(chalk.yellow('🗄️ Verificando conexão com banco de dados...'));

    try {
      const dbHandler = new DatabaseHandler();
      await dbHandler.connect();
      
      this.addCheck('Conexão com Supabase estabelecida');

      // Verificar se as tabelas existem
      try {
        const { data, error } = await dbHandler.supabase
          .from('events')
          .select('count', { count: 'exact', head: true });

        if (error) {
          this.addError(`Tabela 'events' não encontrada: ${error.message}`);
        } else {
          this.addCheck('Tabela "events" encontrada');
        }
      } catch (error) {
        this.addError('Erro ao verificar tabelas do banco');
      }

      await dbHandler.disconnect();
    } catch (error) {
      this.addError(`Falha na conexão com banco: ${error.message}`);
    }
  }

  async checkScrapers() {
    console.log(chalk.yellow('🕷️ Verificando scrapers...'));

    try {
      const structureMonitor = new StructureMonitor();
      
      // Verificar configurações dos scrapers
      const scraperNames = ['eventbrite', 'sympla'];
      
      for (const scraperName of scraperNames) {
        if (config.scrapers[scraperName]) {
          this.addCheck(`Configuração do ${scraperName} encontrada`);
          
          // Verificar se os seletores estão definidos
          const selectors = config.scrapers[scraperName].selectors;
          if (selectors && Object.keys(selectors).length > 0) {
            this.addCheck(`Seletores do ${scraperName} definidos`);
          } else {
            this.addWarning(`Seletores do ${scraperName} podem estar incompletos`);
          }
        } else {
          this.addError(`Configuração do ${scraperName} não encontrada`);
        }
      }

      // Verificar saúde dos sites (opcional, pode ser lento)
      if (process.argv.includes('--check-sites')) {
        console.log(chalk.gray('  Verificando estrutura dos sites...'));
        
        try {
          const healthCheck = await structureMonitor.checkAllStructures();
          
          for (const [scraper, result] of Object.entries(healthCheck)) {
            if (result.success && result.overallHealth >= 70) {
              this.addCheck(`${scraper} está saudável (${result.overallHealth}%)`);
            } else {
              this.addWarning(`${scraper} pode ter problemas (${result.overallHealth || 0}%)`);
            }
          }
        } catch (error) {
          this.addWarning('Não foi possível verificar saúde dos sites');
        }
      }

    } catch (error) {
      this.addError(`Erro ao verificar scrapers: ${error.message}`);
    }
  }

  async checkDirectories() {
    console.log(chalk.yellow('📂 Verificando diretórios...'));

    const requiredDirs = [
      'logs',
      'reports',
      'temp'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.addCheck(`Diretório ${dir}/ existe`);
        
        // Verificar permissões de escrita
        try {
          const testFile = path.join(dirPath, '.write-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          this.addCheck(`Diretório ${dir}/ tem permissão de escrita`);
        } catch (error) {
          this.addError(`Diretório ${dir}/ sem permissão de escrita`);
        }
      } else {
        this.addWarning(`Diretório ${dir}/ não existe (será criado automaticamente)`);
      }
    }
  }

  addCheck(message) {
    this.checks.push(message);
    console.log(chalk.green(`  ✅ ${message}`));
  }

  addError(message) {
    this.errors.push(message);
    console.log(chalk.red(`  ❌ ${message}`));
  }

  addWarning(message) {
    this.warnings.push(message);
    console.log(chalk.yellow(`  ⚠️  ${message}`));
  }

  showResults() {
    console.log('\n' + chalk.cyan('📊 Resumo da Verificação'));
    console.log(chalk.cyan('═'.repeat(40)));
    
    console.log(chalk.green(`✅ Verificações OK: ${this.checks.length}`));
    console.log(chalk.yellow(`⚠️  Avisos: ${this.warnings.length}`));
    console.log(chalk.red(`❌ Erros: ${this.errors.length}`));

    if (this.errors.length > 0) {
      console.log('\n' + chalk.red('🚨 Erros que precisam ser corrigidos:'));
      this.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n' + chalk.yellow('⚠️  Avisos (opcional):'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }

    console.log('\n' + chalk.cyan('🔧 Comandos úteis:'));
    console.log(chalk.gray('  npm run setup        - Executar configuração inicial'));
    console.log(chalk.gray('  npm install          - Instalar dependências'));
    console.log(chalk.gray('  npm test             - Executar testes'));
    console.log(chalk.gray('  npm start            - Iniciar sistema'));

    if (this.errors.length === 0) {
      console.log('\n' + chalk.green('🎉 Sistema está pronto para uso!'));
      process.exit(0);
    } else {
      console.log('\n' + chalk.red('❌ Corrija os erros antes de usar o sistema'));
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  // Carregar variáveis de ambiente
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
  
  const checker = new SystemChecker();
  checker.run().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = { SystemChecker };