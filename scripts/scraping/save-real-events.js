#!/usr/bin/env node

/**
 * Salvar Eventos Reais - Versão Compatível
 * Funciona com a estrutura atual da tabela
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SupabaseStorage = require('./storage/supabase-storage');

async function saveRealEvents() {
  console.log(chalk.cyan('\n🎫 Salvando Eventos Reais'));
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

    // Buscar no Sympla (que está funcionando)
    console.log(chalk.yellow('\n🎪 Buscando eventos reais no Sympla...'));
    
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
          if (index >= 10) return; // Limitar a 10
          
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
          
          if (title && title.length > 5 && !title.includes('undefined') && !title.includes('null')) {
            events.push({
              title: title,
              url: url || 'https://sympla.com.br',
              source: 'sympla'
            });
          }
        });
        
        return events;
      });

      console.log(chalk.blue(`Encontrados: ${symplaEvents.length} eventos reais`));

      // Salvar eventos com estrutura simples
      for (const event of symplaEvents) {
        // Estrutura mínima que deve funcionar
        const eventData = {
          title: event.title,
          description: 'Evento real encontrado no Sympla',
          date: new Date().toISOString(),
          category: 'Geral',
          source: 'sympla',
          url: event.url,
          organizer: 'Não especificado'
        };

        try {
          const result = await storage.saveEvent(eventData);
          if (result.action === 'created') {
            totalSaved++;
            console.log(chalk.green(`✅ ${event.title.substring(0, 50)}...`));
          } else {
            console.log(chalk.yellow(`⏭️  ${event.title.substring(0, 50)}... (já existe)`));
          }
        } catch (error) {
          console.log(chalk.red(`❌ ${error.message}`));
          
          // Se ainda der erro, tentar com estrutura ainda mais simples
          try {
            const simpleEventData = {
              title: event.title,
              url: event.url,
              source: 'sympla'
            };
            
            const result2 = await storage.saveEvent(simpleEventData);
            if (result2.action === 'created') {
              totalSaved++;
              console.log(chalk.green(`✅ (simples) ${event.title.substring(0, 50)}...`));
            }
          } catch (error2) {
            console.log(chalk.red(`❌ Erro mesmo com estrutura simples: ${error2.message}`));
          }
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
      console.log(chalk.green('\n🎉 SUCESSO! Eventos reais foram salvos!'));
      console.log(chalk.gray('Os dados são reais do site Sympla.'));
      
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
      console.log(chalk.gray('Pode haver problema com a estrutura da tabela.'));
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
  saveRealEvents().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = saveRealEvents;