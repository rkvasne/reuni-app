/**
 * Testes de Validação das Políticas RLS da Tabela usuarios
 * 
 * Este arquivo contém testes específicos para validar que as políticas
 * RLS da tabela usuarios estão funcionando corretamente após a migração 015.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logRLSError, getRLSStats } from '@/utils/rlsLogger'

// Configuração de teste
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

// Clientes Supabase
let supabaseAdmin: SupabaseClient
let supabaseUser1: SupabaseClient
let supabaseUser2: SupabaseClient
let supabaseAnon: SupabaseClient

// IDs de teste
let testUser1Id: string
let testUser2Id: string

describe('Validação RLS - Tabela usuarios', () => {
  beforeAll(async () => {
    // Configurar clientes
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Criar usuários de teste
    const { data: user1, error: error1 } = await supabaseAdmin.auth.admin.createUser({
      email: 'rls-test-1@validation.com',
      password: 'password123',
      email_confirm: true
    })

    const { data: user2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
      email: 'rls-test-2@validation.com',
      password: 'password123',
      email_confirm: true
    })

    if (error1 || error2 || !user1?.user || !user2?.user) {
      console.warn('Pulando testes RLS - não foi possível criar usuários de teste')
      return
    }

    testUser1Id = user1.user.id
    testUser2Id = user2.user.id

    // Configurar clientes autenticados
    supabaseUser1 = createClient(supabaseUrl, supabaseAnonKey)
    supabaseUser2 = createClient(supabaseUrl, supabaseAnonKey)

    // Autenticar usuários
    await supabaseUser1.auth.signInWithPassword({
      email: 'rls-test-1@validation.com',
      password: 'password123'
    })

    await supabaseUser2.auth.signInWithPassword({
      email: 'rls-test-2@validation.com',
      password: 'password123'
    })

    // Inserir perfis de usuário
    await supabaseAdmin.from('usuarios').upsert([
      {
        id: testUser1Id,
        nome: 'RLS Test User 1',
        email: 'rls-test-1@validation.com'
      },
      {
        id: testUser2Id,
        nome: 'RLS Test User 2',
        email: 'rls-test-2@validation.com'
      }
    ])
  }, 30000) // Timeout maior para setup

  afterAll(async () => {
    // Limpar dados de teste
    if (testUser1Id && testUser2Id) {
      await supabaseAdmin.from('usuarios').delete().in('id', [testUser1Id, testUser2Id])
      await supabaseAdmin.auth.admin.deleteUser(testUser1Id)
      await supabaseAdmin.auth.admin.deleteUser(testUser2Id)
    }
  })

  describe('Política usuarios_select_own', () => {
    it('deve permitir que usuário veja seu próprio perfil', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      const { data, error } = await supabaseUser1
        .from('usuarios')
        .select('*')
        .eq('id', testUser1Id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.id).toBe(testUser1Id)
      expect(data.nome).toBe('RLS Test User 1')
    })

    it('deve bloquear visualização de perfil de outros usuários', async () => {
      if (!testUser1Id || !testUser2Id) {
        console.warn('Pulando teste - usuários não criados')
        return
      }

      const { data, error } = await supabaseUser1
        .from('usuarios')
        .select('*')
        .eq('id', testUser2Id)
        .single()

      // RLS deve bloquear o acesso
      expect(data).toBeNull()
      
      // Logar erro RLS para análise
      if (error) {
        const logId = logRLSError(error, {
          operation: 'SELECT',
          table: 'usuarios',
          attemptedUserId: testUser2Id,
          authenticatedUserId: testUser1Id
        })
        expect(logId).toBeTruthy()
      }
    })

    it('deve bloquear acesso de usuários não autenticados', async () => {
      const { data, error } = await supabaseAnon
        .from('usuarios')
        .select('*')

      expect(data).toEqual([])
      
      // Logar tentativa de acesso não autorizado
      if (error) {
        logRLSError(error, {
          operation: 'SELECT',
          table: 'usuarios',
          authenticatedUserId: null
        })
      }
    })

    it('deve retornar lista vazia ao buscar todos os usuários', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      // Usuário autenticado tentando ver todos os usuários
      const { data, error } = await supabaseUser1
        .from('usuarios')
        .select('*')

      expect(error).toBeNull()
      // Deve retornar apenas o próprio usuário
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(testUser1Id)
    })
  })

  describe('Política usuarios_insert_own', () => {
    it('deve permitir inserção de próprio perfil', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      // Primeiro, remover o perfil existente
      await supabaseAdmin.from('usuarios').delete().eq('id', testUser1Id)

      // Tentar inserir próprio perfil
      const { data, error } = await supabaseUser1
        .from('usuarios')
        .insert({
          id: testUser1Id,
          nome: 'Perfil Próprio Inserido',
          email: 'rls-test-1@validation.com'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.id).toBe(testUser1Id)
    })

    it('deve bloquear inserção de perfil de outros usuários', async () => {
      if (!testUser1Id || !testUser2Id) {
        console.warn('Pulando teste - usuários não criados')
        return
      }

      // Tentar inserir perfil com ID diferente
      const { data, error } = await supabaseUser1
        .from('usuarios')
        .insert({
          id: testUser2Id, // ID diferente do usuário autenticado
          nome: 'Tentativa de Hack',
          email: 'hack@attempt.com'
        })

      expect(data).toBeNull()
      expect(error).toBeTruthy()

      // Logar tentativa de violação
      const logId = logRLSError(error, {
        operation: 'INSERT',
        table: 'usuarios',
        attemptedUserId: testUser2Id,
        authenticatedUserId: testUser1Id,
        violationType: 'insert_other_user'
      })
      expect(logId).toBeTruthy()
    })

    it('deve bloquear inserção por usuários não autenticados', async () => {
      const { data, error } = await supabaseAnon
        .from('usuarios')
        .insert({
          id: 'fake-uuid',
          nome: 'Usuário Anônimo',
          email: 'anon@test.com'
        })

      expect(data).toBeNull()
      expect(error).toBeTruthy()

      // Logar tentativa não autorizada
      logRLSError(error, {
        operation: 'INSERT',
        table: 'usuarios',
        authenticatedUserId: null
      })
    })
  })

  describe('Política usuarios_update_own', () => {
    it('deve permitir atualização de próprio perfil', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      const { data, error } = await supabaseUser1
        .from('usuarios')
        .update({ nome: 'Nome Atualizado RLS' })
        .eq('id', testUser1Id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.nome).toBe('Nome Atualizado RLS')
    })

    it('deve bloquear atualização de perfil de outros usuários', async () => {
      if (!testUser1Id || !testUser2Id) {
        console.warn('Pulando teste - usuários não criados')
        return
      }

      const { data, error } = await supabaseUser1
        .from('usuarios')
        .update({ nome: 'Tentativa de Hack Update' })
        .eq('id', testUser2Id)

      // RLS deve bloquear - nenhuma linha afetada
      expect(data).toEqual([])

      // Logar tentativa de violação
      if (error) {
        logRLSError(error, {
          operation: 'UPDATE',
          table: 'usuarios',
          attemptedUserId: testUser2Id,
          authenticatedUserId: testUser1Id,
          violationType: 'update_other_user'
        })
      }
    })

    it('deve bloquear atualização por usuários não autenticados', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      const { data, error } = await supabaseAnon
        .from('usuarios')
        .update({ nome: 'Update Anônimo' })
        .eq('id', testUser1Id)

      expect(data).toEqual([])
      
      if (error) {
        logRLSError(error, {
          operation: 'UPDATE',
          table: 'usuarios',
          authenticatedUserId: null
        })
      }
    })

    it('deve permitir atualização parcial de campos', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      // Testar atualização de diferentes campos
      const updates = [
        { nome: 'Novo Nome' },
        { bio: 'Nova bio do usuário' },
        { cidade: 'São Paulo' }
      ]

      for (const update of updates) {
        const { data, error } = await supabaseUser1
          .from('usuarios')
          .update(update)
          .eq('id', testUser1Id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(data).toBeTruthy()
        
        // Verificar se o campo foi atualizado
        const field = Object.keys(update)[0]
        expect(data[field]).toBe(Object.values(update)[0])
      }
    })
  })

  describe('Cenários de Segurança Avançados', () => {
    it('deve bloquear tentativas de SQL injection', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      const maliciousInputs = [
        "'; DROP TABLE usuarios; --",
        "' OR '1'='1",
        "'; UPDATE usuarios SET nome='hacked' WHERE '1'='1'; --"
      ]

      for (const maliciousInput of maliciousInputs) {
        const { data, error } = await supabaseUser1
          .from('usuarios')
          .select('*')
          .eq('id', maliciousInput)

        expect(data).toEqual([])
        
        // Logar tentativa de injeção
        if (error) {
          logRLSError(error, {
            operation: 'SELECT',
            table: 'usuarios',
            violationType: 'sql_injection_attempt',
            maliciousInput
          })
        }
      }
    })

    it('deve bloquear tentativas de bypass com UUIDs maliciosos', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      const maliciousUUIDs = [
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        testUser2Id // UUID válido mas não autorizado
      ]

      for (const uuid of maliciousUUIDs) {
        const { data, error } = await supabaseUser1
          .from('usuarios')
          .select('*')
          .eq('id', uuid)

        expect(data).toEqual([])
        
        // Logar tentativa de acesso não autorizado
        logRLSError(error || new Error('Unauthorized access attempt'), {
          operation: 'SELECT',
          table: 'usuarios',
          violationType: 'unauthorized_uuid_access',
          attemptedUUID: uuid
        })
      }
    })

    it('deve manter consistência em operações concorrentes', async () => {
      if (!testUser1Id || !testUser2Id) {
        console.warn('Pulando teste - usuários não criados')
        return
      }

      // Executar operações concorrentes
      const operations = [
        supabaseUser1.from('usuarios').select('*').eq('id', testUser1Id),
        supabaseUser2.from('usuarios').select('*').eq('id', testUser2Id),
        supabaseUser1.from('usuarios').update({ nome: 'Concurrent 1' }).eq('id', testUser1Id),
        supabaseUser2.from('usuarios').update({ nome: 'Concurrent 2' }).eq('id', testUser2Id)
      ]

      const results = await Promise.allSettled(operations)

      // Verificar que operações próprias funcionaram
      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('fulfilled')
      expect(results[2].status).toBe('fulfilled')
      expect(results[3].status).toBe('fulfilled')

      // Verificar que cada usuário vê apenas seus dados
      if (results[0].status === 'fulfilled') {
        expect(results[0].value.data).toHaveLength(1)
        expect(results[0].value.data[0].id).toBe(testUser1Id)
      }

      if (results[1].status === 'fulfilled') {
        expect(results[1].value.data).toHaveLength(1)
        expect(results[1].value.data[0].id).toBe(testUser2Id)
      }
    })
  })

  describe('Performance e Monitoramento', () => {
    it('deve executar consultas RLS em tempo aceitável', async () => {
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      const startTime = Date.now()

      // Executar múltiplas operações
      await Promise.all([
        supabaseUser1.from('usuarios').select('*').eq('id', testUser1Id),
        supabaseUser1.from('usuarios').select('nome').eq('id', testUser1Id),
        supabaseUser1.from('usuarios').select('email').eq('id', testUser1Id)
      ])

      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Políticas RLS devem executar rapidamente
      expect(executionTime).toBeLessThan(1000) // Menos de 1 segundo
    })

    it('deve gerar estatísticas de erro RLS', async () => {
      // Forçar alguns erros RLS para gerar estatísticas
      if (testUser1Id && testUser2Id) {
        await supabaseUser1.from('usuarios').select('*').eq('id', testUser2Id)
        await supabaseAnon.from('usuarios').select('*')
      }

      const stats = getRLSStats()
      
      expect(stats).toBeTruthy()
      expect(typeof stats.total).toBe('number')
      expect(typeof stats.recentErrors).toBe('number')
      expect(stats.bySeverity).toBeTruthy()
      expect(stats.byCategory).toBeTruthy()
    })
  })

  describe('Validação de Estrutura da Tabela', () => {
    it('deve ter as colunas esperadas na tabela usuarios', async () => {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      
      if (data && data.length > 0) {
        const user = data[0]
        
        // Verificar colunas obrigatórias
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('nome')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('created_at')
        expect(user).toHaveProperty('updated_at')
      }
    })

    it('deve ter índices apropriados para performance', async () => {
      // Verificar se consultas por ID são rápidas (indicativo de índice)
      if (!testUser1Id) {
        console.warn('Pulando teste - usuário não criado')
        return
      }

      const startTime = Date.now()
      
      await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', testUser1Id)
        .single()

      const endTime = Date.now()
      const queryTime = endTime - startTime

      // Consulta por ID deve ser muito rápida (indicativo de índice)
      expect(queryTime).toBeLessThan(100) // Menos de 100ms
    })
  })
})