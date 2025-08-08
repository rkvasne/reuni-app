'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import {
  AuthHookOptions,
  DEFAULT_AUTH_OPTIONS,
  SyncResult,
  SyncStatus,
  UserProfile
} from '@/types/auth'

interface UseUserSyncReturn {
  // Estado principal
  profile: UserProfile | null
  syncStatus: SyncStatus

  // Flags de conveniência
  isSyncing: boolean
  isLoading: boolean
  isError: boolean
  error: string | null
  lastSync: Date | null
  needsRecovery: boolean
  isConsistent: boolean

  // Ações
  syncUser: () => Promise<SyncResult>
  forceSync: () => Promise<SyncResult>
  needsSync: () => boolean
}

export function useUserSync(options: Partial<AuthHookOptions> = {}): UseUserSyncReturn {
  const opts = { ...DEFAULT_AUTH_OPTIONS, ...options }
  const { user } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<SyncStatus>({
    isLoading: false,
    isError: false,
    error: null,
    lastSync: null,
    syncAttempts: 0,
    needsRecovery: false,
    isConsistent: false
  })

  const hasSyncedOnceRef = useRef(false)

  // Sanitiza dados vindos do auth antes de persistir
  const buildUpsertPayloadFromAuth = useCallback((): Record<string, any> | null => {
    if (!user) return null
    const metadata = user.user_metadata || {}

    const rawName: string | null = metadata.full_name || metadata.name || null
    const emailLocalPart = (user.email || '').split('@')[0] || 'Usuario'
    const candidateName = typeof rawName === 'string' ? rawName.trim() : ''
    const name = candidateName && candidateName.length >= 2 ? candidateName : emailLocalPart

    const payload: any = {
      id: user.id,
      email: user.email ?? null,
    }

    payload.nome = name
    if (metadata.avatar_url) payload.avatar = metadata.avatar_url

    return payload
  }, [user])

  const buildProfileFromAuth = useCallback((): Partial<UserProfile> | null => {
    if (!user) return null
    const metadata = user.user_metadata || {}
    const rawName: string | null = metadata.full_name || metadata.name || null
    const name = typeof rawName === 'string' && rawName.trim().length >= 2 ? rawName.trim() : null
    return {
      id: user.id,
      email: user.email ?? null,
      nome: name,
      avatar_url: metadata.avatar_url || null,
      bio: null,
      cidade: null,
      data_nascimento: null
    }
  }, [user])

  const computeConsistency = useCallback(
    (authUser: typeof user, currentProfile: UserProfile | null): boolean => {
      if (!authUser) return false
      if (!currentProfile) return false
      const emailMatches = (authUser.email || null) === (currentProfile.email || null)
      return Boolean(emailMatches)
    },
    []
  )

  const upsertProfile = useCallback(async (): Promise<SyncResult> => {
    if (!user) {
      return { success: false, profile: null, error: 'Usuário não autenticado', action: 'none' }
    }

    try {
      // Upsert atômico para criar/atualizar em uma chamada
      const payload = buildUpsertPayloadFromAuth()
      if (!payload) throw new Error('Dados insuficientes para sincronizar perfil')

      const { data, error } = await supabase
        .from('usuarios')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single()

      if (error) throw error

      const mapped: UserProfile = {
        ...(data as any),
        avatar_url: (data as any).avatar ?? (data as any).avatar_url ?? null
      }

      return { success: true, profile: mapped, error: null, action: 'updated' }
    } catch (err: any) {
      return { success: false, profile: null, error: err.message || 'Erro na sincronização', action: 'none' }
    }
  }, [user, buildUpsertPayloadFromAuth])

  const runSync = useCallback(async (): Promise<SyncResult> => {
    setStatus(prevStatus => ({ 
      ...prevStatus, 
      isLoading: true, 
      isError: false, 
      error: null, 
      syncAttempts: prevStatus.syncAttempts + 1 
    }))

    const result = await upsertProfile()

    setStatus(prevStatus => ({
      ...prevStatus,
      isLoading: false,
      isError: !result.success,
      error: result.success ? null : result.error,
      lastSync: new Date(),
      needsRecovery: !result.success,
      isConsistent: computeConsistency(user, result.profile)
    }))

    if (result.success) {
      setProfile(result.profile)
    }

    return result
  }, [upsertProfile, computeConsistency, user])

  const syncUser = useCallback(async (): Promise<SyncResult> => {
    return runSync()
  }, [runSync])

  const forceSync = useCallback(async (): Promise<SyncResult> => {
    // Força uma atualização mesmo que nada aparente ter mudado, chamando o mesmo fluxo
    return runSync()
  }, [runSync])

  const needsSync = useCallback((): boolean => {
    if (!user) return false
    if (!profile) return true
    return (user.email || null) !== (profile.email || null)
  }, [user, profile])

  // Auto-sync na primeira vez que usuário estiver disponível
  useEffect(() => {
    if (!opts.autoSync) return
    if (!user) return
    if (hasSyncedOnceRef.current) return
    hasSyncedOnceRef.current = true
    runSync()
  }, [opts.autoSync, user, runSync])

  const value: UseUserSyncReturn = useMemo(() => ({
    profile,
    syncStatus: status,
    isSyncing: status.isLoading,
    isLoading: status.isLoading,
    isError: status.isError,
    error: status.error,
    lastSync: status.lastSync,
    needsRecovery: status.needsRecovery,
    isConsistent: status.isConsistent,
    syncUser,
    forceSync,
    needsSync
  }), [profile, status, syncUser, forceSync, needsSync])

  return value
}

export default useUserSync


