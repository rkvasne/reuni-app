'use client'

import { useState } from 'react'
import { Home, Calendar, User, Users, Plus, MapPin, Bookmark } from 'lucide-react'
import EventModal from './EventModal'
import { useAuth } from '@/hooks/useAuth'

const menuItems = [
  { icon: Home, label: 'Início', active: true },
  { icon: Calendar, label: 'Meus Eventos', count: 3 },
  { icon: User, label: 'Perfil' },
  { icon: Users, label: 'Comunidades', count: 12 },
  { icon: MapPin, label: 'Eventos Próximos' },
  { icon: Bookmark, label: 'Salvos' },
]

const communities = [
  { name: 'Tech Meetups SP', members: '2.1k', color: 'bg-blue-500' },
  { name: 'Corrida Matinal', members: '856', color: 'bg-green-500' },
  { name: 'Shows Indie', members: '1.2k', color: 'bg-purple-500' },
]

export default function LeftSidebar() {
  const { isAuthenticated } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-6">
      
      {/* Navegação Principal */}
      <div className="card p-4">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`sidebar-item ${item.active ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.count && (
                <span className="ml-auto bg-accent-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </nav>
        
        {isAuthenticated && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar Evento
          </button>
        )}
      </div>
      
      {/* Comunidades */}
      <div className="card p-4">
        <h3 className="font-semibold text-neutral-800 mb-3">Suas Comunidades</h3>
        <div className="space-y-3">
          {communities.map((community, index) => (
            <div key={index} className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer">
              <div className={`w-10 h-10 ${community.color} rounded-lg flex items-center justify-center`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{community.name}</p>
                <p className="text-xs text-neutral-500">{community.members} membros</p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="text-primary-500 text-sm font-medium mt-3 hover:text-primary-600">
          Ver todas
        </button>
      </div>

      {/* Modal de Criar Evento */}
      {isAuthenticated && (
        <EventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
        />
      )}
      
    </div>
  )
}