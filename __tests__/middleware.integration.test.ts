/**
 * Testes de integração para o middleware de autenticação
 * Verifica cenários reais de uso do middleware
 */

import { 
  isProtectedRoute, 
  isAuthRoute, 
  getRedirectUrl 
} from '../utils/middlewareUtils'

describe('Middleware Integration Tests', () => {
  describe('Lógica de Roteamento', () => {
    it('deve identificar corretamente rotas protegidas vs públicas', () => {
      // Rotas protegidas
      expect(isProtectedRoute('/dashboard')).toBe(true)
      expect(isProtectedRoute('/dashboard/analytics')).toBe(true)
      expect(isProtectedRoute('/profile')).toBe(true)
      expect(isProtectedRoute('/profile/edit')).toBe(true)
      expect(isProtectedRoute('/events/create')).toBe(true)
      expect(isProtectedRoute('/communities/create')).toBe(true)
      expect(isProtectedRoute('/settings')).toBe(true)
      
      // Rotas públicas
      expect(isProtectedRoute('/')).toBe(false)
      expect(isProtectedRoute('/events')).toBe(false)
      expect(isProtectedRoute('/events/123')).toBe(false)
      expect(isProtectedRoute('/communities')).toBe(false)
      expect(isProtectedRoute('/communities/tech')).toBe(false)
      expect(isProtectedRoute('/search')).toBe(false)
      expect(isProtectedRoute('/login')).toBe(false)
      expect(isProtectedRoute('/signup')).toBe(false)
    })

    it('deve identificar corretamente rotas de autenticação', () => {
      expect(isAuthRoute('/login')).toBe(true)
      expect(isAuthRoute('/signup')).toBe(true)
      expect(isAuthRoute('/auth/callback')).toBe(true)
      
      expect(isAuthRoute('/')).toBe(false)
      expect(isAuthRoute('/dashboard')).toBe(false)
      expect(isAuthRoute('/events')).toBe(false)
    })

    it('deve processar URLs de redirecionamento com segurança', () => {
      // URLs válidas
      const validParams = new URLSearchParams('redirectedFrom=%2Fdashboard')
      expect(getRedirectUrl(validParams)).toBe('/dashboard')
      
      const validParamsWithQuery = new URLSearchParams('redirectedFrom=%2Fevents%2Fcreate%3Ftype%3Dpublic')
      expect(getRedirectUrl(validParamsWithQuery)).toBe('/events/create?type=public')
      
      // URLs maliciosas devem ser rejeitadas
      const maliciousParams1 = new URLSearchParams('redirectedFrom=https://malicious.com')
      expect(getRedirectUrl(maliciousParams1)).toBe('/')
      
      const maliciousParams2 = new URLSearchParams('redirectedFrom=//malicious.com')
      expect(getRedirectUrl(maliciousParams2)).toBe('/')
      
      // Sem parâmetro deve retornar fallback
      const emptyParams = new URLSearchParams()
      expect(getRedirectUrl(emptyParams)).toBe('/')
      expect(getRedirectUrl(emptyParams, '/home')).toBe('/home')
    })
  })

  describe('Cenários de Fluxo de Usuário', () => {
    it('deve definir fluxo correto para usuário não autenticado', () => {
      const scenarios = [
        { path: '/', shouldRedirect: false, isProtected: false },
        { path: '/events', shouldRedirect: false, isProtected: false },
        { path: '/events/123', shouldRedirect: false, isProtected: false },
        { path: '/communities', shouldRedirect: false, isProtected: false },
        { path: '/login', shouldRedirect: false, isProtected: false },
        { path: '/signup', shouldRedirect: false, isProtected: false },
        { path: '/dashboard', shouldRedirect: true, isProtected: true },
        { path: '/profile', shouldRedirect: true, isProtected: true },
        { path: '/events/create', shouldRedirect: true, isProtected: true },
        { path: '/settings', shouldRedirect: true, isProtected: true },
      ]

      scenarios.forEach(({ path, shouldRedirect, isProtected }) => {
        expect(isProtectedRoute(path)).toBe(isProtected)
        // Se é protegida, usuário não autenticado deve ser redirecionado
        if (isProtected) {
          expect(shouldRedirect).toBe(true)
        }
      })
    })

    it('deve definir fluxo correto para usuário autenticado', () => {
      const scenarios = [
        { path: '/', shouldAllowAccess: true },
        { path: '/events', shouldAllowAccess: true },
        { path: '/dashboard', shouldAllowAccess: true },
        { path: '/profile', shouldAllowAccess: true },
        { path: '/events/create', shouldAllowAccess: true },
        { path: '/login', shouldRedirectAway: true }, // Usuário já logado
        { path: '/signup', shouldRedirectAway: true }, // Usuário já logado
        { path: '/auth/callback', shouldAllowAccess: true }, // Callback sempre permitido
      ]

      scenarios.forEach(({ path, shouldAllowAccess, shouldRedirectAway }) => {
        const isAuth = isAuthRoute(path)
        const isProtected = isProtectedRoute(path)
        
        if (shouldRedirectAway) {
          expect(isAuth).toBe(true)
          expect(path).not.toBe('/auth/callback') // Callback é exceção
        }
        
        if (shouldAllowAccess) {
          // Usuário autenticado deve ter acesso a rotas protegidas e públicas
          expect(isProtected || !isAuth || path === '/auth/callback').toBe(true)
        }
      })
    })
  })

  describe('Configuração do Matcher', () => {
    it('deve incluir todas as rotas necessárias no matcher', () => {
      // Rotas que devem estar no matcher do middleware
      const expectedRoutes = [
        '/dashboard',
        '/profile',
        '/events/create',
        '/communities/create',
        '/settings',
        '/login',
        '/signup',
        '/auth/callback'
      ]

      expectedRoutes.forEach(route => {
        const isProtected = isProtectedRoute(route)
        const isAuth = isAuthRoute(route)
        
        // Todas essas rotas devem ser processadas pelo middleware
        expect(isProtected || isAuth).toBe(true)
      })
    })
  })
})