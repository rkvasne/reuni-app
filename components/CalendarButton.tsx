'use client';

import { useState, useRef } from 'react';
import { Calendar } from 'lucide-react';
import CalendarDropdown from './CalendarDropdown';
import CalendarModal from './CalendarModal';

interface CalendarButtonProps {
  onDateSelect?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  variant?: 'dropdown' | 'modal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CalendarButton({
  onDateSelect,
  onEventClick,
  variant = 'dropdown',
  size = 'md',
  className = ""
}: CalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect?.(date);
    setIsOpen(false);
  };

  const handleEventClick = (eventId: string) => {
    onEventClick?.(eventId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${sizeClasses[size]} 
          bg-white hover:bg-neutral-50 border border-neutral-200 
          rounded-lg transition-colors flex items-center justify-center
          ${className}
        `}
        title="Abrir calendário"
      >
        <Calendar className={`${iconSizes[size]} text-neutral-600`} />
      </button>

      {variant === 'dropdown' ? (
        <CalendarDropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          anchorRef={buttonRef}
        />
      ) : (
        <CalendarModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
        />
      )}
    </div>
  );
}