'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const WelcomeDebug = () => {
  const router = useRouter()
  const { user } = useAuth()

  const handleTestWelcome = () => {
    if (user) {
      // Limpar o localStorage para simular novo usuário
      localStorage.removeItem(`welcome_seen_${user.id}`)
      router.push('/welcome')
    }
  }

  const handleResetWelcome = () => {
    if (user) {
      localStorage.removeItem(`welcome_seen_${user.id}`)
      alert('Flag de boas-vindas resetada. Faça logout e login novamente para testar.')
    }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
      <h3 className="text-sm font-semibold mb-2">Debug - Boas-vindas</h3>
      <div className="space-y-2">
        <button
          onClick={handleTestWelcome}
          className="block w-full text-xs bg-primary-500 text-white px-3 py-1 rounded hover:bg-primary-600"
        >
          Testar Página de Boas-vindas
        </button>
        <button
          onClick={handleResetWelcome}
          className="block w-full text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
        >
          Reset Flag Boas-vindas
        </button>
      </div>
    </div>
  )
}

export default WelcomeDebug