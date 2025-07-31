/**
 * Eventbrite Scraper
 * 
 * Scraper específico para coletar eventos do Eventbrite Brasil,
 * com foco na região de Ji-Paraná, Rondônia e eventos de artistas famosos.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { BaseScraper } = require('./base-scraper');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('../utils/error-handler');

class EventbriteScraper extends BaseScraper {
  constructor(config, scraperName = 'eventbrite') {
    super(config, scraperName);
    this.baseUrl = config.baseUrl || 'https://www.eventbrite.com.br';
    this.searchUrl = config.searchUrl || 'https://www.eventbrite.com.br/d/brazil/events/';
  }

  /**
   * Scraping principal de eventos
   */
  async scrapeEvents(filters = {}) {
    this.startStats();
    
    try {
      this.logger.info('Iniciando scraping do Eventbrite Brasil');
      
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
      
      this.logger.error('Erro durante scraping do Eventbrite', result.error);
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
    const searchUrl = `${this.baseUrl}/d/brazil/events/?q=${encodeURIComponent(searchTerm)}`;
    
    this.logger.debug(`Buscando eventos: ${searchUrl}`);
    
    try {
      await this.navigateToUrl(searchUrl);
      
      // Aguarda carregamento dos eventos
      const eventsLoaded = await this.waitForElement('[data-testid="event-card"], .event-card, .search-event-card', 10000);
      
      if (!eventsLoaded) {
        this.logger.warn(`Nenhum evento encontrado para "${searchTerm}"`);
        return [];
      }
      
      // Scroll para carregar mais eventos
      await this.scrollPage(2, 2000);
      
      // Extrai elementos de eventos
      const eventElements = await this.page.$$('[data-testid="event-card"], .event-card, .search-event-card');
      
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
        '[data-testid="event-title"]',
        '.event-title',
        'h3 a',
        '.event-card__title',
        '.search-event-card__title'
      ]);
      
      if (!title) {
        this.logger.debug('Elemento sem título válido, pulando');
        return null;
      }
      
      // Data do evento
      const dateText = await this.extractText(element, [
        '[data-testid="event-date"]',
        '.event-date',
        '.date-info',
        '.event-card__date',
        '.search-event-card__date'
      ]);
      
      // Local do evento
      const locationText = await this.extractText(element, [
        '[data-testid="event-location"]',
        '.event-location',
        '.venue-info',
        '.event-card__location',
        '.search-event-card__location'
      ]);
      
      // Imagem do evento
      const imageUrl = await this.extractAttribute(element, [
        '[data-testid="event-image"] img',
        '.event-image img',
        '.event-card__image img',
        '.search-event-card__image img'
      ], 'src');
      
      // Preço do evento
      const priceText = await this.extractText(element, [
        '[data-testid="event-price"]',
        '.event-price',
        '.price-info',
        '.event-card__price',
        '.search-event-card__price'
      ]);
      
      // Descrição do evento
      const description = await this.extractText(element, [
        '[data-testid="event-description"]',
        '.event-description',
        '.event-summary',
        '.event-card__description'
      ]);
      
      // Organizador
      const organizer = await this.extractText(element, [
        '.organizer-name',
        '.event-organizer',
        '.event-card__organizer'
      ]);
      
      // Link do evento
      const eventLink = await this.extractAttribute(element, [
        'a[href*="/e/"]',
        '.event-card a',
        '.search-event-card a'
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
        .trim();
      
      // Tenta diferentes formatos de data brasileira
      const dateFormats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
        /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,  // DD de MMMM de YYYY
        /(\w+)\s+(\d{1,2}),\s+(\d{4})/i  // MMMM DD, YYYY
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
      if (format.source.includes('de')) {
        // Formato: DD de MMMM de YYYY
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = parseInt(match[3]);
        
        const months = {
          'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
          'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
          'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
          'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3,
          'mai': 4, 'jun': 5, 'jul': 6, 'ago': 7,
          'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        
        const month = months[monthName];
        if (month !== undefined) {
          return new Date(year, month, day);
        }
      } else if (format.source.includes('/')) {
        // Formato: DD/MM/YYYY
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JavaScript months are 0-based
        const year = parseInt(match[3]);
        
        return new Date(year, month, day);
      }
      
      return null;
    } catch (error) {
      return null;
    }
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
      const cleanPrice = priceText.replace(/[^\d,.-]/g, '');
      
      if (cleanPrice.toLowerCase().includes('grátis') || cleanPrice.toLowerCase().includes('gratuito')) {
        return {
          min: 0,
          max: 0,
          currency: 'BRL',
          isFree: true
        };
      }
      
      // Extrai valores numéricos
      const priceMatch = cleanPrice.match(/(\d+(?:[,.]\d{2})?)/g);
      
      if (priceMatch) {
        const prices = priceMatch.map(p => parseFloat(p.replace(',', '.')));
        
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

module.exports = { EventbriteScraper };