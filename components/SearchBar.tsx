'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock, Filter } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import SearchSuggestions from './SearchSuggestions'

interface SearchBarProps {
  onFiltersToggle?: () => void
  showFiltersButton?: boolean
  placeholder?: string
  className?: string
}

export default function SearchBar({ 
  onFiltersToggle, 
  showFiltersButton = true,
  placeholder = "Buscar eventos, pessoas ou comunidades...",
  className = ""
}: SearchBarProps) {
  const { filters, updateFilters, searchHistory, clearHistory } = useSearch()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState(filters.query)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Sincronizar com filtros externos
  useEffect(() => {
    setInputValue(filters.query)
  }, [filters.query])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    updateFilters({ query: value })
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    updateFilters({ query: suggestion })
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setInputValue('')
    updateFilters({ query: '' })
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 bg-white rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Limpar busca"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          )}
          
          {showFiltersButton && (
            <button
              onClick={onFiltersToggle}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Filtros avançados"
            >
              <Filter className="w-4 h-4 text-neutral-500" />
            </button>
          )}
        </div>
      </div>

      {/* Sugestões */}
      <div ref={suggestionsRef}>
        {/* Sugestões Inteligentes */}
        {inputValue.trim() && (
          <SearchSuggestions
            query={inputValue}
            onSuggestionClick={handleSuggestionClick}
            isVisible={showSuggestions}
          />
        )}

        {/* Histórico de Buscas */}
        {!inputValue.trim() && showSuggestions && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-reuni-lg z-50 max-h-60 overflow-y-auto">
            <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Buscas recentes</span>
              <button
                onClick={clearHistory}
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Limpar
              </button>
            </div>
            
            <div className="py-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                >
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-700">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}