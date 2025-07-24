'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import MiniCalendar from './MiniCalendar';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
}

export default function CalendarModal({
  isOpen,
  onClose,
  onDateSelect,
  onEventClick
}: CalendarModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleDateSelect = (date: Date) => {
    onDateSelect?.(date);
    onClose(); // Fechar modal após selecionar data
  };

  const handleEventClick = (eventId: string) => {
    onEventClick?.(eventId);
    onClose(); // Fechar modal após clicar em evento
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-800">
            Calendário de Eventos
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
        
        {/* Calendário */}
        <div className="overflow-y-auto">
          <MiniCalendar
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            className="border-0 rounded-none"
          />
        </div>
        
        {/* Footer com instruções */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          <div className="flex items-center gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full" />
              <span>Você vai participar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neutral-400 rounded-full" />
              <span>Outros eventos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}