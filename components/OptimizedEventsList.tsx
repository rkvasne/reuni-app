'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useOptimizedEvents } from '@/hooks/useOptimizedEvents'
import EventCard from './EventCard'
import { Loader2 } from 'lucide-react'

interface OptimizedEventsListProps {
  className?: string
  pageSize?: number
}

export default function OptimizedEventsList({ 
  className = '',
  pageSize = 12
}: OptimizedEventsListProps) {
  const { 
    events, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = useOptimizedEvents({ pageSize })

  const observerRef = useRef<IntersectionObserver>()
  const lastEventElementRef = useRef<HTMLDivElement>()

  // Intersection Observer para infinite scroll
  const lastEventRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    })
    
    if (node) observerRef.current.observe(node)
    lastEventElementRef.current = node
  }, [loadingMore, hasMore, loadMore])

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-neutral-600">Carregando eventos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            Erro ao carregar eventos
          </h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-neutral-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            Nenhum evento encontrado
          </h3>
          <p className="text-neutral-600 mb-4">
            Não há eventos disponíveis no momento.
          </p>
          <button
            onClick={refresh}
            className="btn-secondary"
          >
            Atualizar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Lista de eventos em coluna única */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <div
            key={event.id}
            ref={index === events.length - 1 ? lastEventRef : undefined}
          >
            <EventCard
              event={event}
              priority={index < 6} // Prioridade para os primeiros 6 eventos
              onEventUpdated={refresh}
            />
          </div>
        ))}
      </div>

      {/* Loading indicator para infinite scroll */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto mb-2" />
            <p className="text-sm text-neutral-600">Carregando mais eventos...</p>
          </div>
        </div>
      )}

      {/* Indicador de fim da lista */}
      {!hasMore && events.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500">
            Você viu todos os {events.length} eventos disponíveis
          </p>
        </div>
      )}

      {/* Botão manual para carregar mais (fallback) */}
      {hasMore && !loadingMore && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            className="btn-secondary"
          >
            Carregar Mais Eventos
          </button>
        </div>
      )}
    </div>
  )
}