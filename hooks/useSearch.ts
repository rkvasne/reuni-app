'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from './useEvents'

export interface SearchFilters {
  query: string
  categoria: string
  dataInicio: string
  dataFim: string
  local: string
  organizador: string
  status: 'todos' | 'futuros' | 'passados' | 'lotados'
}

export interface SearchOptions {
  sortBy: 'data' | 'popularidade' | 'relevancia' | 'criacao'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

const defaultFilters: SearchFilters = {
  query: '',
  categoria: '',
  dataInicio: '',
  dataFim: '',
  local: '',
  organizador: '',
  status: 'futuros'
}

const defaultOptions: SearchOptions = {
  sortBy: 'data',
  sortOrder: 'asc',
  page: 1,
  limit: 12
}

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [options, setOptions] = useState<SearchOptions>(defaultOptions)
  const [results, setResults] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reuni-search-history')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Erro ao carregar histórico de busca:', e)
      }
    }
  }, [])

  // Salvar no histórico
  const addToHistory = (query: string) => {
    if (!query.trim() || searchHistory.includes(query)) return
    
    const newHistory = [query, ...searchHistory.slice(0, 9)] // Máximo 10 itens
    setSearchHistory(newHistory)
    localStorage.setItem('reuni-search-history', JSON.stringify(newHistory))
  }

  // Limpar histórico
  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('reuni-search-history')
  }

  // Construir query SQL baseada nos filtros
  const buildQuery = () => {
    let query = supabase
      .from('eventos')
      .select(`
        *,
        organizador:usuarios!organizador_id (
          nome,
          email,
          avatar
        )
      `, { count: 'exact' })

    // Filtro por texto (busca em título, descrição e local)
    if (filters.query.trim()) {
      const searchTerm = `%${filters.query.trim()}%`
      query = query.or(`titulo.ilike.${searchTerm},descricao.ilike.${searchTerm},local.ilike.${searchTerm}`)
    }

    // Filtro por categoria
    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria)
    }

    // Filtro por data
    const now = new Date().toISOString().split('T')[0]
    
    if (filters.status === 'futuros') {
      query = query.gte('data', now)
    } else if (filters.status === 'passados') {
      query = query.lt('data', now)
    }

    if (filters.dataInicio) {
      query = query.gte('data', filters.dataInicio)
    }

    if (filters.dataFim) {
      query = query.lte('data', filters.dataFim)
    }

    // Filtro por local
    if (filters.local.trim()) {
      query = query.ilike('local', `%${filters.local.trim()}%`)
    }

    // Ordenação
    switch (options.sortBy) {
      case 'data':
        query = query.order('data', { ascending: options.sortOrder === 'asc' })
        break
      case 'criacao':
        query = query.order('created_at', { ascending: options.sortOrder === 'asc' })
        break
      case 'popularidade':
        // Para popularidade, vamos ordenar por uma combinação de fatores
        query = query.order('created_at', { ascending: false }) // Temporário
        break
      default:
        query = query.order('data', { ascending: true })
    }

    // Paginação
    const from = (options.page - 1) * options.limit
    const to = from + options.limit - 1
    query = query.range(from, to)

    return query
  }

  // Executar busca
  const search = async () => {
    setLoading(true)
    setError(null)

    try {
      const query = buildQuery()
      const { data, error: searchError, count } = await query

      if (searchError) throw searchError

      // Adicionar contagem de participantes para cada evento
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { count: participantCount } = await supabase
            .from('participacoes')
            .select('*', { count: 'exact', head: true })
            .eq('evento_id', event.id)
            .eq('status', 'confirmado')

          return {
            ...event,
            participantes_count: participantCount || 0
          }
        })
      )

      // Se ordenação for por popularidade, reordenar aqui
      if (options.sortBy === 'popularidade') {
        eventsWithCounts.sort((a, b) => {
          const diff = (b.participantes_count || 0) - (a.participantes_count || 0)
          return options.sortOrder === 'asc' ? -diff : diff
        })
      }

      setResults(eventsWithCounts)
      setTotalResults(count || 0)

      // Adicionar ao histórico se houver query de texto
      if (filters.query.trim()) {
        addToHistory(filters.query.trim())
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao realizar busca')
      console.error('Erro na busca:', err)
    } finally {
      setLoading(false)
    }
  }

  // Atualizar filtros
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setOptions(prev => ({ ...prev, page: 1 })) // Reset página
  }

  // Atualizar opções
  const updateOptions = (newOptions: Partial<SearchOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }))
  }

  // Limpar filtros
  const clearFilters = () => {
    setFilters(defaultFilters)
    setOptions(defaultOptions)
    setResults([])
    setTotalResults(0)
  }

  // Buscar automaticamente quando filtros mudarem
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search()
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [filters, options])

  // Estatísticas da busca
  const searchStats = useMemo(() => {
    const totalPages = Math.ceil(totalResults / options.limit)
    const hasNextPage = options.page < totalPages
    const hasPrevPage = options.page > 1

    return {
      totalResults,
      totalPages,
      currentPage: options.page,
      hasNextPage,
      hasPrevPage,
      resultsPerPage: options.limit,
      showingFrom: (options.page - 1) * options.limit + 1,
      showingTo: Math.min(options.page * options.limit, totalResults)
    }
  }, [totalResults, options.page, options.limit])

  return {
    // Estado
    filters,
    options,
    results,
    loading,
    error,
    searchHistory,
    searchStats,
    
    // Ações
    updateFilters,
    updateOptions,
    clearFilters,
    clearHistory,
    search,
    
    // Helpers
    clearError: () => setError(null)
  }
}