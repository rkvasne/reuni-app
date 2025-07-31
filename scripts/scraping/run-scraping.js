#!/usr/bin/env node

/**
 * Sistema de Scraping de Eventos Brasil - Execução Direta
 * 
 * Executa scraping de eventos do Eventbrite e Sympla
 * com foco na região de Ji-Paraná/RO
 */

const chalk = require('chalk');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { ScraperFactory } = require('./scrapers/scraper-factory');
const SupabaseStorage = require('./storage/supabase-storage');

async function runScraping() {
  console.log(chalk.cyan('\n🎫 Sistema de Scraping de Eventos Brasil'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.gray('Execução Direta - Ji-Paraná/RO\n'));

  const storage = new SupabaseStorage();
  const scraperFactory = new ScraperFactory();
  
  let stats = {
    totalEvents: 0,
    eventsBySource: {},
    errors: []
  };

  try {
    // Conectar ao banco
    await storage.initialize();
    console.log(chalk.green('✅ Conectado ao banco de dados'));

    // Configurar região
    const region = process.env.PRIMARY_REGION || 'Ji-Paraná';
    const state = process.env.PRIMARY_STATE || 'RO';

    console.log(chalk.blue(`\n🎯 Região: ${region}, ${state}`));

    // Executar Eventbrite
    console.log(chalk.yellow('\n📅 Executando scraping do Eventbrite...'));
    try {
      const eventbriteScraper = scraperFactory.createScraper('eventbrite');
      const eventbriteEvents = await eventbriteScraper.scrapeEvents(region, state);
      
      if (eventbriteEvents && eventbriteEvents.length > 0) {
        console.log(chalk.green(`✅ ${eventbriteEvents.length} eventos encontrados no Eventbrite`));
        
        let savedCount = 0;
        let skippedCount = 0;

        for (const event of eventbriteEvents) {
          try {
            const result = await storage.saveEvent(event);
            if (result.action === 'created') {
              savedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.log(chalk.yellow(`⚠️  Erro ao salvar evento: ${event.title}`));
            stats.errors.push(`Eventbrite: ${error.message}`);
          }
        }

        console.log(chalk.green(`💾 ${savedCount} eventos salvos do Eventbrite`));
        if (skippedCount > 0) {
          console.log(chalk.yellow(`⏭️  ${skippedCount} eventos já existiam`));
        }

        stats.totalEvents += savedCount;
        stats.eventsBySource.eventbrite = savedCount;

      } else {
        console.log(chalk.yellow('⚠️  Nenhum evento encontrado no Eventbrite'));
        stats.eventsBySource.eventbrite = 0;
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro no Eventbrite:'), error.message);
      stats.errors.push(`Eventbrite: ${error.message}`);
      stats.eventsBySource.eventbrite = 0;
    }

    // Executar Sympla
    console.log(chalk.yellow('\n🎪 Executando scraping do Sympla...'));
    try {
      const symplaScraper = scraperFactory.createScraper('sympla');
      const symplaEvents = await symplaScraper.scrapeEvents(region, state);
      
      if (symplaEvents && symplaEvents.length > 0) {
        console.log(chalk.green(`✅ ${symplaEvents.length} eventos encontrados no Sympla`));
        
        let savedCount = 0;
        let skippedCount = 0;

        for (const event of symplaEvents) {
          try {
            const result = await storage.saveEvent(event);
            if (result.action === 'created') {
              savedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.log(chalk.yellow(`⚠️  Erro ao salvar evento: ${event.title}`));
            stats.errors.push(`Sympla: ${error.message}`);
          }
        }

        console.log(chalk.green(`💾 ${savedCount} eventos salvos do Sympla`));
        if (skippedCount > 0) {
          console.log(chalk.yellow(`⏭️  ${skippedCount} eventos já existiam`));
        }

        stats.totalEvents += savedCount;
        stats.eventsBySource.sympla = savedCount;

      } else {
        console.log(chalk.yellow('⚠️  Nenhum evento encontrado no Sympla'));
        stats.eventsBySource.sympla = 0;
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro no Sympla:'), error.message);
      stats.errors.push(`Sympla: ${error.message}`);
      stats.eventsBySource.sympla = 0;
    }

    // Mostrar resultados finais
    console.log(chalk.cyan('\n📊 Resultados do Scraping:'));
    console.log(chalk.cyan('═'.repeat(30)));
    
    console.log(chalk.green(`✅ Total de eventos salvos: ${stats.totalEvents}`));
    
    if (Object.keys(stats.eventsBySource).length > 0) {
      console.log(chalk.blue('\n📈 Por fonte:'));
      for (const [source, count] of Object.entries(stats.eventsBySource)) {
        console.log(chalk.gray(`  • ${source}: ${count} eventos`));
      }
    }

    if (stats.errors.length > 0) {
      console.log(chalk.red(`\n❌ Erros encontrados: ${stats.errors.length}`));
      stats.errors.slice(0, 3).forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
    }

    // Mostrar estatísticas gerais do banco
    try {
      console.log(chalk.cyan('\n📊 Estatísticas Gerais do Sistema:'));
      console.log(chalk.cyan('═'.repeat(35)));

      const dbStats = await storage.getEventStats();
      console.log(chalk.green(`📅 Total de eventos no banco: ${dbStats.total}`));
      
      if (dbStats.bySource && Object.keys(dbStats.bySource).length > 0) {
        console.log(chalk.blue('\n📈 Por fonte (total):'));
        for (const [source, count] of Object.entries(dbStats.bySource)) {
          console.log(chalk.gray(`  • ${source}: ${count} eventos`));
        }
      }

      if (dbStats.byCategory && Object.keys(dbStats.byCategory).length > 0) {
        console.log(chalk.blue('\n🏷️  Por categoria:'));
        for (const [category, count] of Object.entries(dbStats.byCategory)) {
          console.log(chalk.gray(`  • ${category}: ${count} eventos`));
        }
      }

    } catch (error) {
      console.log(chalk.yellow('⚠️  Não foi possível obter estatísticas gerais'));
    }

    if (stats.totalEvents > 0) {
      console.log(chalk.green('\n🎉 Scraping concluído com sucesso!'));
    } else {
      console.log(chalk.yellow('\n⚠️  Nenhum evento novo foi encontrado'));
    }

    console.log(chalk.gray('\n💡 Dicas:'));
    console.log(chalk.gray('  • Execute novamente em alguns minutos para buscar novos eventos'));
    console.log(chalk.gray('  • Verifique os logs em logs/ para mais detalhes'));
    console.log(chalk.gray('  • Use npm run check para verificar o sistema\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Erro fatal no sistema:'), error.message);
    console.log(chalk.gray('Verifique as configurações e tente novamente.'));
    process.exit(1);
  }
}

// Executar scraping
if (require.main === module) {
  runScraping().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = runScraping;