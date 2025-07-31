'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { eventCache } from '@/utils/eventCache'
import type { Event } from './useEvents'

export function useFeaturedEvents(limit: number = 3) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeaturedEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar cache primeiro
      const cacheKey = `featured:events:${limit}`
      const cachedEvents = eventCache.get<Event[]>(cacheKey)
      
      if (cachedEvents) {
        setEvents(cachedEvents)
        setLoading(false)
        return
      }

      // Buscar eventos em destaque (mais recentes com mais participantes)
      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id (
            nome,
            email,
            avatar
          ),
          participacoes_count:participacoes(count)
        `)
        .gte('data', new Date().toISOString().split('T')[0]) // Apenas eventos futuros
        .order('created_at', { ascending: false }) // Mais recentes primeiro
        .limit(limit * 2) // Buscar mais para filtrar os melhores

      if (eventsError) throw eventsError

      // Processar e ordenar por popularidade
      const processedEvents: Event[] = (eventsData || [])
        .map(event => ({
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
          user_participando: false // Não relevante para banner
        }))
        .sort((a, b) => {
          // Ordenar por popularidade (participantes) e depois por data
          const popularityDiff = (b.participantes_count || 0) - (a.participantes_count || 0)
          if (popularityDiff !== 0) return popularityDiff
          
          return new Date(a.data).getTime() - new Date(b.data).getTime()
        })
        .slice(0, limit)

      // Cache por 10 minutos
      eventCache.set(cacheKey, processedEvents, 10 * 60 * 1000)
      setEvents(processedEvents)

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar eventos em destaque')
      console.error('Erro ao buscar eventos em destaque:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeaturedEvents()
  }, [limit])

  return {
    events,
    loading,
    error,
    refresh: fetchFeaturedEvents
  }
}