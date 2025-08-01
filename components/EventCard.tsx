'use client'

import { useState, useCallback } from 'react'
import { Calendar, MapPin, Users, Heart, MessageCircle, Share2, Edit, Trash2, MoreHorizontal, Check, Clock } from 'lucide-react'
import OptimizedImage from './OptimizedImage'
import EventDateBadge from './EventDateBadge'
import { useAuth } from '@/hooks/useAuth'
import { useEvents, type Event } from '@/hooks/useEvents'
import EventModal from './EventModal'

interface EventCardProps {
  event: Event
  priority?: boolean
  onEventUpdated?: () => void // Callback para atualizar lista após editar
}

export default function EventCard({ event, priority = false, onEventUpdated }: EventCardProps) {
  const { user } = useAuth()
  const { deleteEvent, participateInEvent, cancelParticipation } = useEvents()
  const [showMenu, setShowMenu] = useState(false)
  const [modalState, setModalState] = useState<'closed' | 'view' | 'edit'>('closed')
  const [deleting, setDeleting] = useState(false)
  const [participationLoading, setParticipationLoading] = useState(false)

  const isOrganizer = user?.id === event.organizador_id

  // Stable close handler to prevent infinite loops
  const handleCloseModal = useCallback(() => {
    setModalState('closed')
  }, [])

  const handleOpenViewModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setModalState('view')
  }, [])

  const handleOpenEditModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setModalState('edit')
    setShowMenu(false)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove seconds
  }

  const getEventLocation = () => {
    if (event.descricao === 'Evento encontrado no eventbrite') {
      return event.local;
    }
    
    // Extrair local da descrição (formato: "Local - Cidade, Estado")
    if (event.descricao.includes(' - ')) {
      return event.descricao;
    }
    
    return event.local;
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return

    setDeleting(true)
    try {
      const result = await deleteEvent(event.id)
      if (result.error) {
        alert('Erro ao deletar evento: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao deletar evento')
    } finally {
      setDeleting(false)
      setShowMenu(false)
    }
  }

  const handleParticipation = async () => {
    if (!user) {
      alert('Você precisa estar logado para participar de eventos')
      return
    }

    if (isOrganizer) {
      alert('Você é o organizador deste evento')
      return
    }

    setParticipationLoading(true)
    try {
      if (event.user_participando) {
        const result = await cancelParticipation(event.id)
        if (result.error) {
          alert('Erro ao cancelar participação: ' + result.error)
        }
      } else {
        const result = await participateInEvent(event.id)
        if (result.error) {
          alert('Erro ao participar do evento: ' + result.error)
        }
      }
    } catch (error) {
      alert('Erro ao processar participação')
    } finally {
      setParticipationLoading(false)
    }
  }

  const formatFullDate = (dateString: string) => {
    // Criar data considerando fuso horário local (evita problema de -1 dia)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month - 1 porque Date usa 0-11
    
    const dayNum = date.getDate()
    const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' })
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
    return { day: dayNum, month: monthStr, weekday }
  }

  const dateInfo = formatFullDate(event.data)

  return (
    <div className={`event-card event-card-main ${modalState !== 'closed' ? 'modal-open' : ''}`}>
      
      {/* Imagem do Evento - Limpa sem sobreposições */}
      <div 
        className="relative h-68 bg-neutral-100 rounded-t-lg overflow-hidden cursor-pointer"
        onClick={handleOpenViewModal}
      >
        {event.imagem_url ? (
          <OptimizedImage
            src={event.imagem_url}
            alt={event.titulo}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                <Calendar className="w-16 h-16 text-primary-400" />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-primary-400" />
          </div>
        )}
        
        {/* Apenas elementos essenciais sobre a imagem */}
        {/* Data no canto superior direito */}
        <EventDateBadge 
          date={event.data} 
          className="absolute top-3 right-3"
        />

        {/* Menu de ações para organizador - apenas se necessário */}
        {isOrganizer && (
          <div className="absolute top-3 left-3">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-2 bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-lg transition-colors"
                title="Opções do evento"
                aria-label="Abrir menu de opções do evento"
              >
                <MoreHorizontal className="w-4 h-4 text-white" />
              </button>
              
              {showMenu && (
                <div className="absolute top-10 left-0 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 w-40 z-10">
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deletando...' : 'Deletar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Conteúdo Principal */}
      <div className="p-5">
        
        {/* Categoria e Título */}
        <div className="mb-3">
          <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full mb-2 capitalize">
            {event.categoria}
          </span>
          <h3 
            className="font-bold text-xl text-neutral-800 cursor-pointer hover:text-primary-600 transition-colors line-clamp-2"
            onClick={handleOpenViewModal}
          >
            {event.titulo}
          </h3>
        </div>

        {/* Informações do Organizador */}
        <div className="flex items-center gap-2 mb-4">
          {event.organizador?.avatar ? (
            <OptimizedImage
              src={event.organizador.avatar}
              alt={event.organizador.nome}
              width={24}
              height={24}
              className="rounded-full object-cover flex-shrink-0"
              fallback={
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {event.organizador?.nome?.charAt(0) || 'U'}
                  </span>
                </div>
              }
            />
          ) : (
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {event.organizador?.nome?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <span className="text-sm text-neutral-600">
            por <span className="font-medium">{event.organizador?.nome || 'Organizador'}</span>
          </span>
        </div>
        
        {/* Detalhes do Evento */}
        <div className="space-y-3 mb-4">
          {/* Data e Hora */}
          <div className="flex items-center gap-3 text-neutral-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span className="text-sm">
                {dateInfo.weekday}, {dateInfo.day} de {dateInfo.month}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium">
                {formatTime(event.hora)}
              </span>
            </div>
          </div>
          
          {/* Local */}
          <div className="flex items-center gap-3 text-neutral-700">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="text-sm">{getEventLocation()}</span>
          </div>
          
          {/* Participantes */}
          <div className="flex items-center gap-3 text-neutral-700">
            <Users className="w-4 h-4 text-primary-500" />
            <span className="text-sm">
              {event.participantes_count || 0} pessoas confirmadas
              {event.max_participantes && (
                <span className="text-neutral-500"> de {event.max_participantes}</span>
              )}
            </span>
          </div>
        </div>

        {/* Descrição (se houver) */}
        {event.descricao && (
          <div className="mb-4">
            <p className="text-sm text-neutral-600 line-clamp-2">
              {event.descricao}
            </p>
          </div>
        )}
        
        {/* Separador sutil */}
        <div className="card-separator my-4"></div>
        
        {/* Ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button type="button" className="flex items-center gap-2 text-neutral-600 hover:text-red-500 py-2 px-3 rounded-md hover:bg-red-50 transition-colors duration-120">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Curtir</span>
            </button>
            <button type="button" className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 py-2 px-3 rounded-md hover:bg-primary-50 transition-colors duration-120">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Comentar</span>
            </button>
            <button type="button" className="flex items-center gap-2 text-neutral-600 hover:text-blue-500 py-2 px-3 rounded-md hover:bg-blue-50 transition-colors duration-120">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Compartilhar</span>
            </button>
          </div>
          
          {!isOrganizer && (
            <button 
              type="button"
              onClick={handleParticipation}
              disabled={participationLoading}
              className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 text-sm shadow-sm transition-transform duration-120 ${
                event.user_participando
                  ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 hover:shadow-md'
                  : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102`}
            >
              {participationLoading ? (
                'Carregando...'
              ) : event.user_participando ? (
                <>
                  <Check className="w-4 h-4" />
                  Confirmado
                </>
              ) : (
                'Eu Vou!'
              )}
            </button>
          )}
          
          {isOrganizer && (
            <div className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold border border-primary-200">
              Seu evento
            </div>
          )}
        </div>
        
      </div>

      {/* Modal - apenas um por vez */}
      {modalState !== 'closed' && (
        <EventModal
          isOpen={modalState !== 'closed'}
          onClose={handleCloseModal}
          event={event}
          mode={modalState === 'edit' ? "edit" : "view"}
          onEventUpdated={onEventUpdated}
        />
      )}
    </div>
  )
}