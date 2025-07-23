'use client';

import { useState } from 'react';
import { Users, TrendingUp, Star, ArrowLeft, Plus, Hash, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import CommunityList from '@/components/CommunityList';
import CreateCommunityModal from '@/components/CreateCommunityModal';
import RLSWarning from '@/components/RLSWarning';
import { useCommunities } from '@/hooks/useCommunities';

export default function CommunitiesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'popular'>('all');
  const { fetchCommunities, error } = useCommunities();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  const handleCommunityCreated = () => {
    setShowCreateModal(false);
    fetchCommunities(); // Refresh the list
  };

  const tabs = [
    { id: 'all', label: 'Todas', icon: Users },
    { id: 'my', label: 'Minhas', icon: Star },
    { id: 'popular', label: 'Populares', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      {/* Layout IGUAL ao app principal */}
      <div className="pt-16"> {/* Offset para header fixo */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6">

            {/* Sidebar Esquerda - IGUAL ao padrão */}
            <div className="lg:col-span-3 hidden lg:block">
              <div className="sticky top-20">
                <div className="space-y-6">
                  {/* Navegação */}
                  <div className="card p-4">
                    <button
                      onClick={() => router.push('/')}
                      className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar ao Feed
                    </button>
                  </div>

                  {/* Filtros Rápidos */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                      <Hash className="w-5 h-5" />
                      Categorias
                    </h3>
                    
                    <div className="space-y-2">
                      {[
                        { name: 'Tecnologia', icon: '💻', count: 23 },
                        { name: 'Esportes', icon: '⚽', count: 18 },
                        { name: 'Arte', icon: '🎨', count: 15 },
                        { name: 'Música', icon: '🎵', count: 12 },
                        { name: 'Culinária', icon: '🍳', count: 9 },
                        { name: 'Negócios', icon: '💼', count: 7 }
                      ].map((category) => (
                        <button
                          key={category.name}
                          className="w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-left bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                        >
                          <span className="mr-3">{category.icon}</span>
                          <span className="flex-1">{category.name}</span>
                          <span className="text-xs opacity-60">{category.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-neutral-800 mb-4">📊 Estatísticas</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Total de Comunidades</span>
                        <span className="font-semibold text-neutral-800">84</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Membros Ativos</span>
                        <span className="font-semibold text-neutral-800">1,234</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Eventos Criados</span>
                        <span className="font-semibold text-neutral-800">456</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Central - IGUAL ao padrão */}
            <div className="lg:col-span-6">
              <div className="space-y-6">
                
                {/* RLS Warning */}
                {error && (
                  <RLSWarning message={error} />
                )}

                {/* Header da Página */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-neutral-800">
                        Comunidades
                      </h1>
                      <p className="text-neutral-600 mt-1">
                        Descubra e participe de comunidades incríveis
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Comunidade
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-neutral-200">
                    <nav className="flex space-x-8">
                      {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                              activeTab === tab.id
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Community List */}
                <div className="card p-6">
                  {activeTab === 'all' && (
                    <CommunityList showCreateButton={false} />
                  )}
                  
                  {activeTab === 'my' && (
                    <CommunityList 
                      showCreateButton={false} 
                      userCommunitiesOnly={true}
                    />
                  )}
                  
                  {activeTab === 'popular' && (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        Comunidades Populares
                      </h3>
                      <p className="text-neutral-500">
                        Em breve: ranking das comunidades mais ativas!
                      </p>
                    </div>
                  )}
                </div>
                
              </div>
            </div>

            {/* Sidebar Direita - IGUAL ao padrão */}
            <div className="lg:col-span-3 hidden lg:block">
              <div className="sticky top-20">
                <div className="space-y-6">
                  
                  {/* Comunidades em Destaque */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Em Destaque
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'React Developers', members: 1234, category: '💻' },
                        { name: 'Futebol Amador SP', members: 856, category: '⚽' },
                        { name: 'Fotografia Urbana', members: 642, category: '📸' }
                      ].map((community) => (
                        <button
                          key={community.name}
                          className="w-full p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{community.category}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-neutral-800">{community.name}</div>
                              <div className="text-xs text-neutral-600">{community.members} membros</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eventos Próximos */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Próximos Eventos
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Meetup React', community: 'React Devs', time: 'Hoje 19h' },
                        { name: 'Pelada no Parque', community: 'Futebol SP', time: 'Amanhã 8h' },
                        { name: 'Workshop Foto', community: 'Foto Urbana', time: 'Sábado 14h' }
                      ].map((event) => (
                        <button
                          key={event.name}
                          className="w-full p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                        >
                          <div className="font-medium text-sm text-neutral-800">{event.name}</div>
                          <div className="text-xs text-neutral-600 mt-1">
                            {event.community} • {event.time}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dicas */}
                  <div className="card p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                    <h4 className="font-semibold text-neutral-800 mb-3">💡 Dicas</h4>
                    <ul className="text-sm text-neutral-600 space-y-2">
                      <li>• Participe ativamente das discussões</li>
                      <li>• Organize eventos para sua comunidade</li>
                      <li>• Convide amigos com interesses similares</li>
                      <li>• Mantenha o respeito e cordialidade</li>
                    </ul>
                  </div>
                  
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCommunityCreated}
      />
    </div>
  );
}