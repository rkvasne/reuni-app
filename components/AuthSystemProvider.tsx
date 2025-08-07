/**
 * Provider do Sistema de Autenticação Enterprise-Grade
 * 
 * Componente que encapsula e fornece o sistema de autenticação
 * para toda a aplicação, com monitoramento e debugging.
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuthSystem } from '@/hooks/useAuthSystem'
import { AuthSystemOptions } from '@/hooks/useAuthSystem'

interface AuthSystemContextType {
  authSystem: ReturnType<typeof useAuthSystem>
  isInitialized: boolean
}

const AuthSystemContext = createContext<AuthSystemContextType | null>(null)

interface AuthSystemProviderProps {
  children: React.ReactNode
  options?: AuthSystemOptions
  enableDebugPanel?: boolean
}

export function AuthSystemProvider({ 
  children, 
  options = {},
  enableDebugPanel = false 
}: AuthSystemProviderProps) {
  const authSystem = useAuthSystem(options)
  const [isInitialized, setIsInitialized] = useState(false)

  // Marcar como inicializado quando sistema estiver pronto
  useEffect(() => {
    if (authSystem.isReady && !isInitialized) {
      setIsInitialized(true)
      console.log('🚀 AuthSystem: Sistema inicializado com sucesso')
    }
  }, [authSystem.isReady, isInitialized])

  // Log de mudanças de estado importantes
  useEffect(() => {
    if (authSystem.isAuthenticated) {
      console.log('👤 AuthSystem: Usuário autenticado', {
        userId: authSystem.user?.id,
        email: authSystem.user?.email,
        profileComplete: authSystem.isProfileComplete
      })
    }
  }, [authSystem.isAuthenticated, authSystem.user, authSystem.isProfileComplete])

  return (
    <AuthSystemContext.Provider value={{ authSystem, isInitialized }}>
      {children}
      {enableDebugPanel && <AuthSystemDebugPanel />}
    </AuthSystemContext.Provider>
  )
}

/**
 * Hook para usar o sistema de autenticação
 */
export function useAuthSystemContext() {
  const context = useContext(AuthSystemContext)
  if (!context) {
    throw new Error('useAuthSystemContext deve ser usado dentro de AuthSystemProvider')
  }
  return context
}

/**
 * Painel de debug do sistema de autenticação
 */
function AuthSystemDebugPanel() {
  const { authSystem } = useAuthSystemContext()
  const [isVisible, setIsVisible] = useState(false)
  const [diagnostics, setDiagnostics] = useState<any>(null)

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setDiagnostics(authSystem.getDiagnostics())
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isVisible, authSystem])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      {/* Botão para abrir/fechar debug panel */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Auth System Debug"
      >
        🔐
      </button>

      {/* Panel de debug */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-96 overflow-auto">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Auth System Debug</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                authSystem.systemStatus === 'ready' ? 'bg-green-500' :
                authSystem.systemStatus === 'degraded' ? 'bg-yellow-500' :
                authSystem.systemStatus === 'error' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-600 capitalize">
                {authSystem.systemStatus}
              </span>
            </div>
          </div>
          
          <div className="p-4 space-y-3 text-xs">
            {/* Estado geral */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Estado Geral</h4>
              <div className="space-y-1 text-gray-600">
                <div>Autenticado: {authSystem.isAuthenticated ? '✅' : '❌'}</div>
                <div>Perfil Completo: {authSystem.isProfileComplete ? '✅' : '❌'}</div>
                <div>Sistema Pronto: {authSystem.isReady ? '✅' : '❌'}</div>
                <div>Pode Usar App: {authSystem.canUseApp ? '✅' : '❌'}</div>
              </div>
            </div>

            {/* Métricas */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Métricas</h4>
              <div className="space-y-1 text-gray-600">
                <div>Uptime: {authSystem.metrics.uptime}s</div>
                <div>Erros: {authSystem.metrics.errors}</div>
                <div>Health Checks: {authSystem.metrics.healthChecks}</div>
                <div>Cache Hits: {authSystem.metrics.cacheHits}</div>
              </div>
            </div>

            {/* Saúde do sistema */}
            {authSystem.healthCheck && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Saúde</h4>
                <div className="space-y-1 text-gray-600">
                  <div>Status: {authSystem.systemHealth}</div>
                  <div>Falhas Consecutivas: {authSystem.healthCheck.consecutiveFailures}</div>
                  <div>Tempo de Resposta: {authSystem.healthCheck.result?.responseTime}ms</div>
                </div>
              </div>
            )}

            {/* Proteção contra loops */}
            {authSystem.loopProtection && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Loop Protection</h4>
                <div className="space-y-1 text-gray-600">
                  <div>Loop Detectado: {authSystem.loopProtection.isLoop ? '⚠️' : '✅'}</div>
                  <div>Visitas: {authSystem.loopProtection.visitCount}</div>
                  <div>Deve Quebrar: {authSystem.loopProtection.shouldBreak ? '⚠️' : '✅'}</div>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="pt-2 border-t">
              <div className="flex gap-2">
                <button
                  onClick={() => authSystem.restartSystem()}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Restart
                </button>
                <button
                  onClick={() => console.log('Auth Diagnostics:', authSystem.getDiagnostics())}
                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                >
                  Log Full
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Hook simplificado para componentes que só precisam do básico
 */
export function useSimpleAuth() {
  const { authSystem } = useAuthSystemContext()
  
  return {
    user: authSystem.user,
    profile: authSystem.userProfile,
    isAuthenticated: authSystem.isAuthenticated,
    isLoading: authSystem.isLoading,
    canUseApp: authSystem.canUseApp,
    needsOnboarding: authSystem.needsOnboarding,
    signIn: authSystem.signIn,
    signOut: authSystem.signOut,
    updateProfile: authSystem.updateProfile
  }
}