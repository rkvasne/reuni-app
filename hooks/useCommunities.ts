'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Community {
  id: string;
  nome: string;
  descricao: string;
  avatar_url?: string;
  banner_url?: string;
  categoria: string;
  tipo: 'publica' | 'privada' | 'restrita';
  criador_id: string;
  membros_count: number;
  eventos_count: number;
  created_at: string;
  updated_at: string;
  // Dados relacionais
  is_member?: boolean;
  user_role?: 'admin' | 'moderador' | 'membro';
  criador?: {
    nome: string;
  };
}

export interface CommunityMember {
  id: string;
  comunidade_id: string;
  usuario_id: string;
  papel: 'admin' | 'moderador' | 'membro';
  status: 'ativo' | 'pendente' | 'banido';
  joined_at: string;
  usuario: {
    nome: string;
    email: string;
  };
}

export interface CreateCommunityData {
  nome: string;
  descricao: string;
  categoria: string;
  tipo: 'publica' | 'privada' | 'restrita';
}

export function useCommunities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async (filters?: {
    categoria?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('comunidades')
        .select(`
          *,
          criador:usuarios!criador_id (
            nome
          ),
          membros_count:membros_comunidade(count),
          eventos_count:eventos(count)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      if (filters?.search) {
        query = query.ilike('nome', `%${filters.search}%`);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: communitiesData, error } = await query;

      if (error) throw error;

      if (user) {
        // Buscar informações de participação do usuário
        const { data: userMemberships } = await supabase
          .from('membros_comunidade')
          .select('comunidade_id, papel')
          .eq('usuario_id', user.id)
          .eq('status', 'ativo');

        const userMembershipMap = new Map(
          userMemberships?.map(membership => [membership.comunidade_id, membership.papel]) || []
        );

        // Enriquecer dados com informações do usuário
        const enrichedCommunities = communitiesData.map(community => ({
          ...community,
          is_member: userMembershipMap.has(community.id),
          user_role: userMembershipMap.get(community.id)
        }));
        setCommunities(enrichedCommunities);
      } else {
        // Para dados de exemplo ou quando não há usuário
        const enrichedCommunities = communitiesData.map(community => ({
          ...community,
          is_member: false,
          user_role: undefined
        }));
        setCommunities(enrichedCommunities);
      }
    } catch (err) {
      console.error('Erro ao buscar comunidades:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Em caso de erro total, usar dados vazios
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Criar nova comunidade
  const createCommunity = async (data: CreateCommunityData) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data: community, error } = await supabase
        .from('comunidades')
        .insert({
          ...data,
          criador_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar criador como admin da comunidade
      await supabase
        .from('membros_comunidade')
        .insert({
          comunidade_id: community.id,
          usuario_id: user.id,
          papel: 'admin',
          status: 'ativo'
        });

      // Atualizar lista local
      await fetchCommunities();

      return community;
    } catch (err) {
      console.error('Erro ao criar comunidade:', err);
      throw err;
    }
  };

  // Participar de uma comunidade
  const joinCommunity = async (communityId: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('membros_comunidade')
        .insert({
          comunidade_id: communityId,
          usuario_id: user.id,
          papel: 'membro',
          status: 'ativo'
        });

      if (error) throw error;

      // Atualizar lista local
      setCommunities(prev => 
        prev.map(community => 
          community.id === communityId 
            ? { 
                ...community, 
                is_member: true, 
                user_role: 'membro',
                membros_count: community.membros_count + 1
              }
            : community
        )
      );
    } catch (err) {
      console.error('Erro ao participar da comunidade:', err);
      throw err;
    }
  };

  // Sair de uma comunidade
  const leaveCommunity = async (communityId: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('membros_comunidade')
        .delete()
        .eq('comunidade_id', communityId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      // Atualizar lista local
      setCommunities(prev => 
        prev.map(community => 
          community.id === communityId 
            ? { 
                ...community, 
                is_member: false, 
                user_role: undefined,
                membros_count: Math.max(0, community.membros_count - 1)
              }
            : community
        )
      );
    } catch (err) {
      console.error('Erro ao sair da comunidade:', err);
      throw err;
    }
  };

  // Buscar comunidades do usuário
  const fetchUserCommunities = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('membros_comunidade')
        .select(`
          *,
          comunidade:comunidades(*)
        `)
        .eq('usuario_id', user.id)
        .eq('status', 'ativo')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data?.map(member => ({
        ...member.comunidade,
        is_member: true,
        user_role: member.papel
      })) || [];
    } catch (err) {
      console.error('Erro ao buscar comunidades do usuário:', err);
      return [];
    }
  };

  // Categorias disponíveis
  const categories = [
    'Arte',
    'Culinária',
    'Educação',
    'Esportes',
    'Fotografia',
    'Literatura',
    'Música',
    'Negócios',
    'Outros',
    'Saúde',
    'Tecnologia',
    'Viagem'
  ];

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  return {
    communities,
    loading,
    error,
    categories,
    fetchCommunities,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    fetchUserCommunities,
    refetch: fetchCommunities
  };
}