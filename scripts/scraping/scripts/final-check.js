#!/usr/bin/env node

/**
 * Verificação Final do Projeto
 * 
 * Executa uma verificação completa de todos os componentes
 * do sistema para garantir que está pronto para uso.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class FinalChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  async run() {
    console.log(chalk.cyan('\n🔍 Verificação Final do Projeto'));
    console.log(chalk.cyan('═'.repeat(40)));
    console.log(chalk.gray('Verificando se todos os componentes estão prontos\n'));

    await this.checkProjectStructure();
    await this.checkCoreFiles();
    await this.checkScripts();
    await this.checkDocumentation();
    await this.checkConfiguration();
    await this.checkTests();
    await this.showFinalReport();
  }

  async checkProjectStructure() {
    console.log(chalk.yellow('📁 Verificando estrutura do projeto...'));

    const requiredDirs = [
      'auth', 'cli', 'docs', 'monitoring', 'processors',
      'reports', 'scrapers', 'scripts', 'storage', 'tests', 'utils'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.addSuccess(`Diretório ${dir}/ existe`);
      } else {
        this.addError(`Diretório ${dir}/ não encontrado`);
      }
    }

    console.log('');
  }

  async checkCoreFiles() {
    console.log(chalk.yellow('📄 Verificando arquivos principais...'));

    const coreFiles = [
      'index.js',
      'package.json',
      'README.md',
      'INSTALL.md',
      'PROJECT-SUMMARY.md',
      '.env.example',
      'jest.config.js'
    ];

    for (const file of coreFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.addSuccess(`Arquivo ${file} existe`);
      } else {
        this.addError(`Arquivo ${file} não encontrado`);
      }
    }

    // Verificar arquivos específicos por diretório
    const specificFiles = {
      'auth/authenticator.js': 'Sistema de autenticação',
      'cli/interactive-menu.js': 'Menu interativo',
      'scrapers/eventbrite-scraper.js': 'Scraper Eventbrite',
      'scrapers/sympla-scraper.js': 'Scraper Sympla',
      'storage/supabase-storage.js': 'Cliente Supabase',
      'utils/config.js': 'Configurações',
      'utils/logger.js': 'Sistema de logging'
    };

    for (const [file, description] of Object.entries(specificFiles)) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.addSuccess(`${description} implementado`);
      } else {
        this.addError(`${description} não encontrado (${file})`);
      }
    }

    console.log('');
  }

  async checkScripts() {
    console.log(chalk.yellow('⚙️ Verificando scripts de automação...'));

    const scripts = [
      'scripts/setup.js',
      'scripts/check-system.js',
      'scripts/deploy.js',
      'scripts/generate-docs.js',
      'scripts/final-check.js'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(this.projectRoot, script);
      if (fs.existsSync(scriptPath)) {
        this.addSuccess(`Script ${path.basename(script)} existe`);
        
        // Verificar se é executável
        try {
          const content = fs.readFileSync(scriptPath, 'utf8');
          if (content.includes('#!/usr/bin/env node')) {
            this.addSuccess(`Script ${path.basename(script)} é executável`);
          } else {
            this.addWarning(`Script ${path.basename(script)} sem shebang`);
          }
        } catch (error) {
          this.addError(`Erro ao ler script ${path.basename(script)}`);
        }
      } else {
        this.addError(`Script ${script} não encontrado`);
      }
    }

    console.log('');
  }

  async checkDocumentation() {
    console.log(chalk.yellow('📚 Verificando documentação...'));

    const docs = [
      'docs/API.md',
      'docs/ARCHITECTURE.md',
      'docs/CONFIGURATION.md',
      'docs/TROUBLESHOOTING.md',
      'docs/CONTRIBUTING.md'
    ];

    for (const doc of docs) {
      const docPath = path.join(this.projectRoot, doc);
      if (fs.existsSync(docPath)) {
        this.addSuccess(`Documentação ${path.basename(doc)} existe`);
        
        // Verificar se não está vazia
        try {
          const content = fs.readFileSync(docPath, 'utf8');
          if (content.length > 100) {
            this.addSuccess(`Documentação ${path.basename(doc)} tem conteúdo`);
          } else {
            this.addWarning(`Documentação ${path.basename(doc)} muito pequena`);
          }
        } catch (error) {
          this.addError(`Erro ao ler documentação ${path.basename(doc)}`);
        }
      } else {
        this.addError(`Documentação ${doc} não encontrada`);
      }
    }

    console.log('');
  }

  async checkConfiguration() {
    console.log(chalk.yellow('⚙️ Verificando configurações...'));

    // Verificar package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      
      if (packageJson.scripts) {
        const requiredScripts = ['start', 'test', 'setup', 'check', 'deploy:prepare'];
        for (const script of requiredScripts) {
          if (packageJson.scripts[script]) {
            this.addSuccess(`Script npm "${script}" configurado`);
          } else {
            this.addError(`Script npm "${script}" não encontrado`);
          }
        }
      }

      if (packageJson.dependencies) {
        const requiredDeps = ['puppeteer', '@supabase/supabase-js', 'inquirer', 'chalk'];
        for (const dep of requiredDeps) {
          if (packageJson.dependencies[dep]) {
            this.addSuccess(`Dependência ${dep} configurada`);
          } else {
            this.addError(`Dependência ${dep} não encontrada`);
          }
        }
      }

    } catch (error) {
      this.addError('Erro ao ler package.json');
    }

    // Verificar .env.example
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      try {
        const envContent = fs.readFileSync(envExamplePath, 'utf8');
        const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'LOG_LEVEL'];
        
        for (const varName of requiredVars) {
          if (envContent.includes(varName)) {
            this.addSuccess(`Variável ${varName} no .env.example`);
          } else {
            this.addError(`Variável ${varName} não encontrada no .env.example`);
          }
        }
      } catch (error) {
        this.addError('Erro ao ler .env.example');
      }
    }

    console.log('');
  }

  async checkTests() {
    console.log(chalk.yellow('🧪 Verificando testes...'));

    const testDir = path.join(this.projectRoot, 'tests');
    if (fs.existsSync(testDir)) {
      this.addSuccess('Diretório de testes existe');
      
      try {
        const testFiles = fs.readdirSync(testDir, { recursive: true })
          .filter(file => file.endsWith('.test.js'));
        
        if (testFiles.length > 0) {
          this.addSuccess(`${testFiles.length} arquivos de teste encontrados`);
        } else {
          this.addWarning('Nenhum arquivo de teste encontrado');
        }
      } catch (error) {
        this.addError('Erro ao listar arquivos de teste');
      }
    } else {
      this.addError('Diretório de testes não encontrado');
    }

    // Verificar jest.config.js
    const jestConfigPath = path.join(this.projectRoot, 'jest.config.js');
    if (fs.existsSync(jestConfigPath)) {
      this.addSuccess('Configuração do Jest existe');
    } else {
      this.addWarning('Configuração do Jest não encontrada');
    }

    console.log('');
  }

  addSuccess(message) {
    console.log(chalk.green(`  ✅ ${message}`));
    this.successes.push(message);
  }

  addWarning(message) {
    console.log(chalk.yellow(`  ⚠️  ${message}`));
    this.warnings.push(message);
  }

  addError(message) {
    console.log(chalk.red(`  ❌ ${message}`));
    this.errors.push(message);
  }

  async showFinalReport() {
    console.log(chalk.cyan('📋 Relatório Final'));
    console.log(chalk.cyan('═'.repeat(25)));
    
    console.log(chalk.green(`✅ Sucessos: ${this.successes.length}`));
    console.log(chalk.yellow(`⚠️  Avisos: ${this.warnings.length}`));
    console.log(chalk.red(`❌ Erros: ${this.errors.length}`));
    
    const total = this.successes.length + this.warnings.length + this.errors.length;
    const successRate = Math.round((this.successes.length / total) * 100);
    
    console.log(chalk.blue(`📊 Taxa de Sucesso: ${successRate}%`));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green('\n🎉 PROJETO COMPLETO E PRONTO PARA USO!'));
      console.log(chalk.gray('Todos os componentes estão implementados e funcionais.'));
      console.log(chalk.gray('\nPróximos passos:'));
      console.log(chalk.gray('  1. Execute "npm run setup" para configurar'));
      console.log(chalk.gray('  2. Execute "npm run check" para verificar sistema'));
      console.log(chalk.gray('  3. Execute "npm start" para iniciar'));
    } else if (this.errors.length === 0) {
      console.log(chalk.yellow('\n⚠️  PROJETO FUNCIONAL COM AVISOS'));
      console.log(chalk.gray('O sistema está funcional, mas alguns avisos devem ser considerados:'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    } else {
      console.log(chalk.red('\n❌ PROJETO COM PROBLEMAS'));
      console.log(chalk.gray('Os seguintes erros precisam ser corrigidos:'));
      this.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
      
      if (this.warnings.length > 0) {
        console.log(chalk.gray('\nAvisos adicionais:'));
        this.warnings.forEach(warning => {
          console.log(chalk.yellow(`   • ${warning}`));
        });
      }
    }

    console.log(chalk.blue('\n📚 Documentação disponível:'));
    console.log(chalk.gray('  • README.md - Visão geral'));
    console.log(chalk.gray('  • INSTALL.md - Instalação'));
    console.log(chalk.gray('  • PROJECT-SUMMARY.md - Resumo completo'));
    console.log(chalk.gray('  • docs/ - Documentação técnica'));

    console.log('');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const checker = new FinalChecker();
  checker.run().catch(error => {
    console.error(chalk.red('Erro durante verificação final:'), error);
    process.exit(1);
  });
}

module.exports = { FinalChecker };