'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import AdvancedFilters from '@/components/AdvancedFilters'
import SearchResults from '@/components/SearchResults'
import SearchStats from '@/components/SearchStats'
import { useSearch } from '@/hooks/useSearch'
import { ArrowLeft } from 'lucide-react'

export default function SearchPage() {
  const { isAuthenticated, loading } = useAuth()
  const { searchStats } = useSearch()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Navegação */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Feed
            </button>
          </div>

          {/* Header da Busca */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              Buscar Eventos
            </h1>
            <p className="text-neutral-600">
              Encontre eventos incríveis próximos a você
            </p>
          </div>

          {/* Barra de Busca */}
          <div className="mb-8">
            <SearchBar
              onFiltersToggle={() => setShowFilters(true)}
              showFiltersButton={true}
              className="max-w-2xl"
            />
          </div>

          {/* Estatísticas */}
          {searchStats.totalResults > 0 && (
            <SearchStats
              totalResults={searchStats.totalResults}
              searchTime={0.15}
              popularSearches={['Tecnologia', 'Música', 'Networking']}
            />
          )}

          {/* Resultados */}
          <SearchResults
            onFiltersToggle={() => setShowFilters(true)}
          />

          {/* Modal de Filtros */}
          <AdvancedFilters
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
          />
        </div>
      </div>
    </div>
  )
}