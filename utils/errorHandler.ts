/**
 * Sistema de Tratamento de Erros
 * 
 * Utilitário centralizado para tratamento, logging e recuperação
 * de erros com preservação de privacidade e retry automático.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { logRLSError } from './rlsLogger'

interface ErrorContext {
  operation: string
  userId?: string
  component?: string
  metadata?: Record<string, any>
  timestamp?: string
}

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: any) => boolean
}

interface ErrorHandlerResult<T> {
  success: boolean
  data?: T
  error?: ProcessedError
  retryCount: number
  totalTime: number
}

interface ProcessedError {
  id: string
  type: 'network' | 'auth' | 'permission' | 'validation' | 'server' | 'client' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  userMessage: string
  code?: string
  statusCode?: number
  canRetry: boolean
  requiresAuth: boolean
  suggestedActions: string[]
  context: ErrorContext
  originalError: any
  sanitizedError: any
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry em erros de rede e temporários
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR', '503', '502', '504']
    return retryableErrors.some(code => 
      error?.code?.includes(code) || 
      error?.message?.includes(code) ||
      error?.status?.toString() === code
    )
  }
}

/**
 * Classe principal para tratamento de erros
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorHistory: ProcessedError[] = []
  private maxHistorySize = 100

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Processa um erro e retorna informações estruturadas
   */
  processError(error: any, context: ErrorContext): ProcessedError {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    // Analisar tipo e severidade do erro
    const analysis = this.analyzeError(error)
    
    // Sanitizar erro para logging
    const sanitizedError = this.sanitizeError(error)
    
    // Gerar mensagem amigável
    const userMessage = this.generateUserMessage(analysis.type, error)
    
    // Determinar ações sugeridas
    const suggestedActions = this.getSuggestedActions(analysis.type, error)

    const processedError: ProcessedError = {
      id: errorId,
      type: analysis.type,
      severity: analysis.severity,
      message: error?.message || 'Erro desconhecido',
      userMessage,
      code: error?.code,
      statusCode: error?.status || error?.statusCode,
      canRetry: analysis.canRetry,
      requiresAuth: analysis.requiresAuth,
      suggestedActions,
      context: { ...context, timestamp },
      originalError: error,
      sanitizedError
    }

    // Adicionar ao histórico
    this.addToHistory(processedError)

    // Log do erro
    logRLSError(error, {
      ...context,
      errorId,
      errorType: analysis.type,
      severity: analysis.severity,
      canRetry: analysis.canRetry
    })

    return processedError
  }

  /**
   * Executa operação com retry automático
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<ErrorHandlerResult<T>> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    const startTime = Date.now()
    let lastError: any = null
    let retryCount = 0

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        const data = await operation()
        return {
          success: true,
          data,
          retryCount,
          totalTime: Date.now() - startTime
        }
      } catch (error) {
        lastError = error
        retryCount = attempt

        // Verificar se deve tentar novamente
        const shouldRetry = attempt < config.maxAttempts - 1 && 
                           config.retryCondition!(error)

        if (!shouldRetry) {
          break
        }

        // Calcular delay com backoff exponencial
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        )

        // Log da tentativa
        console.warn(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms:`, error.message)

        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Processar erro final
    const processedError = this.processError(lastError, {
      ...context,
      retryCount,
      totalAttempts: config.maxAttempts
    })

    return {
      success: false,
      error: processedError,
      retryCount,
      totalTime: Date.now() - startTime
    }
  }

  /**
   * Analisa um erro e determina tipo, severidade e características
   */
  private analyzeError(error: any): {
    type: ProcessedError['type']
    severity: ProcessedError['severity']
    canRetry: boolean
    requiresAuth: boolean
  } {
    const message = (error?.message || '').toLowerCase()
    const code = error?.code || ''
    const status = error?.status || error?.statusCode || 0

    // Erros de rede
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || status === 0) {
      return {
        type: 'network',
        severity: 'medium',
        canRetry: true,
        requiresAuth: false
      }
    }

    // Erros de autenticação
    if (status === 401 || message.includes('unauthorized') || 
        message.includes('authentication') || code.includes('AUTH')) {
      return {
        type: 'auth',
        severity: 'high',
        canRetry: false,
        requiresAuth: true
      }
    }

    // Erros de permissão
    if (status === 403 || message.includes('forbidden') || 
        message.includes('permission') || message.includes('policy')) {
      return {
        type: 'permission',
        severity: 'high',
        canRetry: false,
        requiresAuth: true
      }
    }

    // Erros de validação
    if (status === 400 || message.includes('validation') || 
        message.includes('invalid') || message.includes('required')) {
      return {
        type: 'validation',
        severity: 'low',
        canRetry: false,
        requiresAuth: false
      }
    }

    // Erros de servidor
    if (status >= 500 || message.includes('server error') || 
        message.includes('internal error')) {
      return {
        type: 'server',
        severity: status >= 500 ? 'critical' : 'high',
        canRetry: true,
        requiresAuth: false
      }
    }

    // Erros de cliente
    if (status >= 400 && status < 500) {
      return {
        type: 'client',
        severity: 'medium',
        canRetry: false,
        requiresAuth: false
      }
    }

    // Erro desconhecido
    return {
      type: 'unknown',
      severity: 'critical',
      canRetry: true,
      requiresAuth: false
    }
  }

  /**
   * Gera mensagem amigável para o usuário
   */
  private generateUserMessage(type: ProcessedError['type'], error: any): string {
    const messages = {
      network: 'Problema de conexão com o servidor. Verifique sua internet.',
      auth: 'Sua sessão expirou. Faça login novamente.',
      permission: 'Você não tem permissão para realizar esta ação.',
      validation: 'Alguns dados fornecidos são inválidos. Verifique e tente novamente.',
      server: 'Nossos servidores estão temporariamente indisponíveis.',
      client: 'Houve um problema com sua solicitação.',
      unknown: 'Ocorreu um erro inesperado. Tente novamente.'
    }

    return messages[type] || messages.unknown
  }

  /**
   * Determina ações sugeridas baseadas no tipo de erro
   */
  private getSuggestedActions(type: ProcessedError['type'], error: any): string[] {
    const actions = {
      network: [
        'Verificar conexão com a internet',
        'Tentar novamente em alguns instantes',
        'Recarregar a página'
      ],
      auth: [
        'Fazer login novamente',
        'Verificar se a sessão não expirou',
        'Limpar cache do navegador'
      ],
      permission: [
        'Verificar se você está logado',
        'Entrar em contato com o suporte',
        'Voltar à página anterior'
      ],
      validation: [
        'Verificar os dados inseridos',
        'Preencher todos os campos obrigatórios',
        'Seguir o formato solicitado'
      ],
      server: [
        'Tentar novamente em alguns minutos',
        'Verificar status do sistema',
        'Entrar em contato com o suporte'
      ],
      client: [
        'Verificar os dados da solicitação',
        'Tentar uma abordagem diferente',
        'Recarregar a página'
      ],
      unknown: [
        'Recarregar a página',
        'Tentar novamente mais tarde',
        'Entrar em contato com o suporte'
      ]
    }

    return actions[type] || actions.unknown
  }

  /**
   * Sanitiza erro removendo informações sensíveis
   */
  private sanitizeError(error: any): any {
    if (!error) return null

    const sanitized: any = {}

    // Campos seguros para manter
    const safeFields = ['message', 'code', 'status', 'statusCode', 'name', 'type']
    
    safeFields.forEach(field => {
      if (error[field] !== undefined) {
        sanitized[field] = error[field]
      }
    })

    // Sanitizar stack trace (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development' && error.stack) {
      sanitized.stack = error.stack
    }

    return sanitized
  }

  /**
   * Adiciona erro ao histórico
   */
  private addToHistory(error: ProcessedError): void {
    this.errorHistory.push(error)

    // Manter apenas os erros mais recentes
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Obtém estatísticas de erros
   */
  getErrorStats(): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    recentErrors: number
    mostCommonError: string | null
  } {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const recentErrors = this.errorHistory.filter(
      error => new Date(error.context.timestamp!).getTime() > oneHourAgo
    )

    const byType = this.errorHistory.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySeverity = this.errorHistory.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommonError = Object.entries(byType)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      recentErrors: recentErrors.length,
      mostCommonError
    }
  }

  /**
   * Obtém erros recentes
   */
  getRecentErrors(limit = 10): ProcessedError[] {
    return this.errorHistory
      .slice(-limit)
      .reverse()
  }

  /**
   * Limpa histórico de erros
   */
  clearHistory(): void {
    this.errorHistory = []
  }
}

/**
 * Funções utilitárias para uso direto
 */

// Instância global
const globalErrorHandler = ErrorHandler.getInstance()

export function handleError(error: any, context: ErrorContext): ProcessedError {
  return globalErrorHandler.processError(error, context)
}

export function withRetry<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  retryConfig?: Partial<RetryConfig>
): Promise<ErrorHandlerResult<T>> {
  return globalErrorHandler.withRetry(operation, context, retryConfig)
}

export function getErrorStats() {
  return globalErrorHandler.getErrorStats()
}

export function getRecentErrors(limit?: number) {
  return globalErrorHandler.getRecentErrors(limit)
}

/**
 * Wrapper para operações do Supabase com tratamento automático
 */
export async function withSupabaseErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context: ErrorContext,
  retryConfig?: Partial<RetryConfig>
): Promise<ErrorHandlerResult<T>> {
  return withRetry(async () => {
    const result = await operation()
    
    if (result.error) {
      throw result.error
    }
    
    return result.data!
  }, context, retryConfig)
}

/**
 * Decorator para métodos que precisam de tratamento de erro
 */
export function withErrorHandling(
  context: Partial<ErrorContext> = {},
  retryConfig?: Partial<RetryConfig>
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const fullContext: ErrorContext = {
        operation: `${target.constructor.name}.${propertyKey}`,
        component: target.constructor.name,
        ...context
      }

      if (retryConfig) {
        const result = await withRetry(
          () => originalMethod.apply(this, args),
          fullContext,
          retryConfig
        )
        
        if (!result.success) {
          throw result.error
        }
        
        return result.data
      } else {
        try {
          return await originalMethod.apply(this, args)
        } catch (error) {
          const processedError = handleError(error, fullContext)
          throw processedError
        }
      }
    }

    return descriptor
  }
}