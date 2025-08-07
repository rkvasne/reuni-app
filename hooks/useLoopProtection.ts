/**
 * Hook para Proteção contra Loops
 * 
 * Hook React para integrar o sistema de proteção contra loops
 * com componentes e páginas, fornecendo detecção automática
 * e coordenação entre guards.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './useAuth'
import { 
  initLoopProtection, 
  recordPageVisit, 
  checkForLoop, 
  createGuard, 
  removeGuard, 
  breakCurrentLoop,
  getLoopProtectionStats,
  LoopProtectionManager
} from '@/utils/loopProtection'

interface UseLoopProtectionOptions {
  enabled?: boolean
  guardId?: string
  maxVisits?: number
  timeWindow?: number
  autoBreak?: boolean
  enableLogging?: boolean
  metadata?: Record<string, any>
}

interface LoopProtectionState {
  isLoop: boolean
  visitCount: number
  timeSpent: number
  shouldBreak: boolean
  stats: any
  isProtected: boolean
}

const DEFAULT_OPTIONS: UseLoopProtectionOptions = {
  enabled: true,
  autoBreak: true,
  enableLogging: true,
  maxVisits: 5,
  timeWindow: 30000
}

export function useLoopProtection(options: UseLoopProtectionOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  
  const [state, setState] = useState<LoopProtectionState>({
    isLoop: false,
    visitCount: 0,
    timeSpent: 0,
    shouldBreak: false,
    stats: null,
    isProtected: false
  })

  const managerRef = useRef<LoopProtectionManager | null>(null)
  const guardIdRef = useRef<string | null>(null)
  const lastPathRef = useRef<string | null>(null)

  /**
   * Inicializa o sistema de proteção
   */
  useEffect(() => {
    if (opts.enabled && !managerRef.current) {
      managerRef.current = initLoopProtection({
        maxVisits: opts.maxVisits,
        timeWindow: opts.timeWindow,
        enableLogging: opts.enableLogging
      })
      
      setState(prev => ({ ...prev, isProtected: true }))
    }
  }, [opts.enabled, opts.maxVisits, opts.timeWindow, opts.enableLogging])

  /**
   * Registra guard quando componente monta
   */
  useEffect(() => {
    if (opts.enabled && opts.guardId && !guardIdRef.current) {
      guardIdRef.current = opts.guardId
      createGuard(opts.guardId, pathname, {
        ...opts.metadata,
        userId: user?.id,
        timestamp: Date.now()
      })

      return () => {
        if (guardIdRef.current) {
          removeGuard(guardIdRef.current)
          guardIdRef.current = null
        }
      }
    }
  }, [opts.enabled, opts.guardId, pathname, user?.id, opts.metadata])

  /**
   * Monitora mudanças de rota e detecta loops
   */
  useEffect(() => {
    if (!opts.enabled || !pathname) return

    // Evitar registrar a mesma página múltiplas vezes
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname

    // Registrar visita
    recordPageVisit(pathname, user?.id, {
      ...opts.metadata,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    })

    // Verificar se há loop
    const loopResult = checkForLoop(pathname, user?.id)
    
    setState(prev => ({
      ...prev,
      isLoop: loopResult.isLoop,
      visitCount: loopResult.visitCount,
      timeSpent: loopResult.timeSpent,
      shouldBreak: loopResult.shouldBreak
    }))

    // Auto-quebra se habilitada
    if (opts.autoBreak && loopResult.shouldBreak) {
      const fallbackUrl = breakCurrentLoop(
        `Loop detectado em ${pathname}`,
        {
          visitCount: loopResult.visitCount,
          timeSpent: loopResult.timeSpent,
          userId: user?.id
        }
      )
      
      if (opts.enableLogging) {
        console.warn('Loop Protection - Auto-breaking loop, redirecting to:', fallbackUrl)
      }
      
      router.replace(fallbackUrl)
    }
  }, [pathname, user?.id, opts.enabled, opts.autoBreak, opts.enableLogging, opts.metadata, router])

  /**
   * Atualiza estatísticas periodicamente
   */
  useEffect(() => {
    if (!opts.enabled) return

    const updateStats = () => {
      const stats = getLoopProtectionStats()
      setState(prev => ({ ...prev, stats }))
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // A cada 5 segundos

    return () => clearInterval(interval)
  }, [opts.enabled])

  /**
   * Força quebra de loop manual
   */
  const forceBreakLoop = useCallback((reason?: string) => {
    if (!opts.enabled) return null

    const fallbackUrl = breakCurrentLoop(
      reason || `Loop quebrado manualmente em ${pathname}`,
      {
        manual: true,
        userId: user?.id,
        timestamp: Date.now()
      }
    )

    if (opts.enableLogging) {
      console.log('Loop Protection - Manual break triggered:', fallbackUrl)
    }

    router.replace(fallbackUrl)
    return fallbackUrl
  }, [opts.enabled, pathname, user?.id, opts.enableLogging, router])

  /**
   * Verifica se caminho específico tem loop
   */
  const checkPathForLoop = useCallback((path: string) => {
    if (!opts.enabled) return { isLoop: false, visitCount: 0, timeSpent: 0, shouldBreak: false, fallbackPath: '' }
    
    return checkForLoop(path, user?.id)
  }, [opts.enabled, user?.id])

  /**
   * Registra visita manual
   */
  const recordVisit = useCallback((path: string, metadata?: Record<string, any>) => {
    if (!opts.enabled) return

    recordPageVisit(path, user?.id, {
      ...opts.metadata,
      ...metadata,
      manual: true,
      timestamp: Date.now()
    })
  }, [opts.enabled, user?.id, opts.metadata])

  /**
   * Obtém estatísticas atuais
   */
  const getStats = useCallback(() => {
    if (!opts.enabled) return null
    return getLoopProtectionStats()
  }, [opts.enabled])

  return {
    // Estado atual
    isLoop: state.isLoop,
    visitCount: state.visitCount,
    timeSpent: state.timeSpent,
    shouldBreak: state.shouldBreak,
    isProtected: state.isProtected,
    stats: state.stats,
    
    // Funções
    forceBreakLoop,
    checkPathForLoop,
    recordVisit,
    getStats,
    
    // Estado derivado
    hasRecentActivity: state.visitCount > 0,
    isHighRisk: state.visitCount >= (opts.maxVisits || 5) - 1,
    protectionEnabled: opts.enabled && state.isProtected
  }
}

/**
 * Hook simplificado para proteção básica
 */
export function useBasicLoopProtection() {
  return useLoopProtection({
    enabled: true,
    autoBreak: true,
    enableLogging: false
  })
}

/**
 * Hook para guards de página específica
 */
export function usePageGuard(guardId: string, metadata?: Record<string, any>) {
  return useLoopProtection({
    enabled: true,
    guardId,
    autoBreak: true,
    enableLogging: true,
    metadata
  })
}

/**
 * Hook para monitoramento avançado
 */
export function useAdvancedLoopProtection(options: UseLoopProtectionOptions = {}) {
  const protection = useLoopProtection({
    ...options,
    enableLogging: true
  })

  const [alerts, setAlerts] = useState<Array<{
    id: string
    type: 'warning' | 'error'
    message: string
    timestamp: number
  }>>([])

  // Monitorar alertas
  useEffect(() => {
    if (protection.isHighRisk && !protection.isLoop) {
      const alert = {
        id: `alert_${Date.now()}`,
        type: 'warning' as const,
        message: `Aproximando-se do limite de visitas (${protection.visitCount}/${options.maxVisits || 5})`,
        timestamp: Date.now()
      }
      
      setAlerts(prev => [...prev.slice(-4), alert]) // Manter apenas 5 alertas
    }

    if (protection.isLoop) {
      const alert = {
        id: `alert_${Date.now()}`,
        type: 'error' as const,
        message: `Loop detectado! ${protection.visitCount} visitas em ${protection.timeSpent}ms`,
        timestamp: Date.now()
      }
      
      setAlerts(prev => [...prev.slice(-4), alert])
    }
  }, [protection.isHighRisk, protection.isLoop, protection.visitCount, protection.timeSpent, options.maxVisits])

  return {
    ...protection,
    alerts,
    clearAlerts: () => setAlerts([])
  }
}