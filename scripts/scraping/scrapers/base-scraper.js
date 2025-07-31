/**
 * Base Scraper - Interface comum para todos os scrapers
 * 
 * Define a interface padrão que todos os scrapers devem implementar,
 * incluindo validação de dados e rate limiting.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const puppeteer = require('puppeteer');
const { RateLimiter } = require('../utils/rate-limiter');
const { Logger } = require('../utils/logger');
const { ErrorHandler, ScrapingError, ErrorTypes, ErrorSeverity } = require('../utils/error-handler');
const config = require('../utils/config');

class BaseScraper {
  constructor(scraperConfig, scraperName = 'unknown') {
    if (this.constructor === BaseScraper) {
      throw new Error('BaseScraper é uma classe abstrata e não pode ser instanciada diretamente');
    }
    
    this.scraperName = scraperName;
    this.config = scraperConfig;
    this.globalConfig = config;
    this.logger = new Logger(`scraper:${scraperName}`);
    this.errorHandler = new ErrorHandler(`scraper:${scraperName}`);
    
    // Rate limiter específico para este scraper
    this.rateLimiter = new RateLimiter(
      scraperConfig.rateLimit || 2000,
      {
        maxDelay: 30000,
        maxRetries: this.globalConfig.scraping.maxRetries
      }
    );
    
    // Estatísticas do scraper
    this.stats = {
      totalAttempts: 0,
      successfulEvents: 0,
      rejectedEvents: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
    
    // Browser instance
    this.browser = null;
    this.page = null;
  }

  /**
   * Métodos abstratos que devem ser implementados pelas classes filhas
   */
  async scrapeEvents(filters) {
    throw new Error(`scrapeEvents deve ser implementado pela classe ${this.constructor.name}`);
  }

  async extractEventData(element) {
    throw new Error(`extractEventData deve ser implementado pela classe ${this.constructor.name}`);
  }

  /**
   * Inicializa o browser Puppeteer
   */
  async initializeBrowser() {
    try {
      this.logger.info('Inicializando browser Puppeteer');
      
      this.browser = await puppeteer.launch({
        headless: this.globalConfig.scraping.puppeteer.headless,
        args: this.globalConfig.scraping.puppeteer.args,
        defaultViewport: this.globalConfig.scraping.puppeteer.defaultViewport
      });
      
      this.page = await this.browser.newPage();
      
      // Configura headers
      await this.page.setExtraHTTPHeaders(this.globalConfig.scraping.headers);
      
      // Configura User-Agent
      await this.page.setUserAgent(this.globalConfig.scraping.userAgent);
      
      // Configura timeout
      this.page.setDefaultTimeout(this.globalConfig.scraping.timeout);
      
      this.logger.info('Browser inicializado com sucesso');
      
    } catch (error) {
      const scrapingError = new ScrapingError(
        `Falha ao inicializar browser: ${error.message}`,
        ErrorTypes.CONFIGURATION_ERROR,
        ErrorSeverity.CRITICAL,
        { scraperName: this.scraperName, originalError: error.name }
      );
      
      this.errorHandler.handle(scrapingError);
      throw scrapingError;
    }
  }

  /**
   * Navega para uma URL com rate limiting
   */
  async navigateToUrl(url) {
    try {
      await this.rateLimiter.wait();
      
      this.logger.debug(`Navegando para: ${url}`);
      
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.globalConfig.scraping.timeout
      });
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok()) {
        const statusCode = response.status();
        
        if (statusCode === 429) {
          const retryAfter = response.headers()['retry-after'];
          await this.rateLimiter.handleRateLimit(retryAfter);
          return await this.navigateToUrl(url); // Retry
        }
        
        throw new ScrapingError(
          `Erro HTTP ${statusCode} ao acessar ${url}`,
          statusCode >= 500 ? ErrorTypes.NETWORK_ERROR : ErrorTypes.SITE_STRUCTURE_CHANGED,
          statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
          { url, statusCode, scraperName: this.scraperName }
        );
      }
      
      this.logger.debug(`Navegação bem-sucedida para: ${url}`);
      return response;
      
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
      
      // Categoriza outros tipos de erro
      const result = this.errorHandler.handle(error, { url, scraperName: this.scraperName });
      
      if (result.shouldRetry && this.rateLimiter.shouldRetry()) {
        this.logger.warn(`Tentando novamente navegação para: ${url}`);
        await this.rateLimiter.handleError(0); // Generic retry
        return await this.navigateToUrl(url);
      }
      
      throw result.error;
    }
  }

  /**
   * Valida dados de evento coletado
   */
  async validateEventData(eventData) {
    const errors = [];
    const warnings = [];
    
    // Validações obrigatórias
    const requiredFields = this.globalConfig.validation.event.requiredFields;
    
    for (const field of requiredFields) {
      if (!eventData[field] || (typeof eventData[field] === 'string' && eventData[field].trim() === '')) {
        errors.push(`Campo obrigatório ausente: ${field}`);
      }
    }
    
    // Validação específica de título
    if (eventData.title) {
      const titleLength = eventData.title.trim().length;
      const minLength = this.config.qualityFilters?.minTitleLength || this.globalConfig.validation.event.titleMinLength;
      const maxLength = this.globalConfig.validation.event.titleMaxLength;
      
      if (titleLength < minLength) {
        errors.push(`Título muito curto: ${titleLength} caracteres (mínimo: ${minLength})`);
      }
      
      if (titleLength > maxLength) {
        warnings.push(`Título muito longo: ${titleLength} caracteres (máximo: ${maxLength})`);
        eventData.title = eventData.title.substring(0, maxLength) + '...';
      }
    }
    
    // Validação de data
    if (eventData.date) {
      const eventDate = new Date(eventData.date);
      const now = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setDate(now.getDate() + this.globalConfig.validation.event.maxDaysInFuture);
      
      if (isNaN(eventDate.getTime())) {
        errors.push('Data do evento inválida');
      } else if (this.globalConfig.validation.event.futureEventsOnly && eventDate < now) {
        errors.push('Evento já passou (apenas eventos futuros são aceitos)');
      } else if (eventDate > maxFutureDate) {
        warnings.push(`Evento muito distante no futuro: ${eventDate.toLocaleDateString()}`);
      }
    }
    
    // Validação de imagem (se obrigatória)
    if (this.config.qualityFilters?.requireImage && !eventData.image?.url) {
      errors.push('Imagem obrigatória não encontrada');
    }
    
    // Validação de descrição (se obrigatória)
    if (this.config.qualityFilters?.requireDescription && !eventData.description) {
      errors.push('Descrição obrigatória não encontrada');
    }
    
    // Validação de localização
    if (eventData.location && typeof eventData.location === 'object') {
      if (!eventData.location.venue && !eventData.location.address) {
        errors.push('Local do evento deve ter pelo menos venue ou endereço');
      }
    }
    
    // Log de warnings
    if (warnings.length > 0) {
      this.logger.warn(`Avisos na validação do evento "${eventData.title}":`, warnings);
    }
    
    // Retorna resultado da validação
    const isValid = errors.length === 0;
    
    if (!isValid) {
      this.logger.warn(`Evento rejeitado: "${eventData.title}"`, { errors, warnings });
      this.stats.rejectedEvents++;
    } else {
      this.stats.successfulEvents++;
    }
    
    return {
      isValid,
      errors,
      warnings,
      eventData
    };
  }

  /**
   * Processa lista de elementos de eventos
   */
  async processEventElements(elements, maxEvents = 50) {
    const events = [];
    let processedCount = 0;
    
    this.logger.info(`Processando ${elements.length} elementos de eventos (máximo: ${maxEvents})`);
    
    for (const element of elements) {
      if (processedCount >= maxEvents) {
        this.logger.info(`Limite de ${maxEvents} eventos atingido`);
        break;
      }
      
      try {
        this.stats.totalAttempts++;
        
        // Extrai dados do evento
        const eventData = await this.extractEventData(element);
        
        if (!eventData) {
          this.logger.debug('Elemento não retornou dados de evento');
          continue;
        }
        
        // Valida dados
        const validation = await this.validateEventData(eventData);
        
        if (validation.isValid) {
          // Adiciona metadados
          eventData.source = this.scraperName;
          eventData.scrapedAt = new Date().toISOString();
          eventData.isValid = true;
          
          events.push(eventData);
          processedCount++;
          
          this.logger.debug(`Evento válido coletado: "${eventData.title}"`);
        }
        
      } catch (error) {
        this.stats.errors++;
        const result = this.errorHandler.handle(error, { 
          scraperName: this.scraperName,
          elementIndex: processedCount 
        });
        
        this.logger.warn(`Erro ao processar elemento ${processedCount}: ${result.error.message}`);
        
        // Continua processamento mesmo com erro em elemento individual
        continue;
      }
    }
    
    this.logger.info(`Processamento concluído: ${events.length} eventos válidos de ${this.stats.totalAttempts} tentativas`);
    
    return events;
  }

  /**
   * Aguarda elemento aparecer na página
   */
  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      this.logger.warn(`Elemento não encontrado: ${selector}`);
      return false;
    }
  }

  /**
   * Extrai texto de elemento com fallback
   */
  async extractText(element, selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }
    
    for (const selector of selectors) {
      try {
        const textElement = await element.$(selector);
        if (textElement) {
          const text = await textElement.evaluate(el => el.textContent?.trim());
          if (text) {
            return text;
          }
        }
      } catch (error) {
        // Continua tentando próximo seletor
        continue;
      }
    }
    
    return null;
  }

  /**
   * Extrai atributo de elemento com fallback
   */
  async extractAttribute(element, selectors, attribute) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }
    
    for (const selector of selectors) {
      try {
        const targetElement = await element.$(selector);
        if (targetElement) {
          const value = await targetElement.evaluate((el, attr) => el.getAttribute(attr), attribute);
          if (value) {
            return value;
          }
        }
      } catch (error) {
        // Continua tentando próximo seletor
        continue;
      }
    }
    
    return null;
  }

  /**
   * Obtém estatísticas do scraper
   */
  getStats() {
    const duration = this.stats.endTime && this.stats.startTime ? 
      this.stats.endTime - this.stats.startTime : 0;
    
    return {
      ...this.stats,
      duration,
      successRate: this.stats.totalAttempts > 0 ? 
        Math.round((this.stats.successfulEvents / this.stats.totalAttempts) * 100) : 0,
      rateLimiterStats: this.rateLimiter.getStats(),
      errorHandlerStats: this.errorHandler.getStats()
    };
  }

  /**
   * Inicia cronômetro de estatísticas
   */
  startStats() {
    this.stats.startTime = Date.now();
  }

  /**
   * Para cronômetro de estatísticas
   */
  endStats() {
    this.stats.endTime = Date.now();
  }

  /**
   * Limpa recursos
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      this.logger.info('Recursos do scraper limpos com sucesso');
      
    } catch (error) {
      this.logger.error('Erro ao limpar recursos do scraper', error);
    }
  }

  /**
   * Método utilitário para scroll da página
   */
  async scrollPage(scrollCount = 3, delay = 1000) {
    for (let i = 0; i < scrollCount; i++) {
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await this.page.waitForTimeout(delay);
    }
  }

  /**
   * Método utilitário para capturar screenshot (debug)
   */
  async takeScreenshot(filename) {
    if (process.env.NODE_ENV === 'development') {
      try {
        const screenshotPath = `./screenshots/${this.scraperName}_${filename}_${Date.now()}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.logger.debug(`Screenshot salvo: ${screenshotPath}`);
      } catch (error) {
        this.logger.warn('Erro ao capturar screenshot', error);
      }
    }
  }
}

module.exports = { BaseScraper };