/**
 * Dashboard de Monitoramento RLS
 * 
 * Componente para monitorar e visualizar estatísticas de erros RLS
 * em tempo real, permitindo identificar problemas de segurança.
 * 
 * Requirements: 4.4, 4.5
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRLSErrorHandler } from '@/hooks/useRLSErrorHandler'

interface RLSMonitoringDashboardProps {
  className?: string
  refreshInterval?: number
}

export default function RLSMonitoringDashboard({ 
  className = '',
  refreshInterval = 30000 // 30 segundos
}: RLSMonitoringDashboardProps) {
  const { stats, getRecentLogs, getLogsByTable, getLogsBySeverity, updateStats } = useRLSErrorHandler({
    enableStats: true
  })

  const [selectedTab, setSelectedTab] = useState<'overview' | 'recent' | 'by-table' | 'by-severity'>('overview')
  const [selectedTable, setSelectedTable] = useState<string>('usuarios')
  const [selectedSeverity, setSelectedSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high')
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)

  // Auto-refresh das estatísticas
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(() => {
      updateStats()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isAutoRefresh, refreshInterval, updateStats])

  if (!stats) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const recentLogs = getRecentLogs(10)
  const tableLogs = getLogsByTable(selectedTable, 10)
  const severityLogs = getLogsBySeverity(selectedSeverity, 10)

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              🔒 Monitoramento RLS
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Estatísticas de segurança e políticas Row Level Security
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isAutoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isAutoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </button>
            
            <button
              onClick={updateStats}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: '📊 Visão Geral' },
            { id: 'recent', label: '🕒 Recentes' },
            { id: 'by-table', label: '📋 Por Tabela' },
            { id: 'by-severity', label: '⚠️ Por Severidade' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <OverviewTab stats={stats} />
        )}
        
        {selectedTab === 'recent' && (
          <RecentLogsTab logs={recentLogs} />
        )}
        
        {selectedTab === 'by-table' && (
          <ByTableTab 
            logs={tableLogs} 
            selectedTable={selectedTable}
            onTableChange={setSelectedTable}
          />
        )}
        
        {selectedTab === 'by-severity' && (
          <BySeverityTab 
            logs={severityLogs}
            selectedSeverity={selectedSeverity}
            onSeverityChange={setSelectedSeverity}
          />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ stats }: { stats: any }) {
  const totalErrors = stats.total
  const recentErrors = stats.recentErrors
  const criticalErrors = stats.bySeverity.critical || 0
  const highErrors = stats.bySeverity.high || 0

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Erros"
          value={totalErrors}
          icon="📊"
          color="blue"
        />
        <MetricCard
          title="Última Hora"
          value={recentErrors}
          icon="🕒"
          color={recentErrors > 0 ? "yellow" : "green"}
        />
        <MetricCard
          title="Críticos"
          value={criticalErrors}
          icon="🚨"
          color={criticalErrors > 0 ? "red" : "green"}
        />
        <MetricCard
          title="Alta Severidade"
          value={highErrors}
          icon="⚠️"
          color={highErrors > 0 ? "orange" : "green"}
        />
      </div>

      {/* Distribuição por severidade */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Distribuição por Severidade</h4>
        <div className="space-y-2">
          {Object.entries(stats.bySeverity).map(([severity, count]) => (
            <div key={severity} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">
                {getSeverityIcon(severity)} {severity}
              </span>
              <span className="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição por categoria */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Distribuição por Categoria</h4>
        <div className="space-y-2">
          {Object.entries(stats.byCategory).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </span>
              <span className="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecentLogsTab({ logs }: { logs: any[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-2">🎉</div>
        <p className="text-gray-600">Nenhum erro RLS recente</p>
        <p className="text-sm text-gray-500 mt-1">Isso é uma boa notícia!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  )
}

function ByTableTab({ 
  logs, 
  selectedTable, 
  onTableChange 
}: { 
  logs: any[]
  selectedTable: string
  onTableChange: (table: string) => void 
}) {
  const tables = ['usuarios', 'eventos', 'comunidades', 'presencas', 'comentarios']

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Tabela:</label>
        <select
          value={selectedTable}
          onChange={(e) => onTableChange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tables.map((table) => (
            <option key={table} value={table}>{table}</option>
          ))}
        </select>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📋</div>
          <p className="text-gray-600">Nenhum erro para a tabela {selectedTable}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

function BySeverityTab({ 
  logs, 
  selectedSeverity, 
  onSeverityChange 
}: { 
  logs: any[]
  selectedSeverity: string
  onSeverityChange: (severity: any) => void 
}) {
  const severities = [
    { value: 'critical', label: '🚨 Crítico' },
    { value: 'high', label: '⚠️ Alto' },
    { value: 'medium', label: '🟡 Médio' },
    { value: 'low', label: '🔵 Baixo' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Severidade:</label>
        <select
          value={selectedSeverity}
          onChange={(e) => onSeverityChange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {severities.map((severity) => (
            <option key={severity.value} value={severity.value}>
              {severity.label}
            </option>
          ))}
        </select>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">
            {getSeverityIcon(selectedSeverity)}
          </div>
          <p className="text-gray-600">
            Nenhum erro de severidade {selectedSeverity}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string
  value: number
  icon: string
  color: string 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700'
  }

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

function LogEntry({ log }: { log: any }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getSeverityIcon(log.severity)}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
              {log.severity.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">
              {getCategoryIcon(log.category)} {getCategoryLabel(log.category)}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(log.sanitizedError.timestamp).toLocaleString()}
            </span>
          </div>
          
          <p className="text-sm text-gray-900 mb-2">
            {log.sanitizedError.message}
          </p>
          
          {log.sanitizedError.table && (
            <p className="text-xs text-gray-600">
              Tabela: <span className="font-mono">{log.sanitizedError.table}</span>
            </p>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 ml-4"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium text-gray-700">Código:</span>
              <span className="ml-2 font-mono text-gray-600">{log.sanitizedError.code}</span>
            </div>
            
            {log.sanitizedError.details && (
              <div>
                <span className="font-medium text-gray-700">Detalhes:</span>
                <p className="ml-2 text-gray-600">{log.sanitizedError.details}</p>
              </div>
            )}
            
            {log.sanitizedError.hint && (
              <div>
                <span className="font-medium text-gray-700">Dica:</span>
                <p className="ml-2 text-gray-600">{log.sanitizedError.hint}</p>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-700">ID do Log:</span>
              <span className="ml-2 font-mono text-gray-600">{log.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getSeverityIcon(severity: string): string {
  const icons = {
    critical: '🚨',
    high: '⚠️',
    medium: '🟡',
    low: '🔵'
  }
  return icons[severity as keyof typeof icons] || '❓'
}

function getSeverityColor(severity: string): string {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  }
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getCategoryIcon(category: string): string {
  const icons = {
    access_denied: '🚫',
    policy_violation: '📋',
    auth_failure: '🔐',
    unknown: '❓'
  }
  return icons[category as keyof typeof icons] || '❓'
}

function getCategoryLabel(category: string): string {
  const labels = {
    access_denied: 'Acesso Negado',
    policy_violation: 'Violação de Política',
    auth_failure: 'Falha de Autenticação',
    unknown: 'Desconhecido'
  }
  return labels[category as keyof typeof labels] || category
}