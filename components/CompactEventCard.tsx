'use client';

import { Calendar, MapPin, Users } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface CompactEventCardProps {
  event: {
    id: string;
    titulo: string;
    descricao?: string;
    data: string;
    hora: string;
    local: string;
    categoria: string;
    imagem_url?: string;
    participantes_count: number;
    source?: string; // Fonte do evento (sympla, eventbrite, etc.)
    friends_going?: {
      id: string;
      nome: string;
      avatar_url?: string;
    }[];
  };
  onClick?: () => void;
  showFriends?: boolean;
}

export default function CompactEventCard({
  event,
  onClick,
  showFriends = false
}: CompactEventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getEventLocation = () => {
    if (event.descricao === 'Evento encontrado no eventbrite') {
      return event.local;
    }
    
    // Extrair local da descrição (formato: "Local - Cidade, Estado")
    if (event.descricao && event.descricao.includes(' - ')) {
      return event.descricao;
    }
    
    return event.local;
  };

  const friendsGoing = event.friends_going || [];

  return (
    <div 
      className="card p-3 cursor-pointer transition-transform duration-120 hover:scale-102"
      onClick={onClick}
    >
      {/* Imagem */}
      <div className="relative h-32 bg-neutral-200 rounded-lg overflow-hidden mb-2">
        {event.imagem_url ? (
          <OptimizedImage
            src={event.imagem_url}
            alt={event.titulo}
            fill
            className="object-cover"
            sizes="200px"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-400" />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary-400" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-1 left-1 flex flex-col gap-1">
          <span className="bg-primary-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
            {event.categoria}
          </span>
          {event.source && (
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              event.source === 'sympla' 
                ? 'bg-purple-500 text-white' 
                : 'bg-orange-500 text-white'
            }`}>
              {event.source === 'sympla' ? 'Sympla' : 'Eventbrite'}
            </span>
          )}
        </div>
      </div>
      
      {/* Conteúdo */}
      <div>
        {/* Título */}
        <h4 className="font-medium text-sm text-neutral-800 mb-1 line-clamp-2">
          {event.titulo}
        </h4>
        
        {/* Data e hora */}
        <div className="flex items-center gap-1 text-xs text-neutral-600 mb-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(event.data)} • {formatTime(event.hora)}</span>
        </div>
        
        {/* Local */}
        <div className="flex items-center gap-1 text-xs text-neutral-600 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{getEventLocation()}</span>
        </div>
        
        {/* Participantes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Users className="w-3 h-3" />
            <span>{event.participantes_count}</span>
          </div>
          
          {/* Amigos participando */}
          {showFriends && friendsGoing.length > 0 && (
            <div className="flex -space-x-1">
              {friendsGoing.slice(0, 2).map(friend => (
                <div key={friend.id} className="relative">
                  {friend.avatar_url ? (
                    <OptimizedImage
                      src={friend.avatar_url}
                      alt={friend.nome}
                      width={16}
                      height={16}
                      className="rounded-full border border-white object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 bg-primary-500 rounded-full border border-white flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {friend.nome.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {friendsGoing.length > 2 && (
                <div className="w-4 h-4 bg-neutral-400 rounded-full border border-white flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    +{friendsGoing.length - 2}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}