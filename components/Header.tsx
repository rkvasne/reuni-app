'use client'

import { Search, Bell, MessageCircle, User, LogOut, Settings } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
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
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
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
              <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-lg border border-neutral-200 mt-1 py-2 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50">
                
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
            className="md:hidden p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <Search className="w-6 h-6 text-neutral-600" />
          </button>

          {/* Ações do usuário */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-neutral-100 rounded-xl transition-colors relative">
              <Bell className="w-6 h-6 text-neutral-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary-500 rounded-full"></span>
            </button>
            
            <button className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
              <MessageCircle className="w-6 h-6 text-neutral-600" />
            </button>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* Menu do usuário */}
              {showUserMenu && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-reuni-lg border border-neutral-200 py-2 w-48 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-medium text-neutral-800">{user?.user_metadata?.name || 'Usuário'}</p>
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