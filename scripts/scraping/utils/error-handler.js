/**
 * Sistema de Tratamento de Erros Padronizado
 * 
 * Centraliza o tratamento de erros para todo o sistema de scraping,
 * categorizando e fornecendo respostas apropriadas.
 */

const { Logger } = require('./logger');

/**
 * Tipos de erro padronizados
 */
const ErrorTypes = {
  AUTHENTICATION_FAILED: 'auth_failed',
  RATE_LIMITED: 'rate_limited',
  NETWORK_ERROR: 'network_error',
  PARSING_ERROR: 'parsing_error',
  VALIDATION_ERROR: 'validation_error',
  SITE_STRUCTURE_CHANGED: 'structure_changed',
  DATABASE_ERROR: 'database_error',
  CONFIGURATION_ERROR: 'config_error',
  TIMEOUT_ERROR: 'timeout_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Severidade dos erros
 */
const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Classe para erros customizados do scraping
 */
class ScrapingError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN_ERROR, severity = ErrorSeverity.MEDIUM, details = {}) {
    super(message);
    this.name = 'ScrapingError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Mantém stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScrapingError);
    }
  }

  /**
   * Converte erro para objeto JSON
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Verifica se erro é recuperável
   */
  isRecoverable() {
    const recoverableTypes = [
      ErrorTypes.RATE_LIMITED,
      ErrorTypes.NETWORK_ERROR,
      ErrorTypes.TIMEOUT_ERROR
    ];
    
    return recoverableTypes.includes(this.type);
  }

  /**
   * Verifica se erro é crítico
   */
  isCritical() {
    return this.severity === ErrorSeverity.CRITICAL;
  }
}

/**
 * Manipulador central de erros
 */
class ErrorHandler {
  constructor(context = 'scraping') {
    this.logger = new Logger(`error-handler:${context}`);
    this.errorStats = {
      total: 0,
      byType: {},
      bySeverity: {},
      recoverable: 0,
      critical: 0
    };
  }

  /**
   * Manipula erro e retorna resposta apropriada
   */
  handle(error, context = {}) {
    let scrapingError;

    // Converte erro comum para ScrapingError se necessário
    if (!(error instanceof ScrapingError)) {
      scrapingError = this.categorizeError(error, context);
    } else {
      scrapingError = error;
    }

    // Atualiza estatísticas
    this.updateStats(scrapingError);

    // Log do erro
    this.logError(scrapingError, context);

    // Retorna resposta estruturada
    return {
      error: scrapingError,
      shouldRetry: scrapingError.isRecoverable(),
      isCritical: scrapingError.isCritical(),
      recommendation: this.getRecommendation(scrapingError)
    };
  }

  /**
   * Categoriza erro comum em ScrapingError
   */
  categorizeError(error, context = {}) {
    const message = error.message || 'Erro desconhecido';
    let type = ErrorTypes.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    const details = { originalError: error.name, context };

    // Categorização baseada na mensagem e tipo
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      type = ErrorTypes.NETWORK_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (error.code === 'ETIMEDOUT' || message.includes('timeout')) {
      type = ErrorTypes.TIMEOUT_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (error.response?.status === 429) {
      type = ErrorTypes.RATE_LIMITED;
      severity = ErrorSeverity.LOW;
      details.retryAfter = error.response.headers['retry-after'];
    } else if (error.response?.status >= 500) {
      type = ErrorTypes.NETWORK_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (error.response?.status === 404) {
      type = ErrorTypes.SITE_STRUCTURE_CHANGED;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('parse') || message.includes('selector')) {
      type = ErrorTypes.PARSING_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('validation') || message.includes('invalid') || message.includes('Invalid')) {
      type = ErrorTypes.VALIDATION_ERROR;
      severity = ErrorSeverity.LOW;
    } else if (message.includes('database') || message.includes('connection')) {
      type = ErrorTypes.DATABASE_ERROR;
      severity = ErrorSeverity.CRITICAL;
    } else if (message.includes('config') || message.includes('environment')) {
      type = ErrorTypes.CONFIGURATION_ERROR;
      severity = ErrorSeverity.CRITICAL;
    }

    return new ScrapingError(message, type, severity, details);
  }

  /**
   * Atualiza estatísticas de erro
   */
  updateStats(error) {
    this.errorStats.total++;
    
    // Por tipo
    this.errorStats.byType[error.type] = (this.errorStats.byType[error.type] || 0) + 1;
    
    // Por severidade
    this.errorStats.bySeverity[error.severity] = (this.errorStats.bySeverity[error.severity] || 0) + 1;
    
    // Contadores especiais
    if (error.isRecoverable()) {
      this.errorStats.recoverable++;
    }
    
    if (error.isCritical()) {
      this.errorStats.critical++;
    }
  }

  /**
   * Faz log do erro com nível apropriado
   */
  logError(error, context) {
    const logData = {
      type: error.type,
      severity: error.severity,
      details: error.details,
      context
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error(`CRÍTICO: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(`ALTO: ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`MÉDIO: ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info(`BAIXO: ${error.message}`, logData);
        break;
    }
  }

  /**
   * Fornece recomendação baseada no tipo de erro
   */
  getRecommendation(error) {
    const recommendations = {
      [ErrorTypes.RATE_LIMITED]: 'Aguarde antes de tentar novamente. Considere aumentar delays.',
      [ErrorTypes.NETWORK_ERROR]: 'Verifique conexão de rede. Tente novamente em alguns minutos.',
      [ErrorTypes.PARSING_ERROR]: 'Estrutura do site pode ter mudado. Verifique seletores CSS.',
      [ErrorTypes.VALIDATION_ERROR]: 'Dados coletados não atendem critérios de qualidade.',
      [ErrorTypes.SITE_STRUCTURE_CHANGED]: 'Site foi modificado. Atualize seletores e configurações.',
      [ErrorTypes.DATABASE_ERROR]: 'Problema crítico com banco de dados. Verifique conexão.',
      [ErrorTypes.CONFIGURATION_ERROR]: 'Configuração inválida. Verifique variáveis de ambiente.',
      [ErrorTypes.TIMEOUT_ERROR]: 'Operação demorou muito. Considere aumentar timeout.',
      [ErrorTypes.AUTHENTICATION_FAILED]: 'Credenciais inválidas ou sessão expirada.',
      [ErrorTypes.UNKNOWN_ERROR]: 'Erro não categorizado. Analise logs para mais detalhes.'
    };

    return recommendations[error.type] || recommendations[ErrorTypes.UNKNOWN_ERROR];
  }

  /**
   * Obtém estatísticas de erro
   */
  getStats() {
    return {
      ...this.errorStats,
      errorRate: this.errorStats.total > 0 ? 
        Math.round((this.errorStats.critical / this.errorStats.total) * 100) : 0,
      recoverabilityRate: this.errorStats.total > 0 ?
        Math.round((this.errorStats.recoverable / this.errorStats.total) * 100) : 0
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.errorStats = {
      total: 0,
      byType: {},
      bySeverity: {},
      recoverable: 0,
      critical: 0
    };
  }

  /**
   * Cria um manipulador de erro específico para um contexto
   */
  createContextHandler(context) {
    return new ErrorHandler(context);
  }
}

// Instância global padrão
const globalErrorHandler = new ErrorHandler('global');

/**
 * Função utilitária para manipular erros rapidamente
 */
function handleError(error, context = {}) {
  return globalErrorHandler.handle(error, context);
}

/**
 * Wrapper para funções assíncronas com tratamento de erro
 */
function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const result = handleError(error, context);
      
      if (result.isCritical) {
        throw result.error;
      }
      
      return { error: result.error, data: null };
    }
  };
}

module.exports = {
  ErrorTypes,
  ErrorSeverity,
  ScrapingError,
  ErrorHandler,
  handleError,
  withErrorHandling,
  globalErrorHandler
};