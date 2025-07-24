'use client';

import Image from 'next/image';
import { useState } from 'react';

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
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Validar se a URL é válida
  if (!src || src.trim() === '') {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className={`bg-neutral-200 flex items-center justify-center ${className}`}>
        <span className="text-neutral-500 text-sm">Sem imagem</span>
      </div>
    );
  }

  // Se houve erro na imagem, mostrar fallback
  if (imageError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    // Fallback padrão se não foi fornecido
    return (
      <div className={`bg-neutral-200 flex items-center justify-center ${className}`}>
        <span className="text-neutral-500 text-sm">Imagem não disponível</span>
      </div>
    );
  }

  // Props base para todas as imagens
  const baseProps = {
    src,
    alt,
    className: `${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onError: () => setImageError(true),
    onLoad: () => setImageLoading(false),
    priority,
    placeholder
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