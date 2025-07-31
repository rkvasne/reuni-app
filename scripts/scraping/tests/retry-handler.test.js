/**
 * Testes para RetryHandler
 */

const { RetryHandler } = require('../utils/retry-handler');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('../utils/error-handler');

describe('RetryHandler', () => {
  let retryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000
    });
  });

  afterEach(() => {
    retryHandler.resetStats();
  });

  describe('executeWithRetry', () => {
    test('deve executar função com sucesso na primeira tentativa', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryHandler.executeWithRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('deve fazer retry em caso de erro recuperável', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');
      
      const result = await retryHandler.executeWithRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('deve falhar após esgotar tentativas', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      
      await expect(retryHandler.executeWithRetry(mockFn))
        .rejects.toThrow('ECONNRESET');
      
      expect(mockFn).toHaveBeenCalledTimes(4); // 1 inicial + 3 retries
    });

    test('não deve fazer retry para erros não recuperáveis', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Invalid input'));
      
      await expect(retryHandler.executeWithRetry(mockFn))
        .rejects.toThrow('Invalid input');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryableError', () => {
    test('deve identificar erros de rede como recuperáveis', () => {
      const networkError = new Error('ECONNRESET');
      networkError.code = 'ECONNRESET';
      
      expect(retryHandler.isRetryableError(networkError)).toBe(true);
    });

    test('deve identificar rate limiting como recuperável', () => {
      const rateLimitError = new ScrapingError(
        'Rate limited',
        ErrorTypes.RATE_LIMITED,
        ErrorSeverity.MEDIUM
      );
      
      expect(retryHandler.isRetryableError(rateLimitError)).toBe(true);
    });

    test('deve identificar erros HTTP 5xx como recuperáveis', () => {
      const serverError = new Error('Server error');
      serverError.response = { status: 500 };
      
      expect(retryHandler.isRetryableError(serverError)).toBe(true);
    });

    test('não deve identificar erros de validação como recuperáveis', () => {
      const validationError = new Error('Invalid data format');
      
      expect(retryHandler.isRetryableError(validationError)).toBe(false);
    });
  });

  describe('executeWithFallback', () => {
    test('deve executar primeira função com sucesso', async () => {
      const fn1 = jest.fn().mockResolvedValue('result1');
      const fn2 = jest.fn().mockResolvedValue('result2');
      
      const result = await retryHandler.executeWithFallback([fn1, fn2]);
      
      expect(result).toBe('result1');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();
    });

    test('deve usar fallback quando primeira função falha', async () => {
      const fn1 = jest.fn().mockRejectedValue(new Error('Failed'));
      const fn2 = jest.fn().mockResolvedValue('result2');
      
      const result = await retryHandler.executeWithFallback([fn1, fn2]);
      
      expect(result).toBe('result2');
      expect(fn1).toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
    });

    test('deve falhar quando todas as funções falham', async () => {
      const fn1 = jest.fn().mockRejectedValue(new Error('Failed1'));
      const fn2 = jest.fn().mockRejectedValue(new Error('Failed2'));
      
      await expect(retryHandler.executeWithFallback([fn1, fn2]))
        .rejects.toThrow('Todas as opções de fallback falharam');
    });
  });

  describe('executeWithGracefulDegradation', () => {
    test('deve retornar resultado normal em caso de sucesso', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryHandler.executeWithGracefulDegradation(mockFn);
      
      expect(result).toBe('success');
    });

    test('deve retornar valor de fallback em caso de erro', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Failed'));
      
      const result = await retryHandler.executeWithGracefulDegradation(
        mockFn, 
        'fallback_value'
      );
      
      expect(result).toBe('fallback_value');
    });

    test('deve retornar array vazio para tipo array', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Failed'));
      
      const result = await retryHandler.executeWithGracefulDegradation(
        mockFn, 
        null, 
        { expectedType: 'array' }
      );
      
      expect(result).toEqual([]);
    });
  });

  describe('createCircuitBreaker', () => {
    test('deve permitir execução quando circuit está fechado', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const circuitBreakerFn = retryHandler.createCircuitBreaker(mockFn, {
        failureThreshold: 2
      });
      
      const result = await circuitBreakerFn();
      
      expect(result).toBe('success');
    });

    test('deve abrir circuit após threshold de falhas', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Failed'));
      const circuitBreakerFn = retryHandler.createCircuitBreaker(mockFn, {
        failureThreshold: 2,
        resetTimeout: 100
      });
      
      // Primeira falha
      await expect(circuitBreakerFn()).rejects.toThrow('Failed');
      
      // Segunda falha - abre o circuit
      await expect(circuitBreakerFn()).rejects.toThrow('Failed');
      
      // Terceira tentativa - circuit aberto
      await expect(circuitBreakerFn()).rejects.toThrow('Circuit breaker está aberto');
    });
  });

  describe('calculateDelay', () => {
    test('deve calcular delay com backoff exponencial', () => {
      const delay1 = retryHandler.calculateDelay(0, new Error('test'));
      const delay2 = retryHandler.calculateDelay(1, new Error('test'));
      
      expect(delay2).toBeGreaterThan(delay1);
    });

    test('deve respeitar delay máximo', () => {
      const delay = retryHandler.calculateDelay(10, new Error('test'));
      
      expect(delay).toBeLessThanOrEqual(retryHandler.config.maxDelay + retryHandler.config.jitterMax);
    });

    test('deve usar Retry-After header para rate limiting', () => {
      const rateLimitError = new Error('Rate limited');
      rateLimitError.response = {
        status: 429,
        headers: { 'retry-after': '5' }
      };
      
      const delay = retryHandler.calculateDelay(0, rateLimitError);
      
      expect(delay).toBeGreaterThanOrEqual(5000); // 5 segundos
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas iniciais', () => {
      const stats = retryHandler.getStats();
      
      expect(stats).toHaveProperty('totalAttempts', 0);
      expect(stats).toHaveProperty('successfulRetries', 0);
      expect(stats).toHaveProperty('failedRetries', 0);
      expect(stats).toHaveProperty('successRate');
    });

    test('deve atualizar estatísticas após execuções', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');
      
      await retryHandler.executeWithRetry(mockFn);
      
      const stats = retryHandler.getStats();
      
      expect(stats.totalAttempts).toBe(2);
      expect(stats.successfulRetries).toBe(1);
    });
  });

  describe('generateOperationId', () => {
    test('deve gerar IDs únicos', () => {
      const id1 = retryHandler.generateOperationId();
      const id2 = retryHandler.generateOperationId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^retry_\d+_[a-z0-9]+$/);
    });
  });
});