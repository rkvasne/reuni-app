#!/usr/bin/env node

/**
 * Sistema de Scraping de Eventos Brasil - Versão Simplificada
 * 
 * Executa scraping de eventos do Eventbrite e Sympla
 * com foco na região de Ji-Paraná/RO
 */

const chalk = require('chalk');
const readline = require('readline');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const logger = require('./utils/logger');
const { ScraperFactory } = require('./scrapers/scraper-factory');
const SupabaseStorage = require('./storage/supabase-storage');
const ReportGenerator = require('./reports/report-generator');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

class EventScrapingSystem {
  constructor() {
    this.scraperFactory = new ScraperFactory();
    this.dbHandler = new SupabaseStorage();
    this.reportGenerator = new ReportGenerator();
    this.stats = {
      totalEvents: 0,
      eventsBySource: {},
      errors: []
    };
  }

  async run() {
    try {
      console.log(chalk.cyan('\n🎫 Sistema de Scraping de Eventos Brasil'));
      console.log(chalk.cyan('═'.repeat(50)));
      console.log(chalk.gray('Versão Simplificada - Ji-Paraná/RO\n'));

      // Conectar ao banco
      await this.dbHandler.initialize();
      console.log(chalk.green('✅ Conectado ao banco de dados'));

      // Menu principal
      await this.showMainMenu();

    } catch (error) {
      console.error(chalk.red('❌ Erro no sistema:'), error.message);
      logger.error('Erro no sistema principal:', error);
    } finally {
      rl.close();
      // SupabaseStorage não precisa de disconnect explícito
    }
  }

  async showMainMenu() {
    console.log(chalk.yellow('\n📋 Menu Principal:'));
    console.log(chalk.gray('1. Executar scraping completo (Eventbrite + Sympla)'));
    console.log(chalk.gray('2. Executar apenas Eventbrite'));
    console.log(chalk.gray('3. Executar apenas Sympla'));
    console.log(chalk.gray('4. Gerar relatório'));
    console.log(chalk.gray('5. Verificar estatísticas'));
    console.log(chalk.gray('6. Sair'));

    const choice = await question('\nEscolha uma opção (1-6): ');

    switch (choice) {
      case '1':
        await this.runFullScraping();
        break;
      case '2':
        await this.runEventbriteScraping();
        break;
      case '3':
        await this.runSymplaScraping();
        break;
      case '4':
        await this.generateReport();
        break;
      case '5':
        await this.showStatistics();
        break;
      case '6':
        console.log(chalk.green('\n👋 Até logo!'));
        return;
      default:
        console.log(chalk.red('❌ Opção inválida!'));
        await this.showMainMenu();
    }
  }

  async runFullScraping() {
    console.log(chalk.cyan('\n🕷️ Iniciando scraping completo...'));
    
    try {
      // Executar Eventbrite
      console.log(chalk.yellow('\n📅 Executando scraping do Eventbrite...'));
      await this.scrapeSource('eventbrite');

      // Executar Sympla
      console.log(chalk.yellow('\n🎪 Executando scraping do Sympla...'));
      await this.scrapeSource('sympla');

      // Mostrar resultados
      await this.showResults();

      // Gerar relatório automático
      if (this.stats.totalEvents > 0) {
        console.log(chalk.yellow('\n📊 Gerando relatório...'));
        await this.generateReport();
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro durante scraping:'), error.message);
      logger.error('Erro durante scraping completo:', error);
    }

    await this.showMainMenu();
  }

  async runEventbriteScraping() {
    console.log(chalk.cyan('\n📅 Executando scraping do Eventbrite...'));
    
    try {
      await this.scrapeSource('eventbrite');
      await this.showResults();
    } catch (error) {
      console.error(chalk.red('❌ Erro no Eventbrite:'), error.message);
    }

    await this.showMainMenu();
  }

  async runSymplaScraping() {
    console.log(chalk.cyan('\n🎪 Executando scraping do Sympla...'));
    
    try {
      await this.scrapeSource('sympla');
      await this.showResults();
    } catch (error) {
      console.error(chalk.red('❌ Erro no Sympla:'), error.message);
    }

    await this.showMainMenu();
  }

  async scrapeSource(source) {
    try {
      const scraper = this.scraperFactory.createScraper(source);
      
      // Configurar região
      const region = process.env.PRIMARY_REGION || 'Ji-Paraná';
      const state = process.env.PRIMARY_STATE || 'RO';

      console.log(chalk.gray(`Buscando eventos em ${region}, ${state}...`));

      // Executar scraping
      const events = await scraper.scrapeEvents(region, state);
      
      if (events && events.length > 0) {
        console.log(chalk.green(`✅ ${events.length} eventos encontrados`));
        
        // Salvar eventos
        let savedCount = 0;
        let skippedCount = 0;

        for (const event of events) {
          try {
            const result = await this.dbHandler.saveEvent(event);
            if (result.action === 'created') {
              savedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.log(chalk.yellow(`⚠️  Erro ao salvar evento: ${event.title}`));
            this.stats.errors.push(error.message);
          }
        }

        console.log(chalk.green(`💾 ${savedCount} eventos salvos`));
        if (skippedCount > 0) {
          console.log(chalk.yellow(`⏭️  ${skippedCount} eventos já existiam`));
        }

        // Atualizar estatísticas
        this.stats.totalEvents += savedCount;
        this.stats.eventsBySource[source] = savedCount;

      } else {
        console.log(chalk.yellow('⚠️  Nenhum evento encontrado'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ Erro no scraping ${source}:`), error.message);
      this.stats.errors.push(`${source}: ${error.message}`);
      throw error;
    }
  }

  async showResults() {
    console.log(chalk.cyan('\n📊 Resultados do Scraping:'));
    console.log(chalk.cyan('═'.repeat(30)));
    
    console.log(chalk.green(`✅ Total de eventos salvos: ${this.stats.totalEvents}`));
    
    if (Object.keys(this.stats.eventsBySource).length > 0) {
      console.log(chalk.blue('\n📈 Por fonte:'));
      for (const [source, count] of Object.entries(this.stats.eventsBySource)) {
        console.log(chalk.gray(`  • ${source}: ${count} eventos`));
      }
    }

    if (this.stats.errors.length > 0) {
      console.log(chalk.red(`\n❌ Erros encontrados: ${this.stats.errors.length}`));
      this.stats.errors.slice(0, 3).forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
    }
  }

  async generateReport() {
    try {
      console.log(chalk.yellow('📊 Gerando relatório...'));
      
      const reportData = await this.reportGenerator.generateReport('daily');
      console.log(chalk.green('✅ Relatório gerado com sucesso!'));
      console.log(chalk.gray(`📄 Arquivo: ${reportData.filename}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Erro ao gerar relatório:'), error.message);
    }
  }

  async showStatistics() {
    try {
      console.log(chalk.cyan('\n📊 Estatísticas do Sistema:'));
      console.log(chalk.cyan('═'.repeat(30)));

      // Buscar estatísticas do banco
      const stats = await this.dbHandler.getEventStats();
      
      console.log(chalk.green(`📅 Total de eventos: ${stats.total}`));
      
      if (stats.bySource && Object.keys(stats.bySource).length > 0) {
        console.log(chalk.blue('\n📈 Por fonte:'));
        for (const [source, count] of Object.entries(stats.bySource)) {
          console.log(chalk.gray(`  • ${source}: ${count} eventos`));
        }
      }

      if (stats.byCategory && Object.keys(stats.byCategory).length > 0) {
        console.log(chalk.blue('\n🏷️  Por categoria:'));
        for (const [category, count] of Object.entries(stats.byCategory)) {
          console.log(chalk.gray(`  • ${category}: ${count} eventos`));
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro ao buscar estatísticas:'), error.message);
    }

    await this.showMainMenu();
  }
}

// Executar sistema
if (require.main === module) {
  const system = new EventScrapingSystem();
  system.run().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = EventScrapingSystem;