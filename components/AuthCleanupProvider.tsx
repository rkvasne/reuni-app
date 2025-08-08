'use client'

import { useEffect } from 'react'
import { addClearAuthToWindow } from '@/utils/authCleanup'

interface AuthCleanupProviderProps {
  children: React.ReactNode
}

export default function AuthCleanupProvider({ children }: AuthCleanupProviderProps) {
  useEffect(() => {
    // Disponibilizar função de limpeza globalmente
    addClearAuthToWindow()
  }, [])

  return <>{children}</>
}
