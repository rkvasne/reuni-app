/**
 * Sistema de Proteção contra Loops
 * 
 * Utilitário para detectar e prevenir loops de redirecionamento
 * em fluxos de autenticação, com coordenação entre guards e
 * fallbacks seguros.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

interface LoopDetectionEntry {
  path: string
  timestamp: number
  sessionId: string
  userId?: string
  metadata?: Record<string, any>
}

interface LoopProtectionConfig {
  maxVisits: number
  timeWindow: number // em milissegundos
  sessionTimeout: number
  enableLogging: boolean
  fallbackPath: string
}

interface LoopDetectionResult {
  isLoop: boolean
  visitCount: number
  timeSpent: number
  shouldBreak: boolean
  fallbackPath: string
  reason?: string
}

interface GuardState {
  id: string
  path: string
  isActive: boolean
  lastCheck: number
  visitCount: number
  metadata: Record<string, any>
}

const DEFAULT_CONFIG: LoopProtectionConfig = {
  maxVisits: 5,
  timeWindow: 30000, // 30 segundos
  sessionTimeout: 300000, // 5 minutos
  enableLogging: true,
  fallbackPath: '/auth/recovery?reason=loop_detected'
}

/**
 * Classe principal para proteção contra loops
 */
export class LoopProtectionManager {
  private static instance: LoopProtectionManager
  private config: LoopProtectionConfig
  private visitHistory: LoopDetectionEntry[] = []
  private guards: Map<string, GuardState> = new Map()
  private sessionId: string
  private isEnabled: boolean = true

  private constructor(config: Partial<LoopProtectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = this.generateSessionId()
    this.cleanupOldEntries()
  }

  static getInstance(config?: Partial<LoopProtectionConfig>): LoopProtectionManager {
    if (!LoopProtectionManager.instance) {
      LoopProtectionManager.instance = new LoopProtectionManager(config)
    }
    return LoopProtectionManager.instance
  }

  /**
   * Gera ID único para a sessão
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Remove entradas antigas do histórico
   */
  private cleanupOldEntries(): void {
    const now = Date.now()
    const cutoff = now - this.config.sessionTimeout

    this.visitHistory = this.visitHistory.filter(entry => entry.timestamp > cutoff)

    // Limpar guards inativos
    for (const [guardId, guard] of this.guards.entries()) {
      if (now - guard.lastCheck > this.config.sessionTimeout) {
        this.guards.delete(guardId)
      }
    }
  }

  /**
   * Registra uma visita a uma página
   */
  recordVisit(path: string, userId?: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return

    this.cleanupOldEntries()

    const entry: LoopDetectionEntry = {
      path,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId,
      metadata
    }

    this.visitHistory.push(entry)

    if (this.config.enableLogging) {
      console.log('Loop Protection - Visit recorded:', {
        path,
        sessionId: this.sessionId,
        totalVisits: this.visitHistory.length,
        userId
      })
    }
  }

  /**
   * Detecta se há um loop de redirecionamento
   */
  detectLoop(currentPath: string, userId?: string): LoopDetectionResult {
    if (!this.isEnabled) {
      return {
        isLoop: false,
        visitCount: 0,
        timeSpent: 0,
        shouldBreak: false,
        fallbackPath: this.config.fallbackPath
      }
    }

    this.cleanupOldEntries()

    const now = Date.now()
    const windowStart = now - this.config.timeWindow

    // Filtrar visitas relevantes (mesmo caminho, mesma sessão, dentro da janela de tempo)
    const relevantVisits = this.visitHistory.filter(entry => 
      entry.path === currentPath &&
      entry.sessionId === this.sessionId &&
      entry.timestamp >= windowStart &&
      (!userId || entry.userId === userId)
    )

    const visitCount = relevantVisits.length
    const isLoop = visitCount >= this.config.maxVisits

    let timeSpent = 0
    if (relevantVisits.length > 1) {
      const firstVisit = relevantVisits[0]
      const lastVisit = relevantVisits[relevantVisits.length - 1]
      timeSpent = lastVisit.timestamp - firstVisit.timestamp
    }

    const result: LoopDetectionResult = {
      isLoop,
      visitCount,
      timeSpent,
      shouldBreak: isLoop,
      fallbackPath: this.config.fallbackPath,
      reason: isLoop ? `Detectado ${visitCount} visitas em ${timeSpent}ms` : undefined
    }

    if (isLoop && this.config.enableLogging) {
      console.warn('Loop Protection - Loop detected:', {
        path: currentPath,
        visitCount,
        timeSpent,
        sessionId: this.sessionId,
        userId
      })

      // Log detalhado para análise
      this.logLoopDetails(currentPath, relevantVisits)
    }

    return result
  }

  /**
   * Registra um guard ativo
   */
  registerGuard(guardId: string, path: string, metadata: Record<string, any> = {}): void {
    const guard: GuardState = {
      id: guardId,
      path,
      isActive: true,
      lastCheck: Date.now(),
      visitCount: 0,
      metadata
    }

    this.guards.set(guardId, guard)

    if (this.config.enableLogging) {
      console.log('Loop Protection - Guard registered:', { guardId, path })
    }
  }

  /**
   * Atualiza estado de um guard
   */
  updateGuard(guardId: string, updates: Partial<GuardState>): void {
    const guard = this.guards.get(guardId)
    if (guard) {
      Object.assign(guard, updates, { lastCheck: Date.now() })
      this.guards.set(guardId, guard)
    }
  }

  /**
   * Remove um guard
   */
  unregisterGuard(guardId: string): void {
    this.guards.delete(guardId)
    
    if (this.config.enableLogging) {
      console.log('Loop Protection - Guard unregistered:', { guardId })
    }
  }

  /**
   * Verifica se há conflito entre guards
   */
  checkGuardConflicts(): { hasConflict: boolean; conflictingGuards: string[] } {
    const activeGuards = Array.from(this.guards.values()).filter(g => g.isActive)
    const pathGroups = new Map<string, GuardState[]>()

    // Agrupar guards por caminho
    for (const guard of activeGuards) {
      if (!pathGroups.has(guard.path)) {
        pathGroups.set(guard.path, [])
      }
      pathGroups.get(guard.path)!.push(guard)
    }

    // Verificar conflitos (múltiplos guards no mesmo caminho)
    const conflictingGuards: string[] = []
    let hasConflict = false

    for (const [path, guards] of pathGroups.entries()) {
      if (guards.length > 1) {
        hasConflict = true
        conflictingGuards.push(...guards.map(g => g.id))
        
        if (this.config.enableLogging) {
          console.warn('Loop Protection - Guard conflict detected:', {
            path,
            conflictingGuards: guards.map(g => g.id)
          })
        }
      }
    }

    return { hasConflict, conflictingGuards }
  }

  /**
   * Força quebra de loop e redireciona para fallback
   */
  breakLoop(reason: string, metadata?: Record<string, any>): string {
    if (this.config.enableLogging) {
      console.warn('Loop Protection - Breaking loop:', { reason, metadata, sessionId: this.sessionId })
    }

    // Limpar histórico da sessão atual
    this.visitHistory = this.visitHistory.filter(entry => entry.sessionId !== this.sessionId)

    // Desativar guards conflitantes
    for (const guard of this.guards.values()) {
      guard.isActive = false
    }

    // Gerar nova sessão
    this.sessionId = this.generateSessionId()

    return `${this.config.fallbackPath}&session=${this.sessionId}&reason=${encodeURIComponent(reason)}`
  }

  /**
   * Obtém estatísticas do sistema de proteção
   */
  getStats(): {
    totalVisits: number
    activeGuards: number
    sessionId: string
    recentLoops: number
    averageTimePerPath: Record<string, number>
  } {
    const now = Date.now()
    const recentCutoff = now - this.config.timeWindow

    const recentVisits = this.visitHistory.filter(entry => entry.timestamp >= recentCutoff)
    const recentLoops = this.countRecentLoops()

    // Calcular tempo médio por caminho
    const pathTimes = new Map<string, number[]>()
    for (let i = 1; i < this.visitHistory.length; i++) {
      const current = this.visitHistory[i]
      const previous = this.visitHistory[i - 1]
      
      if (current.sessionId === previous.sessionId) {
        const timeDiff = current.timestamp - previous.timestamp
        if (!pathTimes.has(current.path)) {
          pathTimes.set(current.path, [])
        }
        pathTimes.get(current.path)!.push(timeDiff)
      }
    }

    const averageTimePerPath: Record<string, number> = {}
    for (const [path, times] of pathTimes.entries()) {
      averageTimePerPath[path] = times.reduce((a, b) => a + b, 0) / times.length
    }

    return {
      totalVisits: this.visitHistory.length,
      activeGuards: Array.from(this.guards.values()).filter(g => g.isActive).length,
      sessionId: this.sessionId,
      recentLoops,
      averageTimePerPath
    }
  }

  /**
   * Conta loops recentes
   */
  private countRecentLoops(): number {
    const now = Date.now()
    const recentCutoff = now - this.config.timeWindow
    const pathCounts = new Map<string, number>()

    for (const entry of this.visitHistory) {
      if (entry.timestamp >= recentCutoff) {
        pathCounts.set(entry.path, (pathCounts.get(entry.path) || 0) + 1)
      }
    }

    return Array.from(pathCounts.values()).filter(count => count >= this.config.maxVisits).length
  }

  /**
   * Log detalhado de loops para análise
   */
  private logLoopDetails(path: string, visits: LoopDetectionEntry[]): void {
    console.group('🔄 Loop Protection - Detailed Analysis')
    console.log('Path:', path)
    console.log('Session ID:', this.sessionId)
    console.log('Visit Count:', visits.length)
    console.log('Time Window:', this.config.timeWindow + 'ms')
    console.log('Max Visits:', this.config.maxVisits)
    
    console.table(visits.map(visit => ({
      timestamp: new Date(visit.timestamp).toISOString(),
      path: visit.path,
      userId: visit.userId || 'anonymous',
      metadata: JSON.stringify(visit.metadata || {})
    })))
    
    console.groupEnd()
  }

  /**
   * Habilita ou desabilita o sistema
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    
    if (this.config.enableLogging) {
      console.log('Loop Protection - System', enabled ? 'enabled' : 'disabled')
    }
  }

  /**
   * Reseta o sistema (limpa histórico e guards)
   */
  reset(): void {
    this.visitHistory = []
    this.guards.clear()
    this.sessionId = this.generateSessionId()
    
    if (this.config.enableLogging) {
      console.log('Loop Protection - System reset')
    }
  }
}

/**
 * Funções utilitárias para uso direto
 */

// Instância global
let globalManager: LoopProtectionManager | null = null

export function initLoopProtection(config?: Partial<LoopProtectionConfig>): LoopProtectionManager {
  globalManager = LoopProtectionManager.getInstance(config)
  return globalManager
}

export function recordPageVisit(path: string, userId?: string, metadata?: Record<string, any>): void {
  if (!globalManager) {
    globalManager = LoopProtectionManager.getInstance()
  }
  globalManager.recordVisit(path, userId, metadata)
}

export function checkForLoop(path: string, userId?: string): LoopDetectionResult {
  if (!globalManager) {
    globalManager = LoopProtectionManager.getInstance()
  }
  return globalManager.detectLoop(path, userId)
}

export function createGuard(guardId: string, path: string, metadata?: Record<string, any>): void {
  if (!globalManager) {
    globalManager = LoopProtectionManager.getInstance()
  }
  globalManager.registerGuard(guardId, path, metadata)
}

export function removeGuard(guardId: string): void {
  if (!globalManager) {
    globalManager = LoopProtectionManager.getInstance()
  }
  globalManager.unregisterGuard(guardId)
}

export function breakCurrentLoop(reason: string, metadata?: Record<string, any>): string {
  if (!globalManager) {
    globalManager = LoopProtectionManager.getInstance()
  }
  return globalManager.breakLoop(reason, metadata)
}

export function getLoopProtectionStats() {
  if (!globalManager) {
    globalManager = LoopProtectionManager.getInstance()
  }
  return globalManager.getStats()
}