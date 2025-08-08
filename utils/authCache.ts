/**
 * Sistema de Cache Inteligente para Dados de Autenticação
 * 
 * Implementa cache em memória com TTL, invalidação automática
 * e estratégias de fallback para melhorar performance e
 * reduzir chamadas desnecessárias ao Supabase.
 */

import { User } from '@supabase/supabase-js'
import { 
  UserProfile, 
  AuthCache, 
  CacheEntry, 
  HealthCheckResult,
  AUTH_CACHE_KEYS 
} from '@/types/auth'

class AuthCacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutos
  private maxCacheSize = 100
  private enableLogging = false

  /**
   * Cria uma entrada de cache
   */
  private createCacheEntry<T>(data: T, ttl?: number): CacheEntry<T> {
    return {
      data,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
      key: this.generateKey()
    }
  }

  /**
   * Gera chave única para cache
   */
  private generateKey(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Verifica se entrada está expirada
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now()
    const entryTime = entry.timestamp.getTime()
    return (now - entryTime) > entry.ttl
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanExpired(): void {
    const expiredKeys: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => {
      this.cache.delete(key)
      if (this.enableLogging) {
        console.log(`🗑️ Cache: Entrada expirada removida - ${key}`)
      }
    })
  }

  /**
   * Gerencia tamanho do cache
   */
  private manageCacheSize(): void {
    if (this.cache.size <= this.maxCacheSize) return

    // Remover entradas mais antigas
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())
    
    const toRemove = entries.slice(0, entries.length - this.maxCacheSize)
    toRemove.forEach(([key]) => {
      this.cache.delete(key)
      if (this.enableLogging) {
        console.log(`🗑️ Cache: Entrada removida por limite de tamanho - ${key}`)
      }
    })
  }

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cleanExpired()
    this.manageCacheSize()

    const entry = this.createCacheEntry(data, ttl)
    this.cache.set(key, entry)

    if (this.enableLogging) {
      console.log(`💾 Cache: Dados armazenados - ${key}`, {
        dataType: typeof data,
        ttl: entry.ttl,
        expiresAt: new Date(entry.timestamp.getTime() + entry.ttl)
      })
    }
  }

  /**
   * Recupera dados do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      if (this.enableLogging) {
        console.log(`❌ Cache: Miss - ${key}`)
      }
      return null
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      if (this.enableLogging) {
        console.log(`⏰ Cache: Entrada expirada - ${key}`)
      }
      return null
    }

    if (this.enableLogging) {
      console.log(`✅ Cache: Hit - ${key}`)
    }

    return entry.data as T
  }

  /**
   * Verifica se chave existe no cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? !this.isExpired(entry) : false
  }

  /**
   * Remove entrada específica
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted && this.enableLogging) {
      console.log(`🗑️ Cache: Entrada removida manualmente - ${key}`)
    }
    return deleted
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    if (this.enableLogging) {
      console.log(`🧹 Cache: Todas as entradas removidas (${size} itens)`)
    }
  }

  /**
   * Invalida cache por padrão de chave
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      invalidated++
    })

    if (this.enableLogging && invalidated > 0) {
      console.log(`🔄 Cache: ${invalidated} entradas invalidadas por padrão "${pattern}"`)
    }

    return invalidated
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    this.cleanExpired()
    
    const entries = Array.from(this.cache.values())
    const now = Date.now()
    
    return {
      totalEntries: this.cache.size,
      maxSize: this.maxCacheSize,
      utilizationPercent: Math.round((this.cache.size / this.maxCacheSize) * 100),
      averageAge: entries.length > 0 
        ? Math.round(entries.reduce((sum, entry) => 
            sum + (now - entry.timestamp.getTime()), 0) / entries.length)
        : 0,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(e => e.timestamp.getTime()))
        : null,
      newestEntry: entries.length > 0 
        ? Math.max(...entries.map(e => e.timestamp.getTime()))
        : null
    }
  }

  /**
   * Configura opções do cache
   */
  configure(options: {
    defaultTTL?: number
    maxCacheSize?: number
    enableLogging?: boolean
  }): void {
    if (options.defaultTTL !== undefined) {
      this.defaultTTL = options.defaultTTL
    }
    if (options.maxCacheSize !== undefined) {
      this.maxCacheSize = options.maxCacheSize
    }
    if (options.enableLogging !== undefined) {
      this.enableLogging = options.enableLogging
    }

    if (this.enableLogging) {
      console.log('⚙️ Cache: Configuração atualizada', {
        defaultTTL: this.defaultTTL,
        maxCacheSize: this.maxCacheSize,
        enableLogging: this.enableLogging
      })
    }
  }
}

// Instância singleton do cache
const authCache = new AuthCacheManager()

// Funções de conveniência para tipos específicos
export const cacheProfile = (userId: string, profile: UserProfile, ttl?: number): void => {
  authCache.set(`${AUTH_CACHE_KEYS.PROFILE}:${userId}`, profile, ttl)
}

export const getCachedProfile = (userId: string): UserProfile | null => {
  return authCache.get<UserProfile>(`${AUTH_CACHE_KEYS.PROFILE}:${userId}`)
}

export const invalidateProfile = (userId: string): boolean => {
  return authCache.delete(`${AUTH_CACHE_KEYS.PROFILE}:${userId}`)
}

export const cacheSession = (userId: string, user: User, ttl?: number): void => {
  authCache.set(`${AUTH_CACHE_KEYS.SESSION}:${userId}`, user, ttl)
}

export const getCachedSession = (userId: string): User | null => {
  return authCache.get<User>(`${AUTH_CACHE_KEYS.SESSION}:${userId}`)
}

export const cacheHealthCheck = (result: HealthCheckResult, ttl?: number): void => {
  authCache.set(AUTH_CACHE_KEYS.HEALTH, result, ttl)
}

export const getCachedHealthCheck = (): HealthCheckResult | null => {
  return authCache.get<HealthCheckResult>(AUTH_CACHE_KEYS.HEALTH)
}

export const invalidateUserCache = (userId: string): number => {
  return authCache.invalidatePattern(userId)
}

export const clearAuthCache = (): void => {
  authCache.clear()
}

export const getAuthCacheStats = () => {
  return authCache.getStats()
}

export const configureAuthCache = (options: {
  defaultTTL?: number
  maxCacheSize?: number
  enableLogging?: boolean
}): void => {
  authCache.configure(options)
}

export { authCache }