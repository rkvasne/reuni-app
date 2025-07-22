'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Clock, MapPin, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SearchSuggestionsProps {
  query: string
  onSuggestionClick: (suggestion: string) => void
  isVisible: boolean
}

interface Suggestion {
  type: 'event' | 'location' | 'category' | 'organizer'
  text: string
  icon: React.ReactNode
  count?: number
}

export default function SearchSuggestions({ 
  query, 
  onSuggestionClick, 
  isVisible 
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim() || !isVisible) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const searchTerm = query.trim().toLowerCase()
        const suggestions: Suggestion[] = []

        // Buscar eventos similares
        const { data: events } = await supabase
          .from('eventos')
          .select('titulo')
          .ilike('titulo', `%${searchTerm}%`)
          .limit(3)

        events?.forEach(event => {
          suggestions.push({
            type: 'event',
            text: event.titulo,
            icon: <Search className="w-4 h-4" />
          })
        })

        // Buscar locais similares
        const { data: locations } = await supabase
          .from('eventos')
          .select('local')
          .ilike('local', `%${searchTerm}%`)
          .limit(3)

        const locationSet = new Set(locations?.map(l => l.local) || [])
        const uniqueLocations = Array.from(locationSet)
        uniqueLocations.forEach(location => {
          suggestions.push({
            type: 'location',
            text: location,
            icon: <MapPin className="w-4 h-4" />
          })
        })

        // Sugestões de categorias
        const categorias = [
          'Tecnologia', 'Música', 'Esporte', 'Educação', 'Gastronomia',
          'Arte', 'Negócios', 'Saúde', 'Entretenimento', 'Outros'
        ]

        const matchingCategories = categorias.filter(cat => 
          cat.toLowerCase().includes(searchTerm)
        )

        matchingCategories.forEach(category => {
          suggestions.push({
            type: 'category',
            text: category,
            icon: <Tag className="w-4 h-4" />
          })
        })

        setSuggestions(suggestions.slice(0, 6)) // Máximo 6 sugestões
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [query, isVisible])

  if (!isVisible || (!loading && suggestions.length === 0)) {
    return null
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-reuni-lg z-50 max-h-60 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center">
          <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="py-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
            >
              <div className="text-neutral-400">
                {suggestion.icon}
              </div>
              <div className="flex-1">
                <span className="text-neutral-700">{suggestion.text}</span>
                {suggestion.count && (
                  <span className="text-xs text-neutral-500 ml-2">
                    ({suggestion.count} eventos)
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400 capitalize">
                {suggestion.type === 'event' && 'Evento'}
                {suggestion.type === 'location' && 'Local'}
                {suggestion.type === 'category' && 'Categoria'}
                {suggestion.type === 'organizer' && 'Organizador'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}