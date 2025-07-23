'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Users } from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';
import CommunityCard from './CommunityCard';

interface CommunityListProps {
  showCreateButton?: boolean;
  limit?: number;
  userCommunitiesOnly?: boolean;
}

export default function CommunityList({ 
  showCreateButton = true, 
  limit,
  userCommunitiesOnly = false 
}: CommunityListProps) {
  const { 
    communities, 
    loading, 
    error, 
    categories, 
    fetchCommunities,
    fetchUserCommunities 
  } = useCommunities();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Aplicar filtros
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (userCommunitiesOnly) {
        fetchUserCommunities();
      } else {
        fetchCommunities({
          search: searchTerm || undefined,
          categoria: selectedCategory || undefined,
          limit
        });
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, userCommunitiesOnly, limit]);

  const handleCreateCommunity = () => {
    // Redirecionar para modal ou página de criação
    window.location.href = '/communities/create';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton Loading */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded flex-1"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    const isRLSError = error.includes('recursion') || error.includes('RLS') || error.includes('⚠️');
    
    return (
      <div className={`border rounded-lg p-6 ${isRLSError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${isRLSError ? 'text-yellow-600' : 'text-red-600'}`}>
            {isRLSError ? '⚠️' : '❌'}
          </div>
          <div className="flex-1">
            <h3 className={`font-medium ${isRLSError ? 'text-yellow-800' : 'text-red-800'}`}>
              {isRLSError ? 'Problema Temporário no Banco de Dados' : 'Erro ao Carregar Comunidades'}
            </h3>
            <p className={`mt-1 text-sm ${isRLSError ? 'text-yellow-700' : 'text-red-600'}`}>
              {isRLSError 
                ? 'As políticas RLS estão causando recursão infinita. Mostrando dados de exemplo enquanto isso.'
                : error
              }
            </p>
            {isRLSError && (
              <div className="mt-3 text-sm text-yellow-700">
                <p className="font-medium">Para corrigir permanentemente:</p>
                <ol className="mt-1 ml-4 list-decimal space-y-1">
                  <li>Execute o arquivo <code className="bg-yellow-100 px-1 rounded">supabase/migrations/010_fix_rls_recursion.sql</code></li>
                  <li>Ou temporariamente: <code className="bg-yellow-100 px-1 rounded">supabase/migrations/011_disable_rls_temp.sql</code></li>
                </ol>
              </div>
            )}
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => fetchCommunities()}
                className={`text-sm font-medium hover:underline ${isRLSError ? 'text-yellow-600 hover:text-yellow-800' : 'text-red-600 hover:text-red-800'}`}
              >
                Tentar Novamente
              </button>
              {isRLSError && (
                <button
                  onClick={() => window.open('/SUPABASE_RLS_FIX.md', '_blank')}
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-800 hover:underline"
                >
                  Ver Guia de Correção
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Busca e Filtros */}
      {!userCommunitiesOnly && (
        <div className="space-y-4">
          {/* Título e Botão Criar */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Comunidades
            </h2>
            {showCreateButton && (
              <button
                onClick={handleCreateCommunity}
                className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Comunidade
              </button>
            )}
          </div>

          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar comunidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>

            {showFilters && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Lista de Comunidades */}
      {communities.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userCommunitiesOnly ? 'Você ainda não participa de nenhuma comunidade' : 'Nenhuma comunidade encontrada'}
          </h3>
          <p className="text-gray-500 mb-6">
            {userCommunitiesOnly 
              ? 'Explore e participe de comunidades que interessam você!'
              : 'Tente ajustar os filtros ou criar uma nova comunidade.'
            }
          </p>
          {showCreateButton && (
            <button
              onClick={handleCreateCommunity}
              className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Comunidade
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map(community => (
            <CommunityCard
              key={community.id}
              community={community}
            />
          ))}
        </div>
      )}

      {/* Mostrar mais (se houver limite) */}
      {limit && communities.length === limit && (
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/communities'}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver Todas as Comunidades
          </button>
        </div>
      )}
    </div>
  );
}