'use client';

import { 
  Plus, 
  Calendar, 
  Users, 
  Search, 
  Bookmark, 
  Settings,
  Bell,
  MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color: string;
  description?: string;
  requiresAuth?: boolean;
}

interface QuickActionsBlockProps {
  onCreateEvent?: () => void;
}

export default function QuickActionsBlock({ onCreateEvent }: QuickActionsBlockProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const quickActions: QuickAction[] = [
    // Grupo: Eventos (Roxo - Ação Principal)
    {
      id: 'create-event',
      label: 'Criar Evento',
      icon: <Plus className="w-5 h-5" />,
      onClick: () => {
        if (onCreateEvent) {
          onCreateEvent();
        } else {
          router.push('/create-event');
        }
      },
      color: 'bg-primary-500 hover:bg-primary-600 text-white',
      description: 'Organize um novo evento',
      requiresAuth: true
    },
    {
      id: 'my-events',
      label: 'Meus Eventos',
      icon: <Calendar className="w-5 h-5" />,
      href: '/profile',
      color: 'bg-primary-100 hover:bg-primary-200 text-primary-700',
      description: 'Eventos que vou',
      requiresAuth: true
    },
    // Grupo: Navegação (Azul Suave)
    {
      id: 'search',
      label: 'Buscar',
      icon: <Search className="w-5 h-5" />,
      href: '/search',
      color: 'bg-action-blue hover:bg-blue-100 text-action-blue-text',
      description: 'Encontre eventos'
    },
    {
      id: 'nearby',
      label: 'Próximos',
      icon: <MapPin className="w-5 h-5" />,
      href: '/search?filter=proximo',
      color: 'bg-action-blue hover:bg-blue-100 text-action-blue-text',
      description: 'Eventos próximos'
    },
    // Grupo: Comunidades (Verde Suave)
    {
      id: 'create-community',
      label: 'Comunidades',
      icon: <Users className="w-5 h-5" />,
      href: '/communities',
      color: 'bg-action-green hover:bg-green-100 text-action-green-text',
      description: 'Ver comunidades',
      requiresAuth: true
    },
    // Grupo: Configurações (Cinza Suave)
    {
      id: 'saved',
      label: 'Salvos',
      icon: <Bookmark className="w-5 h-5" />,
      href: '/profile?tab=salvos',
      color: 'bg-action-gray hover:bg-gray-100 text-action-gray-text',
      description: 'Eventos salvos',
      requiresAuth: true
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.requiresAuth && !isAuthenticated) {
      // TODO: Mostrar modal de login
      alert('Você precisa estar logado para esta ação');
      return;
    }

    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  // Filtrar ações baseado na autenticação
  const availableActions = quickActions.filter(action => 
    !action.requiresAuth || isAuthenticated
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {availableActions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className={`
            ${action.color} p-4 rounded-xl transition-all duration-200
            hover:scale-105 active:scale-95 transform
            flex flex-col items-center gap-2 group
            border border-white/20 shadow-sm hover:shadow-md
          `}
          title={action.description}
        >
          <div className="group-hover:scale-110 transition-transform duration-200">
            {action.icon}
          </div>
          <span className="text-xs font-medium text-center leading-tight">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}