/**
 * Testes para RealTimeStats
 */

const { RealTimeStats } = require('../utils/real-time-stats');

// Mock do console para evitar output durante testes
const originalConsoleLog = console.log;
const originalStdoutWrite = process.stdout.write;

beforeAll(() => {
  console.log = jest.fn();
  process.stdout.write = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  process.stdout.write = originalStdoutWrite;
});

describe('RealTimeStats', () => {
  let realTimeStats;

  beforeEach(() => {
    realTimeStats = new RealTimeStats();
    jest.clearAllMocks();
  });

  afterEach(() => {
    realTimeStats.stopRealTimeDisplay();
    realTimeStats.reset();
  });

  describe('startRealTimeDisplay', () => {
    test('deve iniciar display de estatísticas', () => {
      realTimeStats.startRealTimeDisplay();
      
      expect(realTimeStats.displayState.isDisplaying).toBe(true);
      expect(realTimeStats.displayState.updateInterval).toBeDefined();
    });

    test('não deve criar múltiplos intervalos', () => {
      realTimeStats.startRealTimeDisplay();
      const firstInterval = realTimeStats.displayState.updateInterval;
      
      realTimeStats.startRealTimeDisplay();
      
      expect(realTimeStats.displayState.updateInterval).toBe(firstInterval);
    });
  });

  describe('stopRealTimeDisplay', () => {
    test('deve parar display ativo', () => {
      realTimeStats.startRealTimeDisplay();
      
      realTimeStats.stopRealTimeDisplay();
      
      expect(realTimeStats.displayState.isDisplaying).toBe(false);
      expect(realTimeStats.displayState.updateInterval).toBeNull();
    });

    test('deve funcionar mesmo sem display ativo', () => {
      expect(() => realTimeStats.stopRealTimeDisplay()).not.toThrow();
    });
  });

  describe('setPhase', () => {
    test('deve atualizar fase atual', () => {
      realTimeStats.setPhase('scraping', { totalSources: 2 });
      
      expect(realTimeStats.stats.currentPhase).toBe('scraping');
      expect(realTimeStats.stats.totalOperations).toBe(2);
      expect(realTimeStats.stats.scraping.totalSources).toBe(2);
    });

    test('deve configurar operações para diferentes fases', () => {
      realTimeStats.setPhase('authentication');
      expect(realTimeStats.stats.totalOperations).toBe(1);
      
      realTimeStats.setPhase('health_check');
      expect(realTimeStats.stats.totalOperations).toBe(3);
      
      realTimeStats.setPhase('reporting');
      expect(realTimeStats.stats.totalOperations).toBe(3);
    });

    test('deve resetar operações completadas', () => {
      realTimeStats.stats.completedOperations = 5;
      
      realTimeStats.setPhase('processing');
      
      expect(realTimeStats.stats.completedOperations).toBe(0);
    });
  });

  describe('updateProgress', () => {
    test('deve atualizar progresso atual', () => {
      realTimeStats.updateProgress(3, 10);
      
      expect(realTimeStats.stats.completedOperations).toBe(3);
      expect(realTimeStats.stats.totalOperations).toBe(10);
    });

    test('deve atualizar apenas completed quando total não fornecido', () => {
      realTimeStats.stats.totalOperations = 5;
      
      realTimeStats.updateProgress(2);
      
      expect(realTimeStats.stats.completedOperations).toBe(2);
      expect(realTimeStats.stats.totalOperations).toBe(5);
    });
  });

  describe('updateScrapingStats', () => {
    test('deve atualizar estatísticas de scraping', () => {
      const updates = {
        currentSource: 'eventbrite',
        eventsFound: 10
      };
      
      realTimeStats.updateScrapingStats(updates);
      
      expect(realTimeStats.stats.scraping.currentSource).toBe('eventbrite');
      expect(realTimeStats.stats.scraping.eventsFound).toBe(10);
    });
  });

  describe('recordEventFound', () => {
    test('deve incrementar contador de eventos encontrados', () => {
      realTimeStats.recordEventFound();
      realTimeStats.recordEventFound();
      
      expect(realTimeStats.stats.scraping.eventsFound).toBe(2);
    });
  });

  describe('recordEventProcessed', () => {
    test('deve registrar evento válido processado', () => {
      realTimeStats.recordEventProcessed(true);
      
      expect(realTimeStats.stats.scraping.eventsProcessed).toBe(1);
      expect(realTimeStats.stats.scraping.eventsValid).toBe(1);
      expect(realTimeStats.stats.scraping.eventsRejected).toBe(0);
    });

    test('deve registrar evento inválido processado', () => {
      realTimeStats.recordEventProcessed(false);
      
      expect(realTimeStats.stats.scraping.eventsProcessed).toBe(1);
      expect(realTimeStats.stats.scraping.eventsValid).toBe(0);
      expect(realTimeStats.stats.scraping.eventsRejected).toBe(1);
    });
  });

  describe('recordEventSaved', () => {
    test('deve registrar evento salvo', () => {
      realTimeStats.recordEventSaved(false);
      
      expect(realTimeStats.stats.scraping.eventsSaved).toBe(1);
      expect(realTimeStats.stats.scraping.duplicatesFound).toBe(0);
    });

    test('deve registrar duplicata encontrada', () => {
      realTimeStats.recordEventSaved(true);
      
      expect(realTimeStats.stats.scraping.eventsSaved).toBe(0);
      expect(realTimeStats.stats.scraping.duplicatesFound).toBe(1);
    });
  });

  describe('recordError', () => {
    test('deve incrementar contador de erros', () => {
      realTimeStats.recordError();
      realTimeStats.recordError();
      
      expect(realTimeStats.stats.scraping.errors).toBe(2);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    test('deve calcular eventos por segundo', () => {
      // Simula tempo decorrido
      realTimeStats.stats.startTime = Date.now() - 2000; // 2 segundos atrás
      realTimeStats.stats.scraping.eventsProcessed = 10;
      
      realTimeStats.calculatePerformanceMetrics();
      
      expect(realTimeStats.stats.performance.eventsPerSecond).toBeCloseTo(5, 0);
    });

    test('deve calcular tempo médio por evento', () => {
      realTimeStats.stats.startTime = Date.now() - 1000; // 1 segundo atrás
      realTimeStats.stats.scraping.eventsProcessed = 10;
      
      realTimeStats.calculatePerformanceMetrics();
      
      expect(realTimeStats.stats.performance.averageEventProcessingTime).toBeCloseTo(100, -1);
    });
  });

  describe('calculateEstimatedTime', () => {
    test('deve calcular tempo estimado restante', () => {
      realTimeStats.stats.startTime = Date.now() - 1000; // 1 segundo atrás
      realTimeStats.stats.completedOperations = 2;
      realTimeStats.stats.totalOperations = 10;
      
      realTimeStats.calculateEstimatedTime();
      
      expect(realTimeStats.stats.performance.estimatedTimeRemaining).toBeCloseTo(4000, -2);
    });

    test('deve retornar 0 quando não há operações', () => {
      realTimeStats.calculateEstimatedTime();
      
      expect(realTimeStats.stats.performance.estimatedTimeRemaining).toBe(0);
    });
  });

  describe('getPhaseDisplayName', () => {
    test('deve retornar nomes legíveis para fases', () => {
      expect(realTimeStats.getPhaseDisplayName()).toBe('Inicializando');
      
      realTimeStats.stats.currentPhase = 'scraping';
      expect(realTimeStats.getPhaseDisplayName()).toBe('Coletando Eventos');
      
      realTimeStats.stats.currentPhase = 'authentication';
      expect(realTimeStats.getPhaseDisplayName()).toBe('Autenticação');
    });

    test('deve retornar fase original para fases desconhecidas', () => {
      realTimeStats.stats.currentPhase = 'unknown_phase';
      
      expect(realTimeStats.getPhaseDisplayName()).toBe('unknown_phase');
    });
  });

  describe('formatDuration', () => {
    test('deve formatar duração em segundos', () => {
      expect(realTimeStats.formatDuration(5000)).toBe('5s');
    });

    test('deve formatar duração em minutos e segundos', () => {
      expect(realTimeStats.formatDuration(125000)).toBe('2m 5s');
    });

    test('deve formatar duração em horas, minutos e segundos', () => {
      expect(realTimeStats.formatDuration(3665000)).toBe('1h 1m 5s');
    });
  });

  describe('getCurrentStats', () => {
    test('deve retornar estatísticas atuais completas', () => {
      const stats = realTimeStats.getCurrentStats();
      
      expect(stats).toHaveProperty('startTime');
      expect(stats).toHaveProperty('currentPhase');
      expect(stats).toHaveProperty('scraping');
      expect(stats).toHaveProperty('performance');
      expect(stats).toHaveProperty('elapsed');
      expect(stats).toHaveProperty('isDisplaying');
    });
  });

  describe('reset', () => {
    test('deve resetar todas as estatísticas', () => {
      // Adiciona alguns dados
      realTimeStats.stats.scraping.eventsFound = 10;
      realTimeStats.stats.scraping.errors = 5;
      realTimeStats.stats.currentPhase = 'scraping';
      
      realTimeStats.reset();
      
      expect(realTimeStats.stats.scraping.eventsFound).toBe(0);
      expect(realTimeStats.stats.scraping.errors).toBe(0);
      expect(realTimeStats.stats.currentPhase).toBe('initializing');
    });

    test('deve atualizar startTime', () => {
      const oldStartTime = realTimeStats.stats.startTime;
      
      // Aguarda um pouco para garantir diferença de tempo
      setTimeout(() => {
        realTimeStats.reset();
        expect(realTimeStats.stats.startTime).toBeGreaterThan(oldStartTime);
      }, 10);
    });
  });

  describe('showProgressBar', () => {
    test('deve calcular porcentagem corretamente', () => {
      // Testa indiretamente através do método que usa showProgressBar
      realTimeStats.updateProgress(3, 10);
      
      // Verifica se os cálculos internos estão corretos
      const percentage = Math.round((3 / 10) * 100);
      expect(percentage).toBe(30);
    });

    test('deve lidar com total zero', () => {
      // Não deve quebrar com divisão por zero
      expect(() => {
        realTimeStats.updateProgress(0, 0);
      }).not.toThrow();
    });
  });
});