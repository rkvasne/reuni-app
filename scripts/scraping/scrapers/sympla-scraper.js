/**
 * Sympla Scraper
 * 
 * Scraper específico para coletar eventos do Sympla Brasil,
 * utilizando a classe 'sympla-card' para identificar eventos.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { BaseScraper } = require('./base-scraper');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('../utils/error-handler');

class SymplaScraper extends BaseScraper {
  constructor(config, scraperName = 'sympla') {
    super(config, scraperName);
    this.baseUrl = config.baseUrl || 'https://www.sympla.com.br';
    this.searchUrl = config.searchUrl || 'https://www.sympla.com.br/eventos';
  }

  /**
   * Scraping principal de eventos
   */
  async scrapeEvents(filters = {}) {
    this.startStats();
    
    try {
      this.logger.info('Iniciando scraping do Sympla Brasil');
      
      await this.initializeBrowser();
      
      const events = [];
      const maxEvents = filters.maxEvents || 50;
      
      // Scraping por região
      if (filters.includeRegional !== false) {
        const regionalEvents = await this.scrapeRegionalEvents(filters);
        events.push(...regionalEvents);
        
        this.logger.info(`Coletados ${regionalEvents.length} eventos regionais`);
      }
      
      // Scraping nacional (artistas famosos)
      if (filters.includeNational !== false && events.length < maxEvents) {
        const nationalEvents = await this.scrapeNationalEvents(filters, maxEvents - events.length);
        events.push(...nationalEvents);
        
        this.logger.info(`Coletados ${nationalEvents.length} eventos nacionais`);
      }
      
      // Scraping por categorias específicas
      if (filters.categories && filters.categories.length > 0) {
        const categoryEvents = await this.scrapeCategoryEvents(filters, maxEvents - events.length);
        events.push(...categoryEvents);
        
        this.logger.info(`Coletados ${categoryEvents.length} eventos por categoria`);
      }
      
      // Remove duplicatas baseado no título e data
      const uniqueEvents = this.removeDuplicates(events);
      
      this.logger.info(`Scraping concluído: ${uniqueEvents.length} eventos únicos coletados`);
      
      return uniqueEvents.slice(0, maxEvents);
      
    } catch (error) {
      this.stats.errors++;
      const result = this.errorHandler.handle(error, { 
        scraperName: this.scraperName,
        method: 'scrapeEvents' 
      });
      
      this.logger.error('Erro durante scraping do Sympla', result.error);
      throw result.error;
      
    } finally {
      this.endStats();
      await this.cleanup();
    }
  }

  /**
   * Scraping de eventos regionais (Ji-Paraná/RO)
   */
  async scrapeRegionalEvents(filters) {
    this.logger.info('Coletando eventos regionais de Ji-Paraná/RO');
    
    const regionalTerms = [
      'Ji-Paraná',
      'Rondônia',
      'RO',
      'Ariquemes',
      'Cacoal',
      'Rolim de Moura',
      'Vilhena',
      'Porto Velho'
    ];
    
    const events = [];
    
    for (const term of regionalTerms) {
      if (events.length >= (filters.maxEvents || 50)) break;
      
      try {
        const termEvents = await this.searchEventsByTerm(term, {
          ...filters,
          maxResults: 10,
          isRegional: true
        });
        
        events.push(...termEvents);
        
        this.logger.debug(`Encontrados ${termEvents.length} eventos para "${term}"`);
        
        // Delay entre buscas
        await this.page.waitForTimeout(2000);
        
      } catch (error) {
        this.logger.warn(`Erro ao buscar eventos para "${term}":`, error.message);
        continue;
      }
    }
    
    return events;
  }

  /**
   * Scraping de eventos nacionais (artistas famosos)
   */
  async scrapeNationalEvents(filters, maxEvents) {
    this.logger.info('Coletando eventos nacionais de artistas famosos');
    
    const nationalTerms = [
      'show nacional',
      'turnê brasil',
      'festival música',
      'artista famoso',
      'show São Paulo',
      'show Rio de Janeiro',
      'show Brasília',
      'festival rock',
      'festival pop',
      'show sertanejo'
    ];
    
    const events = [];
    
    for (const term of nationalTerms) {
      if (events.length >= maxEvents) break;
      
      try {
        const termEvents = await this.searchEventsByTerm(term, {
          ...filters,
          maxResults: 8,
          isRegional: false
        });
        
        events.push(...termEvents);
        
        this.logger.debug(`Encontrados ${termEvents.length} eventos nacionais para "${term}"`);
        
        // Delay entre buscas
        await this.page.waitForTimeout(2000);
        
      } catch (error) {
        this.logger.warn(`Erro ao buscar eventos nacionais para "${term}":`, error.message);
        continue;
      }
    }
    
    return events;
  }

  /**
   * Scraping por categorias específicas
   */
  async scrapeCategoryEvents(filters, maxEvents) {
    this.logger.info(`Coletando eventos por categorias: ${filters.categories.join(', ')}`);
    
    const categoryTerms = {
      shows: ['show', 'música', 'concert', 'festival'],
      teatro: ['teatro', 'peça', 'espetáculo'],
      esportes: ['futebol', 'basquete', 'corrida', 'esporte'],
      gastronomia: ['festival culinário', 'gastronomia', 'food'],
      educacao: ['curso', 'workshop', 'palestra'],
      tecnologia: ['tech', 'tecnologia', 'hackathon']
    };
    
    const events = [];
    
    for (const category of filters.categories) {
      if (events.length >= maxEvents) break;
      
      const terms = categoryTerms[category] || [];
      
      for (const term of terms) {
        if (events.length >= maxEvents) break;
        
        try {
          const termEvents = await this.searchEventsByTerm(term, {
            ...filters,
            maxResults: 5,
            category
          });
          
          events.push(...termEvents);
          
          this.logger.debug(`Encontrados ${termEvents.length} eventos de ${category} para "${term}"`);
          
          // Delay entre buscas
          await this.page.waitForTimeout(1500);
          
        } catch (error) {
          this.logger.warn(`Erro ao buscar eventos de ${category} para "${term}":`, error.message);
          continue;
        }
      }
    }
    
    return events;
  }

  /**
   * Busca eventos por termo específico
   */
  async searchEventsByTerm(searchTerm, options = {}) {
    const searchUrl = `${this.baseUrl}/eventos?q=${encodeURIComponent(searchTerm)}`;
    
    this.logger.debug(`Buscando eventos: ${searchUrl}`);
    
    try {
      await this.navigateToUrl(searchUrl);
      
      // Aguarda carregamento dos eventos
      const eventsLoaded = await this.waitForElement('.sympla-card, .event-item, .EventCardstyles__Container', 10000);
      
      if (!eventsLoaded) {
        this.logger.warn(`Nenhum evento encontrado para "${searchTerm}"`);
        return [];
      }
      
      // Scroll para carregar mais eventos
      await this.scrollPage(2, 2000);
      
      // Extrai elementos de eventos
      const eventElements = await this.page.$$('.sympla-card, .event-item, .EventCardstyles__Container');
      
      if (eventElements.length === 0) {
        this.logger.warn(`Nenhum elemento de evento encontrado para "${searchTerm}"`);
        return [];
      }
      
      this.logger.debug(`Encontrados ${eventElements.length} elementos de evento para "${searchTerm}"`);
      
      // Processa elementos limitando pela quantidade máxima
      const maxResults = options.maxResults || 10;
      const limitedElements = eventElements.slice(0, maxResults);
      
      const events = await this.processEventElements(limitedElements, maxResults);
      
      // Adiciona metadados específicos
      return events.map(event => ({
        ...event,
        searchTerm,
        isRegional: options.isRegional || false,
        category: options.category || this.classifyEventCategory(event.title, event.description)
      }));
      
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
      
      throw new ScrapingError(
        `Erro ao buscar eventos para "${searchTerm}": ${error.message}`,
        ErrorTypes.PARSING_ERROR,
        ErrorSeverity.MEDIUM,
        { searchTerm, originalError: error.name }
      );
    }
  }

  /**
   * Extrai dados de um elemento de evento
   */
  async extractEventData(element) {
    try {
      // Título do evento
      const title = await this.extractText(element, [
        '.sympla-card__title',
        '.event-title',
        '.EventCardstyles__Title',
        'h3',
        '.event-name'
      ]);
      
      if (!title) {
        this.logger.debug('Elemento sem título válido, pulando');
        return null;
      }
      
      // Data do evento
      const dateText = await this.extractText(element, [
        '.sympla-card__date',
        '.event-date',
        '.EventCardstyles__Date',
        '.date-info',
        '.event-datetime'
      ]);
      
      // Local do evento
      const locationText = await this.extractText(element, [
        '.sympla-card__location',
        '.event-location',
        '.EventCardstyles__Location',
        '.venue-info',
        '.event-venue'
      ]);
      
      // Imagem do evento
      const imageUrl = await this.extractAttribute(element, [
        '.sympla-card__image img',
        '.event-image img',
        '.EventCardstyles__Image img',
        'img[src*="sympla"]'
      ], 'src');
      
      // Preço do evento
      const priceText = await this.extractText(element, [
        '.sympla-card__price',
        '.event-price',
        '.EventCardstyles__Price',
        '.price-info',
        '.event-cost'
      ]);
      
      // Descrição do evento
      const description = await this.extractText(element, [
        '.sympla-card__description',
        '.event-description',
        '.EventCardstyles__Description',
        '.event-summary'
      ]);
      
      // Organizador
      const organizer = await this.extractText(element, [
        '.event-organizer',
        '.organizer-name',
        '.EventCardstyles__Organizer',
        '.producer-name'
      ]);
      
      // Link do evento
      const eventLink = await this.extractAttribute(element, [
        'a[href*="/e/"]',
        'a[href*="sympla.com.br"]',
        '.sympla-card a',
        '.event-item a'
      ], 'href');
      
      // Processa e estrutura os dados
      const eventData = {
        title: title.trim(),
        description: description ? description.trim() : null,
        date: this.parseEventDate(dateText),
        location: this.parseEventLocation(locationText),
        image: imageUrl ? {
          url: this.normalizeImageUrl(imageUrl),
          alt: title
        } : null,
        price: this.parseEventPrice(priceText),
        organizer: organizer ? organizer.trim() : null,
        url: eventLink ? this.normalizeEventUrl(eventLink) : null
      };
      
      // Validação básica
      if (!eventData.title || eventData.title.length < 3) {
        this.logger.debug('Evento com título inválido, pulando');
        return null;
      }
      
      return eventData;
      
    } catch (error) {
      this.logger.warn('Erro ao extrair dados do evento:', error.message);
      return null;
    }
  }

  /**
   * Processa data do evento
   */
  parseEventDate(dateText) {
    if (!dateText) return null;
    
    try {
      // Remove texto extra e normaliza
      const cleanDate = dateText
        .replace(/^(seg|ter|qua|qui|sex|sáb|dom),?\s*/i, '')
        .replace(/\s+às?\s+/i, ' ')
        .replace(/\s+horas?\s*/i, ' ')
        .replace(/\s+hs?\s*/i, ' ')
        .trim();
      
      // Tenta diferentes formatos de data brasileira
      const dateFormats = [
        // DD/MM/YYYY
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        // DD/MM (assume ano atual ou próximo)
        /(\d{1,2})\/(\d{1,2})/,
        // DD de MMMM de YYYY
        /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,
        // DD de MMMM (assume ano atual ou próximo)
        /(\d{1,2})\s+de\s+(\w+)/i,
        // MMMM DD, YYYY
        /(\w+)\s+(\d{1,2}),\s+(\d{4})/i,
        // DD MMM YYYY
        /(\d{1,2})\s+(\w{3})\s+(\d{4})/i,
        // DD MMM (assume ano atual ou próximo)
        /(\d{1,2})\s+(\w{3})/i,
        // YYYY-MM-DD
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        // DD-MM-YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/
      ];
      
      for (const format of dateFormats) {
        const match = cleanDate.match(format);
        if (match) {
          const date = this.buildDateFromMatch(match, format);
          if (date && !isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }
      
      // Fallback: tenta parsing direto
      const fallbackDate = new Date(cleanDate);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toISOString();
      }
      
      this.logger.debug(`Não foi possível processar data: "${dateText}"`);
      return null;
      
    } catch (error) {
      this.logger.debug(`Erro ao processar data "${dateText}":`, error.message);
      return null;
    }
  }

  /**
   * Constrói data a partir de match de regex
   */
  buildDateFromMatch(match, format) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const currentDay = new Date().getDate();
      
      // Ajuste de fuso horário para Brasil (GMT-3)
      const timezoneOffset = 3 * 60; // 3 horas em minutos
      
      const months = {
        'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
        'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
        'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
        'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3,
        'mai': 4, 'jun': 5, 'jul': 6, 'ago': 7,
        'set': 8, 'out': 9, 'nov': 10, 'dez': 11
      };
      
      if (format.source.includes('de')) {
        // Formato: DD de MMMM de YYYY ou DD de MMMM
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = match[3] ? parseInt(match[3]) : this.determineYear(day, months[monthName], currentYear, currentMonth);
        
        const month = months[monthName];
        if (month !== undefined) {
          const date = new Date(year, month, day);
          // Ajustar para fuso horário brasileiro (GMT-3)
          date.setMinutes(date.getMinutes() + timezoneOffset);
          return date;
        }
      } else if (format.source.includes('/')) {
        // Formato: DD/MM/YYYY ou DD/MM
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JavaScript months are 0-based
        const year = match[3] ? parseInt(match[3]) : this.determineYear(day, month + 1, currentYear, currentMonth);
        
        const date = new Date(year, month, day);
        // Ajustar para fuso horário brasileiro (GMT-3)
        date.setMinutes(date.getMinutes() + timezoneOffset);
        return date;
      } else if (format.source.includes('\\w{3}')) {
        // Formato: DD MMM YYYY ou DD MMM
        const day = parseInt(match[1]);
        const monthAbbr = match[2].toLowerCase();
        const year = match[3] ? parseInt(match[3]) : this.determineYear(day, months[monthAbbr] + 1, currentYear, currentMonth);
        
        const month = months[monthAbbr];
        if (month !== undefined) {
          const date = new Date(year, month, day);
          // Ajustar para fuso horário brasileiro (GMT-3)
          date.setMinutes(date.getMinutes() + timezoneOffset);
          return date;
        }
      } else if (format.source.includes('-')) {
        // Formato: YYYY-MM-DD ou DD-MM-YYYY
        if (match[1].length === 4) {
          // YYYY-MM-DD
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          const date = new Date(year, month, day);
          // Ajustar para fuso horário brasileiro (GMT-3)
          date.setMinutes(date.getMinutes() + timezoneOffset);
          return date;
        } else {
          // DD-MM-YYYY
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const year = parseInt(match[3]);
          const date = new Date(year, month, day);
          // Ajustar para fuso horário brasileiro (GMT-3)
          date.setMinutes(date.getMinutes() + timezoneOffset);
          return date;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Determina o ano correto para datas sem ano
   */
  determineYear(day, month, currentYear, currentMonth) {
    // Se o mês é menor que o atual, ou se é o mesmo mês mas o dia já passou, usar próximo ano
    if (month < currentMonth || (month === currentMonth && day < new Date().getDate())) {
      return currentYear + 1;
    }
    return currentYear;
  }

  /**
   * Processa localização do evento
   */
  parseEventLocation(locationText) {
    if (!locationText) return null;
    
    try {
      const cleanLocation = locationText.trim();
      
      // Tenta extrair cidade e estado
      const locationMatch = cleanLocation.match(/(.+?),\s*([A-Z]{2})$/);
      
      if (locationMatch) {
        return {
          venue: locationMatch[1].trim(),
          city: locationMatch[1].trim(),
          state: locationMatch[2],
          address: cleanLocation
        };
      }
      
      // Fallback: usa texto completo como venue
      return {
        venue: cleanLocation,
        address: cleanLocation,
        city: this.extractCityFromLocation(cleanLocation),
        state: this.extractStateFromLocation(cleanLocation)
      };
      
    } catch (error) {
      this.logger.debug(`Erro ao processar localização "${locationText}":`, error.message);
      return {
        venue: locationText,
        address: locationText
      };
    }
  }

  /**
   * Extrai cidade da localização
   */
  extractCityFromLocation(locationText) {
    const cities = [
      'Ji-Paraná', 'Ariquemes', 'Cacoal', 'Rolim de Moura', 'Vilhena',
      'Porto Velho', 'São Paulo', 'Rio de Janeiro', 'Brasília',
      'Belo Horizonte', 'Salvador', 'Fortaleza', 'Recife', 'Curitiba'
    ];
    
    for (const city of cities) {
      if (locationText.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    
    return null;
  }

  /**
   * Extrai estado da localização
   */
  extractStateFromLocation(locationText) {
    const states = {
      'rondônia': 'RO', 'ro': 'RO',
      'são paulo': 'SP', 'sp': 'SP',
      'rio de janeiro': 'RJ', 'rj': 'RJ',
      'brasília': 'DF', 'df': 'DF'
    };
    
    const lowerLocation = locationText.toLowerCase();
    
    for (const [stateName, stateCode] of Object.entries(states)) {
      if (lowerLocation.includes(stateName)) {
        return stateCode;
      }
    }
    
    return null;
  }

  /**
   * Processa preço do evento
   */
  parseEventPrice(priceText) {
    if (!priceText) return null;
    
    try {
      const cleanPrice = priceText.toLowerCase();
      
      if (cleanPrice.includes('grátis') || cleanPrice.includes('gratuito') || cleanPrice.includes('free')) {
        return {
          min: 0,
          max: 0,
          currency: 'BRL',
          isFree: true
        };
      }
      
      // Extrai valores numéricos
      const priceMatch = priceText.match(/R\$?\s*(\d+(?:[,.]\d{2})?)/g);
      
      if (priceMatch) {
        const prices = priceMatch.map(p => {
          const numStr = p.replace(/R\$?\s*/, '').replace(',', '.');
          return parseFloat(numStr);
        });
        
        return {
          min: Math.min(...prices),
          max: Math.max(...prices),
          currency: 'BRL',
          isFree: false
        };
      }
      
      return null;
      
    } catch (error) {
      this.logger.debug(`Erro ao processar preço "${priceText}":`, error.message);
      return null;
    }
  }

  /**
   * Normaliza URL da imagem
   */
  normalizeImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    // Remove parâmetros desnecessários e garante HTTPS
    let cleanUrl = imageUrl.split('?')[0];
    
    if (cleanUrl.startsWith('//')) {
      cleanUrl = 'https:' + cleanUrl;
    } else if (cleanUrl.startsWith('/')) {
      cleanUrl = this.baseUrl + cleanUrl;
    }
    
    return cleanUrl;
  }

  /**
   * Normaliza URL do evento
   */
  normalizeEventUrl(eventUrl) {
    if (!eventUrl) return null;
    
    if (eventUrl.startsWith('/')) {
      return this.baseUrl + eventUrl;
    }
    
    return eventUrl;
  }

  /**
   * Classifica categoria do evento baseado no título e descrição
   */
  classifyEventCategory(title, description) {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    const categories = this.globalConfig.categories;
    
    for (const [categoryKey, categoryData] of Object.entries(categories)) {
      for (const keyword of categoryData.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return categoryKey;
        }
      }
    }
    
    return 'outros';
  }

  /**
   * Remove eventos duplicados
   */
  removeDuplicates(events) {
    const seen = new Set();
    
    return events.filter(event => {
      const key = `${event.title.toLowerCase()}_${event.date}`;
      
      if (seen.has(key)) {
        this.logger.debug(`Evento duplicado removido: "${event.title}"`);
        return false;
      }
      
      seen.add(key);
      return true;
    });
  }
}

module.exports = { SymplaScraper };