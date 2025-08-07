/**
 * Tipos centralizados para sistema de autenticação enterprise-grade
 */

import { User } from '@supabase/supabase-js'

// Interfaces de dados
export interface UserProfile {
  id: string
  nome: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  cidade: string | null
  data_nascimento: string | null
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
}

export interface ProfileState {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  isComplete: boolean
  lastSync: Date | null
}

export interface SyncStatus {
  isLoading: boolean
  isError: boolean
  error: string | null
  lastSync: Date | null
  syncAttempts: number
  needsRecovery: boolean
  isConsistent: boolean
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    auth: boolean
    database: boolean
    profile: boolean
    sync: boolean
  }
  responseTime: number
  timestamp: Date
  errors: string[]
}

export interface CacheEntry<T> {
  data: T
  timestamp: Date
  ttl: number
  key: string
}

export interface AuthCache {
  profile: CacheEntry<UserProfile> | null
  session: CacheEntry<User> | null
  healthCheck: CacheEntry<HealthCheckResult> | null
}

// Tipos de eventos
export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT' 
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PROFILE_SYNCED'
  | 'SYNC_ERROR'
  | 'HEALTH_CHECK'

export interface AuthEventData {
  event: AuthEvent
  user?: User | null
  profile?: UserProfile | null
  error?: string
  metadata?: Record<string, any>
  timestamp: Date
}

// Opções de configuração
export interface AuthHookOptions {
  autoSync?: boolean
  enableCache?: boolean
  cacheTimeout?: number
  retryAttempts?: number
  retryDelay?: number
  enableLogging?: boolean
  healthCheckInterval?: number
}

export interface ProfileGuardOptions {
  requiredFields?: (keyof UserProfile)[]
  redirectTo?: string
  allowIncomplete?: boolean
  enableLogging?: boolean
}

// Tipos de resultado
export interface SyncResult {
  success: boolean
  profile: UserProfile | null
  error: string | null
  action: 'created' | 'updated' | 'recovered' | 'cached' | 'none'
  fromCache?: boolean
}

export interface AuthResult {
  success: boolean
  user: User | null
  error: string | null
  requiresVerification?: boolean
}

export interface ProfileUpdateResult {
  success: boolean
  profile: UserProfile | null
  error: string | null
  cached?: boolean
}

// Tipos utilitários
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
export type ProfileStatus = 'loading' | 'complete' | 'incomplete' | 'error'
export type SyncAction = 'create' | 'update' | 'recover' | 'validate' | 'cache'

// Constantes
export const AUTH_CACHE_KEYS = {
  PROFILE: 'auth:profile',
  SESSION: 'auth:session',
  HEALTH: 'auth:health'
} as const

export const DEFAULT_AUTH_OPTIONS: Required<AuthHookOptions> = {
  autoSync: true,
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
  retryAttempts: 3,
  retryDelay: 1000,
  enableLogging: true,
  healthCheckInterval: 30 * 1000 // 30 segundos
}

export const DEFAULT_PROFILE_GUARD_OPTIONS: Required<ProfileGuardOptions> = {
  requiredFields: ['nome'],
  redirectTo: '/profile/complete',
  allowIncomplete: false,
  enableLogging: true
}