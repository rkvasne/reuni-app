'use client'

import { Calendar, MapPin, Users, TrendingUp, Clock } from 'lucide-react'
import Image from 'next/image'

const friendsGoing = [
  {
    name: 'Ana Silva',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    event: 'Tech Meetup SP',
    time: 'hoje às 19h'
  },
  {
    name: 'Carlos Santos',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    event: 'Corrida Matinal',
    time: 'amanhã às 6h'
  },
  {
    name: 'Maria Costa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    event: 'Show Indie Rock',
    time: 'sábado às 21h'
  }
]

const suggestions = [
  {
    title: 'Workshop de Design',
    date: 'Amanhã',
    attendees: 23,
    category: 'Educação',
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200'
  },
  {
    title: 'Feira Gastronômica',
    date: 'Domingo',
    attendees: 156,
    category: 'Gastronomia',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200'
  }
]

const trendingCommunities: any[] = []

export default function RightSidebar() {
  return (
    <div className="space-y-6">
      
      {/* Amigos que vão a eventos */}
      <div className="card p-4">
        <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          Amigos indo hoje
        </h3>
        <div className="space-y-3">
          {friendsGoing.map((friend, index) => (
            <div key={index} className="flex items-center gap-3">
              <Image
                src={friend.avatar}
                alt={friend.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{friend.name}</p>
                <p className="text-xs text-neutral-500">
                  {friend.event} • {friend.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="text-primary-500 text-sm font-medium mt-3 hover:text-primary-600">
          Ver todos
        </button>
      </div>
      
      {/* Sugestões de eventos */}
      <div className="card p-4">
        <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          Sugestões para você
        </h3>
        <div className="space-y-3">
          {suggestions.map((event, index) => (
            <div key={index} className="flex gap-3 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer">
              <Image
                src={event.image}
                alt={event.title}
                width={50}
                height={50}
                className="rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{event.title}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{event.date}</span>
                  <Users className="w-3 h-3 ml-1" />
                  <span>{event.attendees}</span>
                </div>
                <span className="inline-block bg-accent-100 text-accent-700 text-xs px-2 py-1 rounded-full mt-1">
                  {event.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Comunidades em alta */}
      <div className="card p-4">
        <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-secondary-500" />
          Comunidades em alta
        </h3>
        <div className="space-y-3">
          {trendingCommunities.map((community, index) => (
            <div key={index} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-sm">{community.name}</p>
                <p className="text-xs text-neutral-500">{community.members} membros</p>
              </div>
              <span className="text-xs text-accent-600 font-medium bg-accent-50 px-2 py-1 rounded-full">
                {community.growth}
              </span>
            </div>
          ))}
        </div>
        <button className="text-primary-500 text-sm font-medium mt-3 hover:text-primary-600">
          Explorar mais
        </button>
      </div>
      
      {/* Atalhos rápidos */}
      <div className="card p-4">
        <h3 className="font-semibold text-neutral-800 mb-3">Ações rápidas</h3>
        <div className="space-y-2">
          <button className="w-full text-left p-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary-500" />
            Eventos perto de mim
          </button>
          <button className="w-full text-left p-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-secondary-500" />
            Eventos desta semana
          </button>
          <button className="w-full text-left p-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-accent-500" />
            Criar comunidade
          </button>
        </div>
      </div>
      
    </div>
  )
}