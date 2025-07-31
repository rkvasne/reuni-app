/**
 * Sistema de cache para eventos
 * Reduz requisições desnecessárias ao Supabase
 */

import type { Event } from '@/hooks/useEvents'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class EventCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    })

    // Limpar cache expirado periodicamente
    this.cleanExpired()
  }

  /**
   * Recupera dados do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Verifica se uma chave existe no cache e não expirou
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Remove uma entrada do cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove entradas expiradas
   */
  private cleanExpired(): void {
    const now = Date.now()
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key)
      }
    })
  }

  /**
   * Gera chave de cache para lista de eventos
   */
  getEventsListKey(page: number, pageSize: number, userId?: string): string {
    return `events:list:${page}:${pageSize}:${userId || 'anonymous'}`
  }

  /**
   * Gera chave de cache para evento específico
   */
  getEventKey(eventId: string): string {
    return `event:${eventId}`
  }

  /**
   * Gera chave de cache para contagem de participantes
   */
  getParticipantsCountKey(eventId: string): string {
    return `participants:count:${eventId}`
  }

  /**
   * Gera chave de cache para participação do usuário
   */
  getUserParticipationKey(eventId: string, userId: string): string {
    return `user:participation:${eventId}:${userId}`
  }

  /**
   * Invalida cache relacionado a um evento específico
   */
  invalidateEvent(eventId: string): void {
    // Remover cache do evento
    this.delete(this.getEventKey(eventId))
    
    // Remover cache de contagem de participantes
    this.delete(this.getParticipantsCountKey(eventId))
    
    // Remover cache de listas que podem conter este evento
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith('events:list:')) {
        this.delete(key)
      }
    })
  }

  /**
   * Invalida cache relacionado a participações
   */
  invalidateParticipations(eventId: string, userId?: string): void {
    // Remover contagem de participantes
    this.delete(this.getParticipantsCountKey(eventId))
    
    // Remover participação do usuário se especificado
    if (userId) {
      this.delete(this.getUserParticipationKey(eventId, userId))
    }
    
    // Remover listas de eventos que podem ter mudado
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith('events:list:')) {
        this.delete(key)
      }
    })
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    size: number
    keys: string[]
    expired: number
  } {
    const now = Date.now()
    let expired = 0
    
    Array.from(this.cache.entries()).forEach(([, entry]) => {
      if (now - entry.timestamp > entry.expiresIn) {
        expired++
      }
    })

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expired
    }
  }
}

// Instância singleton do cache
export const eventCache = new EventCache()

/**
 * Hook para usar cache com React
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Tentar buscar do cache primeiro
      const cachedData = eventCache.get<T>(key)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Se não está no cache, buscar dos dados
      const freshData = await fetcher()
      eventCache.set(key, freshData, ttl)
      setData(freshData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl])

  const refresh = React.useCallback(async () => {
    eventCache.delete(key)
    await fetchData()
  }, [key, fetchData])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refresh }
}

// Importar React para o hook
import React from 'react'