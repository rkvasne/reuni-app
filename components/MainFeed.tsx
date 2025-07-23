'use client'

import { useState } from 'react'
import { Plus, Filter, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EventCard from './EventCard'
import FeaturedCarousel from './FeaturedCarousel'
import EventModal from './EventModal'
import { useEvents } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'

export default function MainFeed() {
  const { events, loading, error, fetchEvents } = useEvents()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Todos')

  const filters = ['Todos', 'Hoje', 'Esta Semana', 'Próximo de Mim']

  const handleRefresh = () => {
    fetchEvents()
  }

  return (
    <div className="space-y-4">
      
      {/* Carrossel de Destaques */}
      <FeaturedCarousel />
      
      {/* Busca Avançada - Card Separado */}
      <button
        onClick={() => router.push('/search')}
        className="card p-4 hover:shadow-md transition-all group w-full text-left bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg group-hover:bg-blue-100 transition-colors">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Buscar eventos específicos?</p>
              <p className="text-sm text-gray-600">Filtros avançados, categorias e localização</p>
            </div>
          </div>
          <div className="text-blue-600 font-medium">→</div>
        </div>
      </button>
      
      {/* Filtros + Criar Evento */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h3>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Evento
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      
      {/* Estado de Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Carregando eventos...</p>
        </div>
      )}

      {/* Estado de Erro */}
      {error && (
        <div className="card p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Feed de Eventos */}
      {!loading && !error && (
        <>
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                Nenhum evento encontrado
              </h3>
              <p className="text-neutral-600 mb-4">
                Seja o primeiro a criar um evento incrível!
              </p>
              {isAuthenticated && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Criar Primeiro Evento
                </button>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Botão Carregar Mais (futuro) */}
      {!loading && !error && events.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={handleRefresh}
            className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-6 py-3 rounded-xl font-medium transition-all"
          >
            Atualizar eventos
          </button>
        </div>
      )}

      {/* Modal de Criar Evento */}
      <EventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
      />
      
    </div>
  )
}