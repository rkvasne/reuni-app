'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useOptimizedEvents } from '@/hooks/useOptimizedEvents'
import EventCard from './EventCard'
import { Loader2 } from 'lucide-react'

interface OptimizedEventsListProps {
  className?: string
  pageSize?: number
}

// Chave para sessionStorage da posição do scroll
const SCROLL_POSITION_KEY = 'reuni_scroll_position'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // Salvar posição do scroll com debounce
  const saveScrollPosition = useCallback(() => {
    try {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop
        // Debounce para evitar muitas operações de storage
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        scrollTimeoutRef.current = setTimeout(() => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              sessionStorage.setItem(SCROLL_POSITION_KEY, scrollTop.toString())
            })
          } else {
            sessionStorage.setItem(SCROLL_POSITION_KEY, scrollTop.toString())
          }
        }, 150)
      }
    } catch (error) {
      console.warn('Erro ao salvar posição do scroll:', error)
    }
  }, [])

  // Restaurar posição do scroll
  const restoreScrollPosition = useCallback(() => {
    try {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY)
      if (savedPosition && containerRef.current) {
        const scrollTop = parseInt(savedPosition, 10)
        // Usar requestAnimationFrame para evitar reflows forçados
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = scrollTop
          }
        })
      }
    } catch (error) {
      console.warn('Erro ao restaurar posição do scroll:', error)
    }
  }, [])

  // Limpar posição do scroll
  const clearScrollPosition = useCallback(() => {
    try {
      sessionStorage.removeItem(SCROLL_POSITION_KEY)
    } catch (error) {
      console.warn('Erro ao limpar posição do scroll:', error)
    }
  }, [])

  // Intersection Observer para infinite scroll
  const lastEventRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        // Usar requestIdleCallback para carregar mais eventos
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => loadMore())
        } else {
          loadMore()
        }
      }
    }, {
      threshold: 0.1,
      rootMargin: '200px' // Aumentar margem para carregar mais cedo
    })
    
    if (node) observerRef.current.observe(node)
    lastEventElementRef.current = node
  }, [loadingMore, hasMore, loadMore])

  // Cleanup observer e timeout
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Salvar posição do scroll quando componente é desmontado
  useEffect(() => {
    return () => {
      saveScrollPosition()
    }
  }, [saveScrollPosition])

  // Restaurar posição do scroll quando eventos carregam
  useEffect(() => {
    if (!loading && events.length > 0) {
      // Usar requestAnimationFrame para evitar violações de performance
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScrollPosition)
      })
    }
  }, [loading, events.length, restoreScrollPosition])

  // Limpar posição do scroll no refresh
  const handleRefresh = useCallback(() => {
    clearScrollPosition()
    refresh()
  }, [clearScrollPosition, refresh])

  // Memoizar a lista de eventos para evitar re-renders desnecessários
  const eventsList = useMemo(() => {
    return events.map((event, index) => (
      <div
        key={event.id}
        ref={index === events.length - 1 ? lastEventRef : undefined}
      >
        <EventCard
          event={event}
          priority={index < 6} // Prioridade para os primeiros 6 eventos
          onEventUpdated={handleRefresh}
        />
      </div>
    ))
  }, [events, lastEventRef, handleRefresh])

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
            onClick={handleRefresh}
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
            onClick={handleRefresh}
            className="btn-secondary"
          >
            Atualizar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`} ref={containerRef}>
      {/* Lista de eventos em coluna única */}
      <div className="space-y-6">
        {eventsList}
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