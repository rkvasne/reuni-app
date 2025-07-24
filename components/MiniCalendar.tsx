'use client';

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';

interface MiniCalendarProps {
  onDateSelect?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  className?: string;
}

export default function MiniCalendar({
  onDateSelect,
  onEventClick,
  className = ""
}: MiniCalendarProps) {
  const {
    selectedDate,
    currentMonth,
    loading,
    calendarDays,
    eventsForSelectedDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate
  } = useCalendar();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleDateClick = (date: Date) => {
    selectDate(date);
    onDateSelect?.(date);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 ${className}`}>
      {/* Header do calendário */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Calendário
          </h3>
          <button
            onClick={goToToday}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Hoje
          </button>
        </div>

        {/* Navegação do mês */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 text-neutral-600" />
          </button>
          
          <span className="font-medium text-sm text-neutral-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="p-4">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-neutral-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              disabled={loading}
              className={`
                relative h-8 text-xs font-medium rounded transition-all
                ${day.isCurrentMonth 
                  ? 'text-neutral-800 hover:bg-neutral-100' 
                  : 'text-neutral-400 hover:bg-neutral-50'
                }
                ${day.isToday 
                  ? 'bg-primary-100 text-primary-700 font-bold' 
                  : ''
                }
                ${day.isSelected 
                  ? 'bg-primary-500 text-white hover:bg-primary-600' 
                  : ''
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {day.day}
              
              {/* Indicadores de eventos */}
              {day.eventCount > 0 && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {day.eventCount <= 3 ? (
                    // Mostrar dots individuais para até 3 eventos
                    Array.from({ length: day.eventCount }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          day.isSelected 
                            ? 'bg-white' 
                            : day.hasUserEvents 
                              ? 'bg-primary-500' 
                              : 'bg-neutral-400'
                        }`}
                      />
                    ))
                  ) : (
                    // Mostrar número para mais de 3 eventos
                    <div
                      className={`text-xs font-bold ${
                        day.isSelected 
                          ? 'text-white' 
                          : day.hasUserEvents 
                            ? 'text-primary-500' 
                            : 'text-neutral-400'
                      }`}
                    >
                      {day.eventCount}
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Eventos da data selecionada */}
      {eventsForSelectedDate.length > 0 && (
        <div className="border-t border-neutral-100 p-4">
          <h4 className="font-medium text-sm text-neutral-800 mb-3">
            Eventos em {selectedDate.toLocaleDateString('pt-BR', { 
              day: 'numeric', 
              month: 'long' 
            })}
          </h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {eventsForSelectedDate.map(event => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    event.user_participando ? 'bg-primary-500' : 'bg-neutral-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate group-hover:text-primary-600">
                      {event.titulo}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>{formatTime(event.hora)}</span>
                      <span>•</span>
                      <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium">
                        {event.categoria}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado de loading */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}