#!/usr/bin/env node

/**
 * Sistema de Scraping Flexível
 * Aceita eventos mesmo com alguns campos faltando
 */

const chalk = require('chalk');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { ScraperFactory } = require('./scrapers/scraper-factory');
const SupabaseStorage = require('./storage/supabase-storage');

async function runFlexibleScraping() {
  console.log(chalk.cyan('\n🎫 Sistema de Scraping Flexível'));
  console.log(chalk.cyan('═'.repeat(40)));
  console.log(chalk.gray('Aceita eventos com dados incompletos\n'));

  const storage = new SupabaseStorage();
  const scraperFactory = new ScraperFactory();
  
  let stats = { totalEvents: 0, eventsBySource: {}, errors: [] };

  try {
    await storage.initialize();
    console.log(chalk.green('✅ Conectado ao banco'));

    // Testar Eventbrite com São Paulo
    console.log(chalk.yellow('\n📅 Testando Eventbrite (São Paulo)...'));
    
    const eventbriteScraper = scraperFactory.createScraper('eventbrite');
    const events = await eventbriteScraper.scrapeEvents('São Paulo', 'SP');
    
    console.log(chalk.blue(`Eventos retornados: ${events ? events.length : 0}`));
    
    if (events && events.length > 0) {
      let saved = 0;
      
      for (const event of events.slice(0, 5)) { // Processar apenas os primeiros 5
        if (event.title) {
          // Criar evento flexível com dados padrão
          const flexEvent = {
            title: event.title,
            description: event.description || 'Sem descrição',
            date: event.date || new Date().toISOString(),
            location: event.location || { city: 'São Paulo', state: 'SP' },
            price: event.price || { min: 0, max: 0, currency: 'BRL' },
            category: event.category || 'Geral',
            source: 'eventbrite',
            url: event.url || `https://eventbrite.com/evento-${Date.now()}`,
            image: event.image || '',
            organizer: event.organizer || 'Não informado'
          };

          try {
            const result = await storage.saveEvent(flexEvent);
            if (result.action === 'created') {
              saved++;
              console.log(chalk.green(`✅ ${flexEvent.title.substring(0, 40)}...`));
            }
          } catch (error) {
            console.log(chalk.red(`❌ Erro: ${error.message}`));
          }
        }
      }
      
      stats.totalEvents += saved;
      stats.eventsBySource.eventbrite = saved;
      console.log(chalk.green(`💾 Salvos: ${saved} eventos`));
    }

    // Mostrar resultados
    console.log(chalk.cyan('\n📊 Resultados:'));
    console.log(chalk.green(`✅ Total salvos: ${stats.totalEvents}`));
    
    if (stats.totalEvents > 0) {
      console.log(chalk.green('\n🎉 Sucesso! Eventos foram salvos no banco.'));
    } else {
      console.log(chalk.yellow('\n⚠️  Nenhum evento foi salvo.'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Erro:'), error.message);
  }
}

if (require.main === module) {
  runFlexibleScraping();
}

module.exports = runFlexibleScraping;