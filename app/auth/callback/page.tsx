'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  needsOnboarding,
  debugOnboardingLogic,
  updateOnboardingState,
  cleanupExpiredOnboardingData 
} from '@/utils/onboardingUtils'

interface AuthError {
  type: 'expired_link' | 'invalid_link' | 'network_error' | 'unknown_error'
  message: string
}

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<AuthError | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    /**
     * Trata erros de autenticação com mensagens específicas
     */
    const handleAuthError = (authError: any) => {
      let errorType: AuthError['type'] = 'unknown_error'
      let errorMessage = 'Ocorreu um erro durante a autenticação.'

      // Analisar diferentes tipos de erro do Supabase
      const errorMsg = authError.message?.toLowerCase() || ''
      
      if (errorMsg.includes('expired') || errorMsg.includes('invalid_token') || errorMsg.includes('token_expired')) {
        errorType = 'expired_link'
        errorMessage = 'O link de confirmação expirou. Solicite um novo email de confirmação na página de login.'
      } else if (errorMsg.includes('invalid') || errorMsg.includes('malformed') || errorMsg.includes('bad_jwt')) {
        errorType = 'invalid_link'
        errorMessage = 'Link de confirmação inválido. Verifique se o link está correto ou solicite um novo.'
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('timeout')) {
        errorType = 'network_error'
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
      } else if (errorMsg.includes('email_not_confirmed')) {
        errorType = 'invalid_link'
        errorMessage = 'Email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.'
      }

      setError({ type: errorType, message: errorMessage })
      setIsProcessing(false)
    }

    /**
     * Processa callback via parâmetros da URL quando não há sessão ativa
     */
    const handleCallbackFromUrl = async () => {
      try {
        console.log('🔗 Processando callback via URL')
        
        // Usar exchangeCodeForSession para processar o callback de confirmação
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('Erro no exchangeCodeForSession:', error)
          handleAuthError(error)
          return
        }

        if (data.session && data.user) {
          console.log('✅ Sessão criada com sucesso via callback:', data.user.id)
          await handleSuccessfulAuth(data.user)
        } else {
          console.log('❌ Nenhuma sessão criada no callback')
          setError({
            type: 'invalid_link',
            message: 'Não foi possível confirmar sua conta. O link pode ter expirado ou já foi usado.'
          })
          setIsProcessing(false)
        }
      } catch (error) {
        console.error('Erro ao processar callback da URL:', error)
        setError({
          type: 'unknown_error',
          message: 'Erro ao processar confirmação. Tente fazer login novamente.'
        })
        setIsProcessing(false)
      }
    }

    /**
     * Processa autenticação bem-sucedida e redireciona adequadamente
     */
    const handleSuccessfulAuth = async (user: any) => {
      try {
        console.log('Processando autenticação para usuário:', user.id)
        
        // Verificar se tem perfil completo no banco
        let hasCompleteProfile = false
        let profileCheckError = null
        
        try {
          console.log('🔍 Verificando perfil do usuário no banco...')
          
          const { data: existingUser, error } = await supabase
            .from('usuarios')
            .select('id, nome')
            .eq('id', user.id)
            .maybeSingle()

          if (error) {
            profileCheckError = error
            console.log('⚠️ Erro ao verificar perfil:', error.code, error.message)
            hasCompleteProfile = false
          } else if (existingUser && existingUser.nome && existingUser.nome.trim() !== '') {
            hasCompleteProfile = true
            console.log('✅ Usuário tem perfil completo:', { id: existingUser.id, nome: existingUser.nome })
          } else {
            console.log('📝 Usuário não encontrado ou perfil incompleto')
            hasCompleteProfile = false
          }
        } catch (dbError) {
          profileCheckError = dbError
          console.error('❌ Erro na consulta do perfil:', dbError)
          hasCompleteProfile = false
        }

        // Debug da lógica de onboarding
        debugOnboardingLogic(user, hasCompleteProfile)
        
        // Verificar se precisa de onboarding (combina critérios locais e de perfil)
        const userNeedsOnboarding = needsOnboarding(user, hasCompleteProfile)
        
        if (userNeedsOnboarding || profileCheckError) {
          console.log('✅ Redirecionando para /welcome - Novo usuário ou perfil incompleto')
          
          // Atualizar estado de onboarding
          updateOnboardingState(user.id, {
            currentStep: 'welcome',
            completedSteps: ['email-confirmation']
          })
          
          console.log('📍 Executando router.push("/welcome")')
          
          // Tentar router.push primeiro
          try {
            router.push('/welcome')
            
            // Aguardar um pouco para garantir que o redirecionamento aconteça
            setTimeout(() => {
              console.log('⏰ Timeout - verificando se redirecionamento aconteceu')
              if (window.location.pathname !== '/welcome') {
                console.warn('⚠️ Router.push falhou, usando window.location.href')
                window.location.href = '/welcome'
              }
            }, 500)
          } catch (routerError) {
            console.error('❌ Erro no router.push, usando window.location.href:', routerError)
            window.location.href = '/welcome'
          }
          
          return
        }

        // Usuário existente com perfil completo - redirecionar para home
        console.log('✅ Redirecionando para / - Usuário existente com perfil completo')
        console.log('📍 Executando router.push("/")')
        
        try {
          router.push('/')
          
          setTimeout(() => {
            if (window.location.pathname !== '/') {
              console.warn('⚠️ Router.push para / falhou, usando window.location.href')
              window.location.href = '/'
            }
          }, 500)
        } catch (routerError) {
          console.error('❌ Erro no router.push para /, usando window.location.href:', routerError)
          window.location.href = '/'
        }
        
      } catch (error) {
        console.error('Erro ao processar autenticação bem-sucedida:', error)
        
        // Em caso de erro geral, assumir usuário novo por segurança
        console.log('❌ Erro geral - redirecionando para /welcome por segurança')
        updateOnboardingState(user.id, {
          currentStep: 'welcome',
          completedSteps: ['email-confirmation']
        })
        
        try {
          router.push('/welcome')
          setTimeout(() => {
            if (window.location.pathname !== '/welcome') {
              window.location.href = '/welcome'
            }
          }, 500)
        } catch (routerError) {
          console.error('❌ Erro no router.push (fallback), usando window.location.href:', routerError)
          window.location.href = '/welcome'
        }
      }
    }

    const handleAuthCallback = async () => {
      try {
        console.log('🚀 Iniciando callback de autenticação')
        setIsProcessing(true)
        
        // Limpar dados de onboarding expirados
        cleanupExpiredOnboardingData()
        
        // Primeiro, tentar processar o callback via URL (mais confiável para confirmação de email)
        const urlParams = new URLSearchParams(window.location.search)
        const hasCallbackParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('refresh_token')
        
        console.log('URL params:', Object.fromEntries(urlParams))
        console.log('Has callback params:', hasCallbackParams)
        
        if (hasCallbackParams) {
          console.log('Processando callback via URL params')
          await handleCallbackFromUrl()
          return
        }
        
        // Se não há parâmetros de callback, verificar sessão existente
        console.log('Verificando sessão existente')
        const { data, error: authError } = await supabase.auth.getSession()

        if (authError) {
          console.error('Erro na autenticação:', authError)
          handleAuthError(authError)
          return
        }

        if (data.session) {
          console.log('Sessão encontrada:', data.session.user.id)
          const user = data.session.user
          await handleSuccessfulAuth(user)
        } else {
          console.log('Nenhuma sessão encontrada')
          setError({
            type: 'invalid_link',
            message: 'Não foi possível confirmar sua conta. Tente fazer login novamente.'
          })
          setIsProcessing(false)
        }
      } catch (error) {
        console.error('Erro no callback:', error)
        setError({
          type: 'unknown_error',
          message: 'Ocorreu um erro inesperado. Tente novamente.'
        })
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])



  const handleRetry = () => {
    setError(null)
    setIsProcessing(true)
    window.location.reload()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          
          <h2 className="text-xl font-bold text-neutral-800 mb-4">
            Ops! Algo deu errado
          </h2>
          
          <p className="text-neutral-600 mb-6 leading-relaxed">
            {error.message}
          </p>
          
          <div className="space-y-3">
            {error.type === 'network_error' && (
              <button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-300"
              >
                Tentar Novamente
              </button>
            )}
            
            <button
              onClick={handleGoHome}
              className="w-full bg-neutral-100 text-neutral-700 font-semibold py-3 px-4 rounded-lg hover:bg-neutral-200 transition-all duration-300"
            >
              Voltar ao Início
            </button>
          </div>
          
          {(error.type === 'expired_link' || error.type === 'invalid_link') && (
            <p className="text-sm text-neutral-500 mt-4">
              Você pode solicitar um novo email de confirmação na página de login.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
          Reuni
        </h2>
        <p className="text-neutral-600 mt-2">
          {isProcessing ? 'Finalizando login...' : 'Redirecionando...'}
        </p>
      </div>
    </div>
  )
}