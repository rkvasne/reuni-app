#!/usr/bin/env node

/**
 * Scraper para Tabela "eventos"
 * Salva eventos reais na tabela eventos com a estrutura correta
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function scrapeEventos() {
  console.log(chalk.cyan('\n🎫 Buscando Eventos Reais para Tabela "eventos"'));
  console.log(chalk.cyan('═'.repeat(45)));

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  let browser;
  let totalSaved = 0;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Buscar eventos no Sympla
    console.log(chalk.yellow('🎪 Buscando eventos reais no Sympla...'));
    
    await page.goto('https://www.sympla.com.br/eventos/sao-paulo-sp', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);

    const symplaEvents = await page.evaluate(() => {
      const events = [];
      const elements = document.querySelectorAll('a[href*="/evento/"], .EventCard, .event-card, h1 a, h2 a, h3 a');
      
      elements.forEach((el, index) => {
        if (index >= 15) return; // Limitar a 15
        
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

    // Salvar na tabela "eventos" com estrutura correta
    for (const event of symplaEvents) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('eventos')
          .select('id')
          .eq('external_url', event.url)
          .single();

        if (existing) {
          console.log(chalk.yellow(`⏭️  ${event.title.substring(0, 40)}... (já existe)`));
          continue;
        }

        // Preparar dados conforme estrutura da tabela
        const eventoData = {
          titulo: event.title,
          descricao: 'Evento real encontrado no Sympla via scraping',
          data: new Date().toISOString().split('T')[0], // Apenas data (YYYY-MM-DD)
          hora: '19:00:00', // Hora padrão
          local: 'São Paulo, SP',
          categoria: 'Geral',
          imagem_url: null,
          organizador_id: null,
          comunidade_id: null,
          max_participantes: null,
          source: 'sympla',
          external_url: event.url
        };

        // Salvar evento
        const { data, error } = await supabase
          .from('eventos')
          .insert([eventoData])
          .select()
          .single();

        if (error) {
          console.log(chalk.red(`❌ Erro ao salvar "${event.title.substring(0, 30)}...": ${error.message}`));
        } else {
          totalSaved++;
          console.log(chalk.green(`✅ ${event.title.substring(0, 50)}...`));
        }

      } catch (error) {
        console.log(chalk.red(`❌ Erro ao processar "${event.title.substring(0, 30)}...": ${error.message}`));
      }
    }

    // Mostrar estatísticas finais
    console.log(chalk.cyan('\n📊 Resultados:'));
    console.log(chalk.cyan('═'.repeat(20)));
    console.log(chalk.green(`✅ Eventos reais salvos: ${totalSaved}`));

    if (totalSaved > 0) {
      console.log(chalk.green('\n🎉 SUCESSO! Eventos reais salvos na tabela "eventos"!'));
      
      // Mostrar total na tabela
      try {
        const { count } = await supabase
          .from('eventos')
          .select('*', { count: 'exact', head: true });

        console.log(chalk.blue(`📊 Total na tabela "eventos": ${count} eventos`));

        // Mostrar por fonte
        const { data: bySource } = await supabase
          .from('eventos')
          .select('source')
          .not('source', 'is', null);

        if (bySource && bySource.length > 0) {
          const sourceStats = {};
          bySource.forEach(item => {
            sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
          });

          console.log(chalk.blue('\n📈 Por fonte:'));
          Object.entries(sourceStats).forEach(([source, count]) => {
            console.log(chalk.gray(`  • ${source}: ${count} eventos`));
          });
        }

      } catch (error) {
        console.log(chalk.yellow('⚠️  Não foi possível obter estatísticas'));
      }
    } else {
      console.log(chalk.yellow('\n⚠️  Nenhum evento novo foi salvo'));
      console.log(chalk.gray('Todos os eventos podem já existir na tabela.'));
    }

    console.log(chalk.gray('\n💡 Para buscar mais eventos, execute novamente este script.'));

  } catch (error) {
    console.error(chalk.red('\n❌ Erro no scraping:'), error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  scrapeEventos().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = scrapeEventos;