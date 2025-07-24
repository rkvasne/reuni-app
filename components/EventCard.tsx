'use client'

import { useState } from 'react'
import { Calendar, MapPin, Users, Heart, MessageCircle, Share2, Edit, Trash2, MoreHorizontal, Check } from 'lucide-react'
import OptimizedImage from './OptimizedImage'
import { useAuth } from '@/hooks/useAuth'
import { useEvents, type Event } from '@/hooks/useEvents'
import EventModal from './EventModal'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const { user } = useAuth()
  const { deleteEvent, participateInEvent, cancelParticipation } = useEvents()
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [participationLoading, setParticipationLoading] = useState(false)

  const isOrganizer = user?.id === event.organizador_id

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

  return (
    <div className="card overflow-hidden">
      
      {/* Imagem do Evento */}
      <div className="relative h-48 bg-neutral-200">
        {event.imagem_url ? (
          <OptimizedImage
            src={event.imagem_url}
            alt={event.titulo}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        <div className="absolute top-3 left-3">
          <span className="bg-primary-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
            {event.categoria}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-primary-600">
            {formatDate(event.data).split(' ')[0]}
          </div>
          <div className="text-xs text-neutral-600 uppercase">
            {formatDate(event.data).split(' ')[1]}
          </div>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        
        {/* Título e Organizador */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 
              className="font-semibold text-lg text-neutral-800 mb-1 cursor-pointer hover:text-primary-600 transition-colors"
              onClick={() => setShowViewModal(true)}
            >
              {event.titulo}
            </h3>
            <div className="flex items-center gap-2">
              {event.organizador?.avatar ? (
                <OptimizedImage
                  src={event.organizador.avatar}
                  alt={event.organizador.nome}
                  width={20}
                  height={20}
                  className="rounded-full object-cover flex-shrink-0"
                  fallback={
                    <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {event.organizador?.nome?.charAt(0) || 'U'}
                      </span>
                    </div>
                  }
                />
              ) : (
                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {event.organizador?.nome?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm text-neutral-600">
                por {event.organizador?.nome || 'Organizador'}
              </span>
            </div>
          </div>
          
          {/* Menu de ações para organizador */}
          {isOrganizer && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-neutral-600" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-10 bg-white rounded-lg shadow-reuni-lg border border-neutral-200 py-2 w-40 z-10">
                  <button
                    onClick={() => {
                      setShowEditModal(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
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
          )}
        </div>
        
        {/* Detalhes do Evento */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatTime(event.hora)}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{event.local}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{event.participantes_count || 0} pessoas confirmadas</span>
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-neutral-600 hover:text-secondary-500 transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-sm">Curtir</span>
            </button>
            <button className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">Comentar</span>
            </button>
            <button className="flex items-center gap-2 text-neutral-600 hover:text-accent-500 transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="text-sm">Compartilhar</span>
            </button>
          </div>
          
          {!isOrganizer && (
            <button 
              onClick={handleParticipation}
              disabled={participationLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                event.user_participando
                  ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                  : 'btn-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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
            <div className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
              Seu evento
            </div>
          )}
        </div>
        
      </div>

      {/* Modal de Edição */}
      <EventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        event={event}
        mode="edit"
      />

      {/* Modal de Visualização */}
      <EventModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        event={event}
        mode="view"
      />
    </div>
  )
}