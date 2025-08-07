/**
 * Hook para tratamento de erros RLS
 * 
 * Este hook fornece funcionalidades para capturar e tratar erros
 * relacionados às políticas RLS do Supabase de forma consistente.
 * 
 * Requirements: 4.4, 4.5
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { logRLSError, getRLSStats, getRLSLogs } from '@/utils/rlsLogger'
import { useAuth } from './useAuth'

interface RLSErrorHandlerOptions {
  enableAutoLogging?: boolean
  showUserFriendlyMessages?: boolean
  enableStats?: boolean
}

interface RLSErrorInfo {
  id: string
  userMessage: string
  canRetry: boolean
  suggestedAction?: string
}

/**
 * Mensagens amigáveis para diferentes tipos de erro RLS
 */
const USER_FRIENDLY_MESSAGES = {
  access_denied: {
    message: 'Você não tem permissão para acessar este recurso.',
    canRetry: false,
    suggestedAction: 'Verifique se você está logado e tem as permissões necessárias.'
  },
  policy_violation: {
    message: 'Esta ação não é permitida pelas regras de segurança.',
    canRetry: false,
    suggestedAction: 'Tente uma ação diferente ou entre em contato com o suporte.'
  },
  auth_failure: {
    message: 'É necessário estar logado para realizar esta ação.',
    canRetry: true,
    suggestedAction: 'Faça login e tente novamente.'
  },
  unknown: {
    message: 'Ocorreu um erro inesperado.',
    canRetry: true,
    suggestedAction: 'Tente novamente em alguns instantes.'
  }
} as const

export function useRLSErrorHandler(options: RLSErrorHandlerOptions = {}) {
  const {
    enableAutoLogging = true,
    showUserFriendlyMessages = true,
    enableStats = false
  } = options

  const { user } = useAuth()
  const [stats, setStats] = useState<ReturnType<typeof getRLSStats> | null>(null)

  /**
   * Atualiza estatísticas se habilitado
   */
  const updateStats = useCallback(() => {
    if (enableStats) {
      setStats(getRLSStats())
    }
  }, [enableStats])

  /**
   * Atualiza estatísticas periodicamente
   */
  useEffect(() => {
    if (enableStats) {
      updateStats()
      const interval = setInterval(updateStats, 30000) // A cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [enableStats, updateStats])

  /**
   * Função principal para tratar erros RLS
   */
  const handleRLSError = useCallback((
    error: any,
    context?: Record<string, any>
  ): RLSErrorInfo | null => {
    // Verificar se é um erro RLS
    if (!isRLSError(error)) {
      return null
    }

    let logId: string | null = null

    // Logar erro se habilitado
    if (enableAutoLogging) {
      const enrichedContext = {
        ...context,
        userId: user?.id,
        userEmail: user?.email,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      }

      logId = logRLSError(error, enrichedContext)
    }

    // Atualizar estatísticas
    updateStats()

    // Retornar informações do erro
    const errorInfo: RLSErrorInfo = {
      id: logId || `temp_${Date.now()}`,
      userMessage: 'Erro de permissão',
      canRetry: false
    }

    // Adicionar mensagem amigável se habilitado
    if (showUserFriendlyMessages) {
      const category = categorizeRLSError(error)
      const friendlyMessage = USER_FRIENDLY_MESSAGES[category]
      
      errorInfo.userMessage = friendlyMessage.message
      errorInfo.canRetry = friendlyMessage.canRetry
      errorInfo.suggestedAction = friendlyMessage.suggestedAction
    }

    return errorInfo
  }, [enableAutoLogging, showUserFriendlyMessages, user, updateStats])

  /**
   * Wrapper para operações do Supabase com tratamento automático de RLS
   */
  const withRLSHandling = useCallback(<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ) => {
    return async (): Promise<{ data: T | null; error: RLSErrorInfo | null }> => {
      try {
        const data = await operation()
        return { data, error: null }
      } catch (error) {
        const rlsError = handleRLSError(error, context)
        
        if (rlsError) {
          return { data: null, error: rlsError }
        }

        // Re-throw se não for erro RLS
        throw error
      }
    }
  }, [handleRLSError])

  /**
   * Função para obter logs recentes
   */
  const getRecentLogs = useCallback((limit = 10) => {
    return getRLSLogs({ limit })
  }, [])

  /**
   * Função para obter logs por tabela
   */
  const getLogsByTable = useCallback((table: string, limit = 10) => {
    return getRLSLogs({ table, limit })
  }, [])

  /**
   * Função para obter logs por severidade
   */
  const getLogsBySeverity = useCallback((severity: 'low' | 'medium' | 'high' | 'critical', limit = 10) => {
    return getRLSLogs({ severity, limit })
  }, [])

  return {
    handleRLSError,
    withRLSHandling,
    stats,
    getRecentLogs,
    getLogsByTable,
    getLogsBySeverity,
    updateStats
  }
}

/**
 * Verifica se um erro é relacionado ao RLS
 */
function isRLSError(error: any): boolean {
  if (!error) return false

  // Verificar código de erro PostgreSQL
  const rlsCodes = ['42501', '42P01', '42883', '42P02', '42000']
  if (error.code && rlsCodes.includes(error.code)) {
    return true
  }

  // Verificar mensagem de erro
  const message = (error.message || '').toLowerCase()
  const rlsKeywords = [
    'row level security',
    'policy',
    'insufficient privilege',
    'permission denied',
    'access denied'
  ]

  return rlsKeywords.some(keyword => message.includes(keyword))
}

/**
 * Categoriza um erro RLS
 */
function categorizeRLSError(error: any): keyof typeof USER_FRIENDLY_MESSAGES {
  const code = error.code
  const message = (error.message || '').toLowerCase()

  if (code === '42P02' || message.includes('auth')) {
    return 'auth_failure'
  }

  if (code === '42501' || message.includes('insufficient privilege') || message.includes('permission denied')) {
    return 'access_denied'
  }

  if (code === '42P01' || code === '42883' || message.includes('policy') || message.includes('row level security')) {
    return 'policy_violation'
  }

  return 'unknown'
}

/**
 * Hook simplificado para casos básicos
 */
export function useSimpleRLSHandler() {
  const { handleRLSError } = useRLSErrorHandler({
    enableAutoLogging: true,
    showUserFriendlyMessages: true,
    enableStats: false
  })

  return handleRLSError
}