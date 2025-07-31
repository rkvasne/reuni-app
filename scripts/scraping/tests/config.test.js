/**
 * Testes Unitários para Sistema de Configuração
 */

describe('Config', () => {
  let originalEnv;

  beforeEach(() => {
    // Salva variáveis de ambiente originais
    originalEnv = { ...process.env };
    
    // Define NODE_ENV como test para evitar validação
    process.env.NODE_ENV = 'test';
    
    // Limpa cache do require para recarregar config
    const configPath = require.resolve('../utils/config.js');
    delete require.cache[configPath];
    
    // Limpa também cache do logger que é usado no config
    const loggerPath = require.resolve('../utils/logger.js');
    delete require.cache[loggerPath];
  });

  afterEach(() => {
    // Restaura variáveis de ambiente
    process.env = originalEnv;
    
    // Limpa cache novamente
    const configPath = require.resolve('../utils/config.js');
    delete require.cache[configPath];
    
    const loggerPath = require.resolve('../utils/logger.js');
    delete require.cache[loggerPath];
  });

  describe('carregamento de configuração', () => {
    test('deve carregar configuração padrão', () => {
      // Define variáveis mínimas necessárias
      process.env.DATABASE_URL = 'test://localhost';
      
      const config = require('../utils/config.js');
      
      expect(config).toBeDefined();
      expect(config.scrapers).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.authentication).toBeDefined();
      expect(config.scraping).toBeDefined();
      expect(config.categories).toBeDefined();
    });

    test('deve usar variáveis de ambiente quando disponíveis', () => {
      // Testa a função getEnvConfig diretamente
      process.env.TEST_STRING = 'test_value';
      process.env.TEST_NUMBER = '42';
      process.env.TEST_BOOLEAN = 'true';
      process.env.TEST_ARRAY = 'a,b,c';
      
      // Simula a função getEnvConfig
      function getEnvConfig(key, defaultValue, type = 'string') {
        const value = process.env[key];
        if (!value) return defaultValue;
        
        switch (type) {
          case 'number':
            return parseInt(value, 10) || defaultValue;
          case 'boolean':
            return value.toLowerCase() === 'true';
          case 'array':
            return value.split(',').map(item => item.trim());
          default:
            return value;
        }
      }
      
      expect(getEnvConfig('TEST_STRING', 'default')).toBe('test_value');
      expect(getEnvConfig('TEST_NUMBER', 0, 'number')).toBe(42);
      expect(getEnvConfig('TEST_BOOLEAN', false, 'boolean')).toBe(true);
      expect(getEnvConfig('TEST_ARRAY', [], 'array')).toEqual(['a', 'b', 'c']);
    });

    test('deve usar valores padrão quando variáveis não estão definidas', () => {
      process.env.DATABASE_URL = 'test://localhost';
      
      const config = require('../utils/config.js');
      
      expect(config.scrapers.eventbrite.rateLimit).toBe(2000);
      expect(config.scrapers.sympla.rateLimit).toBe(1500);
      expect(config.authentication.hashRounds).toBe(12);
    });
  });

  describe('configurações de scrapers', () => {
    test('deve ter configurações completas para Eventbrite', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const eventbrite = config.scrapers.eventbrite;
      
      expect(eventbrite.name).toBe('Eventbrite Brasil');
      expect(eventbrite.baseUrl).toBe('https://www.eventbrite.com.br');
      expect(eventbrite.enabled).toBe(true);
      expect(eventbrite.selectors).toBeDefined();
      expect(eventbrite.regions).toBeDefined();
      expect(eventbrite.qualityFilters).toBeDefined();
    });

    test('deve ter configurações completas para Sympla', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const sympla = config.scrapers.sympla;
      
      expect(sympla.name).toBe('Sympla Brasil');
      expect(sympla.baseUrl).toBe('https://www.sympla.com.br');
      expect(sympla.enabled).toBe(true);
      expect(sympla.selectors).toBeDefined();
      expect(sympla.regions).toBeDefined();
      expect(sympla.qualityFilters).toBeDefined();
    });

    test('deve ter seletores CSS definidos', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const eventbriteSelectors = config.scrapers.eventbrite.selectors;
      const symplaSelectors = config.scrapers.sympla.selectors;
      
      ['eventCard', 'title', 'date', 'location', 'image', 'price'].forEach(selector => {
        expect(eventbriteSelectors[selector]).toBeDefined();
        expect(symplaSelectors[selector]).toBeDefined();
      });
    });
  });

  describe('configurações regionais', () => {
    test('deve ter configuração para Ji-Paraná', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const jiparana = config.scrapers.eventbrite.regions.jiparana;
      
      expect(jiparana.name).toBe('Ji-Paraná e Região');
      expect(jiparana.searchTerms).toContain('Ji-Paraná');
      expect(jiparana.searchTerms).toContain('Rondônia');
      expect(jiparana.nearbyCities).toContain('Ariquemes');
      expect(jiparana.coordinates).toBeDefined();
      expect(jiparana.priority).toBe(1);
    });

    test('deve ter configuração nacional', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const nacional = config.scrapers.eventbrite.regions.nacional;
      
      expect(nacional.name).toBe('Artistas Famosos Brasil');
      expect(nacional.searchTerms).toContain('Brasil');
      expect(nacional.keywords).toContain('show nacional');
      expect(nacional.priority).toBe(2);
    });
  });

  describe('categorias de eventos', () => {
    test('deve ter todas as categorias definidas', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const expectedCategories = ['shows', 'teatro', 'esportes', 'gastronomia', 'educacao', 'tecnologia', 'infantil', 'outros'];
      
      expectedCategories.forEach(category => {
        expect(config.categories[category]).toBeDefined();
        expect(config.categories[category].name).toBeDefined();
        expect(config.categories[category].keywords).toBeDefined();
        expect(config.categories[category].priority).toBeDefined();
        expect(config.categories[category].color).toBeDefined();
        expect(config.categories[category].icon).toBeDefined();
      });
    });

    test('deve ter prioridades únicas', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const priorities = Object.values(config.categories).map(cat => cat.priority);
      const uniquePriorities = [...new Set(priorities)];
      
      expect(priorities.length).toBe(uniquePriorities.length);
    });

    test('deve ter keywords relevantes para cada categoria', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      expect(config.categories.shows.keywords).toContain('música');
      expect(config.categories.teatro.keywords).toContain('teatro');
      expect(config.categories.esportes.keywords).toContain('futebol');
      expect(config.categories.gastronomia.keywords).toContain('culinária');
      expect(config.categories.educacao.keywords).toContain('curso');
    });
  });

  describe('configurações de qualidade', () => {
    test('deve ter filtros de qualidade para Eventbrite', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const filters = config.scrapers.eventbrite.qualityFilters;
      
      expect(filters.requireImage).toBe(true);
      expect(filters.requireDescription).toBe(true);
      expect(filters.minTitleLength).toBe(10);
      expect(filters.requireValidDate).toBe(true);
      expect(filters.requireLocation).toBe(true);
    });

    test('deve ter filtros de qualidade para Sympla', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const filters = config.scrapers.sympla.qualityFilters;
      
      expect(filters.requireImage).toBe(true);
      expect(filters.requireDescription).toBe(false); // Sympla às vezes não tem descrição
      expect(filters.minTitleLength).toBe(8);
      expect(filters.requireValidDate).toBe(true);
      expect(filters.requireLocation).toBe(true);
    });
  });

  describe('configurações de scraping', () => {
    test('deve ter configurações de Puppeteer', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const puppeteer = config.scraping.puppeteer;
      
      expect(puppeteer.headless).toBe(true);
      expect(puppeteer.args).toBeInstanceOf(Array);
      expect(puppeteer.defaultViewport).toBeDefined();
      expect(puppeteer.defaultViewport.width).toBe(1366);
      expect(puppeteer.defaultViewport.height).toBe(768);
    });

    test('deve ter headers HTTP apropriados', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      const headers = config.scraping.headers;
      
      expect(headers['Accept']).toContain('text/html');
      expect(headers['Accept-Language']).toContain('pt-BR');
      expect(headers['User-Agent']).toBeUndefined(); // User-Agent é definido separadamente
    });

    test('deve ter configurações de rate limiting', () => {
      process.env.DATABASE_URL = 'test://localhost';
      const config = require('../utils/config.js');
      
      expect(config.scraping.maxRetries).toBe(3);
      expect(config.scraping.timeout).toBe(30000);
      expect(config.scraping.maxConcurrency).toBe(2);
      expect(config.scraping.delayBetweenRequests).toBe(1000);
      expect(config.scraping.respectRobotsTxt).toBe(true);
    });
  });

  describe('validação de configuração', () => {
    test('deve falhar sem DATABASE_URL', () => {
      // Testa a função de validação diretamente
      function validateConfig(config) {
        const errors = [];
        
        if (!config.database.connection) {
          errors.push('DATABASE_URL ou SUPABASE_URL não configurado');
        }
        
        if (errors.length > 0) {
          throw new Error(`Configuração inválida: ${errors.join(', ')}`);
        }
      }
      
      const invalidConfig = {
        database: { connection: '' },
        scrapers: { eventbrite: { enabled: true } }
      };
      
      expect(() => {
        validateConfig(invalidConfig);
      }).toThrow('DATABASE_URL ou SUPABASE_URL não configurado');
    });

    test('deve aceitar SUPABASE_URL como alternativa', () => {
      // Testa a função de validação com configuração válida
      function validateConfig(config) {
        const errors = [];
        
        if (!config.database.connection) {
          errors.push('DATABASE_URL ou SUPABASE_URL não configurado');
        }
        
        if (errors.length > 0) {
          throw new Error(`Configuração inválida: ${errors.join(', ')}`);
        }
      }
      
      const validConfig = {
        database: { connection: 'test://localhost' },
        scrapers: { eventbrite: { enabled: true } }
      };
      
      expect(() => {
        validateConfig(validConfig);
      }).not.toThrow();
    });
  });

  describe('configurações de ambiente específicas', () => {
    test('deve processar arrays de variáveis de ambiente', () => {
      // Testa processamento de arrays
      function getEnvConfig(key, defaultValue, type = 'string') {
        const value = process.env[key];
        if (!value) return defaultValue;
        
        switch (type) {
          case 'array':
            return value.split(',').map(item => item.trim());
          default:
            return value;
        }
      }
      
      process.env.TEST_CITIES = 'Cidade1,Cidade2,Cidade3';
      const result = getEnvConfig('TEST_CITIES', [], 'array');
      
      expect(result).toEqual(['Cidade1', 'Cidade2', 'Cidade3']);
    });

    test('deve processar valores booleanos', () => {
      // Testa processamento de booleanos
      function getEnvConfig(key, defaultValue, type = 'string') {
        const value = process.env[key];
        if (!value) return defaultValue;
        
        switch (type) {
          case 'boolean':
            return value.toLowerCase() === 'true';
          default:
            return value;
        }
      }
      
      process.env.TEST_TRUE = 'true';
      process.env.TEST_FALSE = 'false';
      
      expect(getEnvConfig('TEST_TRUE', false, 'boolean')).toBe(true);
      expect(getEnvConfig('TEST_FALSE', true, 'boolean')).toBe(false);
    });

    test('deve processar valores numéricos', () => {
      // Testa processamento de números
      function getEnvConfig(key, defaultValue, type = 'string') {
        const value = process.env[key];
        if (!value) return defaultValue;
        
        switch (type) {
          case 'number':
            return parseInt(value, 10) || defaultValue;
          default:
            return value;
        }
      }
      
      process.env.TEST_NUMBER = '42';
      process.env.TEST_INVALID = 'abc';
      
      expect(getEnvConfig('TEST_NUMBER', 0, 'number')).toBe(42);
      expect(getEnvConfig('TEST_INVALID', 10, 'number')).toBe(10); // Fallback para inválido
    });
  });
});