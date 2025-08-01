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
import { ArrowLeft, Filter, Grid, List, Clock, TrendingUp, MapPin, Calendar } from 'lucide-react'

export default function SearchPage() {
  const { isAuthenticated, loading } = useAuth()
  const { searchStats } = useSearch()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTimeFilter, setActiveTimeFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Reuni
          </h2>
          <p className="text-neutral-600 mt-2">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Layout IGUAL ao app principal */}
      <div className="pt-16"> {/* Offset para header fixo */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6">

            {/* Sidebar Esquerda - IGUAL ao padrão */}
            <div className="lg:col-span-3 hidden lg:block">
              <div className="sticky top-20">
                <div className="space-y-6">
                  {/* Navegação */}
                  <div className="card p-4">
                    <button
                      onClick={() => router.push('/')}
                      className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar ao Feed
                    </button>
                  </div>

                  {/* Filtros Rápidos */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filtros Rápidos
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-3">Categorias</h4>
                        <div className="space-y-2">
                          {[
                            { name: 'Arte', icon: '🎨', color: 'text-purple-600' },
                            { name: 'Culinária', icon: '🍳', color: 'text-orange-600' },
                            { name: 'Esportes', icon: '⚽', color: 'text-green-600' },
                            { name: 'Música', icon: '🎵', color: 'text-pink-600' },
                            { name: 'Negócios', icon: '💼', color: 'text-gray-600' },
                            { name: 'Tecnologia', icon: '💻', color: 'text-blue-600' }
                          ].map((category) => (
                            <button
                              key={category.name}
                              onClick={() => setActiveCategory(activeCategory === category.name ? null : category.name)}
                              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                                activeCategory === category.name 
                                  ? 'bg-primary-500 text-white' 
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                              }`}
                            >
                              <span className="mr-3">{category.icon}</span>
                              <span className="flex-1">{category.name}</span>
                              <span className="text-xs opacity-60">12</span>
                            </button>
                          ))}
                </div>
              </div>

                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-3">Quando</h4>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Hoje',
                            'Esta Semana', 
                            'Este Mês',
                            'Próximos'
                          ].map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setActiveTimeFilter(activeTimeFilter === filter ? null : filter)}
                              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                activeTimeFilter === filter
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                              }`}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-3">Local</h4>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-2 rounded-full text-sm font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Próximo a mim
                          </button>
                          <button className="px-3 py-2 rounded-full text-sm font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors">
                            Online
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Central - IGUAL ao padrão */}
            <div className="lg:col-span-6">
              <div className="space-y-6">
                
                {/* Busca Principal */}
                <div className="card p-4">
                  <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    🔍 Buscar Eventos
                  </h2>
                  
                  <SearchBar
                    onFiltersToggle={() => setShowFilters(true)}
                    showFiltersButton={false}
                    placeholder="Buscar eventos, organizadores, locais..."
                  />
                  
                  {/* Filtros Ativos */}
                  {(activeCategory || activeTimeFilter) && (
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-sm text-neutral-600">Filtros ativos:</span>
                      {activeCategory && (
                        <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {activeCategory}
                          <button
                            onClick={() => setActiveCategory(null)}
                            className="ml-1 hover:text-primary-900"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {activeTimeFilter && (
                        <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {activeTimeFilter}
                          <button
                            onClick={() => setActiveTimeFilter(null)}
                            className="ml-1 hover:text-primary-900"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setActiveCategory(null);
                          setActiveTimeFilter(null);
                        }}
                        className="text-xs text-neutral-500 hover:text-neutral-700 ml-2"
                      >
                        Limpar todos
                      </button>
                    </div>
                  )}
                </div>

                {/* Controles e Estatísticas */}
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-neutral-600">
                        <span className="font-medium">{searchStats.totalResults}</span> eventos encontrados
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          showFilters 
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                      </button>
                      
                      <div className="flex items-center border border-neutral-300 rounded-lg">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 transition-colors ${
                            viewMode === 'grid' 
                              ? 'bg-primary-100 text-primary-600' 
                              : 'text-neutral-400 hover:text-neutral-600'
                          }`}
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 transition-colors ${
                            viewMode === 'list' 
                              ? 'bg-primary-100 text-primary-600' 
                              : 'text-neutral-400 hover:text-neutral-600'
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <select className="bg-neutral-100 border-0 rounded-lg px-3 py-2 text-sm">
                        <option>Ordenar por Relevância</option>
                        <option>Data</option>
                        <option>Proximidade</option>
                        <option>Popularidade</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="card p-4">
                    <AdvancedFilters
                      isOpen={true}
                      onClose={() => setShowFilters(false)}
                    />
                  </div>
                )}

                {/* Search Results */}
                <SearchResults
                  onFiltersToggle={() => setShowFilters(true)}
                  viewMode={viewMode}
                />
                
              </div>
            </div>

            {/* Sidebar Direita - IGUAL ao padrão */}
            <div className="lg:col-span-3 hidden lg:block">
              <div className="sticky top-20">
                <div className="space-y-6">
                  


                  {/* Eventos Próximos */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Próximo a Você
                    </h3>
                    <div className="space-y-3">
                      <div className="text-center py-6 text-neutral-500">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                        <p className="text-sm">Nenhum evento próximo encontrado</p>
                        <p className="text-xs mt-1">Eventos baseados na sua localização aparecerão aqui</p>
                      </div>
                    </div>
                  </div>

                  {/* Dicas */}
                  <div className="card p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                    <h4 className="font-semibold text-neutral-800 mb-3">💡 Dicas de Busca</h4>
                    <ul className="text-sm text-neutral-600 space-y-2">
                      <li>• Use aspas para busca exata: "React Native"</li>
                      <li>• Combine filtros para resultados precisos</li>
                      <li>• Busque por local para eventos próximos</li>
                      <li>• Salve buscas frequentes nos favoritos</li>
                    </ul>
                  </div>
                  
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de Filtros para Mobile */}
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </div>
  )
}