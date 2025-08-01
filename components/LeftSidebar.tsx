'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Calendar, User, Users, Plus, MapPin, Bookmark, Search } from 'lucide-react'
import SidebarBlock from './ui/SidebarBlock'
import MiniCalendar from './MiniCalendar'
import { useAuth } from '@/hooks/useAuth'
import { useCommunities } from '@/hooks/useCommunities'

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Search, label: 'Buscar', href: '/search' },
  { icon: Calendar, label: 'Meus Eventos', href: '/profile' },
  { icon: User, label: 'Perfil', href: '/profile' },
  { icon: Users, label: 'Comunidades', href: '/communities' },
  { icon: MapPin, label: 'Eventos Próximos', href: '/search?filter=proximo' },
  { icon: Bookmark, label: 'Salvos', href: '/profile?tab=salvos' },
]



interface LeftSidebarProps {
  onCreateEvent?: () => void;
}

export default function LeftSidebar({ onCreateEvent }: LeftSidebarProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { communities, loading: communitiesLoading } = useCommunities()

  const handleDateSelect = (date: Date) => {
    // TODO: Filtrar eventos por data selecionada
    console.log('Data selecionada na sidebar:', date)
  }

  const handleCalendarEventClick = (eventId: string) => {
    // TODO: Abrir modal de detalhes do evento
    console.log('Evento do calendário clicado na sidebar:', eventId)
  }

  return (
    <div className="sidebar-container">
      <div className="sidebar-content space-y-6">
        
        {/* Botão Criar Evento */}
        {isAuthenticated && (
          <button 
            onClick={() => onCreateEvent && onCreateEvent()}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-4 transition-transform duration-120 hover:scale-103"
          >
            <Plus className="w-5 h-5" />
            Criar Evento
          </button>
        )}

        {/* Navegação Principal */}
        <div className="card p-4">
          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = item.href !== '/' && (pathname === item.href || (item.href === '/' && pathname === '/'));
              return (
                <button
                  key={index}
                  onClick={() => router.push(item.href)}
                  className={`sidebar-item w-full transition-colors duration-120 ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mini Calendário - Sempre exposto */}
        <SidebarBlock
          title="Calendário"
          subtitle="Navegue por datas e eventos"
          icon={<Calendar className="w-4 h-4" />}
          collapsible={false}
        >
          <MiniCalendar
            onDateSelect={handleDateSelect}
            onEventClick={handleCalendarEventClick}
            className="border-0"
          />
        </SidebarBlock>

        {/* Comunidades - Apenas se autenticado */}
        {isAuthenticated && (
          <div className="card p-4">
            <h3 className="font-semibold text-neutral-800 mb-3">Suas Comunidades</h3>
            
            {communitiesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : communities.length > 0 ? (
              <>
                <div className="space-y-3">
                  {communities.slice(0, 3).map((community) => (
                    <button 
                      key={community.id} 
                      onClick={() => router.push(`/communities/${community.id}`)}
                      className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer w-full text-left transition-colors duration-120"
                    >
                      <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{community.nome}</p>
                        <p className="text-xs text-neutral-500">{community.membros_count} membros</p>
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
              </>
            ) : (
              <div className="text-center py-4">
                <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600 mb-3">
                  Você ainda não participa de nenhuma comunidade
                </p>
                <button 
                  onClick={() => router.push('/communities')}
                  className="text-primary-500 text-sm font-medium hover:text-primary-600"
                >
                  Explorar comunidades
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}