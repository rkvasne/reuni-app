/**
 * Utilitários para gerenciar o estado de onboarding do usuário
 */

export interface OnboardingState {
  hasSeenWelcome: boolean
  completedSteps: string[]
  currentStep: 'email-confirmation' | 'welcome' | 'completed'
  welcomeSeenAt?: string
}

export interface UserOnboardingData {
  userId: string
  email: string
  createdAt: string
  isNewUser: boolean
}

/**
 * Chaves para localStorage
 */
const STORAGE_KEYS = {
  WELCOME_SEEN: (userId: string) => `welcome_seen_${userId}`,
  ONBOARDING_STATE: (userId: string) => `onboarding_state_${userId}`,
} as const

/**
 * Marca que o usuário viu a página de boas-vindas
 */
export const markWelcomeSeen = (userId: string): void => {
  try {
    const timestamp = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.WELCOME_SEEN(userId), 'true')
    
    // Atualizar estado completo de onboarding
    const currentState = getOnboardingState(userId)
    const newState: OnboardingState = {
      ...currentState,
      hasSeenWelcome: true,
      currentStep: 'completed',
      welcomeSeenAt: timestamp,
      completedSteps: [...currentState.completedSteps, 'welcome-page']
    }
    
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_STATE(userId), JSON.stringify(newState))
  } catch (error) {
    console.error('Erro ao marcar welcome como visto:', error)
  }
}

/**
 * Verifica se o usuário já viu a página de boas-vindas
 */
export const hasSeenWelcome = (userId: string): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.WELCOME_SEEN(userId)) === 'true'
  } catch (error) {
    console.error('Erro ao verificar se viu welcome:', error)
    return false
  }
}

/**
 * Obtém o estado completo de onboarding do usuário
 */
export const getOnboardingState = (userId: string): OnboardingState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_STATE(userId))
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Erro ao obter estado de onboarding:', error)
  }

  // Estado padrão para novos usuários
  return {
    hasSeenWelcome: false,
    completedSteps: [],
    currentStep: 'email-confirmation'
  }
}

/**
 * Atualiza o estado de onboarding
 */
export const updateOnboardingState = (userId: string, updates: Partial<OnboardingState>): void => {
  try {
    const currentState = getOnboardingState(userId)
    const newState = { ...currentState, ...updates }
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_STATE(userId), JSON.stringify(newState))
  } catch (error) {
    console.error('Erro ao atualizar estado de onboarding:', error)
  }
}

/**
 * Determina se um usuário é novo baseado em múltiplos critérios
 * Esta função verifica apenas critérios locais (localStorage e tempo de criação)
 * A verificação de perfil no banco deve ser feita separadamente
 */
export const isNewUser = (user: any): boolean => {
  if (!user) return false

  // Verificar se já viu a página de boas-vindas
  if (hasSeenWelcome(user.id)) {
    console.log('Usuário já viu welcome page - não é novo')
    return false
  }

  // Verificar se foi criado recentemente (menos de 30 minutos)
  const userCreatedAt = new Date(user.created_at)
  const now = new Date()
  const timeDifference = now.getTime() - userCreatedAt.getTime()
  const minutesDifference = timeDifference / (1000 * 60)
  
  const isRecent = minutesDifference < 30
  console.log(`Usuário criado há ${minutesDifference.toFixed(1)} minutos - é recente: ${isRecent}`)
  
  return isRecent
}

/**
 * Verifica se um usuário precisa completar o onboarding
 * Combina verificação local e de perfil no banco
 */
export const needsOnboarding = (user: any, hasCompleteProfile: boolean): boolean => {
  if (!user) return true

  // Se já viu a página de boas-vindas E tem perfil completo, não precisa de onboarding
  if (hasSeenWelcome(user.id) && hasCompleteProfile) {
    return false
  }

  // Se não tem perfil completo, sempre precisa de onboarding
  if (!hasCompleteProfile) {
    return true
  }

  // Se tem perfil mas é usuário recente e não viu welcome, ainda precisa
  return isNewUser(user)
}

/**
 * Limpa dados de onboarding expirados (mais de 30 dias)
 */
export const cleanupExpiredOnboardingData = (): void => {
  try {
    const keys = Object.keys(localStorage)
    const now = new Date()
    
    keys.forEach(key => {
      if (key.startsWith('welcome_seen_') || key.startsWith('onboarding_state_')) {
        try {
          const item = localStorage.getItem(key)
          if (!item) return

          // Para estados de onboarding, verificar timestamp
          if (key.startsWith('onboarding_state_')) {
            const state: OnboardingState = JSON.parse(item)
            if (state.welcomeSeenAt) {
              const seenAt = new Date(state.welcomeSeenAt)
              const daysDifference = (now.getTime() - seenAt.getTime()) / (1000 * 60 * 60 * 24)
              
              if (daysDifference > 30) {
                localStorage.removeItem(key)
                // Remover também a chave welcome_seen correspondente
                const userId = key.replace('onboarding_state_', '')
                localStorage.removeItem(STORAGE_KEYS.WELCOME_SEEN(userId))
              }
            }
          }
        } catch (error) {
          // Se não conseguir parsear, remover item corrompido
          localStorage.removeItem(key)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao limpar dados de onboarding expirados:', error)
  }
}

/**
 * Obtém estatísticas de onboarding para debugging
 */
export const getOnboardingStats = (): {
  totalUsers: number
  completedWelcome: number
  activeOnboarding: number
} => {
  try {
    const keys = Object.keys(localStorage)
    let totalUsers = 0
    let completedWelcome = 0
    let activeOnboarding = 0

    keys.forEach(key => {
      if (key.startsWith('onboarding_state_')) {
        totalUsers++
        try {
          const state: OnboardingState = JSON.parse(localStorage.getItem(key) || '{}')
          if (state.hasSeenWelcome) {
            completedWelcome++
          } else {
            activeOnboarding++
          }
        } catch (error) {
          // Ignorar estados corrompidos
        }
      }
    })

    return { totalUsers, completedWelcome, activeOnboarding }
  } catch (error) {
    console.error('Erro ao obter estatísticas de onboarding:', error)
    return { totalUsers: 0, completedWelcome: 0, activeOnboarding: 0 }
  }
}

/**
 * Função de debug para testar a lógica de onboarding
 */
export const debugOnboardingLogic = (user: any, hasCompleteProfile: boolean) => {
  console.group('🔍 Debug Onboarding Logic')
  console.log('User ID:', user?.id)
  console.log('User created_at:', user?.created_at)
  console.log('Has complete profile:', hasCompleteProfile)
  console.log('Has seen welcome:', hasSeenWelcome(user?.id))
  console.log('Is new user:', isNewUser(user))
  console.log('Needs onboarding:', needsOnboarding(user, hasCompleteProfile))
  console.groupEnd()
}