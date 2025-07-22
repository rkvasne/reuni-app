'use client'

import { useState, useEffect } from 'react'
import { User, Settings, Camera, Mail, Clock, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/hooks/useEvents'
import { useUserProfile } from '@/hooks/useUserProfile'
import EventGrid from './EventGrid'
import UserStats from './UserStats'
import QuickProfileEdit from './QuickProfileEdit'
import ProfileSettings from './ProfileSettings'
import AvatarUpload from './AvatarUpload'
import LoadingSpinner from './LoadingSpinner'

export default function UserProfile() {
  const { user } = useAuth()
  const { userProfile } = useUserProfile()
  const { getUserEvents, events } = useEvents()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'created' | 'participating' | 'settings'>('created')
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [participatingEvents, setParticipatingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Buscar eventos criados pelo usuário
        const { data: createdEvents } = await getUserEvents()
        setUserEvents(createdEvents || [])

        // Filtrar eventos que o usuário está participando
        const participating = events.filter(event => 
          event.user_participando && event.organizador_id !== user.id
        )
        setParticipatingEvents(participating)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user?.id, events])

  if (!user || !userProfile) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const tabs = [
    { id: 'created', label: 'Meus Eventos', count: userEvents.length },
    { id: 'participating', label: 'Vou Participar', count: participatingEvents.length },
    { id: 'settings', label: 'Configurações', count: null }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Botão Voltar */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Feed
      </button>
      
      {/* Header do Perfil */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          
          {/* Avatar */}
          <div className="relative">
            {userProfile.avatar ? (
              <Image
                src={userProfile.avatar}
                alt={userProfile.nome}
                width={120}
                height={120}
                className="rounded-full"
              />
            ) : (
              <div className="w-30 h-30 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <button 
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-reuni-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <Camera className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* Informações do Usuário */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="mb-2">
                  <QuickProfileEdit
                    field="nome"
                    value={userProfile.nome}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="flex items-center gap-2 text-neutral-600 mb-2">
                  <Mail className="w-4 h-4" />
                  <span>{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <Clock className="w-4 h-4" />
                  <span>Membro desde {formatDate(userProfile.created_at)}</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </button>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <QuickProfileEdit
                field="bio"
                value={userProfile.bio || ''}
                placeholder="Adicione uma bio para se apresentar à comunidade"
                multiline
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <UserStats 
        userEvents={userEvents} 
        participatingEvents={participatingEvents} 
      />

      {/* Tabs */}
      <div className="card p-0 mb-8">
        <div className="flex border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.label}
                {tab.count !== null && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="space-y-6">
        {loading ? (
          <LoadingSpinner text="Carregando seus dados..." />
        ) : (
          <>
            {/* Meus Eventos */}
            {activeTab === 'created' && (
              <EventGrid
                events={userEvents}
                title="Meus Eventos"
                emptyMessage="Que tal criar seu primeiro evento e começar a conectar pessoas?"
                emptyAction={() => router.push('/')}
                emptyActionText="Criar Primeiro Evento"
              />
            )}

            {/* Eventos Participando */}
            {activeTab === 'participating' && (
              <EventGrid
                events={participatingEvents}
                title="Eventos que Vou Participar"
                emptyMessage="Explore os eventos disponíveis e confirme sua presença!"
                emptyAction={() => router.push('/')}
                emptyActionText="Explorar Eventos"
              />
            )}

            {/* Configurações */}
            {activeTab === 'settings' && (
              <ProfileSettings />
            )}
          </>
        )}
      </div>

      {/* Modal de Avatar */}
      {showAvatarModal && (
        <AvatarUpload
          currentAvatar={userProfile.avatar}
          userName={userProfile.nome}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  )
}