'use client';

import { useState, useEffect } from 'react';
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

  // Buscar comunidades com informações de membro
  const fetchCommunities = async (filters?: {
    categoria?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se é erro de recursão RLS e usar dados mock
      let communitiesData: any[] = [];
      let isRLSError = false;

      try {
        let query = supabase
          .from('comunidades')
          .select(`
            *,
            criador:usuarios!criador_id(nome)
          `)
          .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters?.categoria) {
          query = query.eq('categoria', filters.categoria);
        }

        if (filters?.search) {
          query = query.or(`nome.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`);
        }

        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        if (filters?.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        const { data, error: communitiesError } = await query;

        if (communitiesError) {
          // Verificar se é erro de recursão RLS
          if (communitiesError.code === '42P17' || communitiesError.message?.includes('infinite recursion')) {
            isRLSError = true;
            throw communitiesError;
          }
          throw communitiesError;
        }

        communitiesData = data || [];
      } catch (err: any) {
        if (err.code === '42P17' || err.message?.includes('infinite recursion')) {
          isRLSError = true;
          console.warn('Erro de recursão RLS detectado, usando dados de exemplo');
          
          // Dados de exemplo para quando há erro RLS
          communitiesData = [
            {
              id: 'example-1',
              nome: 'React Developers',
              descricao: 'Comunidade para desenvolvedores React',
              categoria: 'Tecnologia',
              tipo: 'publica',
              criador_id: user?.id || 'example-user',
              membros_count: 156,
              eventos_count: 23,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              criador: { nome: 'Desenvolvedor' }
            },
            {
              id: 'example-2',
              nome: 'Futebol Amador SP',
              descricao: 'Peladas e campeonatos em São Paulo',
              categoria: 'Esportes',
              tipo: 'publica',
              criador_id: user?.id || 'example-user',
              membros_count: 89,
              eventos_count: 12,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              criador: { nome: 'Organizador' }
            },
            {
              id: 'example-3',
              nome: 'Fotografia Urbana',
              descricao: 'Explorando a cidade através das lentes',
              categoria: 'Arte',
              tipo: 'publica',
              criador_id: user?.id || 'example-user',
              membros_count: 67,
              eventos_count: 8,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              criador: { nome: 'Fotógrafo' }
            }
          ];
          
          setError('⚠️ Problema temporário no banco de dados. Mostrando dados de exemplo. Execute o script de correção RLS.');
        } else {
          throw err;
        }
      }

      // Se usuário logado e não há erro RLS, buscar informações de membro
      if (user && communitiesData && !isRLSError) {
        try {
          const communityIds = communitiesData.map(c => c.id);
          
          const { data: memberData } = await supabase
            .from('membros_comunidade')
            .select('comunidade_id, papel, status')
            .eq('usuario_id', user.id)
            .in('comunidade_id', communityIds)
            .eq('status', 'ativo');

          const memberMap = new Map(
            memberData?.map(m => [m.comunidade_id, m]) || []
          );

          const enrichedCommunities = communitiesData.map(community => ({
            ...community,
            is_member: memberMap.has(community.id),
            user_role: memberMap.get(community.id)?.papel
          }));

          setCommunities(enrichedCommunities);
        } catch (memberErr) {
          // Se erro ao buscar membros, usar dados sem informação de membro
          console.warn('Erro ao buscar informações de membro:', memberErr);
          setCommunities(communitiesData);
        }
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
  };

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
    'Tecnologia',
    'Arte',
    'Esportes',
    'Música',
    'Culinária',
    'Literatura',
    'Fotografia',
    'Viagem',
    'Negócios',
    'Educação',
    'Saúde',
    'Outros'
  ];

  useEffect(() => {
    fetchCommunities();
  }, [user]);

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