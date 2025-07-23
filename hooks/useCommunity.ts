'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Community, CommunityMember } from './useCommunities';

export interface CommunityEvent {
  id: string;
  titulo: string;
  descricao: string;
  data_evento: string;
  local: string;
  categoria: string;
  max_participantes?: number;
  participantes_count: number;
  organizador_id: string;
  comunidade_id: string;
  created_at: string;
  organizador: {
    nome: string;
  };
  is_participating?: boolean;
}

export function useCommunity(communityId: string) {
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados da comunidade
  const fetchCommunity = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: communityData, error: communityError } = await supabase
        .from('comunidades')
        .select(`
          *,
          criador:usuarios!criador_id(nome)
        `)
        .eq('id', communityId)
        .single();

      if (communityError) throw communityError;

      // Verificar se usuário é membro
      let userRole = undefined;
      let isMember = false;

      if (user) {
        const { data: memberData } = await supabase
          .from('membros_comunidade')
          .select('papel, status')
          .eq('comunidade_id', communityId)
          .eq('usuario_id', user.id)
          .eq('status', 'ativo')
          .single();

        if (memberData) {
          isMember = true;
          userRole = memberData.papel;
        }
      }

      setCommunity({
        ...communityData,
        is_member: isMember,
        user_role: userRole
      });
    } catch (err) {
      console.error('Erro ao buscar comunidade:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Buscar membros da comunidade
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('membros_comunidade')
        .select(`
          *,
          usuario:usuarios(nome, email)
        `)
        .eq('comunidade_id', communityId)
        .eq('status', 'ativo')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    }
  };

  // Buscar eventos da comunidade
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          organizador:usuarios!organizador_id(nome)
        `)
        .eq('comunidade_id', communityId)
        .order('data_evento', { ascending: true });

      if (error) throw error;

      // Se usuário logado, verificar participação
      if (user && data) {
        const eventIds = data.map(e => e.id);
        
        const { data: participationData } = await supabase
          .from('participantes_evento')
          .select('evento_id')
          .eq('usuario_id', user.id)
          .in('evento_id', eventIds);

        const participatingEvents = new Set(
          participationData?.map(p => p.evento_id) || []
        );

        const enrichedEvents = data.map(event => ({
          ...event,
          is_participating: participatingEvents.has(event.id)
        }));

        setEvents(enrichedEvents);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
    }
  };

  // Atualizar papel de um membro
  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'moderador' | 'membro') => {
    if (!user || !community?.user_role || community.user_role !== 'admin') {
      throw new Error('Sem permissão para alterar papéis');
    }

    try {
      const { error } = await supabase
        .from('membros_comunidade')
        .update({ papel: newRole })
        .eq('id', memberId);

      if (error) throw error;

      // Atualizar lista local
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, papel: newRole }
            : member
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar papel:', err);
      throw err;
    }
  };

  // Remover membro da comunidade
  const removeMember = async (memberId: string) => {
    if (!user || !community?.user_role || !['admin', 'moderador'].includes(community.user_role)) {
      throw new Error('Sem permissão para remover membros');
    }

    try {
      const { error } = await supabase
        .from('membros_comunidade')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Atualizar lista local
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      // Atualizar contador da comunidade
      if (community) {
        setCommunity(prev => prev ? {
          ...prev,
          membros_count: Math.max(0, prev.membros_count - 1)
        } : null);
      }
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      throw err;
    }
  };

  // Atualizar informações da comunidade
  const updateCommunity = async (updates: Partial<Community>) => {
    if (!user || !community?.user_role || !['admin'].includes(community.user_role)) {
      throw new Error('Sem permissão para editar comunidade');
    }

    try {
      const { data, error } = await supabase
        .from('comunidades')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)
        .select()
        .single();

      if (error) throw error;

      setCommunity(prev => prev ? { ...prev, ...data } : null);
      return data;
    } catch (err) {
      console.error('Erro ao atualizar comunidade:', err);
      throw err;
    }
  };

  // Deletar comunidade
  const deleteCommunity = async () => {
    if (!user || !community?.user_role || community.user_role !== 'admin') {
      throw new Error('Sem permissão para deletar comunidade');
    }

    try {
      const { error } = await supabase
        .from('comunidades')
        .delete()
        .eq('id', communityId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Erro ao deletar comunidade:', err);
      throw err;
    }
  };

  // Verificar se usuário pode moderar
  const canModerate = () => {
    return community?.user_role && ['admin', 'moderador'].includes(community.user_role);
  };

  // Verificar se usuário é admin
  const isAdmin = () => {
    return community?.user_role === 'admin';
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunity();
      fetchMembers();
      fetchEvents();
    }
  }, [communityId, user]);

  return {
    community,
    members,
    events,
    loading,
    error,
    fetchCommunity,
    fetchMembers,
    fetchEvents,
    updateMemberRole,
    removeMember,
    updateCommunity,
    deleteCommunity,
    canModerate,
    isAdmin,
    refetch: () => {
      fetchCommunity();
      fetchMembers();
      fetchEvents();
    }
  };
}