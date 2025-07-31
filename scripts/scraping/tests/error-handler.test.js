/**
 * Testes Unitários para Sistema de Tratamento de Erros
 */

const {
  ErrorTypes,
  ErrorSeverity,
  ScrapingError,
  ErrorHandler,
  handleError,
  withErrorHandling
} = require('../utils/error-handler');

describe('ScrapingError', () => {
  test('deve criar erro com propriedades corretas', () => {
    const error = new ScrapingError(
      'Teste de erro',
      ErrorTypes.PARSING_ERROR,
      ErrorSeverity.HIGH,
      { url: 'test.com' }
    );

    expect(error.message).toBe('Teste de erro');
    expect(error.type).toBe(ErrorTypes.PARSING_ERROR);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.details.url).toBe('test.com');
    expect(error.timestamp).toBeDefined();
    expect(error.name).toBe('ScrapingError');
  });

  test('deve usar valores padrão', () => {
    const error = new ScrapingError('Erro simples');

    expect(error.type).toBe(ErrorTypes.UNKNOWN_ERROR);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.details).toEqual({});
  });

  test('deve converter para JSON corretamente', () => {
    const error = new ScrapingError('Teste', ErrorTypes.NETWORK_ERROR);
    const json = error.toJSON();

    expect(json.name).toBe('ScrapingError');
    expect(json.message).toBe('Teste');
    expect(json.type).toBe(ErrorTypes.NETWORK_ERROR);
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  test('deve identificar erros recuperáveis', () => {
    const recoverableError = new ScrapingError('Rate limit', ErrorTypes.RATE_LIMITED);
    const nonRecoverableError = new ScrapingError('Config error', ErrorTypes.CONFIGURATION_ERROR);

    expect(recoverableError.isRecoverable()).toBe(true);
    expect(nonRecoverableError.isRecoverable()).toBe(false);
  });

  test('deve identificar erros críticos', () => {
    const criticalError = new ScrapingError('DB error', ErrorTypes.DATABASE_ERROR, ErrorSeverity.CRITICAL);
    const normalError = new ScrapingError('Parse error', ErrorTypes.PARSING_ERROR, ErrorSeverity.MEDIUM);

    expect(criticalError.isCritical()).toBe(true);
    expect(normalError.isCritical()).toBe(false);
  });
});

describe('ErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler('test');
  });

  afterEach(() => {
    errorHandler.resetStats();
  });

  describe('categorizeError', () => {
    test('deve categorizar erro de rede', () => {
      const networkError = new Error('Network error');
      networkError.code = 'ENOTFOUND';

      const scrapingError = errorHandler.categorizeError(networkError);

      expect(scrapingError.type).toBe(ErrorTypes.NETWORK_ERROR);
      expect(scrapingError.severity).toBe(ErrorSeverity.HIGH);
    });

    test('deve categorizar erro de timeout', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';

      const scrapingError = errorHandler.categorizeError(timeoutError);

      expect(scrapingError.type).toBe(ErrorTypes.TIMEOUT_ERROR);
      expect(scrapingError.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('deve categorizar erro 429 (rate limit)', () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.response = {
        status: 429,
        headers: { 'retry-after': '60' }
      };

      const scrapingError = errorHandler.categorizeError(rateLimitError);

      expect(scrapingError.type).toBe(ErrorTypes.RATE_LIMITED);
      expect(scrapingError.severity).toBe(ErrorSeverity.LOW);
      expect(scrapingError.details.retryAfter).toBe('60');
    });

    test('deve categorizar erro 500+', () => {
      const serverError = new Error('Internal server error');
      serverError.response = { status: 500 };

      const scrapingError = errorHandler.categorizeError(serverError);

      expect(scrapingError.type).toBe(ErrorTypes.NETWORK_ERROR);
      expect(scrapingError.severity).toBe(ErrorSeverity.HIGH);
    });

    test('deve categorizar erro 404', () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = { status: 404 };

      const scrapingError = errorHandler.categorizeError(notFoundError);

      expect(scrapingError.type).toBe(ErrorTypes.SITE_STRUCTURE_CHANGED);
      expect(scrapingError.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('deve categorizar erro de parsing', () => {
      const parseError = new Error('Failed to parse selector');

      const scrapingError = errorHandler.categorizeError(parseError);

      expect(scrapingError.type).toBe(ErrorTypes.PARSING_ERROR);
      expect(scrapingError.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('deve categorizar erro de validação', () => {
      const validationError = new Error('Invalid data format');

      const scrapingError = errorHandler.categorizeError(validationError);

      expect(scrapingError.type).toBe(ErrorTypes.VALIDATION_ERROR);
      expect(scrapingError.severity).toBe(ErrorSeverity.LOW);
    });

    test('deve categorizar erro de banco de dados', () => {
      const dbError = new Error('Database connection failed');

      const scrapingError = errorHandler.categorizeError(dbError);

      expect(scrapingError.type).toBe(ErrorTypes.DATABASE_ERROR);
      expect(scrapingError.severity).toBe(ErrorSeverity.CRITICAL);
    });

    test('deve categorizar erro de configuração', () => {
      const configError = new Error('Missing config variable');

      const scrapingError = errorHandler.categorizeError(configError);

      expect(scrapingError.type).toBe(ErrorTypes.CONFIGURATION_ERROR);
      expect(scrapingError.severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('handle', () => {
    test('deve manipular ScrapingError existente', () => {
      const scrapingError = new ScrapingError('Test error', ErrorTypes.PARSING_ERROR);
      const result = errorHandler.handle(scrapingError);

      expect(result.error).toBe(scrapingError);
      expect(result.shouldRetry).toBe(false);
      expect(result.isCritical).toBe(false);
      expect(result.recommendation).toContain('seletores CSS');
    });

    test('deve converter erro comum para ScrapingError', () => {
      const commonError = new Error('Common error');
      const result = errorHandler.handle(commonError);

      expect(result.error).toBeInstanceOf(ScrapingError);
      expect(result.error.message).toBe('Common error');
      expect(result.recommendation).toBeDefined();
    });

    test('deve atualizar estatísticas', () => {
      const error = new Error('Test error');
      
      errorHandler.handle(error);
      errorHandler.handle(error);

      const stats = errorHandler.getStats();
      expect(stats.total).toBe(2);
      expect(stats.byType[ErrorTypes.UNKNOWN_ERROR]).toBe(2);
    });
  });

  describe('getRecommendation', () => {
    test('deve fornecer recomendação para cada tipo de erro', () => {
      const errorTypes = Object.values(ErrorTypes);

      errorTypes.forEach(type => {
        const error = new ScrapingError('Test', type);
        const recommendation = errorHandler.getRecommendation(error);
        
        expect(recommendation).toBeDefined();
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('estatísticas', () => {
    test('deve calcular estatísticas corretamente', () => {
      // Adiciona diferentes tipos de erro
      errorHandler.handle(new ScrapingError('Error 1', ErrorTypes.RATE_LIMITED, ErrorSeverity.LOW));
      errorHandler.handle(new ScrapingError('Error 2', ErrorTypes.DATABASE_ERROR, ErrorSeverity.CRITICAL));
      errorHandler.handle(new ScrapingError('Error 3', ErrorTypes.NETWORK_ERROR, ErrorSeverity.HIGH));

      const stats = errorHandler.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byType[ErrorTypes.RATE_LIMITED]).toBe(1);
      expect(stats.byType[ErrorTypes.DATABASE_ERROR]).toBe(1);
      expect(stats.byType[ErrorTypes.NETWORK_ERROR]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.recoverable).toBe(2); // RATE_LIMITED e NETWORK_ERROR
      expect(stats.critical).toBe(1);
    });

    test('deve calcular taxas corretamente', () => {
      errorHandler.handle(new ScrapingError('Error 1', ErrorTypes.RATE_LIMITED, ErrorSeverity.LOW));
      errorHandler.handle(new ScrapingError('Error 2', ErrorTypes.DATABASE_ERROR, ErrorSeverity.CRITICAL));

      const stats = errorHandler.getStats();

      expect(stats.errorRate).toBe(50); // 1 crítico de 2 total
      expect(stats.recoverabilityRate).toBe(50); // 1 recuperável de 2 total
    });

    test('deve resetar estatísticas', () => {
      errorHandler.handle(new Error('Test'));
      expect(errorHandler.getStats().total).toBe(1);

      errorHandler.resetStats();
      expect(errorHandler.getStats().total).toBe(0);
    });
  });
});

describe('funções utilitárias', () => {
  test('handleError deve usar handler global', () => {
    const error = new Error('Global test');
    const result = handleError(error, { source: 'test' });

    expect(result.error).toBeInstanceOf(ScrapingError);
    expect(result.shouldRetry).toBeDefined();
    expect(result.isCritical).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  test('withErrorHandling deve capturar erros', async () => {
    const failingFunction = async () => {
      throw new Error('Function failed');
    };

    const wrappedFunction = withErrorHandling(failingFunction, { context: 'test' });
    const result = await wrappedFunction();

    expect(result.error).toBeInstanceOf(ScrapingError);
    expect(result.data).toBeNull();
  });

  test('withErrorHandling deve retornar dados em caso de sucesso', async () => {
    const successFunction = async (data) => {
      return { success: true, data };
    };

    const wrappedFunction = withErrorHandling(successFunction);
    const result = await wrappedFunction('test data');

    expect(result.success).toBe(true);
    expect(result.data).toBe('test data');
  });

  test('withErrorHandling deve re-lançar erros críticos', async () => {
    const criticalFailingFunction = async () => {
      throw new ScrapingError('Critical error', ErrorTypes.DATABASE_ERROR, ErrorSeverity.CRITICAL);
    };

    const wrappedFunction = withErrorHandling(criticalFailingFunction);

    await expect(wrappedFunction()).rejects.toThrow('Critical error');
  });
});