'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './useAuth'
import { useUserProfile } from './useUserProfile'

export function useProfileGuard() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()
  const lastRedirectRef = useRef<string | null>(null)

  // Rotas que não precisam de perfil completo
  const publicRoutes = ['/auth', '/welcome', '/profile/complete']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    console.log('🛡️ ProfileGuard - Estado:', {
      authLoading,
      profileLoading,
      isAuthenticated,
      pathname,
      isPublicRoute,
      userProfile: userProfile ? { nome: userProfile.nome, hasNome: !!userProfile.nome?.trim() } : null
    })

    // Aguardar carregamento completo - mais rigoroso
    if (authLoading || profileLoading) {
      console.log('⏳ ProfileGuard - Aguardando carregamento...')
      return
    }

    // Se não há userProfile ainda, aguardar (mas não em rotas públicas)
    if (isAuthenticated && !userProfile && !isPublicRoute) {
      console.log('⏳ ProfileGuard - Aguardando userProfile...')
      return
    }

    // Se está em rota pública, não fazer nada (deixar a página funcionar)
    if (isPublicRoute) {
      console.log('✅ ProfileGuard - Em rota pública, não fazendo verificações')
      return
    }

    // Se não estiver autenticado, aguardar um pouco antes de fazer qualquer coisa
    // (pode ser perda temporária de sessão durante atualizações)
    if (!isAuthenticated) {
      console.log('🚫 ProfileGuard - Usuário não autenticado')
      
      // Se não está autenticado e não está em rota pública, aguardar mais tempo
      if (!isPublicRoute) {
        console.log('⚠️ ProfileGuard - Usuário não autenticado em rota privada, aguardando recuperação de sessão...')
        
        // Aguardar um pouco mais para ver se a sessão se recupera
        // (comum após atualizações de perfil)
        return
      }
      return
    }



    // Verificar se o perfil está completo (apenas nome por enquanto)
    const isProfileComplete = userProfile && 
      userProfile.nome && 
      userProfile.nome.trim() !== ''

    // Se o perfil não estiver completo, redirecionar para /profile/complete
    if (!isProfileComplete) {
      // Evitar redirecionamentos repetidos
      if (lastRedirectRef.current !== '/profile/complete') {
        console.log('🔄 ProfileGuard - Redirecionando para /profile/complete (perfil incompleto)')
        lastRedirectRef.current = '/profile/complete'
        router.push('/profile/complete')
      }
      return
    }

    // Se o perfil estiver completo e estiver na página de completar perfil, redirecionar para home
    if (isProfileComplete && pathname === '/profile/complete') {
      // Evitar redirecionamentos repetidos
      if (lastRedirectRef.current !== '/') {
        console.log('🔄 ProfileGuard - Redirecionando para / (perfil completo)')
        lastRedirectRef.current = '/'
        router.push('/')
      }
      return
    }

    // Limpar referência se não há redirecionamento
    lastRedirectRef.current = null
  }, [authLoading, profileLoading, isAuthenticated, userProfile, pathname, router, isPublicRoute])

  return {
    isProfileComplete: userProfile && 
      userProfile.nome && 
      userProfile.nome.trim() !== '',
    isLoading: authLoading || profileLoading
  }
} 