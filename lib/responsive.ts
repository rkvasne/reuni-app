// Breakpoints e utilitários para responsividade

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Hook para detectar breakpoint atual
import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else {
        setBreakpoint('sm');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Utilitários para responsividade
export const responsive = {
  isMobile: (breakpoint: Breakpoint) => ['sm'].includes(breakpoint),
  isTablet: (breakpoint: Breakpoint) => ['md'].includes(breakpoint),
  isDesktop: (breakpoint: Breakpoint) => ['lg', 'xl', '2xl'].includes(breakpoint),
  
  // Configurações específicas por dispositivo
  slider: {
    itemsVisible: {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 4
    },
    itemWidth: {
      sm: '280px',
      md: '260px',
      lg: '280px',
      xl: '300px',
      '2xl': '320px'
    }
  },
  
  sidebar: {
    width: {
      sm: '100%',
      md: '280px',
      lg: '320px',
      xl: '340px',
      '2xl': '360px'
    }
  }
};