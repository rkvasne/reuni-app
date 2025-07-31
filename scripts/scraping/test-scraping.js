#!/usr/bin/env node

/**
 * Teste de Scraping - Versão Debug
 * 
 * Testa o scraping com mais detalhes para identificar problemas
 */

const chalk = require('chalk');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { ScraperFactory } = require('./scrapers/scraper-factory');

async function testScraping() {
  console.log(chalk.cyan('\n🧪 Teste de Scraping - Modo Debug'));
  console.log(chalk.cyan('═'.repeat(40)));
  console.log(chalk.gray('Testando scrapers com mais detalhes\n'));

  const scraperFactory = new ScraperFactory();

  try {
    // Testar com uma cidade maior primeiro
    console.log(chalk.yellow('🏙️ Testando com São Paulo (cidade grande)...'));
    
    // Testar Eventbrite
    console.log(chalk.blue('\n📅 Testando Eventbrite:'));
    try {
      const eventbriteScraper = scraperFactory.createScraper('eventbrite');
      console.log(chalk.gray('Scraper criado com sucesso'));
      
      const events = await eventbriteScraper.scrapeEvents('São Paulo', 'SP');
      console.log(chalk.green(`✅ Resultado: ${events ? events.length : 0} eventos encontrados`));
      
      if (events && events.length > 0) {
        console.log(chalk.blue('\n📋 Primeiros 3 eventos encontrados:'));
        events.slice(0, 3).forEach((event, index) => {
          console.log(chalk.gray(`\n${index + 1}. ${event.title || 'Sem título'}`));
          console.log(chalk.gray(`   Data: ${event.date || 'Não informada'}`));
          console.log(chalk.gray(`   Local: ${event.location?.city || 'Não informado'}`));
          console.log(chalk.gray(`   URL: ${event.url || 'Não informada'}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no Eventbrite:'), error.message);
    }

    // Testar Sympla
    console.log(chalk.blue('\n🎪 Testando Sympla:'));
    try {
      const symplaScraper = scraperFactory.createScraper('sympla');
      console.log(chalk.gray('Scraper criado com sucesso'));
      
      const events = await symplaScraper.scrapeEvents('São Paulo', 'SP');
      console.log(chalk.green(`✅ Resultado: ${events ? events.length : 0} eventos encontrados`));
      
      if (events && events.length > 0) {
        console.log(chalk.blue('\n📋 Primeiros 3 eventos encontrados:'));
        events.slice(0, 3).forEach((event, index) => {
          console.log(chalk.gray(`\n${index + 1}. ${event.title || 'Sem título'}`));
          console.log(chalk.gray(`   Data: ${event.date || 'Não informada'}`));
          console.log(chalk.gray(`   Local: ${event.location?.city || 'Não informado'}`));
          console.log(chalk.gray(`   URL: ${event.url || 'Não informada'}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no Sympla:'), error.message);
    }

    // Agora testar com Ji-Paraná
    console.log(chalk.yellow('\n🏘️ Testando com Ji-Paraná, RO...'));
    
    // Testar Eventbrite Ji-Paraná
    console.log(chalk.blue('\n📅 Eventbrite - Ji-Paraná:'));
    try {
      const eventbriteScraper = scraperFactory.createScraper('eventbrite');
      const events = await eventbriteScraper.scrapeEvents('Ji-Paraná', 'RO');
      console.log(chalk.green(`✅ Resultado: ${events ? events.length : 0} eventos encontrados`));
      
      if (events && events.length > 0) {
        events.slice(0, 3).forEach((event, index) => {
          console.log(chalk.gray(`\n${index + 1}. ${event.title || 'Sem título'}`));
          console.log(chalk.gray(`   Data: ${event.date || 'Não informada'}`));
          console.log(chalk.gray(`   Local: ${event.location?.city || 'Não informado'}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no Eventbrite Ji-Paraná:'), error.message);
    }

    // Testar Sympla Ji-Paraná
    console.log(chalk.blue('\n🎪 Sympla - Ji-Paraná:'));
    try {
      const symplaScraper = scraperFactory.createScraper('sympla');
      const events = await symplaScraper.scrapeEvents('Ji-Paraná', 'RO');
      console.log(chalk.green(`✅ Resultado: ${events ? events.length : 0} eventos encontrados`));
      
      if (events && events.length > 0) {
        events.slice(0, 3).forEach((event, index) => {
          console.log(chalk.gray(`\n${index + 1}. ${event.title || 'Sem título'}`));
          console.log(chalk.gray(`   Data: ${event.date || 'Não informada'}`));
          console.log(chalk.gray(`   Local: ${event.location?.city || 'Não informado'}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no Sympla Ji-Paraná:'), error.message);
    }

    console.log(chalk.cyan('\n📊 Teste Concluído!'));
    console.log(chalk.gray('Se não foram encontrados eventos, pode ser:'));
    console.log(chalk.gray('1. Região com poucos eventos cadastrados'));
    console.log(chalk.gray('2. Validação muito rigorosa'));
    console.log(chalk.gray('3. Mudanças na estrutura dos sites'));
    console.log(chalk.gray('4. Problemas de conectividade\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Erro no teste:'), error.message);
  }
}

// Executar teste
if (require.main === module) {
  testScraping().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = testScraping;