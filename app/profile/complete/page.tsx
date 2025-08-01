'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { User } from 'lucide-react'
import OptimizedImage from '@/components/OptimizedImage'
import SimpleImageUpload from '@/components/SimpleImageUpload'
import Toast from '@/components/Toast'

export default function CompleteProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading, updateProfile } = useUserProfile()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    nome: '',
    avatar: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verificar se o perfil já está completo (nome E avatar)
  const isProfileComplete = userProfile && 
    userProfile.nome && 
    userProfile.nome.trim() !== '' && 
    userProfile.avatar && 
    userProfile.avatar.trim() !== ''

  useEffect(() => {
    // Se não estiver autenticado, redirecionar para login
    if (!authLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    // Se o perfil já estiver completo, redirecionar para o app
    if (!profileLoading && isProfileComplete) {
      router.push('/')
      return
    }

    // Preencher formulário com dados existentes
    if (userProfile) {
      setFormData({
        nome: userProfile.nome || '',
        avatar: userProfile.avatar || ''
      })
    }
  }, [authLoading, isAuthenticated, profileLoading, userProfile, isProfileComplete, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Limpar erro quando usuário digita
  }

  const validateForm = () => {
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return false
    }
    if (formData.nome.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres')
      return false
    }
    if (!formData.avatar.trim()) {
      setError('Foto de perfil é obrigatória')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setError('')

    try {
      const updates: { nome: string; avatar?: string } = {
        nome: formData.nome.trim()
      }
      
      if (formData.avatar.trim()) {
        updates.avatar = formData.avatar.trim()
      }

      const { error: updateError } = await updateProfile(updates)

      if (updateError) {
        setError(updateError)
      } else {
        setSuccess(true)
        // Redirecionar após 1.5 segundos para mostrar o toast de sucesso
        setTimeout(() => {
          router.push('/')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading states
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Reuni
          </h2>
          <p className="text-neutral-600 mt-2">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado ou perfil já completo, não renderizar nada
  if (!isAuthenticated || isProfileComplete) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Complete seu Perfil
          </h1>
          <p className="text-neutral-600">
            Precisamos de algumas informações para personalizar sua experiência
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
                         {/* Avatar */}
             <div className="space-y-3">
               <label className="block text-sm font-medium text-neutral-700">
                 Foto de Perfil *
               </label>
               
               {/* Preview do avatar atual */}
               {formData.avatar && (
                 <div className="flex items-center justify-center">
                   <div className="relative">
                     <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center">
                       <OptimizedImage
                         src={formData.avatar}
                         alt="Avatar"
                         width={80}
                         height={80}
                         className="w-full h-full object-cover"
                         fallback={
                           <User className="w-8 h-8 text-neutral-400" />
                         }
                       />
                     </div>
                   </div>
                 </div>
               )}
               
                               {/* Componente de upload */}
                <SimpleImageUpload
                  value={formData.avatar}
                  onChange={(url) => handleInputChange('avatar', url)}
                  onRemove={() => handleInputChange('avatar', '')}
                  maxSize={5}
                  placeholder="Clique para fazer upload da sua foto ou arraste uma imagem"
                  className="w-full"
                />
               
               <p className="text-xs text-neutral-500">
                 Faça upload de uma foto do seu computador ou cole uma URL (obrigatório)
               </p>
             </div>

            {/* Nome */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">
                Nome Completo *
              </label>
              <input
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </div>
              ) : (
                'Salvar e Continuar'
              )}
            </button>
          </form>
        </div>

        {/* Toast de Sucesso */}
        <Toast
          type="success"
          message="Perfil salvo com sucesso!"
          isVisible={success}
          onClose={() => setSuccess(false)}
        />

        {/* Toast de Erro */}
        <Toast
          type="error"
          message={error}
          isVisible={!!error}
          onClose={() => setError('')}
        />
      </div>
    </div>
  )
} 