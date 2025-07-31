/**
 * Testes de Integração - Fluxo Completo de Scraping
 */

const { ScrapingOrchestrator } = require('../../index');
const { DatabaseHandler } = require('../../storage/database-handler');
const { ScraperFactory } = require('../../scrapers/scraper-factory');

// Mock das dependências externas
jest.mock('../../storage/database-handler');
jest.mock('../../scrapers/scraper-factory');
jest.mock('../../auth/authenticator');
jest.mock('../../cli/interactive-menu');
jest.mock('puppeteer');

describe('Integração - Fluxo Completo de Scraping', () => {
  let orchestrator;
  let mockDbHandler;
  let mockScraperFactory;

  beforeEach(() => {
    // Setup mocks
    mockDbHandler = {
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(true),
      insertEventsBatch: jest.fn().mockResolvedValue({
        inserted: [{ id: 1 }, { id: 2 }],
        duplicates: [],
        errors: []
      }),
      isConnected: true
    };

    mockScraperFactory = {
      createScraper: jest.fn().mockResolvedValue({
        scraperName: 'eventbrite',
        scrapeEvents: jest.fn().mockResolvedValue([
          {
            title: 'Show de Rock Nacional',
            description: 'Grande show com bandas famosas',
            date: '2024-03-15T20:00:00.000Z',
            location: { venue: 'Teatro Municipal', city: 'São Paulo' },
            image: { url: 'https://example.com/image.jpg' },
            price: { min: 50, max: 50, currency: 'BRL', isFree: false },
            source: 'eventbrite'
          },
          {
            title: 'Festival de Música',
            description: 'Festival com vários artistas',
            date: '2024-03-20T18:00:00.000Z',
            location: { venue: 'Parque da Cidade', city: 'Ji-Paraná' },
            image: { url: 'https://example.com/festival.jpg' },
            price: { min: 0, max: 0, currency: 'BRL', isFree: true },
            source: 'eventbrite'
          }
        ])
      })
    };

    DatabaseHandler.mockImplementation(() => mockDbHandler);
    ScraperFactory.mockImplementation(() => mockScraperFactory);

    orchestrator = new ScrapingOrchestrator();
    
    // Mock do menu interativo
    orchestrator.menu.showMainMenu = jest.fn().mockResolvedValue({
      action: 'start_scraping',
      config: {
        sources: ['eventbrite'],
        options: {
          maxEvents: 50,
          categories: ['shows'],
          dateRange: 'next_30_days',
          requireImages: true
        },
        region: 'jiparana_and_national'
      }
    });

    // Mock da autenticação
    orchestrator.authenticator.authenticate = jest.fn().mockResolvedValue({
      success: true,
      username: 'test_user'
    });

    // Mock do monitoramento
    orchestrator.structureMonitor.checkAllStructures = jest.fn().mockResolvedValue({
      eventbrite: { success: true, overallHealth: 85 }
    });

    // Mock dos relatórios
    orchestrator.reportGenerator.generateCompleteReport = jest.fn().mockResolvedValue({
      success: true,
      files: { html: { filename: 'report.html' } }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fluxo Completo', () => {
    test('deve executar fluxo completo com sucesso', async () => {
      // Mock do console para evitar output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await orchestrator.run();

      // Verifica se todas as etapas foram executadas
      expect(orchestrator.authenticator.authenticate).toHaveBeenCalled();
      expect(orchestrator.structureMonitor.checkAllStructures).toHaveBeenCalled();
      expect(orchestrator.menu.showMainMenu).toHaveBeenCalled();
      expect(mockScraperFactory.createScraper).toHaveBeenCalledWith('eventbrite');
      expect(mockDbHandler.connect).toHaveBeenCalled();
      expect(mockDbHandler.insertEventsBatch).toHaveBeenCalled();
      expect(orchestrator.reportGenerator.generateCompleteReport).toHaveBeenCalled();
      expect(mockDbHandler.disconnect).toHaveBeenCalled();

      // Verifica estatísticas finais
      expect(orchestrator.executionStats.eventsInserted).toBe(2);
      expect(orchestrator.executionStats.eventsDuplicated).toBe(0);

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });

    test('deve lidar com falha na autenticação', async () => {
      orchestrator.authenticator.authenticate.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      });

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await orchestrator.run();

      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    test('deve lidar com falha na conexão do banco', async () => {
      mockDbHandler.connect.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Deve continuar mesmo com falha no banco
      await expect(orchestrator.run()).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });

    test('deve processar eventos com diferentes qualidades', async () => {
      // Mock scraper com eventos de qualidade variada
      mockScraperFactory.createScraper.mockResolvedValue({
        scraperName: 'eventbrite',
        scrapeEvents: jest.fn().mockResolvedValue([
          {
            title: 'Evento Completo',
            description: 'Descrição detalhada do evento',
            date: '2024-03-15T20:00:00.000Z',
            location: { venue: 'Local válido', city: 'São Paulo' },
            image: { url: 'https://example.com/image.jpg' },
            source: 'eventbrite'
          },
          {
            title: 'Ev', // Título muito curto
            date: '2024-03-16T20:00:00.000Z',
            location: { venue: 'Local' },
            source: 'eventbrite'
          },
          {
            title: 'Evento Sem Data',
            location: { venue: 'Local válido' },
            source: 'eventbrite'
          }
        ])
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await orchestrator.run();

      // Verifica que apenas eventos válidos foram inseridos
      const insertCall = mockDbHandler.insertEventsBatch.mock.calls[0];
      const eventsToInsert = insertCall[0];
      
      expect(eventsToInsert.length).toBe(1); // Apenas 1 evento válido
      expect(eventsToInsert[0].title).toBe('Evento Completo');

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });
  });

  describe('Integração com Scrapers', () => {
    test('deve criar e executar múltiplos scrapers', async () => {
      const mockEventbriteScraper = {
        scraperName: 'eventbrite',
        scrapeEvents: jest.fn().mockResolvedValue([
          { title: 'Evento Eventbrite', source: 'eventbrite', date: '2024-03-15', location: { venue: 'Local' } }
        ])
      };

      const mockSymplaScraper = {
        scraperName: 'sympla',
        scrapeEvents: jest.fn().mockResolvedValue([
          { title: 'Evento Sympla', source: 'sympla', date: '2024-03-16', location: { venue: 'Local' } }
        ])
      };

      mockScraperFactory.createScraper
        .mockResolvedValueOnce(mockEventbriteScraper)
        .mockResolvedValueOnce(mockSymplaScraper);

      orchestrator.menu.showMainMenu.mockResolvedValue({
        action: 'start_scraping',
        config: {
          sources: ['eventbrite', 'sympla'],
          options: { maxEvents: 50 },
          region: 'jiparana_and_national'
        }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await orchestrator.run();

      expect(mockScraperFactory.createScraper).toHaveBeenCalledTimes(2);
      expect(mockEventbriteScraper.scrapeEvents).toHaveBeenCalled();
      expect(mockSymplaScraper.scrapeEvents).toHaveBeenCalled();

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });

    test('deve continuar mesmo se um scraper falhar', async () => {
      const mockWorkingScraper = {
        scraperName: 'eventbrite',
        scrapeEvents: jest.fn().mockResolvedValue([
          { title: 'Evento Válido', source: 'eventbrite', date: '2024-03-15', location: { venue: 'Local' } }
        ])
      };

      const mockFailingScraper = {
        scraperName: 'sympla',
        scrapeEvents: jest.fn().mockRejectedValue(new Error('Scraper failed'))
      };

      mockScraperFactory.createScraper
        .mockResolvedValueOnce(mockWorkingScraper)
        .mockResolvedValueOnce(mockFailingScraper);

      orchestrator.menu.showMainMenu.mockResolvedValue({
        action: 'start_scraping',
        config: {
          sources: ['eventbrite', 'sympla'],
          options: { maxEvents: 50 },
          region: 'jiparana_and_national'
        }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      // Deve continuar mesmo com falha
      await expect(orchestrator.run()).resolves.not.toThrow();

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });
  });

  describe('Integração com Banco de Dados', () => {
    test('deve lidar com duplicatas no banco', async () => {
      mockDbHandler.insertEventsBatch.mockResolvedValue({
        inserted: [{ id: 1 }],
        duplicates: [{ title: 'Evento Duplicado' }],
        errors: []
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await orchestrator.run();

      expect(orchestrator.executionStats.eventsInserted).toBe(1);
      expect(orchestrator.executionStats.eventsDuplicated).toBe(1);

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });

    test('deve lidar com erros de inserção no banco', async () => {
      mockDbHandler.insertEventsBatch.mockResolvedValue({
        inserted: [{ id: 1 }],
        duplicates: [],
        errors: [{ event: {}, error: 'Database error' }]
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await orchestrator.run();

      expect(orchestrator.executionStats.eventsInserted).toBe(1);
      expect(orchestrator.executionStats.errors).toBe(1);

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });
  });

  describe('Integração com Processamento de Dados', () => {
    test('deve processar e classificar eventos corretamente', async () => {
      mockScraperFactory.createScraper.mockResolvedValue({
        scraperName: 'eventbrite',
        scrapeEvents: jest.fn().mockResolvedValue([
          {
            title: 'Show de Rock Nacional',
            description: 'Grande show com bandas de rock',
            date: '2024-03-15T20:00:00.000Z',
            location: 'Teatro Municipal, São Paulo, SP',
            source: 'eventbrite'
          }
        ])
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await orchestrator.run();

      // Verifica se o evento foi processado e classificado
      const insertCall = mockDbHandler.insertEventsBatch.mock.calls[0];
      const processedEvent = insertCall[0][0];

      expect(processedEvent).toHaveProperty('category');
      expect(processedEvent).toHaveProperty('qualityScore');
      expect(processedEvent).toHaveProperty('hash');
      expect(processedEvent).toHaveProperty('scrapedAt');

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });
  });

  describe('Integração com Relatórios', () => {
    test('deve gerar relatórios após scraping bem-sucedido', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await orchestrator.run();

      expect(orchestrator.reportGenerator.generateCompleteReport).toHaveBeenCalledWith({
        period: 'last_30_days'
      });

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });

    test('deve continuar mesmo se geração de relatórios falhar', async () => {
      orchestrator.reportGenerator.generateCompleteReport.mockRejectedValue(
        new Error('Report generation failed')
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

      await expect(orchestrator.run()).resolves.not.toThrow();

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });
  });

  describe('Tratamento de Erros Críticos', () => {
    test('deve lidar com erro crítico durante execução', async () => {
      mockScraperFactory.createScraper.mockRejectedValue(new Error('Critical error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

      await orchestrator.run();

      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});