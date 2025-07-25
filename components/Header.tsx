'use client'

import { Search, Bell, MessageCircle, User, LogOut, Settings, Zap, Filter } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import QuickActionsBlock from './QuickActionsBlock'
import { useNotification } from './NotificationContext'
import { useUserProfile } from '@/hooks/useUserProfile'

interface HeaderProps {
  onCreateEvent?: () => void;
}

export default function Header({ onCreateEvent }: HeaderProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Todos')

  const [imageError, setImageError] = useState(false)
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
        setShowFiltersDropdown(false)
      }
    }

    if (showUserMenu || showQuickActions || showFiltersDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showQuickActions, showFiltersDropdown])

  // Função para gerar iniciais do usuário
  const getUserInitials = (name: string | undefined): string => {
    if (!name) return 'U'
    
    const names = name.trim().split(' ')
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  const { unreadCount } = useNotification()
  const { userProfile } = useUserProfile()
  const displayName = userProfile?.nome || user?.user_metadata?.name || user?.user_metadata?.full_name || 'Usuário'
  const displayAvatar = userProfile?.avatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const userInitials = getUserInitials(displayName)
  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-card backdrop-blur-md border-b border-white/20 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gradient tracking-tight">
              Reuni
            </h1>
          </div>
          
          {/* Barra de Pesquisa Inteligente */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-600 w-5 h-5" />
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
                        className="block w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
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
          <div className="flex items-center gap-1">
            
            {/* Grupo de Ações Principais */}
            <div className="flex items-center gap-1 mr-2">
              {/* Menu Filtros */}
              <div className="relative" ref={filtersRef}>
                <button 
                  onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                  className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 group relative ${
                    showFiltersDropdown 
                      ? 'bg-primary-100 text-primary-700 shadow-reuni' 
                      : 'hover:bg-primary-50 text-primary-600'
                  }`}
                  title="Filtros de eventos"
                >
                  <Filter className="w-6 h-6 group-hover:text-primary-700" />
                  {activeFilter !== 'Todos' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full"></div>
                  )}
                </button>

                {/* Dropdown Filtros */}
                {showFiltersDropdown && (
                  <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-reuni-xl border border-neutral-200 p-4 w-80 z-50">
                    <div className="mb-3">
                      <h3 className="font-semibold text-neutral-800 text-sm">Filtros de Eventos</h3>
                      <p className="text-xs text-neutral-600">Filtre eventos por período e categoria</p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Filtros de Período */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Período</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: 'Todos', icon: '📅' },
                            { name: 'Hoje', icon: '⏰' },
                            { name: 'Esta Semana', icon: '📆' },
                            { name: 'Próximo de Mim', icon: '📍' }
                          ].map((period) => (
                            <button
                              key={period.name}
                              onClick={() => setActiveFilter(period.name)}
                              className={`flex items-center justify-start px-2 py-2 text-xs rounded transition-colors min-h-[32px] ${
                                activeFilter === period.name
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                              }`}
                            >
                              <span className="mr-2 text-sm">{period.icon}</span>
                              <span className="truncate">{period.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtros de Categorias */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Categorias</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: 'Tecnologia', icon: '💻' },
                            { name: 'Esportes', icon: '⚽' },
                            { name: 'Arte', icon: '🎨' },
                            { name: 'Música', icon: '🎵' },
                            { name: 'Culinária', icon: '🍳' },
                            { name: 'Negócios', icon: '💼' }
                          ].map((category) => (
                            <button
                              key={category.name}
                              className="flex items-center justify-start px-2 py-2 text-xs bg-neutral-100 hover:bg-neutral-200 rounded transition-colors min-h-[32px]"
                            >
                              <span className="mr-2 text-sm">{category.icon}</span>
                              <span className="truncate">{category.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtros de Local */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Local</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="flex items-center justify-start px-2 py-2 text-xs bg-neutral-100 hover:bg-neutral-200 rounded transition-colors min-h-[32px]">
                            <span className="mr-2 text-sm">📍</span>
                            <span className="truncate">Próximo a mim</span>
                          </button>
                          <button className="flex items-center justify-start px-2 py-2 text-xs bg-neutral-100 hover:bg-neutral-200 rounded transition-colors min-h-[32px]">
                            <span className="mr-2 text-sm">🌐</span>
                            <span className="truncate">Online</span>
                          </button>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="border-t border-neutral-100 pt-3 flex justify-between">
                        <button
                          onClick={() => setActiveFilter('Todos')}
                          className="text-xs text-neutral-500 hover:text-neutral-700"
                        >
                          Limpar filtros
                        </button>
                        <button
                          onClick={() => router.push('/search')}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Busca avançada →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Ações Rápidas */}
              <div className="relative" ref={quickActionsRef}>
                <button 
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 group ${
                    showQuickActions 
                      ? 'bg-primary-100 text-primary-700 shadow-reuni' 
                      : 'hover:bg-primary-50 text-primary-600'
                  }`}
                  title="Ações rápidas"
                >
                  <Zap className="w-6 h-6 group-hover:text-primary-700" />
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
            </div>

            {/* Separador visual */}
            <div className="w-px h-8 bg-neutral-200 mx-2"></div>

            <button className="p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 hover:scale-110 relative group">
              <Bell className="w-6 h-6 text-primary-600 group-hover:text-primary-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                  {unreadCount}
                </span>
              )}
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
                  {displayAvatar && !imageError ? (
                    <img 
                      src={displayAvatar}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-2xl"
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">{userInitials}</span>
                  )}
                </div>
              </button>

              {/* Menu do usuário */}
              {showUserMenu && (
                <div className="absolute right-0 top-14 bg-gradient-card backdrop-blur-md rounded-2xl shadow-reuni-xl border border-white/20 py-3 w-52 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-medium text-neutral-800">{displayName}</p>
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
                      router.push('/profile')
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