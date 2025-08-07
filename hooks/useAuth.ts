'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // Se há erro de refresh token, limpar sessão silenciosamente
          if (error.message.includes('refresh') || error.message.includes('token') || error.message.includes('Invalid')) {
            // Limpar tokens do localStorage também
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('supabase.auth.token')
              window.localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
            }
            await supabase.auth.signOut({ scope: 'local' })
            setUser(null)
          } else {
            console.warn('Erro ao obter sessão:', error.message)
          }
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        // Limpar sessão em caso de erro crítico
        await supabase.auth.signOut({ scope: 'local' })
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth State Change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        })
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token atualizado com sucesso')
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário desconectado')
        } else if (event === 'SIGNED_IN') {
          console.log('👤 Usuário conectado')
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  // Cadastro com email e confirmação
  const signUpWithEmail = async (email: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'temp-password-' + Math.random().toString(36), // Senha temporária
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  return {
    user,
    loading,
    signIn,
    signUpWithEmail,
    signOut,
    signInWithGoogle,
    isAuthenticated: !!user
  }
}