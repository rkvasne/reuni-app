'use client'

import { Users, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import SidebarBlock from './ui/SidebarBlock'
import FriendsGoingToday from './FriendsGoingToday'
import FriendsEventsBlock from './FriendsEventsBlock'
import TrendingCommunitiesBlock from './TrendingCommunitiesBlock'

export default function RightSidebar() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-4">
      
      {/* Blocos sociais - Apenas para usuários autenticados */}
      {isAuthenticated && (
        <>
          {/* Eventos de Amigos - Primeiro */}
          <SidebarBlock
            title="Eventos de Amigos"
            subtitle="Eventos que seus amigos vão participar"
            icon={<Users className="w-4 h-4" />}
            collapsible={true}
            defaultOpen={true}
          >
            <FriendsEventsBlock maxEvents={3} />
          </SidebarBlock>

          {/* Amigos Indo Hoje - Segundo */}
          <SidebarBlock
            title="Amigos Indo Hoje"
            subtitle="Veja quem vai a eventos hoje"
            icon={<Users className="w-4 h-4" />}
            collapsible={true}
            defaultOpen={true}
          >
            <FriendsGoingToday />
          </SidebarBlock>
        </>
      )}

      {/* Comunidades em Alta - Por último */}
      <SidebarBlock
        title="Comunidades em Alta"
        subtitle="Comunidades com mais atividade"
        icon={<TrendingUp className="w-4 h-4" />}
        collapsible={true}
        defaultOpen={true}
        headerAction={
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Ver todas
          </button>
        }
      >
        <TrendingCommunitiesBlock maxCommunities={4} />
      </SidebarBlock>
      
    </div>
  )
}