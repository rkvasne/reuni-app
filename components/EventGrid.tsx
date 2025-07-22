'use client'

import { useState } from 'react'
import { Grid, List, Calendar, MapPin, Users, Clock } from 'lucide-react'
import Image from 'next/image'
import { Event } from '@/hooks/useEvents'
import EmptyState from './EmptyState'

interface EventGridProps {
  events: Event[]
  title: string
  emptyMessage: string
  emptyAction?: () => void
  emptyActionText?: string
}

export default function EventGrid({ 
  events, 
  title, 
  emptyMessage, 
  emptyAction, 
  emptyActionText 
}: EventGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={title}
        description={emptyMessage}
        action={emptyAction && emptyActionText ? {
          label: emptyActionText,
          onClick: emptyAction
        } : undefined}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-800">
          {title} ({events.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div key={event.id} className="card overflow-hidden hover:shadow-reuni-lg transition-shadow">
              {/* Imagem */}
              <div className="relative h-32 bg-neutral-200">
                {event.imagem_url ? (
                  <Image
                    src={event.imagem_url}
                    alt={event.titulo}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-primary-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium">
                    {event.categoria}
                  </span>
                </div>
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded p-1 text-center">
                  <div className="text-sm font-bold text-primary-600">
                    {formatDate(event.data).split(' ')[0]}
                  </div>
                  <div className="text-xs text-neutral-600 uppercase">
                    {formatDate(event.data).split(' ')[1]}
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-4">
                <h4 className="font-semibold text-neutral-800 mb-2 line-clamp-2">
                  {event.titulo}
                </h4>
                <div className="space-y-1 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(event.hora)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.local}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>{event.participantes_count || 0} pessoas</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="card p-4 hover:shadow-reuni-md transition-shadow">
              <div className="flex items-center gap-4">
                {/* Data */}
                <div className="text-center min-w-[60px]">
                  <div className="text-lg font-bold text-primary-600">
                    {formatDate(event.data).split(' ')[0]}
                  </div>
                  <div className="text-xs text-neutral-600 uppercase">
                    {formatDate(event.data).split(' ')[1]}
                  </div>
                </div>

                {/* Informações */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-neutral-800">
                      {event.titulo}
                    </h4>
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                      {event.categoria}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(event.hora)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.local}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{event.participantes_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}