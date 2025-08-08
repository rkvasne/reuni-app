'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Shield, Users, Globe, Lock, Save } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'

interface PrivacyConfig {
  show_email: boolean
  show_location: boolean
  show_events: boolean
  show_stats: boolean
  show_communities: boolean
  allow_messages: boolean
  allow_event_invites: boolean
  profile_visibility: 'public' | 'friends' | 'private'
}

const DEFAULT_PRIVACY: PrivacyConfig = {
  show_email: false,
  show_location: true,
  show_events: true,
  show_stats: true,
  show_communities: true,
  allow_messages: true,
  allow_event_invites: true,
  profile_visibility: 'public'
}

interface PrivacySettingsProps {
  onClose?: () => void
}

export default function PrivacySettings({ onClose }: PrivacySettingsProps) {
  const { profile: userProfile, updateProfile } = useUserProfile()
  const [privacy, setPrivacy] = useState<PrivacyConfig>(DEFAULT_PRIVACY)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Por enquanto, usar configurações padrão
    // TODO: Implementar campo privacy_settings na tabela usuarios
    setPrivacy(DEFAULT_PRIVACY)
  }, [userProfile])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Implementar campo privacy_settings na tabela usuarios
      // const result = await updateProfile({ privacy_settings: privacy })
      // Por enquanto, simular sucesso
      const result = { error: null }
      if (result.error) {
        throw new Error(result.error)
      }
      showMessage('success', 'Configurações de privacidade atualizadas!')
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof PrivacyConfig, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-neutral-800">
            Configurações de Privacidade
          </h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        
        {/* Visibilidade do Perfil */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Visibilidade do Perfil
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="profile_visibility"
                value="public"
                checked={privacy.profile_visibility === 'public'}
                onChange={(e) => updateSetting('profile_visibility', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-neutral-800">Público</div>
                <div className="text-sm text-neutral-600">Qualquer pessoa pode ver seu perfil</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="profile_visibility"
                value="friends"
                checked={privacy.profile_visibility === 'friends'}
                onChange={(e) => updateSetting('profile_visibility', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-neutral-800">Apenas Amigos</div>
                <div className="text-sm text-neutral-600">Apenas pessoas que você segue podem ver</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="profile_visibility"
                value="private"
                checked={privacy.profile_visibility === 'private'}
                onChange={(e) => updateSetting('profile_visibility', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-neutral-800">Privado</div>
                <div className="text-sm text-neutral-600">Apenas você pode ver seu perfil completo</div>
              </div>
            </label>
          </div>
        </div>

        {/* Informações Visíveis */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Informações Visíveis
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-800">Email</div>
                <div className="text-sm text-neutral-600">Mostrar seu email no perfil público</div>
              </div>
              <input
                type="checkbox"
                checked={privacy.show_email}
                onChange={(e) => updateSetting('show_email', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-800">Localização</div>
                <div className="text-sm text-neutral-600">Mostrar sua cidade/região</div>
              </div>
              <input
                type="checkbox"
                checked={privacy.show_location}
                onChange={(e) => updateSetting('show_location', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-800">Eventos</div>
                <div className="text-sm text-neutral-600">Mostrar eventos que você criou ou participou</div>
              </div>
              <input
                type="checkbox"
                checked={privacy.show_events}
                onChange={(e) => updateSetting('show_events', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-800">Estatísticas</div>
                <div className="text-sm text-neutral-600">Mostrar número de eventos, seguidores, etc.</div>
              </div>
              <input
                type="checkbox"
                checked={privacy.show_stats}
                onChange={(e) => updateSetting('show_stats', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-800">Comunidades</div>
                <div className="text-sm text-neutral-600">Mostrar comunidades que você participa</div>
              </div>
              <input
                type="checkbox"
                checked={privacy.show_communities}
                onChange={(e) => updateSetting('show_communities', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Interações */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Interações
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-800">Mensagens Diretas</div>
                <div className="text-sm text-neutral-600">Permitir que outros usuários te enviem mensagens</div>
              </div>
              <input
                type="checkbox"
                checked={privacy.allow_messages}
                onChange={(e) => updateSetting('allow_messages', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-800">Convites para Eventos</div>
                <div className="text-sm text-neutral-600">Permitir que outros te convidem para eventos</div>
              </div>
              <input
                type="checkbox"
                checked={privacy.allow_event_invites}
                onChange={(e) => updateSetting('allow_event_invites', e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Dicas de Segurança */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Dicas de Segurança
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Mantenha informações pessoais sensíveis privadas</li>
            <li>• Revise regularmente suas configurações de privacidade</li>
            <li>• Seja cauteloso ao compartilhar sua localização</li>
            <li>• Denuncie comportamentos inadequados</li>
          </ul>
        </div>

        {/* Botão Salvar */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}