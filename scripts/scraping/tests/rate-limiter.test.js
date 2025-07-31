/**
 * Testes Unitários para Rate Limiter
 */

const { RateLimiter } = require('../utils/rate-limiter');

describe('RateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(1000); // 1 segundo de delay base
  });

  describe('inicialização', () => {
    test('deve inicializar com configurações padrão', () => {
      const limiter = new RateLimiter();
      
      expect(limiter.baseDelay).toBe(1000);
      expect(limiter.currentDelay).toBe(1000);
      expect(limiter.maxDelay).toBe(30000);
      expect(limiter.retryCount).toBe(0);
      expect(limiter.stats.totalRequests).toBe(0);
    });

    test('deve inicializar com configurações personalizadas', () => {
      const limiter = new RateLimiter(2000, { maxDelay: 60000, maxRetries: 10 });
      
      expect(limiter.baseDelay).toBe(2000);
      expect(limiter.maxDelay).toBe(60000);
      expect(limiter.maxRetries).toBe(10);
    });
  });

  describe('wait', () => {
    test('deve aguardar delay mínimo entre requisições', async () => {
      const startTime = Date.now();
      
      await rateLimiter.wait();
      await rateLimiter.wait();
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(1000); // Pelo menos 1 segundo
    });

    test('deve atualizar estatísticas', async () => {
      await rateLimiter.wait();
      await rateLimiter.wait();
      
      expect(rateLimiter.stats.totalRequests).toBe(2);
      expect(rateLimiter.stats.totalWaitTime).toBeGreaterThan(0);
    });

    test('não deve aguardar se tempo suficiente já passou', async () => {
      await rateLimiter.wait();
      
      // Simula passagem de tempo
      rateLimiter.lastRequestTime = Date.now() - 2000; // 2 segundos atrás
      
      const startTime = Date.now();
      await rateLimiter.wait();
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeLessThan(100); // Não deve aguardar
    });
  });

  describe('handleRateLimit', () => {
    test('deve implementar backoff exponencial', async () => {
      const startTime = Date.now();
      
      await rateLimiter.handleRateLimit();
      const firstWait = Date.now() - startTime;
      
      const secondStart = Date.now();
      await rateLimiter.handleRateLimit();
      const secondWait = Date.now() - secondStart;
      
      expect(secondWait).toBeGreaterThan(firstWait);
      expect(rateLimiter.retryCount).toBe(2);
    });

    test('deve respeitar header Retry-After', async () => {
      const startTime = Date.now();
      
      await rateLimiter.handleRateLimit('2'); // 2 segundos
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeGreaterThanOrEqual(2000);
      expect(elapsed).toBeLessThan(2500);
    });

    test('deve falhar após máximo de tentativas', async () => {
      rateLimiter.maxRetries = 2;
      
      await rateLimiter.handleRateLimit();
      await rateLimiter.handleRateLimit();
      
      await expect(rateLimiter.handleRateLimit()).rejects.toThrow('máximo de tentativas excedido');
    });

    test('deve atualizar estatísticas de rate limit', async () => {
      await rateLimiter.handleRateLimit();
      
      expect(rateLimiter.stats.rateLimitHits).toBe(1);
      expect(rateLimiter.stats.totalWaitTime).toBeGreaterThan(0);
    });
  });

  describe('handleError', () => {
    test('deve tratar erro 429 como rate limit', async () => {
      const startTime = Date.now();
      
      await rateLimiter.handleError(429);
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeGreaterThan(0);
      expect(rateLimiter.retryCount).toBe(1);
    });

    test('deve tratar erros 5xx com retry', async () => {
      await rateLimiter.handleError(503);
      expect(rateLimiter.retryCount).toBe(1);
      
      await rateLimiter.handleError(502);
      expect(rateLimiter.retryCount).toBe(2);
    });

    test('deve falhar para erros não tratados', async () => {
      await expect(rateLimiter.handleError(404)).rejects.toThrow('Erro HTTP não tratado: 404');
    });

    test('deve falhar após máximo de tentativas para erros 5xx', async () => {
      rateLimiter.maxRetries = 2;
      
      await rateLimiter.handleError(503);
      await rateLimiter.handleError(503);
      
      await expect(rateLimiter.handleError(503)).rejects.toThrow('Servidor indisponível');
    });
  });

  describe('adjustDelay', () => {
    test('deve diminuir delay para respostas rápidas', () => {
      rateLimiter.currentDelay = 2000;
      
      rateLimiter.adjustDelay(500, 200); // Resposta rápida e bem-sucedida
      
      expect(rateLimiter.currentDelay).toBeLessThan(2000);
      expect(rateLimiter.currentDelay).toBeGreaterThanOrEqual(rateLimiter.baseDelay);
    });

    test('deve aumentar delay para rate limits', () => {
      const originalDelay = rateLimiter.currentDelay;
      
      rateLimiter.adjustDelay(1000, 429);
      
      expect(rateLimiter.currentDelay).toBeGreaterThan(originalDelay);
    });

    test('não deve exceder delay máximo', () => {
      rateLimiter.currentDelay = rateLimiter.maxDelay;
      
      rateLimiter.adjustDelay(1000, 429);
      
      expect(rateLimiter.currentDelay).toBeLessThanOrEqual(rateLimiter.maxDelay);
    });
  });

  describe('reset', () => {
    test('deve resetar para estado inicial', async () => {
      await rateLimiter.handleRateLimit();
      expect(rateLimiter.retryCount).toBeGreaterThan(0);
      
      // Força um delay maior para garantir que seja diferente do base
      rateLimiter.currentDelay = rateLimiter.baseDelay * 2;
      expect(rateLimiter.currentDelay).toBeGreaterThan(rateLimiter.baseDelay);
      
      rateLimiter.reset();
      
      expect(rateLimiter.retryCount).toBe(0);
      expect(rateLimiter.currentDelay).toBe(rateLimiter.baseDelay);
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas completas', async () => {
      await rateLimiter.wait();
      await rateLimiter.handleRateLimit();
      
      const stats = rateLimiter.getStats();
      
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('rateLimitHits');
      expect(stats).toHaveProperty('totalWaitTime');
      expect(stats).toHaveProperty('averageDelay');
      expect(stats).toHaveProperty('currentDelay');
      expect(stats).toHaveProperty('retryCount');
      expect(stats).toHaveProperty('efficiency');
      
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.rateLimitHits).toBeGreaterThan(0);
      expect(stats.efficiency).toBeLessThan(100);
    });

    test('deve calcular eficiência corretamente', async () => {
      await rateLimiter.wait();
      await rateLimiter.wait();
      // Sem rate limits
      
      const stats = rateLimiter.getStats();
      expect(stats.efficiency).toBe(100);
    });
  });

  describe('shouldRetry', () => {
    test('deve retornar true quando pode tentar novamente', () => {
      expect(rateLimiter.shouldRetry()).toBe(true);
      
      rateLimiter.retryCount = 2;
      expect(rateLimiter.shouldRetry()).toBe(true);
    });

    test('deve retornar false quando excede máximo', () => {
      rateLimiter.retryCount = rateLimiter.maxRetries;
      expect(rateLimiter.shouldRetry()).toBe(false);
      
      rateLimiter.retryCount = rateLimiter.maxRetries + 1;
      expect(rateLimiter.shouldRetry()).toBe(false);
    });
  });

  describe('métodos estáticos', () => {
    afterEach(() => {
      RateLimiter.cleanup();
    });

    test('createForDomain deve criar rate limiter por domínio', () => {
      const limiter1 = RateLimiter.createForDomain('example.com', 1000);
      const limiter2 = RateLimiter.createForDomain('example.com', 2000);
      const limiter3 = RateLimiter.createForDomain('other.com', 1000);
      
      expect(limiter1).toBe(limiter2); // Mesmo domínio, mesma instância
      expect(limiter1).not.toBe(limiter3); // Domínios diferentes
    });

    test('cleanup deve limpar rate limiters de domínios', () => {
      RateLimiter.createForDomain('example.com', 1000);
      RateLimiter.cleanup();
      
      const limiter1 = RateLimiter.createForDomain('example.com', 1000);
      const limiter2 = RateLimiter.createForDomain('example.com', 1000);
      
      expect(limiter1).toBe(limiter2); // Nova instância após cleanup
    });
  });
});