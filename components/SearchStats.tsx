'use client'

import { BarChart3, Clock, TrendingUp, Users } from 'lucide-react'

interface SearchStatsProps {
  totalResults: number
  searchTime?: number
  popularSearches?: string[]
  recentSearches?: string[]
}

export default function SearchStats({ 
  totalResults, 
  searchTime = 0,
  popularSearches = [],
  recentSearches = []
}: SearchStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Total de Resultados */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-800">
              {totalResults.toLocaleString()}
            </div>
            <div className="text-sm text-neutral-600">
              Eventos encontrados
            </div>
          </div>
        </div>
      </div>

      {/* Tempo de Busca */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-secondary-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-800">
              {searchTime.toFixed(2)}s
            </div>
            <div className="text-sm text-neutral-600">
              Tempo de busca
            </div>
          </div>
        </div>
      </div>

      {/* Buscas Populares */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-800">
              Em Alta
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {popularSearches.slice(0, 3).map((search, index) => (
            <div key={index} className="text-xs text-neutral-600 truncate">
              {index + 1}. {search}
            </div>
          ))}
        </div>
      </div>

      {/* Categorias Ativas */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-800">
              Categorias
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-neutral-600">Tecnologia (45%)</div>
          <div className="text-xs text-neutral-600">Música (23%)</div>
          <div className="text-xs text-neutral-600">Esporte (18%)</div>
        </div>
      </div>
    </div>
  )
}