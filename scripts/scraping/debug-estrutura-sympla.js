#!/usr/bin/env node

/**
 * Debug da Estrutura do Sympla
 * Analisa a estrutura HTML atual dos cards
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

async function debugSymplaStructure() {
  console.log(chalk.blue('🔍 Debug da Estrutura do Sympla'));
  console.log('═'.repeat(50));
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto('https://www.sympla.com.br/eventos/ji-parana-ro', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Analisa a estrutura do primeiro card
    const cardStructure = await page.evaluate(() => {
      const card = document.querySelector('.sympla-card');
      if (!card) return null;
      
      // Função para extrair informações de um elemento
      function analyzeElement(element, depth = 0) {
        if (depth > 3) return null; // Limita profundidade
        
        const info = {
          tagName: element.tagName,
          className: element.className,
          textContent: element.textContent ? element.textContent.trim().substring(0, 100) : '',
          attributes: {},
          children: []
        };
        
        // Captura atributos importantes
        ['href', 'src', 'alt', 'data-testid', 'id'].forEach(attr => {
          if (element.hasAttribute(attr)) {
            info.attributes[attr] = element.getAttribute(attr);
          }
        });
        
        // Analisa filhos
        Array.from(element.children).forEach(child => {
          const childInfo = analyzeElement(child, depth + 1);
          if (childInfo) {
            info.children.push(childInfo);
          }
        });
        
        return info;
      }
      
      return {
        fullHTML: card.outerHTML,
        structure: analyzeElement(card),
        allText: card.textContent.trim()
      };
    });
    
    if (cardStructure) {
      console.log(chalk.green('✅ Estrutura do primeiro card encontrada:'));
      console.log('');
      
      // Mostra o HTML completo (primeiros 500 chars)
      console.log(chalk.yellow('📄 HTML completo (primeiros 500 chars):'));
      console.log(chalk.gray(cardStructure.fullHTML.substring(0, 500) + '...'));
      console.log('');
      
      // Mostra todo o texto do card
      console.log(chalk.yellow('📝 Texto completo do card:'));
      console.log(chalk.white(cardStructure.allText));
      console.log('');
      
      // Função para imprimir estrutura de forma legível
      function printStructure(element, indent = 0) {
        const spaces = '  '.repeat(indent);
        const tag = element.tagName.toLowerCase();
        const classes = element.className ? ` class="${element.className}"` : '';
        const text = element.textContent ? ` [${element.textContent.substring(0, 50)}...]` : '';
        
        console.log(chalk.blue(`${spaces}<${tag}${classes}>${text}`));
        
        element.children.forEach(child => {
          printStructure(child, indent + 1);
        });
      }
      
      console.log(chalk.yellow('🏗️ Estrutura hierárquica:'));
      printStructure(cardStructure.structure);
      
    } else {
      console.log(chalk.red('❌ Nenhum card encontrado'));
    }
    
    // Agora vamos procurar especificamente por elementos que podem conter data e local
    console.log(chalk.yellow('\n🔍 Procurando elementos com data e local...'));
    
    const dateLocationElements = await page.evaluate(() => {
      const card = document.querySelector('.sympla-card');
      if (!card) return [];
      
      const results = [];
      const allElements = card.querySelectorAll('*');
      
      allElements.forEach((el, index) => {
        const text = el.textContent.trim();
        
        // Verifica se pode ser data (contém números e mês)
        const isDate = /\d+.*(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(text);
        
        // Verifica se pode ser local (contém cidade ou endereço)
        const isLocation = /(?:rua|av|avenida|praça|centro|bairro|cidade|ji-paraná|porto velho|rondônia|ro)/i.test(text);
        
        if (isDate || isLocation || text.includes('às') || text.includes(',')) {
          results.push({
            index,
            tagName: el.tagName,
            className: el.className,
            text: text.substring(0, 100),
            isDate,
            isLocation,
            parent: el.parentElement ? el.parentElement.className : ''
          });
        }
      });
      
      return results.slice(0, 10); // Limita a 10 resultados
    });
    
    dateLocationElements.forEach(el => {
      const type = el.isDate ? '📅 DATA' : el.isLocation ? '📍 LOCAL' : '📝 TEXTO';
      console.log(chalk.green(`${type}: ${el.text}`));
      console.log(chalk.gray(`  Tag: ${el.tagName}, Class: ${el.className}, Parent: ${el.parent}`));
      console.log('');
    });
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro: ${error.message}`));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log(chalk.blue('🎯 Debug concluído!'));
}

debugSymplaStructure().catch(console.error);