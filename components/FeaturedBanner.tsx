'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface FeaturedEvent {
  id: string;
  titulo: string;
  local: string; // Antigo: descricao - agora é o local do evento
  data: string;
  hora: string;
  cidade: string; // Antigo: local - agora é a cidade/UF
  categoria: string;
  imagem_url?: string;
  organizador?: {
    nome: string;
    avatar?: string;
  };
  participantes_count: number;
  destaque_motivo?: string;
}

interface FeaturedBannerProps {
  events: FeaturedEvent[];
  loading?: boolean;
  onEventClick?: (event: FeaturedEvent) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

export default function FeaturedBanner({
  events,
  loading = false,
  onEventClick,
  autoPlay = true,
  autoPlayInterval = 5000,
  className = ""
}: FeaturedBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !events || events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, events]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  if (loading) {
    return (
      <div className={`relative h-80 bg-neutral-200 rounded-xl animate-pulse ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-300 to-neutral-200 rounded-xl"></div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={`relative h-80 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Calendar className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary-700 mb-2">Nenhum evento em destaque</h3>
          <p className="text-primary-600">Eventos em destaque aparecerão aqui</p>
        </div>
      </div>
    );
  }

  const currentEvent = events[currentIndex];

  return (
    <div className={`relative h-80 rounded-xl overflow-hidden group ${className}`}>
      {/* Imagem de fundo */}
      <div className="absolute inset-0">
        {currentEvent.imagem_url ? (
          <OptimizedImage
            src={currentEvent.imagem_url}
            alt={currentEvent.titulo}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            fallback={
              <div className="w-full h-full bg-gradient-to-r from-primary-500 to-secondary-500"></div>
            }
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-500 to-secondary-500"></div>
        )}
        
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Conteúdo */}
      <div className="relative h-full flex items-end p-8">
        <div className="text-white max-w-2xl">
          {/* Badge de destaque */}
          {currentEvent.destaque_motivo && (
            <div className="inline-block bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
              {currentEvent.destaque_motivo}
            </div>
          )}
          
          {/* Categoria */}
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
            {currentEvent.categoria}
          </div>
          
          {/* Título */}
          <h2 className="text-3xl font-bold mb-3 line-clamp-2">
            {currentEvent.titulo}
          </h2>
          
          {/* Local */}
          <p className="text-white/90 mb-4 line-clamp-2">
            {currentEvent.local}
          </p>
          
          {/* Informações do evento */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(currentEvent.data)} • {formatTime(currentEvent.hora)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{currentEvent.cidade}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{currentEvent.participantes_count} participantes</span>
            </div>
          </div>
          
          {/* Botão de ação */}
          <button
            onClick={() => onEventClick?.(currentEvent)}
            className="bg-white text-neutral-800 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Ver Detalhes
          </button>
        </div>
      </div>

      {/* Navegação */}
      {events.length > 1 && (
        <>
          {/* Botões de navegação */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Evento anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Próximo evento"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Ir para evento ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}