'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export interface TrendingCommunity {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  tipo: 'publica' | 'privada' | 'restrita';
  avatar_url?: string;
  banner_url?: string;
  criador_id: string;
  membros_count: number;
  eventos_count: number;
  created_at: string;
  user_is_member: boolean;
  recent_activity_score: number;
  growth_rate: number;
}

export function useTrendingCommunities() {
  const [communities, setCommunities] = useState<TrendingCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTrendingCommunities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar comunidades com informações de membros
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('comunidades')
        .select(`
          *,
          membros_comunidade(
            id,
            usuario_id,
            created_at
          )
        `)
        .eq('tipo', 'publica') // Só comunidades públicas para trending
        .order('membros_count', { ascending: false })
        .limit(20);

      if (communitiesError) throw communitiesError;

      // Processar comunidades para calcular trending score
      const processedCommunities: TrendingCommunity[] = (communitiesData || [])
        .map(community => {
          const membros = community.membros_comunidade || [];
          const membrosCount = membros.length;

          // Calcular atividade recente (novos membros nos últimos 7 dias)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const recentMembers = membros.filter((m: any) => 
            new Date(m.created_at) > sevenDaysAgo
          ).length;

          // Calcular taxa de crescimento
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const membersLast30Days = membros.filter((m: any) => 
            new Date(m.created_at) > thirtyDaysAgo
          ).length;

          const growthRate = membrosCount > 0 ? (membersLast30Days / membrosCount) * 100 : 0;

          // Score de atividade recente
          let activityScore = 0;
          activityScore += membrosCount * 2; // Base score por membros
          activityScore += recentMembers * 10; // Bonus por novos membros
          activityScore += community.eventos_count * 5; // Bonus por eventos
          activityScore += growthRate; // Bonus por crescimento

          // Verificar se usuário é membro
          const userIsMember = user ? membros.some((m: any) => m.usuario_id === user.id) : false;

          return {
            id: community.id,
            nome: community.nome,
            descricao: community.descricao,
            categoria: community.categoria,
            tipo: community.tipo,
            avatar_url: community.avatar_url,
            banner_url: community.banner_url,
            criador_id: community.criador_id,
            membros_count: membrosCount,
            eventos_count: community.eventos_count || 0,
            created_at: community.created_at,
            user_is_member: userIsMember,
            recent_activity_score: activityScore,
            growth_rate: growthRate
          };
        })
        .filter(community => 
          // Filtrar comunidades com atividade mínima
          community.membros_count >= 3 && community.recent_activity_score > 10
        )
        .sort((a, b) => b.recent_activity_score - a.recent_activity_score) // Ordenar por atividade
        .slice(0, 8); // Top 8 comunidades

      setCommunities(processedCommunities);
    } catch (err) {
      console.error('Erro ao buscar comunidades em alta:', err);
      setError('Erro ao carregar comunidades em alta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingCommunities();
  }, [user]);

  return {
    communities,
    loading,
    error,
    refetch: fetchTrendingCommunities
  };
}