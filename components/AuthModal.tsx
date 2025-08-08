'use client'

import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEmailResend } from '@/hooks/useEmailResend'
import { useToast } from '@/hooks/useToast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const { signIn, signUp, signUpWithEmail, signInWithGoogle } = useAuth()
  const { resendEmail, canResend, cooldown, resending } = useEmailResend()
  const { toast, showToast, hideToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        
        onClose()
        resetForm()
      } else {
        // Cadastro com email e senha (mais direto)
        const { error } = await signUp(email, password)
        if (error) throw error
        
        // Mostrar tela de sucesso
        setError('')
        setEmailSent(true)
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      
      onClose()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com Google')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setShowPassword(false)
    setEmailSent(false)
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-neutral-600" />
        </button>

        {/* Conteúdo condicional baseado no estado */}
        {emailSent ? (
          /* Tela de Sucesso - Email Enviado */
          <div className="text-center space-y-6">
            {/* Ícone de sucesso */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-10 h-10 text-green-600" />
            </div>
            
            {/* Título de sucesso */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                Email enviado com sucesso! 📧
              </h2>
              <p className="text-neutral-600">
                Enviamos um link de acesso para:
              </p>
              <p className="font-semibold text-primary-600 mt-1">
                {email}
              </p>
            </div>

            {/* Instruções detalhadas */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <h3 className="font-semibold text-blue-800 mb-3">Próximos passos:</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Verifique sua caixa de entrada</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Não esqueça de olhar a pasta de spam/lixo eletrônico</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Clique no link &quot;Confirmar Meu Acesso&quot; para entrar no Reuni</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>O link expira em 24 horas por segurança</span>
                </li>
              </ul>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false)
                  setError('')
                }}
                className="w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-medium"
              >
                ← Voltar
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white py-3 rounded-xl font-medium transition-all"
              >
                Entendi, vou verificar meu email
              </button>
            </div>

            {/* Opção de reenvio */}
            <div className="border-t border-neutral-200 pt-4 space-y-3">
              <p className="text-xs text-neutral-500">
                Não recebeu o email? Aguarde alguns minutos e verifique sua pasta de spam.
              </p>
              
              {canResend ? (
                <button
                  onClick={async () => {
                    const result = await resendEmail(email)
                    if (result.error) {
                      setError(result.error)
                    } else {
                      showToast('Email reenviado com sucesso! 📧', 'success')
                    }
                  }}
                  disabled={resending}
                  className="flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Reenviando...' : 'Reenviar email'}
                </button>
              ) : (
                <p className="text-sm text-neutral-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reenviar disponível em {cooldown}s
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Formulário Normal */
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
                Reuni
              </h1>
              <h2 className="text-xl font-semibold text-neutral-800">
                {mode === 'login' ? 'Entrar na sua conta' : 'Criar conta'}
              </h2>
              <p className="text-neutral-600 mt-1">
                {mode === 'login' 
                  ? 'Conecte-se aos seus eventos favoritos' 
                  : 'Cadastro rápido apenas com email'
                }
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
          


          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Senha (apenas no login) */}
          {mode === 'login' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Sua senha"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Informação sobre cadastro apenas com email */}
          {mode === 'signup' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
              <p className="text-sm">
                ✨ <strong>Cadastro sem senha!</strong> Você receberá um link mágico no seu email para fazer login instantaneamente.
              </p>
            </div>
          )}

          {/* Botão principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : (mode === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-neutral-300"></div>
          <span className="px-4 text-neutral-500 text-sm">ou</span>
          <div className="flex-1 border-t border-neutral-300"></div>
        </div>

        {/* Login com Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        {/* Switch entre login/cadastro */}
        <div className="text-center mt-6">
          <p className="text-neutral-600">
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            {' '}
            <button
              onClick={switchMode}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {mode === 'login' ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>

          </>


        )}

      </div>
    </div>
  )
}