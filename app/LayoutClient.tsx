'use client'

import { NotificationProvider } from '@/components/NotificationContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { userProfile } = useUserProfile()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (userProfile) {
      const nomeInvalido = !userProfile.nome || userProfile.nome === 'Usuário' || userProfile.nome === userProfile.email
      const avatarInvalido = !userProfile.avatar
      const isOnCompleteProfile = pathname.startsWith('/profile/complete')
      if ((nomeInvalido || avatarInvalido) && !isOnCompleteProfile) {
        router.replace('/profile/complete')
      }
    }
  }, [userProfile, pathname, router])

  return <NotificationProvider>{children}</NotificationProvider>
} 