/**
 * Testes unitários para o hook useAuth
 * Testa funcionalidades enterprise-grade de autenticação
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }
}))

// Mock dos utilitários de cache
jest.mock('@/utils/authCache', () => ({
  cacheSession: jest.fn(),
  getCachedSession: jest.fn(),
  invalidateUserCache: jest.fn(),
  configureAuthCache: jest.fn()
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup padrão para getSession
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    // Setup padrão para onAuthStateChange
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  describe('Inicialização', () => {
    it('deve inicializar com estado de loading', () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('deve verificar sessão existente na inicialização', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  describe('Login com Email/Senha', () => {
    it('deve fazer login com sucesso', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'password123')
      })

      expect(loginResult.error).toBeNull()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('deve tratar erro de login', async () => {
      const mockError = { message: 'Invalid credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const { result } = renderHook(() => useAuth())

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'wrongpassword')
      })

      expect(loginResult.error).toBe('Invalid credentials')
    })
  })

  describe('Login com Google OAuth', () => {
    it('deve iniciar login com Google', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: 'https://oauth.url' },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      let oauthResult: any
      await act(async () => {
        oauthResult = await result.current.signInWithGoogle()
      })

      expect(oauthResult.error).toBeNull()
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })
  })

  describe('Cadastro com Email', () => {
    it('deve fazer cadastro com magic link', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      let signupResult: any
      await act(async () => {
        signupResult = await result.current.signUpWithEmail('test@example.com')
      })

      expect(signupResult.error).toBeNull()
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: expect.any(String), // Senha temporária gerada
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })
  })

  describe('Logout', () => {
    it('deve fazer logout com sucesso', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Retry e Recuperação', () => {
    it('deve implementar retry automático em caso de erro de rede', async () => {
      // Primeiro falha, depois sucesso
      mockSupabase.auth.signInWithPassword
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
          error: null
        })

      const { result } = renderHook(() => useAuth({ enableRetry: true, maxRetries: 2 }))

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.signIn('test@example.com', 'password123')
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(2)
      expect(loginResult.error).toBeNull()
    })
  })

  describe('Cache de Sessão', () => {
    it('deve usar cache quando habilitado', async () => {
      const { getCachedSession } = require('@/utils/authCache')
      const mockCachedSession = { user: { id: 'cached-user' }, access_token: 'cached-token' }
      
      getCachedSession.mockReturnValue(mockCachedSession)

      const { result } = renderHook(() => useAuth({ enableCache: true }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getCachedSession).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockCachedSession.user)
    })
  })

  describe('Eventos de Autenticação', () => {
    it('deve emitir eventos de login', async () => {
      const mockListener = jest.fn()
      
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.addEventListener('login', mockListener)
      })

      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser, access_token: 'token' } },
        error: null
      })

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      expect(mockListener).toHaveBeenCalledWith({
        type: 'login',
        user: mockUser,
        timestamp: expect.any(Number)
      })
    })
  })

  describe('Métricas e Monitoramento', () => {
    it('deve coletar métricas de autenticação', async () => {
      const { result } = renderHook(() => useAuth({ enableMetrics: true }))

      // Simular algumas operações
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      const metrics = result.current.getMetrics()
      
      expect(metrics).toEqual({
        loginAttempts: expect.any(Number),
        successfulLogins: expect.any(Number),
        failedLogins: expect.any(Number),
        cacheHits: expect.any(Number),
        cacheMisses: expect.any(Number),
        averageResponseTime: expect.any(Number)
      })
    })
  })

  describe('Health Check', () => {
    it('deve verificar saúde da autenticação', async () => {
      const { result } = renderHook(() => useAuth({ enableHealthCheck: true }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const healthStatus = result.current.getHealthStatus()
      
      expect(healthStatus).toEqual({
        status: expect.oneOf(['healthy', 'degraded', 'unhealthy']),
        lastCheck: expect.any(Number),
        responseTime: expect.any(Number),
        consecutiveFailures: expect.any(Number)
      })
    })
  })
})