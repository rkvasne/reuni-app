'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Crop, RotateCcw, Check, X } from 'lucide-react'

interface ImageCropProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
  aspectRatio?: number // 1 para quadrado, 16/9 para widescreen, etc.
}

export default function ImageCrop({ 
  imageUrl, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 1 
}: ImageCropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, rect.width - crop.width))
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, rect.height - crop.height))

    setCrop(prev => ({ ...prev, x: newX, y: newY }))
  }, [isDragging, dragStart, crop.width, crop.height])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Event listeners para mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const image = imageRef.current

    if (!ctx) return

    // Configurar canvas com o tamanho do crop
    canvas.width = crop.width
    canvas.height = crop.height

    // Desenhar a parte cortada da imagem
    ctx.drawImage(
      image,
      crop.x, crop.y, crop.width, crop.height, // source
      0, 0, crop.width, crop.height // destination
    )

    // Converter para blob e criar URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob)
        onCropComplete(croppedUrl)
      }
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Ajustar Imagem
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Área de Crop */}
        <div className="p-6">
          <div className="relative inline-block">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Imagem para crop"
              className="max-w-full max-h-96 object-contain"
              onLoad={() => {
                if (imageRef.current) {
                  const rect = imageRef.current.getBoundingClientRect()
                  const size = Math.min(rect.width, rect.height) * 0.8
                  setCrop({
                    x: (rect.width - size) / 2,
                    y: (rect.height - size) / 2,
                    width: size,
                    height: size / aspectRatio
                  })
                }
              }}
            />
            
            {/* Overlay de Crop */}
            <div
              className="absolute border-2 border-primary-500 bg-primary-500/20 cursor-move"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Cantos para redimensionar */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 rounded-full cursor-nw-resize" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full cursor-ne-resize" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-500 rounded-full cursor-sw-resize" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 rounded-full cursor-se-resize" />
            </div>
          </div>

          {/* Instruções */}
          <p className="text-sm text-neutral-600 mt-4 text-center">
            Arraste a área de seleção para posicionar o crop da imagem
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-3 p-6 border-t border-neutral-200">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Aplicar Crop
          </button>
        </div>

        {/* Canvas oculto para processamento */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}