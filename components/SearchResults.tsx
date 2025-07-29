'use client'

import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import EventCard from './EventCard'
import EventGrid from './EventGrid'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface SearchResultsProps {
  onFiltersToggle?: () => void
  viewMode?: 'grid' | 'list'
}

export default function SearchResults({ onFiltersToggle, viewMode = 'grid' }: SearchResultsProps) {
  const { 
    results, 
    loading, 
    error, 
    filters, 
    options, 
    updateOptions, 
    searchStats,
    clearError 
  } = useSearch()

  const handlePageChange = (newPage: number) => {
    updateOptions({ page: newPage })
    // Scroll para o topo dos resultados
    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' })
  }

  const getActiveFiltersText = () => {
    const activeFilters = []
    
    if (filters.query) activeFilters.push(`"${filters.query}"`)
    if (filters.categoria) activeFilters.push(filters.categoria)
    if (filters.local) activeFilters.push(filters.local)
    if (filters.status !== 'futuros') {
      const statusLabels = {
        todos: 'Todos os eventos',
        futuros: 'Eventos futuros',
        passados: 'Eventos passados',
        lotados: 'Eventos lotados'
      }
      activeFilters.push(statusLabels[filters.status])
    }
    
    return activeFilters.join(', ')
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Erro na busca</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={clearError}
          className="btn-primary"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div id="search-results" className="space-y-6">
      
      {/* Filtros Ativos */}
      {getActiveFiltersText() && (
        <div className="card p-4">
          <p className="text-sm text-neutral-600">
            Filtros ativos: {getActiveFiltersText()}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <LoadingSpinner text="Buscando eventos..." />
      )}

      {/* Resultados */}
      {!loading && (
        <>
          {results.length > 0 ? (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((event) => (
                    <div key={event.id} className="transform hover:scale-105 transition-transform">
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {results.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}

              {/* Paginação */}
              {searchStats.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  <button
                    onClick={() => handlePageChange(options.page - 1)}
                    disabled={!searchStats.hasPrevPage}
                    className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, searchStats.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      const isActive = pageNum === options.page
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-500 text-white'
                              : 'hover:bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    {searchStats.totalPages > 5 && (
                      <>
                        <span className="px-2 text-neutral-500">...</span>
                        <button
                          onClick={() => handlePageChange(searchStats.totalPages)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            searchStats.totalPages === options.page
                              ? 'bg-primary-500 text-white'
                              : 'hover:bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {searchStats.totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(options.page + 1)}
                    disabled={!searchStats.hasNextPage}
                    className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Estado Vazio */
            <EmptyState
              icon={Filter}
              title="Nenhum evento encontrado"
              description={
                getActiveFiltersText() 
                  ? "Tente ajustar os filtros ou fazer uma nova busca"
                  : "Comece digitando na barra de busca para encontrar eventos"
              }
              action={getActiveFiltersText() ? {
                label: "Limpar Filtros",
                onClick: () => {
                  // Implementar limpeza de filtros
                }
              } : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}