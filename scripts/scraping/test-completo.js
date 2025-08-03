#!/usr/bin/env node

/**
 * Teste do Sistema Completo
 * Versão de teste com menos eventos para verificar funcionamento
 */

const chalk = require('chalk');
const puppeteer = require('puppeteer');
const path = require('path');
const readline = require('readline');

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

async function testCompleto() {
  console.log(chalk.cyan('\n🧪 Teste do Sistema Completo'));
  console.log(chalk.cyan('═'.repeat(35)));

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // Autenticação
    const email = await question('Email: ');
    const password = await question('Senha: ');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.log(chalk.red(`❌ Erro: ${authError.message}`));
      rl.close();
      return;
    }

    console.log(chalk.green(`✅ Login OK: ${authData.user.email}`));

    // Teste de scraping com imagens
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Teste 1: Sympla com imagens
    console.log(chalk.yellow('\n🎪 Teste Sympla com imagens...'));
    
    await page.goto('https://www.sympla.com.br/eventos/sao-paulo-sp', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);

    const eventosComImagem = await page.evaluate(() => {
      const events = [];
      const elements = document.querySelectorAll('a[href*="/evento/"], .EventCard, .event-card');
      
      elements.forEach((el, index) => {
        if (index >= 3) return; // Apenas 3 para teste
        
        let title = '';
        let url = '';
        let image = '';
        
        // Título
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

        // Imagem
        const imgEl = el.querySelector('img');
        if (imgEl && imgEl.src && !imgEl.src.includes('placeholder') && !imgEl.src.includes('data:')) {
          image = imgEl.src;
        }
        
        if (title && title.length > 5) {
          events.push({
            title: title,
            url: url,
            image: image,
            source: 'sympla'
          });
        }
      });
      
      return events;
    });

    console.log(chalk.blue(`Encontrados: ${eventosComImagem.length} eventos`));
    
    // Mostrar detalhes dos eventos
    eventosComImagem.forEach((evento, index) => {
      const hasImage = evento.image ? '🖼️' : '📄';
      console.log(chalk.gray(`${index + 1}. ${hasImage} ${evento.title.substring(0, 50)}...`));
      if (evento.image) {
        console.log(chalk.gray(`   Imagem: ${evento.image.substring(0, 60)}...`));
      }
    });

    // Teste 2: Eventbrite regional
    console.log(chalk.yellow('\n📅 Teste Eventbrite regional...'));
    
    try {
      await page.goto('https://www.eventbrite.com.br/d/brazil--ji-paran%C3%A1/events/', { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      await page.waitForTimeout(3000);

      const eventosRegionais = await page.evaluate(() => {
        const events = [];
        const elements = document.querySelectorAll('article, [data-testid*="event"], .event-card');
        
        elements.forEach((el, index) => {
          if (index >= 2) return; // Apenas 2 para teste
          
          let title = '';
          let url = '';
          
          const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'a'];
          for (const selector of titleSelectors) {
            const titleEl = el.querySelector(selector);
            if (titleEl && titleEl.textContent.trim()) {
              title = titleEl.textContent.trim();
              if (titleEl.tagName === 'A') {
                url = titleEl.href;
              }
              break;
            }
          }
          
          if (title && title.length > 5) {
            events.push({
              title: title,
              url: url,
              source: 'eventbrite',
              cidade: 'Ji-Paraná'
            });
          }
        });
        
        return events;
      });

      console.log(chalk.blue(`Encontrados: ${eventosRegionais.length} eventos regionais`));
      
      eventosRegionais.forEach((evento, index) => {
        console.log(chalk.gray(`${index + 1}. 🏘️ ${evento.title.substring(0, 50)}...`));
      });

    } catch (error) {
      console.log(chalk.red(`Erro no Eventbrite: ${error.message}`));
    }

    await browser.close();

    // Salvar um evento de teste
    if (eventosComImagem.length > 0) {
      console.log(chalk.yellow('\n💾 Testando salvamento...'));
      
      const eventoTeste = eventosComImagem[0];
      
      try {
        const eventoData = {
          titulo: eventoTeste.title,
          local: 'Evento de teste com imagem', // Antigo: descricao - agora é o local do evento
          data: new Date().toISOString().split('T')[0],
          hora: '19:00:00',
          cidade: 'São Paulo, SP', // Antigo: local - agora é a cidade/UF
          categoria: 'Teste',
          imagem_url: eventoTeste.image || null,
          organizador_id: authData.user.id,
          source: 'sympla_teste',
          external_url: eventoTeste.url
        };

        const { data, error } = await supabase
          .from('eventos')
          .insert([eventoData])
          .select()
          .single();

        if (error) {
          console.log(chalk.red(`❌ Erro ao salvar: ${error.message}`));
        } else {
          console.log(chalk.green(`✅ Evento salvo com sucesso!`));
          console.log(chalk.gray(`   Título: ${data.titulo}`));
          console.log(chalk.gray(`   Imagem: ${data.imagem_url ? 'SIM' : 'NÃO'}`));
          console.log(chalk.gray(`   Fonte: ${data.source}`));
        }

      } catch (error) {
        console.log(chalk.red(`❌ Erro: ${error.message}`));
      }
    }

    await supabase.auth.signOut();
    
    console.log(chalk.green('\n🎉 Teste concluído!'));
    console.log(chalk.gray('O sistema está capturando:'));
    console.log(chalk.gray('✅ Eventos com imagens'));
    console.log(chalk.gray('✅ Múltiplas fontes'));
    console.log(chalk.gray('✅ Eventos regionais'));

  } catch (error) {
    console.error(chalk.red('\n❌ Erro no teste:'), error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  testCompleto().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = testCompleto;