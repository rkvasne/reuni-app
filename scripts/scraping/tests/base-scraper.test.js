/**
 * Testes Unitários para Base Scraper
 */

const { BaseScraper } = require('../scrapers/base-scraper');

// Mock do puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setExtraHTTPHeaders: jest.fn(),
      setUserAgent: jest.fn(),
      setDefaultTimeout: jest.fn(),
      goto: jest.fn().mockResolvedValue({
        ok: () => true,
        status: () => 200,
        headers: () => ({})
      }),
      waitForSelector: jest.fn().mockResolvedValue(true),
      waitForTimeout: jest.fn(),
      evaluate: jest.fn(),
      screenshot: jest.fn(),
      close: jest.fn()
    }),
    close: jest.fn()
  })
}));

// Classe concreta para testes
class TestScraper extends BaseScraper {
  constructor(config) {
    super(config, 'test-scraper');
  }

  async scrapeEvents(filters) {
    return [
      {
        title: 'Evento Teste',
        date: new Date(Date.now() + 86400000).toISOString(), // Amanhã
        location: { venue: 'Local Teste', city: 'Ji-Paraná' },
        image: { url: 'https://example.com/image.jpg' }
      }
    ];
  }

  async extractEventData(element) {
    return {
      title: 'Evento Extraído',
      date: new Date(Date.now() + 86400000).toISOString(),
      location: { venue: 'Local Extraído', city: 'Ji-Paraná' },
      image: { url: 'https://example.com/extracted.jpg' }
    };
  }
}

describe('BaseScraper', () => {
  let scraper;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://example.com',
      rateLimit: 1000,
      qualityFilters: {
        requireImage: true,
        requireDescription: false,
        minTitleLength: 5
      }
    };

    scraper = new TestScraper(mockConfig);
  });

  afterEach(async () => {
    await scraper.cleanup();
  });

  describe('inicialização', () => {
    test('deve impedir instanciação direta da classe abstrata', () => {
      expect(() => {
        new BaseScraper(mockConfig);
      }).toThrow('BaseScraper é uma classe abstrata');
    });

    test('deve inicializar com configurações corretas', () => {
      expect(scraper.scraperName).toBe('test-scraper');
      expect(scraper.config).toBe(mockConfig);
      expect(scraper.rateLimiter).toBeDefined();
      expect(scraper.logger).toBeDefined();
      expect(scraper.errorHandler).toBeDefined();
    });

    test('deve inicializar estatísticas zeradas', () => {
      const stats = scraper.getStats();
      
      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulEvents).toBe(0);
      expect(stats.rejectedEvents).toBe(0);
      expect(stats.errors).toBe(0);
    });
  });

  describe('initializeBrowser', () => {
    test('deve inicializar browser com sucesso', async () => {
      await scraper.initializeBrowser();
      
      expect(scraper.browser).toBeDefined();
      expect(scraper.page).toBeDefined();
    });

    test('deve configurar headers e user agent', async () => {
      await scraper.initializeBrowser();
      
      expect(scraper.page.setExtraHTTPHeaders).toHaveBeenCalled();
      expect(scraper.page.setUserAgent).toHaveBeenCalled();
      expect(scraper.page.setDefaultTimeout).toHaveBeenCalled();
    });
  });

  describe('navigateToUrl', () => {
    beforeEach(async () => {
      await scraper.initializeBrowser();
    });

    test('deve navegar para URL com sucesso', async () => {
      const url = 'https://example.com/events';
      
      const response = await scraper.navigateToUrl(url);
      
      expect(scraper.page.goto).toHaveBeenCalledWith(url, {
        waitUntil: 'networkidle2',
        timeout: expect.any(Number)
      });
      expect(response.ok()).toBe(true);
    });

    test('deve tratar erro 429 com rate limiting', async () => {
      const url = 'https://example.com/events';
      
      // Mock rate limiter para não aguardar muito tempo
      scraper.rateLimiter.handleRateLimit = jest.fn().mockResolvedValue();
      
      // Mock resposta 429 seguida de sucesso
      scraper.page.goto
        .mockResolvedValueOnce({
          ok: () => false,
          status: () => 429,
          headers: () => ({ 'retry-after': '1' })
        })
        .mockResolvedValueOnce({
          ok: () => true,
          status: () => 200,
          headers: () => ({})
        });

      const response = await scraper.navigateToUrl(url);
      
      expect(response.ok()).toBe(true);
      expect(scraper.rateLimiter.handleRateLimit).toHaveBeenCalledWith('1');
    });
  });

  describe('validateEventData', () => {
    test('deve validar evento com dados completos', async () => {
      const eventData = {
        title: 'Show de Rock em Ji-Paraná',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: { venue: 'Arena Ji-Paraná', city: 'Ji-Paraná' },
        image: { url: 'https://example.com/show.jpg' },
        description: 'Grande show de rock'
      };

      const result = await scraper.validateEventData(eventData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(scraper.stats.successfulEvents).toBe(1);
    });

    test('deve rejeitar evento sem título', async () => {
      const eventData = {
        date: new Date(Date.now() + 86400000).toISOString(),
        location: { venue: 'Arena Ji-Paraná' },
        image: { url: 'https://example.com/show.jpg' }
      };

      const result = await scraper.validateEventData(eventData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campo obrigatório ausente: title');
      expect(scraper.stats.rejectedEvents).toBe(1);
    });

    test('deve rejeitar evento com título muito curto', async () => {
      const eventData = {
        title: 'ABC', // 3 caracteres, menor que mínimo de 5
        date: new Date(Date.now() + 86400000).toISOString(),
        location: { venue: 'Arena Ji-Paraná' },
        image: { url: 'https://example.com/show.jpg' }
      };

      const result = await scraper.validateEventData(eventData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Título muito curto'))).toBe(true);
    });

    test('deve rejeitar evento sem imagem quando obrigatória', async () => {
      const eventData = {
        title: 'Show sem imagem',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: { venue: 'Arena Ji-Paraná' }
        // Sem imagem
      };

      const result = await scraper.validateEventData(eventData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Imagem obrigatória não encontrada');
    });

    test('deve rejeitar evento com data passada', async () => {
      const eventData = {
        title: 'Evento do passado',
        date: new Date(Date.now() - 86400000).toISOString(), // Ontem
        location: { venue: 'Arena Ji-Paraná' },
        image: { url: 'https://example.com/show.jpg' }
      };

      const result = await scraper.validateEventData(eventData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Evento já passou (apenas eventos futuros são aceitos)');
    });

    test('deve rejeitar evento com data inválida', async () => {
      const eventData = {
        title: 'Evento com data inválida',
        date: 'data-inválida',
        location: { venue: 'Arena Ji-Paraná' },
        image: { url: 'https://example.com/show.jpg' }
      };

      const result = await scraper.validateEventData(eventData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data do evento inválida');
    });
  });

  describe('processEventElements', () => {
    test('deve processar elementos e retornar eventos válidos', async () => {
      const mockElements = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ];

      // Mock extractEventData para retornar dados válidos
      scraper.extractEventData = jest.fn()
        .mockResolvedValueOnce({
          title: 'Evento 1',
          date: new Date(Date.now() + 86400000).toISOString(),
          location: { venue: 'Local 1' },
          image: { url: 'https://example.com/1.jpg' }
        })
        .mockResolvedValueOnce({
          title: 'Evento 2',
          date: new Date(Date.now() + 86400000).toISOString(),
          location: { venue: 'Local 2' },
          image: { url: 'https://example.com/2.jpg' }
        })
        .mockResolvedValueOnce(null); // Terceiro elemento não retorna dados

      const events = await scraper.processEventElements(mockElements, 10);

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Evento 1');
      expect(events[1].title).toBe('Evento 2');
      expect(events[0].source).toBe('test-scraper');
      expect(events[0].scrapedAt).toBeDefined();
    });

    test('deve respeitar limite máximo de eventos', async () => {
      const mockElements = Array.from({ length: 10 }, (_, i) => ({ id: i }));

      scraper.extractEventData = jest.fn().mockResolvedValue({
        title: 'Evento Teste',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: { venue: 'Local Teste' },
        image: { url: 'https://example.com/test.jpg' }
      });

      const events = await scraper.processEventElements(mockElements, 3);

      expect(events).toHaveLength(3);
      expect(scraper.extractEventData).toHaveBeenCalledTimes(3);
    });

    test('deve continuar processamento mesmo com erros em elementos individuais', async () => {
      const mockElements = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ];

      scraper.extractEventData = jest.fn()
        .mockResolvedValueOnce({
          title: 'Evento 1',
          date: new Date(Date.now() + 86400000).toISOString(),
          location: { venue: 'Local 1' },
          image: { url: 'https://example.com/1.jpg' }
        })
        .mockRejectedValueOnce(new Error('Erro no elemento 2'))
        .mockResolvedValueOnce({
          title: 'Evento 3',
          date: new Date(Date.now() + 86400000).toISOString(),
          location: { venue: 'Local 3' },
          image: { url: 'https://example.com/3.jpg' }
        });

      const events = await scraper.processEventElements(mockElements, 10);

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Evento 1');
      expect(events[1].title).toBe('Evento 3');
      expect(scraper.stats.errors).toBe(1);
    });
  });

  describe('utilitários', () => {
    beforeEach(async () => {
      await scraper.initializeBrowser();
    });

    test('waitForElement deve aguardar elemento aparecer', async () => {
      scraper.page.waitForSelector.mockResolvedValue(true);

      const result = await scraper.waitForElement('.test-selector');

      expect(result).toBe(true);
      expect(scraper.page.waitForSelector).toHaveBeenCalledWith('.test-selector', { timeout: 10000 });
    });

    test('waitForElement deve retornar false se elemento não aparecer', async () => {
      scraper.page.waitForSelector.mockRejectedValue(new Error('Timeout'));

      const result = await scraper.waitForElement('.missing-selector');

      expect(result).toBe(false);
    });

    test('extractText deve extrair texto com fallback de seletores', async () => {
      const mockElement = {
        $: jest.fn()
          .mockResolvedValueOnce(null) // Primeiro seletor não encontra
          .mockResolvedValueOnce({ // Segundo seletor encontra
            evaluate: jest.fn().mockResolvedValue('Texto extraído')
          })
      };

      const text = await scraper.extractText(mockElement, ['.selector1', '.selector2']);

      expect(text).toBe('Texto extraído');
      expect(mockElement.$).toHaveBeenCalledTimes(2);
    });

    test('extractAttribute deve extrair atributo com fallback', async () => {
      const mockElement = {
        $: jest.fn().mockResolvedValue({
          evaluate: jest.fn().mockResolvedValue('https://example.com/image.jpg')
        })
      };

      const src = await scraper.extractAttribute(mockElement, '.img-selector', 'src');

      expect(src).toBe('https://example.com/image.jpg');
    });
  });

  describe('estatísticas', () => {
    test('deve rastrear estatísticas corretamente', async () => {
      scraper.startStats();
      
      // Aguarda um pouco para garantir diferença de tempo
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simula processamento
      scraper.stats.totalAttempts = 10;
      scraper.stats.successfulEvents = 7;
      scraper.stats.rejectedEvents = 2;
      scraper.stats.errors = 1;
      
      scraper.endStats();
      
      const stats = scraper.getStats();
      
      expect(stats.totalAttempts).toBe(10);
      expect(stats.successfulEvents).toBe(7);
      expect(stats.rejectedEvents).toBe(2);
      expect(stats.errors).toBe(1);
      expect(stats.successRate).toBe(70); // 7/10 * 100
      expect(stats.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanup', () => {
    test('deve limpar recursos corretamente', async () => {
      await scraper.initializeBrowser();
      
      expect(scraper.browser).toBeDefined();
      expect(scraper.page).toBeDefined();
      
      await scraper.cleanup();
      
      expect(scraper.page).toBeNull();
      expect(scraper.browser).toBeNull();
    });
  });
});