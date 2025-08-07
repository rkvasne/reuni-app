/**
 * Hook de Profile Guard Enterprise-Grade
 * 
 * Hook refatorado com coordenação inteligente entre guards,
 * prevenção de loops, cache de decisões e fallbacks seguros.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './useAuth'
import { useUserProfile } from './useUserProfile'
import { useLoopProtection } from './useLoopProtection'
import { 
  ProfileGuardOptions,
  DEFAULT_PROFILE_GUARD_OPTIONS,
  UserProfile
} from '@/types/auth'

interface GuardState {
  isActive: boolean
  lastDecision: 'allow' | 'redirect' | 'wait' | null
  lastRedirect: string | null
  decisionTime: Date | null
  checkCount: number
}

interface GuardDecision {
  action: 'allow' | 'redirect' | 'wait'
  reason: string
  redirectTo?: string
  metadata?: Record<string, any>
}

// Cache global de decisões para coordenação entre instâncias
const guardDecisionCache = new Map<string, {
  decision: GuardDecision
  timestamp: Date
  pathname: string
}>()

export function useProfileGuard(options: Partial<ProfileGuardOptions> = {}) {
  const opts = { ...DEFAULT_PROFILE_GUARD_OPTIONS, ...options }
  const { user, isAuthenticated, loading: authLoading, sessionStatus } = useAuth()
  const { profile, isLoading: profileLoading, isComplete } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()
  
  const [state, setState] = useState<GuardState>({
    isActive: false,
    lastDecision: null,
    lastRedirect: null,
    decisionTime: null,
    checkCount: 0
  })

  const loopProtection = useLoopProtection({
    enabled: true,
    guardId: `profile-guard-${pathname}`,
    autoBreak: true,
    enableLogging: opts.enableLogging,
    metadata: { userId: user?.id, pathname }
  })

  const lastCheckRef = useRef<Date | null>(null)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const guardIdRef = useRef<string>(`guard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  /**
   * Rotas que não precisam de verificação
   */
  const isExemptRoute = useCallback((path: string): boolean => {
    const exemptRoutes = [
      '/auth',
      '/welcome', 
      '/profile/complete',
      '/error',
      '/auth/callback',
      '/auth/recovery'
    ]
    
    return exemptRoutes.some(route => path.startsWith(route))
  }, [])

  /**
   * Verifica se perfil atende aos requisitos
   */
  const checkProfileRequirements = useCallback((profile: UserProfile | null): {
    isComplete: boolean
    missingFields: string[]
    completeness: number
  } => {
    if (!profile) {
      return {
        isComplete: false,
        missingFields: opts.requiredFields,
        completeness: 0
      }
    }

    const missingFields: string[] = []
    let filledFields = 0

    opts.requiredFields.forEach(field => {
      const value = profile[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field)
      } else {
        filledFields++
      }
    })

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completeness: Math.round((filledFields / opts.requiredFields.length) * 100)
    }
  }, [opts.requiredFields])

  /**
   * Toma decisão sobre o que fazer
   */
  const makeGuardDecision = useCallback((): GuardDecision => {
    const cacheKey = `${user?.id || 'anonymous'}_${pathname}`
    
    // Verificar cache de decisões recentes (evitar reprocessamento)
    const cachedDecision = guardDecisionCache.get(cacheKey)
    if (cachedDecision && (Date.now() - cachedDecision.timestamp.getTime()) < 5000) {
      if (opts.enableLogging) {
        console.log('🎯 ProfileGuard: Usando decisão em cache')
      }
      return cachedDecision.decision
    }

    // 1. Verificar se é rota isenta
    if (isExemptRoute(pathname)) {
      return {
        action: 'allow',
        reason: 'Rota isenta de verificação',
        metadata: { exemptRoute: true }
      }
    }

    // 2. Verificar se ainda está carregando
    if (authLoading || profileLoading || sessionStatus === 'loading') {
      return {
        action: 'wait',
        reason: 'Aguardando carregamento de dados',
        metadata: { authLoading, profileLoading, sessionStatus }
      }
    }

    // 3. Verificar autenticação
    if (!isAuthenticated || !user) {
      return {
        action: 'allow', // Middleware cuida da autenticação
        reason: 'Usuário não autenticado - middleware irá redirecionar',
        metadata: { authenticationHandledByMiddleware: true }
      }
    }

    // 4. Verificar se perfil existe
    if (!profile) {
      // Se não há perfil, aguardar sincronização
      return {
        action: 'wait',
        reason: 'Aguardando sincronização de perfil',
        metadata: { profileSyncPending: true }
      }
    }

    // 5. Verificar completude do perfil
    const requirements = checkProfileRequirements(profile)
    
    if (!requirements.isComplete) {
      // Se permite perfil incompleto, permitir acesso
      if (opts.allowIncomplete) {
        return {
          action: 'allow',
          reason: 'Perfil incompleto permitido',
          metadata: { 
            missingFields: requirements.missingFields,
            completeness: requirements.completeness
          }
        }
      }

      // Se já está na página de completar perfil, permitir
      if (pathname === opts.redirectTo) {
        return {
          action: 'allow',
          reason: 'Já na página de completar perfil',
          metadata: { onCompletionPage: true }
        }
      }

      // Redirecionar para completar perfil
      return {
        action: 'redirect',
        reason: 'Perfil incompleto - redirecionando para completar',
        redirectTo: opts.redirectTo,
        metadata: {
          missingFields: requirements.missingFields,
          completeness: requirements.completeness
        }
      }
    }

    // 6. Perfil completo - verificar se está na página de completar
    if (pathname === opts.redirectTo) {
      return {
        action: 'redirect',
        reason: 'Perfil completo - redirecionando para home',
        redirectTo: '/',
        metadata: { profileComplete: true }
      }
    }

    // 7. Tudo OK - permitir acesso
    return {
      action: 'allow',
      reason: 'Perfil completo e rota válida',
      metadata: { 
        profileComplete: true,
        completeness: requirements.completeness
      }
    }
  }, [
    user, pathname, authLoading, profileLoading, sessionStatus, 
    isAuthenticated, profile, isExemptRoute, checkProfileRequirements,
    opts.allowIncomplete, opts.redirectTo, opts.enableLogging
  ])

  /**
   * Executa decisão do guard
   */
  const executeGuardDecision = useCallback((decision: GuardDecision) => {
    const cacheKey = `${user?.id || 'anonymous'}_${pathname}`
    
    // Cache da decisão
    guardDecisionCache.set(cacheKey, {
      decision,
      timestamp: new Date(),
      pathname
    })

    // Limpar cache antigo (manter apenas últimas 50 decisões)
    if (guardDecisionCache.size > 50) {
      const oldestKey = Array.from(guardDecisionCache.keys())[0]
      guardDecisionCache.delete(oldestKey)
    }

    setState(prev => ({
      ...prev,
      lastDecision: decision.action,
      decisionTime: new Date(),
      checkCount: prev.checkCount + 1
    }))

    if (opts.enableLogging) {
      console.log(`🛡️ ProfileGuard: ${decision.action.toUpperCase()}`, {
        reason: decision.reason,
        redirectTo: decision.redirectTo,
        metadata: decision.metadata,
        guardId: guardIdRef.current
      })
    }

    // Executar ação
    switch (decision.action) {
      case 'redirect':
        if (decision.redirectTo && decision.redirectTo !== pathname) {
          // Verificar proteção contra loops
          if (loopProtection.isLoop) {
            if (opts.enableLogging) {
              console.warn('🔄 ProfileGuard: Loop detectado, forçando quebra')
            }
            loopProtection.forceBreakLoop('ProfileGuard loop detected')
            return
          }

          // Evitar redirecionamentos repetidos
          if (state.lastRedirect !== decision.redirectTo) {
            setState(prev => ({ ...prev, lastRedirect: decision.redirectTo! }))
            
            // Debounce para evitar redirecionamentos rápidos
            if (redirectTimeoutRef.current) {
              clearTimeout(redirectTimeoutRef.current)
            }
            
            redirectTimeoutRef.current = setTimeout(() => {
              router.push(decision.redirectTo!)
            }, 100)
          }
        }
        break
        
      case 'allow':
        // Limpar estado de redirecionamento
        setState(prev => ({ ...prev, lastRedirect: null }))
        break
        
      case 'wait':
        // Não fazer nada, aguardar próxima verificação
        break
    }
  }, [user, pathname, state.lastRedirect, opts.enableLogging, loopProtection, router])

  /**
   * Executa verificação do guard
   */
  const runGuardCheck = useCallback(() => {
    // Evitar verificações muito frequentes
    const now = new Date()
    if (lastCheckRef.current && (now.getTime() - lastCheckRef.current.getTime()) < 500) {
      return
    }
    lastCheckRef.current = now

    setState(prev => ({ ...prev, isActive: true }))

    try {
      const decision = makeGuardDecision()
      executeGuardDecision(decision)
    } catch (error) {
      if (opts.enableLogging) {
        console.error('❌ ProfileGuard: Erro na verificação:', error)
      }
      
      // Fallback seguro - permitir acesso
      setState(prev => ({
        ...prev,
        lastDecision: 'allow',
        decisionTime: new Date()
      }))
    } finally {
      setState(prev => ({ ...prev, isActive: false }))
    }
  }, [makeGuardDecision, executeGuardDecision, opts.enableLogging])

  /**
   * Força nova verificação
   */
  const forceCheck = useCallback(() => {
    lastCheckRef.current = null
    runGuardCheck()
  }, [runGuardCheck])

  /**
   * Executa verificação quando dependências mudam
   */
  useEffect(() => {
    runGuardCheck()
  }, [
    user?.id, 
    isAuthenticated, 
    authLoading, 
    profileLoading, 
    profile?.updated_at,
    isComplete,
    pathname,
    sessionStatus,
    runGuardCheck
  ])

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Estado do guard
    isActive: state.isActive,
    lastDecision: state.lastDecision,
    lastRedirect: state.lastRedirect,
    decisionTime: state.decisionTime,
    checkCount: state.checkCount,
    
    // Estado do perfil
    isProfileComplete: isComplete,
    isLoading: authLoading || profileLoading,
    
    // Funções
    forceCheck,
    checkProfileRequirements,
    
    // Estado derivado
    isReady: !authLoading && !profileLoading && sessionStatus !== 'loading',
    needsCompletion: isAuthenticated && profile && !isComplete,
    isOnCompletionPage: pathname === opts.redirectTo,
    isExemptRoute: isExemptRoute(pathname),
    
    // Proteção contra loops
    loopProtection: {
      isLoop: loopProtection.isLoop,
      visitCount: loopProtection.visitCount,
      shouldBreak: loopProtection.shouldBreak
    },
    
    // Debugging
    guardId: guardIdRef.current,
    cacheSize: guardDecisionCache.size
  }
} 