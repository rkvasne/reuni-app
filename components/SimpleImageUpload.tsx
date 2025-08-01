'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface SimpleImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  maxSize?: number // em MB
  accept?: string
  className?: string
  placeholder?: string
}

export default function SimpleImageUpload({
  value,
  onChange,
  onRemove,
  maxSize = 5,
  accept = 'image/*',
  className = '',
  placeholder = 'Clique para fazer upload ou arraste uma imagem'
}: SimpleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convertFileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Validar tamanho do arquivo
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`Arquivo muito grande. Máximo ${maxSize}MB.`)
      }

      // Validar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas imagens são permitidas.')
      }

      // Converter para data URL (base64)
      const dataUrl = await convertFileToDataURL(file)
      onChange(dataUrl)
      
    } catch (err) {
      console.error('Erro no upload:', err)
      setError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleRemove = () => {
    onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preview da imagem atual */}
      {value && !uploading && (
        <div className="relative inline-block">
          {value.startsWith('data:') ? (
            // Para data URLs, usar img normal (evita warning do Next.js)
            <img
              src={value}
              alt="Preview"
              className="max-h-40 rounded-lg object-cover border border-neutral-200"
            />
          ) : (
            // Para URLs externas, usar img normal também para consistência
            <img
              src={value}
              alt="Preview"
              className="max-h-40 rounded-lg object-cover border border-neutral-200"
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Área de upload */}
      {!value && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-neutral-300 hover:border-neutral-400'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm text-neutral-600">Processando imagem...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-neutral-400" />
                <ImageIcon className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-600">{placeholder}</p>
              <p className="text-xs text-neutral-500">
                Máximo {maxSize}MB • PNG, JPG, GIF
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Input de URL alternativo */}
      {!value && !uploading && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-neutral-500">ou</span>
          </div>
        </div>
      )}

      {!value && !uploading && (
        <input
          type="url"
          placeholder="Cole a URL de uma imagem"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value)
            }
          }}
        />
      )}
    </div>
  )
} 