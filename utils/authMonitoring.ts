/**
 * Sistema de Monitoramento e Observabilidade para Autenticação
 * Coleta métricas, logs e alertas para o sistema de autenticação
 */

interface AuthMetric {
  timestamp: number
  event: string
  userId?: string
  duration?: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

interface AuthAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
  resolved: boolean
  metadata?: Record<string, any>
}

interface AuthHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  responseTime: number
  errorRate: number
  lastCheck: number
  issues: string[]
}

class AuthMonitoring {
  private metrics: AuthMetric[] = []
  private alerts: AuthAlert[] = []
  private healthStatus: AuthHealthStatus = {
    status: 'healthy',
    uptime: Date.now(),
    responseTime: 0,
    errorRate: 0,
    lastCheck: Date.now(),
    issues: []
  }

  private maxMetrics = 1000 // Manter apenas as últimas 1000 métricas
  private maxAlerts = 100   // Manter apenas os últimos 100 alertas

  /**
   * Registra uma métrica de autenticação
   */
  recordMetric(event: string, options: {
    userId?: string
    duration?: number
    success: boolean
    error?: string
    metadata?: Record<string, any>
  }) {
    const metric: AuthMetric = {
      timestamp: Date.now(),
      event,
      ...options
    }

    this.metrics.push(metric)

    // Manter apenas as métricas mais recentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Atualizar status de saúde
    this.updateHealthStatus()

    // Verificar se precisa gerar alertas
    this.checkForAlerts(metric)

    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthMonitoring] ${event}:`, {
        success: options.success,
        duration: options.duration,
        error: options.error
      })
    }
  }

  /**
   * Cria um alerta
   */
  createAlert(type: AuthAlert['type'], title: string, message: string, metadata?: Record<string, any>) {
    const alert: AuthAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      resolved: false,
      metadata
    }

    this.alerts.push(alert)

    // Manter apenas os alertas mais recentes
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts)
    }

    // Log alertas críticos
    if (type === 'error') {
      console.error(`[AuthAlert] ${title}: ${message}`, metadata)
    }

    return alert.id
  }

  /**
   * Resolve um alerta
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
    }
  }

  /**
   * Obtém métricas agregadas
   */
  getMetrics(timeRange?: { start: number; end: number }) {
    let filteredMetrics = this.metrics

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    const total = filteredMetrics.length
    const successful = filteredMetrics.filter(m => m.success).length
    const failed = total - successful
    const errorRate = total > 0 ? (failed / total) * 100 : 0

    const durations = filteredMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!)

    const avgResponseTime = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0

    // Métricas por evento
    const eventMetrics = filteredMetrics.reduce((acc, metric) => {
      if (!acc[metric.event]) {
        acc[metric.event] = { total: 0, successful: 0, failed: 0 }
      }
      acc[metric.event].total++
      if (metric.success) {
        acc[metric.event].successful++
      } else {
        acc[metric.event].failed++
      }
      return acc
    }, {} as Record<string, { total: number; successful: number; failed: number }>)

    // Erros mais comuns
    const errorCounts = filteredMetrics
      .filter(m => !m.success && m.error)
      .reduce((acc, metric) => {
        const error = metric.error!
        acc[error] = (acc[error] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))

    return {
      summary: {
        total,
        successful,
        failed,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime)
      },
      eventMetrics,
      topErrors,
      timeRange: timeRange || {
        start: filteredMetrics[0]?.timestamp || Date.now(),
        end: filteredMetrics[filteredMetrics.length - 1]?.timestamp || Date.now()
      }
    }
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts() {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Obtém todos os alertas
   */
  getAllAlerts() {
    return [...this.alerts].reverse() // Mais recentes primeiro
  }

  /**
   * Obtém status de saúde do sistema
   */
  getHealthStatus(): AuthHealthStatus {
    return { ...this.healthStatus }
  }

  /**
   * Atualiza status de saúde baseado nas métricas recentes
   */
  private updateHealthStatus() {
    const now = Date.now()
    const last5Minutes = now - (5 * 60 * 1000)
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= last5Minutes)
    
    if (recentMetrics.length === 0) {
      this.healthStatus.status = 'healthy'
      this.healthStatus.errorRate = 0
      this.healthStatus.responseTime = 0
      this.healthStatus.issues = []
      this.healthStatus.lastCheck = now
      return
    }

    const failed = recentMetrics.filter(m => !m.success).length
    const errorRate = (failed / recentMetrics.length) * 100

    const durations = recentMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!)
    
    const avgResponseTime = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0

    this.healthStatus.errorRate = Math.round(errorRate * 100) / 100
    this.healthStatus.responseTime = Math.round(avgResponseTime)
    this.healthStatus.lastCheck = now

    // Determinar status e issues
    const issues: string[] = []
    
    if (errorRate > 50) {
      this.healthStatus.status = 'unhealthy'
      issues.push(`Taxa de erro muito alta: ${errorRate.toFixed(1)}%`)
    } else if (errorRate > 20) {
      this.healthStatus.status = 'degraded'
      issues.push(`Taxa de erro elevada: ${errorRate.toFixed(1)}%`)
    }

    if (avgResponseTime > 5000) {
      this.healthStatus.status = 'unhealthy'
      issues.push(`Tempo de resposta muito alto: ${avgResponseTime.toFixed(0)}ms`)
    } else if (avgResponseTime > 2000) {
      if (this.healthStatus.status === 'healthy') {
        this.healthStatus.status = 'degraded'
      }
      issues.push(`Tempo de resposta elevado: ${avgResponseTime.toFixed(0)}ms`)
    }

    if (issues.length === 0 && this.healthStatus.status !== 'healthy') {
      this.healthStatus.status = 'healthy'
    }

    this.healthStatus.issues = issues
  }

  /**
   * Verifica se precisa gerar alertas baseado na métrica
   */
  private checkForAlerts(metric: AuthMetric) {
    // Alerta para falhas consecutivas
    if (!metric.success) {
      const recentFailures = this.metrics
        .slice(-5) // Últimas 5 métricas
        .filter(m => m.event === metric.event && !m.success)

      if (recentFailures.length >= 3) {
        this.createAlert(
          'error',
          'Falhas Consecutivas Detectadas',
          `${recentFailures.length} falhas consecutivas em ${metric.event}`,
          { event: metric.event, failures: recentFailures.length }
        )
      }
    }

    // Alerta para tempo de resposta alto
    if (metric.duration && metric.duration > 10000) {
      this.createAlert(
        'warning',
        'Tempo de Resposta Alto',
        `${metric.event} levou ${metric.duration}ms para completar`,
        { event: metric.event, duration: metric.duration }
      )
    }

    // Alerta para erros específicos
    if (!metric.success && metric.error) {
      const criticalErrors = [
        'Database connection failed',
        'Supabase service unavailable',
        'Authentication service down'
      ]

      if (criticalErrors.some(err => metric.error!.includes(err))) {
        this.createAlert(
          'error',
          'Erro Crítico de Sistema',
          `Erro crítico detectado: ${metric.error}`,
          { event: metric.event, error: metric.error }
        )
      }
    }
  }

  /**
   * Exporta dados para análise externa
   */
  exportData() {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      healthStatus: this.healthStatus,
      exportedAt: Date.now()
    }
  }

  /**
   * Limpa dados antigos
   */
  cleanup(olderThan: number = 24 * 60 * 60 * 1000) { // 24 horas por padrão
    const cutoff = Date.now() - olderThan
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff)
  }

  /**
   * Gera relatório de saúde
   */
  generateHealthReport() {
    const metrics = this.getMetrics()
    const activeAlerts = this.getActiveAlerts()
    const healthStatus = this.getHealthStatus()

    return {
      timestamp: Date.now(),
      status: healthStatus.status,
      summary: {
        uptime: Math.round((Date.now() - healthStatus.uptime) / 1000 / 60), // minutos
        totalRequests: metrics.summary.total,
        successRate: metrics.summary.total > 0 
          ? Math.round(((metrics.summary.successful / metrics.summary.total) * 100) * 100) / 100
          : 100,
        avgResponseTime: metrics.summary.avgResponseTime,
        activeAlerts: activeAlerts.length
      },
      issues: healthStatus.issues,
      topErrors: metrics.topErrors,
      recommendations: this.generateRecommendations(metrics, activeAlerts)
    }
  }

  /**
   * Gera recomendações baseadas nos dados
   */
  private generateRecommendations(metrics: any, alerts: AuthAlert[]) {
    const recommendations: string[] = []

    if (metrics.summary.errorRate > 10) {
      recommendations.push('Investigar causas dos erros de autenticação')
    }

    if (metrics.summary.avgResponseTime > 1000) {
      recommendations.push('Otimizar performance das operações de autenticação')
    }

    if (alerts.length > 5) {
      recommendations.push('Revisar e resolver alertas pendentes')
    }

    if (metrics.topErrors.length > 0) {
      recommendations.push(`Focar na resolução do erro mais comum: ${metrics.topErrors[0].error}`)
    }

    return recommendations
  }
}

// Instância singleton
export const authMonitoring = new AuthMonitoring()

// Helpers para uso nos hooks
export const recordAuthMetric = (event: string, options: Parameters<typeof authMonitoring.recordMetric>[1]) => {
  authMonitoring.recordMetric(event, options)
}

export const createAuthAlert = (type: AuthAlert['type'], title: string, message: string, metadata?: Record<string, any>) => {
  return authMonitoring.createAlert(type, title, message, metadata)
}

export const getAuthMetrics = (timeRange?: { start: number; end: number }) => {
  return authMonitoring.getMetrics(timeRange)
}

export const getAuthHealthStatus = () => {
  return authMonitoring.getHealthStatus()
}

export const generateAuthHealthReport = () => {
  return authMonitoring.generateHealthReport()
}