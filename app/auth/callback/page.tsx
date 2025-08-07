/**
 * Callback de Autenticação Robusto
 * 
 * Página de callback que processa autenticação do Supabase com
 * arquitetura robusta, tratamento de erros e recuperação automática.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUserSync } from '@/hooks/useUserSync'
import { logRLSError } from '@/utils/rlsLogger'

interface CallbackState {
  status: 'loading' | 'processing' | 'success' | 'error' | 'expired' | 'recovery'
  message: string
  error?: string
  progress: number
  canRetry: boolean
  retryCount: number
  userType?: 'new' | 'existing' | 'unknown'
}

interface CallbackResult {
  success: boolean
  user: any
  profile: any
  isNewUser: boolean
  redirectTo: string
  error?: string
}

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000
const CALLBACK_TIMEOUT = 30000

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { syncUser } = useUserSync({ autoSync: false })

  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Inicializando autenticação...',
    progress: 0,
    canRetry: false,
    retryCount: 0
  })

  /**
   * Determina se é usuário novo ou existente de forma determinística
   */
  const determineUserType = useCallback(async (user: any): Promise<'new' | 'existing'> => {
    try {
      // Verificar se perfil existe na tabela usuarios
      const { data: profile, error } = await supabase
        .from('usuarios')
        .select('id, created_at')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Perfil não existe - usuário novo
        return 'new'
      }

      if (error) {
        // Erro na consulta - assumir existente por segurança
        console.warn('Erro ao verificar perfil, assumindo usuário existente:', error)
        return 'existing'
      }

      // Verificar se foi criado recentemente (últimos 5 minutos)
      const profileCreated = new Date(profile.created_at)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      
      return profileCreated > fiveMinutesAgo ? 'new' : 'existing'
    } catch (error) {
      console.warn('Erro ao determinar tipo de usuário:', error)
      return 'existing' // Fallback seguro
    }
  }, [])

  /**
   * Processa callback com retry automático
   */
  const processCallback = useCallback(async (attempt = 1): Promise<CallbackResult> => {
    try {
      setState(prev => ({
        ...prev,
        status: 'processing',
        message: `Processando autenticação... (tentativa ${attempt}/${MAX_RETRY_ATTEMPTS})`,
        progress: 20,
        retryCount: attempt - 1
      }))

      // Extrair parâmetros da URL
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Verificar se há erro na URL
      if (error) {
        throw new Error(errorDescription || `Erro de autenticação: ${error}`)
      }

      // Verificar se há código de autorização
      if (!code) {
        throw new Error('Código de autorização não encontrado na URL')
      }

      setState(prev => ({ ...prev, progress: 40, message: 'Trocando código por sessão...' }))

      // Trocar código por sessão
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        // Verificar se é erro de link expirado
        if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')) {
          throw new Error('EXPIRED_LINK')
        }
        throw sessionError
      }

      if (!sessionData.user) {
        throw new Error('Usuário não encontrado na sessão')
      }

      setState(prev => ({ ...prev, progress: 60, message: 'Determinando tipo de usuário...' }))

      // Determinar tipo de usuário
      const userType = await determineUserType(sessionData.user)

      setState(prev => ({ 
        ...prev, 
        progress: 80, 
        message: 'Sincronizando dados do perfil...',
        userType 
      }))

      // Sincronizar dados do usuário
      const syncResult = await syncUser(sessionData.user)

      if (!syncResult.success) {
        console.warn('Falha na sincronização, mas continuando:', syncResult.error)
      }

      // Determinar redirecionamento baseado no estado do perfil
      let redirectTo = '/'
      const returnTo = searchParams.get('returnTo')

      if (userType === 'new') {
        redirectTo = '/onboarding'
      } else if (returnTo && returnTo.startsWith('/')) {
        redirectTo = returnTo
      } else {
        redirectTo = '/dashboard'
      }

      return {
        success: true,
        user: sessionData.user,
        profile: syncResult.profile,
        isNewUser: userType === 'new',
        redirectTo,
        error: undefined
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido no callback'

      // Log do erro para análise
      logRLSError(error, {
        operation: 'AUTH_CALLBACK',
        attempt,
        searchParams: Object.fromEntries(searchParams.entries()),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      })

      // Verificar se deve tentar novamente
      if (attempt < MAX_RETRY_ATTEMPTS && !errorMessage.includes('EXPIRED_LINK')) {
        console.warn(`Tentativa ${attempt} falhou, tentando novamente:`, errorMessage)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
        return processCallback(attempt + 1)
      }

      return {
        success: false,
        user: null,
        profile: null,
        isNewUser: false,
        redirectTo: '/auth/error',
        error: errorMessage
      }
    }
  }, [searchParams, determineUserType, syncUser])

  /**
   * Processa callback com timeout
   */
  const processCallbackWithTimeout = useCallback(async (): Promise<CallbackResult> => {
    return Promise.race([
      processCallback(),
      new Promise<CallbackResult>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout no processamento do callback')), CALLBACK_TIMEOUT)
      )
    ])
  }, [processCallback])

  /**
   * Manipula resultado do callback
   */
  const handleCallbackResult = useCallback(async (result: CallbackResult) => {
    if (result.success) {
      setState(prev => ({
        ...prev,
        status: 'success',
        message: result.isNewUser ? 'Bem-vindo! Redirecionando para onboarding...' : 'Login realizado com sucesso!',
        progress: 100,
        userType: result.isNewUser ? 'new' : 'existing'
      }))

      // Aguardar um momento para mostrar sucesso
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Redirecionar
      router.replace(result.redirectTo)
    } else {
      const isExpiredLink = result.error?.includes('EXPIRED_LINK')
      
      setState(prev => ({
        ...prev,
        status: isExpiredLink ? 'expired' : 'error',
        message: isExpiredLink 
          ? 'Link de autenticação expirado' 
          : 'Erro no processamento da autenticação',
        error: result.error,
        canRetry: !isExpiredLink,
        progress: 0
      }))
    }
  }, [router])

  /**
   * Retry manual
   */
  const handleRetry = useCallback(async () => {
    if (state.retryCount >= MAX_RETRY_ATTEMPTS) {
      setState(prev => ({
        ...prev,
        status: 'recovery',
        message: 'Muitas tentativas falharam. Iniciando recuperação...',
        canRetry: false
      }))
      
      // Redirecionar para página de recuperação após delay
      setTimeout(() => {
        router.replace('/auth/recovery?reason=callback_failed')
      }, 2000)
      return
    }

    const result = await processCallbackWithTimeout()
    await handleCallbackResult(result)
  }, [state.retryCount, processCallbackWithTimeout, handleCallbackResult, router])

  /**
   * Efeito principal - executa callback uma vez
   */
  useEffect(() => {
    let mounted = true

    const executeCallback = async () => {
      try {
        const result = await processCallbackWithTimeout()
        if (mounted) {
          await handleCallbackResult(result)
        }
      } catch (error: any) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            status: 'error',
            message: 'Erro crítico no callback',
            error: error.message,
            canRetry: true,
            progress: 0
          }))
        }
      }
    }

    executeCallback()

    return () => {
      mounted = false
    }
  }, [processCallbackWithTimeout, handleCallbackResult])

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-reuni max-w-md w-full p-8">
        <div className="text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {state.status === 'loading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            )}
            {state.status === 'processing' && (
              <div className="animate-pulse text-4xl">🔄</div>
            )}
            {state.status === 'success' && (
              <div className="text-4xl text-green-500">✅</div>
            )}
            {state.status === 'error' && (
              <div className="text-4xl text-red-500">❌</div>
            )}
            {state.status === 'expired' && (
              <div className="text-4xl text-yellow-500">⏰</div>
            )}
            {state.status === 'recovery' && (
              <div className="text-4xl text-blue-500">🛠️</div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {state.status === 'loading' && 'Carregando...'}
            {state.status === 'processing' && 'Processando'}
            {state.status === 'success' && 'Sucesso!'}
            {state.status === 'error' && 'Erro'}
            {state.status === 'expired' && 'Link Expirado'}
            {state.status === 'recovery' && 'Recuperação'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">{state.message}</p>

          {/* Progress Bar */}
          {(state.status === 'loading' || state.status === 'processing') && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          )}

          {/* User Type Badge */}
          {state.userType && (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
              state.userType === 'new' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {state.userType === 'new' ? '🎉 Novo usuário' : '👋 Usuário existente'}
            </div>
          )}

          {/* Error Details */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-red-900 mb-2">Detalhes do Erro:</h3>
              <p className="text-sm text-red-700 font-mono">{state.error}</p>
              {state.retryCount > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Tentativas realizadas: {state.retryCount}/{MAX_RETRY_ATTEMPTS}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {state.canRetry && (
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                🔄 Tentar Novamente
              </button>
            )}

            {state.status === 'expired' && (
              <div className="space-y-3">
                <button
                  onClick={() => router.replace('/auth/login')}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  🔑 Fazer Login Novamente
                </button>
                <p className="text-xs text-gray-500">
                  Links de autenticação expiram após 1 hora por segurança
                </p>
              </div>
            )}

            {(state.status === 'error' && !state.canRetry) && (
              <div className="space-y-3">
                <button
                  onClick={() => router.replace('/auth/recovery?reason=callback_error')}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🛠️ Ir para Recuperação
                </button>
                <button
                  onClick={() => router.replace('/')}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  🏠 Voltar ao Início
                </button>
              </div>
            )}
          </div>

          {/* Debug Info (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                🔍 Debug Info
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                <div>Status: {state.status}</div>
                <div>Progress: {state.progress}%</div>
                <div>Retry Count: {state.retryCount}</div>
                <div>User Type: {state.userType || 'unknown'}</div>
                <div>Search Params: {JSON.stringify(Object.fromEntries(searchParams.entries()))}</div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}