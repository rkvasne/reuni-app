'use client'

import { useState, useEffect } from 'react'
import { Save, User, Mail, Lock, Bell, Shield, Trash2, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { supabase } from '@/lib/supabase'

export default function ProfileSettings() {
  const { user, signOut } = useAuth()
  const { profile: userProfile, updateProfile } = useUserProfile()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form states
  const [profileData, setProfileData] = useState({
    nome: '',
    bio: '',
    avatar_url: ''
  })

  // Atualizar form quando userProfile carrega
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        nome: userProfile.nome || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || ''
      })
    }
  }, [userProfile])

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const result = await updateProfile({
        nome: profileData.nome,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url
      })

      if (result.error) {
        throw new Error(result.error)
      }

      showMessage('success', 'Perfil atualizado com sucesso!')
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      showMessage('success', 'Senha alterada com sucesso!')
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) {
      return
    }

    if (!confirm('ATENÇÃO: Todos os seus eventos e dados serão perdidos permanentemente. Confirma a exclusão?')) {
      return
    }

    setLoading(true)
    try {
      // Primeiro deletar dados do usuário
      const { error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', user?.id)

      if (deleteError) throw deleteError

      // Depois deletar conta do auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '')
      
      if (authError) throw authError

      showMessage('success', 'Conta deletada com sucesso')
      
      // Fazer logout
      setTimeout(() => {
        signOut()
      }, 2000)
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao deletar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Informações do Perfil */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Informações do Perfil
          </h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={profileData.nome}
              onChange={(e) => setProfileData(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              URL do Avatar
            </label>
            <input
              type="url"
              value={profileData.avatar_url}
              onChange={(e) => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="https://exemplo.com/sua-foto.jpg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* Alterar Senha */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Alterar Senha
          </h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Digite a senha novamente"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* Ações da Conta */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Ações da Conta
          </h2>
        </div>

        <div className="space-y-4">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-3 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Deletando...' : 'Deletar Conta'}
          </button>
        </div>
      </div>
    </div>
  )
}