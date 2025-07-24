'use client';

import { useState } from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: boolean;
  hoverShadow?: boolean;
  clickScale?: boolean;
  onClick?: () => void;
}

export default function AnimatedCard({
  children,
  className = "",
  hoverScale = true,
  hoverShadow = true,
  clickScale = true,
  onClick
}: AnimatedCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={`
        transition-all duration-200 ease-out cursor-pointer
        ${hoverScale ? 'hover:scale-[1.02]' : ''}
        ${hoverShadow ? 'hover:shadow-lg' : ''}
        ${clickScale && isPressed ? 'scale-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
}