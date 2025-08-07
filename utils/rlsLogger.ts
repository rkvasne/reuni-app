/**
 * Utilitário para logging de erros RLS (Row Level Security)
 * 
 * Este módulo fornece funcionalidades para capturar, processar e logar
 * erros relacionados às políticas RLS do Supabase de forma segura.
 * 
 * Requirements: 4.4, 4.5
 */

interface RLSError {
  code: string
  message: string
  details?: string
  hint?: string
  table?: string
  policy?: string
  userId?: string
  timestamp: Date
  context?: Record<string, any>
}

interface RLSLogEntry {
  id: string
  error: RLSError
  sanitizedError: RLSError
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'access_denied' | 'policy_violation' | 'auth_failure' | 'unknown'
}

/**
 * Códigos de erro RLS conhecidos do PostgreSQL/Supabase
 */
const RLS_ERROR_CODES = {
  INSUFFICIENT_PRIVILEGE: '42501',
  ROW_SECURITY_VIOLATION: '42P01',
  POLICY_VIOLATION: '42883',
  AUTH_REQUIRED: '42P02',
  PERMISSION_DENIED: '42000'
} as const

/**
 * Padrões para identificar informações sensíveis que devem ser removidas dos logs
 */
const SENSITIVE_PATTERNS = [
  /password/gi,
  /token/gi,
  /secret/gi,
  /key/gi,
  /auth/gi,
  /session/gi,
  /email.*@.*\./gi, // emails completos
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi // UUIDs
]

/**
 * Classe principal para logging de erros RLS
 */
export class RLSLogger {
  private static instance: RLSLogger
  private logs: RLSLogEntry[] = []
  private maxLogs = 1000 // Máximo de logs em memória

  private constructor() {}

  static getInstance(): RLSLogger {
    if (!RLSLogger.instance) {
      RLSLogger.instance = new RLSLogger()
    }
    return RLSLogger.instance
  }

  /**
   * Processa e loga um erro RLS
   */
  logRLSError(error: any, context?: Record<string, any>): string {
    const rlsError = this.parseError(error, context)
    const sanitizedError = this.sanitizeError(rlsError)
    const severity = this.determineSeverity(rlsError)
    const category = this.categorizeError(rlsError)

    const logEntry: RLSLogEntry = {
      id: this.generateLogId(),
      error: rlsError,
      sanitizedError,
      severity,
      category
    }

    this.addLogEntry(logEntry)
    this.outputLog(logEntry)

    return logEntry.id
  }

  /**
   * Converte erro genérico em estrutura RLSError
   */
  private parseError(error: any, context?: Record<string, any>): RLSError {
    const timestamp = new Date()

    // Erro do Supabase/PostgreSQL
    if (error?.code && error?.message) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: this.extractTableName(error),
        policy: this.extractPolicyName(error),
        userId: context?.userId,
        timestamp,
        context: this.sanitizeContext(context)
      }
    }

    // Erro genérico
    return {
      code: 'UNKNOWN',
      message: error?.message || String(error),
      timestamp,
      context: this.sanitizeContext(context)
    }
  }

  /**
   * Remove informações sensíveis do erro
   */
  private sanitizeError(error: RLSError): RLSError {
    const sanitized = { ...error }

    // Sanitizar mensagem
    sanitized.message = this.sanitizeString(error.message)
    
    // Sanitizar detalhes
    if (error.details) {
      sanitized.details = this.sanitizeString(error.details)
    }

    // Sanitizar hint
    if (error.hint) {
      sanitized.hint = this.sanitizeString(error.hint)
    }

    // Remover userId se presente
    delete sanitized.userId

    // Sanitizar contexto
    if (error.context) {
      sanitized.context = this.sanitizeContext(error.context)
    }

    return sanitized
  }

  /**
   * Remove informações sensíveis de uma string
   */
  private sanitizeString(str: string): string {
    let sanitized = str

    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })

    return sanitized
  }

  /**
   * Remove informações sensíveis do contexto
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined

    const sanitized: Record<string, any> = {}

    Object.entries(context).forEach(([key, value]) => {
      // Pular chaves sensíveis
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]'
        return
      }

      // Sanitizar valores string
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value)
      } else {
        sanitized[key] = value
      }
    })

    return sanitized
  }

  /**
   * Extrai nome da tabela do erro
   */
  private extractTableName(error: any): string | undefined {
    const message = error.message || error.details || ''
    const tableMatch = message.match(/table\s+"?([^"\s]+)"?/i)
    return tableMatch?.[1]
  }

  /**
   * Extrai nome da política do erro
   */
  private extractPolicyName(error: any): string | undefined {
    const message = error.message || error.details || ''
    const policyMatch = message.match(/policy\s+"?([^"\s]+)"?/i)
    return policyMatch?.[1]
  }

  /**
   * Determina a severidade do erro
   */
  private determineSeverity(error: RLSError): RLSLogEntry['severity'] {
    // Erros críticos
    if (error.code === RLS_ERROR_CODES.INSUFFICIENT_PRIVILEGE) {
      return 'critical'
    }

    // Erros de alta severidade
    if (error.code === RLS_ERROR_CODES.ROW_SECURITY_VIOLATION) {
      return 'high'
    }

    // Erros de média severidade
    if (error.code === RLS_ERROR_CODES.POLICY_VIOLATION) {
      return 'medium'
    }

    // Erros de baixa severidade
    return 'low'
  }

  /**
   * Categoriza o tipo de erro
   */
  private categorizeError(error: RLSError): RLSLogEntry['category'] {
    if (error.code === RLS_ERROR_CODES.AUTH_REQUIRED) {
      return 'auth_failure'
    }

    if (error.code === RLS_ERROR_CODES.INSUFFICIENT_PRIVILEGE || 
        error.code === RLS_ERROR_CODES.PERMISSION_DENIED) {
      return 'access_denied'
    }

    if (error.code === RLS_ERROR_CODES.ROW_SECURITY_VIOLATION || 
        error.code === RLS_ERROR_CODES.POLICY_VIOLATION) {
      return 'policy_violation'
    }

    return 'unknown'
  }

  /**
   * Gera ID único para o log
   */
  private generateLogId(): string {
    return `rls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Adiciona entrada ao log em memória
   */
  private addLogEntry(entry: RLSLogEntry): void {
    this.logs.push(entry)

    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Faz output do log baseado no ambiente
   */
  private outputLog(entry: RLSLogEntry): void {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isProduction = process.env.NODE_ENV === 'production'

    // Em desenvolvimento, logar detalhes completos
    if (isDevelopment) {
      console.group(`🔒 RLS Error [${entry.severity.toUpperCase()}] - ${entry.category}`)
      console.error('Original Error:', entry.error)
      console.warn('Sanitized Error:', entry.sanitizedError)
      console.info('Log ID:', entry.id)
      console.groupEnd()
    }

    // Em produção, logar apenas versão sanitizada
    if (isProduction) {
      console.error(`RLS Error [${entry.id}]:`, {
        severity: entry.severity,
        category: entry.category,
        code: entry.sanitizedError.code,
        message: entry.sanitizedError.message,
        table: entry.sanitizedError.table,
        timestamp: entry.sanitizedError.timestamp
      })
    }
  }

  /**
   * Retorna estatísticas dos logs
   */
  getStats(): {
    total: number
    bySeverity: Record<RLSLogEntry['severity'], number>
    byCategory: Record<RLSLogEntry['category'], number>
    recentErrors: number
  } {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const bySeverity = this.logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    }, {} as Record<RLSLogEntry['severity'], number>)

    const byCategory = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1
      return acc
    }, {} as Record<RLSLogEntry['category'], number>)

    const recentErrors = this.logs.filter(
      log => log.error.timestamp > oneHourAgo
    ).length

    return {
      total: this.logs.length,
      bySeverity,
      byCategory,
      recentErrors
    }
  }

  /**
   * Retorna logs filtrados
   */
  getLogs(filter?: {
    severity?: RLSLogEntry['severity']
    category?: RLSLogEntry['category']
    table?: string
    limit?: number
  }): RLSLogEntry[] {
    let filtered = [...this.logs]

    if (filter?.severity) {
      filtered = filtered.filter(log => log.severity === filter.severity)
    }

    if (filter?.category) {
      filtered = filtered.filter(log => log.category === filter.category)
    }

    if (filter?.table) {
      filtered = filtered.filter(log => log.sanitizedError.table === filter.table)
    }

    // Ordenar por timestamp (mais recente primeiro)
    filtered.sort((a, b) => b.error.timestamp.getTime() - a.error.timestamp.getTime())

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit)
    }

    return filtered
  }

  /**
   * Limpa logs antigos
   */
  clearOldLogs(olderThanHours = 24): number {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    const initialCount = this.logs.length
    
    this.logs = this.logs.filter(log => log.error.timestamp > cutoff)
    
    return initialCount - this.logs.length
  }
}

/**
 * Função utilitária para logar erros RLS
 */
export function logRLSError(error: any, context?: Record<string, any>): string {
  return RLSLogger.getInstance().logRLSError(error, context)
}

/**
 * Função utilitária para obter estatísticas RLS
 */
export function getRLSStats() {
  return RLSLogger.getInstance().getStats()
}

/**
 * Função utilitária para obter logs RLS
 */
export function getRLSLogs(filter?: Parameters<RLSLogger['getLogs']>[0]) {
  return RLSLogger.getInstance().getLogs(filter)
}

/**
 * Hook para integração com Supabase
 */
export function createRLSErrorHandler() {
  return (error: any, context?: Record<string, any>) => {
    // Verificar se é erro RLS
    if (error?.code && (
      Object.values(RLS_ERROR_CODES).includes(error.code) ||
      error.message?.toLowerCase().includes('row level security') ||
      error.message?.toLowerCase().includes('policy')
    )) {
      return logRLSError(error, context)
    }

    // Para outros erros, apenas logar normalmente
    console.error('Non-RLS Error:', error)
    return null
  }
}