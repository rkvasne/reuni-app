'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro na autenticação:', error)
          router.push('/?error=auth_error')
          return
        }

        if (data.session) {
          const user = data.session.user
          
          // Verificar se é um novo usuário (criado recentemente)
          const userCreatedAt = new Date(user.created_at)
          const now = new Date()
          const timeDifference = now.getTime() - userCreatedAt.getTime()
          const minutesDifference = timeDifference / (1000 * 60)
          
          // Se o usuário foi criado há menos de 5 minutos, consideramos como novo usuário
          const isNewUser = minutesDifference < 5
          
          // Verificar se já visitou a página de boas-vindas
          const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user.id}`)
          
          if (isNewUser && !hasSeenWelcome) {
            // Marcar que viu a página de boas-vindas
            localStorage.setItem(`welcome_seen_${user.id}`, 'true')
            router.push('/welcome')
          } else {
            // Usuário existente ou que já viu as boas-vindas
            router.push('/')
          }
        } else {
          // Sem sessão, redirecionar para home
          router.push('/')
        }
      } catch (error) {
        console.error('Erro no callback:', error)
        router.push('/?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
          Reuni
        </h2>
        <p className="text-neutral-600 mt-2">Finalizando login...</p>
      </div>
    </div>
  )
}