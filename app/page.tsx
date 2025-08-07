'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProfileGuard } from '@/hooks/useProfileGuard'
import LandingPage from '@/components/LandingPage'
import Header from '@/components/Header'
import LeftSidebar from '@/components/LeftSidebar'
import MainFeed from '@/components/MainFeed'
import RightSidebar from '@/components/RightSidebar'
import WelcomeDebug from '@/components/WelcomeDebug'

// Componente do App Principal (para usuários logados)
function AppDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateEvent = () => {
    setShowCreateModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateEvent={handleCreateEvent} />

      <div className="pt-16"> {/* Offset para header fixo */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6">

            {/* Sidebar Esquerda */}
            <div className="lg:col-span-3 hidden lg:block">
              <div className="lg:sticky lg:top-20 lg:h-fit">
                <LeftSidebar onCreateEvent={handleCreateEvent} />
              </div>
            </div>

            {/* Feed Central */}
            <div className="lg:col-span-6">
              <MainFeed 
                showCreateModal={showCreateModal}
                onCloseCreateModal={() => setShowCreateModal(false)}
                onCreateEvent={handleCreateEvent}
              />
            </div>

            {/* Sidebar Direita */}
            <div className="lg:col-span-3 hidden lg:block">
              <div className="lg:sticky lg:top-20 lg:h-fit">
                <RightSidebar />
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Componente de debug - remover em produção */}
      <WelcomeDebug />
    </div>
  )
}

// Loading component
function LoadingScreen() {
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

export default function Home() {
  const { loading, isAuthenticated } = useAuth()
  const { isLoading: profileLoading } = useProfileGuard()

  // Mostrar loading enquanto verifica autenticação e perfil
  if (loading || profileLoading) {
    return <LoadingScreen />
  }

  // Mostrar app se usuário estiver logado
  if (isAuthenticated) {
    return <AppDashboard />
  }

  // Mostrar landing page se usuário não estiver logado
  return <LandingPage />
}