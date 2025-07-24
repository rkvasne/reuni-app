'use client'

import { Users, TrendingUp, Zap, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import SidebarBlock from './ui/SidebarBlock'
import FriendsGoingToday from './FriendsGoingToday'
import FriendsEventsBlock from './FriendsEventsBlock'
import TrendingCommunitiesBlock from './TrendingCommunitiesBlock'
import QuickActionsBlock from './QuickActionsBlock'
import MiniCalendar from './MiniCalendar'

export default function RightSidebar() {
  const { isAuthenticated } = useAuth()

  const handleDateSelect = (date: Date) => {
    // TODO: Filtrar eventos por data selecionada
    console.log('Data selecionada na sidebar:', date)
  }

  const handleCalendarEventClick = (eventId: string) => {
    // TODO: Abrir modal de detalhes do evento
    console.log('Evento do calendário clicado na sidebar:', eventId)
  }

  return (
    <div className="space-y-4">
      
      {/* Ações Rápidas - Sempre visível */}
      <SidebarBlock
        title="Ações Rápidas"
        icon={<Zap className="w-4 h-4" />}
        collapsible={false}
      >
        <QuickActionsBlock />
      </SidebarBlock>

      {/* Blocos sociais - Apenas para usuários autenticados */}
      {isAuthenticated && (
        <>
          {/* Amigos Indo Hoje */}
          <SidebarBlock
            title="Amigos Indo Hoje"
            subtitle="Veja quem vai a eventos hoje"
            icon={<Users className="w-4 h-4" />}
            collapsible={true}
            defaultOpen={true}
          >
            <FriendsGoingToday />
          </SidebarBlock>

          {/* Eventos de Amigos */}
          <SidebarBlock
            title="Eventos de Amigos"
            subtitle="Eventos que seus amigos vão participar"
            icon={<Users className="w-4 h-4" />}
            collapsible={true}
            defaultOpen={false}
          >
            <FriendsEventsBlock maxEvents={3} />
          </SidebarBlock>
        </>
      )}

      {/* Mini Calendário - Sempre visível */}
      <SidebarBlock
        title="Calendário"
        subtitle="Navegue por datas e eventos"
        icon={<Calendar className="w-4 h-4" />}
        collapsible={true}
        defaultOpen={false}
      >
        <MiniCalendar
          onDateSelect={handleDateSelect}
          onEventClick={handleCalendarEventClick}
          className="border-0"
        />
      </SidebarBlock>

      {/* Comunidades em Alta - Sempre visível */}
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