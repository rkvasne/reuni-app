'use client'

import { Calendar, Users, MapPin, TrendingUp, Award, Clock } from 'lucide-react'
import { Event } from '@/hooks/useEvents'

interface UserStatsProps {
  userEvents: Event[]
  participatingEvents: Event[]
}

export default function UserStats({ userEvents, participatingEvents }: UserStatsProps) {
  // Calcular estatísticas
  const totalEventsCreated = userEvents.length
  const totalParticipations = participatingEvents.length
  const totalPeopleReached = userEvents.reduce((total, event) => total + (event.participantes_count || 0), 0)
  
  // Eventos por categoria
  const categoryCounts = userEvents.reduce((acc, event) => {
    acc[event.categoria] = (acc[event.categoria] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0]
  
  // Próximos eventos
  const upcomingEvents = [...userEvents, ...participatingEvents]
    .filter(event => new Date(`${event.data}T${event.hora}`) > new Date())
    .length

  // Eventos este mês
  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const eventsThisMonth = userEvents.filter(event => {
    const eventDate = new Date(event.data)
    return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear
  }).length

  const stats = [
    {
      icon: Calendar,
      label: 'Eventos Criados',
      value: totalEventsCreated,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      icon: Users,
      label: 'Pessoas Alcançadas',
      value: totalPeopleReached,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50'
    },
    {
      icon: MapPin,
      label: 'Participações',
      value: totalParticipations,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50'
    },
    {
      icon: TrendingUp,
      label: 'Próximos Eventos',
      value: upcomingEvents,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Clock,
      label: 'Este Mês',
      value: eventsThisMonth,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Award,
      label: 'Categoria Favorita',
      value: topCategory?.[0] || 'Nenhuma',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isText: true
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="card p-4 text-center">
          <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div className={`text-2xl font-bold ${stat.color} mb-1`}>
            {stat.isText ? (
              <span className="text-sm">{stat.value}</span>
            ) : (
              stat.value
            )}
          </div>
          <div className="text-xs text-neutral-600 font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}