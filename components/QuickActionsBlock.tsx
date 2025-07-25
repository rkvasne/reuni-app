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
    {
      id: 'create-event',
      label: 'Criar Evento',
      icon: <Plus className="w-4 h-4" />,
      onClick: () => {
        if (onCreateEvent) {
          onCreateEvent();
        } else {
          router.push('/create-event');
        }
      },
      color: 'bg-primary-500 hover:bg-primary-600',
      description: 'Organize um novo evento',
      requiresAuth: true
    },
    {
      id: 'create-community',
      label: 'Nova Comunidade',
      icon: <Users className="w-4 h-4" />,
      href: '/communities',
      color: 'bg-secondary-500 hover:bg-secondary-600',
      description: 'Ver comunidades',
      requiresAuth: true
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: <Search className="w-4 h-4" />,
      href: '/search',
      color: 'bg-accent-500 hover:bg-accent-600',
      description: 'Encontre eventos'
    },
    {
      id: 'my-events',
      label: 'Meus Eventos',
      icon: <Calendar className="w-4 h-4" />,
      href: '/profile',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Eventos que vou',
      requiresAuth: true
    },
    {
      id: 'saved',
      label: 'Salvos',
      icon: <Bookmark className="w-4 h-4" />,
      href: '/profile?tab=salvos',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Eventos salvos',
      requiresAuth: true
    },
    {
      id: 'nearby',
      label: 'Próximos',
      icon: <MapPin className="w-4 h-4" />,
      href: '/search?filter=proximo',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Eventos próximos'
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: <Bell className="w-4 h-4" />,
      href: '/profile?tab=notifications',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Suas notificações',
      requiresAuth: true
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="w-4 h-4" />,
      href: '/profile?tab=settings',
      color: 'bg-neutral-500 hover:bg-neutral-600',
      description: 'Configurar conta',
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
            ${action.color} text-white p-3 rounded-lg transition-all
            hover:scale-105 hover:shadow-md active:scale-95
            flex flex-col items-center gap-2 group
          `}
          title={action.description}
        >
          <div className="group-hover:scale-110 transition-transform">
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