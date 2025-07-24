'use client';

import { Users, Calendar, TrendingUp } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

interface CommunityHighlightCardProps {
  community: {
    id: string;
    nome: string;
    descricao: string;
    categoria: string;
    avatar_url?: string;
    membros_count: number;
    eventos_count: number;
    user_is_member: boolean;
    growth_rate: number;
  };
  onClick?: () => void;
  compact?: boolean;
}

export default function CommunityHighlightCard({
  community,
  onClick,
  compact = false
}: CommunityHighlightCardProps) {
  
  return (
    <div 
      className={`card cursor-pointer hover:shadow-md transition-all ${
        compact ? 'p-3' : 'p-4'
      }`}
      onClick={onClick}
    >
      {/* Header com avatar e info */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar da comunidade */}
        <div className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}>
          {community.avatar_url ? (
            <OptimizedImage
              src={community.avatar_url}
              alt={community.nome}
              width={compact ? 40 : 48}
              height={compact ? 40 : 48}
              className="rounded-lg object-cover"
              fallback={
                <div className={`bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center ${
                  compact ? 'w-10 h-10' : 'w-12 h-12'
                }`}>
                  <Users className={`text-primary-400 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
              }
            />
          ) : (
            <div className={`bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center ${
              compact ? 'w-10 h-10' : 'w-12 h-12'
            }`}>
              <Users className={`text-primary-400 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </div>
          )}
        </div>
        
        {/* Info da comunidade */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-neutral-800 truncate ${
              compact ? 'text-sm' : 'text-base'
            }`}>
              {community.nome}
            </h4>
            {community.user_is_member && (
              <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-medium">
                Membro
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 mb-1">
            <span className={`bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium ${
              compact ? 'text-xs' : 'text-sm'
            }`}>
              {community.categoria}
            </span>
            {community.growth_rate > 10 && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">Em alta</span>
              </div>
            )}
          </div>
          
          {!compact && (
            <p className="text-sm text-neutral-600 line-clamp-2">
              {community.descricao}
            </p>
          )}
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-neutral-500" />
            <span className={`text-neutral-600 font-medium ${
              compact ? 'text-xs' : 'text-sm'
            }`}>
              {community.membros_count}
            </span>
            <span className={`text-neutral-500 ${
              compact ? 'text-xs' : 'text-sm'
            }`}>
              {community.membros_count === 1 ? 'membro' : 'membros'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className={`text-neutral-600 font-medium ${
              compact ? 'text-xs' : 'text-sm'
            }`}>
              {community.eventos_count}
            </span>
            <span className={`text-neutral-500 ${
              compact ? 'text-xs' : 'text-sm'
            }`}>
              {community.eventos_count === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
        </div>
        
        {/* Taxa de crescimento */}
        {community.growth_rate > 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs font-medium">
              +{Math.round(community.growth_rate)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}