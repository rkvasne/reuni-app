/**
 * Script para testar o middleware de autenticação manualmente
 * Simula diferentes cenários de requisições e verifica o comportamento
 */

// Implementação inline das funções para teste
function isProtectedRoute(pathname) {
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/events/create',
    '/communities/create',
    '/settings'
  ]
  
  return protectedPaths.some(path => pathname.startsWith(path))
}

function isAuthRoute(pathname) {
  const authPaths = ['/login', '/signup', '/auth/callback']
  return authPaths.includes(pathname)
}

function getRedirectUrl(searchParams, fallback = '/') {
  const redirectedFrom = searchParams.get('redirectedFrom')
  
  // Validar se a URL de redirecionamento é segura (não externa)
  if (redirectedFrom && redirectedFrom.startsWith('/') && !redirectedFrom.startsWith('//')) {
    return redirectedFrom
  }
  
  return fallback
}

console.log('🧪 Testando Middleware de Autenticação\n')

// Teste 1: Rotas Protegidas
console.log('📋 Teste 1: Identificação de Rotas Protegidas')
const protectedRoutes = [
  '/dashboard',
  '/dashboard/analytics',
  '/profile',
  '/profile/edit',
  '/events/create',
  '/communities/create',
  '/settings',
  '/settings/privacy'
]

protectedRoutes.forEach(route => {
  const result = isProtectedRoute(route)
  console.log(`  ${result ? '✅' : '❌'} ${route} -> ${result ? 'PROTEGIDA' : 'PÚBLICA'}`)
})

// Teste 2: Rotas Públicas
console.log('\n📋 Teste 2: Identificação de Rotas Públicas')
const publicRoutes = [
  '/',
  '/events',
  '/events/123',
  '/communities',
  '/communities/tech',
  '/search',
  '/search/events'
]

publicRoutes.forEach(route => {
  const result = isProtectedRoute(route)
  console.log(`  ${!result ? '✅' : '❌'} ${route} -> ${!result ? 'PÚBLICA' : 'PROTEGIDA'}`)
})

// Teste 3: Rotas de Autenticação
console.log('\n📋 Teste 3: Identificação de Rotas de Autenticação')
const authRoutes = [
  { path: '/login', expected: true },
  { path: '/signup', expected: true },
  { path: '/auth/callback', expected: true },
  { path: '/', expected: false },
  { path: '/dashboard', expected: false }
]

authRoutes.forEach(({ path, expected }) => {
  const result = isAuthRoute(path)
  console.log(`  ${result === expected ? '✅' : '❌'} ${path} -> ${result ? 'AUTH' : 'NÃO-AUTH'}`)
})

// Teste 4: URLs de Redirecionamento
console.log('\n📋 Teste 4: Processamento de URLs de Redirecionamento')
const redirectTests = [
  {
    name: 'URL válida simples',
    params: 'redirectedFrom=%2Fdashboard',
    expected: '/dashboard'
  },
  {
    name: 'URL válida com query params',
    params: 'redirectedFrom=%2Fevents%2Fcreate%3Ftype%3Dpublic',
    expected: '/events/create?type=public'
  },
  {
    name: 'URL maliciosa (externa)',
    params: 'redirectedFrom=https://malicious.com',
    expected: '/'
  },
  {
    name: 'URL maliciosa (dupla barra)',
    params: 'redirectedFrom=//malicious.com',
    expected: '/'
  },
  {
    name: 'Sem parâmetro',
    params: '',
    expected: '/'
  }
]

redirectTests.forEach(({ name, params, expected }) => {
  const searchParams = new URLSearchParams(params)
  const result = getRedirectUrl(searchParams)
  const success = result === expected
  console.log(`  ${success ? '✅' : '❌'} ${name}: ${result} ${success ? '' : `(esperado: ${expected})`}`)
})

// Teste 5: Cenários de Fluxo Completo
console.log('\n📋 Teste 5: Cenários de Fluxo Completo')

const scenarios = [
  {
    name: 'Usuário não autenticado acessa rota protegida',
    path: '/dashboard',
    authenticated: false,
    expectedAction: 'REDIRECT_TO_LOGIN'
  },
  {
    name: 'Usuário não autenticado acessa rota pública',
    path: '/events',
    authenticated: false,
    expectedAction: 'ALLOW'
  },
  {
    name: 'Usuário autenticado acessa rota protegida',
    path: '/dashboard',
    authenticated: true,
    expectedAction: 'ALLOW'
  },
  {
    name: 'Usuário autenticado acessa login',
    path: '/login',
    authenticated: true,
    expectedAction: 'REDIRECT_TO_HOME'
  },
  {
    name: 'Usuário autenticado acessa callback',
    path: '/auth/callback',
    authenticated: true,
    expectedAction: 'ALLOW'
  }
]

scenarios.forEach(({ name, path, authenticated, expectedAction }) => {
  const isProtected = isProtectedRoute(path)
  const isAuth = isAuthRoute(path)
  
  let actualAction = 'ALLOW'
  
  if (!authenticated && isProtected) {
    actualAction = 'REDIRECT_TO_LOGIN'
  } else if (authenticated && isAuth && path !== '/auth/callback') {
    actualAction = 'REDIRECT_TO_HOME'
  }
  
  const success = actualAction === expectedAction
  console.log(`  ${success ? '✅' : '❌'} ${name}`)
  console.log(`      Rota: ${path} | Auth: ${authenticated} | Ação: ${actualAction}`)
  if (!success) {
    console.log(`      ❌ Esperado: ${expectedAction}`)
  }
})

console.log('\n🎉 Teste do middleware concluído!')

// Verificar se todas as variáveis de ambiente necessárias estão definidas
console.log('\n📋 Verificação de Variáveis de Ambiente')
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  console.log(`  ${value ? '✅' : '❌'} ${envVar}: ${value ? 'DEFINIDA' : 'NÃO DEFINIDA'}`)
})

if (requiredEnvVars.some(envVar => !process.env[envVar])) {
  console.log('\n⚠️  Algumas variáveis de ambiente estão faltando.')
  console.log('   Certifique-se de ter um arquivo .env.local com as configurações do Supabase.')
}