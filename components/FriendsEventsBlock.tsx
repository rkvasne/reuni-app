'use client';

import { useFriendsEvents } from '@/hooks/useFriendsEvents';
import CompactEventCard from './CompactEventCard';
import { Calendar } from 'lucide-react';

interface FriendsEventsBlockProps {
  maxEvents?: number;
}

export default function FriendsEventsBlock({ maxEvents = 3 }: FriendsEventsBlockProps) {
  const { events, loading, error } = useFriendsEvents();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: maxEvents }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-neutral-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-600">
          Seus amigos ainda não confirmaram presença em eventos
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Convide-os para participar!
        </p>
      </div>
    );
  }

  const displayEvents = events.slice(0, maxEvents);

  return (
    <div className="space-y-3">
      {displayEvents.map((event) => (
        <div key={event.id} className="group">
          {/* Amigos participando */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-1">
              {event.friends_going.slice(0, 3).map(friend => (
                <div key={friend.id} className="relative">
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt={friend.nome}
                      className="w-5 h-5 rounded-full border border-white object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-primary-500 rounded-full border border-white flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {friend.nome.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-neutral-600">
              {event.friends_count} amigo{event.friends_count > 1 ? 's' : ''} {event.friends_count > 1 ? 'vão' : 'vai'}
            </span>
          </div>

          {/* Card do evento compacto */}
          <CompactEventCard
            event={{
              id: event.id,
              titulo: event.titulo,
              data: event.data,
              hora: event.hora,
              local: event.local,
              categoria: event.categoria,
              imagem_url: event.imagem_url,
              participantes_count: event.participantes_count,
              friends_going: event.friends_going
            }}
            showFriends={false} // Já mostramos acima
            onClick={() => {
              // TODO: Abrir modal de detalhes do evento
              console.log('Evento clicado:', event);
            }}
          />
        </div>
      ))}

      {/* Ver mais eventos */}
      {events.length > maxEvents && (
        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2 hover:bg-primary-50 rounded-lg transition-colors">
          Ver mais {events.length - maxEvents} eventos
        </button>
      )}
    </div>
  );
}