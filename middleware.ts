import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { 
  isProtectedRoute, 
  isAuthRoute, 
  getRedirectUrl, 
  logMiddlewareAction,
  type MiddlewareLogData 
} from './utils/middlewareUtils'

/**
 * Middleware de autenticação server-side para o Reuni
 * Implementa verificação de sessão via Supabase SSR com proteção automática de rotas
 */
export async function middleware(request: NextRequest) {
  // Previne loops RSC (React Server Components)
  if (request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    const logData: MiddlewareLogData = {
      method: request.method,
      pathname: request.nextUrl.pathname,
      hasSession: !!session,
      userId: session?.user?.id,
      action: 'allow'
    }
    
    if (error) {
      logData.error = error.message
    }
    
    const pathname = request.nextUrl.pathname
    const isProtected = isProtectedRoute(pathname)
    const isAuth = isAuthRoute(pathname)
    
    // Redirecionar usuários não autenticados de rotas protegidas
    if (!session && isProtected) {
      const redirectUrl = new URL('/login', request.url)
      // Preservar URL de destino para redirecionamento após login
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname + request.nextUrl.search)
      
      logData.action = 'redirect'
      logData.redirectTo = redirectUrl.pathname
      logMiddlewareAction(logData)
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // Redirecionar usuários autenticados das rotas de autenticação
    if (session && isAuth && pathname !== '/auth/callback') {
      // Verificar se há URL de redirecionamento preservada
      const targetPath = getRedirectUrl(request.nextUrl.searchParams, '/')
      const redirectUrl = new URL(targetPath, request.url)
      
      logData.action = 'redirect'
      logData.redirectTo = redirectUrl.pathname
      logMiddlewareAction(logData)
      
      return NextResponse.redirect(redirectUrl)
    }
    
    logMiddlewareAction(logData)
    return response
    
  } catch (error) {
    // Tratamento de erros com fallback seguro
    const logData: MiddlewareLogData = {
      method: request.method,
      pathname: request.nextUrl.pathname,
      hasSession: false,
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    
    logMiddlewareAction(logData)
    
    // Em caso de erro, permitir acesso para não quebrar a aplicação
    // mas logar o erro para monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Em produção, você pode integrar com serviços de monitoramento
      // como Sentry, LogRocket, etc.
      console.error('[Middleware] Production error:', error)
    }
    
    // Fallback seguro: permitir acesso mas sem cookies de sessão
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

/**
 * Configuração do matcher para definir quais rotas o middleware deve processar
 * Inclui rotas protegidas e rotas de autenticação para redirecionamento inteligente
 */
export const config = {
  matcher: [
    // Rotas protegidas que requerem autenticação
    '/dashboard/:path*',
    '/profile/:path*', 
    '/events/create/:path*',
    '/communities/create/:path*',
    '/settings/:path*',
    
    // Rotas de autenticação para redirecionamento de usuários logados
    '/login',
    '/signup',
    '/auth/callback',
    
    // Excluir arquivos estáticos e API routes que não precisam de middleware
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}