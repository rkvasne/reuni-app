/**
 * Callback de Autenticação Simplificado
 * 
 * Processa callback do Supabase e redireciona o usuário
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isNewUser } from '@/utils/onboardingUtils'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processando login...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Verificando autenticação...')
        
        // Processar callback do Supabase
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro no callback:', error)
          setStatus('Erro no login. Redirecionando...')
          setTimeout(() => router.push('/'), 3000)
          return
        }

        if (data.session?.user) {
          setStatus('Login realizado! Verificando perfil...')
          
          // Verificar se precisa completar perfil
          const { data: profile } = await supabase
            .from('usuarios')
            .select('nome, avatar')
            .eq('id', data.session.user.id)
            .single()

          // Criar perfil se não existir
          if (!profile) {
            const { error: createError } = await supabase
              .from('usuarios')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email,
                nome: data.session.user.user_metadata?.full_name || '',
                avatar: data.session.user.user_metadata?.avatar_url || null
              })

            if (createError) {
              console.error('Erro ao criar perfil:', createError)
            }
          }

          // Determinar redirecionamento
          const returnTo = searchParams.get('returnTo')
          
          // Verificar se perfil está completo (nome E avatar)
          const isProfileIncomplete = !profile?.nome || !profile?.avatar
          
          if (isProfileIncomplete) {
            setStatus('Redirecionando para completar perfil...')
            router.push('/profile/complete')
          } else if (isNewUser(data.session.user)) {
            setStatus('Redirecionando para boas-vindas...')
            router.push('/welcome')
          } else if (returnTo && returnTo.startsWith('/')) {
            setStatus('Redirecionando...')
            router.push(returnTo)
          } else {
            setStatus('Redirecionando para página inicial...')
            router.push('/')
          }
        } else {
          setStatus('Sessão não encontrada. Redirecionando...')
          router.push('/')
        }
      } catch (err) {
        console.error('Erro no callback:', err)
        setStatus('Erro inesperado. Redirecionando...')
        setTimeout(() => router.push('/'), 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
          Reuni
        </h2>
        <p className="text-neutral-600">{status}</p>
      </div>
    </div>
  )
}