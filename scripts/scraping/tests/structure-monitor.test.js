/**
 * Testes para StructureMonitor
 */

const { StructureMonitor } = require('../monitoring/structure-monitor');

// Mock do Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(() => Promise.resolve({
    newPage: jest.fn(() => Promise.resolve({
      setUserAgent: jest.fn(),
      goto: jest.fn(),
      title: jest.fn(() => Promise.resolve('Test Page')),
      $$: jest.fn(() => Promise.resolve([{}, {}])), // 2 elementos
      evaluate: jest.fn(() => Promise.resolve('complete')),
      metrics: jest.fn(() => Promise.resolve({
        Timestamp: 1000,
        JSHeapUsedSize: 1024,
        JSHeapTotalSize: 2048,
        Nodes: 100,
        LayoutCount: 5,
        RecalcStyleCount: 3
      })),
      close: jest.fn()
    })),
    close: jest.fn()
  }))
}));

describe('StructureMonitor', () => {
  let structureMonitor;

  beforeEach(() => {
    structureMonitor = new StructureMonitor();
    jest.clearAllMocks();
  });

  afterEach(() => {
    structureMonitor.stopMonitoring();
    structureMonitor.resetStats();
  });

  describe('startMonitoring', () => {
    test('deve iniciar monitoramento automático', () => {
      const interval = structureMonitor.startMonitoring();
      
      expect(interval).toBeDefined();
      expect(structureMonitor.monitoringInterval).toBeDefined();
    });

    test('não deve criar múltiplos intervalos', () => {
      structureMonitor.startMonitoring();
      const firstInterval = structureMonitor.monitoringInterval;
      
      structureMonitor.startMonitoring();
      
      expect(structureMonitor.monitoringInterval).toBe(firstInterval);
    });
  });

  describe('stopMonitoring', () => {
    test('deve parar monitoramento ativo', () => {
      structureMonitor.startMonitoring();
      
      structureMonitor.stopMonitoring();
      
      expect(structureMonitor.monitoringInterval).toBeNull();
    });

    test('deve funcionar mesmo sem monitoramento ativo', () => {
      expect(() => structureMonitor.stopMonitoring()).not.toThrow();
    });
  });

  describe('checkScraperStructure', () => {
    test('deve verificar estrutura do Eventbrite', async () => {
      const result = await structureMonitor.checkScraperStructure('eventbrite');
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('scraperName', 'eventbrite');
      expect(result).toHaveProperty('selectors');
      expect(result).toHaveProperty('structure');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('overallHealth');
    });

    test('deve verificar estrutura do Sympla', async () => {
      const result = await structureMonitor.checkScraperStructure('sympla');
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('scraperName', 'sympla');
    });

    test('deve falhar para scraper inexistente', async () => {
      await expect(structureMonitor.checkScraperStructure('invalid'))
        .rejects.toThrow('Configuração não encontrada');
    });
  });

  describe('checkSelectors', () => {
    test('deve verificar seletores válidos', async () => {
      const mockPage = {
        $$: jest.fn(() => Promise.resolve([{}, {}])) // 2 elementos
      };
      
      const selectors = {
        eventCard: '.event-card',
        title: '.event-title'
      };
      
      const result = await structureMonitor.checkSelectors(mockPage, selectors);
      
      expect(result.eventCard).toHaveProperty('found', true);
      expect(result.eventCard).toHaveProperty('elementCount', 2);
      expect(result.title).toHaveProperty('found', true);
    });

    test('deve detectar seletores não encontrados', async () => {
      const mockPage = {
        $$: jest.fn(() => Promise.resolve([])) // Nenhum elemento
      };
      
      const selectors = {
        eventCard: '.non-existent'
      };
      
      const result = await structureMonitor.checkSelectors(mockPage, selectors);
      
      expect(result.eventCard).toHaveProperty('found', false);
      expect(result.eventCard).toHaveProperty('elementCount', 0);
      expect(result.eventCard).toHaveProperty('health', 0);
    });

    test('deve testar múltiplos seletores alternativos', async () => {
      const mockPage = {
        $$: jest.fn()
          .mockResolvedValueOnce([]) // Primeiro selector falha
          .mockResolvedValueOnce([{}]) // Segundo selector funciona
      };
      
      const selectors = {
        eventCard: ['.old-selector', '.new-selector']
      };
      
      const result = await structureMonitor.checkSelectors(mockPage, selectors);
      
      expect(result.eventCard).toHaveProperty('found', true);
      expect(result.eventCard).toHaveProperty('workingSelector', '.new-selector');
    });
  });

  describe('checkPageStructure', () => {
    test('deve verificar estrutura básica da página', async () => {
      const mockPage = {
        title: jest.fn(() => Promise.resolve('Test Page')),
        $$: jest.fn()
          .mockResolvedValueOnce([{}]) // eventos
          .mockResolvedValueOnce([{}]) // navegação
          .mockResolvedValueOnce([{}]), // footer
        evaluate: jest.fn(() => Promise.resolve('complete'))
      };
      
      const result = await structureMonitor.checkPageStructure(mockPage, 'eventbrite');
      
      expect(result).toHaveProperty('hasTitle', true);
      expect(result).toHaveProperty('hasEvents', true);
      expect(result).toHaveProperty('hasNavigation', true);
      expect(result).toHaveProperty('hasFooter', true);
      expect(result).toHaveProperty('pageLoaded', true);
    });
  });

  describe('calculateOverallHealth', () => {
    test('deve calcular saúde baseada em seletores e estrutura', () => {
      const selectorResults = {
        eventCard: { health: 100 },
        title: { health: 80 }
      };
      
      const structureResults = {
        hasTitle: true,
        hasEvents: true,
        hasNavigation: false,
        hasFooter: true
      };
      
      const health = structureMonitor.calculateOverallHealth(selectorResults, structureResults);
      
      expect(health).toBeGreaterThan(0);
      expect(health).toBeLessThanOrEqual(100);
    });

    test('deve retornar 0 para resultados vazios', () => {
      const health = structureMonitor.calculateOverallHealth({}, {});
      
      expect(health).toBe(0);
    });
  });

  describe('generateAlert', () => {
    test('deve gerar alerta para falhas consecutivas', async () => {
      const result = {
        success: false,
        overallHealth: 30
      };
      
      const alert = await structureMonitor.generateAlert('eventbrite', result, 3);
      
      expect(alert).toHaveProperty('type', 'structural_change');
      expect(alert).toHaveProperty('scraperName', 'eventbrite');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('resolved', false);
    });

    test('deve definir severidade baseada no número de falhas', async () => {
      const result = { success: false };
      
      const alert1 = await structureMonitor.generateAlert('test', result, 3);
      const alert2 = await structureMonitor.generateAlert('test', result, 6);
      
      expect(alert1.severity).toBe('high');
      expect(alert2.severity).toBe('critical');
    });
  });

  describe('suggestAlternativeSelector', () => {
    test('deve sugerir seletores alternativos para Eventbrite', () => {
      const suggestions = structureMonitor.suggestAlternativeSelector('eventCard', 'eventbrite');
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('deve sugerir seletores alternativos para Sympla', () => {
      const suggestions = structureMonitor.suggestAlternativeSelector('title', 'sympla');
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('deve retornar array vazio para combinações inválidas', () => {
      const suggestions = structureMonitor.suggestAlternativeSelector('invalid', 'invalid');
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('getHealthReport', () => {
    test('deve gerar relatório de saúde completo', () => {
      // Simula dados de monitoramento
      structureMonitor.monitoringState.selectorHealth = {
        eventbrite: 85,
        sympla: 70
      };
      structureMonitor.monitoringState.consecutiveFailures = {
        eventbrite: 0,
        sympla: 2
      };
      
      const report = structureMonitor.getHealthReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('overallHealth');
      expect(report).toHaveProperty('scrapers');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('stats');
      
      expect(report.scrapers.eventbrite).toHaveProperty('status', 'healthy');
      expect(report.scrapers.sympla).toHaveProperty('status', 'warning');
    });
  });

  describe('calculateOverallSystemHealth', () => {
    test('deve calcular saúde média do sistema', () => {
      structureMonitor.monitoringState.selectorHealth = {
        eventbrite: 90,
        sympla: 70
      };
      
      const health = structureMonitor.calculateOverallSystemHealth();
      
      expect(health).toBe(80); // (90 + 70) / 2
    });

    test('deve retornar 0 para sistema sem dados', () => {
      const health = structureMonitor.calculateOverallSystemHealth();
      
      expect(health).toBe(0);
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas completas', () => {
      const stats = structureMonitor.getStats();
      
      expect(stats).toHaveProperty('totalChecks');
      expect(stats).toHaveProperty('structuralChangesDetected');
      expect(stats).toHaveProperty('alertsGenerated');
      expect(stats).toHaveProperty('autoRecoveries');
      expect(stats).toHaveProperty('monitoringState');
      expect(stats).toHaveProperty('config');
    });
  });

  describe('resetStats', () => {
    test('deve resetar todas as estatísticas', () => {
      // Adiciona alguns dados
      structureMonitor.stats.totalChecks = 5;
      structureMonitor.stats.alertsGenerated = 2;
      structureMonitor.monitoringState.alerts = [{ id: 'test' }];
      
      structureMonitor.resetStats();
      
      expect(structureMonitor.stats.totalChecks).toBe(0);
      expect(structureMonitor.stats.alertsGenerated).toBe(0);
      expect(structureMonitor.monitoringState.alerts).toEqual([]);
    });
  });
});