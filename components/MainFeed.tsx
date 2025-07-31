'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EventCard from './EventCard'
import FeaturedBanner from './FeaturedBanner'
import EventModal from './EventModal'
import SocialSection from './SocialSection'
import EventSlider from './EventSlider'
import OptimizedEventsList from './OptimizedEventsList'

import { useAuth } from '@/hooks/useAuth'
import { useFriendsEvents } from '@/hooks/useFriendsEvents'
import { useSuggestedEvents } from '@/hooks/useSuggestedEvents'
import { useFeaturedEvents } from '@/hooks/useFeaturedEvents'

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
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  
  // Hooks para diferentes seções
  const { events: featuredEvents, loading: featuredLoading } = useFeaturedEvents(3)
  const { events: friendsEvents, loading: friendsLoading } = useFriendsEvents()
  const { events: suggestedEvents, loading: suggestedLoading } = useSuggestedEvents()

  const handleEventClick = (event: any) => {
    // TODO: Abrir modal de detalhes do evento
    console.log('Evento clicado:', event)
  }

  return (
    <div className="space-y-6">
      
      {/* Banner de Destaques Melhorado */}
      <FeaturedBanner 
        events={featuredEvents.map(event => ({
          ...event,
          participantes_count: event.participantes_count || 0
        }))}
        loading={featuredLoading}
        onEventClick={handleEventClick}
      />
      
      {/* Busca Avançada - Card Separado */}
      <button
        onClick={() => router.push('/search')}
        className="card p-6 hover:shadow-reuni-lg transition-all group w-full text-left bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl transition-all duration-300">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-neutral-800 text-lg">Buscar eventos específicos?</p>
              <p className="text-sm text-neutral-600">Filtros avançados, categorias e localização</p>
            </div>
          </div>
          <div className="text-primary-600 font-semibold text-xl group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </button>
      

      


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

      {/* Feed Principal de Eventos com Scroll Infinito */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-800 px-1">
            Todos os Eventos
          </h2>
          <span className="text-sm text-neutral-500 px-1">
            Scroll para carregar mais
          </span>
        </div>
        <OptimizedEventsList 
          pageSize={6}
          className="space-y-4"
        />
      </div>

      {/* Modal de Criar Evento */}
      <EventModal
        isOpen={showCreateModal}
        onClose={() => onCloseCreateModal && onCloseCreateModal()}
        mode="create"
        onEventCreated={() => {
          // O OptimizedEventsList se atualiza automaticamente
          // Pode adicionar lógica adicional aqui se necessário
        }}
      />
      
    </div>
  )
}