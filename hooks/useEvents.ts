'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Event {
  id: string
  titulo: string
  descricao: string
  data: string
  hora: string
  local: string
  categoria: string
  imagem_url?: string
  organizador_id: string
  max_participantes?: number
  created_at: string
  updated_at: string
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
  descricao: string
  data: string
  hora: string
  local: string
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

      // Buscar eventos básicos
      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id (
            nome,
            email,
            avatar
          )
        `)
        .order('data', { ascending: true })

      if (eventsError) throw eventsError

      // Buscar contagem de participantes para cada evento
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from('participacoes')
            .select('*', { count: 'exact', head: true })
            .eq('evento_id', event.id)
            .eq('status', 'confirmado')

          return {
            ...event,
            participantes_count: count || 0
          }
        })
      )

      // Se usuário logado, verificar participações
      let eventsWithParticipation = eventsWithCounts
      
      if (user) {
        const { data: userParticipations } = await supabase
          .from('participacoes')
          .select('evento_id')
          .eq('usuario_id', user.id)
          .eq('status', 'confirmado')

        const userEventIds = new Set(userParticipations?.map(p => p.evento_id) || [])

        eventsWithParticipation = eventsWithCounts.map(event => ({
          ...event,
          user_participando: userEventIds.has(event.id)
        }))
      } else {
        eventsWithParticipation = eventsWithCounts.map(event => ({
          ...event,
          user_participando: false
        }))
      }

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
        .update({
          ...eventData,
          updated_at: new Date().toISOString(),
        })
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
      if (!user) throw new Error('Usuário não autenticado')

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

      if (error) throw error

      return { data: data || [], error: null }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar seus eventos'
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
  const getEventParticipants = async (eventId: string) => {
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
  }

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