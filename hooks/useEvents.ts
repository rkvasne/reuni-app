'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Event {
  id: string
  titulo: string
  local: string // Antigo: descricao - agora é o local do evento
  data: string
  hora: string
  cidade: string // Antigo: local - agora é a cidade/UF
  categoria: string
  imagem_url?: string
  organizador_id: string
  max_participantes?: number
  created_at: string

  organizador?: {
    nome: string
    email: string
    avatar?: string
  }
  participantes_count?: number
  user_participando?: boolean
}

export interface CreateEventData {
  titulo: string
  local: string // Antigo: descricao - agora é o local do evento
  data: string
  hora: string
  cidade: string // Antigo: local - agora é a cidade/UF
  categoria: string
  imagem_url?: string
  max_participantes?: number
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Buscar eventos
  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query ultra-otimizada: buscar apenas eventos básicos sem joins
      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select(`
          id,
          titulo,
          local,
          data,
          hora,
          cidade,
          categoria,
          imagem_url,
          organizador_id,
          max_participantes,
          created_at
        `)
        .order('data', { ascending: true })
        .limit(20) // Reduzir ainda mais para evitar timeout

      if (eventsError) throw eventsError

      // Buscar dados dos organizadores em query separada
      const organizadorIds = Array.from(new Set((eventsData || []).map(event => event.organizador_id)))
      let organizadores: { [key: string]: any } = {}
      
      if (organizadorIds.length > 0) {
        const { data: organizadoresData, error: organizadoresError } = await supabase
          .from('usuarios')
          .select('id, nome, email, avatar')
          .in('id', organizadorIds)

        if (!organizadoresError && organizadoresData) {
          organizadores = organizadoresData.reduce((acc: any, org: any) => {
            acc[org.id] = org
            return acc
          }, {})
        }
      }

      // Buscar contagem de participantes em query separada
      const eventIds = (eventsData || []).map(event => event.id)
      let participationsCount: { [key: string]: number } = {}
      
      if (eventIds.length > 0) {
        const { data: participationsData, error: participationsError } = await supabase
          .from('participacoes')
          .select('evento_id, status')
          .in('evento_id', eventIds)
          .eq('status', 'confirmado')

        if (!participationsError && participationsData) {
          participationsCount = participationsData.reduce((acc: any, p: any) => {
            acc[p.evento_id] = (acc[p.evento_id] || 0) + 1
            return acc
          }, {})
        }
      }

      // Buscar participação do usuário em query separada
      let userParticipations: Set<string> = new Set()
      
      if (user && eventIds.length > 0) {
        const { data: userParticipationsData, error: userParticipationsError } = await supabase
          .from('participacoes')
          .select('evento_id')
          .in('evento_id', eventIds)
          .eq('usuario_id', user.id)
          .eq('status', 'confirmado')

        if (!userParticipationsError && userParticipationsData) {
          userParticipations = new Set(userParticipationsData.map((p: any) => p.evento_id))
        }
      }

      // Combinar dados
      const eventsWithParticipation = (eventsData || []).map(event => ({
        ...event,
        organizador: organizadores[event.organizador_id] || null,
        participantes_count: participationsCount[event.id] || 0,
        user_participando: userParticipations.has(event.id)
      }))

      setEvents(eventsWithParticipation)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar eventos')
      console.error('Erro ao buscar eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Criar evento
  const createEvent = async (eventData: CreateEventData) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('eventos')
        .insert([
          {
            ...eventData,
            organizador_id: user.id,
          }
        ])
        .select(`
          *,
          organizador:usuarios!organizador_id (
            nome,
            email,
            avatar
          )
        `)
        .single()

      if (error) throw error

      // Adicionar o novo evento à lista
      setEvents(prev => [data, ...prev])
      
      return { data, error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar evento'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Atualizar evento
  const updateEvent = async (eventId: string, eventData: Partial<CreateEventData>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('eventos')
        .update(eventData)
        .eq('id', eventId)
        .eq('organizador_id', user.id) // Só o organizador pode editar
        .select(`
          *,
          organizador:usuarios!organizador_id (
            nome,
            email,
            avatar
          )
        `)
        .single()

      if (error) throw error

      // Atualizar o evento na lista
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? data : event
        )
      )

      return { data, error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar evento'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Deletar evento
  const deleteEvent = async (eventId: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventId)
        .eq('organizador_id', user.id) // Só o organizador pode deletar

      if (error) throw error

      // Remover o evento da lista
      setEvents(prev => prev.filter(event => event.id !== eventId))

      return { error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao deletar evento'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Buscar evento por ID
  const getEventById = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id (
            nome,
            email,
            avatar
          )
        `)
        .eq('id', eventId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar evento'
      return { data: null, error: errorMessage }
    }
  }

  // Buscar eventos do usuário
  const getUserEvents = async () => {
    try {
      if (!user) {
        console.log('❌ getUserEvents - Usuário não autenticado')
        return { data: [], error: 'Usuário não autenticado' }
      }

      console.log('🔍 getUserEvents - Buscando eventos para usuário:', user.id)

      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id (
            nome,
            email,
            avatar
          )
        `)
        .eq('organizador_id', user.id)
        .order('created_at', { ascending: false })

      console.log('📊 getUserEvents - Resultado:', { 
        data: data, 
        error: error,
        count: data?.length || 0
      })

      if (error) {
        console.error('❌ getUserEvents - Erro na query:', error)
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar seus eventos'
      console.error('❌ getUserEvents - Erro capturado:', err)
      return { data: [], error: errorMessage }
    }
  }

  // Participar de um evento
  const participateInEvent = async (eventId: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      // Verificar se já está participando
      const { data: existingParticipation } = await supabase
        .from('participacoes')
        .select('id')
        .eq('evento_id', eventId)
        .eq('usuario_id', user.id)
        .single()

      if (existingParticipation) {
        throw new Error('Você já está participando deste evento')
      }

      // Criar participação
      const { error } = await supabase
        .from('participacoes')
        .insert([
          {
            evento_id: eventId,
            usuario_id: user.id,
            status: 'confirmado'
          }
        ])

      if (error) throw error

      // Atualizar a lista de eventos para refletir a nova participação
      await fetchEvents()

      return { error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao participar do evento'
      return { error: errorMessage }
    }
  }

  // Cancelar participação em um evento
  const cancelParticipation = async (eventId: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('participacoes')
        .delete()
        .eq('evento_id', eventId)
        .eq('usuario_id', user.id)

      if (error) throw error

      // Atualizar a lista de eventos para refletir a remoção da participação
      await fetchEvents()

      return { error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao cancelar participação'
      return { error: errorMessage }
    }
  }

  // Buscar participantes de um evento
  const getEventParticipants = useCallback(async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('participacoes')
        .select(`
          *,
          usuario:usuarios!usuario_id (
            nome,
            email,
            avatar
          )
        `)
        .eq('evento_id', eventId)
        .eq('status', 'confirmado')

      if (error) throw error

      return { data: data || [], error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar participantes'
      return { data: [], error: errorMessage }
    }
  }, [])

  // Carregar eventos na inicialização
  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getUserEvents,
    participateInEvent,
    cancelParticipation,
    getEventParticipants,
    clearError: () => setError(null)
  }
}