'use client'

import { useState } from 'react'
import { Plus, Filter, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EventCard from './EventCard'
import FeaturedBanner from './FeaturedBanner'
import EventModal from './EventModal'
import SocialSection from './SocialSection'
import EventSlider from './EventSlider'
import AdvancedFilterBar from './AdvancedFilterBar'

import { useEvents } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { useFriendsEvents } from '@/hooks/useFriendsEvents'
import { useSuggestedEvents } from '@/hooks/useSuggestedEvents'

interface MainFeedProps {
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  onCreateEvent?: () => void;
}

export default function MainFeed({ 
  showCreateModal = false, 
  onCloseCreateModal,
  onCreateEvent 
}: MainFeedProps) {
  const { events, loading, error, fetchEvents } = useEvents()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Hooks sociais
  const { events: friendsEvents, loading: friendsLoading } = useFriendsEvents()
  const { events: suggestedEvents, loading: suggestedLoading } = useSuggestedEvents()

  const filters = ['Todos', 'Hoje', 'Esta Semana', 'Próximo de Mim']

  const handleRefresh = () => {
    fetchEvents()
  }

  const handleFiltersChange = (filters: any) => {
    // TODO: Implementar lógica de filtros
    console.log('Filtros aplicados:', filters)
  }

  const handleEventClick = (event: any) => {
    // TODO: Abrir modal de detalhes do evento
    console.log('Evento clicado:', event)
  }



  // Eventos em destaque (primeiros 3 eventos para o banner)
  const featuredEvents = events.slice(0, 3).map(event => ({
    ...event,
    destaque_motivo: 'Evento Popular'
  }))

  return (
    <div className="space-y-6">
      
      {/* Banner de Destaques Melhorado */}
      <FeaturedBanner 
        events={featuredEvents}
        loading={loading}
        onEventClick={handleEventClick}
      />
      
      {/* Busca Avançada - Card Separado */}
      <button
        onClick={() => router.push('/search')}
        className="card p-6 hover:shadow-reuni-lg transition-all group w-full text-left bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-primary rounded-2xl group-hover:shadow-glow transition-all duration-300">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-neutral-800 text-lg">Buscar eventos específicos?</p>
              <p className="text-sm text-neutral-600">Filtros avançados, categorias e localização</p>
            </div>
          </div>
          <div className="text-primary-600 font-semibold text-xl group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </button>
      
      {/* Filtros Melhorados + Criar Evento */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showAdvancedFilters ? 'Filtros simples' : 'Filtros avançados'}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => onCreateEvent && onCreateEvent()}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Evento
              </button>
            )}
          </div>
        </div>
        
        {showAdvancedFilters ? (
          <AdvancedFilterBar onFiltersChange={handleFiltersChange} />
        ) : (
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
        )}
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

      {/* Seções Sociais */}
      {isAuthenticated && (
        <>
          {/* Eventos de Amigos */}
          {friendsEvents.length > 0 && (
            <SocialSection
              title="Eventos de Amigos"
              subtitle="Eventos que seus amigos vão participar"
              viewAllLink="/friends/events"
              loading={friendsLoading}
            >
              <EventSlider
                events={friendsEvents}
                loading={friendsLoading}
                showSocialInfo={true}
                onEventClick={handleEventClick}
                emptyMessage="Seus amigos ainda não confirmaram presença em eventos"
              />
            </SocialSection>
          )}

          {/* Eventos Sugeridos */}
          {suggestedEvents.length > 0 && (
            <SocialSection
              title="Sugeridos para Você"
              subtitle="Baseado nos seus interesses e atividades"
              viewAllLink="/suggested"
              loading={suggestedLoading}
            >
              <EventSlider
                events={suggestedEvents}
                loading={suggestedLoading}
                showSocialInfo={true}
                onEventClick={handleEventClick}
                emptyMessage="Nenhuma sugestão disponível no momento"
              />
            </SocialSection>
          )}
        </>
      )}

      {/* Feed Principal de Eventos */}
      {!loading && !error && (
        <>
          {events.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-800 px-1">
                Todos os Eventos
              </h2>
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
                  onClick={() => onCreateEvent && onCreateEvent()}
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
        onClose={() => onCloseCreateModal && onCloseCreateModal()}
        mode="create"
      />
      
    </div>
  )
}