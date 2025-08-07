/**
 * Página de Recuperação de Autenticação
 * 
 * Página para recuperar sessões de autenticação com problemas,
 * oferecendo múltiplas opções de recuperação baseadas no tipo de erro.
 * 
 * Requirements: 3.4, 3.5
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useUserSync } from '@/hooks/useUserSync'

interface RecoveryOption {
  id: string
  title: string
  description: string
  icon: string
  action: () => Promise<void>
  available: boolean
}

interface RecoveryState {
  reason: string
  isRecovering: boolean
  recoveryMessage: string
  availableOptions: RecoveryOption[]
  lastAttempt: Date | null
}

export default function AuthRecovery() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const { syncUser, forceSync } = useUserSync({ autoSync: false })

  const [state, setState] = useState<RecoveryState>({
    reason: 'unknown',
    isRecovering: false,
    recoveryMessage: '',
    availableOptions: [],
    lastAttempt: null
  })

  /**
   * Determina opções de recuperação baseadas no motivo
   */
  const getRecoveryOptions = (reason: string): RecoveryOption[] => {
    const baseOptions: RecoveryOption[] = [
      {
        id: 'force_sync',
        title: 'Forçar Sincronização',
        description: 'Tenta sincronizar dados do perfil novamente',
        icon: '🔄',
        action: async () => {
          setState(prev => ({ ...prev, isRecovering: true, recoveryMessage: 'Forçando sincronização...' }))
          const result = await forceSync()
          if (result.success) {
            setState(prev => ({ ...prev, recoveryMessage: 'Sincronização realizada com sucesso!' }))
            setTimeout(() => router.replace('/dashboard'), 2000)
          } else {
            setState(prev => ({ ...prev, recoveryMessage: `Erro na sincronização: ${result.error}` }))
          }
          setState(prev => ({ ...prev, isRecovering: false }))
        },
        available: !!user
      },
      {
        id: 'clear_session',
        title: 'Limpar Sessão',
        description: 'Remove sessão atual e força novo login',
        icon: '🧹',
        action: async () => {
          setState(prev => ({ ...prev, isRecovering: true, recoveryMessage: 'Limpando sessão...' }))
          await supabase.auth.signOut()
          localStorage.clear()
          sessionStorage.clear()
          setState(prev => ({ ...prev, recoveryMessage: 'Sessão limpa. Redirecionando...' }))
          setTimeout(() => router.replace('/auth/login'), 2000)
          setState(prev => ({ ...prev, isRecovering: false }))
        },
        available: true
      },
      {
        id: 'new_magic_link',
        title: 'Novo Link Mágico',
        description: 'Solicita um novo link de autenticação por email',
        icon: '✉️',
        action: async () => {
          const email = prompt('Digite seu email para receber um novo link:')
          if (!email) return

          setState(prev => ({ ...prev, isRecovering: true, recoveryMessage: 'Enviando novo link...' }))
          
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          })

          if (error) {
            setState(prev => ({ ...prev, recoveryMessage: `Erro ao enviar link: ${error.message}` }))
          } else {
            setState(prev => ({ ...prev, recoveryMessage: 'Novo link enviado! Verifique seu email.' }))
          }
          setState(prev => ({ ...prev, isRecovering: false }))
        },
        available: true
      },
      {
        id: 'manual_login',
        title: 'Login Manual',
        description: 'Volta para a página de login tradicional',
        icon: '🔑',
        action: async () => {
          router.replace('/auth/login')
        },
        available: true
      }
    ]

    // Filtrar opções baseadas no motivo
    switch (reason) {
      case 'callback_failed':
        return baseOptions.filter(opt => ['force_sync', 'clear_session', 'new_magic_link'].includes(opt.id))
      
      case 'callback_error':
        return baseOptions.filter(opt => ['clear_session', 'new_magic_link', 'manual_login'].includes(opt.id))
      
      case 'sync_failed':
        return baseOptions.filter(opt => ['force_sync', 'clear_session'].includes(opt.id))
      
      case 'expired_link':
        return baseOptions.filter(opt => ['new_magic_link', 'manual_login'].includes(opt.id))
      
      default:
        return baseOptions
    }
  }

  /**
   * Obtém mensagem explicativa baseada no motivo
   */
  const getReasonMessage = (reason: string): { title: string; description: string; severity: 'info' | 'warning' | 'error' } => {
    switch (reason) {
      case 'callback_failed':
        return {
          title: 'Falha no Callback',
          description: 'O processamento da autenticação falhou após múltiplas tentativas. Isso pode ser devido a problemas de rede ou configuração.',
          severity: 'error'
        }
      
      case 'callback_error':
        return {
          title: 'Erro no Callback',
          description: 'Ocorreu um erro durante o processamento da autenticação. O link pode estar corrompido ou expirado.',
          severity: 'error'
        }
      
      case 'sync_failed':
        return {
          title: 'Falha na Sincronização',
          description: 'Não foi possível sincronizar seus dados de perfil. Sua autenticação está válida, mas os dados podem estar inconsistentes.',
          severity: 'warning'
        }
      
      case 'expired_link':
        return {
          title: 'Link Expirado',
          description: 'O link de autenticação expirou. Links mágicos são válidos por apenas 1 hora por motivos de segurança.',
          severity: 'warning'
        }
      
      default:
        return {
          title: 'Problema de Autenticação',
          description: 'Detectamos um problema com sua autenticação. Use uma das opções abaixo para resolver.',
          severity: 'info'
        }
    }
  }

  /**
   * Inicialização - determina opções baseadas no motivo
   */
  useEffect(() => {
    const reason = searchParams.get('reason') || 'unknown'
    const options = getRecoveryOptions(reason)
    
    setState(prev => ({
      ...prev,
      reason,
      availableOptions: options.filter(opt => opt.available)
    }))
  }, [searchParams, user])

  /**
   * Auto-redirecionamento se usuário já está autenticado e sincronizado
   */
  useEffect(() => {
    if (!loading && user && state.reason !== 'sync_failed') {
      // Verificar se precisa sincronizar
      syncUser().then(result => {
        if (result.success) {
          router.replace('/dashboard')
        }
      })
    }
  }, [loading, user, state.reason, syncUser, router])

  const reasonInfo = getReasonMessage(state.reason)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-reuni max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando estado da autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-reuni max-w-lg w-full p-8">
        <div className="text-center mb-8">
          {/* Status Icon */}
          <div className="text-6xl mb-4">
            {reasonInfo.severity === 'error' && '🚨'}
            {reasonInfo.severity === 'warning' && '⚠️'}
            {reasonInfo.severity === 'info' && '🛠️'}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Recuperação de Autenticação
          </h1>

          {/* Reason */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            reasonInfo.severity === 'error' 
              ? 'bg-red-100 text-red-800'
              : reasonInfo.severity === 'warning'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {reasonInfo.title}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed">
            {reasonInfo.description}
          </p>
        </div>

        {/* Recovery Message */}
        {state.recoveryMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-400 text-xl mr-3">ℹ️</div>
              <div>
                <p className="text-blue-800 text-sm">{state.recoveryMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Options */}
        <div className="space-y-3 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Opções de Recuperação:</h3>
          
          {state.availableOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              disabled={state.isRecovering}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{option.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{option.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Status Atual:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Usuário autenticado:</span>
              <span className={`font-medium ${user ? 'text-green-600' : 'text-red-600'}`}>
                {user ? '✅ Sim' : '❌ Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Motivo da recuperação:</span>
              <span className="text-gray-900 font-mono text-xs">{state.reason}</span>
            </div>
            {state.lastAttempt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Última tentativa:</span>
                <span className="text-gray-900">{state.lastAttempt.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex space-x-3">
            <button
              onClick={() => router.replace('/')}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🏠 Voltar ao Início
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              🔄 Recarregar Página
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Se o problema persistir, entre em contato com o suporte técnico.
          </p>
        </div>

        {/* Debug Info (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              🔍 Debug Info
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
              <div>Reason: {state.reason}</div>
              <div>User ID: {user?.id || 'none'}</div>
              <div>Available Options: {state.availableOptions.length}</div>
              <div>Is Recovering: {state.isRecovering.toString()}</div>
              <div>Search Params: {JSON.stringify(Object.fromEntries(searchParams.entries()))}</div>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}