'use client';

import { useState } from 'react';
import { Users, Calendar, Crown, Shield, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Community } from '@/hooks/useCommunities';
import { useCommunities } from '@/hooks/useCommunities';

interface CommunityCardProps {
  community: Community;
  onJoin?: (communityId: string) => void;
  onLeave?: (communityId: string) => void;
}

export default function CommunityCard({ community, onJoin, onLeave }: CommunityCardProps) {
  const { joinCommunity, leaveCommunity } = useCommunities();
  const [loading, setLoading] = useState(false);

  const handleJoinLeave = async () => {
    setLoading(true);
    try {
      if (community.is_member) {
        await leaveCommunity(community.id);
        onLeave?.(community.id);
      } else {
        await joinCommunity(community.id);
        onJoin?.(community.id);
      }
    } catch (error) {
      console.error('Erro ao alterar participação:', error);
      // Você pode adicionar um toast/notificação aqui
      alert('Erro ao alterar participação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Tecnologia': 'bg-blue-100 text-blue-800',
      'Arte': 'bg-purple-100 text-purple-800',
      'Esportes': 'bg-green-100 text-green-800',
      'Música': 'bg-pink-100 text-pink-800',
      'Culinária': 'bg-orange-100 text-orange-800',
      'Literatura': 'bg-indigo-100 text-indigo-800',
      'Fotografia': 'bg-yellow-100 text-yellow-800',
      'Viagem': 'bg-teal-100 text-teal-800',
      'Negócios': 'bg-gray-100 text-gray-800',
      'Educação': 'bg-red-100 text-red-800',
      'Saúde': 'bg-emerald-100 text-emerald-800',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderador':
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (tipo: string) => {
    const labels = {
      'publica': 'Pública',
      'privada': 'Privada',
      'restrita': 'Restrita'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header com Avatar/Banner */}
      <div className="relative h-32 bg-gradient-to-r from-primary-500 to-secondary-500">
        {community.banner_url && (
          <div className="absolute inset-0">
            <Image
              src={community.banner_url}
              alt={`Banner da ${community.nome}`}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
        
        {/* Avatar da Comunidade */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-12 h-12 bg-white rounded-full p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Tipo da Comunidade */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-black/20 text-white text-xs rounded-full">
            {getTypeLabel(community.tipo)}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 pt-8">
        {/* Nome e Papel do Usuário */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {community.nome}
          </h3>
          {community.user_role && getRoleIcon(community.user_role)}
        </div>

        {/* Categoria */}
        <div className="mb-3">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(community.categoria)}`}>
            {community.categoria}
          </span>
        </div>

        {/* Descrição */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {community.descricao || 'Sem descrição disponível.'}
        </p>

        {/* Estatísticas */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{community.membros_count}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{community.eventos_count}</span>
            </div>
          </div>
          
          {/* Criador */}
          {community.criador && (
            <div className="flex items-center">
              <span className="text-xs">por {community.criador.nome}</span>
            </div>
          )}
        </div>

        {/* Botão de Ação */}
        <div className="flex space-x-2">
          <button
            onClick={handleJoinLeave}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              community.is_member
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Carregando...
              </div>
            ) : community.is_member ? (
              'Sair'
            ) : (
              'Participar'
            )}
          </button>

          <button
            onClick={() => window.location.href = `/communities/${community.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            Ver Mais
          </button>
        </div>
      </div>
    </div>
  );
}