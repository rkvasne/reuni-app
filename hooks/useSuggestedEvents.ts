'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export interface SuggestedEvent {
  id: string;
  titulo: string;
  local: string; // Antigo: descricao - agora é o local do evento
  data: string;
  hora: string;
  cidade: string; // Antigo: local - agora é a cidade/UF
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
  suggestion_reason: string;
  similarity_score: number;
}

export function useSuggestedEvents() {
  const [events, setEvents] = useState<SuggestedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSuggestedEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar categorias preferidas do usuário (baseado em participações passadas)
      const { data: userParticipations } = await supabase
        .from('participacoes')
        .select(`
          eventos(categoria)
        `)
        .eq('usuario_id', user.id);

      const preferredCategories = userParticipations
        ?.map((p: any) => p.eventos?.categoria)
        .filter(Boolean) || [];

      const categoryCount = preferredCategories.reduce((acc: any, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([cat]) => cat);

      // 2. Buscar eventos futuros
      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!eventos_organizador_id_fkey(id, nome, avatar),
          participacoes(usuario_id)
        `)
        .gte('data', new Date().toISOString().split('T')[0])
        .neq('organizador_id', user.id) // Não sugerir próprios eventos
        .order('data', { ascending: true })
        .limit(50);

      if (eventsError) throw eventsError;

      // 3. Calcular score de sugestão e processar eventos
      const processedEvents: SuggestedEvent[] = (eventsData || [])
        .map(event => {
          let score = 0;
          let reason = 'Evento popular';

          // Score baseado na categoria preferida
          if (topCategories.includes(event.categoria)) {
            score += 10;
            reason = `Baseado em ${event.categoria}`;
          }

          // Score baseado na popularidade
          const participantsCount = event.participacoes?.length || 0;
          if (participantsCount > 10) {
            score += 5;
            reason = participantsCount > 20 ? 'Evento muito popular' : 'Evento popular';
          }

          // Score baseado na proximidade da data (eventos próximos são mais relevantes)
          const eventDate = new Date(event.data);
          const today = new Date();
          const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 7) {
            score += 3;
          } else if (daysUntil <= 30) {
            score += 1;
          }

          // Não sugerir eventos que o usuário já participa
          const userParticipating = event.participacoes?.some((p: any) => p.usuario_id === user.id);
          if (userParticipating) {
            score = 0; // Remove da sugestão
          }

          return {
            id: event.id,
            titulo: event.titulo,
            local: event.local, // Antigo: descricao - agora é o local do evento
            data: event.data,
            hora: event.hora,
            cidade: event.cidade, // Antigo: local - agora é a cidade/UF
            categoria: event.categoria,
            imagem_url: event.imagem_url,
            organizador_id: event.organizador_id,
            organizador: event.organizador,
            participantes_count: participantsCount,
            max_participantes: event.max_participantes,
            user_participando: userParticipating || false,
            suggestion_reason: reason,
            similarity_score: score
          };
        })
        .filter(event => event.similarity_score > 0) // Só eventos com score > 0
        .sort((a, b) => b.similarity_score - a.similarity_score) // Ordenar por score
        .slice(0, 10); // Top 10 sugestões

      setEvents(processedEvents);
    } catch (err) {
      console.error('Erro ao buscar eventos sugeridos:', err);
      setError('Erro ao carregar sugestões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedEvents();
  }, [user]);

  return {
    events,
    loading,
    error,
    refetch: fetchSuggestedEvents
  };
}