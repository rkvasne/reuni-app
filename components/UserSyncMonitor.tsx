/**
 * Monitor de Sincronização de Usuários
 * 
 * Componente para monitorar e gerenciar a sincronização entre
 * auth.users e a tabela usuarios, com funcionalidades de diagnóstico
 * e recuperação automática.
 * 
 * Requirements: 2.4, 2.5
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useUserSync } from '@/hooks/useUserSync'
import { useAuth } from '@/hooks/useAuth'

interface UserSyncMonitorProps {
  className?: string
  showBulkOperations?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function UserSyncMonitor({ 
  className = '',
  showBulkOperations = false,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minuto
}: UserSyncMonitorProps) {
  const { user } = useAuth()
  const { 
    profile, 
    syncStatus, 
    syncUser, 
    forceSync, 
    needsSync, 
    isLoading, 
    isError, 
    error, 
    lastSync,
    needsRecovery,
    isConsistent 
  } = useUserSync()

  const [selectedTab, setSelectedTab] = useState<'status' | 'diagnostics' | 'recovery'>('status')
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false)

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (user && !isLoading) {
        syncUser()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, user, isLoading, syncUser])

  const handleForceSync = async () => {
    await forceSync()
  }

  const handleRunDiagnostics = async () => {
    if (!user) return

    setIsRunningDiagnostics(true)
    try {
      // Simular diagnósticos básicos
      const diagnosticResult = {
        userId: user.id,
        authEmail: user.email,
        profileEmail: profile?.email,
        authMetadata: user.user_metadata,
        profileData: profile,
        consistency: {
          emailMatch: user.email === profile?.email,
          hasName: !!profile?.nome,
          hasAvatar: !!profile?.avatar_url,
          profileExists: !!profile
        },
        recommendations: [] as string[]
      }

      if (!diagnosticResult.consistency.emailMatch) {
        diagnosticResult.recommendations.push('Sincronizar email do auth com perfil')
      }
      if (!diagnosticResult.consistency.hasName && user.user_metadata?.full_name) {
        diagnosticResult.recommendations.push('Sincronizar nome do metadata')
      }
      if (!diagnosticResult.consistency.hasAvatar && user.user_metadata?.avatar_url) {
        diagnosticResult.recommendations.push('Sincronizar avatar do metadata')
      }
      if (!diagnosticResult.consistency.profileExists) {
        diagnosticResult.recommendations.push('Criar perfil na tabela usuarios')
      }

      setDiagnostics(diagnosticResult)
    } catch (error) {
      console.error('Erro ao executar diagnósticos:', error)
    } finally {
      setIsRunningDiagnostics(false)
    }
  }

  if (!user) {
    return (
      <div className={`bg-white rounded-xl shadow-reuni border p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">👤</div>
          <p className="text-gray-600">Usuário não autenticado</p>
          <p className="text-sm text-gray-500 mt-1">Faça login para monitorar sincronização</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-reuni border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              🔄 Monitor de Sincronização
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Status da sincronização entre auth e perfil
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isConsistent 
                ? 'bg-green-100 text-green-700' 
                : needsRecovery
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isConsistent ? '✅ Sincronizado' : needsRecovery ? '🚨 Precisa Recuperação' : '⚠️ Desatualizado'}
            </div>
            
            <button
              onClick={handleForceSync}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? '🔄 Sincronizando...' : '🔄 Forçar Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'status', label: '📊 Status' },
            { id: 'diagnostics', label: '🔍 Diagnósticos' },
            { id: 'recovery', label: '🛠️ Recuperação' }
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
        {selectedTab === 'status' && (
          <StatusTab 
            user={user}
            profile={profile}
            syncStatus={syncStatus}
            lastSync={lastSync}
            isConsistent={isConsistent}
            needsSync={needsSync()}
          />
        )}
        
        {selectedTab === 'diagnostics' && (
          <DiagnosticsTab 
            diagnostics={diagnostics}
            isRunning={isRunningDiagnostics}
            onRunDiagnostics={handleRunDiagnostics}
          />
        )}
        
        {selectedTab === 'recovery' && (
          <RecoveryTab 
            user={user}
            profile={profile}
            syncStatus={syncStatus}
            onForceSync={handleForceSync}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

function StatusTab({ 
  user, 
  profile, 
  syncStatus, 
  lastSync, 
  isConsistent, 
  needsSync 
}: {
  user: any
  profile: any
  syncStatus: any
  lastSync: Date | null
  isConsistent: boolean
  needsSync: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Status Geral"
          value={isConsistent ? "Sincronizado" : "Desatualizado"}
          icon={isConsistent ? "✅" : "⚠️"}
          color={isConsistent ? "green" : "yellow"}
        />
        <MetricCard
          title="Tentativas"
          value={syncStatus.syncAttempts}
          icon="🔄"
          color="blue"
        />
        <MetricCard
          title="Última Sync"
          value={lastSync ? lastSync.toLocaleTimeString() : "Nunca"}
          icon="🕒"
          color={lastSync ? "green" : "gray"}
        />
      </div>

      {/* Dados do usuário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">🔐 Dados de Autenticação</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-mono text-gray-900">{user.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nome (metadata):</span>
              <span className="text-gray-900">{user.user_metadata?.full_name || user.user_metadata?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avatar (metadata):</span>
              <span className="text-gray-900">{user.user_metadata?.avatar_url ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">👤 Dados do Perfil</h4>
          {profile ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-gray-900">{profile.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900">{profile.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="text-gray-900">{profile.nome || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avatar:</span>
                <span className="text-gray-900">{profile.avatar_url ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Criado:</span>
                <span className="text-gray-900">{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-400 text-2xl mb-2">❌</div>
              <p className="text-gray-600">Perfil não encontrado</p>
              <p className="text-xs text-gray-500 mt-1">Será criado na próxima sincronização</p>
            </div>
          )}
        </div>
      </div>

      {/* Status de erro */}
      {syncStatus.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-red-400 text-xl mr-3">🚨</div>
            <div>
              <h4 className="font-medium text-red-900">Erro na Sincronização</h4>
              <p className="text-red-700 text-sm mt-1">{syncStatus.error}</p>
              {syncStatus.needsRecovery && (
                <p className="text-red-600 text-xs mt-2">
                  ⚠️ Este erro requer recuperação manual. Vá para a aba "Recuperação".
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DiagnosticsTab({ 
  diagnostics, 
  isRunning, 
  onRunDiagnostics 
}: {
  diagnostics: any
  isRunning: boolean
  onRunDiagnostics: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Diagnósticos de Sincronização</h4>
          <p className="text-sm text-gray-600 mt-1">
            Analise a consistência entre dados de auth e perfil
          </p>
        </div>
        <button
          onClick={onRunDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isRunning ? '🔍 Analisando...' : '🔍 Executar Diagnósticos'}
        </button>
      </div>

      {diagnostics ? (
        <div className="space-y-4">
          {/* Verificações de consistência */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">✅ Verificações de Consistência</h5>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(diagnostics.consistency).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                    {value ? '✅ OK' : '❌ Falha'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendações */}
          {diagnostics.recommendations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-3">💡 Recomendações</h5>
              <ul className="space-y-2">
                {diagnostics.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-yellow-800 flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dados detalhados */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">📋 Dados Detalhados</h5>
            <div className="text-xs font-mono bg-white p-3 rounded border overflow-auto max-h-64">
              <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-600">Nenhum diagnóstico executado</p>
          <p className="text-sm text-gray-500 mt-1">Clique em "Executar Diagnósticos" para analisar</p>
        </div>
      )}
    </div>
  )
}

function RecoveryTab({ 
  user, 
  profile, 
  syncStatus, 
  onForceSync, 
  isLoading 
}: {
  user: any
  profile: any
  syncStatus: any
  onForceSync: () => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900">🛠️ Ferramentas de Recuperação</h4>
        <p className="text-sm text-gray-600 mt-1">
          Use estas ferramentas para resolver problemas de sincronização
        </p>
      </div>

      {/* Ações de recuperação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">🔄 Sincronização Forçada</h5>
          <p className="text-sm text-gray-600 mb-3">
            Force uma nova sincronização completa dos dados
          </p>
          <button
            onClick={onForceSync}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Sincronizando...' : 'Forçar Sincronização'}
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">🔧 Recriar Perfil</h5>
          <p className="text-sm text-gray-600 mb-3">
            Recria o perfil do zero usando dados do auth
          </p>
          <button
            disabled={true}
            className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            Em Desenvolvimento
          </button>
        </div>
      </div>

      {/* Status atual */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-3">📊 Status Atual</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Perfil existe:</span>
            <span className={`font-medium ${profile ? 'text-green-600' : 'text-red-600'}`}>
              {profile ? '✅ Sim' : '❌ Não'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Precisa recuperação:</span>
            <span className={`font-medium ${syncStatus.needsRecovery ? 'text-red-600' : 'text-green-600'}`}>
              {syncStatus.needsRecovery ? '🚨 Sim' : '✅ Não'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Última tentativa:</span>
            <span className="text-gray-900">
              {syncStatus.lastSync ? syncStatus.lastSync.toLocaleString() : 'Nunca'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tentativas:</span>
            <span className="text-gray-900">{syncStatus.syncAttempts}</span>
          </div>
        </div>
      </div>

      {/* Logs de erro */}
      {syncStatus.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 className="font-medium text-red-900 mb-2">🚨 Último Erro</h5>
          <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
            {syncStatus.error}
          </p>
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
  value: string | number
  icon: string
  color: string 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-gray-50 text-gray-700'
  }

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}