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

    // Buscar perfil completo do usuário na tabela usuarios
    const fetchUserProfile = async () => {
        if (!authUser) {
            setUserProfile(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            console.log('🔍 Buscando perfil do usuário na tabela usuarios...')
            
            // Primeiro, tentar buscar o usuário existente
            const { data: existingUser, error: fetchError } = await supabase
                .from('usuarios')
                .select('id, nome, email, avatar, bio, created_at')
                .eq('id', authUser.id)
                .maybeSingle()

            if (fetchError) {
                console.error('Erro ao buscar usuário:', fetchError)
                setError('Erro ao carregar perfil do usuário')
                return
            }

            if (existingUser) {
                // Usuário já existe na tabela
                console.log('✅ Usuário encontrado na tabela:', existingUser)
                setUserProfile(existingUser)
            } else {
                // Usuário não existe, criar novo registro
                console.log('📝 Usuário não encontrado, criando novo registro...')
                
                const newUserData = {
                    id: authUser.id,
                    nome: authUser.user_metadata?.name || '', // Nome vazio para forçar completar perfil
                    email: authUser.email || '',
                    avatar: authUser.user_metadata?.avatar_url || null,
                    bio: null
                }

                const { data: createdUser, error: createError } = await supabase
                    .from('usuarios')
                    .insert([newUserData])
                    .select('id, nome, email, avatar, bio, created_at')
                    .single()

                if (createError) {
                    console.error('Erro ao criar usuário:', createError)
                    
                    // Se for erro de chave duplicada, tentar buscar novamente
                    if (createError.code === '23505') {
                        console.log('🔄 Chave duplicada, tentando buscar usuário existente...')
                        const { data: retryUser, error: retryError } = await supabase
                            .from('usuarios')
                            .select('id, nome, email, avatar, bio, created_at')
                            .eq('id', authUser.id)
                            .single()
                        
                        if (!retryError && retryUser) {
                            console.log('✅ Usuário encontrado na segunda tentativa:', retryUser)
                            setUserProfile(retryUser)
                            return
                        }
                    }
                    
                    setError('Erro ao criar perfil do usuário')
                    return
                } else {
                    console.log('✅ Usuário criado com sucesso:', createdUser)
                    setUserProfile(createdUser)
                }
            }
        } catch (err: any) {
            console.error('Erro geral ao buscar/criar perfil:', err)
            setError(err.message || 'Erro ao carregar perfil do usuário')
        } finally {
            setLoading(false)
        }
    }

    // Atualizar perfil na tabela usuarios
    const updateProfile = async (updates: Partial<Pick<UserProfile, 'nome' | 'bio' | 'avatar'>>) => {
        if (!authUser || !userProfile) {
            throw new Error('Usuário não autenticado')
        }

        try {
            console.log('💾 Atualizando perfil na tabela usuarios:', updates)
            
            const { data, error } = await supabase
                .from('usuarios')
                .update(updates)
                .eq('id', authUser.id)
                .select('id, nome, email, avatar, bio, created_at')
                .single()

            if (error) {
                console.error('Erro ao atualizar perfil:', error)
                throw error
            }

            console.log('✅ Perfil atualizado com sucesso:', data)
            setUserProfile(data)
            return { data, error: null }
        } catch (err: any) {
            console.error('Erro ao atualizar perfil:', err)
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

    // Verificar se o perfil está completo
    const isProfileComplete = () => {
        if (!userProfile) return false
        return !!(userProfile.nome && userProfile.nome.trim() !== '')
    }

    return {
        userProfile,
        loading,
        error,
        updateProfile,
        refetchProfile: fetchUserProfile,
        clearError: () => setError(null),
        isProfileComplete: isProfileComplete()
    }
}