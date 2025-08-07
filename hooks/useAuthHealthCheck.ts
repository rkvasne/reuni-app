/**
 * Hook de Monitoramento e Health Check para Autenticação
 * 
 * Monitora a saúde do sistema de autenticação, incluindo
 * conectividade com Supabase, consistência de dados,
 * performance e detecção de problemas.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { 
  HealthCheckResult, 
  AuthHookOptions, 
  DEFAULT_AUTH_OPTIONS 
} from '@/types/auth'
import { 
  cacheHealthCheck, 
  getCachedHealthCheck 
} from '@/utils/authCache'

interface HealthCheckState {
  result: HealthCheckResult | null
  isChecking: boolean
  lastCheck: Date | null
  checkCount: number
  consecutiveFailures: number
}

interface HealthMetrics {
  averageResponseTime: number
  successRate: number
  uptime: number
  totalChecks: number
  failureRate: number
}

export function useAuthHealthCheck(options: Partial<AuthHookOptions> = {}) {
  const opts = { ...DEFAULT_AUTH_OPTIONS, ...options }
  const { user, isAuthenticated } = useAuth()
  
  const [state, setState] = useState<HealthCheckState>({
    result: null,
    isChecking: false,
    lastCheck: null,
    checkCount: 0,
    consecutiveFailures: 0
  })

  const [metrics, setMetrics] = useState<HealthMetrics>({
    averageResponseTime: 0,
    successRate: 100,
    uptime: 100,
    totalChecks: 0,
    failureRate: 0
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const responseTimesRef = useRef<number[]>([])
  const startTimeRef = useRef<Date>(new Date())

  /**
   * Executa verificação de saúde da autenticação
   */
  const performHealthCheck = useCallback(async (): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    const checks = {
      auth: false,
      database: false,
      profile: false,
      sync: false
    }
    const errors: string[] = []

    try {
      // 1. Verificar autenticação
      try {
        const { data: session, error: authError } = await supabase.auth.getSession()
        checks.auth = !authError && (session?.user ? true : !isAuthenticated)
        
        if (authError) {
          errors.push(`Auth: ${authError.message}`)
        }
      } catch (error: any) {
        errors.push(`Auth: ${error.message}`)
      }

      // 2. Verificar conectividade com banco
      try {
        const { error: dbError } = await supabase
          .from('usuarios')
          .select('count')
          .limit(1)
        
        checks.database = !dbError
        
        if (dbError) {
          errors.push(`Database: ${dbError.message}`)
        }
      } catch (error: any) {
        errors.push(`Database: ${error.message}`)
      }

      // 3. Verificar perfil (se autenticado)
      if (isAuthenticated && user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('usuarios')
            .select('id, nome, email')
            .eq('id', user.id)
            .single()
          
          checks.profile = !profileError && !!profile
          
          if (profileError) {
            errors.push(`Profile: ${profileError.message}`)
          }
        } catch (error: any) {
          errors.push(`Profile: ${error.message}`)
        }
      } else {
        checks.profile = true // OK se não autenticado
      }

      // 4. Verificar sincronização (se autenticado)
      if (isAuthenticated && user) {
        try {
          // Verificar se dados do auth coincidem com perfil
          const { data: profile } = await supabase
            .from('usuarios')
            .select('email')
            .eq('id', user.id)
            .single()
          
          checks.sync = !profile || profile.email === user.email
          
          if (profile && profile.email !== user.email) {
            errors.push('Sync: Email mismatch between auth and profile')
          }
        } catch (error: any) {
          errors.push(`Sync: ${error.message}`)
        }
      } else {
        checks.sync = true // OK se não autenticado
      }

    } catch (error: any) {
      errors.push(`General: ${error.message}`)
    }

    const responseTime = Date.now() - startTime
    const healthyChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.values(checks).length
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyChecks === totalChecks) {
      status = 'healthy'
    } else if (healthyChecks >= totalChecks / 2) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    const result: HealthCheckResult = {
      status,
      checks,
      responseTime,
      timestamp: new Date(),
      errors
    }

    // Cache do resultado
    if (opts.enableCache) {
      cacheHealthCheck(result, opts.healthCheckInterval)
    }

    return result
  }, [isAuthenticated, user, opts.enableCache, opts.healthCheckInterval])

  /**
   * Executa health check com atualização de estado
   */
  const runHealthCheck = useCallback(async (useCache = true): Promise<HealthCheckResult> => {
    // Verificar cache primeiro
    if (useCache && opts.enableCache) {
      const cached = getCachedHealthCheck()
      if (cached) {
        if (opts.enableLogging) {
          console.log('🎯 Health Check: Usando resultado em cache')
        }
        return cached
      }
    }

    setState(prev => ({ ...prev, isChecking: true }))

    try {
      const result = await performHealthCheck()
      
      // Atualizar métricas
      responseTimesRef.current.push(result.responseTime)
      if (responseTimesRef.current.length > 50) {
        responseTimesRef.current = responseTimesRef.current.slice(-50)
      }

      const isSuccess = result.status === 'healthy'
      const consecutiveFailures = isSuccess ? 0 : state.consecutiveFailures + 1
      
      setState(prev => ({
        ...prev,
        result,
        isChecking: false,
        lastCheck: new Date(),
        checkCount: prev.checkCount + 1,
        consecutiveFailures
      }))

      // Atualizar métricas
      setMetrics(prev => {
        const totalChecks = prev.totalChecks + 1
        const failures = isSuccess ? prev.failureRate * prev.totalChecks : (prev.failureRate * prev.totalChecks) + 1
        const avgResponseTime = responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
        const successRate = ((totalChecks - failures) / totalChecks) * 100
        const uptime = Math.max(0, 100 - (consecutiveFailures / totalChecks) * 100)

        return {
          averageResponseTime: Math.round(avgResponseTime),
          successRate: Math.round(successRate * 100) / 100,
          uptime: Math.round(uptime * 100) / 100,
          totalChecks,
          failureRate: Math.round((failures / totalChecks) * 10000) / 100
        }
      })

      if (opts.enableLogging) {
        console.log(`🏥 Health Check: ${result.status}`, {
          responseTime: result.responseTime,
          checks: result.checks,
          errors: result.errors
        })
      }

      return result
    } catch (error: any) {
      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        checks: { auth: false, database: false, profile: false, sync: false },
        responseTime: 0,
        timestamp: new Date(),
        errors: [error.message || 'Unknown error during health check']
      }

      setState(prev => ({
        ...prev,
        result: errorResult,
        isChecking: false,
        lastCheck: new Date(),
        checkCount: prev.checkCount + 1,
        consecutiveFailures: prev.consecutiveFailures + 1
      }))

      if (opts.enableLogging) {
        console.error('🚨 Health Check: Falha crítica', error)
      }

      return errorResult
    }
  }, [performHealthCheck, opts.enableCache, opts.enableLogging, state.consecutiveFailures])

  /**
   * Força um novo health check
   */
  const forceHealthCheck = useCallback(async (): Promise<HealthCheckResult> => {
    return await runHealthCheck(false)
  }, [runHealthCheck])

  /**
   * Inicia monitoramento automático
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return

    intervalRef.current = setInterval(() => {
      runHealthCheck(true)
    }, opts.healthCheckInterval)

    if (opts.enableLogging) {
      console.log(`🔄 Health Check: Monitoramento iniciado (${opts.healthCheckInterval}ms)`)
    }
  }, [runHealthCheck, opts.healthCheckInterval, opts.enableLogging])

  /**
   * Para monitoramento automático
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      
      if (opts.enableLogging) {
        console.log('⏹️ Health Check: Monitoramento parado')
      }
    }
  }, [opts.enableLogging])

  /**
   * Reseta métricas
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      averageResponseTime: 0,
      successRate: 100,
      uptime: 100,
      totalChecks: 0,
      failureRate: 0
    })
    
    setState(prev => ({
      ...prev,
      checkCount: 0,
      consecutiveFailures: 0
    }))
    
    responseTimesRef.current = []
    startTimeRef.current = new Date()
    
    if (opts.enableLogging) {
      console.log('🔄 Health Check: Métricas resetadas')
    }
  }, [opts.enableLogging])

  // Iniciar monitoramento automático
  useEffect(() => {
    startMonitoring()
    
    // Health check inicial
    runHealthCheck(true)

    return () => {
      stopMonitoring()
    }
  }, [startMonitoring, stopMonitoring, runHealthCheck])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    // Estado atual
    result: state.result,
    isChecking: state.isChecking,
    lastCheck: state.lastCheck,
    checkCount: state.checkCount,
    consecutiveFailures: state.consecutiveFailures,
    
    // Métricas
    metrics,
    
    // Funções
    runHealthCheck,
    forceHealthCheck,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    
    // Estado derivado
    isHealthy: state.result?.status === 'healthy',
    isDegraded: state.result?.status === 'degraded',
    isUnhealthy: state.result?.status === 'unhealthy',
    hasRecentCheck: state.lastCheck && (Date.now() - state.lastCheck.getTime()) < opts.healthCheckInterval * 2,
    isMonitoring: !!intervalRef.current,
    
    // Alertas
    needsAttention: state.consecutiveFailures >= 3,
    criticalFailure: state.consecutiveFailures >= 5,
    slowResponse: (state.result?.responseTime || 0) > 5000
  }
}