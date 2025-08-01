/**
 * Utilitários para manipulação de imagens
 */

// Domínios permitidos para imagens
const ALLOWED_DOMAINS = [
  'images.unsplash.com',
  'via.placeholder.com',
  'sihrwhrnswbodpxkrinz.supabase.co',
  'images.sympla.com.br',
  'discovery-next.svc.sympla.com.br',
  'assets.bileto.sympla.com.br',
  'img.evbuc.com',
  'eventbrite.com',
  'sympla.com.br',
  'cdn.eventbrite.com'
];

/**
 * Valida se uma URL de imagem é válida e de um domínio permitido
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Limpa e valida uma URL de imagem
 */
export function sanitizeImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove espaços em branco
  const cleanUrl = url.trim();
  
  // Aceitar data URLs (base64)
  if (cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }
  
  // Verifica se é uma URL válida
  if (!isValidImageUrl(cleanUrl)) {
    return null;
  }

  return cleanUrl;
}

/**
 * Gera uma URL de placeholder para imagens com erro
 */
export function getPlaceholderImage(width: number = 400, height: number = 300): string {
  return `https://via.placeholder.com/${width}x${height}/e5e7eb/9ca3af?text=Imagem+Indisponível`;
}

/**
 * Converte URLs de imagem para versões otimizadas quando possível
 */
export function optimizeImageUrl(url: string, width?: number): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    
    // Otimizações específicas por domínio
    if (urlObj.hostname.includes('sympla.com.br')) {
      // Sympla: trocar -xs por tamanho apropriado
      if (width && width > 300) {
        return url.replace('-xs.', '-lg.');
      } else if (width && width > 150) {
        return url.replace('-xs.', '-md.');
      }
    }
    
    if (urlObj.hostname.includes('eventbrite.com')) {
      // Eventbrite: adicionar parâmetros de redimensionamento
      if (width) {
        urlObj.searchParams.set('w', width.toString());
        urlObj.searchParams.set('auto', 'format,compress');
        return urlObj.toString();
      }
    }

    return url;
  } catch {
    return url;
  }
}