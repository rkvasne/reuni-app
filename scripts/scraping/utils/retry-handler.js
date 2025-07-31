/**
 * Retry Handler
 * 
 * Sistema robusto de retry com backoff exponencial
 * e fallback entre diferentes scrapers.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { Logger } = require('./logger');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('./error-handler');

class RetryHandler {
  constructor(options = {}) {
    this.logger = new Logger('retry-handler');
    
    // Configurações padrão
    this.config = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffMultiplier: options.backoffMultiplier || 2,
      jitterMax: options.jitterMax || 1000,
      retryableErrors: options.retryableErrors || [
        ErrorTypes.NETWORK_ERROR,
        ErrorTypes.TIMEOUT_ERROR,
        ErrorTypes.RATE_LIMITED,
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT'
      ]
    };
    
    // Estatísticas
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalDelay: 0,
      errorDistribution: {}
    };
  }

  /**
   * Executa função com retry automático
   */
  async executeWithRetry(fn, context = {}) {
    const operationId = context.operationId || this.generateOperationId();
    let lastError = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      this.stats.totalAttempts++;
      
      try {
        this.logger.debug(`Tentativa ${attempt + 1}/${this.config.maxRetries + 1} para operação ${operationId}`);
        
        const result = await fn(attempt, operationId);
        
        if (attempt > 0) {
          this.stats.successfulRetries++;
          this.logger.info(`Operação ${operationId} bem-sucedida na tentativa ${attempt + 1}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.updateErrorStats(error);
        
        // Verifica se o erro é recuperável
        if (!this.isRetryableError(error)) {
          this.logger.warn(`Erro não recuperável na operação ${operationId}:`, error.message);
          throw error;
        }
        
        // Se é a última tentativa, não faz retry
        if (attempt === this.config.maxRetries) {
          this.stats.failedRetries++;
          this.logger.error(`Operação ${operationId} falhou após ${this.config.maxRetries + 1} tentativas`);
          break;
        }
        
        // Calcula delay para próxima tentativa
        const delay = this.calculateDelay(attempt, error);
        this.stats.totalDelay += delay;
        
        this.logger.warn(`Tentativa ${attempt + 1} falhou para operação ${operationId}. Aguardando ${delay}ms antes da próxima tentativa. Erro: ${error.message}`);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Verifica se um erro é recuperável
   */
  isRetryableError(error) {
    // Verifica por tipo de erro customizado
    if (error.type && this.config.retryableErrors.includes(error.type)) {
      return true;
    }
    
    // Verifica por código de erro
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }
    
    // Verifica por status HTTP
    if (error.response && error.response.status) {
      const status = error.response.status;
      return status >= 500 || status === 429 || status === 408;
    }
    
    // Verifica por mensagem de erro
    const message = error.message.toLowerCase();
    const retryableMessages = [
      'timeout',
      'connection',
      'network',
      'rate limit',
      'too many requests',
      'service unavailable',
      'bad gateway',
      'gateway timeout'
    ];
    
    return retryableMessages.some(msg => message.includes(msg));
  }

  /**
   * Calcula delay para próxima tentativa
   */
  calculateDelay(attempt, error) {
    let delay = this.config.baseDelay;
    
    // Backoff exponencial
    delay *= Math.pow(this.config.backoffMultiplier, attempt);
    
    // Limita delay máximo
    delay = Math.min(delay, this.config.maxDelay);
    
    // Adiciona jitter para evitar thundering herd
    const jitter = Math.random() * this.config.jitterMax;
    delay += jitter;
    
    // Ajusta baseado no tipo de erro
    if (error.response && error.response.status === 429) {
      // Rate limiting - usa Retry-After header se disponível
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        delay = Math.max(delay, parseInt(retryAfter) * 1000);
      } else {
        delay *= 2; // Dobra o delay para rate limiting
      }
    }
    
    return Math.round(delay);
  }

  /**
   * Executa com fallback entre múltiplas funções
   */
  async executeWithFallback(functions, context = {}) {
    const operationId = context.operationId || this.generateOperationId();
    const errors = [];
    
    for (let i = 0; i < functions.length; i++) {
      const fn = functions[i];
      const fnName = fn.name || `function_${i}`;
      
      try {
        this.logger.debug(`Tentando fallback ${i + 1}/${functions.length} (${fnName}) para operação ${operationId}`);
        
        const result = await this.executeWithRetry(fn, { 
          ...context, 
          operationId: `${operationId}_fallback_${i}` 
        });
        
        if (i > 0) {
          this.logger.info(`Operação ${operationId} bem-sucedida usando fallback ${fnName}`);
        }
        
        return result;
        
      } catch (error) {
        errors.push({ function: fnName, error });
        this.logger.warn(`Fallback ${fnName} falhou para operação ${operationId}:`, error.message);
        
        // Se não é a última função, continua para o próximo fallback
        if (i < functions.length - 1) {
          continue;
        }
      }
    }
    
    // Todas as funções falharam
    const combinedError = new ScrapingError(
      `Todas as opções de fallback falharam para operação ${operationId}`,
      ErrorTypes.UNKNOWN_ERROR,
      ErrorSeverity.HIGH,
      { errors }
    );
    
    this.logger.error(`Operação ${operationId} falhou em todos os fallbacks`, combinedError);
    throw combinedError;
  }

  /**
   * Wrapper para scraping com retry e fallback
   */
  async executeScrapingWithFallback(scrapers, filters, context = {}) {
    const scrapingFunctions = scrapers.map(scraper => {
      return async () => {
        this.logger.debug(`Executando scraping com ${scraper.constructor.name}`);
        return await scraper.scrapeEvents(filters);
      };
    });
    
    return await this.executeWithFallback(scrapingFunctions, {
      ...context,
      operationType: 'scraping'
    });
  }

  /**
   * Graceful degradation - retorna resultado parcial em caso de falha
   */
  async executeWithGracefulDegradation(fn, fallbackValue = null, context = {}) {
    try {
      return await this.executeWithRetry(fn, context);
    } catch (error) {
      this.logger.warn(`Operação falhou, usando graceful degradation:`, error.message);
      
      // Se há um valor de fallback, usa ele
      if (fallbackValue !== null) {
        return fallbackValue;
      }
      
      // Se é um array, retorna array vazio
      if (context.expectedType === 'array') {
        return [];
      }
      
      // Se é um objeto, retorna objeto vazio
      if (context.expectedType === 'object') {
        return {};
      }
      
      // Caso contrário, retorna null
      return null;
    }
  }

  /**
   * Circuit breaker simples
   */
  createCircuitBreaker(fn, options = {}) {
    const config = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000,
      monitoringPeriod: options.monitoringPeriod || 300000
    };
    
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    let failures = 0;
    let lastFailureTime = 0;
    let successes = 0;
    
    return async (...args) => {
      const now = Date.now();
      
      // Reset contador se passou do período de monitoramento
      if (now - lastFailureTime > config.monitoringPeriod) {
        failures = 0;
        successes = 0;
      }
      
      // Se circuit está aberto
      if (state === 'OPEN') {
        if (now - lastFailureTime < config.resetTimeout) {
          throw new ScrapingError(
            'Circuit breaker está aberto',
            ErrorTypes.NETWORK_ERROR,
            ErrorSeverity.MEDIUM,
            { state, failures, lastFailureTime }
          );
        } else {
          state = 'HALF_OPEN';
          this.logger.info('Circuit breaker mudou para HALF_OPEN');
        }
      }
      
      try {
        const result = await fn(...args);
        
        // Sucesso
        successes++;
        
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
          this.logger.info('Circuit breaker fechado após sucesso');
        }
        
        return result;
        
      } catch (error) {
        failures++;
        lastFailureTime = now;
        
        if (failures >= config.failureThreshold) {
          state = 'OPEN';
          this.logger.warn(`Circuit breaker aberto após ${failures} falhas`);
        }
        
        throw error;
      }
    };
  }

  /**
   * Atualiza estatísticas de erro
   */
  updateErrorStats(error) {
    const errorType = error.type || error.code || 'unknown';
    this.stats.errorDistribution[errorType] = 
      (this.stats.errorDistribution[errorType] || 0) + 1;
  }

  /**
   * Função auxiliar para sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gera ID único para operação
   */
  generateOperationId() {
    return `retry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Obtém estatísticas do retry handler
   */
  getStats() {
    const successRate = this.stats.totalAttempts > 0 ? 
      Math.round(((this.stats.totalAttempts - this.stats.failedRetries) / this.stats.totalAttempts) * 100) : 0;
    
    const averageDelay = this.stats.successfulRetries > 0 ? 
      Math.round(this.stats.totalDelay / this.stats.successfulRetries) : 0;
    
    return {
      ...this.stats,
      successRate: `${successRate}%`,
      averageRetryDelay: `${averageDelay}ms`,
      config: this.config
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalDelay: 0,
      errorDistribution: {}
    };
  }
}

module.exports = { RetryHandler };