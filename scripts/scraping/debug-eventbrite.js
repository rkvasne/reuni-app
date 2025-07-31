#!/usr/bin/env node

/**
 * Debug do Eventbrite
 * Testa acesso direto ao site para verificar estrutura
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

async function debugEventbrite() {
  console.log(chalk.cyan('\n🔍 Debug do Eventbrite'));
  console.log(chalk.cyan('═'.repeat(30)));

  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, // Mostrar browser para debug
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(chalk.yellow('🌐 Acessando Eventbrite...'));
    
    // Tentar acessar página de eventos de São Paulo
    const url = 'https://www.eventbrite.com.br/d/brazil--s%C3%A3o-paulo/events/';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log(chalk.green('✅ Página carregada'));
    
    // Aguardar um pouco para carregar conteúdo dinâmico
    await page.waitForTimeout(3000);
    
    // Tentar encontrar elementos de eventos
    console.log(chalk.yellow('🔍 Procurando elementos de eventos...'));
    
    // Testar diferentes seletores
    const selectors = [
      '[data-testid="event-card"]',
      '.event-card',
      '.search-event-card',
      '[data-spec="search-event-card"]',
      '.event-listing-card',
      '.event-item',
      'article',
      '[role="article"]'
    ];
    
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        console.log(chalk.blue(`${selector}: ${elements.length} elementos encontrados`));
        
        if (elements.length > 0) {
          // Tentar extrair informações do primeiro elemento
          const firstElement = elements[0];
          
          try {
            const text = await firstElement.evaluate(el => el.textContent?.substring(0, 100));
            console.log(chalk.gray(`  Texto: ${text}...`));
          } catch (e) {
            console.log(chalk.gray('  Não foi possível extrair texto'));
          }
        }
      } catch (error) {
        console.log(chalk.red(`${selector}: Erro - ${error.message}`));
      }
    }
    
    // Tentar pegar o HTML da página para análise
    console.log(chalk.yellow('\n📄 Salvando HTML da página...'));
    const html = await page.content();
    
    // Procurar por padrões comuns
    const patterns = [
      /event-card/gi,
      /event-title/gi,
      /event-date/gi,
      /data-testid/gi,
      /data-spec/gi
    ];
    
    for (const pattern of patterns) {
      const matches = html.match(pattern);
      console.log(chalk.blue(`${pattern}: ${matches ? matches.length : 0} ocorrências`));
    }
    
    console.log(chalk.green('\n✅ Debug concluído'));
    console.log(chalk.gray('Verifique o browser aberto para ver a página'));
    console.log(chalk.gray('Pressione Enter para fechar...'));
    
    // Aguardar input do usuário
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Erro no debug:'), error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  debugEventbrite();
}

module.exports = debugEventbrite;