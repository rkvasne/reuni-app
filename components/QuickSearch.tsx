'use client'

import { useState } from 'react'
import { Search, TrendingUp, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

const trendingSearches = [
  'Tecnologia',
  'Música ao vivo',
  'Networking',
  'Workshop',
  'São Paulo'
]

const quickFilters = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Esta semana', value: 'semana' },
  { label: 'Gratuitos', value: 'gratuitos' },
  { label: 'Online', value: 'online' }
]

export default function QuickSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (searchQuery?: string) => {
    const searchTerm = searchQuery || query
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      router.push('/search')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="card p-6 mb-6">
      <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5" />
        Buscar Eventos
      </h3>

      {/* Barra de Busca Rápida */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="O que você está procurando?"
          className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filtros Rápidos */}
      <div className="mb-4">
        <p className="text-sm text-neutral-600 mb-2">Filtros rápidos:</p>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => router.push(`/search?filter=${filter.value}`)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 text-neutral-700 rounded-full text-sm font-medium transition-colors"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buscas em Alta */}
      <div>
        <p className="text-sm text-neutral-600 mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Em alta:
        </p>
        <div className="flex flex-wrap gap-2">
          {trendingSearches.map((search) => (
            <button
              key={search}
              onClick={() => handleSearch(search)}
              className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-secondary-50 hover:from-primary-100 hover:to-secondary-100 text-primary-700 rounded-full text-sm font-medium transition-all"
            >
              {search}
            </button>
          ))}
        </div>
      </div>

      {/* Botão Ver Todos */}
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <button
          onClick={() => router.push('/search')}
          className="w-full py-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          Ver busca avançada →
        </button>
      </div>
    </div>
  )
}