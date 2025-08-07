/**
 * Utilitários para Sincronização e Recuperação de Dados de Usuário
 * 
 * Este módulo fornece funções utilitárias para diagnosticar, reparar e
 * manter a consistência entre auth.users e a tabela usuarios.
 * 
 * Requirements: 2.3, 2.4, 2.5
 */

import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { logRLSError } from '@/utils/rlsLogger'

interface UserProfile {
  id: string
  nome: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  cidade: string | null
  data_nascimento: string | null
  created_at: string
  updated_at: string
}

interface DiagnosticResult {
  userId: string
  issues: {
    type: 'missing_profile' | 'email_mismatch' | 'name_missing' | 'avatar_mismatch' | 'id_mismatch' | 'orphaned_profile'
    severity: 'critical' | 'high' | 'medium' | 'low'
    description: string
    currentValue: any
    expectedValue: any
  }[]
  canAutoRecover: boolean
  needsManualIntervention: boolean
}

interface RecoveryResult {
  success: boolean
  action: 'created' | 'updated' | 'deleted' | 'merged' | 'none'
  profile: UserProfile | null
  error: string | null
  issuesFixed: number
}

interface BulkDiagnosticResult {
  totalUsers: number
  healthyUsers: number
  usersWithIssues: number
  criticalIssues: number
  autoRecoverableIssues: number
  manualInterventionRequired: number
  diagnostics: DiagnosticResult[]
}

/**
 * Diagnostica problemas de sincronização para um usuário específico
 */
export async function diagnoseUserSync(authUser: User): Promise<DiagnosticResult> {
  const issues: DiagnosticResult['issues'] = []
  let canAutoRecover = true
  let needsManualIntervention = false

  try {
    // Buscar perfil na tabela usuarios
    const { data: profile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Perfil não existe
      issues.push({
        type: 'missing_profile',
        severity: 'critical',
        description: 'Perfil não existe na tabela usuarios',
        currentValue: null,
        expectedValue: 'UserProfile object'
      })
    } else if (error) {
      // Erro ao buscar perfil
      issues.push({
        type: 'orphaned_profile',
        severity: 'critical',
        description: `Erro ao acessar perfil: ${error.message}`,
        currentValue: error,
        expectedValue: 'Successful query'
      })
      canAutoRecover = false
      needsManualIntervention = true
    } else if (profile) {
      // Verificar consistência dos dados
      
      // Verificar ID
      if (profile.id !== authUser.id) {
        issues.push({
          type: 'id_mismatch',
          severity: 'critical',
          description: 'ID do perfil não coincide com ID do auth',
          currentValue: profile.id,
          expectedValue: authUser.id
        })
        canAutoRecover = false
        needsManualIntervention = true
      }

      // Verificar email
      if (authUser.email && profile.email !== authUser.email) {
        issues.push({
          type: 'email_mismatch',
          severity: 'high',
          description: 'Email do perfil está desatualizado',
          currentValue: profile.email,
          expectedValue: authUser.email
        })
      }

      // Verificar nome
      const expectedName = authUser.user_metadata?.full_name || authUser.user_metadata?.name
      if (expectedName && !profile.nome) {
        issues.push({
          type: 'name_missing',
          severity: 'medium',
          description: 'Nome não foi sincronizado do metadata',
          currentValue: profile.nome,
          expectedValue: expectedName
        })
      }

      // Verificar avatar
      const expectedAvatar = authUser.user_metadata?.avatar_url
      if (expectedAvatar && profile.avatar_url !== expectedAvatar) {
        issues.push({
          type: 'avatar_mismatch',
          severity: 'low',
          description: 'Avatar não está sincronizado',
          currentValue: profile.avatar_url,
          expectedValue: expectedAvatar
        })
      }
    }

    return {
      userId: authUser.id,
      issues,
      canAutoRecover,
      needsManualIntervention
    }
  } catch (error: any) {
    logRLSError(error, {
      operation: 'DIAGNOSE_USER_SYNC',
      userId: authUser.id
    })

    return {
      userId: authUser.id,
      issues: [{
        type: 'orphaned_profile',
        severity: 'critical',
        description: `Erro inesperado no diagnóstico: ${error.message}`,
        currentValue: error,
        expectedValue: 'Successful diagnosis'
      }],
      canAutoRecover: false,
      needsManualIntervention: true
    }
  }
}

/**
 * Recupera automaticamente problemas de sincronização
 */
export async function recoverUserSync(authUser: User, diagnostic?: DiagnosticResult): Promise<RecoveryResult> {
  try {
    const diag = diagnostic || await diagnoseUserSync(authUser)
    
    if (!diag.canAutoRecover) {
      return {
        success: false,
        action: 'none',
        profile: null,
        error: 'Problemas requerem intervenção manual',
        issuesFixed: 0
      }
    }

    if (diag.issues.length === 0) {
      // Buscar perfil atual para retornar
      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single()

      return {
        success: true,
        action: 'none',
        profile,
        error: null,
        issuesFixed: 0
      }
    }

    // Verificar se precisa criar perfil
    const needsCreation = diag.issues.some(issue => issue.type === 'missing_profile')
    
    if (needsCreation) {
      const profileData = {
        id: authUser.id,
        nome: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        email: authUser.email || null,
        avatar_url: authUser.user_metadata?.avatar_url || null
      }

      const { data, error } = await supabase
        .from('usuarios')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        logRLSError(error, {
          operation: 'RECOVER_CREATE_PROFILE',
          userId: authUser.id,
          profileData
        })
        throw error
      }

      return {
        success: true,
        action: 'created',
        profile: data,
        error: null,
        issuesFixed: diag.issues.length
      }
    }

    // Atualizar perfil existente
    const updates: Partial<UserProfile> = {}
    let issuesFixed = 0

    for (const issue of diag.issues) {
      switch (issue.type) {
        case 'email_mismatch':
          if (authUser.email) {
            updates.email = authUser.email
            issuesFixed++
          }
          break
        case 'name_missing':
          const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name
          if (name) {
            updates.nome = name
            issuesFixed++
          }
          break
        case 'avatar_mismatch':
          if (authUser.user_metadata?.avatar_url) {
            updates.avatar_url = authUser.user_metadata.avatar_url
            issuesFixed++
          }
          break
      }
    }

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .single()

      if (error) {
        logRLSError(error, {
          operation: 'RECOVER_UPDATE_PROFILE',
          userId: authUser.id,
          updates
        })
        throw error
      }

      return {
        success: true,
        action: 'updated',
        profile: data,
        error: null,
        issuesFixed
      }
    }

    // Buscar perfil atual se não houve updates
    const { data: profile } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single()

    return {
      success: true,
      action: 'none',
      profile,
      error: null,
      issuesFixed: 0
    }
  } catch (error: any) {
    logRLSError(error, {
      operation: 'RECOVER_USER_SYNC',
      userId: authUser.id
    })

    return {
      success: false,
      action: 'none',
      profile: null,
      error: error.message || 'Erro na recuperação',
      issuesFixed: 0
    }
  }
}

/**
 * Executa diagnóstico em massa de todos os usuários
 */
export async function bulkDiagnoseUsers(limit = 100): Promise<BulkDiagnosticResult> {
  try {
    // Buscar usuários do auth (requer service role)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: limit
    })

    if (authError) {
      throw new Error(`Erro ao buscar usuários do auth: ${authError.message}`)
    }

    const diagnostics: DiagnosticResult[] = []
    let healthyUsers = 0
    let usersWithIssues = 0
    let criticalIssues = 0
    let autoRecoverableIssues = 0
    let manualInterventionRequired = 0

    for (const user of authUsers.users) {
      const diagnostic = await diagnoseUserSync(user)
      diagnostics.push(diagnostic)

      if (diagnostic.issues.length === 0) {
        healthyUsers++
      } else {
        usersWithIssues++
        
        const hasCritical = diagnostic.issues.some(issue => issue.severity === 'critical')
        if (hasCritical) {
          criticalIssues++
        }

        if (diagnostic.canAutoRecover) {
          autoRecoverableIssues++
        }

        if (diagnostic.needsManualIntervention) {
          manualInterventionRequired++
        }
      }
    }

    return {
      totalUsers: authUsers.users.length,
      healthyUsers,
      usersWithIssues,
      criticalIssues,
      autoRecoverableIssues,
      manualInterventionRequired,
      diagnostics
    }
  } catch (error: any) {
    logRLSError(error, {
      operation: 'BULK_DIAGNOSE_USERS'
    })
    throw error
  }
}

/**
 * Executa recuperação em massa para usuários com problemas
 */
export async function bulkRecoverUsers(diagnostics: DiagnosticResult[]): Promise<{
  totalProcessed: number
  successful: number
  failed: number
  results: (RecoveryResult & { userId: string })[]
}> {
  const results: (RecoveryResult & { userId: string })[] = []
  let successful = 0
  let failed = 0

  for (const diagnostic of diagnostics) {
    if (!diagnostic.canAutoRecover || diagnostic.issues.length === 0) {
      continue
    }

    try {
      // Buscar usuário do auth
      const { data: authUser, error } = await supabase.auth.admin.getUserById(diagnostic.userId)
      
      if (error || !authUser.user) {
        results.push({
          userId: diagnostic.userId,
          success: false,
          action: 'none',
          profile: null,
          error: `Usuário não encontrado no auth: ${error?.message}`,
          issuesFixed: 0
        })
        failed++
        continue
      }

      const recovery = await recoverUserSync(authUser.user, diagnostic)
      results.push({
        userId: diagnostic.userId,
        ...recovery
      })

      if (recovery.success) {
        successful++
      } else {
        failed++
      }
    } catch (error: any) {
      results.push({
        userId: diagnostic.userId,
        success: false,
        action: 'none',
        profile: null,
        error: error.message || 'Erro inesperado',
        issuesFixed: 0
      })
      failed++
    }
  }

  return {
    totalProcessed: results.length,
    successful,
    failed,
    results
  }
}

/**
 * Limpa perfis órfãos (existem na tabela usuarios mas não no auth)
 */
export async function cleanupOrphanedProfiles(): Promise<{
  orphanedProfiles: string[]
  deletedProfiles: string[]
  errors: string[]
}> {
  try {
    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabase
      .from('usuarios')
      .select('id, email')

    if (profilesError) {
      throw profilesError
    }

    const orphanedProfiles: string[] = []
    const deletedProfiles: string[] = []
    const errors: string[] = []

    // Verificar cada perfil no auth
    for (const profile of profiles || []) {
      try {
        const { data: authUser, error } = await supabase.auth.admin.getUserById(profile.id)
        
        if (error || !authUser.user) {
          orphanedProfiles.push(profile.id)
          
          // Tentar deletar perfil órfão
          const { error: deleteError } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', profile.id)

          if (deleteError) {
            errors.push(`Erro ao deletar perfil ${profile.id}: ${deleteError.message}`)
          } else {
            deletedProfiles.push(profile.id)
          }
        }
      } catch (error: any) {
        errors.push(`Erro ao verificar usuário ${profile.id}: ${error.message}`)
      }
    }

    return {
      orphanedProfiles,
      deletedProfiles,
      errors
    }
  } catch (error: any) {
    logRLSError(error, {
      operation: 'CLEANUP_ORPHANED_PROFILES'
    })
    throw error
  }
}

/**
 * Gera relatório de saúde da sincronização
 */
export async function generateSyncHealthReport(): Promise<{
  timestamp: Date
  summary: {
    totalUsers: number
    healthyUsers: number
    usersWithIssues: number
    healthPercentage: number
  }
  issueBreakdown: Record<string, number>
  recommendations: string[]
}> {
  try {
    const bulkDiagnostic = await bulkDiagnoseUsers(1000) // Verificar até 1000 usuários
    
    const issueBreakdown: Record<string, number> = {}
    const recommendations: string[] = []

    // Contar tipos de problemas
    for (const diagnostic of bulkDiagnostic.diagnostics) {
      for (const issue of diagnostic.issues) {
        issueBreakdown[issue.type] = (issueBreakdown[issue.type] || 0) + 1
      }
    }

    // Gerar recomendações
    if (bulkDiagnostic.criticalIssues > 0) {
      recommendations.push(`${bulkDiagnostic.criticalIssues} usuários com problemas críticos precisam de atenção imediata`)
    }

    if (bulkDiagnostic.autoRecoverableIssues > 0) {
      recommendations.push(`${bulkDiagnostic.autoRecoverableIssues} usuários podem ser recuperados automaticamente`)
    }

    if (bulkDiagnostic.manualInterventionRequired > 0) {
      recommendations.push(`${bulkDiagnostic.manualInterventionRequired} usuários precisam de intervenção manual`)
    }

    if (issueBreakdown.missing_profile > 0) {
      recommendations.push('Implementar criação automática de perfil no callback de auth')
    }

    if (issueBreakdown.email_mismatch > 0) {
      recommendations.push('Implementar sincronização automática de email em mudanças de perfil')
    }

    const healthPercentage = (bulkDiagnostic.healthyUsers / bulkDiagnostic.totalUsers) * 100

    return {
      timestamp: new Date(),
      summary: {
        totalUsers: bulkDiagnostic.totalUsers,
        healthyUsers: bulkDiagnostic.healthyUsers,
        usersWithIssues: bulkDiagnostic.usersWithIssues,
        healthPercentage: Math.round(healthPercentage * 100) / 100
      },
      issueBreakdown,
      recommendations
    }
  } catch (error: any) {
    logRLSError(error, {
      operation: 'GENERATE_SYNC_HEALTH_REPORT'
    })
    throw error
  }
}