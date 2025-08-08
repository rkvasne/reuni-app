/**
 * Utilitários para o middleware de autenticação
 * Funções auxiliares para verificação de rotas e tratamento de redirecionamentos
 */

/**
 * Verifica se uma rota é protegida e requer autenticação
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/events/create',
    '/communities/create',
    '/settings'
  ]
  
  // Exceções: páginas que precisam ser acessíveis para usuários autenticados com perfil incompleto
  const exceptions = [
    '/profile/complete'
  ]
  
  // Se é uma exceção, não é considerada protegida
  if (exceptions.some(exception => pathname.startsWith(exception))) {
    return false
  }
  
  return protectedPaths.some(path => pathname.startsWith(path))
}

/**
 * Verifica se uma rota é de autenticação
 */
export function isAuthRoute(pathname: string): boolean {
  const authPaths = ['/login', '/signup', '/auth/callback']
  return authPaths.includes(pathname)
}

/**
 * Verifica se uma rota é pública e não precisa de redirecionamento
 */
export function isPublicRoute(pathname: string): boolean {
  // Primeiro verificar se é uma rota protegida
  if (isProtectedRoute(pathname)) {
    return false
  }
  
  const publicPaths = [
    '/',
    '/welcome',
    '/events',
    '/communities',
    '/search'
  ]
  
  const staticPaths = [
    '/api',
    '/_next',
    '/favicon'
  ]
  
  return publicPaths.some(path => pathname === path || pathname.startsWith(path)) ||
         staticPaths.some(path => pathname.startsWith(path))
}

/**
 * Constrói URL de redirecionamento preservando parâmetros
 */
export function buildRedirectUrl(baseUrl: string, targetPath: string, searchParams?: string): URL {
  const url = new URL(targetPath, baseUrl)
  if (searchParams) {
    url.search = searchParams
  }
  return url
}

/**
 * Extrai e valida URL de redirecionamento dos parâmetros
 */
export function getRedirectUrl(searchParams: URLSearchParams, fallback: string = '/'): string {
  const redirectedFrom = searchParams.get('redirectedFrom')
  
  // Validar se a URL de redirecionamento é segura (não externa)
  if (redirectedFrom && redirectedFrom.startsWith('/') && !redirectedFrom.startsWith('//')) {
    return redirectedFrom
  }
  
  return fallback
}

/**
 * Tipos para logging estruturado do middleware
 */
export interface MiddlewareLogData {
  method: string
  pathname: string
  hasSession: boolean
  userId?: string
  action: 'allow' | 'redirect' | 'error'
  redirectTo?: string
  error?: string
}

/**
 * Logger estruturado para o middleware
 */
export function logMiddlewareAction(data: MiddlewareLogData): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString()
    console.log(`[Middleware ${timestamp}]`, {
      method: data.method,
      path: data.pathname,
      session: data.hasSession ? `user:${data.userId}` : 'anonymous',
      action: data.action,
      ...(data.redirectTo && { redirectTo: data.redirectTo }),
      ...(data.error && { error: data.error })
    })
  }
}