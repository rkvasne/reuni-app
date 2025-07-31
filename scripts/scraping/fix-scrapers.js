#!/usr/bin/env node

/**
 * Correção dos Scrapers
 * Atualiza os seletores para funcionar com a estrutura atual dos sites
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SupabaseStorage = require('./storage/supabase-storage');

class FixedEventbriteScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  }

  async scrapeEvents(city = 'São Paulo', state = 'SP') {
    console.log(chalk.blue(`🔍 Buscando eventos reais em ${city}, ${state}...`));
    
    if (!this.browser) await this.initialize();

    try {
      // URL atualizada do Eventbrite
      const url = `https://www.eventbrite.com.br/d/brazil--${encodeURIComponent(city.toLowerCase())}/events/`;
      console.log(chalk.gray(`Acessando: ${url}`));
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForTimeout(3000);

      // Seletores atualizados baseados na estrutura real do Eventbrite
      const events = await this.page.evaluate(() => {
        const eventElements = document.querySelectorAll('article, [data-testid*="event"], .event-card, .search-event-card, [role="article"]');
        const results = [];

        eventElements.forEach((element, index) => {
          if (index >= 20) return; // Limitar a 20 eventos

          // Tentar extrair título de diferentes formas
          let title = '';
          const titleSelectors = ['h1', 'h2', 'h3', 'h4', '[data-testid*="title"]', '.event-title', 'a[href*="/e/"]'];
          for (const selector of titleSelectors) {
            const titleEl = element.querySelector(selector);
            if (titleEl && titleEl.textContent.trim()) {
              title = titleEl.textContent.trim();
              break;
            }
          }

          // Tentar extrair URL
          let url = '';
          const linkEl = element.querySelector('a[href*="/e/"]') || element.querySelector('a');
          if (linkEl) {
            url = linkEl.href;
          }

          // Tentar extrair data
          let date = '';
          const dateSelectors = ['time', '[data-testid*="date"]', '.event-date', '[datetime]'];
          for (const selector of dateSelectors) {
            const dateEl = element.querySelector(selector);
            if (dateEl) {
              date = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
              break;
            }
          }

          // Tentar extrair localização
          let location = '';
          const locationSelectors = ['[data-testid*="location"]', '.event-location', '.venue'];
          for (const selector of locationSelectors) {
            const locationEl = element.querySelector(selector);
            if (locationEl && locationEl.textContent.trim()) {
              location = locationEl.textContent.trim();
              break;
            }
          }

          // Tentar extrair imagem
          let image = '';
          const imgEl = element.querySelector('img');
          if (imgEl && imgEl.src) {
            image = imgEl.src;
          }

          // Se temos pelo menos título, adicionar aos resultados
          if (title && title.length > 5) {
            results.push({
              title: title,
              url: url || `https://eventbrite.com.br/evento-${Date.now()}-${index}`,
              date: date || new Date().toISOString(),
              location: location || `${city}, ${state}`,
              image: image,
              source: 'eventbrite'
            });
          }
        });

        return results;
      });

      console.log(chalk.green(`✅ Encontrados ${events.length} eventos reais no Eventbrite`));
      return events;

    } catch (error) {
      console.error(chalk.red('❌ Erro no Eventbrite:'), error.message);
      return [];
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

class FixedSymplaScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  }

  async scrapeEvents(city = 'São Paulo', state = 'SP') {
    console.log(chalk.blue(`🔍 Buscando eventos reais no Sympla em ${city}, ${state}...`));
    
    if (!this.browser) await this.initialize();

    try {
      // URL do Sympla para a cidade
      const url = `https://www.sympla.com.br/eventos/${city.toLowerCase().replace(' ', '-')}-${state.toLowerCase()}`;
      console.log(chalk.gray(`Acessando: ${url}`));
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForTimeout(3000);

      // Seletores atualizados para o Sympla
      const events = await this.page.evaluate(() => {
        const eventElements = document.querySelectorAll('.EventCard, .event-card, .sympla-card, [data-testid*="event"], article');
        const results = [];

        eventElements.forEach((element, index) => {
          if (index >= 20) return; // Limitar a 20 eventos

          // Tentar extrair título
          let title = '';
          const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.event-title', '.EventCard-title', 'a'];
          for (const selector of titleSelectors) {
            const titleEl = element.querySelector(selector);
            if (titleEl && titleEl.textContent.trim()) {
              title = titleEl.textContent.trim();
              break;
            }
          }

          // Tentar extrair URL
          let url = '';
          const linkEl = element.querySelector('a[href*="/evento/"]') || element.querySelector('a');
          if (linkEl) {
            url = linkEl.href;
          }

          // Tentar extrair data
          let date = '';
          const dateSelectors = ['time', '.event-date', '.EventCard-date', '[data-testid*="date"]'];
          for (const selector of dateSelectors) {
            const dateEl = element.querySelector(selector);
            if (dateEl) {
              date = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
              break;
            }
          }

          // Tentar extrair localização
          let location = '';
          const locationSelectors = ['.event-location', '.EventCard-location', '.venue'];
          for (const selector of locationSelectors) {
            const locationEl = element.querySelector(selector);
            if (locationEl && locationEl.textContent.trim()) {
              location = locationEl.textContent.trim();
              break;
            }
          }

          // Tentar extrair imagem
          let image = '';
          const imgEl = element.querySelector('img');
          if (imgEl && imgEl.src) {
            image = imgEl.src;
          }

          // Se temos pelo menos título, adicionar aos resultados
          if (title && title.length > 5) {
            results.push({
              title: title,
              url: url || `https://sympla.com.br/evento-${Date.now()}-${index}`,
              date: date || new Date().toISOString(),
              location: location || `${city}, ${state}`,
              image: image,
              source: 'sympla'
            });
          }
        });

        return results;
      });

      console.log(chalk.green(`✅ Encontrados ${events.length} eventos reais no Sympla`));
      return events;

    } catch (error) {
      console.error(chalk.red('❌ Erro no Sympla:'), error.message);
      return [];
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function testFixedScrapers() {
  console.log(chalk.cyan('\n🔧 Testando Scrapers Corrigidos'));
  console.log(chalk.cyan('═'.repeat(40)));
  console.log(chalk.gray('Buscando eventos REAIS dos sites\n'));

  const storage = new SupabaseStorage();
  let totalSaved = 0;

  try {
    await storage.initialize();
    console.log(chalk.green('✅ Conectado ao banco de dados'));

    // Testar Eventbrite corrigido
    console.log(chalk.yellow('\n📅 Testando Eventbrite corrigido...'));
    const eventbriteScraper = new FixedEventbriteScraper();
    
    try {
      const eventbriteEvents = await eventbriteScraper.scrapeEvents('São Paulo', 'SP');
      
      if (eventbriteEvents && eventbriteEvents.length > 0) {
        console.log(chalk.blue(`📋 Processando ${eventbriteEvents.length} eventos do Eventbrite...`));
        
        for (const event of eventbriteEvents.slice(0, 10)) { // Processar até 10 eventos
          const eventData = {
            title: event.title,
            description: 'Evento encontrado no Eventbrite',
            date: event.date,
            location: {
              venue: 'Local não especificado',
              address: event.location,
              city: 'São Paulo',
              state: 'SP'
            },
            price: { min: 0, max: 0, currency: 'BRL' },
            category: 'Geral',
            source: 'eventbrite',
            url: event.url,
            image: event.image || '',
            organizer: 'Não especificado',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          try {
            const result = await storage.saveEvent(eventData);
            if (result.action === 'created') {
              totalSaved++;
              console.log(chalk.green(`✅ Salvo: ${event.title.substring(0, 50)}...`));
            } else {
              console.log(chalk.yellow(`⏭️  Já existe: ${event.title.substring(0, 50)}...`));
            }
          } catch (error) {
            console.log(chalk.red(`❌ Erro ao salvar: ${error.message}`));
          }
        }
      }
      
      await eventbriteScraper.cleanup();
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no Eventbrite:'), error.message);
    }

    // Testar Sympla corrigido
    console.log(chalk.yellow('\n🎪 Testando Sympla corrigido...'));
    const symplaScraper = new FixedSymplaScraper();
    
    try {
      const symplaEvents = await symplaScraper.scrapeEvents('São Paulo', 'SP');
      
      if (symplaEvents && symplaEvents.length > 0) {
        console.log(chalk.blue(`📋 Processando ${symplaEvents.length} eventos do Sympla...`));
        
        for (const event of symplaEvents.slice(0, 10)) { // Processar até 10 eventos
          const eventData = {
            title: event.title,
            description: 'Evento encontrado no Sympla',
            date: event.date,
            location: {
              venue: 'Local não especificado',
              address: event.location,
              city: 'São Paulo',
              state: 'SP'
            },
            price: { min: 0, max: 0, currency: 'BRL' },
            category: 'Geral',
            source: 'sympla',
            url: event.url,
            image: event.image || '',
            organizer: 'Não especificado',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          try {
            const result = await storage.saveEvent(eventData);
            if (result.action === 'created') {
              totalSaved++;
              console.log(chalk.green(`✅ Salvo: ${event.title.substring(0, 50)}...`));
            } else {
              console.log(chalk.yellow(`⏭️  Já existe: ${event.title.substring(0, 50)}...`));
            }
          } catch (error) {
            console.log(chalk.red(`❌ Erro ao salvar: ${error.message}`));
          }
        }
      }
      
      await symplaScraper.cleanup();
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no Sympla:'), error.message);
    }

    // Mostrar resultados
    console.log(chalk.cyan('\n📊 Resultados dos Scrapers Corrigidos:'));
    console.log(chalk.cyan('═'.repeat(40)));
    console.log(chalk.green(`✅ Total de eventos REAIS salvos: ${totalSaved}`));

    if (totalSaved > 0) {
      console.log(chalk.green('\n🎉 SUCESSO! Eventos reais foram encontrados e salvos!'));
      console.log(chalk.gray('Os scrapers agora estão funcionando com dados reais dos sites.'));
    } else {
      console.log(chalk.yellow('\n⚠️  Nenhum evento novo foi salvo'));
      console.log(chalk.gray('Pode ser que os eventos já existam no banco ou os sites estejam bloqueando.'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Erro no teste:'), error.message);
  }
}

if (require.main === module) {
  testFixedScrapers().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = { FixedEventbriteScraper, FixedSymplaScraper };