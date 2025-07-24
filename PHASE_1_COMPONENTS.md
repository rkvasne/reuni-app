# 🔧 Fase 1: Componentes Base - Implementação

## 🎯 **Objetivo**
Criar componentes reutilizáveis e hooks sociais sem alterar o layout atual.

## 📋 **Checklist de Implementação**

### **1.1 Componente HorizontalSlider** 
- [ ] `components/ui/HorizontalSlider.tsx`
  - Navegação com setas
  - Scroll suave
  - Responsivo (mobile: scroll touch)
  - Props: items, itemWidth, gap, showArrows

### **1.2 Componentes de Slider Específicos**
- [ ] `components/EventSlider.tsx`
  - Usa HorizontalSlider como base
  - Props específicas para eventos
  - Loading states
- [ ] `components/CommunitySlider.tsx`
  - Para comunidades em alta
  - Cards compactos

### **1.3 Hooks Sociais**
- [ ] `hooks/useFriendsEvents.ts`
  - Buscar eventos que amigos vão participar
  - Cache e loading states
- [ ] `hooks/useSuggestedEvents.ts`
  - Algoritmo básico de sugestões
  - Baseado em categorias preferidas
- [ ] `hooks/useTrendingCommunities.ts`
  - Comunidades com mais atividade
  - Ordenação por membros/eventos

### **1.4 Cards Melhorados**
- [ ] `components/SocialEventCard.tsx`
  - Mostra "3 amigos vão participar"
  - Avatar dos amigos
  - Indicadores sociais
- [ ] `components/CompactEventCard.tsx`
  - Versão menor para sliders
  - Info essencial apenas
- [ ] `components/CommunityHighlightCard.tsx`
  - Para comunidades em alta
  - Métricas (membros, eventos)

## 🎨 **Especificações de Design**

### **HorizontalSlider**
```tsx
interface HorizontalSliderProps {
  children: React.ReactNode[]
  itemWidth?: string // "280px" default
  gap?: string // "16px" default
  showArrows?: boolean // true default
  className?: string
}
```

### **SocialEventCard**
```tsx
interface SocialEventCardProps {
  event: Event
  friendsGoing?: User[] // máximo 3
  showSocialInfo?: boolean
  compact?: boolean
}
```

### **Hooks Return Types**
```tsx
// useFriendsEvents
{
  events: Event[]
  loading: boolean
  error: string | null
  refetch: () => void
}

// useSuggestedEvents
{
  events: Event[]
  loading: boolean
  reasons: string[] // "Baseado em Tecnologia"
}
```

## 🔧 **Implementação Técnica**

### **1. HorizontalSlider Base**
```tsx
// components/ui/HorizontalSlider.tsx
export default function HorizontalSlider({
  children,
  itemWidth = "280px",
  gap = "16px",
  showArrows = true,
  className = ""
}: HorizontalSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const scroll = (direction: 'left' | 'right') => {
    // Implementar scroll suave
  }
  
  return (
    <div className={`relative ${className}`}>
      {showArrows && (
        <button onClick={() => scroll('left')}>
          <ChevronLeft />
        </button>
      )}
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide"
        style={{ gap }}
      >
        {children.map((child, index) => (
          <div 
            key={index}
            className="flex-shrink-0"
            style={{ width: itemWidth }}
          >
            {child}
          </div>
        ))}
      </div>
      
      {showArrows && (
        <button onClick={() => scroll('right')}>
          <ChevronRight />
        </button>
      )}
    </div>
  )
}
```

### **2. Hook de Eventos de Amigos**
```tsx
// hooks/useFriendsEvents.ts
export function useFriendsEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  
  useEffect(() => {
    if (!user) return
    
    const fetchFriendsEvents = async () => {
      // 1. Buscar amigos do usuário
      // 2. Buscar eventos que eles vão participar
      // 3. Filtrar eventos futuros
      // 4. Ordenar por data
    }
    
    fetchFriendsEvents()
  }, [user])
  
  return { events, loading, refetch: fetchFriendsEvents }
}
```

### **3. SocialEventCard**
```tsx
// components/SocialEventCard.tsx
export default function SocialEventCard({
  event,
  friendsGoing = [],
  showSocialInfo = true,
  compact = false
}: SocialEventCardProps) {
  return (
    <div className={`card ${compact ? 'p-3' : 'p-4'}`}>
      {/* Imagem do evento */}
      <OptimizedImage 
        src={event.imagem_url}
        alt={event.titulo}
        className={compact ? 'h-32' : 'h-48'}
      />
      
      {/* Info do evento */}
      <div className="mt-3">
        <h3 className={compact ? 'text-sm' : 'text-lg'}>{event.titulo}</h3>
        
        {showSocialInfo && friendsGoing.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-2">
              {friendsGoing.slice(0, 3).map(friend => (
                <img 
                  key={friend.id}
                  src={friend.avatar}
                  className="w-6 h-6 rounded-full border-2 border-white"
                />
              ))}
            </div>
            <span className="text-sm text-neutral-600">
              {friendsGoing.length} amigo{friendsGoing.length > 1 ? 's' : ''} vão participar
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
```

## 🧪 **Testes**

### **Componentes**
- [ ] HorizontalSlider funciona em desktop/mobile
- [ ] Navegação com setas
- [ ] Scroll touch em mobile
- [ ] Cards renderizam corretamente

### **Hooks**
- [ ] useFriendsEvents retorna dados corretos
- [ ] Loading states funcionam
- [ ] Cache funciona (não refaz request desnecessário)

### **Integração**
- [ ] EventSlider usa HorizontalSlider corretamente
- [ ] SocialEventCard mostra info social
- [ ] Performance boa com muitos items

## 🚀 **Próximo Passo**

Após completar a Fase 1, os componentes estarão prontos para serem integrados no layout na Fase 2.

**Quer que eu comece implementando algum componente específico?**