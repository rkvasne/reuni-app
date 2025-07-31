/**
 * Scraper Factory
 * 
 * Factory pattern para criar instâncias de scrapers específicos
 * com configuração apropriada e carregamento lazy.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { Logger } = require('../utils/logger');
const config = require('../utils/config');

class ScraperFactory {
  constructor() {
    this.logger = new Logger('scraper-factory');
    this.scraperInstances = new Map();
    this.scraperClasses = new Map();
    
    // Registro lazy dos scrapers
    this.registerScrapers();
  }

  /**
   * Registra scrapers disponíveis com carregamento lazy
   */
  registerScrapers() {
    // Eventbrite Scraper
    this.scraperClasses.set('eventbrite', {
      name: 'Eventbrite Brasil',
      description: 'Scraper para eventos do Eventbrite Brasil',
      enabled: config.scrapers.eventbrite.enabled,
      config: config.scrapers.eventbrite,
      loader: () => require('./eventbrite-scraper').EventbriteScraper
    });

    // Sympla Scraper
    this.scraperClasses.set('sympla', {
      name: 'Sympla Brasil',
      description: 'Scraper para eventos do Sympla Brasil',
      enabled: config.scrapers.sympla.enabled,
      config: config.scrapers.sympla,
      loader: () => require('./sympla-scraper').SymplaScraper
    });

    this.logger.info(`${this.scraperClasses.size} scrapers registrados`);
  }

  /**
   * Cria instância de scraper específico
   */
  createScraper(type, customConfig = {}) {
    const scraperType = type.toLowerCase();
    
    if (!this.scraperClasses.has(scraperType)) {
      const availableTypes = Array.from(this.scraperClasses.keys()).join(', ');
      throw new Error(`Tipo de scraper não suportado: ${type}. Tipos disponíveis: ${availableTypes}`);
    }

    const scraperInfo = this.scraperClasses.get(scraperType);
    
    if (!scraperInfo.enabled) {
      throw new Error(`Scraper ${scraperInfo.name} está desabilitado na configuração`);
    }

    try {
      // Carregamento lazy da classe do scraper
      const ScraperClass = scraperInfo.loader();
      
      // Mescla configuração padrão com customizações
      const finalConfig = {
        ...scraperInfo.config,
        ...customConfig
      };

      // Cria instância
      const scraperInstance = new ScraperClass(finalConfig, scraperType);
      
      this.logger.info(`Scraper ${scraperInfo.name} criado com sucesso`);
      
      return scraperInstance;
      
    } catch (error) {
      this.logger.error(`Erro ao criar scraper ${scraperInfo.name}:`, error);
      throw new Error(`Falha ao criar scraper ${type}: ${error.message}`);
    }
  }

  /**
   * Cria múltiplos scrapers
   */
  createScrapers(types, customConfig = {}) {
    const scrapers = [];
    const errors = [];

    for (const type of types) {
      try {
        const scraper = this.createScraper(type, customConfig[type] || {});
        scrapers.push(scraper);
      } catch (error) {
        errors.push({ type, error: error.message });
        this.logger.error(`Falha ao criar scraper ${type}:`, error);
      }
    }

    if (scrapers.length === 0 && errors.length > 0) {
      throw new Error(`Nenhum scraper pôde ser criado. Erros: ${errors.map(e => `${e.type}: ${e.error}`).join(', ')}`);
    }

    if (errors.length > 0) {
      this.logger.warn(`Alguns scrapers falharam ao ser criados:`, errors);
    }

    this.logger.info(`${scrapers.length} scraper(s) criado(s) com sucesso`);
    
    return {
      scrapers,
      errors,
      successCount: scrapers.length,
      errorCount: errors.length
    };
  }

  /**
   * Obtém scraper singleton (reutiliza instância)
   */
  getScraper(type, customConfig = {}) {
    const cacheKey = `${type}_${JSON.stringify(customConfig)}`;
    
    if (this.scraperInstances.has(cacheKey)) {
      this.logger.debug(`Reutilizando instância de scraper: ${type}`);
      return this.scraperInstances.get(cacheKey);
    }

    const scraper = this.createScraper(type, customConfig);
    this.scraperInstances.set(cacheKey, scraper);
    
    return scraper;
  }

  /**
   * Lista scrapers disponíveis
   */
  getAvailableScrapers() {
    return Array.from(this.scraperClasses.entries()).map(([type, info]) => ({
      type,
      name: info.name,
      description: info.description,
      enabled: info.enabled,
      baseUrl: info.config.baseUrl
    }));
  }

  /**
   * Lista apenas scrapers habilitados
   */
  getEnabledScrapers() {
    return this.getAvailableScrapers().filter(scraper => scraper.enabled);
  }

  /**
   * Verifica se um tipo de scraper é suportado
   */
  isSupported(type) {
    return this.scraperClasses.has(type.toLowerCase());
  }

  /**
   * Verifica se um scraper está habilitado
   */
  isEnabled(type) {
    const scraperInfo = this.scraperClasses.get(type.toLowerCase());
    return scraperInfo ? scraperInfo.enabled : false;
  }

  /**
   * Obtém configuração de um scraper
   */
  getScraperConfig(type) {
    const scraperInfo = this.scraperClasses.get(type.toLowerCase());
    return scraperInfo ? { ...scraperInfo.config } : null;
  }

  /**
   * Valida configuração de scraper
   */
  validateScraperConfig(type, customConfig) {
    if (!this.isSupported(type)) {
      return {
        isValid: false,
        errors: [`Tipo de scraper não suportado: ${type}`]
      };
    }

    const errors = [];
    const scraperInfo = this.scraperClasses.get(type.toLowerCase());
    
    // Validações básicas
    if (customConfig.rateLimit && (customConfig.rateLimit < 100 || customConfig.rateLimit > 10000)) {
      errors.push('Rate limit deve estar entre 100ms e 10000ms');
    }

    if (customConfig.timeout && (customConfig.timeout < 5000 || customConfig.timeout > 60000)) {
      errors.push('Timeout deve estar entre 5000ms e 60000ms');
    }

    if (customConfig.baseUrl && !customConfig.baseUrl.startsWith('http')) {
      errors.push('Base URL deve começar com http ou https');
    }

    return {
      isValid: errors.length === 0,
      errors,
      mergedConfig: errors.length === 0 ? { ...scraperInfo.config, ...customConfig } : null
    };
  }

  /**
   * Limpa todas as instâncias de scrapers
   */
  async cleanup() {
    this.logger.info('Limpando instâncias de scrapers...');
    
    const cleanupPromises = [];
    
    for (const [key, scraper] of this.scraperInstances.entries()) {
      if (typeof scraper.cleanup === 'function') {
        cleanupPromises.push(
          scraper.cleanup().catch(error => {
            this.logger.error(`Erro ao limpar scraper ${key}:`, error);
          })
        );
      }
    }

    await Promise.all(cleanupPromises);
    
    this.scraperInstances.clear();
    this.logger.info('Limpeza de scrapers concluída');
  }

  /**
   * Obtém estatísticas de todos os scrapers ativos
   */
  getAllStats() {
    const stats = {};
    
    for (const [key, scraper] of this.scraperInstances.entries()) {
      if (typeof scraper.getStats === 'function') {
        stats[key] = scraper.getStats();
      }
    }

    return {
      activeScrapers: this.scraperInstances.size,
      availableScrapers: this.scraperClasses.size,
      enabledScrapers: this.getEnabledScrapers().length,
      scraperStats: stats
    };
  }

  /**
   * Métodos estáticos para compatibilidade
   */
  static createScraper(type, customConfig = {}) {
    const factory = new ScraperFactory();
    return factory.createScraper(type, customConfig);
  }

  static getSupportedScrapers() {
    const factory = new ScraperFactory();
    return factory.getAvailableScrapers().map(scraper => scraper.type);
  }

  static getEnabledScrapers() {
    const factory = new ScraperFactory();
    return factory.getEnabledScrapers().map(scraper => scraper.type);
  }
}

// Instância singleton global
const globalScraperFactory = new ScraperFactory();

module.exports = { 
  ScraperFactory, 
  globalScraperFactory 
};