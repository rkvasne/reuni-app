'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface UserProfile {
    id: string
    nome: string
    email: string
    avatar?: string
    bio?: string
    created_at: string
}

export function useUserProfile() {
    const { user: authUser, isAuthenticated } = useAuth()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Buscar perfil completo do usuário
    const fetchUserProfile = async () => {
        if (!authUser) {
            setUserProfile(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('usuarios')
                .select('id, nome, email, avatar, bio, created_at')
                .eq('id', authUser.id)
                .single()

            if (fetchError) {
                // Se usuário não existe na tabela usuarios, criar
                if (fetchError.code === 'PGRST116') {
                    const newUser = {
                        id: authUser.id,
                        nome: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
                        email: authUser.email || '',
                        avatar: authUser.user_metadata?.avatar_url || undefined,
                        bio: undefined
                    }

                    const { data: createdUser, error: createError } = await supabase
                        .from('usuarios')
                        .insert([newUser])
                        .select('id, nome, email, avatar, bio, created_at')
                        .single()

                    if (createError) {
                        console.error('Erro ao criar usuário:', createError)
                        // Se falhar por RLS, criar um perfil básico local
                        const basicProfile: UserProfile = {
                            id: authUser.id,
                            nome: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
                            email: authUser.email || '',
                            avatar: authUser.user_metadata?.avatar_url || undefined,
                            bio: undefined,
                            created_at: new Date().toISOString()
                        }
                        setUserProfile(basicProfile)
                        setError('Perfil criado localmente. Configure o RLS no Supabase para persistir dados.')
                    } else {
                        setUserProfile(createdUser)
                    }
                } else {
                    throw fetchError
                }
            } else {
                setUserProfile(data)
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar perfil do usuário')
            console.error('Erro ao buscar perfil:', err)
        } finally {
            setLoading(false)
        }
    }

    // Atualizar perfil
    const updateProfile = async (updates: Partial<Pick<UserProfile, 'nome' | 'bio' | 'avatar'>>) => {
        if (!authUser || !userProfile) {
            throw new Error('Usuário não autenticado')
        }

        try {
            const { data, error } = await supabase
                .from('usuarios')
                .update(updates)
                .eq('id', authUser.id)
                .select('id, nome, email, avatar, bio, created_at')
                .single()

            if (error) throw error

            setUserProfile(data)
            return { data, error: null }
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao atualizar perfil'
            return { data: null, error: errorMessage }
        }
    }

    // Carregar perfil quando usuário muda
    useEffect(() => {
        if (isAuthenticated && authUser) {
            fetchUserProfile()
        } else {
            setUserProfile(null)
            setLoading(false)
        }
    }, [authUser?.id, isAuthenticated])

    return {
        userProfile,
        loading,
        error,
        updateProfile,
        refetchProfile: fetchUserProfile,
        clearError: () => setError(null)
    }
}