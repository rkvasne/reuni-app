'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import OptimizedImage from './OptimizedImage';
import CompactEventCard from './CompactEventCard';

interface FriendActivity {
  friend: {
    id: string;
    nome: string;
    avatar?: string;
  };
  event: {
    id: string;
    titulo: string;
    data: string;
    hora: string;
    local: string;
    categoria: string;
    imagem_url?: string;
  };
}

export default function FriendsGoingToday() {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchFriendsGoingToday();
  }, [user]);

  const fetchFriendsGoingToday = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Por enquanto, vamos simular dados já que não temos sistema de amizades
      // TODO: Implementar sistema de amizades real
      
      // Buscar eventos de hoje com participações
      const today = new Date().toISOString().split('T')[0];
      
      const { data: eventsData, error } = await supabase
        .from('eventos')
        .select(`
          id,
          titulo,
          data,
          hora,
          local,
          categoria,
          imagem_url,
          participacoes!inner(
            usuario_id,
            usuarios(id, nome, avatar)
          )
        `)
        .eq('data', today)
        .neq('organizador_id', user.id) // Não incluir próprios eventos
        .limit(10);

      if (error) throw error;

      // Simular amigos (por enquanto, pegar alguns participantes aleatórios)
      const mockActivities: FriendActivity[] = [];
      
      eventsData?.forEach(event => {
        // Pegar até 2 "amigos" por evento
        const participants = event.participacoes?.slice(0, 2) || [];
        
        participants.forEach((participation: any) => {
          if (participation.usuarios && participation.usuario_id !== user.id) {
            mockActivities.push({
              friend: {
                id: participation.usuarios.id,
                nome: participation.usuarios.nome,
                avatar: participation.usuarios.avatar
              },
              event: {
                id: event.id,
                titulo: event.titulo,
                data: event.data,
                hora: event.hora,
                local: event.local,
                categoria: event.categoria,
                imagem_url: event.imagem_url
              }
            });
          }
        });
      });

      // Limitar a 5 atividades e remover duplicatas por amigo
      const uniqueActivities = mockActivities
        .filter((activity, index, self) => 
          index === self.findIndex(a => a.friend.id === activity.friend.id)
        )
        .slice(0, 5);

      setActivities(uniqueActivities);
    } catch (error) {
      console.error('Erro ao buscar amigos indo hoje:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-neutral-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-600">
          Nenhum amigo confirmado para hoje
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Convide amigos para eventos!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div key={`${activity.friend.id}-${activity.event.id}`} className="group">
          {/* Amigo + Evento */}
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer">
            {/* Avatar do amigo */}
            <div className="flex-shrink-0">
              {activity.friend.avatar ? (
                <OptimizedImage
                  src={activity.friend.avatar}
                  alt={activity.friend.nome}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {activity.friend.nome.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info do evento */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-neutral-800 truncate">
                  {activity.friend.nome}
                </span>
                <span className="text-xs text-neutral-500">vai para</span>
              </div>
              
              <div className="text-sm text-neutral-700 font-medium truncate mb-1">
                {activity.event.titulo}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(activity.event.hora)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{activity.event.local}</span>
                </div>
              </div>
            </div>

            {/* Categoria badge */}
            <div className="flex-shrink-0">
              <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {activity.event.categoria}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Ver mais */}
      {activities.length >= 5 && (
        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2 hover:bg-primary-50 rounded-lg transition-colors">
          Ver todos os amigos
        </button>
      )}
    </div>
  );
}