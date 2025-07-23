'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Calendar, User, Users, Plus, MapPin, Bookmark, Search } from 'lucide-react'
import EventModal from './EventModal'
import { useAuth } from '@/hooks/useAuth'

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Search, label: 'Buscar', href: '/search' },
  { icon: Calendar, label: 'Meus Eventos', href: '/profile', count: 3 },
  { icon: User, label: 'Perfil', href: '/profile' },
  { icon: Users, label: 'Comunidades', href: '/communities', count: 12 },
  { icon: MapPin, label: 'Eventos Próximos', href: '/search?filter=proximo' },
  { icon: Bookmark, label: 'Salvos', href: '/profile?tab=salvos' },
]

const communities = [
  { name: 'Tech Meetups SP', members: '2.1k', color: 'bg-blue-500' },
  { name: 'Corrida Matinal', members: '856', color: 'bg-green-500' },
  { name: 'Shows Indie', members: '1.2k', color: 'bg-purple-500' },
]

export default function LeftSidebar() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-6">
      
      {/* Navegação Principal */}
      <div className="card p-4">
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
            return (
              <button
                key={index}
                onClick={() => router.push(item.href)}
                className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.count && (
                  <span className="ml-auto bg-accent-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
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
            <button 
              key={index} 
              onClick={() => router.push('/communities')}
              className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer w-full text-left"
            >
              <div className={`w-10 h-10 ${community.color} rounded-lg flex items-center justify-center`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{community.name}</p>
                <p className="text-xs text-neutral-500">{community.members} membros</p>
              </div>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => router.push('/communities')}
          className="text-primary-500 text-sm font-medium mt-3 hover:text-primary-600"
        >
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