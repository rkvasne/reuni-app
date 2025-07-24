'use client';

import { useEffect, useRef } from 'react';
import MiniCalendar from './MiniCalendar';

interface CalendarDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  anchorRef?: React.RefObject<HTMLElement>;
  position?: 'left' | 'right';
}

export default function CalendarDropdown({
  isOpen,
  onClose,
  onDateSelect,
  onEventClick,
  anchorRef,
  position = 'right'
}: CalendarDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  const handleDateSelect = (date: Date) => {
    onDateSelect?.(date);
    onClose(); // Fechar dropdown após selecionar data
  };

  const handleEventClick = (eventId: string) => {
    onEventClick?.(eventId);
    onClose(); // Fechar dropdown após clicar em evento
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`
        absolute top-full mt-2 z-50 w-80 max-h-96 overflow-hidden
        shadow-xl border border-neutral-200 rounded-lg
        ${position === 'right' ? 'right-0' : 'left-0'}
      `}
      style={{
        animation: isOpen ? 'slideDown 0.2s ease-out' : undefined
      }}
    >
      <MiniCalendar
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        className="border-0 rounded-lg"
      />
      
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}