/**
 * Error Boundary para Autenticação
 * 
 * Componente que captura erros específicos de autenticação e
 * fornece fallbacks seguros com opções de recuperação.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { logRLSError } from '@/utils/rlsLogger'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
  retryCount: number
  isRecovering: boolean
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableRetry?: boolean
  maxRetries?: number
  context?: string
  showDetails?: boolean
}

interface ErrorDetails {
  type: 'auth' | 'network' | 'permission' | 'validation' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage: string
  technicalMessage: string
  suggestedActions: string[]
  canRetry: boolean
  requiresAuth: boolean
}

export class AuthErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro com contexto
    const errorId = logRLSError(error, {
      operation: 'ERROR_BOUNDARY',
      context: this.props.context || 'unknown',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    })

    this.setState({
      errorInfo,
      errorId
    })

    // Callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary - Error Caught')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Error ID:', errorId)
      console.groupEnd()
    }
  }

  /**
   * Analisa o erro e retorna detalhes estruturados
   */
  private analyzeError(error: Error): ErrorDetails {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    // Erros de autenticação
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        type: 'auth',
        severity: 'high',
        userMessage: 'Problema de autenticação detectado',
        technicalMessage: error.message,
        suggestedActions: [
          'Fazer login novamente',
          'Verificar se a sessão não expirou',
          'Limpar cache do navegador'
        ],
        canRetry: true,
        requiresAuth: true
      }
    }

    // Erros de rede
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network',
        severity: 'medium',
        userMessage: 'Problema de conexão com o servidor',
        technicalMessage: error.message,
        suggestedActions: [
          'Verificar conexão com a internet',
          'Tentar novamente em alguns instantes',
          'Recarregar a página'
        ],
        canRetry: true,
        requiresAuth: false
      }
    }

    // Erros de permissão (RLS)
    if (message.includes('permission') || message.includes('policy') || message.includes('rls')) {
      return {
        type: 'permission',
        severity: 'high',
        userMessage: 'Você não tem permissão para acessar este recurso',
        technicalMessage: error.message,
        suggestedActions: [
          'Verificar se você está logado',
          'Entrar em contato com o suporte',
          'Voltar à página anterior'
        ],
        canRetry: false,
        requiresAuth: true
      }
    }

    // Erros de validação
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        type: 'validation',
        severity: 'low',
        userMessage: 'Dados inválidos fornecidos',
        technicalMessage: error.message,
        suggestedActions: [
          'Verificar os dados inseridos',
          'Preencher todos os campos obrigatórios',
          'Tentar novamente'
        ],
        canRetry: true,
        requiresAuth: false
      }
    }

    // Erro desconhecido
    return {
      type: 'unknown',
      severity: 'critical',
      userMessage: 'Ocorreu um erro inesperado',
      technicalMessage: error.message,
      suggestedActions: [
        'Recarregar a página',
        'Tentar novamente mais tarde',
        'Entrar em contato com o suporte'
      ],
      canRetry: true,
      requiresAuth: false
    }
  }

  /**
   * Tenta recuperar do erro automaticamente
   */
  private handleRetry = async () => {
    const { maxRetries = 3 } = this.props
    
    if (this.state.retryCount >= maxRetries) {
      return
    }

    this.setState({ isRecovering: true })

    // Backoff exponencial: 1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 8000)

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false
      }))
    }, delay)
  }

  /**
   * Reset manual do error boundary
   */
  private handleReset = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
      this.retryTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false
    })
  }

  /**
   * Navegar para página de recuperação
   */
  private handleGoToRecovery = () => {
    const errorDetails = this.state.error ? this.analyzeError(this.state.error) : null
    const reason = errorDetails?.type || 'unknown_error'
    
    window.location.href = `/auth/recovery?reason=${reason}&errorId=${this.state.errorId}`
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorDetails = this.analyzeError(this.state.error)
      const { enableRetry = true, maxRetries = 3 } = this.props

      return (
        <ErrorFallback
          errorDetails={errorDetails}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          maxRetries={maxRetries}
          isRecovering={this.state.isRecovering}
          enableRetry={enableRetry}
          showDetails={this.props.showDetails}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          onGoToRecovery={this.handleGoToRecovery}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Componente de fallback para exibir erros
 */
interface ErrorFallbackProps {
  errorDetails: ErrorDetails
  errorId: string | null
  retryCount: number
  maxRetries: number
  isRecovering: boolean
  enableRetry: boolean
  showDetails?: boolean
  onRetry: () => void
  onReset: () => void
  onGoToRecovery: () => void
  error: Error
  errorInfo: React.ErrorInfo | null
}

function ErrorFallback({
  errorDetails,
  errorId,
  retryCount,
  maxRetries,
  isRecovering,
  enableRetry,
  showDetails = false,
  onRetry,
  onReset,
  onGoToRecovery,
  error,
  errorInfo
}: ErrorFallbackProps) {
  const canRetry = enableRetry && errorDetails.canRetry && retryCount < maxRetries
  const hasExceededRetries = retryCount >= maxRetries

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-reuni max-w-lg w-full p-8">
        <div className="text-center">
          {/* Ícone baseado na severidade */}
          <div className="text-6xl mb-4">
            {errorDetails.severity === 'critical' && '💥'}
            {errorDetails.severity === 'high' && '🚨'}
            {errorDetails.severity === 'medium' && '⚠️'}
            {errorDetails.severity === 'low' && 'ℹ️'}
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Algo deu errado
          </h1>

          {/* Tipo de erro */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            errorDetails.severity === 'critical' 
              ? 'bg-red-100 text-red-800'
              : errorDetails.severity === 'high'
              ? 'bg-orange-100 text-orange-800'
              : errorDetails.severity === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {errorDetails.type.charAt(0).toUpperCase() + errorDetails.type.slice(1)} Error
          </div>

          {/* Mensagem do usuário */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {errorDetails.userMessage}
          </p>

          {/* Status de recuperação */}
          {isRecovering && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <p className="text-blue-800 text-sm">
                  Tentando recuperar... (tentativa {retryCount + 1}/{maxRetries})
                </p>
              </div>
            </div>
          )}

          {/* Ações sugeridas */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-3">💡 Sugestões:</h3>
            <ul className="space-y-2">
              {errorDetails.suggestedActions.map((action, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            {canRetry && !isRecovering && (
              <button
                onClick={onRetry}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                🔄 Tentar Novamente ({maxRetries - retryCount} tentativas restantes)
              </button>
            )}

            {hasExceededRetries && (
              <button
                onClick={onGoToRecovery}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🛠️ Ir para Recuperação Avançada
              </button>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onReset}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                🔄 Resetar
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                🏠 Ir para Início
              </button>
            </div>
          </div>

          {/* Informações técnicas (desenvolvimento ou se solicitado) */}
          {(showDetails || process.env.NODE_ENV === 'development') && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                🔍 Detalhes Técnicos
              </summary>
              <div className="mt-3 p-3 bg-gray-100 rounded text-xs">
                <div className="space-y-2">
                  <div>
                    <strong>Error ID:</strong> {errorId}
                  </div>
                  <div>
                    <strong>Type:</strong> {errorDetails.type}
                  </div>
                  <div>
                    <strong>Severity:</strong> {errorDetails.severity}
                  </div>
                  <div>
                    <strong>Retry Count:</strong> {retryCount}/{maxRetries}
                  </div>
                  <div>
                    <strong>Technical Message:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                      {errorDetails.technicalMessage}
                    </pre>
                  </div>
                  {process.env.NODE_ENV === 'development' && errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para usar error boundary programaticamente
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  // Throw error para ser capturado pelo error boundary
  if (error) {
    throw error
  }

  return { handleError, clearError }
}

/**
 * HOC para adicionar error boundary a qualquer componente
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AuthErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default AuthErrorBoundary