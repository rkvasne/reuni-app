'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './useAuth'
import { useUserProfile } from './useUserProfile'

export function useProfileGuard() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile()
  const router = useRouter()
  const pathname = usePathname()

  // Rotas que não precisam de perfil completo
  const publicRoutes = ['/', '/auth', '/welcome', '/profile/complete', '/profile']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    // Aguardar carregamento completo
    if (authLoading || profileLoading) return

    // Se não estiver autenticado, não fazer nada (deixar o sistema de auth lidar)
    if (!isAuthenticated) return

    // Verificar se o perfil está completo (nome E avatar)
    const isProfileComplete = userProfile && 
      userProfile.nome && 
      userProfile.nome.trim() !== '' && 
      userProfile.avatar && 
      userProfile.avatar.trim() !== ''

    // Se o perfil não estiver completo e não estiver em uma rota pública
    if (!isProfileComplete && !isPublicRoute) {
      router.push('/profile/complete')
      return
    }

    // Se o perfil estiver completo e estiver na página de completar perfil
    if (isProfileComplete && pathname === '/profile/complete') {
      router.push('/')
      return
    }
  }, [authLoading, profileLoading, isAuthenticated, userProfile, pathname, router])

  return {
    isProfileComplete: userProfile && 
      userProfile.nome && 
      userProfile.nome.trim() !== '' && 
      userProfile.avatar && 
      userProfile.avatar.trim() !== '',
    isLoading: authLoading || profileLoading
  }
} 