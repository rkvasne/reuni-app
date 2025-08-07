'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { sanitizeImageUrl, optimizeImageUrl, getPlaceholderImage } from '@/utils/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;  
  placeholder?: 'blur' | 'empty';
  fallback?: React.ReactNode;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes,
  priority = false,
  placeholder = 'empty',
  fallback
}: OptimizedImageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Não renderizar até estar montado no cliente
  if (!mounted) {
    return (
      <div className={`bg-neutral-200 animate-pulse ${className}`}>
        <div className="w-full h-full bg-neutral-300 rounded"></div>
      </div>
    );
  }

  // Sanitizar e otimizar a URL da imagem
  const sanitizedSrc = sanitizeImageUrl(src);
  const optimizedSrc = sanitizedSrc ? optimizeImageUrl(sanitizedSrc, width) : null;

  // Se a URL não é válida, usar placeholder
  if (!optimizedSrc) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className={`bg-neutral-200 flex items-center justify-center ${className}`}>
        <span className="text-neutral-500 text-sm">Imagem não disponível</span>
      </div>
    );
  }

  // Se é uma data URL (base64), usar img normal em vez do Next.js Image
  if (optimizedSrc.startsWith('data:')) {
    return (
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : {}}
      />
    );
  }

  // Props base para todas as imagens
  const baseProps = {
    src: optimizedSrc,
    alt,
    className,
    priority,
    placeholder,
    unoptimized: false
  };

  // Se usar fill
  if (fill) {
    return (
      <Image
        {...baseProps}
        fill
        sizes={sizes || '100vw'}
      />
    );
  }

  // Se usar width/height específicos
  if (width && height) {
    return (
      <Image
        {...baseProps}
        width={width}
        height={height}
      />
    );
  }

  // Fallback para casos não especificados
  return (
    <Image
      {...baseProps}
      width={400}
      height={300}
      sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
    />
  );
}