'use client'

import { useState, useEffect } from 'react'
import { Users, User } from 'lucide-react'
import Image from 'next/image'
import { useEvents } from '@/hooks/useEvents'

interface ParticipantsListProps {
  eventId: string
  showCount?: boolean
  maxVisible?: number
}

interface Participant {
  id: string
  usuario: {
    nome: string
    email: string
    avatar?: string
  }
}

export default function ParticipantsList({ 
  eventId, 
  showCount = true, 
  maxVisible = 5 
}: ParticipantsListProps) {
  const { getEventParticipants } = useEvents()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true)
      const result = await getEventParticipants(eventId)
      if (result.data) {
        setParticipants(result.data)
      }
      setLoading(false)
    }

    fetchParticipants()
  }, [eventId, getEventParticipants])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Users className="w-4 h-4" />
        <span className="text-sm">Carregando participantes...</span>
      </div>
    )
  }

  const visibleParticipants = showAll ? participants : participants.slice(0, maxVisible)
  const remainingCount = participants.length - maxVisible

  return (
    <div className="space-y-3">
      {showCount && (
        <div className="flex items-center gap-2 text-neutral-700">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">
            {participants.length} {participants.length === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}
          </span>
        </div>
      )}

      {participants.length > 0 ? (
        <div className="space-y-2">
          {/* Lista de participantes */}
          <div className="flex flex-wrap gap-2">
            {visibleParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2"
              >
                {participant.usuario.avatar ? (
                  <Image
                    src={participant.usuario.avatar}
                    alt={participant.usuario.nome}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-sm text-neutral-700">
                  {participant.usuario.nome}
                </span>
              </div>
            ))}
          </div>

          {/* Botão para mostrar mais/menos */}
          {participants.length > maxVisible && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showAll 
                ? 'Mostrar menos' 
                : `Ver mais ${remainingCount} ${remainingCount === 1 ? 'pessoa' : 'pessoas'}`
              }
            </button>
          )}
        </div>
      ) : (
        <div className="text-sm text-neutral-500 italic">
          Nenhuma pessoa confirmou presença ainda
        </div>
      )}
    </div>
  )
}