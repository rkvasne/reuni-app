'use client';

import { useEffect, useState } from 'react';

interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export default function FadeTransition({
  show,
  children,
  duration = 300,
  className = ""
}: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Pequeno delay para trigger da animação
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Aguardar animação terminar antes de remover do DOM
      setTimeout(() => setShouldRender(false), duration);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`
        transition-all ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${className}
      `}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}