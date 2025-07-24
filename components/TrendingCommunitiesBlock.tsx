'use client';

import { useTrendingCommunities } from '@/hooks/useTrendingCommunities';
import { Users, Calendar, TrendingUp, Plus } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface TrendingCommunitiesBlockProps {
  maxCommunities?: number;
}

export default function TrendingCommunitiesBlock({ maxCommunities = 4 }: TrendingCommunitiesBlockProps) {
  const { communities, loading, error } = useTrendingCommunities();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: maxCommunities }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="text-center py-6">
        <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-600">
          Nenhuma comunidade em alta no momento
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Seja o primeiro a criar uma!
        </p>
      </div>
    );
  }

  const displayCommunities = communities.slice(0, maxCommunities);

  return (
    <div className="space-y-3">
      {displayCommunities.map((community) => (
        <div 
          key={community.id} 
          className="group cursor-pointer p-2 rounded-lg hover:bg-neutral-50 transition-colors"
          onClick={() => {
            // TODO: Navegar para página da comunidade
            console.log('Comunidade clicada:', community);
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar da comunidade */}
            <div className="flex-shrink-0">
              {community.avatar_url ? (
                <OptimizedImage
                  src={community.avatar_url}
                  alt={community.nome}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-400" />
                </div>
              )}
            </div>

            {/* Info da comunidade */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm text-neutral-800 truncate">
                  {community.nome}
                </h4>
                {community.growth_rate > 10 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">
                      +{Math.round(community.growth_rate)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 mb-1">
                <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {community.categoria}
                </span>
                {community.user_is_member && (
                  <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    Membro
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{community.membros_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{community.eventos_count}</span>
                </div>
              </div>
            </div>

            {/* Botão de ação */}
            <div className="flex-shrink-0">
              {community.user_is_member ? (
                <button className="text-primary-600 hover:text-primary-700 p-1">
                  <span className="text-xs">Ver</span>
                </button>
              ) : (
                <button className="text-neutral-400 hover:text-primary-600 p-1 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Ver todas as comunidades */}
      {communities.length > maxCommunities && (
        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2 hover:bg-primary-50 rounded-lg transition-colors">
          Ver todas as comunidades
        </button>
      )}
    </div>
  );
}