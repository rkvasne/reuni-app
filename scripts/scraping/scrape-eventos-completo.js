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

// Carregar configurações do .env.local no diretório do script
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
      // Rondônia - Cobertura completa do estado (prioridade máxima)
      { nome: 'Ji-Paraná', url: 'https://www.sympla.com.br/eventos/ji-parana-ro', prioridade: 1 },
      { nome: 'Porto Velho', url: 'https://www.sympla.com.br/eventos/porto-velho-ro', prioridade: 1 },
      { nome: 'Ariquemes', url: 'https://www.sympla.com.br/eventos/ariquemes-ro', prioridade: 1 },
      { nome: 'Cacoal', url: 'https://www.sympla.com.br/eventos/cacoal-ro', prioridade: 1 },
      { nome: 'Vilhena', url: 'https://www.sympla.com.br/eventos/vilhena-ro', prioridade: 1 },
      { nome: 'Rolim de Moura', url: 'https://www.sympla.com.br/eventos/rolim-de-moura-ro', prioridade: 1 },
      { nome: 'Jaru', url: 'https://www.sympla.com.br/eventos/jaru-ro', prioridade: 1 },
      { nome: 'Ouro Preto do Oeste', url: 'https://www.sympla.com.br/eventos/ouro-preto-do-oeste-ro', prioridade: 1 },
      { nome: 'Guajará-Mirim', url: 'https://www.sympla.com.br/eventos/guajara-mirim-ro', prioridade: 1 },
      { nome: 'Pimenta Bueno', url: 'https://www.sympla.com.br/eventos/pimenta-bueno-ro', prioridade: 1 },
      { nome: 'Presidente Médici', url: 'https://www.sympla.com.br/eventos/presidente-medici-ro', prioridade: 2 },
      { nome: 'Candeias do Jamari', url: 'https://www.sympla.com.br/eventos/candeias-do-jamari-ro', prioridade: 2 },
      { nome: 'Espigão do Oeste', url: 'https://www.sympla.com.br/eventos/espigao-do-oeste-ro', prioridade: 2 },
      { nome: 'Alta Floresta do Oeste', url: 'https://www.sympla.com.br/eventos/alta-floresta-do-oeste-ro', prioridade: 2 },
      { nome: 'Rondônia', url: 'https://www.sympla.com.br/eventos/rondonia', prioridade: 2 },
      
      // Capitais brasileiras (prioridade média)
      { nome: 'São Paulo', url: 'https://www.sympla.com.br/eventos/sao-paulo-sp', prioridade: 3 },
      { nome: 'Rio de Janeiro', url: 'https://www.sympla.com.br/eventos/rio-de-janeiro-rj', prioridade: 3 },
      { nome: 'Brasília', url: 'https://www.sympla.com.br/eventos/brasilia-df', prioridade: 3 },
      { nome: 'Salvador', url: 'https://www.sympla.com.br/eventos/salvador-ba', prioridade: 3 },
      { nome: 'Fortaleza', url: 'https://www.sympla.com.br/eventos/fortaleza-ce', prioridade: 3 },
      { nome: 'Belo Horizonte', url: 'https://www.sympla.com.br/eventos/belo-horizonte-mg', prioridade: 3 },
      { nome: 'Manaus', url: 'https://www.sympla.com.br/eventos/manaus-am', prioridade: 3 },
      { nome: 'Curitiba', url: 'https://www.sympla.com.br/eventos/curitiba-pr', prioridade: 3 },
      { nome: 'Recife', url: 'https://www.sympla.com.br/eventos/recife-pe', prioridade: 3 },
      { nome: 'Goiânia', url: 'https://www.sympla.com.br/eventos/goiania-go', prioridade: 3 },
      { nome: 'Belém', url: 'https://www.sympla.com.br/eventos/belem-pa', prioridade: 3 },
      { nome: 'Porto Alegre', url: 'https://www.sympla.com.br/eventos/porto-alegre-rs', prioridade: 3 },
      { nome: 'São Luís', url: 'https://www.sympla.com.br/eventos/sao-luis-ma', prioridade: 4 },
      { nome: 'Maceió', url: 'https://www.sympla.com.br/eventos/maceio-al', prioridade: 4 },
      { nome: 'Natal', url: 'https://www.sympla.com.br/eventos/natal-rn', prioridade: 4 },
      { nome: 'Teresina', url: 'https://www.sympla.com.br/eventos/teresina-pi', prioridade: 4 },
      { nome: 'João Pessoa', url: 'https://www.sympla.com.br/eventos/joao-pessoa-pb', prioridade: 4 },
      { nome: 'Aracaju', url: 'https://www.sympla.com.br/eventos/aracaju-se', prioridade: 4 },
      { nome: 'Cuiabá', url: 'https://www.sympla.com.br/eventos/cuiaba-mt', prioridade: 4 },
      { nome: 'Campo Grande', url: 'https://www.sympla.com.br/eventos/campo-grande-ms', prioridade: 4 },
      { nome: 'Florianópolis', url: 'https://www.sympla.com.br/eventos/florianopolis-sc', prioridade: 4 },
      { nome: 'Vitória', url: 'https://www.sympla.com.br/eventos/vitoria-es', prioridade: 4 },
      { nome: 'Palmas', url: 'https://www.sympla.com.br/eventos/palmas-to', prioridade: 4 },
      { nome: 'Macapá', url: 'https://www.sympla.com.br/eventos/macapa-ap', prioridade: 4 },
      { nome: 'Rio Branco', url: 'https://www.sympla.com.br/eventos/rio-branco-ac', prioridade: 4 },
      { nome: 'Boa Vista', url: 'https://www.sympla.com.br/eventos/boa-vista-rr', prioridade: 4 }
    ];

    let eventos = [];

    for (const regiao of regioes) {
      try {
        console.log(chalk.gray(`  Buscando em ${regiao.nome}...`));
        
        await page.goto(regiao.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(2000);

        const eventosRegiao = await page.evaluate((cidade) => {
          const events = [];
          const elements = document.querySelectorAll('a[href*="/evento/"], .EventCard, .event-card, article, [data-testid="event-card"]');
          
          // Limitar eventos por região baseado na prioridade
          const maxEvents = cidade.prioridade === 1 ? 12 : cidade.prioridade === 2 ? 8 : cidade.prioridade === 3 ? 6 : 4;
          
          elements.forEach((el, index) => {
            if (index >= maxEvents) return; // Limitar por região
            
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
            const descEl = el.querySelector('.description, .event-description, p, [data-testid="event-description"]');
            if (descEl) {
              description = descEl.textContent?.trim();
            }

            // Extrair data
            const dateEl = el.querySelector('time, .date, .event-date, [data-testid="event-date"]');
            if (dateEl) {
              date = dateEl.textContent?.trim() || dateEl.getAttribute('datetime');
            }

            // Extrair local
            const locationEl = el.querySelector('.location, .event-location, .venue, [data-testid="event-location"]');
            if (locationEl) {
              location = locationEl.textContent?.trim();
            }

            if (title && url) {
              events.push({
                title,
                url,
                image,
                description,
                date,
                location,
                cidade: cidade.nome,
                prioridade: cidade.prioridade
              });
            }
          });
          
          return events;
        }, regiao);

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

      // Limpar descrição removendo local duplicado
      let descricaoLimpa = evento.description || `Evento encontrado no ${evento.source}`;
      if (descricaoLimpa && localEvento) {
        // Remover cidade/estado da descrição se já está no campo local
        const cidadeEstado = localEvento.split(',').pop()?.trim();
        if (cidadeEstado) {
          descricaoLimpa = descricaoLimpa.replace(new RegExp(cidadeEstado, 'gi'), '').trim();
        }
        
        // Remover padrões de cidade, estado da descrição
        const padroesCidadeEstado = [
          /-\s*[A-Za-zÀ-ÿ\s]+,\s*[A-Z]{2}/gi, // Padrão: " - Cidade, Estado"
          /,\s*[A-Za-zÀ-ÿ\s]+,\s*[A-Z]{2}/gi, // Padrão: ", Cidade, Estado"
          /\s+[A-Za-zÀ-ÿ\s]+,\s*[A-Z]{2}/gi   // Padrão: " Cidade, Estado"
        ];
        
        padroesCidadeEstado.forEach(padrao => {
          descricaoLimpa = descricaoLimpa.replace(padrao, '').trim();
        });
        
        // Remover local específico da descrição se detectado
        const locaisParaRemover = [
          'Teatro', 'Bar', 'Pub', 'Hotel', 'Restaurante', 'Clube', 'Igreja',
          'Centro', 'Espaço', 'Arena', 'Estádio', 'Ginásio', 'Cervejaria',
          'Beco', 'Porão', 'Largo', 'Hall', 'Galpão', 'Rancho', 'Concha',
          'Academia', 'Shopping', 'Plaza', 'Mall', 'Complexo', 'Auditório'
        ];
        
        locaisParaRemover.forEach(local => {
          const regex = new RegExp(`${local}\\s+[A-Za-zÀ-ÿ\\s]+`, 'gi');
          descricaoLimpa = descricaoLimpa.replace(regex, '').trim();
        });
        
        // Limpar espaços duplos, vírgulas soltas e hífens soltos
        descricaoLimpa = descricaoLimpa
          .replace(/\s+/g, ' ')
          .replace(/,\s*,/g, ',')
          .replace(/-\s*-/g, '-')
          .replace(/^\s*[-,\s]+\s*/, '') // Remove hífens/vírgulas no início
          .replace(/\s*[-,\s]+\s*$/, '') // Remove hífens/vírgulas no final
          .trim();
      }

      // Preparar dados
      const eventoData = {
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
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

  // Lista de eventos irrelevantes para filtrar
  getEventosIrrelevantes() {
    return [
      // Palavras genéricas que não indicam eventos reais
      'teste', 'test', 'exemplo', 'example', 'placeholder', 'lorem ipsum',
      'evento teste', 'evento exemplo', 'show teste', 'apresentação teste',
      'workshop teste', 'curso teste', 'palestra teste', 'demo',
      
      // Palavras que indicam conteúdo inadequado
      'adulto', 'adult', '18+', 'xxx', 'porn', 'sexo', 'sexual',
      'apostas', 'betting', 'casino', 'jogos de azar',
      
      // Palavras que indicam eventos muito específicos ou irrelevantes
      'reunião administrativa', 'reunião interna', 'reunião de equipe',
      'treinamento interno', 'capacitação interna', 'workshop interno',
      'evento corporativo interno', 'reunião de diretoria',
      
      // Palavras que indicam eventos passados ou cancelados
      'cancelado', 'canceled', 'adiado', 'postponed', 'suspenso',
      'encerrado', 'finalizado', 'terminado', 'passado',
      
      // Palavras que indicam eventos muito pequenos ou informais
      'encontro casual', 'reunião informal', 'conversa', 'chat',
      'conversa online', 'meetup casual', 'encontro virtual',
      
      // Palavras que indicam eventos técnicos muito específicos
      'bug fix', 'hotfix', 'patch', 'update técnico',
      'manutenção', 'maintenance', 'backup', 'restore',
      
      // Palavras que indicam eventos de teste ou desenvolvimento
      'sandbox', 'dev', 'development', 'staging', 'test environment',
      'ambiente de teste', 'ambiente de desenvolvimento',
      
      // Palavras que indicam eventos muito genéricos
      'evento', 'event', 'atividade', 'activity', 'programação',
      'agenda', 'schedule', 'calendário', 'calendar'
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
    const local = evento.location || '';
    
    // Se título é apenas cidade, tentar extrair da descrição
    if (this.isTituloApenasCidade(titulo)) {
      // Procurar por padrões de título na descrição
      const padroesTitulo = [
        // Padrão: linha em maiúsculas com mais de 10 caracteres
        /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\d]{10,})/m,
        // Padrão: "Evento: Título" ou "Show: Título"
        /(?:evento|show|apresenta[çc]ão|curso|workshop|palestra|festival):\s*([^.\n]{10,})/i,
        // Padrão: primeira linha com mais de 15 caracteres
        /^([^.\n]{15,})/m,
        // Padrão: texto entre aspas
        /"([^"]{10,})"/,
        // Padrão: texto entre parênteses
        /\(([^)]{10,})\)/,
        // Padrão: texto após dois pontos
        /:\s*([^.\n]{10,})/
      ];
      
      for (const padrao of padroesTitulo) {
        const match = descricao.match(padrao);
        if (match && match[1]) {
          const tituloExtraido = match[1].trim();
          if (tituloExtraido.length > 10 && 
              !this.isTituloApenasCidade(tituloExtraido) &&
              !this.isTituloNomePessoa(tituloExtraido)) {
            return tituloExtraido;
          }
        }
      }
      
      // Se não conseguiu extrair da descrição, tentar combinar com local
      if (local && local !== titulo) {
        const localLimpo = local.replace(/,\s*[A-Z]{2}$/, ''); // Remove estado
        if (localLimpo && localLimpo !== titulo) {
          return `${titulo} - ${localLimpo}`;
        }
      }
      
      return null; // Descartar se não conseguir extrair título válido
    }
    
    // Se título é nome de pessoa, tentar extrair contexto
    if (this.isTituloNomePessoa(titulo)) {
      // Procurar por contexto na descrição
      const contextoMatch = descricao.match(new RegExp(`(.{10,}?)\\b${titulo}\\b`, 'i'));
      if (contextoMatch && contextoMatch[1]) {
        const contexto = contextoMatch[1].trim();
        if (contexto.length > 5) {
          return `${contexto} COM ${titulo.toUpperCase()}`;
        }
      }
      
      // Se não encontrou contexto, tentar adicionar tipo de evento
      const tiposEvento = ['SHOW', 'APRESENTAÇÃO', 'WORKSHOP', 'PALESTRA', 'CURSO'];
      for (const tipo of tiposEvento) {
        if (descricao.toLowerCase().includes(tipo.toLowerCase())) {
          return `${tipo} COM ${titulo.toUpperCase()}`;
        }
      }
      
      // Fallback: adicionar "SHOW" ao nome
      return `SHOW COM ${titulo.toUpperCase()}`;
    }
    
    // Se título é muito genérico, tentar melhorar
    if (this.isTituloMuitoGenerico(titulo)) {
      // Tentar extrair informações da descrição
      const infoExtra = this.extrairInformacoesDaDescricao(descricao);
      if (infoExtra) {
        return `${titulo} - ${infoExtra}`;
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
    return ['|', '!', '–', '—', ' - ', ' – ', ' — ', ' / ', '/'];
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

    // 4. Padrão: Endereços e Locais (expandido com novos locais)
    // Ex: "III JORNADA UNIVERSO DO PSI ESCOLARAv. Álvaro Otacílio" -> "III JORNADA UNIVERSO DO PSI ESCOLAR"
    // Ex: "Seminário de Ciências Bíblicas em Natal (RN)Igreja do Nazareno" -> "Seminário de Ciências Bíblicas em Natal (RN)"
    const padraoEndereco = /^(.+?)(Av\.|Rua|R\.|Alameda|Travessa|Praça|Igreja|Clube|Estádio|Arena|Centro|Ginásio|Bar|Teatro|Rodovia|BR|Pub|Universidade|Espaço|Restaurante|Hotel|Beco|Porão|Cervejaria|Largo|Hall|Galpão|Rancho).*$/i;
    const matchEndereco = tituloProcessado.match(padraoEndereco);
    if (matchEndereco && matchEndereco[1].trim().length >= 10) {
      tituloProcessado = matchEndereco[1].trim();
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
    const padraoRepeticaoLocal = /^(.+?)([A-Z][a-záàâãéêíóôõúç\s]+)\1.*$/;
    const matchRepeticaoLocal = tituloProcessado.match(padraoRepeticaoLocal);
    if (matchRepeticaoLocal && matchRepeticaoLocal[1].trim().length >= 10) {
      tituloProcessado = matchRepeticaoLocal[1].trim() + matchRepeticaoLocal[2];
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

    // 8. NOVO: Padrão para detectar partes de local que estão sendo incluídas no título
    // Ex: "WARUNG TOUR BELO HORIZONTEBH" -> "WARUNG TOUR BELO HORIZONTE"
    
    // 8.1. Padrão: Ausência de espaço entre palavras (múltiplas abordagens)
    
    // Abordagem 1: Locais conhecidos sem espaço
    const locaisEspecificos = [
      'Sesi', 'Teatro', 'Bar', 'Pub', 'Hotel', 'Restaurante', 'Clube', 
      'Igreja', 'Centro', 'Espaço', 'Arena', 'Estádio', 'Ginásio', 
      'Cervejaria', 'Beco', 'Porão', 'Largo', 'Hall', 'Galpão', 
      'Rancho', 'Concha', 'Hostel', 'Universidade', 'Academia', 'Plaza'
    ];
    
    for (const local of locaisEspecificos) {
      const regex = new RegExp(`^(.+?)${local}.*$`, 'i');
      const match = tituloProcessado.match(regex);
      if (match && match[1].trim().length >= 10) {
        // Verificar se não há espaço antes do local
        const ultimaLetra = match[1].slice(-1);
        if (ultimaLetra.match(/[a-zA-Z]/)) {
          tituloProcessado = match[1].trim();
          break;
        }
      }
    }
    
    // Abordagem 2: Repetição de palavras (ex: "esperançaCanção Nova")
    const padraoRepeticao = /^(.+?)([A-Z][a-z]+\s[A-Z][a-z]+)$/;
    const matchRepeticao = tituloProcessado.match(padraoRepeticao);
    if (matchRepeticao && matchRepeticao[1].trim().length >= 15) {
      const parteAntes = matchRepeticao[1].trim();
      const parteDepois = matchRepeticao[2].trim();
      
      // Verificar se a parte depois aparece na parte antes
      if (parteAntes.toLowerCase().includes(parteDepois.toLowerCase().split(' ')[0])) {
        tituloProcessado = parteAntes;
      }
    }
    

    
    // Abordagem 3: Mudança de caixa no meio da palavra (ex: "MesuraMoto") - DEVE VIR DEPOIS dos casos específicos
    const padraoMudancaCaixaMeio = /^(.+?)([a-z][A-Z][a-z]+.*)$/;
    const matchMudancaCaixaMeio = tituloProcessado.match(padraoMudancaCaixaMeio);
    if (matchMudancaCaixaMeio && matchMudancaCaixaMeio[1].trim().length >= 10) {
      tituloProcessado = matchMudancaCaixaMeio[1].trim();
    }
    
    // Abordagem 4: Ponto seguido de local (ex: "II SIMPÓSIO RONDONIENSE DE CIRURGIA BUCOMAXILO.Golden Plaza")
    const padraoPontoLocal = /^(.+?)\.([A-Z][a-záàâãéêíóôõúç\s]+)$/;
    const matchPontoLocal = tituloProcessado.match(padraoPontoLocal);
    if (matchPontoLocal && matchPontoLocal[1].trim().length >= 10) {
      tituloProcessado = matchPontoLocal[1].trim();
    }
    

    
    // 8.2. Padrão: Siglas de estado/cidade no final sem espaço
    const padraoSiglaFinal = /^(.+?)([A-Z]{2,3})\s*$/;
    const matchSiglaFinal = tituloProcessado.match(padraoSiglaFinal);
    if (matchSiglaFinal && matchSiglaFinal[1].trim().length >= 10) {
      const sigla = matchSiglaFinal[2];
      // Verificar se é uma sigla conhecida de estado/cidade
      if (['BH', 'SP', 'RJ', 'MG', 'RS', 'SC', 'PR', 'BA', 'CE', 'PE', 'GO', 'MT', 'MS', 'PA', 'AM', 'AC', 'RO', 'RR', 'AP', 'TO', 'PI', 'MA', 'RN', 'PB', 'AL', 'SE'].includes(sigla)) {
        tituloProcessado = matchSiglaFinal[1].trim();
      }
    }
    


    // 9. NOVO: Padrão para limpar hífens duplos e caracteres estranhos
    // Ex: "REBEL XX com Allan Natal e Ian Padilha- - 02" -> "REBEL XX com Allan Natal e Ian Padilha"
    
    // 9.1. Remover hífens duplos e caracteres estranhos no final
    tituloProcessado = tituloProcessado.replace(/[-–—]+\s*[-–—]+\s*$/, ''); // Remove hífens duplos no final
    tituloProcessado = tituloProcessado.replace(/[-–—]+\s*\d+\s*$/, ''); // Remove hífen + número no final
    tituloProcessado = tituloProcessado.replace(/\s+[-–—]+\s*$/, ''); // Remove hífen solto no final
    tituloProcessado = tituloProcessado.replace(/[-–—]+\s*$/, ''); // Remove qualquer hífen no final
    
    // 9.2. Limpar espaços múltiplos e espaços no final
    tituloProcessado = tituloProcessado.replace(/\s+/g, ' ').trim();
    
    // 9.3. Limpar caracteres especiais (mas preservar acentos)
    tituloProcessado = tituloProcessado.replace(/[^\w\s\-–—~@#$%&*()\[\]{}|\\:;"'<>,.?/áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
    
    // 9.4. Limpar espaços novamente após remoção de caracteres
    tituloProcessado = tituloProcessado.replace(/\s+/g, ' ').trim();

    // 10. NOVO: Padrão para detectar quando o local está sendo incluído incorretamente
    // Ex: "Nome do Evento + Nome do Local" -> "Nome do Evento"
    
    // 10.1. Padrão: "+" seguido de palavras que parecem local
    const padraoMaisLocal = /^(.+?)\s+\+\s+([A-Z][a-záàâãéêíóôõúç\s]+)$/;
    const matchMaisLocal = tituloProcessado.match(padraoMaisLocal);
    if (matchMaisLocal && matchMaisLocal[1].trim().length >= 8) {
      const parteEvento = matchMaisLocal[1].trim();
      const parteLocal = matchMaisLocal[2].trim();
      
      // Verificar se a parte após "+" parece ser um local
      const palavrasLocalComuns = ['Moto', 'Li', 'Bar', 'Pub', 'Teatro', 'Centro', 'Espaço', 'Arena', 'Clube', 'Restaurante', 'Hotel', 'Municipal'];
      const pareceLocal = palavrasLocalComuns.some(palavra => 
        parteLocal.toLowerCase().includes(palavra.toLowerCase())
      );
      
      if (pareceLocal) {
        tituloProcessado = parteEvento;
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
      // Determinar estado correto baseado na cidade
      let estado = 'SP'; // padrão
      const cidadeLower = cidadeOriginal.toLowerCase();
      
      // Estados brasileiros por cidade
      if (cidadeLower.includes('ji-paraná') || cidadeLower.includes('porto velho') || 
          cidadeLower.includes('ariquemes') || cidadeLower.includes('cacoal') || 
          cidadeLower.includes('vilhena') || cidadeLower.includes('rolim de moura') ||
          cidadeLower.includes('jaru') || cidadeLower.includes('ouro preto do oeste') ||
          cidadeLower.includes('guajará-mirim') || cidadeLower.includes('pimenta bueno')) {
        estado = 'RO';
      } else if (cidadeLower.includes('salvador')) {
        estado = 'BA';
      } else if (cidadeLower.includes('fortaleza')) {
        estado = 'CE';
      } else if (cidadeLower.includes('goiânia')) {
        estado = 'GO';
      } else if (cidadeLower.includes('porto alegre')) {
        estado = 'RS';
      } else if (cidadeLower.includes('maceió')) {
        estado = 'AL';
      } else if (cidadeLower.includes('brasília')) {
        estado = 'DF';
      } else if (cidadeLower.includes('belo horizonte')) {
        estado = 'MG';
      } else if (cidadeLower.includes('natal')) {
        estado = 'RN';
      } else if (cidadeLower.includes('rio de janeiro')) {
        estado = 'RJ';
      } else if (cidadeLower.includes('são luís')) {
        estado = 'MA';
      } else if (cidadeLower.includes('manaus')) {
        estado = 'AM';
      } else if (cidadeLower.includes('curitiba')) {
        estado = 'PR';
      } else if (cidadeLower.includes('recife')) {
        estado = 'PE';
      } else if (cidadeLower.includes('belém')) {
        estado = 'PA';
      } else if (cidadeLower.includes('teresina')) {
        estado = 'PI';
      } else if (cidadeLower.includes('joão pessoa')) {
        estado = 'PB';
      } else if (cidadeLower.includes('aracaju')) {
        estado = 'SE';
      } else if (cidadeLower.includes('cuiabá')) {
        estado = 'MT';
      } else if (cidadeLower.includes('campo grande')) {
        estado = 'MS';
      } else if (cidadeLower.includes('florianópolis')) {
        estado = 'SC';
      } else if (cidadeLower.includes('vitória')) {
        estado = 'ES';
      } else if (cidadeLower.includes('palmas')) {
        estado = 'TO';
      } else if (cidadeLower.includes('macapá')) {
        estado = 'AP';
      } else if (cidadeLower.includes('rio branco')) {
        estado = 'AC';
      }
      
      local += `${cidadeOriginal}, ${estado}`;
    } else {
      if (local) local += ' - ';
      local += 'Local a definir';
    }
    
    return local;
  }

  // Processar data do evento (com correção de fuso horário)
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
        
        // Se é uma data válida, usar diretamente sem ajuste de fuso horário
        const parsedDate = new Date(dataEvento);
        if (!isNaN(parsedDate.getTime())) {
          // Retornar apenas a data (YYYY-MM-DD) sem ajuste de fuso horário
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        console.log(`Erro ao processar data: ${dataEvento}`);
      }
    }

    // Usar data futura padrão (próximo mês)
    const agora = new Date();
    agora.setMonth(agora.getMonth() + 1);
    return agora.toISOString().split('T')[0];
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

  // Verificar se título é muito genérico
  isTituloMuitoGenerico(titulo) {
    const tituloLower = titulo.toLowerCase();
    const genericos = [
      'evento', 'show', 'festa', 'encontro', 'apresentação',
      'workshop', 'curso', 'palestra', 'seminário', 'conferência'
    ];
    
    return genericos.some(generico => tituloLower.includes(generico)) && titulo.length < 20;
  }

  // Extrair informações úteis da descrição
  extrairInformacoesDaDescricao(descricao) {
    if (!descricao) return null;
    
    // Procurar por artistas, bandas, nomes de pessoas
    const artistas = descricao.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
    if (artistas && artistas.length > 0) {
      const artista = artistas[0];
      if (artista.length > 3 && artista.length < 30) {
        return artista;
      }
    }
    
    // Procurar por tipos de evento específicos
    const tipos = ['show', 'festival', 'workshop', 'curso', 'palestra', 'seminário'];
    for (const tipo of tipos) {
      if (descricao.toLowerCase().includes(tipo)) {
        return tipo.toUpperCase();
      }
    }
    
    return null;
  }
}

async function scrapeEventosCompleto() {
  console.log(chalk.cyan('\n🎫 Sistema Completo de Scraping de Eventos'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.gray('Múltiplas fontes + Imagens + Eventos Regionais\n'));

  // Debug: verificar se as variáveis de ambiente estão carregadas
  console.log(chalk.yellow('🔧 Verificando configurações...'));
  console.log(chalk.gray(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Configurado' : '❌ Não encontrado'}`));
  console.log(chalk.gray(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não encontrado'}`));

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log(chalk.red('❌ Variáveis de ambiente do Supabase não encontradas!'));
    console.log(chalk.yellow('Verifique se o arquivo .env.local existe em scripts/scraping/'));
    rl.close();
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // 1. Autenticação
    console.log(chalk.yellow('🔐 Autenticação necessária'));
    
    const email = await question('Email: ');
    const password = await question('Senha: ');
    
    console.log(chalk.gray('Tentando autenticar...'));
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.log(chalk.red(`❌ Erro de autenticação: ${authError.message}`));
      console.log(chalk.yellow('Verifique suas credenciais e conexão com a internet'));
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