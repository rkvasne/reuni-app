'use client'

import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

const featuredEvents = [
  {
    id: 1,
    title: 'Festival de Música Eletrônica',
    date: '2025-02-15',
    location: 'Anhembi, São Paulo',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 2,
    title: 'Conferência de Inovação',
    date: '2025-02-08',
    location: 'Centro de Convenções',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    gradient: 'from-blue-600 to-cyan-600'
  },
  {
    id: 3,
    title: 'Maratona de São Paulo',
    date: '2025-03-12',
    location: 'Largada: Ibirapuera',
    image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800',
    gradient: 'from-green-600 to-emerald-600'
  }
]

export default function FeaturedCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="relative h-64 rounded-xl overflow-hidden card">
      
      {/* Slides */}
      <div className="relative h-full">
        {featuredEvents.map((event, index) => (
          <div
            key={event.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${event.gradient} opacity-80`} />
            
            <div className="absolute inset-0 flex items-end p-6">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Controles */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      
      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {featuredEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
      
    </div>
  )
}