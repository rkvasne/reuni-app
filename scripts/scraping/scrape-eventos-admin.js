#!/usr/bin/env node

/**
 * Scraper para Tabela "eventos" - Modo Admin
 * Usa service role para contornar RLS
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function scrapeEventosAdmin() {
  console.log(chalk.cyan('\n🎫 Scraping Eventos (Modo Admin)'));
  console.log(chalk.cyan('═'.repeat(35)));

  // Verificar se temos service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(chalk.red('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local'));
    console.log(chalk.yellow('\n💡 Soluções:'));
    console.log(chalk.gray('1. Adicione SUPABASE_SERVICE_ROLE_KEY no .env.local'));
    console.log(chalk.gray('2. Ou desabilite RLS na tabela "eventos" no Supabase'));
    console.log(chalk.gray('3. Ou configure políticas RLS para permitir inserções'));
    return;
  }

  // Usar service role key para contornar RLS
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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
        if (index >= 10) return; // Limitar a 10 para teste
        
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

    // Salvar na tabela "eventos" usando service role
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

        // Salvar evento com service role
        const { data, error } = await supabase
          .from('eventos')
          .insert([eventoData])
          .select()
          .single();

        if (error) {
          console.log(chalk.red(`❌ Erro: ${error.message}`));
        } else {
          totalSaved++;
          console.log(chalk.green(`✅ ${event.title.substring(0, 50)}...`));
        }

      } catch (error) {
        console.log(chalk.red(`❌ Erro: ${error.message}`));
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
      } catch (error) {
        console.log(chalk.yellow('⚠️  Não foi possível obter estatísticas'));
      }
    } else {
      console.log(chalk.yellow('\n⚠️  Nenhum evento novo foi salvo'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Erro no scraping:'), error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  scrapeEventosAdmin().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = scrapeEventosAdmin;