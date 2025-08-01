'use client'

import { useProfileGuard } from '@/hooks/useProfileGuard'
import { ReactNode } from 'react'

interface ProfileGuardProps {
  children: ReactNode
}

export default function ProfileGuard({ children }: ProfileGuardProps) {
  // Aplicar o guard de perfil
  useProfileGuard()

  return <>{children}</>
} 