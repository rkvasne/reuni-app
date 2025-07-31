#!/usr/bin/env node

/**
 * Scraper Simples - Busca Eventos Reais
 * Versão simplificada que funciona com dados reais
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SupabaseStorage = require('./storage/supabase-storage');

async function scrapeRealEvents() {
  console.log(chalk.cyan('\n🎫 Buscando Eventos Reais'));
  console.log(chalk.cyan('═'.repeat(30)));

  const storage = new SupabaseStorage();
  let browser;
  let totalSaved = 0;

  try {
    await storage.initialize();
    console.log(chalk.green('✅ Conectado ao banco'));

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Testar Eventbrite
    console.log(chalk.yellow('\n📅 Buscando no Eventbrite...'));
    
    try {
      await page.goto('https://www.eventbrite.com.br/d/brazil--s%C3%A3o-paulo/events/', { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      await page.waitForTimeout(3000);

      const eventbriteEvents = await page.evaluate(() => {
        const events = [];
        const elements = document.querySelectorAll('article, [data-testid*="event"], .event-card, h3 a, h2 a');
        
        elements.forEach((el, index) => {
          if (index >= 15) return; // Limitar
          
          let title = '';
          let url = '';
          
          // Tentar extrair título
          if (el.tagName === 'A') {
            title = el.textContent?.trim();
            url = el.href;
          } else {
            const link = el.querySelector('a[href*="/e/"]') || el.querySelector('h1 a, h2 a, h3 a, h4 a');
            if (link) {
              title = link.textContent?.trim();
              url = link.href;
            }
          }
          
          if (title && title.length > 5 && !title.includes('undefined')) {
            events.push({
              title: title,
              url: url || 'https://eventbrite.com.br',
              source: 'eventbrite'
            });
          }
        });
        
        return events;
      });

      console.log(chalk.blue(`Encontrados: ${eventbriteEvents.length} eventos`));

      // Salvar eventos do Eventbrite
      for (const event of eventbriteEvents.slice(0, 10)) {
        const eventData = {
          title: event.title,
          description: 'Evento real encontrado no Eventbrite',
          date: new Date().toISOString(),
          location: {
            venue: 'Local não especificado',
            address: 'São Paulo, SP',
            city: 'São Paulo',
            state: 'SP'
          },
          price: { min: 0, max: 0, currency: 'BRL' },
          category: 'Geral',
          source: 'eventbrite',
          url: event.url,
          organizer: 'Não especificado'
        };

        try {
          const result = await storage.saveEvent(eventData);
          if (result.action === 'created') {
            totalSaved++;
            console.log(chalk.green(`✅ ${event.title.substring(0, 40)}...`));
          } else {
            console.log(chalk.yellow(`⏭️  ${event.title.substring(0, 40)}... (já existe)`));
          }
        } catch (error) {
          console.log(chalk.red(`❌ Erro: ${error.message}`));
        }
      }

    } catch (error) {
      console.log(chalk.red(`❌ Erro Eventbrite: ${error.message}`));
    }

    // Testar Sympla
    console.log(chalk.yellow('\n🎪 Buscando no Sympla...'));
    
    try {
      await page.goto('https://www.sympla.com.br/eventos/sao-paulo-sp', { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      await page.waitForTimeout(3000);

      const symplaEvents = await page.evaluate(() => {
        const events = [];
        const elements = document.querySelectorAll('a[href*="/evento/"], .EventCard, .event-card, h1 a, h2 a, h3 a');
        
        elements.forEach((el, index) => {
          if (index >= 15) return; // Limitar
          
          let title = '';
          let url = '';
          
          if (el.tagName === 'A') {
            title = el.textContent?.trim();
            url = el.href;
          } else {
            const link = el.querySelector('a[href*="/evento/"]') || el.querySelector('a');
            if (link) {
              title = link.textContent?.trim();
              url = link.href;
            }
          }
          
          if (title && title.length > 5 && !title.includes('undefined')) {
            events.push({
              title: title,
              url: url || 'https://sympla.com.br',
              source: 'sympla'
            });
          }
        });
        
        return events;
      });

      console.log(chalk.blue(`Encontrados: ${symplaEvents.length} eventos`));

      // Salvar eventos do Sympla
      for (const event of symplaEvents.slice(0, 10)) {
        const eventData = {
          title: event.title,
          description: 'Evento real encontrado no Sympla',
          date: new Date().toISOString(),
          location: {
            venue: 'Local não especificado',
            address: 'São Paulo, SP',
            city: 'São Paulo',
            state: 'SP'
          },
          price: { min: 0, max: 0, currency: 'BRL' },
          category: 'Geral',
          source: 'sympla',
          url: event.url,
          organizer: 'Não especificado'
        };

        try {
          const result = await storage.saveEvent(eventData);
          if (result.action === 'created') {
            totalSaved++;
            console.log(chalk.green(`✅ ${event.title.substring(0, 40)}...`));
          } else {
            console.log(chalk.yellow(`⏭️  ${event.title.substring(0, 40)}... (já existe)`));
          }
        } catch (error) {
          console.log(chalk.red(`❌ Erro: ${error.message}`));
        }
      }

    } catch (error) {
      console.log(chalk.red(`❌ Erro Sympla: ${error.message}`));
    }

    // Resultados
    console.log(chalk.cyan('\n📊 Resultados:'));
    console.log(chalk.cyan('═'.repeat(20)));
    console.log(chalk.green(`✅ Eventos reais salvos: ${totalSaved}`));

    if (totalSaved > 0) {
      console.log(chalk.green('\n🎉 SUCESSO! Eventos reais foram encontrados!'));
      console.log(chalk.gray('Os dados são reais dos sites Eventbrite e Sympla.'));
      
      // Mostrar estatísticas do banco
      try {
        const stats = await storage.getEventStats();
        console.log(chalk.blue(`\n📊 Total no banco: ${stats.total} eventos`));
        if (stats.bySource) {
          Object.entries(stats.bySource).forEach(([source, count]) => {
            console.log(chalk.gray(`  • ${source}: ${count} eventos`));
          });
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️  Não foi possível obter estatísticas'));
      }
    } else {
      console.log(chalk.yellow('\n⚠️  Nenhum evento novo foi salvo'));
      console.log(chalk.gray('Todos os eventos podem já existir no banco.'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Erro:'), error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  scrapeRealEvents().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = scrapeRealEvents;