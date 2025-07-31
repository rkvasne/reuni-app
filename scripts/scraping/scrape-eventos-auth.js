#!/usr/bin/env node

/**
 * Scraper para Tabela "eventos" - Com Autenticação
 * Usa login de usuário para respeitar RLS
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const path = require('path');
const readline = require('readline');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function scrapeEventosAuth() {
  console.log(chalk.cyan('\n🎫 Scraping Eventos com Autenticação'));
  console.log(chalk.cyan('═'.repeat(40)));

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // 1. Fazer login do usuário
    console.log(chalk.yellow('🔐 Autenticação necessária para acessar a tabela "eventos"'));
    
    const email = await question('Email: ');
    const password = await question('Senha: ');
    
    console.log(chalk.gray('\nFazendo login...'));
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.log(chalk.red(`❌ Erro de autenticação: ${authError.message}`));
      rl.close();
      return;
    }

    console.log(chalk.green(`✅ Login realizado com sucesso! Usuário: ${authData.user.email}`));

    // 2. Buscar eventos com Puppeteer
    console.log(chalk.yellow('\n🎪 Buscando eventos reais no Sympla...'));
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

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

    await browser.close();

    console.log(chalk.blue(`Encontrados: ${symplaEvents.length} eventos reais`));

    // 3. Salvar na tabela "eventos" com usuário autenticado
    let totalSaved = 0;

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
          organizador_id: authData.user.id, // ID do usuário logado
          comunidade_id: null,
          max_participantes: null,
          source: 'sympla',
          external_url: event.url
        };

        // Salvar evento com usuário autenticado
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

    // 4. Mostrar estatísticas finais
    console.log(chalk.cyan('\n📊 Resultados:'));
    console.log(chalk.cyan('═'.repeat(20)));
    console.log(chalk.green(`✅ Eventos reais salvos: ${totalSaved}`));

    if (totalSaved > 0) {
      console.log(chalk.green('\n🎉 SUCESSO! Eventos reais salvos na tabela "eventos"!'));
      
      // Mostrar total na tabela (apenas eventos do usuário logado)
      try {
        const { count } = await supabase
          .from('eventos')
          .select('*', { count: 'exact', head: true });

        console.log(chalk.blue(`📊 Total na tabela "eventos": ${count} eventos`));

        // Mostrar eventos por fonte
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

    // 5. Fazer logout
    await supabase.auth.signOut();
    console.log(chalk.gray('\n👋 Logout realizado'));

  } catch (error) {
    console.error(chalk.red('\n❌ Erro no scraping:'), error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  scrapeEventosAuth().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = scrapeEventosAuth;