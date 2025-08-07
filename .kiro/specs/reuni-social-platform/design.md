# Design Document - Sistema de Eventos Reuni

## Overview

O sistema de eventos é o core da plataforma Reuni, permitindo criação, descoberta e participação em eventos diversos. Construído sobre uma base sólida de autenticação e banco de dados, o sistema foca na experiência do usuário para descobrir eventos relevantes, interagir socialmente e gerenciar participações de forma eficiente.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    A[Frontend - Next.js 14] --> B[Supabase Backend]
    A --> C[Vercel Deployment]
    B --> D[PostgreSQL Database]
    B --> E[Authentication Service]
    B --> F[Storage Service]
    B --> G[Real-time Subscriptions]
    
    H[External Services] --> I[Google OAuth]
    H --> J[Google Maps API]
    H --> K[Image CDN]
```

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS com tema customizado
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Authentication**: Supabase Auth + Google OAuth
- **Deployment**: Vercel
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API

## Components and Interfaces

### Core Components

#### 1. Authentication System
```typescript
// useAuth Hook Interface
interface AuthHook {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, metadata?: any) => Promise<AuthResponse>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<AuthResponse>
  updateProfile: (data: ProfileData) => Promise<void>
}

// AuthModal Component Interface
interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab: 'login' | 'signup'
  onSuccess: () => void
}
```

#### 2. Layout Components
```typescript
// Responsive Layout System
interface LayoutProps {
  children: React.ReactNode
  showSidebars?: boolean
  mobileLayout?: 'single' | 'tabs'
}

// Layout Components:
// - Header: Logo, busca global, notificações, menu do usuário
// - LeftSidebar: Navegação principal, comunidades, filtros rápidos
// - MainFeed: Carrossel de destaques, filtros avançados, cards de eventos
// - RightSidebar: Sugestões, ações rápidas, amigos online
```

#### 3. Event Management Components
```typescript
interface EventCard {
  event: Event
  variant: 'compact' | 'featured' | 'detailed'
  onAttend: (eventId: string) => void
  onShare: (eventId: string) => void
  onComment: (eventId: string, comment: string) => void
  onLike: (eventId: string) => void
  showParticipants?: boolean
}

interface EventModal {
  mode: 'create' | 'edit' | 'view'
  eventId?: string
  onSave: (eventData: EventData) => Promise<void>
  onDelete?: (eventId: string) => Promise<void>
}

interface EventForm {
  initialData?: Partial<EventData>
  onSubmit: (data: EventData) => Promise<void>
  validation: EventValidationSchema
}
```

#### 4. Search and Filter System
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder: string
  suggestions?: string[]
  realTimeSearch?: boolean
}

interface FilterSystem {
  categories: CategoryFilter[]
  dateRange: DateRangeFilter
  location: LocationFilter
  onFilterChange: (filters: FilterState) => void
  activeFilters: FilterState
}

interface AdvancedFilters {
  priceRange: PriceRangeFilter
  eventType: EventTypeFilter
  participantCount: ParticipantCountFilter
  distance: DistanceFilter
}
```

#### 5. Community System Components
```typescript
interface CommunityCard {
  community: Community
  userMembership?: MembershipStatus
  onJoin: (communityId: string) => void
  onLeave: (communityId: string) => void
}

interface CommunityModal {
  mode: 'create' | 'edit' | 'view'
  communityId?: string
  onSave: (data: CommunityData) => Promise<void>
}
```

#### 6. Social Interaction Components
```typescript
interface ParticipantsList {
  eventId: string
  participants: User[]
  maxVisible?: number
  onUserClick: (userId: string) => void
}

interface CommentSystem {
  eventId: string
  comments: Comment[]
  onAddComment: (comment: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  realTimeUpdates: boolean
}

interface NotificationCenter {
  notifications: Notification[]
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  preferences: NotificationPreferences
}
```

#### 7. Modal System
- **AuthModal**: Login/cadastro com validação e OAuth
- **EventModal**: Criação/edição/visualização de eventos
- **CommunityModal**: Gestão de comunidades
- **ConfirmModal**: Confirmações de ações críticas
- **ProfileModal**: Edição rápida de perfil
- **NotificationModal**: Centro de notificações

### State Management Strategy

#### 1. Global State (Context)
- User authentication state
- Theme preferences
- Notification settings

#### 2. Local State (useState)
- Form inputs
- Modal visibility
- Loading states

#### 3. Server State (Supabase)
- Events data
- User profiles
- Communities
- Real-time subscriptions

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  perfil_publico BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Events Table
```sql
CREATE TABLE eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  local VARCHAR(300) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  imagem_url TEXT,
  organizador_id UUID REFERENCES usuarios(id),
  max_participantes INTEGER,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Attendances Table
```sql
CREATE TABLE presencas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'interessado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(evento_id, usuario_id)
);
```

#### Communities Table
```sql
CREATE TABLE comunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  imagem_url TEXT,
  criador_id UUID REFERENCES usuarios(id),
  privada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Community Members Table
```sql
CREATE TABLE membros_comunidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunidade_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comunidade_id, usuario_id)
);
```

#### Comments Table
```sql
CREATE TABLE comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Event Likes Table
```sql
CREATE TABLE curtidas_evento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(evento_id, usuario_id)
);
```

#### Notifications Table
```sql
CREATE TABLE notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  conteudo TEXT,
  lida BOOLEAN DEFAULT FALSE,
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### User Follows Table
```sql
CREATE TABLE seguindo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seguidor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seguidor_id, seguido_id)
);
```

#### Communities Table
```sql
CREATE TABLE comunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  imagem_url TEXT,
  criador_id UUID REFERENCES usuarios(id),
  privada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Design

#### REST Endpoints
```typescript
// Authentication API
POST   /api/auth/login          // Email/password login
POST   /api/auth/signup         // User registration
POST   /api/auth/google         // Google OAuth login
POST   /api/auth/logout         // User logout
GET    /api/auth/me             // Get current user

// Events API
GET    /api/events              // List events with filters
POST   /api/events              // Create new event
GET    /api/events/:id          // Get event details
PUT    /api/events/:id          // Update event
DELETE /api/events/:id          // Delete event
GET    /api/events/search       // Search events
GET    /api/events/featured     // Get featured events

// Attendances API
POST   /api/events/:id/attend   // Confirm attendance
DELETE /api/events/:id/attend   // Cancel attendance
GET    /api/events/:id/attendees // List attendees
GET    /api/users/:id/events    // User's events (created/attending)

// Communities API
GET    /api/communities         // List communities
POST   /api/communities         // Create community
GET    /api/communities/:id     // Get community details
PUT    /api/communities/:id     // Update community
POST   /api/communities/:id/join // Join community
DELETE /api/communities/:id/leave // Leave community
GET    /api/communities/:id/members // List members
GET    /api/communities/:id/events // Community events

// Social API
POST   /api/events/:id/comments // Add comment
GET    /api/events/:id/comments // Get comments
POST   /api/events/:id/like     // Like event
DELETE /api/events/:id/like     // Unlike event
POST   /api/users/:id/follow    // Follow user
DELETE /api/users/:id/follow    // Unfollow user

// Notifications API
GET    /api/notifications       // Get user notifications
PUT    /api/notifications/:id/read // Mark as read
PUT    /api/notifications/read-all // Mark all as read
PUT    /api/notifications/preferences // Update preferences

// Profile API
GET    /api/users/:id           // Get user profile
PUT    /api/users/:id           // Update profile
POST   /api/users/avatar        // Upload avatar
```

## Error Handling

### Client-Side Error Handling
```typescript
// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Log to error reporting service
  }
}
```

### API Error Handling
```typescript
// Standardized error response
interface APIError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Error handling utility
const handleAPIError = (error: any): string => {
  if (error.code === 'PGRST301') return 'Evento não encontrado'
  if (error.code === '23505') return 'Você já confirmou presença neste evento'
  return 'Ocorreu um erro inesperado. Tente novamente.'
}
```

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library + Jest
- **Hooks**: @testing-library/react-hooks
- **Utilities**: Jest

### Integration Testing
- **API Routes**: Supertest
- **Database**: Supabase local development
- **Authentication**: Mock Supabase client

### E2E Testing
- **Framework**: Playwright
- **Scenarios**: User journeys críticos
- **CI/CD**: Automated on PR

### Testing Structure
```
/tests
  /unit
    /components
    /hooks
    /utils
  /integration
    /api
    /database
  /e2e
    /user-flows
```

## Performance Optimization

### Frontend Optimization
1. **Code Splitting**: Dynamic imports para rotas
2. **Image Optimization**: Next.js Image component
3. **Bundle Analysis**: @next/bundle-analyzer
4. **Caching**: SWR para cache de dados
5. **Lazy Loading**: Componentes e imagens

### Database Optimization
1. **Indexing**: Índices em colunas frequentemente consultadas
2. **Query Optimization**: Uso de joins eficientes
3. **Connection Pooling**: Supabase connection pooling
4. **Caching**: Redis para cache de queries frequentes

### Real-time Features
```typescript
// Supabase real-time subscription
const subscription = supabase
  .channel('events')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'eventos' },
    (payload) => {
      // Update UI with new event
      setEvents(prev => [payload.new, ...prev])
    }
  )
  .subscribe()
```

## Security Considerations

### Authentication Security
- JWT tokens com expiração
- Refresh token rotation
- Rate limiting em endpoints de auth
- CSRF protection

### Data Security
- Row Level Security (RLS) no Supabase
- Input validation e sanitização
- SQL injection prevention
- XSS protection

### Privacy
- LGPD compliance
- Data encryption at rest
- Secure file uploads
- User data export/deletion

## Scalability Plan

### Horizontal Scaling
1. **CDN**: Cloudflare para assets estáticos
2. **Database**: Read replicas para queries
3. **Caching**: Redis cluster
4. **Load Balancing**: Vercel edge functions

### Monitoring
1. **Performance**: Vercel Analytics
2. **Errors**: Sentry integration
3. **Database**: Supabase monitoring
4. **User Analytics**: Privacy-focused analytics

### Platform Strategy

#### Phase 1: Web App Responsiva (0-6 meses)
1. **PWA Features**: Service Workers, offline-first, install prompt
2. **Web Push**: Notificações via navegador
3. **Mobile Optimization**: Layout adaptável e touch-friendly
4. **Performance**: Carregamento rápido e interações fluidas

#### Phase 2: Native Mobile Apps (6-12 meses)
1. **React Native**: Apps Android e iOS com código compartilhado
2. **Native Features**: Câmera, GPS, notificações push nativas
3. **App Store Distribution**: Google Play e Apple App Store
4. **Cross-Platform Sync**: Sincronização entre web e mobile
5. **AI Recommendations**: ML-based event suggestions