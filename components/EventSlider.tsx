'use client';

import HorizontalSlider from './ui/HorizontalSlider';
import SocialEventCard from './SocialEventCard';

interface Event {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  local: string;
  categoria: string;
  imagem_url?: string;
  organizador_id: string;
  organizador?: {
    id: string;
    nome: string;
    avatar?: string;
  };
  participantes_count: number;
  max_participantes?: number;
  user_participando: boolean;
  friends_going?: {
    id: string;
    nome: string;
    avatar?: string;
  }[];
  suggestion_reason?: string;
}

interface EventSliderProps {
  events: Event[];
  loading?: boolean;
  showSocialInfo?: boolean;
  onEventClick?: (event: Event) => void;
  emptyMessage?: string;
  className?: string;
}

export default function EventSlider({
  events,
  loading = false,
  showSocialInfo = true,
  onEventClick,
  emptyMessage = "Nenhum evento encontrado",
  className = ""
}: EventSliderProps) {
  
  if (loading) {
    return (
      <div className={`${className}`}>
        <HorizontalSlider showArrows={false}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="card p-4">
                <div className="h-32 bg-neutral-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </HorizontalSlider>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={`text-center py-8 text-neutral-500 ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <HorizontalSlider 
        itemWidth="280px"
        gap="16px"
        showArrows={events.length > 3}
      >
        {events.map((event, index) => (
          <SocialEventCard
            key={event.id}
            event={event}
            showSocialInfo={showSocialInfo}
            compact={true}
            priority={index < 2}
            onClick={() => onEventClick?.(event)}
          />
        ))}
      </HorizontalSlider>
    </div>
  );
}