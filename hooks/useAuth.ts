/**
 * Hook de Autenticação Enterprise-Grade
 * 
 * Hook refatorado com gerenciamento robusto de estado,
 * cache inteligente, retry automático e monitoramento
 * de saúde da autenticação.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { 
  AuthState, 
  AuthResult, 
  AuthEvent, 
  AuthEventData,
  AuthHookOptions,
  DEFAULT_AUTH_OPTIONS
} from '@/types/auth'
import { 
  cacheSession, 
  getCachedSession, 
  invalidateUserCache,
  configureAuthCache
} from '@/utils/authCache'

interface AuthEventListener {
  id: string
  event: AuthEvent | 'ALL'
  callback: (data: AuthEventData) => void
}

export function useAuth(options: Partial<AuthHookOptions> = {}) {
  const opts = { ...DEFAULT_AUTH_OPTIONS, ...options }
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    sessionStatus: 'loading'
  })

  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  
  const listenersRef = useRef<AuthEventListener[]>([])
  const subscriptionRef = useRef<any>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Configura cache na inicialização
   */
  useEffect(() => {
    if (opts.enableCache) {
      configureAuthCache({
        defaultTTL: opts.cacheTimeout,
        enableLogging: opts.enableLogging
      })
    }
  }, [opts.enableCache, opts.cacheTimeout, opts.enableLogging])

  /**
   * Emite evento para listeners
   */
  const emitEvent = useCallback((eventData: AuthEventData) => {
    listenersRef.current.forEach(listener => {
      if (listener.event === 'ALL' || listener.event === eventData.event) {
        try {
          listener.callback(eventData)
        } catch (error) {
          if (opts.enableLogging) {
            console.error('Erro em listener de evento auth:', error)
          }
        }
      }
    })
  }, [opts.enableLogging])

  /**
   * Adiciona listener de eventos
   */
  const addEventListener = useCallback((
    event: AuthEvent | 'ALL',
    callback: (data: AuthEventData) => void
  ): string => {
    const id = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    listenersRef.current.push({ id, event, callback })
    return id
  }, [])

  /**
   * Remove listener de eventos
   */
  const removeEventListener = useCallback((id: string): boolean => {
    const index = listenersRef.current.findIndex(l => l.id === id)
    if (index >= 0) {
      listenersRef.current.splice(index, 1)
      return true
    }
    return false
  }, [])

  /**
   * Limpa tokens corrompidos do localStorage
   */
  const clearCorruptedTokens = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const keys = [
          'supabase.auth.token',
          `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
        ]
        
        keys.forEach(key => {
          window.localStorage.removeItem(key)
        })
        
        if (opts.enableLogging) {
          console.log('🧹 Auth: Tokens corrompidos removidos do localStorage')
        }
      } catch (error) {
        if (opts.enableLogging) {
          console.warn('Erro ao limpar localStorage:', error)
        }
      }
    }
  }, [opts.enableLogging])

  /**
   * Atualiza estado da autenticação
   */
  const updateAuthState = useCallback((
    user: User | null, 
    error: string | null = null,
    sessionStatus: AuthState['sessionStatus'] = 'loading'
  ) => {
    const isAuthenticated = !!user
    
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated,
      error,
      sessionStatus,
      isLoading: sessionStatus === 'loading'
    }))

    // Cache da sessão
    if (opts.enableCache && user) {
      cacheSession(user.id, user, opts.cacheTimeout)
    }

    // Emitir evento
    if (user && !prev.user) {
      emitEvent({
        event: 'SIGNED_IN',
        user,
        timestamp: new Date()
      })
    } else if (!user && prev.user) {
      emitEvent({
        event: 'SIGNED_OUT',
        user: null,
        timestamp: new Date()
      })
    }
  }, [opts.enableCache, opts.cacheTimeout, emitEvent])

  /**
   * Obtém sessão com retry automático
   */
  const getSessionWithRetry = useCallback(async (attempt = 1): Promise<{ user: User | null, error: string | null }> => {
    try {
      // Verificar cache primeiro
      if (opts.enableCache && attempt === 1) {
        const cachedUser = state.user ? getCachedSession(state.user.id) : null
        if (cachedUser) {
          if (opts.enableLogging) {
            console.log('🎯 Auth: Usando sessão em cache')
          }
          return { user: cachedUser, error: null }
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        // Erros de token corrompido
        if (error.message.includes('refresh') || 
            error.message.includes('token') || 
            error.message.includes('Invalid') ||
            error.message.includes('expired')) {
          
          if (opts.enableLogging) {
            console.warn('🔄 Auth: Token corrompido detectado, limpando sessão')
          }
          
          clearCorruptedTokens()
          await supabase.auth.signOut({ scope: 'local' })
          return { user: null, error: null }
        }
        
        throw error
      }

      return { user: session?.user ?? null, error: null }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido ao obter sessão'
      
      if (attempt < opts.retryAttempts) {
        if (opts.enableLogging) {
          console.warn(`🔄 Auth: Tentativa ${attempt} falhou, tentando novamente em ${opts.retryDelay}ms:`, errorMessage)
        }
        
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay * attempt))
        return getSessionWithRetry(attempt + 1)
      }
      
      return { user: null, error: errorMessage }
    }
  }, [opts.enableCache, opts.enableLogging, opts.retryAttempts, opts.retryDelay, state.user, clearCorruptedTokens])

  /**
   * Inicializa sessão
   */
  const initializeSession = useCallback(async () => {
    if (opts.enableLogging) {
      console.log('🚀 Auth: Inicializando sessão...')
    }

    const { user, error } = await getSessionWithRetry()
    
    if (error) {
      updateAuthState(null, error, 'error')
      setLastError(error)
      setRetryCount(prev => prev + 1)
      
      emitEvent({
        event: 'SYNC_ERROR',
        error,
        timestamp: new Date()
      })
    } else {
      updateAuthState(user, null, user ? 'authenticated' : 'unauthenticated')
      setLastError(null)
      setRetryCount(0)
    }
  }, [opts.enableLogging, getSessionWithRetry, updateAuthState, emitEvent])

  /**
   * Configura listener de mudanças de auth
   */
  const setupAuthListener = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    subscriptionRef.current = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (opts.enableLogging) {
          console.log('🔐 Auth State Change:', {
            event,
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
          })
        }
        
        const user = session?.user ?? null
        
        // Invalidar cache do usuário anterior se mudou
        if (state.user && (!user || user.id !== state.user.id)) {
          invalidateUserCache(state.user.id)
        }
        
        // Atualizar estado baseado no evento
        switch (event) {
          case 'SIGNED_IN':
            updateAuthState(user, null, 'authenticated')
            emitEvent({ event: 'SIGNED_IN', user, timestamp: new Date() })
            break
            
          case 'SIGNED_OUT':
            updateAuthState(null, null, 'unauthenticated')
            emitEvent({ event: 'SIGNED_OUT', user: null, timestamp: new Date() })
            break
            
          case 'TOKEN_REFRESHED':
            updateAuthState(user, null, 'authenticated')
            emitEvent({ event: 'TOKEN_REFRESHED', user, timestamp: new Date() })
            break
            
          case 'USER_UPDATED':
            updateAuthState(user, null, 'authenticated')
            emitEvent({ event: 'USER_UPDATED', user, timestamp: new Date() })
            break
            
          default:
            updateAuthState(user, null, user ? 'authenticated' : 'unauthenticated')
        }
      }
    )
  }, [opts.enableLogging, state.user, updateAuthState, emitEvent])

  /**
   * Login com email e senha
   */
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }))
        return { success: false, user: null, error: error.message }
      }
      
      return { success: true, user: data.user, error: null }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no login'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, user: null, error: errorMessage }
    }
  }, [])

  /**
   * Cadastro com email (magic link)
   */
  const signUpWithEmail = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'temp-password-' + Math.random().toString(36),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }))
        return { success: false, user: null, error: error.message }
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
      return { 
        success: true, 
        user: data.user, 
        error: null,
        requiresVerification: !data.session
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no cadastro'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, user: null, error: errorMessage }
    }
  }, [])

  /**
   * Login com Google OAuth
   */
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }))
        return { success: false, user: null, error: error.message }
      }
      
      return { success: true, user: null, error: null }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no login com Google'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, user: null, error: errorMessage }
    }
  }, [])

  /**
   * Logout
   */
  const signOut = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // Invalidar cache antes do logout
      if (state.user) {
        invalidateUserCache(state.user.id)
      }
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }))
        return { error: error.message }
      }
      
      clearCorruptedTokens()
      return { error: null }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no logout'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { error: errorMessage }
    }
  }, [state.user, clearCorruptedTokens])

  /**
   * Força refresh da sessão
   */
  const refreshSession = useCallback(async (): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }))
        return { success: false, user: null, error: error.message }
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: true, user: data.user, error: null }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao atualizar sessão'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, user: null, error: errorMessage }
    }
  }, [])

  // Inicialização
  useEffect(() => {
    initializeSession()
    setupAuthListener()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [initializeSession, setupAuthListener])

  return {
    // Estado
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.isLoading,
    error: state.error,
    sessionStatus: state.sessionStatus,
    
    // Métricas
    retryCount,
    lastError,
    
    // Funções de autenticação
    signIn,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshSession,
    
    // Funções de eventos
    addEventListener,
    removeEventListener,
    
    // Utilitários
    clearCorruptedTokens,
    
    // Estado derivado
    isLoading: state.isLoading,
    isError: !!state.error,
    isReady: !state.isLoading && state.sessionStatus !== 'loading',
    needsRetry: retryCount > 0 && retryCount < opts.retryAttempts
  }
}