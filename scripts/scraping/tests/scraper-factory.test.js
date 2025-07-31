/**
 * Testes Unitários para Scraper Factory
 */

const { ScraperFactory, globalScraperFactory } = require('../scrapers/scraper-factory');

// Mock dos scrapers
jest.mock('../scrapers/eventbrite-scraper', () => ({
  EventbriteScraper: jest.fn().mockImplementation((config, name) => ({
    scraperName: name,
    config,
    cleanup: jest.fn().mockResolvedValue(),
    getStats: jest.fn().mockReturnValue({ totalEvents: 0 })
  }))
}));

jest.mock('../scrapers/sympla-scraper', () => ({
  SymplaScraper: jest.fn().mockImplementation((config, name) => ({
    scraperName: name,
    config,
    cleanup: jest.fn().mockResolvedValue(),
    getStats: jest.fn().mockReturnValue({ totalEvents: 0 })
  }))
}));

// Mock da configuração
jest.mock('../utils/config', () => ({
  scrapers: {
    eventbrite: {
      enabled: true,
      baseUrl: 'https://www.eventbrite.com.br',
      rateLimit: 2000,
      name: 'Eventbrite Brasil'
    },
    sympla: {
      enabled: true,
      baseUrl: 'https://www.sympla.com.br',
      rateLimit: 1500,
      name: 'Sympla Brasil'
    }
  }
}));

describe('ScraperFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new ScraperFactory();
  });

  afterEach(async () => {
    await factory.cleanup();
  });

  describe('inicialização', () => {
    test('deve registrar scrapers disponíveis', () => {
      const availableScrapers = factory.getAvailableScrapers();
      
      expect(availableScrapers).toHaveLength(2);
      expect(availableScrapers.map(s => s.type)).toContain('eventbrite');
      expect(availableScrapers.map(s => s.type)).toContain('sympla');
    });

    test('deve listar apenas scrapers habilitados', () => {
      const enabledScrapers = factory.getEnabledScrapers();
      
      expect(enabledScrapers).toHaveLength(2);
      expect(enabledScrapers.every(s => s.enabled)).toBe(true);
    });
  });

  describe('createScraper', () => {
    test('deve criar scraper Eventbrite com sucesso', () => {
      const scraper = factory.createScraper('eventbrite');
      
      expect(scraper).toBeDefined();
      expect(scraper.scraperName).toBe('eventbrite');
    });

    test('deve criar scraper Sympla com sucesso', () => {
      const scraper = factory.createScraper('sympla');
      
      expect(scraper).toBeDefined();
      expect(scraper.scraperName).toBe('sympla');
    });

    test('deve aceitar configuração customizada', () => {
      const customConfig = { rateLimit: 3000 };
      const scraper = factory.createScraper('eventbrite', customConfig);
      
      expect(scraper.config.rateLimit).toBe(3000);
    });

    test('deve falhar para tipo não suportado', () => {
      expect(() => {
        factory.createScraper('unsupported');
      }).toThrow('Tipo de scraper não suportado: unsupported');
    });

    test('deve ser case-insensitive', () => {
      const scraper1 = factory.createScraper('EVENTBRITE');
      const scraper2 = factory.createScraper('Sympla');
      
      expect(scraper1.scraperName).toBe('eventbrite');
      expect(scraper2.scraperName).toBe('sympla');
    });
  });

  describe('createScrapers', () => {
    test('deve criar múltiplos scrapers com sucesso', () => {
      const result = factory.createScrapers(['eventbrite', 'sympla']);
      
      expect(result.scrapers).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('deve lidar com tipos inválidos graciosamente', () => {
      const result = factory.createScrapers(['eventbrite', 'invalid', 'sympla']);
      
      expect(result.scrapers).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid');
    });

    test('deve falhar se nenhum scraper puder ser criado', () => {
      expect(() => {
        factory.createScrapers(['invalid1', 'invalid2']);
      }).toThrow('Nenhum scraper pôde ser criado');
    });

    test('deve aplicar configuração customizada por tipo', () => {
      const customConfig = {
        eventbrite: { rateLimit: 3000 },
        sympla: { rateLimit: 2500 }
      };
      
      const result = factory.createScrapers(['eventbrite', 'sympla'], customConfig);
      
      expect(result.scrapers[0].config.rateLimit).toBe(3000);
      expect(result.scrapers[1].config.rateLimit).toBe(2500);
    });
  });

  describe('getScraper (singleton)', () => {
    test('deve reutilizar instância para mesma configuração', () => {
      const scraper1 = factory.getScraper('eventbrite');
      const scraper2 = factory.getScraper('eventbrite');
      
      expect(scraper1).toBe(scraper2);
    });

    test('deve criar nova instância para configuração diferente', () => {
      const scraper1 = factory.getScraper('eventbrite', { rateLimit: 2000 });
      const scraper2 = factory.getScraper('eventbrite', { rateLimit: 3000 });
      
      expect(scraper1).not.toBe(scraper2);
    });
  });

  describe('validação', () => {
    test('isSupported deve verificar tipos suportados', () => {
      expect(factory.isSupported('eventbrite')).toBe(true);
      expect(factory.isSupported('sympla')).toBe(true);
      expect(factory.isSupported('invalid')).toBe(false);
    });

    test('isEnabled deve verificar scrapers habilitados', () => {
      expect(factory.isEnabled('eventbrite')).toBe(true);
      expect(factory.isEnabled('sympla')).toBe(true);
      expect(factory.isEnabled('invalid')).toBe(false);
    });

    test('validateScraperConfig deve validar configurações', () => {
      const validConfig = { rateLimit: 2000, timeout: 30000 };
      const result = factory.validateScraperConfig('eventbrite', validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.mergedConfig).toBeDefined();
    });

    test('validateScraperConfig deve rejeitar configurações inválidas', () => {
      const invalidConfig = { rateLimit: 50, timeout: 100000 }; // Muito baixo e muito alto
      const result = factory.validateScraperConfig('eventbrite', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.mergedConfig).toBeNull();
    });

    test('validateScraperConfig deve rejeitar tipos não suportados', () => {
      const result = factory.validateScraperConfig('invalid', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipo de scraper não suportado: invalid');
    });
  });

  describe('configuração', () => {
    test('getScraperConfig deve retornar configuração do scraper', () => {
      const config = factory.getScraperConfig('eventbrite');
      
      expect(config).toBeDefined();
      expect(config.baseUrl).toBe('https://www.eventbrite.com.br');
      expect(config.rateLimit).toBe(2000);
    });

    test('getScraperConfig deve retornar null para tipo inválido', () => {
      const config = factory.getScraperConfig('invalid');
      
      expect(config).toBeNull();
    });
  });

  describe('estatísticas', () => {
    test('getAllStats deve retornar estatísticas de scrapers ativos', () => {
      // Cria alguns scrapers
      factory.getScraper('eventbrite');
      factory.getScraper('sympla');
      
      const stats = factory.getAllStats();
      
      expect(stats.activeScrapers).toBe(2);
      expect(stats.availableScrapers).toBe(2);
      expect(stats.enabledScrapers).toBe(2);
      expect(stats.scraperStats).toBeDefined();
    });
  });

  describe('cleanup', () => {
    test('deve limpar todas as instâncias de scrapers', async () => {
      const scraper1 = factory.getScraper('eventbrite');
      const scraper2 = factory.getScraper('sympla');
      
      expect(factory.scraperInstances.size).toBe(2);
      
      await factory.cleanup();
      
      expect(factory.scraperInstances.size).toBe(0);
      expect(scraper1.cleanup).toHaveBeenCalled();
      expect(scraper2.cleanup).toHaveBeenCalled();
    });
  });

  describe('métodos estáticos', () => {
    test('createScraper estático deve funcionar', () => {
      const scraper = ScraperFactory.createScraper('eventbrite');
      
      expect(scraper).toBeDefined();
      expect(scraper.scraperName).toBe('eventbrite');
    });

    test('getSupportedScrapers estático deve retornar tipos', () => {
      const types = ScraperFactory.getSupportedScrapers();
      
      expect(types).toContain('eventbrite');
      expect(types).toContain('sympla');
    });

    test('getEnabledScrapers estático deve retornar apenas habilitados', () => {
      const types = ScraperFactory.getEnabledScrapers();
      
      expect(types).toContain('eventbrite');
      expect(types).toContain('sympla');
    });
  });

  describe('instância global', () => {
    test('globalScraperFactory deve estar disponível', () => {
      expect(globalScraperFactory).toBeInstanceOf(ScraperFactory);
    });

    test('globalScraperFactory deve funcionar como instância normal', () => {
      const scraper = globalScraperFactory.createScraper('eventbrite');
      
      expect(scraper).toBeDefined();
      expect(scraper.scraperName).toBe('eventbrite');
    });
  });

  describe('carregamento lazy', () => {
    test('deve carregar classes de scraper apenas quando necessário', () => {
      // Verifica que as classes não foram carregadas ainda
      const { EventbriteScraper } = require('../scrapers/eventbrite-scraper');
      const { SymplaScraper } = require('../scrapers/sympla-scraper');
      
      // Limpa mocks
      EventbriteScraper.mockClear();
      SymplaScraper.mockClear();
      
      // Cria apenas Eventbrite
      factory.createScraper('eventbrite');
      
      expect(EventbriteScraper).toHaveBeenCalled();
      expect(SymplaScraper).not.toHaveBeenCalled();
    });
  });
});