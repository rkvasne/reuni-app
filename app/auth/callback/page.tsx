'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Toast, { useToast } from '@/components/Toast'
import { useState } from 'react'

export default function AuthCallback() {
  const router = useRouter()
  const [showError, setShowError] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          showToast('Erro na autenticação. Tente novamente.', 'error')
          router.push('/?error=auth_error')
          return
        }

        if (data.session) {
          const user = data.session.user

          // Verificar se o usuário já existe na tabela 'usuarios'
          const { data: existingUser, error: userError } = await supabase
            .from('usuarios')
            .select('id')
            .eq('id', user.id)
            .single()

          if (!existingUser) {
            // Criar registro na tabela 'usuarios'
            const { error: insertError } = await supabase
              .from('usuarios')
              .insert([
                {
                  id: user.id,
                  nome: user.user_metadata?.name || user.email,
                  email: user.email,
                  avatar: user.user_metadata?.avatar_url || null,
                  bio: ''
                }
              ])
            if (insertError) {
              // Se falhar, mostra Toast e não libera acesso
              showToast('Erro ao criar seu perfil. Tente novamente ou contate o suporte.', 'error')
              setShowError(true)
              return
            }
          }
          
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
        {showError ? (
          <p className="text-red-600 mt-2 font-semibold">Erro ao criar seu perfil. Tente novamente ou contate o suporte.</p>
        ) : (
          <p className="text-neutral-600 mt-2">Finalizando login...</p>
        )}
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}