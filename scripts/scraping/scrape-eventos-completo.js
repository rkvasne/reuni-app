#!/usr/bin/env node

/**
 * Scraper Completo para Eventos
 * - Múltiplas fontes (Sympla, Eventbrite, sites regionais)
 * - Captura de imagens
 * - Foco em eventos regionais (Ji-Paraná/RO)
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

class EventoScraperCompleto {
  constructor(supabase, userId) {
    this.supabase = supabase;
    this.userId = userId;
    this.browser = null;
    this.totalSaved = 0;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Scraper do Sympla com imagens e regiões
  async scrapeSymplaRegional() {
    console.log(chalk.yellow('\n🎪 Buscando no Sympla (Regional)...'));
    
    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const regioes = [
      // Rondônia - Cobertura completa do estado
      { nome: 'Ji-Paraná', url: 'https://www.sympla.com.br/eventos/ji-parana-ro' },
      { nome: 'Porto Velho', url: 'https://www.sympla.com.br/eventos/porto-velho-ro' },
      { nome: 'Ariquemes', url: 'https://www.sympla.com.br/eventos/ariquemes-ro' },
      { nome: 'Cacoal', url: 'https://www.sympla.com.br/eventos/cacoal-ro' },
      { nome: 'Vilhena', url: 'https://www.sympla.com.br/eventos/vilhena-ro' },
      { nome: 'Rolim de Moura', url: 'https://www.sympla.com.br/eventos/rolim-de-moura-ro' },
      { nome: 'Jaru', url: 'https://www.sympla.com.br/eventos/jaru-ro' },
      { nome: 'Ouro Preto do Oeste', url: 'https://www.sympla.com.br/eventos/ouro-preto-do-oeste-ro' },
      { nome: 'Guajará-Mirim', url: 'https://www.sympla.com.br/eventos/guajara-mirim-ro' },
      { nome: 'Presidente Médici', url: 'https://www.sympla.com.br/eventos/presidente-medici-ro' },
      { nome: 'Candeias do Jamari', url: 'https://www.sympla.com.br/eventos/candeias-do-jamari-ro' },
      { nome: 'Pimenta Bueno', url: 'https://www.sympla.com.br/eventos/pimenta-bueno-ro' },
      { nome: 'Espigão do Oeste', url: 'https://www.sympla.com.br/eventos/espigao-do-oeste-ro' },
      { nome: 'Alta Floresta do Oeste', url: 'https://www.sympla.com.br/eventos/alta-floresta-do-oeste-ro' },
      { nome: 'Rondônia', url: 'https://www.sympla.com.br/eventos/rondonia' },
      
      // Capitais brasileiras
      { nome: 'São Paulo', url: 'https://www.sympla.com.br/eventos/sao-paulo-sp' },
      { nome: 'Rio de Janeiro', url: 'https://www.sympla.com.br/eventos/rio-de-janeiro-rj' },
      { nome: 'Brasília', url: 'https://www.sympla.com.br/eventos/brasilia-df' },
      { nome: 'Salvador', url: 'https://www.sympla.com.br/eventos/salvador-ba' },
      { nome: 'Fortaleza', url: 'https://www.sympla.com.br/eventos/fortaleza-ce' },
      { nome: 'Belo Horizonte', url: 'https://www.sympla.com.br/eventos/belo-horizonte-mg' },
      { nome: 'Manaus', url: 'https://www.sympla.com.br/eventos/manaus-am' },
      { nome: 'Curitiba', url: 'https://www.sympla.com.br/eventos/curitiba-pr' },
      { nome: 'Recife', url: 'https://www.sympla.com.br/eventos/recife-pe' },
      { nome: 'Goiânia', url: 'https://www.sympla.com.br/eventos/goiania-go' },
      { nome: 'Belém', url: 'https://www.sympla.com.br/eventos/belem-pa' },
      { nome: 'Porto Alegre', url: 'https://www.sympla.com.br/eventos/porto-alegre-rs' },
      { nome: 'São Luís', url: 'https://www.sympla.com.br/eventos/sao-luis-ma' },
      { nome: 'Maceió', url: 'https://www.sympla.com.br/eventos/maceio-al' },
      { nome: 'Natal', url: 'https://www.sympla.com.br/eventos/natal-rn' },
      { nome: 'Teresina', url: 'https://www.sympla.com.br/eventos/teresina-pi' },
      { nome: 'João Pessoa', url: 'https://www.sympla.com.br/eventos/joao-pessoa-pb' },
      { nome: 'Aracaju', url: 'https://www.sympla.com.br/eventos/aracaju-se' },
      { nome: 'Cuiabá', url: 'https://www.sympla.com.br/eventos/cuiaba-mt' },
      { nome: 'Campo Grande', url: 'https://www.sympla.com.br/eventos/campo-grande-ms' },
      { nome: 'Florianópolis', url: 'https://www.sympla.com.br/eventos/florianopolis-sc' },
      { nome: 'Vitória', url: 'https://www.sympla.com.br/eventos/vitoria-es' },
      { nome: 'Palmas', url: 'https://www.sympla.com.br/eventos/palmas-to' },
      { nome: 'Macapá', url: 'https://www.sympla.com.br/eventos/macapa-ap' },
      { nome: 'Rio Branco', url: 'https://www.sympla.com.br/eventos/rio-branco-ac' },
      { nome: 'Boa Vista', url: 'https://www.sympla.com.br/eventos/boa-vista-rr' }
    ];

    let eventos = [];

    for (const regiao of regioes) {
      try {
        console.log(chalk.gray(`  Buscando em ${regiao.nome}...`));
        
        await page.goto(regiao.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(2000);

        const eventosRegiao = await page.evaluate((cidade) => {
          const events = [];
          const elements = document.querySelectorAll('a[href*="/evento/"], .EventCard, .event-card, article');
          
          elements.forEach((el, index) => {
            if (index >= 8) return; // Limitar por região
            
            let title = '';
            let url = '';
            let image = '';
            let description = '';
            let date = '';
            let location = '';
            
            // Extrair título e URL
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

            // Extrair imagem
            const imgEl = el.querySelector('img');
            if (imgEl && imgEl.src && !imgEl.src.includes('placeholder')) {
              image = imgEl.src;
            }

            // Extrair descrição
            const descEl = el.querySelector('.description, .event-description, p');
            if (descEl) {
              description = descEl.textContent?.trim();
            }

            // Extrair data
            const dateEl = el.querySelector('time, .date, .event-date');
            if (dateEl) {
              date = dateEl.textContent?.trim() || dateEl.getAttribute('datetime');
            }

            // Extrair local
            const locationEl = el.querySelector('.location, .venue, .event-location');
            if (locationEl) {
              location = locationEl.textContent?.trim();
            }
            
            if (title && title.length > 5 && !title.includes('undefined')) {
              events.push({
                title: title, // Título bruto, será processado depois
                url: url || 'https://sympla.com.br',
                image: image,
                description: description,
                date: date,
                location: location,
                source: 'sympla',
                cidade: cidade
              });
            }
          });
          
          return events;
        }, regiao.nome);

        eventos = eventos.concat(eventosRegiao);
        console.log(chalk.blue(`    ${eventosRegiao.length} eventos encontrados`));

      } catch (error) {
        console.log(chalk.red(`    Erro em ${regiao.nome}: ${error.message}`));
      }
    }

    await page.close();
    return eventos;
  }

  // Scraper do Eventbrite com imagens
  async scrapeEventbriteRegional() {
    console.log(chalk.yellow('\n📅 Buscando no Eventbrite (Regional)...'));
    
    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const regioes = [
      // Rondônia - Cobertura expandida
      { nome: 'Ji-Paraná', url: 'https://www.eventbrite.com.br/d/brazil--ji-paran%C3%A1/events/' },
      { nome: 'Porto Velho', url: 'https://www.eventbrite.com.br/d/brazil--porto-velho/events/' },
      { nome: 'Ariquemes', url: 'https://www.eventbrite.com.br/d/brazil--ariquemes/events/' },
      { nome: 'Cacoal', url: 'https://www.eventbrite.com.br/d/brazil--cacoal/events/' },
      { nome: 'Vilhena', url: 'https://www.eventbrite.com.br/d/brazil--vilhena/events/' },
      { nome: 'Presidente Médici', url: 'https://www.eventbrite.com.br/d/brazil--presidente-m%C3%A9dici/events/' },
      { nome: 'Pimenta Bueno', url: 'https://www.eventbrite.com.br/d/brazil--pimenta-bueno/events/' },
      { nome: 'Rondônia', url: 'https://www.eventbrite.com.br/d/brazil--rond%C3%B4nia/events/' },
      
      // Principais capitais
      { nome: 'São Paulo', url: 'https://www.eventbrite.com.br/d/brazil--s%C3%A3o-paulo/events/' },
      { nome: 'Rio de Janeiro', url: 'https://www.eventbrite.com.br/d/brazil--rio-de-janeiro/events/' },
      { nome: 'Brasília', url: 'https://www.eventbrite.com.br/d/brazil--bras%C3%ADlia/events/' },
      { nome: 'Salvador', url: 'https://www.eventbrite.com.br/d/brazil--salvador/events/' },
      { nome: 'Fortaleza', url: 'https://www.eventbrite.com.br/d/brazil--fortaleza/events/' },
      { nome: 'Belo Horizonte', url: 'https://www.eventbrite.com.br/d/brazil--belo-horizonte/events/' },
      { nome: 'Manaus', url: 'https://www.eventbrite.com.br/d/brazil--manaus/events/' },
      { nome: 'Curitiba', url: 'https://www.eventbrite.com.br/d/brazil--curitiba/events/' },
      { nome: 'Recife', url: 'https://www.eventbrite.com.br/d/brazil--recife/events/' },
      { nome: 'Goiânia', url: 'https://www.eventbrite.com.br/d/brazil--goi%C3%A2nia/events/' },
      { nome: 'Belém', url: 'https://www.eventbrite.com.br/d/brazil--bel%C3%A9m/events/' },
      { nome: 'Porto Alegre', url: 'https://www.eventbrite.com.br/d/brazil--porto-alegre/events/' },
      { nome: 'Cuiabá', url: 'https://www.eventbrite.com.br/d/brazil--cuiab%C3%A1/events/' },
      { nome: 'Campo Grande', url: 'https://www.eventbrite.com.br/d/brazil--campo-grande/events/' },
      { nome: 'Florianópolis', url: 'https://www.eventbrite.com.br/d/brazil--florian%C3%B3polis/events/' }
    ];

    let eventos = [];

    for (const regiao of regioes) {
      try {
        console.log(chalk.gray(`  Buscando em ${regiao.nome}...`));
        
        await page.goto(regiao.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(3000);

        const eventosRegiao = await page.evaluate((cidade) => {
          const events = [];
          const elements = document.querySelectorAll('article, [data-testid*="event"], .event-card, .search-event-card');
          
          elements.forEach((el, index) => {
            if (index >= 6) return; // Limitar por região
            
            let title = '';
            let url = '';
            let image = '';
            let description = '';
            let date = '';
            let location = '';
            
            // Extrair título e URL
            const titleSelectors = ['h1', 'h2', 'h3', 'h4', '[data-testid*="title"]', '.event-title', 'a[href*="/e/"]'];
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

            // Extrair URL se não foi encontrada
            if (!url) {
              const linkEl = el.querySelector('a[href*="/e/"]') || el.querySelector('a');
              if (linkEl) {
                url = linkEl.href;
              }
            }

            // Extrair imagem
            const imgEl = el.querySelector('img');
            if (imgEl && imgEl.src && !imgEl.src.includes('placeholder')) {
              image = imgEl.src;
            }

            // Extrair data
            const dateSelectors = ['time', '[data-testid*="date"]', '.event-date', '[datetime]'];
            for (const selector of dateSelectors) {
              const dateEl = el.querySelector(selector);
              if (dateEl) {
                date = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
                break;
              }
            }

            // Extrair localização
            const locationSelectors = ['[data-testid*="location"]', '.event-location', '.venue'];
            for (const selector of locationSelectors) {
              const locationEl = el.querySelector(selector);
              if (locationEl && locationEl.textContent.trim()) {
                location = locationEl.textContent.trim();
                break;
              }
            }
            
            if (title && title.length > 5) {
              events.push({
                title: title, // Título bruto, será processado depois
                url: url || 'https://eventbrite.com.br',
                image: image,
                description: description,
                date: date,
                location: location,
                source: 'eventbrite',
                cidade: cidade
              });
            }
          });
          
          return events;
        }, regiao.nome);

        eventos = eventos.concat(eventosRegiao);
        console.log(chalk.blue(`    ${eventosRegiao.length} eventos encontrados`));

      } catch (error) {
        console.log(chalk.red(`    Erro em ${regiao.nome}: ${error.message}`));
      }
    }

    await page.close();
    return eventos;
  }

  // Scraper de sites regionais de Rondônia
  async scrapeEventosRegionaisRO() {
    console.log(chalk.yellow('\n🏘️ Buscando em sites regionais de RO...'));
    
    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const sitesRegionais = [
      { 
        nome: 'Portal Ji-Paraná', 
        url: 'https://www.google.com/search?q=eventos+ji-parana+rondonia+2024+2025',
        tipo: 'google'
      },
      { 
        nome: 'Facebook Events RO', 
        url: 'https://www.facebook.com/events/search/?q=eventos%20ji%20parana%20rondonia',
        tipo: 'facebook'
      }
    ];

    let eventos = [];

    for (const site of sitesRegionais) {
      try {
        console.log(chalk.gray(`  Buscando em ${site.nome}...`));
        
        await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(3000);

        if (site.tipo === 'google') {
          const eventosGoogle = await page.evaluate(() => {
            const events = [];
            const elements = document.querySelectorAll('.g, .tF2Cxc');
            
            elements.forEach((el, index) => {
              if (index >= 5) return;
              
              const titleEl = el.querySelector('h3, .DKV0Md');
              const linkEl = el.querySelector('a');
              const descEl = el.querySelector('.VwiC3b, .s');
              
              if (titleEl && linkEl) {
                const title = titleEl.textContent?.trim();
                if (title && title.toLowerCase().includes('evento')) {
                  events.push({
                    title: title, // Título bruto, será processado depois
                    url: linkEl.href,
                    description: descEl?.textContent?.trim() || '',
                    date: null,
                    location: null,
                    source: 'google_regional',
                    cidade: 'Ji-Paraná'
                  });
                }
              }
            });
            
            return events;
          });

          eventos = eventos.concat(eventosGoogle);
          console.log(chalk.blue(`    ${eventosGoogle.length} eventos encontrados`));
        }

      } catch (error) {
        console.log(chalk.red(`    Erro em ${site.nome}: ${error.message}`));
      }
    }

    await page.close();
    return eventos;
  }

  // Salvar evento na tabela
  async salvarEvento(evento) {
    try {
      // Processar e extrair informações do título
      const infoExtraida = this.extrairInformacoesDoTitulo(evento);
      
      // Se evento é irrelevante, pular
      if (!infoExtraida) {
        return { action: 'skipped', evento: { title: evento.title, reason: 'irrelevant' } };
      }
      
      let tituloLimpo = infoExtraida.titulo;

      // Verificar duplicatas por múltiplos critérios
      const { data: existingByUrl } = await this.supabase
        .from('eventos')
        .select('id, titulo')
        .eq('external_url', evento.url)
        .single();

      if (existingByUrl) {
        return { action: 'skipped', evento: existingByUrl, reason: 'duplicate_url' };
      }

      // Verificar duplicata por título similar (85% de similaridade)
      const { data: existingByTitle } = await this.supabase
        .from('eventos')
        .select('id, titulo')
        .ilike('titulo', `%${tituloLimpo.substring(0, 20)}%`);

      if (existingByTitle && existingByTitle.length > 0) {
        for (const existing of existingByTitle) {
          const similarity = this.calcularSimilaridade(tituloLimpo, existing.titulo);
          if (similarity > 0.85) {
            return { action: 'skipped', evento: existing, reason: 'duplicate_title' };
          }
        }
      }

      let dataEvento = this.processarDataEvento(infoExtraida.data || evento.date);
      let horaEvento = infoExtraida.hora || '19:00:00';
      let localEvento = this.construirLocal(infoExtraida.venue, infoExtraida.cidade, evento.location, evento.cidade);

      // Preparar dados
      const eventoData = {
        titulo: tituloLimpo,
        descricao: evento.description || `Evento encontrado no ${evento.source}`,
        data: dataEvento,
        hora: horaEvento,
        local: localEvento,
        categoria: this.categorizarEvento(tituloLimpo),
        imagem_url: evento.image || null,
        organizador_id: this.userId,
        comunidade_id: null,
        max_participantes: null,
        source: evento.source,
        external_url: evento.url
      };

      // Salvar
      const { data, error } = await this.supabase
        .from('eventos')
        .insert([eventoData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { action: 'created', evento: data };

    } catch (error) {
      throw error;
    }
  }

  // Lista de cidades e estados brasileiros
  getCidadesEstados() {
    return {
      estados: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],
      cidades: [
        // Principais cidades
        'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia',
        'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina',
        // Rondônia
        'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Cacoal', 'Vilhena', 'Rolim de Moura', 'Jaru', 'Ouro Preto do Oeste', 'Guajará-Mirim',
        // Outras importantes
        'Florianópolis', 'Vitória', 'João Pessoa', 'Aracaju', 'Cuiabá', 'Campo Grande', 'Palmas', 'Macapá', 'Rio Branco', 'Boa Vista'
      ]
    };
  }

  // Palavras que indicam eventos irrelevantes ou inadequados
  getEventosIrrelevantes() {
    return [
      // Eventos pessoais
      'aniversário', 'birthday', 'festa de aniversário',
      'casamento', 'wedding', 'formatura',
      'reunião', 'meeting', 'particular',
      
      // Conteúdo inadequado
      'fuck', 'shit', 'porno', 'sex', 'nude', 'naked',
      'strip', 'adult', 'xxx', 'erotic', 'sensual',
      'fetish', 'bdsm', 'swing', 'orgia',
      
      // Títulos muito genéricos
      'evento', 'show', 'festa', 'encontro'
    ];
  }

  // Detectar conteúdo inadequado por imagem ou descrição
  isConteudoInadequado(evento) {
    const textoCompleto = `${evento.title} ${evento.description || ''}`.toLowerCase();
    
    const palavrasInadequadas = [
      'fuck', 'shit', 'porno', 'sex', 'nude', 'naked',
      'strip', 'adult', 'xxx', 'erotic', 'sensual',
      'fetish', 'bdsm', 'swing', 'orgia', 'putaria',
      'safadeza', 'tesão', 'gostosa', 'gostoso'
    ];
    
    return palavrasInadequadas.some(palavra => textoCompleto.includes(palavra));
  }

  // Detectar se título é apenas cidade/estado
  isTituloApenasCidade(titulo) {
    const tituloLimpo = titulo.trim().toLowerCase();
    
    // Padrões de cidade/estado
    const padroesCidade = [
      /^[a-záàâãéêíóôõúç\s]+,?\s*[a-z]{2}$/i, // "Belém, PA" ou "São Paulo SP"
      /^[a-záàâãéêíóôõúç\s]+\/[a-z]{2}$/i,    // "Belém/PA"
      /^[a-záàâãéêíóôõúç\s]+\s*-\s*[a-z]{2}$/i // "Belém - PA"
    ];
    
    return padroesCidade.some(padrao => padrao.test(tituloLimpo)) || tituloLimpo.length < 5;
  }

  // Extrair título real de eventos com nomes genéricos
  extrairTituloReal(evento) {
    const titulo = evento.title;
    const descricao = evento.description || '';
    
    // Se título é apenas cidade, tentar extrair da descrição
    if (this.isTituloApenasCidade(titulo)) {
      // Procurar por padrões de título na descrição
      const padroesTitulo = [
        /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,})/m, // Linha em maiúsculas
        /(?:evento|show|apresenta[çc]ão|curso|workshop|palestra):\s*([^.\n]{10,})/i,
        /^([^.\n]{15,})/m // Primeira linha com mais de 15 caracteres
      ];
      
      for (const padrao of padroesTitulo) {
        const match = descricao.match(padrao);
        if (match && match[1]) {
          const tituloExtraido = match[1].trim();
          if (tituloExtraido.length > 10 && !this.isTituloApenasCidade(tituloExtraido)) {
            return tituloExtraido;
          }
        }
      }
      
      return null; // Descartar se não conseguir extrair título válido
    }
    
    // Se título é nome de pessoa, tentar extrair contexto
    if (this.isTituloNomePessoa(titulo)) {
      const contextoMatch = descricao.match(new RegExp(`(.{10,}?)\\b${titulo}\\b`, 'i'));
      if (contextoMatch && contextoMatch[1]) {
        return `${contextoMatch[1].trim()} COM ${titulo.toUpperCase()}`;
      }
    }
    
    return titulo;
  }

  // Detectar se título é apenas nome de pessoa
  isTituloNomePessoa(titulo) {
    const tituloLimpo = titulo.trim();
    
    // Padrões de nome de pessoa
    const padroes = [
      /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+$/,
      /^[A-Z]+\s+[A-Z]+$/
    ];
    
    return padroes.some(padrao => padrao.test(tituloLimpo)) && 
           tituloLimpo.length < 30 && 
           !tituloLimpo.includes('SHOW') && 
           !tituloLimpo.includes('EVENTO');
  }

  // Palavras que indicam local
  getPalavrasLocal() {
    return [
      'local', 'espaço', 'teatro', 'estádio', 'arena', 'centro',
      'casa', 'clube', 'hotel', 'shopping', 'parque', 'praça',
      'auditório', 'ginásio', 'quadra', 'salão', 'pavilhão'
    ];
  }

  // Separadores que indicam fim do título
  getSeparadores() {
    return ['|', '!', '–', '—', ' - ', ' – ', ' — '];
  }

  // Verificar se evento é relevante
  isEventoRelevante(titulo) {
    const tituloLower = titulo.toLowerCase();
    const irrelevantes = this.getEventosIrrelevantes();
    
    return !irrelevantes.some(palavra => tituloLower.includes(palavra));
  }

  // Detectar mudança de caixa após ano
  detectarMudancaCaixaAposAno(texto) {
    // Padrão: TEXTO 2025PalavraComCaixaMista
    const pattern = /^(.+20\d{2})([A-Z][a-z].*)$/;
    const match = texto.match(pattern);
    
    if (match) {
      return {
        titulo: match[1].trim(),
        resto: match[2].trim()
      };
    }
    
    return null;
  }

  // Detectar mudança de maiúsculas para local
  detectarMudancaParaLocal(texto) {
    // Padrão: TEXTO EM MAIÚSCULATexto em caixa mista
    const pattern = /^([A-Z\s\d]+?)([A-Z][a-z].*)$/;
    const match = texto.match(pattern);
    
    if (match) {
      const titulo = match[1].trim();
      const resto = match[2].trim();
      
      // Verificar se o resto parece ser local
      const palavrasLocal = this.getPalavrasLocal();
      const pareceLocal = palavrasLocal.some(palavra => 
        resto.toLowerCase().includes(palavra.toLowerCase())
      );
      
      if (pareceLocal) {
        return {
          titulo: titulo,
          local: resto
        };
      }
    }
    
    return null;
  }

  // Detectar eventos esportivos e aplicar regras específicas
  isEventoEsportivo(titulo) {
    const tituloLower = titulo.toLowerCase();
    const palavrasEsportivas = [
      'corrida', 'run', 'marathon', 'maratona', 'caminhada', 'pedalada',
      'ciclismo', 'triathlon', 'natação', 'atletismo', 'cooper'
    ];
    
    return palavrasEsportivas.some(palavra => tituloLower.includes(palavra));
  }

  // Processar títulos de eventos esportivos
  processarTituloEsportivo(titulo) {
    let tituloProcessado = titulo;
    
    // Padrão: evento esportivo com ano seguido de distância e K
    // Ex: "2ª PVH CITY HALF MARATHON 2025. 5K" -> "2ª PVH CITY HALF MARATHON 2025"
    const padraoAnoK = /^(.+20\d{2})[\.\s]*\d+K.*$/i;
    const matchAnoK = titulo.match(padraoAnoK);
    if (matchAnoK) {
      return matchAnoK[1].trim();
    }
    
    // Padrão: evento esportivo terminando com distância e K (sem ano)
    // Ex: "5ª CORRIDA E CAMINHADA OUTUBRO ROSA OAB 5K" -> "5ª CORRIDA E CAMINHADA OUTUBRO ROSA OAB"
    const padraoK = /^(.+?)\s*\d+K.*$/i;
    const matchK = titulo.match(padraoK);
    if (matchK) {
      const tituloSemK = matchK[1].trim();
      
      // Verificar se não cortou muito (mínimo 15 caracteres para eventos esportivos)
      if (tituloSemK.length >= 15) {
        return tituloSemK;
      }
    }
    
    return tituloProcessado;
  }

  // Aplicar padrões de corte identificados nos títulos
  aplicarPadroesDeCorte(titulo) {
    let tituloProcessado = titulo;

    // 1. Padrão: Mudança de MAIÚSCULAS para Mistas (indica local)
    // Ex: "RESENHA DO ASSISSeu Geraldo Boteco" -> "RESENHA DO ASSIS"
    const padraoMudancaCaixa = /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)([A-Z][a-záàâãéêíóôõúç].*)$/;
    const matchCaixa = titulo.match(padraoMudancaCaixa);
    if (matchCaixa && matchCaixa[1].trim().length >= 10) {
      tituloProcessado = matchCaixa[1].trim();
    }

    // 2. Padrão: Palavra "dia" seguida de data
    // Ex: "Baile Fest Car dia 30 de agosto no Piazza Notte" -> "Baile Fest Car"
    const padraoDia = /^(.+?)\s+dia\s+\d{1,2}.*$/i;
    const matchDia = tituloProcessado.match(padraoDia);
    if (matchDia && matchDia[1].trim().length >= 8) {
      tituloProcessado = matchDia[1].trim();
    }

    // 3. Padrão: Preposição "com" seguida de complementos
    // Ex: "POSICIONA 360° com Elas N Sucesso" -> "POSICIONA 360°"
    const padraoCom = /^(.+?)\s+com\s+[A-Z].*$/i;
    const matchCom = tituloProcessado.match(padraoCom);
    if (matchCom && matchCom[1].trim().length >= 10) {
      tituloProcessado = matchCom[1].trim();
    }

    // 4. Padrão: Endereços e Locais (Av., Rua, Igreja, Clube, etc.)
    // Ex: "III JORNADA UNIVERSO DO PSI ESCOLARAv. Álvaro Otacílio" -> "III JORNADA UNIVERSO DO PSI ESCOLAR"
    // Ex: "Seminário de Ciências Bíblicas em Natal (RN)Igreja do Nazareno" -> "Seminário de Ciências Bíblicas em Natal (RN)"
    const padraoEndereco = /^(.+?)(Av\.|Rua|R\.|Alameda|Travessa|Praça|Igreja|Clube|Estádio|Arena|Centro|Ginásio).*$/i;
    const matchEndereco = tituloProcessado.match(padraoEndereco);
    if (matchEndereco && matchEndereco[1].trim().length >= 10) {
      tituloProcessado = matchEndereco[1].trim();
    }

    // 4.1. Padrão: Ausência de espaço entre palavras (indica fim do título)
    // Ex: "A voz do sem voz TributoMercedes Sosa" -> "A voz do sem voz Tributo"
    // Ex: "LOBÃO POWER TRIO NO ACRE ROCK FESTIVAL E AMAZÔNIA MOTORCYCLESCLUBE JUVENTUS" -> "LOBÃO POWER TRIO NO ACRE ROCK FESTIVAL E AMAZÔNIA MOTORCYCLES"
    const padraoSemEspaco = /^(.+?)([A-Z][a-z]+)([A-Z][A-Za-z\s]+)$/;
    const matchSemEspaco = tituloProcessado.match(padraoSemEspaco);
    if (matchSemEspaco && matchSemEspaco[1].trim().length >= 10) {
      // Verificar se realmente parece ser fim do título
      const parteAntes = matchSemEspaco[1] + matchSemEspaco[2];
      const parteDepois = matchSemEspaco[3];
      
      // Se a parte depois parece ser nome próprio ou local, cortar
      if (parteDepois.match(/^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/) || 
          parteDepois.toLowerCase().includes('clube') ||
          parteDepois.toLowerCase().includes('igreja') ||
          parteDepois.toLowerCase().includes('centro')) {
        tituloProcessado = parteAntes.trim();
      }
    }

    // 5. Padrão: Ano no final (para eventos não esportivos)
    // Ex: "CORRIDA NOTURNA CACOAL ROTA DA JUSTIÇA 2025OAB" -> "CORRIDA NOTURNA CACOAL ROTA DA JUSTIÇA 2025"
    const padraoAnoFinal = /^(.+20\d{2})[A-Z]{2,}.*$/;
    const matchAnoFinal = tituloProcessado.match(padraoAnoFinal);
    if (matchAnoFinal && matchAnoFinal[1].trim().length >= 15) {
      tituloProcessado = matchAnoFinal[1].trim();
    }

    // 6. Padrão: Repetição de local/estabelecimento
    // Ex: "Festival no Piazza NottePiazza Notte" -> "Festival no Piazza Notte"
    const padraoRepeticao = /^(.+?)([A-Z][a-záàâãéêíóôõúç\s]+)\1.*$/;
    const matchRepeticao = tituloProcessado.match(padraoRepeticao);
    if (matchRepeticao && matchRepeticao[1].trim().length >= 10) {
      tituloProcessado = matchRepeticao[1].trim() + matchRepeticao[2];
    }

    // 7. Padrão: Nome de cidade repetido com data
    // Ex: "Cuiabá 16/08 POSICIONA 360° com Elas N SucessoCuiabá Lar Shopping" -> "POSICIONA 360°"
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Cuiabá', 'Goiânia', 'Brasília', 'Salvador', 'Fortaleza'];
    for (const cidade of cidades) {
      const regexCidade = new RegExp(`^${cidade}\\s+\\d{1,2}/\\d{1,2}\\s+(.+?)\\s+com\\s+.*${cidade}.*$`, 'i');
      const matchCidade = tituloProcessado.match(regexCidade);
      if (matchCidade && matchCidade[1].trim().length >= 8) {
        tituloProcessado = matchCidade[1].trim();
        break;
      }
    }

    return tituloProcessado;
  }

  // Extrair informações do título (versão inteligente baseada em padrões)
  extrairInformacoesDoTitulo(evento) {
    const titulo = evento.title || evento.titulo;
    const original = titulo;
    let tituloLimpo = titulo;
    let data = null;
    let venue = null;
    let cidade = null;
    let hora = '19:00:00';

    // 1. Verificar conteúdo inadequado
    if (this.isConteudoInadequado(evento)) {
      return null; // Conteúdo inadequado
    }

    // 2. Verificar se evento tem imagem (obrigatório)
    if (!evento.image || evento.image.includes('placeholder') || evento.image.includes('default')) {
      return null; // Eventos sem imagem são descartados
    }

    // 3. Verificar relevância básica
    if (!this.isEventoRelevante(titulo)) {
      return null; // Evento irrelevante
    }

    // 4. Tentar extrair título real se for genérico
    const tituloReal = this.extrairTituloReal(evento);
    if (!tituloReal) {
      return null; // Não conseguiu extrair título válido
    }
    
    tituloLimpo = tituloReal;

    // 5. Processar eventos esportivos primeiro
    if (this.isEventoEsportivo(tituloLimpo)) {
      tituloLimpo = this.processarTituloEsportivo(tituloLimpo);
    }

    // 6. Aplicar novos padrões de corte identificados
    tituloLimpo = this.aplicarPadroesDeCorte(tituloLimpo);

    // 7. Detectar separadores explícitos (|, !, –)
    const separadores = this.getSeparadores();
    for (const sep of separadores) {
      if (tituloLimpo.includes(sep)) {
        const partes = tituloLimpo.split(sep);
        tituloLimpo = partes[0].trim();
        
        // Extrair data se estiver na segunda parte
        const segundaParte = partes[1]?.trim();
        if (segundaParte && /\d{1,2}\s+\w+/.test(segundaParte)) {
          data = segundaParte.match(/\d{1,2}\s+\w+/)[0];
        }
        break;
      }
    }

    // 8. Detectar mudança de caixa após ano (método legado)
    const mudancaAno = this.detectarMudancaCaixaAposAno(tituloLimpo);
    if (mudancaAno) {
      tituloLimpo = mudancaAno.titulo;
      venue = mudancaAno.resto;
    }

    // 9. Detectar mudança de maiúsculas para local (método legado)
    if (!venue) {
      const mudancaLocal = this.detectarMudancaParaLocal(tituloLimpo);
      if (mudancaLocal) {
        tituloLimpo = mudancaLocal.titulo;
        venue = mudancaLocal.local;
      }
    }

    // 10. Detectar padrão "em [cidade]"
    if (!cidade) {
      const matchEm = tituloLimpo.match(/^(.+?)\s+em\s+([A-Za-z\s\/]+)$/i);
      if (matchEm) {
        tituloLimpo = matchEm[1].trim();
        cidade = matchEm[2].trim();
      }
    }

    // 11. Detectar "Local a definir" ou similar
    if (!venue) {
      const matchLocal = tituloLimpo.match(/^(.+?)(local\s+.+)$/i);
      if (matchLocal) {
        tituloLimpo = matchLocal[1].trim();
        venue = matchLocal[2].trim();
      }
    }

    // 12. Extrair hora (padrão "às HH:MM")
    const matchHoraAs = original.match(/às\s*(\d{1,2}):(\d{2})/i);
    if (matchHoraAs) {
      hora = `${matchHoraAs[1].padStart(2, '0')}:${matchHoraAs[2]}:00`;
    } else {
      const matchHora = original.match(/(\d{1,2}):(\d{2})/);
      if (matchHora) {
        hora = `${matchHora[1].padStart(2, '0')}:${matchHora[2]}:00`;
      }
    }

    // 13. Extrair data se não foi encontrada
    if (!data) {
      const padroesDatas = [
        /(\d{1,2})\s*de\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/gi,
        /\ba\s*(\d{1,2})\s*de\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/gi
      ];

      for (const padrao of padroesDatas) {
        const match = original.match(padrao);
        if (match) {
          data = match[0].replace(/^a\s*/, '');
          break;
        }
      }
    }

    // 14. Limpeza final do título
    tituloLimpo = tituloLimpo
      .replace(/(domingo|segunda|terça|quarta|quinta|sexta|sábado)/gi, '')
      .replace(/,?\s*às?\s*/gi, '')
      .replace(/\s*-\s*$/, '')
      .replace(/\s*,\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 15. Validação final do título
    if (tituloLimpo.length < 10) {
      return null; // Título muito curto após processamento
    }

    return {
      titulo: tituloLimpo,
      data: data,
      hora: hora,
      venue: venue,
      cidade: cidade
    };
  }

  // Construir local completo
  construirLocal(venue, cidade, locationOriginal, cidadeOriginal) {
    let local = '';
    
    if (venue) {
      local += venue;
    }
    
    if (cidade) {
      if (local) local += ' - ';
      local += cidade;
    } else if (locationOriginal) {
      if (local) local += ' - ';
      local += locationOriginal;
    } else if (cidadeOriginal) {
      if (local) local += ' - ';
      local += `${cidadeOriginal}, ${cidadeOriginal.includes('RO') ? 'RO' : 'SP'}`;
    } else {
      if (local) local += ' - ';
      local += 'São Paulo, SP';
    }
    
    return local;
  }

  // Processar data do evento
  processarDataEvento(dataEvento) {
    // Tentar usar a data fornecida
    if (dataEvento) {
      try {
        // Se é uma string em português, converter
        if (typeof dataEvento === 'string' && dataEvento.includes('de')) {
          const dataProcessada = this.converterDataPortugues(dataEvento);
          if (dataProcessada) {
            return dataProcessada;
          }
        }
        
        // Se é uma data válida, usar
        const parsedDate = new Date(dataEvento);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        console.log(`Erro ao processar data: ${dataEvento}`);
      }
    }

    // Usar data futura padrão (próximo mês)
    const dataFutura = new Date();
    dataFutura.setMonth(dataFutura.getMonth() + 1);
    return dataFutura.toISOString().split('T')[0];
  }

  // Converter data em português para formato ISO
  converterDataPortugues(dataTexto) {
    if (!dataTexto) return null;

    const meses = {
      'jan': '01', 'janeiro': '01',
      'fev': '02', 'fevereiro': '02',
      'mar': '03', 'março': '03',
      'abr': '04', 'abril': '04',
      'mai': '05', 'maio': '05',
      'jun': '06', 'junho': '06',
      'jul': '07', 'julho': '07',
      'ago': '08', 'agosto': '08',
      'set': '09', 'setembro': '09',
      'out': '10', 'outubro': '10',
      'nov': '11', 'novembro': '11',
      'dez': '12', 'dezembro': '12'
    };

    // Padrão: "30 de nov", "17 de Ago", etc.
    const match = dataTexto.match(/(\d{1,2})\s*de\s*(\w+)/i);
    if (match) {
      const dia = match[1].padStart(2, '0');
      const mesTexto = match[2].toLowerCase();
      const mes = meses[mesTexto] || meses[mesTexto.substring(0, 3)];
      
      if (mes) {
        const anoAtual = new Date().getFullYear();
        const mesAtual = new Date().getMonth() + 1;
        const diaAtual = new Date().getDate();
        
        // Determinar o ano correto
        let ano = anoAtual;
        
        // Se o mês é menor que o atual, ou se é o mesmo mês mas o dia já passou, usar próximo ano
        if (parseInt(mes) < mesAtual || 
           (parseInt(mes) === mesAtual && parseInt(dia) < diaAtual)) {
          ano = anoAtual + 1;
        }
        
        return `${ano}-${mes}-${dia}`;
      }
    }

    // Padrão: "17/08/2024" ou "17/08"
    const matchNumerico = dataTexto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (matchNumerico) {
      const dia = matchNumerico[1].padStart(2, '0');
      const mes = matchNumerico[2].padStart(2, '0');
      const ano = matchNumerico[3] || new Date().getFullYear();
      
      return `${ano}-${mes}-${dia}`;
    }

    return null;
  }

  // Calcular similaridade entre dois textos (algoritmo de Levenshtein simplificado)
  calcularSimilaridade(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    // Matriz de distância
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    
    return (maxLen - distance) / maxLen;
  }

  // Categorizar evento baseado no título
  categorizarEvento(titulo) {
    const tituloLower = titulo.toLowerCase();
    
    if (tituloLower.includes('show') || tituloLower.includes('música') || tituloLower.includes('concert')) {
      return 'Música';
    } else if (tituloLower.includes('teatro') || tituloLower.includes('peça')) {
      return 'Teatro';
    } else if (tituloLower.includes('workshop') || tituloLower.includes('curso') || tituloLower.includes('palestra')) {
      return 'Educação';
    } else if (tituloLower.includes('festa') || tituloLower.includes('balada')) {
      return 'Festa';
    } else if (tituloLower.includes('esporte') || tituloLower.includes('corrida') || tituloLower.includes('marathon')) {
      return 'Esporte';
    } else if (tituloLower.includes('congresso') || tituloLower.includes('conferência')) {
      return 'Negócios';
    } else {
      return 'Geral';
    }
  }
}

async function scrapeEventosCompleto() {
  console.log(chalk.cyan('\n🎫 Sistema Completo de Scraping de Eventos'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.gray('Múltiplas fontes + Imagens + Eventos Regionais\n'));

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // 1. Autenticação
    console.log(chalk.yellow('🔐 Autenticação necessária'));
    
    const email = await question('Email: ');
    const password = await question('Senha: ');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.log(chalk.red(`❌ Erro de autenticação: ${authError.message}`));
      rl.close();
      return;
    }

    console.log(chalk.green(`✅ Login realizado! Usuário: ${authData.user.email}`));

    // 2. Inicializar scraper
    const scraper = new EventoScraperCompleto(supabase, authData.user.id);
    await scraper.initialize();

    // 3. Buscar eventos de múltiplas fontes
    console.log(chalk.cyan('\n🔍 Buscando eventos de múltiplas fontes...'));
    
    const [symplaEventos, eventbriteEventos, regionaisEventos] = await Promise.all([
      scraper.scrapeSymplaRegional(),
      scraper.scrapeEventbriteRegional(),
      scraper.scrapeEventosRegionaisRO()
    ]);

    const todosEventos = [...symplaEventos, ...eventbriteEventos, ...regionaisEventos];
    
    console.log(chalk.blue(`\n📊 Total encontrado: ${todosEventos.length} eventos`));
    console.log(chalk.gray(`  • Sympla: ${symplaEventos.length}`));
    console.log(chalk.gray(`  • Eventbrite: ${eventbriteEventos.length}`));
    console.log(chalk.gray(`  • Sites regionais: ${regionaisEventos.length}`));

    // 4. Salvar eventos
    console.log(chalk.yellow('\n💾 Salvando eventos...'));
    
    let salvos = 0;
    let comImagem = 0;
    let regionais = 0;

    for (const evento of todosEventos) {
      try {
        const result = await scraper.salvarEvento(evento);
        
        if (result.action === 'created') {
          salvos++;
          
          if (evento.image) comImagem++;
          if (evento.cidade && (evento.cidade.includes('Ji-Paraná') || evento.cidade.includes('RO'))) {
            regionais++;
          }
          
          const hasImage = evento.image ? '🖼️' : '📄';
          const isRegional = evento.cidade?.includes('RO') ? '🏘️' : '🏙️';
          
          console.log(chalk.green(`✅ ${hasImage}${isRegional} ${evento.title.substring(0, 45)}...`));
        } else {
          console.log(chalk.yellow(`⏭️  ${evento.title.substring(0, 45)}... (já existe)`));
        }
      } catch (error) {
        console.log(chalk.red(`❌ ${evento.title.substring(0, 30)}...: ${error.message}`));
      }
    }

    // 5. Mostrar resultados
    console.log(chalk.cyan('\n📊 Resultados Finais:'));
    console.log(chalk.cyan('═'.repeat(25)));
    console.log(chalk.green(`✅ Eventos salvos: ${salvos}`));
    console.log(chalk.blue(`🖼️ Com imagem: ${comImagem}`));
    console.log(chalk.blue(`🏘️ Regionais (RO): ${regionais}`));

    // 6. Estatísticas da tabela
    try {
      const { count } = await supabase
        .from('eventos')
        .select('*', { count: 'exact', head: true });

      console.log(chalk.blue(`📊 Total na tabela: ${count} eventos`));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Não foi possível obter estatísticas'));
    }

    // 7. Cleanup
    await scraper.cleanup();
    await supabase.auth.signOut();
    
    if (salvos > 0) {
      console.log(chalk.green('\n🎉 SUCESSO! Sistema completo funcionando!'));
      console.log(chalk.gray('Eventos de múltiplas fontes com imagens e foco regional.'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Erro no sistema:'), error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  scrapeEventosCompleto().catch(error => {
    console.error(chalk.red('Erro fatal:'), error);
    process.exit(1);
  });
}

module.exports = scrapeEventosCompleto;