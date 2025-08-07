/**
 * Hook de Perfil de Usuário Enterprise-Grade
 * 
 * Hook refatorado com sincronização automática,
 * cache inteligente, validação de dados e
 * recuperação automática de inconsistências.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useUserSync } from './useUserSync'
import { 
  UserProfile, 
  ProfileState, 
  ProfileUpdateResult,
  AuthHookOptions,
  DEFAULT_AUTH_OPTIONS
} from '@/types/auth'
import { 
  cacheProfile, 
  getCachedProfile, 
  invalidateProfile 
} from '@/utils/authCache'

interface ProfileValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  completeness: number
}

export function useUserProfile(options: Partial<AuthHookOptions> = {}) {
  const opts = { ...DEFAULT_AUTH_OPTIONS, ...options }
  const { user: authUser, isAuthenticated, addEventListener } = useAuth()
  const { profile: syncedProfile, syncUser, isLoading: syncLoading } = useUserSync({
    autoSync: opts.autoSync,
    enableLogging: opts.enableLogging
  })
  
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: true,
    error: null,
    isComplete: false,
    lastSync: null
  })

  const [validation, setValidation] = useState<ProfileValidation>({
    isValid: true,
    errors: [],
    warnings: [],
    completeness: 0
  })

  const lastUpdateRef = useRef<Date | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Valida dados do perfil
   */
  const validateProfile = useCallback((profile: UserProfile | null): ProfileValidation => {
    if (!profile) {
      return {
        isValid: false,
        errors: ['Perfil não encontrado'],
        warnings: [],
        completeness: 0
      }
    }

    const errors: string[] = []
    const warnings: string[] = []
    let completeness = 0
    const totalFields = 6 // id, nome, email, avatar_url, bio, cidade

    // Validações obrigatórias
    if (!profile.id) errors.push('ID é obrigatório')
    else completeness += 1

    if (!profile.email) errors.push('Email é obrigatório')
    else completeness += 1

    // Validações recomendadas
    if (!profile.nome || profile.nome.trim() === '') {
      warnings.push('Nome não preenchido')
    } else {
      completeness += 1
    }

    if (!profile.avatar_url) {
      warnings.push('Avatar não definido')
    } else {
      completeness += 1
    }

    if (!profile.bio) {
      warnings.push('Bio não preenchida')
    } else {
      completeness += 1
    }

    if (!profile.cidade) {
      warnings.push('Cidade não preenchida')
    } else {
      completeness += 1
    }

    // Validações de formato
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.push('Email em formato inválido')
    }

    if (profile.nome && profile.nome.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness: Math.round((completeness / totalFields) * 100)
    }
  }, [])

  /**
   * Busca perfil com cache e fallback
   */
  const fetchProfile = useCallback(async (useCache = true): Promise<UserProfile | null> => {
    if (!authUser) return null

    try {
      // Verificar cache primeiro
      if (useCache && opts.enableCache) {
        const cached = getCachedProfile(authUser.id)
        if (cached) {
          if (opts.enableLogging) {
            console.log('🎯 Profile: Usando perfil em cache')
          }
          return cached
        }
      }

      if (opts.enableLogging) {
        console.log('🔍 Profile: Buscando perfil no banco de dados')
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Perfil não existe, será criado pela sincronização
          return null
        }
        throw error
      }

      // Cache do resultado
      if (opts.enableCache) {
        cacheProfile(authUser.id, data, opts.cacheTimeout)
      }

      return data
    } catch (error: any) {
      if (opts.enableLogging) {
        console.error('Erro ao buscar perfil:', error)
      }
      throw error
    }
  }, [authUser, opts.enableCache, opts.enableLogging, opts.cacheTimeout])

  /**
   * Atualiza perfil com validação e cache
   */
  const updateProfile = useCallback(async (
    updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ProfileUpdateResult> => {
    if (!authUser || !state.profile) {
      return {
        success: false,
        profile: null,
        error: 'Usuário não autenticado ou perfil não carregado'
      }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Validar updates
      const updatedProfile = { ...state.profile, ...updates }
      const validation = validateProfile(updatedProfile)
      
      if (!validation.isValid) {
        return {
          success: false,
          profile: null,
          error: `Dados inválidos: ${validation.errors.join(', ')}`
        }
      }

      if (opts.enableLogging) {
        console.log('💾 Profile: Atualizando perfil', updates)
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', authUser.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      // Atualizar estado e cache
      setState(prev => ({
        ...prev,
        profile: data,
        isLoading: false,
        lastSync: new Date()
      }))

      if (opts.enableCache) {
        cacheProfile(authUser.id, data, opts.cacheTimeout)
      }

      lastUpdateRef.current = new Date()

      if (opts.enableLogging) {
        console.log('✅ Profile: Perfil atualizado com sucesso')
      }

      return {
        success: true,
        profile: data,
        error: null
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao atualizar perfil'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))

      if (opts.enableLogging) {
        console.error('❌ Profile: Erro ao atualizar perfil:', error)
      }

      return {
        success: false,
        profile: state.profile,
        error: errorMessage
      }
    }
  }, [authUser, state.profile, opts.enableCache, opts.enableLogging, opts.cacheTimeout, validateProfile])

  /**
   * Força refresh do perfil
   */
  const refreshProfile = useCallback(async (): Promise<ProfileUpdateResult> => {
    if (!authUser) {
      return {
        success: false,
        profile: null,
        error: 'Usuário não autenticado'
      }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Invalidar cache
      invalidateProfile(authUser.id)

      // Buscar perfil atualizado
      const profile = await fetchProfile(false)
      
      if (!profile) {
        // Se não existe, forçar sincronização
        const syncResult = await syncUser()
        if (syncResult.success && syncResult.profile) {
          setState(prev => ({
            ...prev,
            profile: syncResult.profile,
            isLoading: false,
            lastSync: new Date()
          }))
          
          return {
            success: true,
            profile: syncResult.profile,
            error: null
          }
        } else {
          throw new Error(syncResult.error || 'Erro na sincronização')
        }
      }

      setState(prev => ({
        ...prev,
        profile,
        isLoading: false,
        lastSync: new Date()
      }))

      return {
        success: true,
        profile,
        error: null
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao atualizar perfil'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))

      return {
        success: false,
        profile: state.profile,
        error: errorMessage
      }
    }
  }, [authUser, fetchProfile, syncUser, state.profile])

  /**
   * Verifica se perfil está completo
   */
  const checkCompleteness = useCallback((profile: UserProfile | null): boolean => {
    if (!profile) return false
    
    // Campos obrigatórios para perfil completo
    const requiredFields = ['nome', 'email']
    
    return requiredFields.every(field => {
      const value = profile[field as keyof UserProfile]
      return value && String(value).trim() !== ''
    })
  }, [])

  /**
   * Sincroniza com dados do auth quando necessário
   */
  useEffect(() => {
    if (syncedProfile && (!state.profile || syncedProfile.updated_at !== state.profile.updated_at)) {
      setState(prev => ({
        ...prev,
        profile: syncedProfile,
        isLoading: false,
        lastSync: new Date()
      }))
    }
  }, [syncedProfile, state.profile])

  /**
   * Atualiza validação quando perfil muda
   */
  useEffect(() => {
    const newValidation = validateProfile(state.profile)
    setValidation(newValidation)
    
    setState(prev => ({
      ...prev,
      isComplete: checkCompleteness(state.profile)
    }))
  }, [state.profile, validateProfile, checkCompleteness])

  /**
   * Listener para eventos de auth
   */
  useEffect(() => {
    const listenerId = addEventListener('USER_UPDATED', (eventData) => {
      if (eventData.user && state.profile) {
        // Verificar se dados do auth mudaram
        const needsUpdate = 
          eventData.user.email !== state.profile.email ||
          eventData.user.user_metadata?.avatar_url !== state.profile.avatar_url

        if (needsUpdate) {
          if (opts.enableLogging) {
            console.log('🔄 Profile: Dados do auth mudaram, sincronizando...')
          }
          
          // Debounce para evitar múltiplas atualizações
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }
          
          updateTimeoutRef.current = setTimeout(() => {
            refreshProfile()
          }, 1000)
        }
      }
    })

    return () => {
      removeEventListener(listenerId)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [addEventListener, state.profile, opts.enableLogging, refreshProfile])

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Estado principal
    profile: state.profile,
    isLoading: state.isLoading || syncLoading,
    error: state.error,
    isComplete: state.isComplete,
    lastSync: state.lastSync,
    
    // Validação
    validation,
    
    // Funções
    updateProfile,
    refreshProfile,
    fetchProfile,
    
    // Utilitários
    validateProfile,
    clearError: () => setState(prev => ({ ...prev, error: null })),
    
    // Estado derivado
    isProfileComplete: state.isComplete,
    hasProfile: !!state.profile,
    needsCompletion: !state.isComplete && !!state.profile,
    completenessPercent: validation.completeness,
    hasErrors: validation.errors.length > 0,
    hasWarnings: validation.warnings.length > 0,
    lastUpdate: lastUpdateRef.current
  }
}