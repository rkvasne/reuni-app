'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download
} from 'lucide-react'
import { 
  authMonitoring, 
  getAuthMetrics, 
  getAuthHealthStatus, 
  generateAuthHealthReport 
} from '@/utils/authMonitoring'

interface DashboardProps {
  refreshInterval?: number // em segundos
}

export default function AuthMonitoringDashboard({ refreshInterval = 30 }: DashboardProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadData()
    
    const interval = setInterval(loadData, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const loadData = async () => {
    try {
      const [metricsData, healthData, alertsData] = await Promise.all([
        getAuthMetrics(),
        getAuthHealthStatus(),
        authMonitoring.getActiveAlerts()
      ])

      setMetrics(metricsData)
      setHealthStatus(healthData)
      setAlerts(alertsData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const report = generateAuthHealthReport()
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />
      case 'degraded': return <AlertTriangle className="w-5 h-5" />
      case 'unhealthy': return <XCircle className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary-600" />
            Monitoramento de Autenticação
          </h1>
          <p className="text-neutral-600 mt-1">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Status Geral */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-800">Status do Sistema</h2>
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(healthStatus?.status)}`}>
            {getStatusIcon(healthStatus?.status)}
            <span className="font-medium capitalize">{healthStatus?.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {Math.round((Date.now() - (healthStatus?.uptime || Date.now())) / 1000 / 60)}m
            </div>
            <div className="text-sm text-neutral-600">Uptime</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {healthStatus?.responseTime || 0}ms
            </div>
            <div className="text-sm text-neutral-600">Tempo de Resposta</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {healthStatus?.errorRate?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-neutral-600">Taxa de Erro</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {alerts?.length || 0}
            </div>
            <div className="text-sm text-neutral-600">Alertas Ativos</div>
          </div>
        </div>

        {/* Issues */}
        {healthStatus?.issues && healthStatus.issues.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Issues Detectados:</h3>
            <ul className="space-y-1">
              {healthStatus.issues.map((issue: string, index: number) => (
                <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Métricas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Total de Requests</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800 mb-1">
            {metrics?.summary?.total || 0}
          </div>
          <div className="text-sm text-neutral-600">
            Últimas 24 horas
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Taxa de Sucesso</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800 mb-1">
            {metrics?.summary?.total > 0 
              ? ((metrics.summary.successful / metrics.summary.total) * 100).toFixed(1)
              : 100
            }%
          </div>
          <div className="text-sm text-neutral-600">
            {metrics?.summary?.successful || 0} sucessos
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Tempo Médio</h3>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800 mb-1">
            {metrics?.summary?.avgResponseTime || 0}ms
          </div>
          <div className="text-sm text-neutral-600">
            Tempo de resposta
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Taxa de Erro</h3>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800 mb-1">
            {metrics?.summary?.errorRate || 0}%
          </div>
          <div className="text-sm text-neutral-600">
            {metrics?.summary?.failed || 0} falhas
          </div>
        </div>
      </div>

      {/* Métricas por Evento */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-6">Métricas por Evento</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Evento</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Total</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Sucessos</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Falhas</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Taxa de Sucesso</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics?.eventMetrics || {}).map(([event, data]: [string, any]) => (
                <tr key={event} className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium text-neutral-800">{event}</td>
                  <td className="py-3 px-4 text-right text-neutral-600">{data.total}</td>
                  <td className="py-3 px-4 text-right text-green-600">{data.successful}</td>
                  <td className="py-3 px-4 text-right text-red-600">{data.failed}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (data.successful / data.total) > 0.9 
                        ? 'bg-green-100 text-green-700'
                        : (data.successful / data.total) > 0.7
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {((data.successful / data.total) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Erros */}
      {metrics?.topErrors && metrics.topErrors.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-6">Erros Mais Comuns</h2>
          <div className="space-y-3">
            {metrics.topErrors.map((error: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-red-800">{error.error}</div>
                </div>
                <div className="text-red-600 font-semibold">
                  {error.count} ocorrências
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas Ativos */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-6">Alertas Ativos</h2>
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${
                alert.type === 'error' 
                  ? 'bg-red-50 border-red-200'
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`font-medium ${
                      alert.type === 'error' 
                        ? 'text-red-800'
                        : alert.type === 'warning'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                    }`}>
                      {alert.title}
                    </div>
                    <div className={`text-sm mt-1 ${
                      alert.type === 'error' 
                        ? 'text-red-600'
                        : alert.type === 'warning'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}>
                      {alert.message}
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">
                      {new Date(alert.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      authMonitoring.resolveAlert(alert.id)
                      loadData()
                    }}
                    className="ml-4 px-3 py-1 text-xs bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
                  >
                    Resolver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}