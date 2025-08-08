/**
 * Utilitários para processamento de imagens
 * Compressão, redimensionamento e otimização
 */

interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

/**
 * Comprime uma imagem mantendo a qualidade visual
 */
export async function compressImage(
  file: File, 
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // Calcular novas dimensões mantendo aspect ratio
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Configurar canvas
      canvas.width = width
      canvas.height = height

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Converter para blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          // Criar novo arquivo com o blob comprimido
          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, `.${format}`),
            { 
              type: `image/${format}`,
              lastModified: Date.now()
            }
          )

          resolve(compressedFile)
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Valida se um arquivo é uma imagem válida
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Verificar tipo MIME
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Arquivo deve ser uma imagem' }
  }

  // Verificar extensão
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  if (!extension || !validExtensions.includes(extension)) {
    return { valid: false, error: 'Formato de imagem não suportado' }
  }

  // Verificar tamanho (máximo 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'Imagem muito grande (máximo 10MB)' }
  }

  return { valid: true }
}

/**
 * Cria uma versão thumbnail de uma imagem
 */
export async function createThumbnail(
  file: File, 
  size: number = 150
): Promise<File> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg'
  })
}

/**
 * Converte uma imagem para formato WebP (mais eficiente)
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<File> {
  return compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality,
    format: 'webp'
  })
}

/**
 * Gera um nome único para arquivo de imagem
 */
export function generateImageFileName(originalName: string, prefix: string = ''): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${random}.${extension}`
}

/**
 * Calcula o aspect ratio de uma imagem
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

/**
 * Redimensiona dimensões mantendo aspect ratio
 */
export function resizeWithAspectRatio(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight
  
  let width = originalWidth
  let height = originalHeight
  
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }
  
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * Sanitiza URL de imagem para evitar XSS
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return ''
  
  // Verificar se é uma URL válida
  try {
    const parsedUrl = new URL(url)
    
    // Permitir apenas protocolos seguros
    if (!['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) {
      return ''
    }
    
    return url
  } catch {
    // Se não é uma URL válida, retornar vazio
    return ''
  }
}

/**
 * Otimiza URL de imagem para diferentes tamanhos
 */
export function optimizeImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return ''
  
  // Se é uma URL do Supabase Storage, adicionar parâmetros de otimização
  if (url.includes('supabase')) {
    const separator = url.includes('?') ? '&' : '?'
    let params = ''
    
    if (width) params += `width=${width}&`
    if (height) params += `height=${height}&`
    
    if (params) {
      return `${url}${separator}${params.slice(0, -1)}`
    }
  }
  
  return url
}

/**
 * Gera uma imagem placeholder baseada no texto
 */
export function getPlaceholderImage(text: string, width: number = 400, height: number = 300): string {
  // Criar um canvas para gerar o placeholder
  if (typeof window === 'undefined') {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
          ${text}
        </text>
      </svg>
    `)}`
  }
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''
  
  // Background
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, width, height)
  
  // Text
  ctx.fillStyle = '#9ca3af'
  ctx.font = '16px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  
  return canvas.toDataURL()
}

/**
 * Detecta se uma imagem precisa ser rotacionada baseado nos dados EXIF
 */
export function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const dataView = new DataView(arrayBuffer)
      
      // Verificar se é JPEG
      if (dataView.getUint16(0) !== 0xFFD8) {
        resolve(1) // Orientação normal
        return
      }
      
      let offset = 2
      let marker = dataView.getUint16(offset)
      
      while (marker !== 0xFFE1 && offset < dataView.byteLength) {
        offset += 2 + dataView.getUint16(offset + 2)
        marker = dataView.getUint16(offset)
      }
      
      if (marker !== 0xFFE1) {
        resolve(1)
        return
      }
      
      // Procurar por dados EXIF
      offset += 4
      if (dataView.getUint32(offset) !== 0x45786966) {
        resolve(1)
        return
      }
      
      // Encontrar orientação
      const little = dataView.getUint16(offset + 6) === 0x4949
      offset += 6
      
      const tags = dataView.getUint16(offset + 2, little)
      offset += 4
      
      for (let i = 0; i < tags; i++) {
        const tag = dataView.getUint16(offset + i * 12, little)
        if (tag === 0x0112) { // Orientation tag
          const orientation = dataView.getUint16(offset + i * 12 + 8, little)
          resolve(orientation)
          return
        }
      }
      
      resolve(1)
    }
    
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)) // Ler apenas os primeiros 64KB
  })
}