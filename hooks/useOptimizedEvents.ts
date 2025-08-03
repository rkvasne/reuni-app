'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Event } from './useEvents'

interface UseOptimizedEventsOptions {
  pageSize?: number
  enableInfiniteScroll?: boolean
}

// Chave para sessionStorage
const STORAGE_KEY = 'reuni_events_state'

interface StoredEventsState {
  events: Event[]
  currentPage: number
  hasMore: boolean
  timestamp: number
}

export function useOptimizedEvents(options: UseOptimizedEventsOptions = {}) {
  const { pageSize = 12, enableInfiniteScroll = true } = options
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const { user } = useAuth()

  // Carregar estado persistido
  const loadPersistedState = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const state: StoredEventsState = JSON.parse(stored)
        // Verificar se o estado não é muito antigo (menos de 30 minutos)
        const isRecent = Date.now() - state.timestamp < 30 * 60 * 1000
        if (isRecent && state.events.length > 0) {
          setEvents(state.events)
          setCurrentPage(state.currentPage)
          setHasMore(state.hasMore)
          setLoading(false)
          return true
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar estado persistido:', error)
    }
    return false
  }, [])

  // Salvar estado atual
  const savePersistedState = useCallback((currentEvents: Event[], page: number, more: boolean) => {
    try {
      const state: StoredEventsState = {
        events: currentEvents,
        currentPage: page,
        hasMore: more,
        timestamp: Date.now()
      }
      // Usar requestIdleCallback para operações não críticas
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        })
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }
    } catch (error) {
      console.warn('Erro ao salvar estado persistido:', error)
    }
  }, [])

  // Limpar estado persistido
  const clearPersistedState = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Erro ao limpar estado persistido:', error)
    }
  }, [])

  // Buscar eventos otimizado com uma única query
  const fetchEvents = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (page === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const from = page * pageSize
      const to = from + pageSize - 1

      // Query ultra-otimizada: buscar apenas eventos básicos sem joins
      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select(`
          id,
          titulo,
          local,
          data,
          hora,
          cidade,
          categoria,
          imagem_url,
          organizador_id,
          max_participantes,
          created_at
        `)
        .order('data', { ascending: true })
        .range(from, to)

      if (eventsError) throw eventsError

      // Buscar dados dos organizadores em query separada
      const organizadorIds = Array.from(new Set((eventsData || []).map(event => event.organizador_id)))
      let organizadores: { [key: string]: any } = {}
      
      if (organizadorIds.length > 0) {
        const { data: organizadoresData, error: organizadoresError } = await supabase
          .from('usuarios')
          .select('id, nome, email, avatar')
          .in('id', organizadorIds)

        if (!organizadoresError && organizadoresData) {
          organizadores = organizadoresData.reduce((acc: any, org: any) => {
            acc[org.id] = org
            return acc
          }, {})
        }
      }

      // Buscar contagem de participantes em query separada
      const eventIds = (eventsData || []).map(event => event.id)
      let participationsCount: { [key: string]: number } = {}
      
      if (eventIds.length > 0) {
        const { data: participationsData, error: participationsError } = await supabase
          .from('participacoes')
          .select('evento_id, status')
          .in('evento_id', eventIds)
          .eq('status', 'confirmado')

        if (!participationsError && participationsData) {
          participationsCount = participationsData.reduce((acc: any, p: any) => {
            acc[p.evento_id] = (acc[p.evento_id] || 0) + 1
            return acc
          }, {})
        }
      }

      // Buscar participação do usuário em query separada
      let userParticipations: Set<string> = new Set()
      
      if (user && eventIds.length > 0) {
        const { data: userParticipationsData, error: userParticipationsError } = await supabase
          .from('participacoes')
          .select('evento_id')
          .in('evento_id', eventIds)
          .eq('usuario_id', user.id)
          .eq('status', 'confirmado')

        if (!userParticipationsError && userParticipationsData) {
          userParticipations = new Set(userParticipationsData.map((p: any) => p.evento_id))
        }
      }

      // Processar dados
      const processedEvents: Event[] = (eventsData || []).map(event => ({
        id: event.id,
        titulo: event.titulo,
        local: event.local,
        data: event.data,
        hora: event.hora,
        cidade: event.cidade,
        categoria: event.categoria,
        imagem_url: event.imagem_url,
        organizador_id: event.organizador_id,
        max_participantes: event.max_participantes,
        created_at: event.created_at,
        organizador: organizadores[event.organizador_id] || null,
        participantes_count: participationsCount[event.id] || 0,
        user_participando: userParticipations.has(event.id)
      }))

      // Verificar se há mais páginas
      const hasMoreData = processedEvents.length === pageSize

      if (append) {
        setEvents(prev => {
          const newEvents = [...prev, ...processedEvents]
          savePersistedState(newEvents, page, hasMoreData)
          return newEvents
        })
      } else {
        setEvents(processedEvents)
        savePersistedState(processedEvents, page, hasMoreData)
      }

      setHasMore(hasMoreData)
      setCurrentPage(page)

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar eventos')
      console.error('Erro ao buscar eventos:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [pageSize, user?.id, savePersistedState])

  // Carregar mais eventos (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchEvents(currentPage + 1, true)
    }
  }, [fetchEvents, currentPage, loadingMore, hasMore])

  // Refresh completo
  const refresh = useCallback(() => {
    setCurrentPage(0)
    setHasMore(true)
    clearPersistedState()
    fetchEvents(0, false)
  }, [fetchEvents, clearPersistedState])

  // Carregar eventos na inicialização
  useEffect(() => {
    // Tentar carregar estado persistido primeiro
    const stateLoaded = loadPersistedState()
    
    // Se não conseguiu carregar estado persistido, buscar do servidor
    if (!stateLoaded) {
      fetchEvents(0, false)
    }
  }, [loadPersistedState, fetchEvents])

  // Atualizar quando usuário muda
  useEffect(() => {
    if (events.length > 0) {
      refresh()
    }
  }, [user?.id])

  // Salvar estado quando componente é desmontado
  useEffect(() => {
    return () => {
      if (events.length > 0) {
        savePersistedState(events, currentPage, hasMore)
      }
    }
  }, [events, currentPage, hasMore, savePersistedState])

  // Detectar quando a página volta ao foco e restaurar estado se necessário
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && events.length === 0 && !loading) {
        // Página voltou ao foco e não há eventos carregados
        const stateLoaded = loadPersistedState()
        if (!stateLoaded) {
          fetchEvents(0, false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [events.length, loading, loadPersistedState, fetchEvents])

  return {
    events,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    clearError: () => setError(null)
  }
}

// Hook para buscar contagem de participantes de forma otimizada
export function useParticipantsCount(eventIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (eventIds.length === 0) return

    const fetchCounts = async () => {
      setLoading(true)
      try {
        // Buscar contagens em lote
        const { data, error } = await supabase
          .from('participacoes')
          .select('evento_id')
          .in('evento_id', eventIds)
          .eq('status', 'confirmado')

        if (error) throw error

        // Contar participações por evento
        const countsMap: Record<string, number> = {}
        eventIds.forEach(id => {
          countsMap[id] = data?.filter(p => p.evento_id === id).length || 0
        })

        setCounts(countsMap)
      } catch (error) {
        console.error('Erro ao buscar contagens:', error)
      } finally {
        setLoading(false)
      }
    }

    // Debounce otimizado para evitar muitas requisições
    const timeoutId = setTimeout(fetchCounts, 200) // Aumentar delay
    return () => clearTimeout(timeoutId)
  }, [eventIds.join(',')])

  return { counts, loading }
}