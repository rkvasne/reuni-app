/**
 * Hook Agregador do Sistema de Autenticação Enterprise-Grade
 * 
 * Coordena todos os hooks de autenticação, fornecendo uma
 * interface unificada e gerenciamento centralizado de estado.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useUserProfile } from './useUserProfile'
import { useUserSync } from './useUserSync'
import { useProfileGuard } from './useProfileGuard'
import { useAuthHealthCheck } from './useAuthHealthCheck'
import { useLoopProtection } from './useLoopProtection'
import { 
  AuthHookOptions,
  ProfileGuardOptions,
  DEFAULT_AUTH_OPTIONS,
  DEFAULT_PROFILE_GUARD_OPTIONS,
  AuthEventData
} from '@/types/auth'
import { getAuthCacheStats, clearAuthCache } from '@/utils/authCache'

export interface AuthSystemOptions {
  auth?: Partial<AuthHookOptions>
  profileGuard?: Partial<ProfileGuardOptions>
  enableHealthCheck?: boolean
  enableLoopProtection?: boolean
  enableLogging?: boolean
}

interface AuthSystemState {
  isReady: boolean
  isHealthy: boolean
  hasErrors: boolean
  errorCount: number
  lastError: string | null
  systemStatus: 'initializing' | 'ready' | 'degraded' | 'error'
}

interface AuthSystemMetrics {
  authChecks: number
  profileSyncs: number
  guardDecisions: number
  healthChecks: number
  cacheHits: number
  cacheMisses: number
  errors: number
  uptime: number
}

const DEFAULT_SYSTEM_OPTIONS: Required<AuthSystemOptions> = {
  auth: DEFAULT_AUTH_OPTIONS,
  profileGuard: DEFAULT_PROFILE_GUARD_OPTIONS,
  enableHealthCheck: true,
  enableLoopProtection: true,
  enableLogging: false
}

export function useAuthSystem(options: AuthSystemOptions = {}) {
  const opts = { ...DEFAULT_SYSTEM_OPTIONS, ...options }
  
  // Hooks principais
  const auth = useAuth(opts.auth)
  const profile = useUserProfile(opts.auth)
  const sync = useUserSync(opts.auth)
  const guard = useProfileGuard(opts.profileGuard)
  const healthCheck = opts.enableHealthCheck ? useAuthHealthCheck(opts.auth) : null
  const loopProtection = opts.enableLoopProtection ? useLoopProtection({
    enabled: true,
    guardId: 'auth-system',
    enableLogging: opts.enableLogging
  }) : null

  const [systemState, setSystemState] = useState<AuthSystemState>({
    isReady: false,
    isHealthy: true,
    hasErrors: false,
    errorCount: 0,
    lastError: null,
    systemStatus: 'initializing'
  })

  const [metrics, setMetrics] = useState<AuthSystemMetrics>({
    authChecks: 0,
    profileSyncs: 0,
    guardDecisions: 0,
    healthChecks: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    uptime: 0
  })

  const [eventLog, setEventLog] = useState<AuthEventData[]>([])
  const [startTime] = useState(new Date())

  /**
   * Adiciona evento ao log
   */
  const logEvent = useCallback((event: AuthEventData) => {
            setEventLog(prevLog => [...prevLog.slice(-49), event]) // Manter últimos 50 eventos
    
    if (opts.enableLogging) {
      console.log(`📊 AuthSystem Event: ${event.event}`, event)
    }
  }, [opts.enableLogging])

  /**
   * Atualiza métricas do sistema
   */
  const updateMetrics = useCallback(() => {
    const cacheStats = getAuthCacheStats()
    const uptime = Date.now() - startTime.getTime()
    
    setMetrics(prev => ({
      ...prev,
      cacheHits: cacheStats.totalEntries,
      uptime: Math.round(uptime / 1000), // em segundos
      healthChecks: healthCheck?.checkCount || 0
    }))
  }, [startTime, healthCheck?.checkCount])

  /**
   * Avalia estado geral do sistema
   */
  const evaluateSystemState = useCallback(() => {
    const errors: string[] = []
    let isHealthy = true
    let systemStatus: AuthSystemState['systemStatus'] = 'ready'

    // Verificar erros nos hooks
    if (auth.error) errors.push(`Auth: ${auth.error}`)
    if (profile.error) errors.push(`Profile: ${profile.error}`)
    // sync não tem propriedade error direta

    // Verificar saúde geral
    if (healthCheck && !healthCheck.isHealthy) {
      isHealthy = false
      if (healthCheck.isUnhealthy) {
        systemStatus = 'error'
      } else if (healthCheck.isDegraded) {
        systemStatus = 'degraded'
      }
    }

    // Verificar loops
    if (loopProtection?.isLoop) {
      errors.push('Loop protection: Loop detected')
      systemStatus = 'degraded'
    }

    // Verificar se ainda está inicializando
    if (auth.loading || profile.isLoading || sync.isSyncing) {
      systemStatus = 'initializing'
    }

    const hasErrors = errors.length > 0
    const isReady = systemStatus !== 'initializing' && !hasErrors

    setSystemState(prevState => {
      // Log de mudanças de estado
      if (prevState.systemStatus !== systemStatus && opts.enableLogging) {
        console.log(`🔄 AuthSystem: Status changed from ${prevState.systemStatus} to ${systemStatus}`)
      }
      
      return {
        isReady,
        isHealthy,
        hasErrors,
        errorCount: errors.length,
        lastError: errors[errors.length - 1] || null,
        systemStatus
      }
    })
  }, [
    auth.error, auth.loading,
    profile.error, profile.isLoading,
    sync.isSyncing,
    healthCheck?.isHealthy, healthCheck?.isUnhealthy, healthCheck?.isDegraded,
    loopProtection?.isLoop,
    opts.enableLogging
  ])

  /**
   * Reinicia sistema em caso de erro crítico
   */
  const restartSystem = useCallback(async () => {
    if (opts.enableLogging) {
      console.log('🔄 AuthSystem: Reiniciando sistema...')
    }

    try {
      // Limpar cache
      clearAuthCache()
      
      // Forçar refresh dos hooks principais
      if (auth.refreshSession) {
        await auth.refreshSession()
      }
      
      if (profile.refreshProfile) {
        await profile.refreshProfile()
      }
      
      if (sync.forceSync) {
        await sync.forceSync()
      }
      
      // Resetar métricas de saúde
      if (healthCheck?.resetMetrics) {
        healthCheck.resetMetrics()
      }
      
      logEvent({
        event: 'SIGNED_IN', // Usar evento genérico
        metadata: { systemRestart: true },
        timestamp: new Date()
      })
      
      if (opts.enableLogging) {
        console.log('✅ AuthSystem: Sistema reiniciado com sucesso')
      }
    } catch (error: any) {
      if (opts.enableLogging) {
        console.error('❌ AuthSystem: Erro ao reiniciar sistema:', error)
      }
      
      logEvent({
        event: 'SYNC_ERROR',
        error: error.message,
        metadata: { systemRestartFailed: true },
        timestamp: new Date()
      })
    }
  }, [auth, profile, sync, healthCheck, opts.enableLogging, logEvent])

  /**
   * Obtém diagnóstico completo do sistema
   */
  const getDiagnostics = useCallback(() => {
    return {
      system: systemState,
      metrics,
      hooks: {
        auth: {
          isAuthenticated: auth.isAuthenticated,
          loading: auth.loading,
          error: auth.error,
          sessionStatus: auth.sessionStatus,
          retryCount: auth.retryCount
        },
        profile: {
          hasProfile: profile.hasProfile,
          isComplete: profile.isComplete,
          loading: profile.isLoading,
          error: profile.error,
          completeness: profile.completenessPercent
        },
        sync: {
          isSyncing: sync.isSyncing
        },
        guard: {
          isActive: guard.isActive,
          lastDecision: guard.lastDecision,
          needsCompletion: guard.needsCompletion,
          checkCount: guard.checkCount
        },
        healthCheck: healthCheck ? {
          status: healthCheck.result?.status,
          isHealthy: healthCheck.isHealthy,
          consecutiveFailures: healthCheck.consecutiveFailures,
          metrics: healthCheck.metrics
        } : null,
        loopProtection: loopProtection ? {
          isLoop: loopProtection.isLoop,
          visitCount: loopProtection.visitCount,
          shouldBreak: loopProtection.shouldBreak
        } : null
      },
      cache: getAuthCacheStats(),
      events: eventLog.slice(-10), // Últimos 10 eventos
      uptime: metrics.uptime
    }
  }, [systemState, metrics, auth, profile, sync, guard, healthCheck, loopProtection, eventLog])

  /**
   * Listener de eventos dos hooks
   */
  useEffect(() => {
    const listenerId = auth.addEventListener?.('ALL', logEvent)
    
    return () => {
      if (listenerId && auth.removeEventListener) {
        auth.removeEventListener(listenerId)
      }
    }
  }, [auth.addEventListener, auth.removeEventListener, logEvent])

  /**
   * Atualização periódica de métricas
   */
  useEffect(() => {
    const interval = setInterval(updateMetrics, 10000) // A cada 10 segundos
    updateMetrics() // Primeira atualização
    
    return () => clearInterval(interval)
  }, [updateMetrics])

  /**
   * Avaliação contínua do estado do sistema
   */
  useEffect(() => {
    evaluateSystemState()
  }, [evaluateSystemState])

  /**
   * Auto-restart em caso de erro crítico
   */
  useEffect(() => {
    if (systemState.systemStatus === 'error' && systemState.errorCount >= 3) {
      const timer = setTimeout(() => {
        restartSystem()
      }, 5000) // Aguardar 5 segundos antes de reiniciar
      
      return () => clearTimeout(timer)
    }
  }, [systemState.systemStatus, systemState.errorCount, restartSystem])

  return {
    // Estado do sistema
    ...systemState,
    metrics,
    
    // Hooks individuais (acesso direto quando necessário)
    auth,
    profile,
    sync,
    guard,
    healthCheck,
    loopProtection,
    
    // Funções do sistema
    restartSystem,
    getDiagnostics,
    logEvent,
    
    // Funções de conveniência (delegadas aos hooks)
    signIn: auth.signIn,
    signOut: auth.signOut,
    signUpWithEmail: auth.signUpWithEmail,
    signInWithGoogle: auth.signInWithGoogle,
    updateProfile: profile.updateProfile,
    refreshProfile: profile.refreshProfile,
    forceSync: sync.forceSync,
    
    // Estado agregado
    user: auth.user,
    userProfile: profile.profile,
    isAuthenticated: auth.isAuthenticated,
    isProfileComplete: profile.isComplete,
    isLoading: auth.loading || profile.isLoading || sync.isSyncing,
    
    // Estado derivado
    canUseApp: systemState.isReady && auth.isAuthenticated && profile.isComplete,
    needsOnboarding: auth.isAuthenticated && !profile.isComplete,
    hasSystemErrors: systemState.hasErrors,
    systemHealth: healthCheck?.result?.status || 'unknown'
  }
}