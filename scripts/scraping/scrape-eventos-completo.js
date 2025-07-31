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
      { nome: 'Ji-Paraná', url: 'https://www.sympla.com.br/eventos/ji-parana-ro' },
      { nome: 'Porto Velho', url: 'https://www.sympla.com.br/eventos/porto-velho-ro' },
      { nome: 'Ariquemes', url: 'https://www.sympla.com.br/eventos/ariquemes-ro' },
      { nome: 'Cacoal', url: 'https://www.sympla.com.br/eventos/cacoal-ro' },
      { nome: 'Rondônia', url: 'https://www.sympla.com.br/eventos/rondonia' },
      { nome: 'São Paulo', url: 'https://www.sympla.com.br/eventos/sao-paulo-sp' }
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
      { nome: 'Ji-Paraná', url: 'https://www.eventbrite.com.br/d/brazil--ji-paran%C3%A1/events/' },
      { nome: 'Porto Velho', url: 'https://www.eventbrite.com.br/d/brazil--porto-velho/events/' },
      { nome: 'Rondônia', url: 'https://www.eventbrite.com.br/d/brazil--rond%C3%B4nia/events/' },
      { nome: 'São Paulo', url: 'https://www.eventbrite.com.br/d/brazil--s%C3%A3o-paulo/events/' }
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
      // Verificar se já existe
      const { data: existing } = await this.supabase
        .from('eventos')
        .select('id')
        .eq('external_url', evento.url)
        .single();

      if (existing) {
        return { action: 'skipped', evento: existing };
      }

      // Processar e extrair informações do título
      const infoExtraida = this.extrairInformacoesDoTitulo(evento.title);
      
      let dataEvento = this.processarDataEvento(infoExtraida.data || evento.date);
      let horaEvento = infoExtraida.hora || '19:00:00';
      let localEvento = this.construirLocal(infoExtraida.venue, infoExtraida.cidade, evento.location, evento.cidade);
      let tituloLimpo = infoExtraida.titulo;

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

  // Extrair informações do título (versão melhorada)
  extrairInformacoesDoTitulo(titulo) {
    const original = titulo;
    let tituloLimpo = titulo;
    let data = null;
    let venue = null;  // Local específico (teatro, estádio, etc)
    let cidade = null; // Cidade e estado
    let hora = '19:00:00';

    const { estados, cidades } = this.getCidadesEstados();

    // 1. Extrair hora (padrão "às HH:MM")
    const matchHoraAs = titulo.match(/às\s*(\d{1,2}):(\d{2})/i);
    if (matchHoraAs) {
      hora = `${matchHoraAs[1].padStart(2, '0')}:${matchHoraAs[2]}:00`;
      tituloLimpo = tituloLimpo.replace(matchHoraAs[0], '').trim();
    } else {
      // Hora simples
      const matchHora = titulo.match(/(\d{1,2}):(\d{2})/);
      if (matchHora) {
        hora = `${matchHora[1].padStart(2, '0')}:${matchHora[2]}:00`;
        tituloLimpo = tituloLimpo.replace(matchHora[0], '').trim();
      }
    }

    // 2. Extrair data
    const padroesDatas = [
      /(\d{1,2})\s*de\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/gi,
      /\ba\s*(\d{1,2})\s*de\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/gi,
      /(domingo|segunda|terça|quarta|quinta|sexta|sábado),?\s*(\d{1,2})\s*de\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/gi
    ];

    for (const padrao of padroesDatas) {
      const match = titulo.match(padrao);
      if (match) {
        data = match[0].replace(/^a\s*/, '').replace(/^(domingo|segunda|terça|quarta|quinta|sexta|sábado),?\s*/gi, '');
        tituloLimpo = tituloLimpo.replace(match[0], '').trim();
        break;
      }
    }

    // 3. Extrair cidade e estado
    const estadosRegex = estados.join('|');
    const cidadeEstadoPattern = new RegExp(`([A-Za-z\\s]+),\\s*(${estadosRegex})\\b`, 'g');
    const matchCidade = titulo.match(cidadeEstadoPattern);
    
    if (matchCidade) {
      cidade = matchCidade[0];
      tituloLimpo = tituloLimpo.replace(matchCidade[0], '').trim();
    }

    // 4. Extrair venue (local específico) - geralmente antes da cidade
    const venuePatterns = [
      /-\s*([^,]+?)\s*-\s*[A-Za-z\s]+,\s*[A-Z]{2}\b/,  // "- Teatro Sérgio - São Paulo, SP"
      /([A-Z][^-,]+(?:\s+[A-Z][^-,]*)*)\s*-\s*[A-Za-z\s]+,\s*[A-Z]{2}\b/  // "Teatro Sérgio - São Paulo, SP"
    ];

    for (const pattern of venuePatterns) {
      const match = titulo.match(pattern);
      if (match) {
        venue = match[1].trim();
        tituloLimpo = tituloLimpo.replace(match[0], '').trim();
        break;
      }
    }

    // 5. Limpeza agressiva do título
    tituloLimpo = tituloLimpo
      // Remover dias da semana
      .replace(/(domingo|segunda|terça|quarta|quinta|sexta|sábado)/gi, '')
      // Remover "às" restante
      .replace(/,?\s*às?\s*/gi, '')
      // Remover qualquer cidade/estado restante
      .replace(new RegExp(`\\s*-?\\s*[A-Za-z\\s]+,\\s*(${estadosRegex})\\b.*$`, 'g'), '')
      // Remover datas restantes
      .replace(/\s*\d{1,2}\s*de\s*\w+.*$/gi, '')
      // Remover horas restantes
      .replace(/\s*\d{1,2}:\d{2}.*$/g, '')
      // Remover "a" solto
      .replace(/\s*\ba\s*$/gi, '')
      // Limpar pontuação final
      .replace(/[\s\-,\.]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 6. Fallback se título ficou muito pequeno
    if (tituloLimpo.length < 5) {
      const partes = original.split(/(?:\s*-\s*|\s*,\s*)/);
      tituloLimpo = partes[0].trim();
      
      if (tituloLimpo.length < 5) {
        tituloLimpo = original; // Último recurso
      }
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