/**
 * Operation Logger
 * 
 * Facilita o logging de operações de scraping
 * com tracking de performance e estatísticas.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { Logger } = require('../utils/logger');
const { DatabaseHandler } = require('./database-handler');

class OperationLogger {
  constructor() {
    this.logger = new Logger('operation-logger');
    this.dbHandler = new DatabaseHandler();
    this.currentOperations = new Map();
  }

  /**
   * Inicia o tracking de uma operação
   */
  startOperation(operationId, type, source, filters = {}) {
    const operation = {
      id: operationId,
      type,
      source,
      filters,
      status: 'running',
      startedAt: new Date().toISOString(),
      eventsFound: 0,
      eventsInserted: 0,
      eventsDuplicated: 0,
      eventsRejected: 0,
      errorsCount: 0,
      errors: [],
      startTime: Date.now()
    };

    this.currentOperations.set(operationId, operation);
    
    this.logger.info(`Operação iniciada: ${type} (${source}) - ID: ${operationId}`);
    
    return operation;
  }

  /**
   * Atualiza estatísticas da operação
   */
  updateOperation(operationId, updates) {
    const operation = this.currentOperations.get(operationId);
    if (!operation) {
      this.logger.warn(`Operação não encontrada: ${operationId}`);
      return null;
    }

    Object.assign(operation, updates);
    
    this.logger.debug(`Operação atualizada: ${operationId}`, updates);
    
    return operation;
  }

  /**
   * Registra eventos encontrados
   */
  recordEventsFound(operationId, count) {
    return this.updateOperation(operationId, {
      eventsFound: count
    });
  }

  /**
   * Registra evento inserido
   */
  recordEventInserted(operationId) {
    const operation = this.currentOperations.get(operationId);
    if (operation) {
      operation.eventsInserted++;
    }
  }

  /**
   * Registra evento duplicado
   */
  recordEventDuplicated(operationId) {
    const operation = this.currentOperations.get(operationId);
    if (operation) {
      operation.eventsDuplicated++;
    }
  }

  /**
   * Registra evento rejeitado
   */
  recordEventRejected(operationId, reason) {
    const operation = this.currentOperations.get(operationId);
    if (operation) {
      operation.eventsRejected++;
      
      if (!operation.rejectionReasons) {
        operation.rejectionReasons = {};
      }
      
      operation.rejectionReasons[reason] = (operation.rejectionReasons[reason] || 0) + 1;
    }
  }

  /**
   * Registra erro na operação
   */
  recordError(operationId, error, context = {}) {
    const operation = this.currentOperations.get(operationId);
    if (operation) {
      operation.errorsCount++;
      operation.errors.push({
        message: error.message || error,
        type: error.type || 'unknown',
        context,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.error(`Erro na operação ${operationId}:`, error);
  }

  /**
   * Finaliza operação com sucesso
   */
  async completeOperation(operationId, additionalData = {}) {
    const operation = this.currentOperations.get(operationId);
    if (!operation) {
      this.logger.warn(`Operação não encontrada para finalizar: ${operationId}`);
      return null;
    }

    const completedAt = new Date().toISOString();
    const duration = Date.now() - operation.startTime;

    const finalOperation = {
      ...operation,
      ...additionalData,
      status: 'completed',
      completedAt,
      duration
    };

    try {
      // Conecta ao banco se necessário
      if (!this.dbHandler.isConnected) {
        await this.dbHandler.connect();
      }

      // Registra no banco de dados
      await this.dbHandler.logScrapingOperation(finalOperation);

      this.logger.success(`Operação concluída: ${operationId} (${duration}ms)`);
      this.logger.info(`Estatísticas: ${finalOperation.eventsFound} encontrados, ${finalOperation.eventsInserted} inseridos, ${finalOperation.eventsDuplicated} duplicados, ${finalOperation.eventsRejected} rejeitados`);

    } catch (error) {
      this.logger.error(`Erro ao registrar operação ${operationId}:`, error);
    }

    // Remove da memória
    this.currentOperations.delete(operationId);

    return finalOperation;
  }

  /**
   * Finaliza operação com erro
   */
  async failOperation(operationId, error, additionalData = {}) {
    const operation = this.currentOperations.get(operationId);
    if (!operation) {
      this.logger.warn(`Operação não encontrada para falhar: ${operationId}`);
      return null;
    }

    const completedAt = new Date().toISOString();
    const duration = Date.now() - operation.startTime;

    const failedOperation = {
      ...operation,
      ...additionalData,
      status: 'failed',
      completedAt,
      duration,
      errorDetails: {
        message: error.message || error,
        type: error.type || 'unknown',
        stack: error.stack
      }
    };

    try {
      // Conecta ao banco se necessário
      if (!this.dbHandler.isConnected) {
        await this.dbHandler.connect();
      }

      // Registra no banco de dados
      await this.dbHandler.logScrapingOperation(failedOperation);

      this.logger.error(`Operação falhou: ${operationId} (${duration}ms)`, error);

    } catch (dbError) {
      this.logger.error(`Erro ao registrar falha da operação ${operationId}:`, dbError);
    }

    // Remove da memória
    this.currentOperations.delete(operationId);

    return failedOperation;
  }

  /**
   * Obtém operação em andamento
   */
  getOperation(operationId) {
    return this.currentOperations.get(operationId);
  }

  /**
   * Lista todas as operações em andamento
   */
  getActiveOperations() {
    return Array.from(this.currentOperations.values());
  }

  /**
   * Gera ID único para operação
   */
  generateOperationId(source, type = 'scraping') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}_${source}_${timestamp}_${random}`;
  }

  /**
   * Wrapper para executar operação com logging automático
   */
  async executeWithLogging(source, type, filters, operationFn) {
    const operationId = this.generateOperationId(source, type);
    
    try {
      // Inicia operação
      this.startOperation(operationId, type, source, filters);

      // Executa função
      const result = await operationFn(operationId, this);

      // Finaliza com sucesso
      await this.completeOperation(operationId, {
        result: result ? 'success' : 'partial'
      });

      return result;

    } catch (error) {
      // Finaliza com erro
      await this.failOperation(operationId, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de operações recentes
   */
  async getRecentOperationsStats(hours = 24) {
    try {
      if (!this.dbHandler.isConnected) {
        await this.dbHandler.connect();
      }

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hours);

      const { data, error } = await this.dbHandler.supabase
        .from(this.dbHandler.tables.scraping_logs)
        .select('*')
        .gte('started_at', cutoffDate.toISOString())
        .order('started_at', { ascending: false });

      if (error) {
        throw error;
      }

      const stats = {
        totalOperations: data.length,
        successful: data.filter(op => op.status === 'completed').length,
        failed: data.filter(op => op.status === 'failed').length,
        totalEventsFound: data.reduce((sum, op) => sum + (op.events_found || 0), 0),
        totalEventsInserted: data.reduce((sum, op) => sum + (op.events_inserted || 0), 0),
        totalEventsDuplicated: data.reduce((sum, op) => sum + (op.events_duplicated || 0), 0),
        totalEventsRejected: data.reduce((sum, op) => sum + (op.events_rejected || 0), 0),
        averageDuration: data.length > 0 ? 
          Math.round(data.reduce((sum, op) => sum + (op.duration_ms || 0), 0) / data.length) : 0,
        bySource: {},
        byStatus: {}
      };

      // Agrupa por fonte
      data.forEach(op => {
        stats.bySource[op.source] = (stats.bySource[op.source] || 0) + 1;
        stats.byStatus[op.status] = (stats.byStatus[op.status] || 0) + 1;
      });

      return stats;

    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de operações:', error);
      throw error;
    }
  }

  /**
   * Limpa operações órfãs (que ficaram em memória)
   */
  cleanupOrphanedOperations(maxAgeMinutes = 60) {
    const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [operationId, operation] of this.currentOperations.entries()) {
      if (operation.startTime < cutoffTime) {
        this.logger.warn(`Limpando operação órfã: ${operationId}`);
        this.currentOperations.delete(operationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Limpeza concluída: ${cleanedCount} operações órfãs removidas`);
    }

    return cleanedCount;
  }
}

module.exports = { OperationLogger };