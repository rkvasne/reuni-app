'use client'

import { useAuth } from '@/hooks/useAuth'
import { useProfileGuard } from '@/hooks/useProfileGuard'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/Header'
import UserProfile from '@/components/UserProfile'

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth()
  const { isLoading: profileLoading } = useProfileGuard()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Reuni
          </h2>
          <p className="text-neutral-600 mt-2">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20">
        <UserProfile />
      </div>
    </div>
  )
}