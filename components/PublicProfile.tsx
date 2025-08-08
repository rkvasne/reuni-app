'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, MapPin, Users, Eye, EyeOff, Settings, Share2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface UserProfile {
  id: string
  nome: string
  email: string
  avatar?: string
  bio?: string
  localizacao?: string
  data_nascimento?: string
  created_at: string
  privacy_settings?: {
    show_email: boolean
    show_location: boolean
    show_events: boolean
    show_stats: boolean
  }
}

interface UserStats {
  events_created: number
  events_attended: number
  communities_joined: number
  followers: number
  following: number
}

interface PublicProfileProps {
  userId: string
  onClose?: () => void
}

export default function PublicProfile({ userId, onClose }: PublicProfileProps) {
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwnProfile = currentUser?.id === userId

  const loadProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadStats = useCallback(async () => {
    try {
      const [eventsCreated, eventsAttended, communitiesJoined] = await Promise.all([
        supabase
          .from('eventos')
          .select('id', { count: 'exact' })
          .eq('criador_id', userId),
        supabase
          .from('presencas')
          .select('id', { count: 'exact' })
          .eq('usuario_id', userId),
        supabase
          .from('membros_comunidade')
          .select('id', { count: 'exact' })
          .eq('usuario_id', userId)
      ])

      setStats({
        events_created: eventsCreated.count || 0,
        events_attended: eventsAttended.count || 0,
        communities_joined: communitiesJoined.count || 0,
        followers: 0,
        following: 0
      })
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }, [userId])

  const checkFollowStatus = useCallback(async () => {
    setIsFollowing(false)
  }, [])

  useEffect(() => {
    loadProfile()
    loadStats()
    if (currentUser && !isOwnProfile) {
      checkFollowStatus()
    }
  }, [userId, currentUser, isOwnProfile, loadProfile, loadStats, checkFollowStatus])

  

  const handleFollow = async () => {
    if (!currentUser || isOwnProfile) return

    setFollowLoading(true)
    try {
      // TODO: Implementar sistema de seguidores
      setIsFollowing(!isFollowing)
    } catch (err) {
      console.error('Erro ao seguir/desseguir:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${profile?.nome}`,
          text: `Confira o perfil de ${profile?.nome} no Reuni`,
          url: window.location.href
        })
      } catch (err) {
        // Usuário cancelou o compartilhamento
      }
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href)
      // TODO: Mostrar toast de sucesso
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          {error || 'Perfil não encontrado'}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
          >
            Voltar
          </button>
        )}
      </div>
    )
  }

  const privacy = profile.privacy_settings || {
    show_email: false,
    show_location: true,
    show_events: true,
    show_stats: true
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* Header do Perfil */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.nome}
                width={120}
                height={120}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-30 h-30 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {profile.nome.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Informações Básicas */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                  {profile.nome}
                </h1>
                {privacy.show_email && (
                  <p className="text-neutral-600">{profile.email}</p>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                {!isOwnProfile && currentUser && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isFollowing
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {followLoading ? 'Carregando...' : (isFollowing ? 'Seguindo' : 'Seguir')}
                  </button>
                )}
                
                <button
                  onClick={handleShare}
                  className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  title="Compartilhar perfil"
                >
                  <Share2 className="w-5 h-5 text-neutral-600" />
                </button>

                {isOwnProfile && (
                  <button
                    onClick={() => {/* TODO: Abrir configurações */}}
                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    title="Configurações de privacidade"
                  >
                    <Settings className="w-5 h-5 text-neutral-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-neutral-700 mb-4 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Informações Adicionais */}
            <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
              {privacy.show_location && profile.localizacao && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.localizacao}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {privacy.show_stats && stats && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Estatísticas</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.events_created}</div>
              <div className="text-sm text-neutral-600">Eventos Criados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.events_attended}</div>
              <div className="text-sm text-neutral-600">Eventos Participados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.communities_joined}</div>
              <div className="text-sm text-neutral-600">Comunidades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.followers}</div>
              <div className="text-sm text-neutral-600">Seguidores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.following}</div>
              <div className="text-sm text-neutral-600">Seguindo</div>
            </div>
          </div>
        </div>
      )}

      {/* Eventos Recentes */}
      {privacy.show_events && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Eventos Recentes</h2>
          <div className="text-center py-8 text-neutral-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum evento encontrado</p>
          </div>
        </div>
      )}

      {/* Configurações de Privacidade (apenas para o próprio usuário) */}
      {isOwnProfile && (
        <div className="bg-neutral-50 rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Configurações de Privacidade
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacy.show_email}
                onChange={() => {/* TODO: Atualizar configuração */}}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Mostrar email publicamente</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacy.show_location}
                onChange={() => {/* TODO: Atualizar configuração */}}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Mostrar localização</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacy.show_events}
                onChange={() => {/* TODO: Atualizar configuração */}}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Mostrar eventos públicos</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacy.show_stats}
                onChange={() => {/* TODO: Atualizar configuração */}}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Mostrar estatísticas</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}