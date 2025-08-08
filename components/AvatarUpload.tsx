'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Check } from 'lucide-react'
import Image from 'next/image'
import { useUserProfile } from '@/hooks/useUserProfile'
import ImageUpload from './ImageUpload'

interface AvatarUploadProps {
  currentAvatar?: string
  userName: string
  onClose?: () => void
}

export default function AvatarUpload({ currentAvatar, userName, onClose }: AvatarUploadProps) {
  const { updateProfile } = useUserProfile()
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarUrl.trim()) return

    setLoading(true)
    try {
      const result = await updateProfile({ avatar_url: avatarUrl.trim() })
      if (result.error) {
        throw new Error(result.error)
      }
      showMessage('success', 'Avatar atualizado com sucesso!')
      setTimeout(() => onClose?.(), 1500)
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao atualizar avatar')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (url: string) => {
    setLoading(true)
    try {
      const result = await updateProfile({ avatar_url: url })
      if (result.error) {
        throw new Error(result.error)
      }
      setAvatarUrl(url)
      showMessage('success', 'Avatar atualizado com sucesso!')
      setTimeout(() => onClose?.(), 1500)
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao atualizar avatar')
    } finally {
      setLoading(false)
    }
  }

  const handleImageRemove = () => {
    setAvatarUrl('')
  }

  const handleRemoveAvatar = async () => {
    setLoading(true)
    try {
      const result = await updateProfile({ avatar_url: '' })
      if (result.error) {
        throw new Error(result.error)
      }
      setAvatarUrl('')
      showMessage('success', 'Avatar removido com sucesso!')
      setTimeout(() => onClose?.(), 1500)
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao remover avatar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800">
            Alterar Avatar
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          
          {/* Mensagem de feedback */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Preview do Avatar */}
          <div className="text-center">
            <div className="relative inline-block">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={userName}
                  width={120}
                  height={120}
                  className="rounded-full"
                  onError={() => {
                    setAvatarUrl('')
                    showMessage('error', 'Erro ao carregar imagem. Verifique a URL.')
                  }}
                />
              ) : (
                <div className="w-30 h-30 bg-primary-500 rounded-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <p className="text-sm text-neutral-600 mt-2">
              Preview do seu avatar
            </p>
          </div>

          {/* Opções de Upload */}
          <div className="space-y-4">
            
            {/* URL da Imagem */}
            <form onSubmit={handleUrlSubmit}>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                URL da Imagem
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://exemplo.com/sua-foto.jpg"
                />
                <button
                  type="submit"
                  disabled={loading || !avatarUrl.trim()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>

            {/* Upload de Arquivo com ImageUpload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Ou faça upload de uma imagem
              </label>
              <ImageUpload
                value={avatarUrl}
                onChange={handleImageUpload}
                onRemove={handleImageRemove}
                bucket="avatars"
                folder="user-avatars"
                maxSize={5}
                placeholder="Clique para fazer upload ou arraste uma imagem"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            {currentAvatar && (
              <button
                onClick={handleRemoveAvatar}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Remover Avatar
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}