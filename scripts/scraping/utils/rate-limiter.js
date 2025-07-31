/**
 * Rate Limiter
 * 
 * Implementa controle de taxa de requisições
 * com backoff exponencial para respeitar servidores.
 */

const { Logger } = require('./logger');

class RateLimiter {
  constructor(baseDelay = 1000, options = {}) {
    this.baseDelay = baseDelay;
    this.currentDelay = baseDelay;
    this.maxDelay = options.maxDelay || 30000; // 30 segundos
    this.maxRetries = options.maxRetries || 5;
    this.retryCount = 0;
    this.lastRequestTime = 0;
    this.logger = new Logger('rate-limiter');
    
    // Estatísticas
    this.stats = {
      totalRequests: 0,
      rateLimitHits: 0,
      totalWaitTime: 0,
      averageDelay: 0
    };
  }

  /**
   * Aguarda o tempo necessário antes da próxima requisição
   */
  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.currentDelay - timeSinceLastRequest);
    
    if (waitTime > 0) {
      this.logger.debug(`Aguardando ${waitTime}ms antes da próxima requisição`);
      await this.sleep(waitTime);
      this.stats.totalWaitTime += waitTime;
    }
    
    this.lastRequestTime = Date.now();
    this.stats.totalRequests++;
    this.updateAverageDelay();
  }

  /**
   * Manipula rate limiting (erro 429) com backoff exponencial
   */
  async handleRateLimit(retryAfter = null) {
    this.retryCount++;
    this.stats.rateLimitHits++;
    
    if (this.retryCount > this.maxRetries) {
      this.logger.error(`Máximo de tentativas (${this.maxRetries}) excedido para rate limiting`);
      throw new Error('Rate limit: máximo de tentativas excedido');
    }
    
    // Usa Retry-After header se disponível, senão usa backoff exponencial
    let waitTime;
    if (retryAfter) {
      waitTime = parseInt(retryAfter) * 1000; // Converte segundos para ms
      this.logger.warn(`Rate limit detectado. Aguardando ${retryAfter}s conforme Retry-After header`);
    } else {
      // Backoff exponencial: 2^tentativa * delay base
      waitTime = Math.min(
        this.baseDelay * Math.pow(2, this.retryCount - 1),
        this.maxDelay
      );
      this.logger.warn(`Rate limit detectado. Backoff exponencial: ${waitTime}ms (tentativa ${this.retryCount})`);
    }
    
    this.currentDelay = waitTime;
    await this.sleep(waitTime);
    this.stats.totalWaitTime += waitTime;
  }

  /**
   * Manipula outros tipos de erro HTTP
   */
  async handleError(statusCode, retryAfter = null) {
    switch (statusCode) {
      case 429: // Too Many Requests
        await this.handleRateLimit(retryAfter);
        break;
        
      case 503: // Service Unavailable
      case 502: // Bad Gateway
      case 504: // Gateway Timeout
        this.retryCount++;
        if (this.retryCount > this.maxRetries) {
          throw new Error(`Servidor indisponível após ${this.maxRetries} tentativas`);
        }
        
        const waitTime = Math.min(
          this.baseDelay * this.retryCount,
          this.maxDelay
        );
        
        this.logger.warn(`Erro ${statusCode}. Aguardando ${waitTime}ms antes de tentar novamente`);
        await this.sleep(waitTime);
        break;
        
      default:
        throw new Error(`Erro HTTP não tratado: ${statusCode}`);
    }
  }

  /**
   * Reseta o rate limiter para estado inicial
   */
  reset() {
    this.currentDelay = this.baseDelay;
    this.retryCount = 0;
    this.logger.debug('Rate limiter resetado');
  }

  /**
   * Ajusta dinamicamente o delay baseado na resposta do servidor
   */
  adjustDelay(responseTime, statusCode) {
    if (statusCode === 200) {
      // Resposta bem-sucedida - pode diminuir delay gradualmente
      if (responseTime < 1000) { // Resposta rápida
        this.currentDelay = Math.max(
          this.baseDelay,
          this.currentDelay * 0.9
        );
      }
    } else if (statusCode === 429) {
      // Rate limit - aumenta delay
      this.currentDelay = Math.min(
        this.maxDelay,
        this.currentDelay * 2
      );
    }
  }

  /**
   * Obtém estatísticas do rate limiter
   */
  getStats() {
    return {
      ...this.stats,
      currentDelay: this.currentDelay,
      retryCount: this.retryCount,
      efficiency: this.stats.rateLimitHits === 0 ? 100 : 
        Math.round((1 - this.stats.rateLimitHits / this.stats.totalRequests) * 100)
    };
  }

  /**
   * Verifica se deve continuar tentando
   */
  shouldRetry() {
    return this.retryCount < this.maxRetries;
  }

  /**
   * Função auxiliar para sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Atualiza delay médio
   */
  updateAverageDelay() {
    if (this.stats.totalRequests > 0) {
      this.stats.averageDelay = Math.round(
        this.stats.totalWaitTime / this.stats.totalRequests
      );
    }
  }

  /**
   * Cria um rate limiter específico para um domínio
   */
  static createForDomain(domain, baseDelay) {
    const rateLimiters = RateLimiter._domainLimiters || (RateLimiter._domainLimiters = new Map());
    
    if (!rateLimiters.has(domain)) {
      rateLimiters.set(domain, new RateLimiter(baseDelay));
    }
    
    return rateLimiters.get(domain);
  }

  /**
   * Limpa rate limiters de domínios não utilizados
   */
  static cleanup() {
    if (RateLimiter._domainLimiters) {
      RateLimiter._domainLimiters.clear();
    }
  }
}

module.exports = { RateLimiter };