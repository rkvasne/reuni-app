# Design Document - PWA e Otimização de Performance

## Overview

Esta spec implementa funcionalidades de Progressive Web App e otimizações de performance para transformar o Reuni em uma aplicação web moderna, rápida e confiável. A arquitetura foca em estratégias de cache inteligente, carregamento otimizado e experiência mobile nativa.

## Architecture

### PWA Core Components
- **Service Worker**: Gerenciamento de cache e funcionalidade offline
- **Web App Manifest**: Configuração para instalação como app nativo
- **Push Notifications**: Sistema de notificações web push
- **Background Sync**: Sincronização de dados em background

### Performance Optimization
- **Code Splitting**: Divisão de código por rotas e componentes
- **Lazy Loading**: Carregamento sob demanda de recursos
- **Image Optimization**: Compressão e formatos modernos
- **Caching Strategy**: Cache inteligente de recursos e dados

## Components and Interfaces

### 1. Service Worker Configuration

```typescript
// sw.js - Service Worker
const CACHE_NAME = 'reuni-v1'
const STATIC_CACHE = 'reuni-static-v1'
const DYNAMIC_CACHE = 'reuni-dynamic-v1'

// Cache Strategy
const cacheStrategy = {
  static: ['/', '/manifest.json', '/icons/*'],
  dynamic: ['/api/events', '/api/users'],
  networkFirst: ['/api/events/latest'],
  cacheFirst: ['/images/*', '/assets/*']
}

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingActions())
  }
})
```

### 2. PWA Installation

```typescript
interface PWAInstallPrompt {
  isInstallable: boolean
  installPrompt: BeforeInstallPromptEvent | null
  onInstall: () => void
  onDismiss: () => void
  showInstallBanner: boolean
}

const usePWAInstall = (): PWAInstallPrompt => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])
  
  const onInstall = async () => {
    if (!installPrompt) return
    
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setInstallPrompt(null)
    }
  }
  
  return { isInstallable, installPrompt, onInstall, onDismiss: () => setIsInstallable(false), showInstallBanner: isInstallable }
}
```

### 3. Offline Support

```typescript
interface OfflineManager {
  isOnline: boolean
  pendingActions: PendingAction[]
  syncWhenOnline: (action: PendingAction) => void
  clearPendingActions: () => void
}

interface PendingAction {
  id: string
  type: 'create_event' | 'join_event' | 'like_event'
  data: any
  timestamp: number
}

const useOfflineManager = (): OfflineManager => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingActions()
    }
    
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  const syncWhenOnline = (action: PendingAction) => {
    if (isOnline) {
      executeAction(action)
    } else {
      setPendingActions(prev => [...prev, action])
    }
  }
  
  return { isOnline, pendingActions, syncWhenOnline, clearPendingActions: () => setPendingActions([]) }
}
```

### 4. Performance Monitoring

```typescript
interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
}

const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(metric => reportMetric('CLS', metric.value))
      getFID(metric => reportMetric('FID', metric.value))
      getFCP(metric => reportMetric('FCP', metric.value))
      getLCP(metric => reportMetric('LCP', metric.value))
      getTTFB(metric => reportMetric('TTFB', metric.value))
    })
  }, [])
  
  const reportMetric = (name: string, value: number) => {
    // Send to analytics service (respecting privacy)
    if (process.env.NODE_ENV === 'production') {
      // Analytics implementation
    }
  }
}
```

### 5. Push Notifications

```typescript
interface PushNotificationManager {
  isSupported: boolean
  permission: NotificationPermission
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<PushSubscription | null>
  unsubscribe: () => Promise<boolean>
}

const usePushNotifications = (): PushNotificationManager => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
  
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false
    
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }
  
  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null
    
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    })
    
    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    })
    
    return subscription
  }
  
  return { isSupported, permission, requestPermission, subscribe, unsubscribe: async () => true }
}
```

## Configuration Files

### Web App Manifest
```json
{
  "name": "Reuni - Eventos Sociais",
  "short_name": "Reuni",
  "description": "Descubra e participe de eventos incríveis na sua região",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#9B59B6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["social", "lifestyle", "entertainment"],
  "lang": "pt-BR",
  "dir": "ltr"
}
```

### Next.js PWA Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.reuni\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
})

module.exports = withPWA({
  // Next.js config
})
```

## Performance Optimization Strategies

### 1. Code Splitting
```typescript
// Dynamic imports for route-based splitting
const EventsPage = dynamic(() => import('../pages/events'), {
  loading: () => <EventsPageSkeleton />
})

const CommunityPage = dynamic(() => import('../pages/community'), {
  loading: () => <CommunityPageSkeleton />
})

// Component-based splitting
const HeavyComponent = dynamic(() => import('../components/HeavyComponent'), {
  ssr: false,
  loading: () => <ComponentSkeleton />
})
```

### 2. Image Optimization
```typescript
// Next.js Image component with optimization
import Image from 'next/image'

const OptimizedEventImage = ({ src, alt, ...props }) => (
  <Image
    src={src}
    alt={alt}
    width={400}
    height={300}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
    loading="lazy"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    {...props}
  />
)
```

### 3. Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Performance monitoring
npm run lighthouse
```

## Error Handling

### Offline Error Handling
```typescript
const OfflineErrorBoundary = ({ children }) => {
  const { isOnline } = useOfflineManager()
  
  if (!isOnline) {
    return (
      <OfflineFallback 
        onRetry={() => window.location.reload()}
        pendingActions={pendingActions}
      />
    )
  }
  
  return children
}
```

### Performance Error Monitoring
```typescript
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      const loadTime = entry.loadEventEnd - entry.loadEventStart
      if (loadTime > 3000) {
        reportSlowLoad(entry)
      }
    }
  }
})

performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
```

## Testing Strategy

### PWA Testing
- Service Worker functionality
- Offline capabilities
- Installation flow
- Push notifications

### Performance Testing
- Lighthouse CI integration
- Bundle size monitoring
- Core Web Vitals tracking
- Load testing with different network conditions