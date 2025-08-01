'use client'

import { Search, Bell, MessageCircle, User, LogOut, Settings, Zap, Filter } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useRouter } from 'next/navigation'
import QuickActionsBlock from './QuickActionsBlock'
import VisualFilterBar from './VisualFilterBar'
import OptimizedImage from './OptimizedImage'
import Image from 'next/image'

interface HeaderProps {
  onCreateEvent?: () => void;
}

export default function Header({ onCreateEvent }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { userProfile } = useUserProfile()
  const router = useRouter()
  

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const quickActionsRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false)
      }
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
    }

    if (showUserMenu || showQuickActions || showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showQuickActions, showFilters])
  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-card backdrop-blur-md border-b border-white/20 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image 
              src="/imagens/logo-reuni.png" 
              alt="Logo Reuni" 
              width={40} 
              height={40}
              className="object-contain"
            />
            <h1 className="text-3xl font-bold text-gradient tracking-tight">
              Reuni
            </h1>
          </div>
          
          {/* Barra de Pesquisa Inteligente */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar eventos, comunidades, organizadores..."
                className="input-field pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 focus:border-primary-400 focus:ring-primary-200 rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query.trim()) {
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    } else {
                      router.push('/search');
                    }
                  }
                }}
              />
              
              {/* Dropdown de Sugestões */}
              <div className="absolute top-full left-0 right-0 bg-gradient-card backdrop-blur-md rounded-2xl shadow-reuni-lg border border-white/20 mt-2 py-3 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50">
                
                {/* Buscas Rápidas */}
                <div className="px-3 py-2">
                  <div className="text-xs text-neutral-500 font-medium mb-2">Buscas Rápidas</div>
                  <div className="space-y-1">
                    {[
                      { name: 'Eventos hoje', query: 'hoje' },
                      { name: 'Eventos gratuitos', query: 'gratuitos' },
                      { name: 'Eventos online', query: 'online' },
                      { name: 'Tecnologia', query: 'tecnologia' },
                      { name: 'Música ao vivo', query: 'música' }
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => router.push(`/search?q=${item.query}`)}
                        className="block w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 rounded transition-colors duration-120"
                      >
                        🔍 {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-100 px-3 py-2">
                  <button
                    onClick={() => router.push('/search')}
                    className="w-full text-left px-2 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors font-medium"
                  >
                    Ver busca avançada →
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Busca Mobile */}
          <button 
            onClick={() => router.push('/search')}
            className="md:hidden p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110"
          >
            <Search className="w-6 h-6 text-primary-600" />
          </button>

          {/* Ações do usuário */}
          <div className="flex items-center gap-2">
            {/* Menu Filtros de Eventos */}
            <div className="relative" ref={filtersRef}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110 group"
              >
                <Filter className="w-6 h-6 text-primary-600 group-hover:text-primary-700" />
              </button>

              {/* Dropdown Filtros */}
              {showFilters && (
                <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-reuni-xl border border-neutral-200 p-4 w-96 z-50">
                  <div className="mb-3">
                    <h3 className="font-semibold text-neutral-800 text-sm">Filtros de Eventos</h3>
                    <p className="text-xs text-neutral-600">Filtre eventos por período e categoria</p>
                  </div>
                  <VisualFilterBar onFiltersChange={(filters) => {
                    // TODO: Implementar lógica de filtros
                    console.log('Filtros aplicados:', filters)
                  }} />
                </div>
              )}
            </div>

            {/* Menu Ações Rápidas */}
            <div className="relative" ref={quickActionsRef}>
              <button 
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110 group"
              >
                <Zap className="w-6 h-6 text-primary-600 group-hover:text-primary-700" />
              </button>

              {/* Dropdown Ações Rápidas */}
              {showQuickActions && (
                <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-reuni-xl border border-neutral-200 p-4 w-80 z-50">
                  <div className="mb-3">
                    <h3 className="font-semibold text-neutral-800 text-sm">Ações Rápidas</h3>
                    <p className="text-xs text-neutral-600">Acesse rapidamente suas funcionalidades</p>
                  </div>
                  <QuickActionsBlock onCreateEvent={onCreateEvent} />
                </div>
              )}
            </div>

            <button className="p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110 relative group">
              <Bell className="w-6 h-6 text-primary-600 group-hover:text-primary-700" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              </span>
            </button>
            
            <button className="p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110 group">
              <MessageCircle className="w-6 h-6 text-primary-600 group-hover:text-primary-700" />
            </button>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110 group"
              >
                <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-reuni group-hover:shadow-glow transition-all duration-300 overflow-hidden">
                  {userProfile?.avatar ? (
                    <OptimizedImage
                      src={userProfile.avatar}
                      alt={userProfile.nome || 'Avatar'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      fallback={<User className="w-5 h-5 text-white" />}
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>

              {/* Menu do usuário */}
              {showUserMenu && (
                <div className="absolute right-0 top-14 bg-gradient-card backdrop-blur-md rounded-2xl shadow-reuni-xl border border-white/20 py-3 w-52 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-medium text-neutral-800">{userProfile?.nome || user?.user_metadata?.name || 'Usuário'}</p>
                    <p className="text-sm text-neutral-500">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => {
                      router.push('/profile')
                      setShowUserMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </button>
                  <button 
                    onClick={() => {
                      router.push('/profile?tab=settings')
                      setShowUserMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>
                  <hr className="my-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </header>
  )
}