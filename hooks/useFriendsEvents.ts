'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export interface FriendEvent {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  local: string;
  categoria: string;
  imagem_url?: string;
  organizador_id: string;
  organizador?: {
    id: string;
    nome: string;
    avatar?: string;
  };
  participantes_count: number;
  max_participantes?: number;
  user_participando: boolean;
  friends_going: {
    id: string;
    nome: string;
    avatar?: string;
  }[];
  friends_count: number;
}

export function useFriendsEvents() {
  const [events, setEvents] = useState<FriendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFriendsEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Por enquanto, vamos simular dados de amigos
      // TODO: Implementar sistema de amizades real
      const mockFriendsIds = []; // Array vazio por enquanto

      // Buscar eventos futuros com participações
      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!eventos_organizador_id_fkey(id, nome, avatar),
          participacoes!inner(
            usuario_id,
            usuarios(id, nome, avatar)
          )
        `)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true })
        .limit(20);

      if (eventsError) throw eventsError;

      // Processar eventos para incluir informações de amigos
      const processedEvents: FriendEvent[] = (eventsData || []).map(event => {
        // Filtrar participações de amigos (por enquanto, simulado)
        const friendsGoing = event.participacoes
          ?.filter((p: any) => mockFriendsIds.includes(p.usuario_id))
          ?.map((p: any) => p.usuarios)
          ?.slice(0, 3) || [];

        return {
          id: event.id,
          titulo: event.titulo,
          descricao: event.descricao,
          data: event.data,
          hora: event.hora,
          local: event.local,
          categoria: event.categoria,
          imagem_url: event.imagem_url,
          organizador_id: event.organizador_id,
          organizador: event.organizador,
          participantes_count: event.participacoes?.length || 0,
          max_participantes: event.max_participantes,
          user_participando: event.participacoes?.some((p: any) => p.usuario_id === user.id) || false,
          friends_going: friendsGoing,
          friends_count: friendsGoing.length
        };
      }).filter(event => event.friends_count > 0); // Só eventos com amigos

      setEvents(processedEvents);
    } catch (err) {
      console.error('Erro ao buscar eventos de amigos:', err);
      setError('Erro ao carregar eventos de amigos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsEvents();
  }, [user]);

  return {
    events,
    loading,
    error,
    refetch: fetchFriendsEvents
  };
}