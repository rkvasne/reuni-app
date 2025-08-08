/**
 * Testes para os utilitários do middleware
 * Verifica funções auxiliares de verificação de rotas e redirecionamento
 */

import {
  isProtectedRoute,
  isAuthRoute,
  isPublicRoute,
  buildRedirectUrl,
  getRedirectUrl,
  logMiddlewareAction
} from '../../utils/middlewareUtils'

describe('Utilitários do Middleware', () => {
  describe('isProtectedRoute', () => {
    it('deve identificar rotas protegidas corretamente', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true)
      expect(isProtectedRoute('/dashboard/analytics')).toBe(true)
      expect(isProtectedRoute('/profile')).toBe(true)
      expect(isProtectedRoute('/profile/edit')).toBe(true)
      expect(isProtectedRoute('/events/create')).toBe(true)
      expect(isProtectedRoute('/communities/create')).toBe(true)
      expect(isProtectedRoute('/settings')).toBe(true)
      expect(isProtectedRoute('/settings/privacy')).toBe(true)
    })

    it('deve identificar rotas não protegidas corretamente', () => {
      expect(isProtectedRoute('/')).toBe(false)
      expect(isProtectedRoute('/events')).toBe(false)
      expect(isProtectedRoute('/events/123')).toBe(false)
      expect(isProtectedRoute('/communities')).toBe(false)
      expect(isProtectedRoute('/login')).toBe(false)
      expect(isProtectedRoute('/signup')).toBe(false)
    })
  })

  describe('isAuthRoute', () => {
    it('deve identificar rotas de autenticação corretamente', () => {
      expect(isAuthRoute('/login')).toBe(true)
      expect(isAuthRoute('/signup')).toBe(true)
      expect(isAuthRoute('/auth/callback')).toBe(true)
    })

    it('deve identificar rotas não de autenticação corretamente', () => {
      expect(isAuthRoute('/')).toBe(false)
      expect(isAuthRoute('/dashboard')).toBe(false)
      expect(isAuthRoute('/profile')).toBe(false)
      expect(isAuthRoute('/events')).toBe(false)
      expect(isAuthRoute('/auth')).toBe(false)
      expect(isAuthRoute('/auth/profile')).toBe(false)
    })
  })

  describe('isPublicRoute', () => {
    it('deve identificar rotas públicas corretamente', () => {
      expect(isPublicRoute('/')).toBe(true)
      expect(isPublicRoute('/welcome')).toBe(true)
      expect(isPublicRoute('/events')).toBe(true)
      expect(isPublicRoute('/events/123')).toBe(true)
      expect(isPublicRoute('/communities')).toBe(true)
      expect(isPublicRoute('/communities/tech')).toBe(true)
      expect(isPublicRoute('/search')).toBe(true)
      expect(isPublicRoute('/search/events')).toBe(true)
    })

    it('deve identificar rotas estáticas como públicas', () => {
      expect(isPublicRoute('/api/events')).toBe(true)
      expect(isPublicRoute('/_next/static/css/app.css')).toBe(true)
      expect(isPublicRoute('/favicon.ico')).toBe(true)
    })

    it('deve identificar rotas não públicas corretamente', () => {
      expect(isPublicRoute('/dashboard')).toBe(false)
      expect(isPublicRoute('/profile')).toBe(false)
      expect(isPublicRoute('/settings')).toBe(false)
    })
  })

  describe('buildRedirectUrl', () => {
    it('deve construir URL de redirecionamento corretamente', () => {
      const url = buildRedirectUrl('https://localhost:3000', '/dashboard')
      expect(url.toString()).toBe('https://localhost:3000/dashboard')
    })

    it('deve incluir parâmetros de busca quando fornecidos', () => {
      const url = buildRedirectUrl('https://localhost:3000', '/login', '?redirectedFrom=%2Fdashboard')
      expect(url.toString()).toBe('https://localhost:3000/login?redirectedFrom=%2Fdashboard')
    })
  })

  describe('getRedirectUrl', () => {
    it('deve retornar URL de redirecionamento válida', () => {
      const searchParams = new URLSearchParams('redirectedFrom=%2Fdashboard')
      const result = getRedirectUrl(searchParams)
      expect(result).toBe('/dashboard')
    })

    it('deve retornar fallback quando não há parâmetro redirectedFrom', () => {
      const searchParams = new URLSearchParams()
      const result = getRedirectUrl(searchParams, '/home')
      expect(result).toBe('/home')
    })

    it('deve retornar fallback padrão quando não especificado', () => {
      const searchParams = new URLSearchParams()
      const result = getRedirectUrl(searchParams)
      expect(result).toBe('/')
    })

    it('deve rejeitar URLs externas por segurança', () => {
      const searchParams = new URLSearchParams('redirectedFrom=https://malicious.com')
      const result = getRedirectUrl(searchParams)
      expect(result).toBe('/')
    })

    it('deve rejeitar URLs com dupla barra por segurança', () => {
      const searchParams = new URLSearchParams('redirectedFrom=//malicious.com')
      const result = getRedirectUrl(searchParams)
      expect(result).toBe('/')
    })

    it('deve aceitar URLs internas válidas', () => {
      const searchParams = new URLSearchParams('redirectedFrom=%2Fdashboard%2Fanalytics%3Ftab%3Dmetrics')
      const result = getRedirectUrl(searchParams)
      expect(result).toBe('/dashboard/analytics?tab=metrics')
    })
  })

  describe('logMiddlewareAction', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('deve logar em ambiente de desenvolvimento', () => {
      const originalEnv = process.env.NODE_ENV
      ;(process as any).env.NODE_ENV = 'development'

      logMiddlewareAction({
        method: 'GET',
        pathname: '/dashboard',
        hasSession: true,
        userId: 'user-123',
        action: 'allow'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Middleware'),
        expect.objectContaining({
          method: 'GET',
          path: '/dashboard',
          session: 'user:user-123',
          action: 'allow'
        })
      )

      ;(process as any).env.NODE_ENV = originalEnv
    })

    it('não deve logar em ambiente de produção', () => {
      const originalEnv = process.env.NODE_ENV
      ;(process as any).env.NODE_ENV = 'production'

      logMiddlewareAction({
        method: 'GET',
        pathname: '/dashboard',
        hasSession: true,
        userId: 'user-123',
        action: 'allow'
      })

      expect(consoleSpy).not.toHaveBeenCalled()

      ;(process as any).env.NODE_ENV = originalEnv
    })

    it('deve incluir informações de redirecionamento quando aplicável', () => {
      const originalEnv = process.env.NODE_ENV
      ;(process as any).env.NODE_ENV = 'development'

      logMiddlewareAction({
        method: 'GET',
        pathname: '/login',
        hasSession: true,
        action: 'redirect',
        redirectTo: '/dashboard'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Middleware'),
        expect.objectContaining({
          redirectTo: '/dashboard'
        })
      )

      ;(process as any).env.NODE_ENV = originalEnv
    })

    it('deve incluir informações de erro quando aplicável', () => {
      const originalEnv = process.env.NODE_ENV
      ;(process as any).env.NODE_ENV = 'development'

      logMiddlewareAction({
        method: 'GET',
        pathname: '/dashboard',
        hasSession: false,
        action: 'error',
        error: 'Session expired'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Middleware'),
        expect.objectContaining({
          error: 'Session expired'
        })
      )

      ;(process as any).env.NODE_ENV = originalEnv
    })
  })
})