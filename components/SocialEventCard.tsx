'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, Heart, MessageCircle, Share2, Check } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';

interface User {
  id: string;
  nome: string;
  avatar_url?: string;
}

interface SocialEventCardProps {
  event: {
    id: string;
    titulo: string;
    local: string; // Antigo: descricao - agora é o local do evento
    data: string;
    hora: string;
    cidade: string; // Antigo: local - agora é a cidade/UF
    categoria: string;
    imagem_url?: string;
    organizador_id: string;
    organizador?: User;
    participantes_count: number;
    max_participantes?: number;
    user_participando: boolean;
    friends_going?: User[];
    suggestion_reason?: string;
    source?: string; // Fonte do evento (sympla, eventbrite, etc.)
  };
  showSocialInfo?: boolean;
  compact?: boolean;
  priority?: boolean;
  onClick?: () => void;
}

export default function SocialEventCard({
  event,
  showSocialInfo = true,
  compact = false,
  priority = false,
  onClick
}: SocialEventCardProps) {
  const { user } = useAuth();
  const { participateInEvent, cancelParticipation } = useEvents();
  const [participationLoading, setParticipationLoading] = useState(false);

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
    if (event.local === 'Evento encontrado no eventbrite') {
      return event.cidade;
    }
    
    // Extrair local da descrição (formato: "Local - Cidade, Estado")
    if (event.local.includes(' - ')) {
      return event.local;
    }
    
    return event.local;
  };

  const handleParticipation = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar trigger do onClick do card
    
    if (!user) {
      alert('Você precisa estar logado para participar de eventos');
      return;
    }

    if (event.organizador_id === user.id) {
      alert('Você é o organizador deste evento');
      return;
    }

    setParticipationLoading(true);
    try {
      if (event.user_participando) {
        const result = await cancelParticipation(event.id);
        if (result.error) {
          alert('Erro ao cancelar participação: ' + result.error);
        }
      } else {
        const result = await participateInEvent(event.id);
        if (result.error) {
          alert('Erro ao participar do evento: ' + result.error);
        }
      }
    } catch (error) {
      alert('Erro ao processar participação');
    } finally {
      setParticipationLoading(false);
    }
  };

  const friendsGoing = event.friends_going || [];
  const isOrganizer = user?.id === event.organizador_id;

  return (
    <div 
      className={`card overflow-hidden cursor-pointer transition-transform duration-120 hover:scale-102 ${
        compact ? 'p-3' : 'p-4'
      }`}
      onClick={onClick}
    >
      {/* Imagem do Evento */}
      <div className={`relative bg-neutral-200 rounded-lg overflow-hidden ${
        compact ? 'h-40' : 'h-56'
      }`}>
        {event.imagem_url ? (
          <OptimizedImage
            src={event.imagem_url}
            alt={event.titulo}
            fill
            className="object-cover"
            priority={priority}
            sizes={compact ? "280px" : "(max-width: 768px) 100vw, 33vw"}
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                <Calendar className={`text-primary-400 ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <Calendar className={`text-primary-400 ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
          </div>
        )}
        
        {/* Badge da categoria */}
        <div className="absolute top-2 left-2">
          <span className="bg-primary-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
            {event.categoria}
          </span>
        </div>
        
        {/* Data */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className={`font-bold text-primary-600 ${compact ? 'text-sm' : 'text-lg'}`}>
            {formatDate(event.data).split(' ')[0]}
          </div>
          <div className="text-xs text-neutral-600 uppercase">
            {formatDate(event.data).split(' ')[1]}
          </div>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="mt-3">
        {/* Título e Badge de Fonte */}
        <div className="mb-2">
          <h3 className={`font-semibold text-neutral-800 mb-1 line-clamp-2 ${
            compact ? 'text-sm' : 'text-lg'
          }`}>
            {event.titulo}
          </h3>
          {event.source && (
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
              event.source === 'sympla' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {event.source === 'sympla' ? 'Sympla' : 'Eventbrite'}
            </span>
          )}
        </div>
        
        {/* Informações do evento */}
        <div className={`space-y-1 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatTime(event.hora)}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{getEventLocation()}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{event.participantes_count} pessoas confirmadas</span>
          </div>
        </div>

        {/* Informações sociais */}
        {showSocialInfo && (
          <div className="mb-3">
            {/* Amigos participando */}
            {friendsGoing.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-2">
                  {friendsGoing.slice(0, 3).map(friend => (
                    <div key={friend.id} className="relative">
                  {friend.avatar_url ? (
                        <OptimizedImage
                      src={friend.avatar_url}
                          alt={friend.nome}
                          width={24}
                          height={24}
                          className="rounded-full border-2 border-white object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {friend.nome.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-neutral-600">
                  {friendsGoing.length} amigo{friendsGoing.length > 1 ? 's' : ''} {friendsGoing.length > 1 ? 'vão' : 'vai'} participar
                </span>
              </div>
            )}

            {/* Motivo da sugestão */}
            {event.suggestion_reason && (
              <div className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-lg inline-block mb-2">
                {event.suggestion_reason}
              </div>
            )}
          </div>
        )}
        
        {/* Ações */}
        {!compact && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-neutral-600 hover:text-secondary-500 transition-colors">
                <Heart className="w-4 h-4" />
                <span className="text-sm">Curtir</span>
              </button>
              <button className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Comentar</span>
              </button>
              <button className="flex items-center gap-2 text-neutral-600 hover:text-accent-500 transition-colors">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Compartilhar</span>
              </button>
            </div>
            
            {!isOrganizer && (
              <button 
                onClick={handleParticipation}
                disabled={participationLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
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
        )}

        {/* Botão compacto para versão small */}
        {compact && !isOrganizer && (
          <button 
            onClick={handleParticipation}
            disabled={participationLoading}
            className={`w-full mt-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
              event.user_participando
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'btn-primary'
            } disabled:opacity-50`}
          >
            {participationLoading ? 'Carregando...' : event.user_participando ? 'Confirmado' : 'Eu Vou!'}
          </button>
        )}
      </div>
    </div>
  );
}