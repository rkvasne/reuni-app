'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBreakpoint, responsive } from '@/lib/responsive';

interface HorizontalSliderProps {
  children: React.ReactNode[];
  itemWidth?: string;
  gap?: string;
  showArrows?: boolean;
  className?: string;
  enableTouch?: boolean;
}

export default function HorizontalSlider({
  children,
  itemWidth = "280px",
  gap = "16px", 
  showArrows = true,
  className = "",
  enableTouch = true
}: HorizontalSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  const breakpoint = useBreakpoint();
  const isMobile = responsive.isMobile(breakpoint);
  
  // Usar largura responsiva
  const responsiveItemWidth = responsive.slider.itemWidth[breakpoint] || itemWidth;

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = parseInt(responsiveItemWidth) + parseInt(gap);
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Touch/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableTouch || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableTouch || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    checkScrollButtons();
    scrollElement.addEventListener('scroll', checkScrollButtons);
    
    return () => scrollElement.removeEventListener('scroll', checkScrollButtons);
  }, [children]);

  if (!children || children.length === 0) {
    return null;
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Botão Esquerda - Oculto no mobile */}
      {showArrows && canScrollLeft && !isMobile && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Scroll para esquerda"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-600" />
        </button>
      )}

      {/* Container dos items */}
      <div 
        ref={scrollRef}
        className={`flex overflow-x-auto scroll-smooth ${
          isMobile ? 'scrollbar-hide' : 'scrollbar-hide'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ gap }}
        onScroll={checkScrollButtons}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {children.map((child, index) => (
          <div 
            key={index}
            className="flex-shrink-0 select-none"
            style={{ width: responsiveItemWidth }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Botão Direita - Oculto no mobile */}
      {showArrows && canScrollRight && !isMobile && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Scroll para direita"
        >
          <ChevronRight className="w-5 h-5 text-neutral-600" />
        </button>
      )}

      {/* Indicadores de scroll no mobile */}
      {isMobile && children.length > 1 && (
        <div className="flex justify-center mt-3 gap-1">
          {Array.from({ length: Math.ceil(children.length / responsive.slider.itemsVisible[breakpoint]) }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-neutral-300"
            />
          ))}
        </div>
      )}
    </div>
  );
}