'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Event } from './useEvents'

interface UseOptimizedEventsOptions {
  pageSize?: number
  enableInfiniteScroll?: boolean
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

      // Query otimizada: busca eventos com todas as informações necessárias em uma única requisição
      const query = supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id (
            nome,
            email,
            avatar
          ),
          participacoes_count:participacoes(count),
          user_participacao:participacoes!left (
            usuario_id,
            status
          )
        `)
        .order('data', { ascending: true })
        .range(from, to)

      // Se usuário logado, filtrar apenas suas participações
      if (user) {
        query.eq('user_participacao.usuario_id', user.id)
        query.eq('user_participacao.status', 'confirmado')
      }

      const { data: eventsData, error: eventsError } = await query

      if (eventsError) throw eventsError

      // Processar dados
      const processedEvents: Event[] = (eventsData || []).map(event => ({
        id: event.id,
        titulo: event.titulo,
        descricao: event.descricao,
        data: event.data,
        hora: event.hora,
        local: event.local,
        categoria: event.categoria,
        imagem_url: event.imagem_url,
        organizador_id: event.organizador_id,
        max_participantes: event.max_participantes,
        created_at: event.created_at,
        organizador: event.organizador,
        participantes_count: event.participacoes_count?.[0]?.count || 0,
        user_participando: user ? (event.user_participacao && event.user_participacao.length > 0) : false
      }))

      // Verificar se há mais páginas
      const hasMoreData = processedEvents.length === pageSize

      if (append) {
        setEvents(prev => [...prev, ...processedEvents])
      } else {
        setEvents(processedEvents)
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
  }, [pageSize, user])

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
    fetchEvents(0, false)
  }, [fetchEvents])

  // Carregar eventos na inicialização
  useEffect(() => {
    fetchEvents(0, false)
  }, [fetchEvents])

  // Atualizar quando usuário muda
  useEffect(() => {
    if (events.length > 0) {
      refresh()
    }
  }, [user?.id])

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

    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(fetchCounts, 100)
    return () => clearTimeout(timeoutId)
  }, [eventIds.join(',')])

  return { counts, loading }
}