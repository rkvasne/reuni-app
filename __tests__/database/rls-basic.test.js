/**
 * Teste Básico de Políticas RLS
 * 
 * Versão simplificada para validar se as políticas RLS estão funcionando
 * sem problemas de módulos ES.
 */

// Usar require ao invés de import para evitar problemas de módulos ES
const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Clientes Supabase
let supabaseAdmin
let supabaseUser1
let supabaseUser2
let supabaseAnon

// IDs de teste
let testUser1Id
let testUser2Id

describe('Políticas RLS - Teste Básico', () => {
  beforeAll(async () => {
    // Configurar clientes
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log('🔧 Configurando usuários de teste...')

    // Criar usuários de teste
    const { data: user1, error: error1 } = await supabaseAdmin.auth.admin.createUser({
      email: 'test1@rls-basic.com',
      password: 'password123',
      email_confirm: true
    })

    const { data: user2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
      email: 'test2@rls-basic.com',
      password: 'password123',
      email_confirm: true
    })

    if (error1 || error2 || !user1?.user || !user2?.user) {
      console.error('Erro ao criar usuários:', error1 || error2)
      throw new Error('Falha ao criar usuários de teste')
    }

    testUser1Id = user1.user.id
    testUser2Id = user2.user.id

    // Configurar clientes autenticados
    supabaseUser1 = createClient(supabaseUrl, supabaseAnonKey)
    supabaseUser2 = createClient(supabaseUrl, supabaseAnonKey)

    // Autenticar usuários
    const { error: auth1Error } = await supabaseUser1.auth.signInWithPassword({
      email: 'test1@rls-basic.com',
      password: 'password123'
    })

    const { error: auth2Error } = await supabaseUser2.auth.signInWithPassword({
      email: 'test2@rls-basic.com',
      password: 'password123'
    })

    if (auth1Error || auth2Error) {
      console.error('Erro na autenticação:', auth1Error || auth2Error)
      throw new Error('Falha na autenticação dos usuários')
    }

    // Inserir perfis de usuário
    await supabaseAdmin.from('usuarios').upsert([
      {
        id: testUser1Id,
        nome: 'Usuário Teste 1',
        email: 'test1@rls-basic.com'
      },
      {
        id: testUser2Id,
        nome: 'Usuário Teste 2',
        email: 'test2@rls-basic.com'
      }
    ])

    console.log('✅ Usuários de teste configurados')
  }, 30000) // 30 segundos de timeout

  afterAll(async () => {
    console.log('🧹 Limpando dados de teste...')
    
    // Limpar dados de teste
    if (testUser1Id && testUser2Id) {
      await supabaseAdmin.from('usuarios').delete().in('id', [testUser1Id, testUser2Id])
      await supabaseAdmin.auth.admin.deleteUser(testUser1Id)
      await supabaseAdmin.auth.admin.deleteUser(testUser2Id)
    }
  }, 15000)

  describe('Tabela usuarios - RLS Básico', () => {
    it('deve permitir que usuário veja apenas seu próprio perfil', async () => {
      // Usuário 1 deve ver apenas seu perfil
      const { data: ownProfile, error: ownError } = await supabaseUser1
        .from('usuarios')
        .select('*')
        .eq('id', testUser1Id)
        .single()

      expect(ownError).toBeNull()
      expect(ownProfile).toBeTruthy()
      expect(ownProfile.id).toBe(testUser1Id)

      // Usuário 1 NÃO deve ver perfil do usuário 2
      const { data: otherProfile } = await supabaseUser1
        .from('usuarios')
        .select('*')
        .eq('id', testUser2Id)
        .single()

      expect(otherProfile).toBeNull()
    })

    it('deve permitir que usuário atualize apenas seu próprio perfil', async () => {
      // Atualizar próprio perfil deve funcionar
      const { error: ownError } = await supabaseUser1
        .from('usuarios')
        .update({ nome: 'Nome Atualizado RLS' })
        .eq('id', testUser1Id)

      expect(ownError).toBeNull()

      // Tentar atualizar perfil de outro usuário deve falhar
      const { error: otherError } = await supabaseUser1
        .from('usuarios')
        .update({ nome: 'Hack Attempt' })
        .eq('id', testUser2Id)

      expect(otherError).toBeTruthy()
    })

    it('deve bloquear acesso de usuários não autenticados', async () => {
      const { data } = await supabaseAnon
        .from('usuarios')
        .select('*')

      expect(data).toEqual([])
    })
  })

  describe('Tabela eventos - RLS Básico', () => {
    let testEventId

    beforeAll(async () => {
      // Criar evento de teste
      const { data: event } = await supabaseAdmin
        .from('eventos')
        .insert({
          titulo: 'Evento RLS Básico',
          descricao: 'Evento para testar RLS',
          local: 'Local de Teste',
          cidade: 'São Paulo',
          data: '2025-12-31',
          hora: '20:00',
          categoria: 'social',
          organizador_id: testUser1Id
        })
        .select()
        .single()

      testEventId = event.id
    })

    afterAll(async () => {
      if (testEventId) {
        await supabaseAdmin.from('eventos').delete().eq('id', testEventId)
      }
    })

    it('deve permitir que todos vejam eventos públicos', async () => {
      // Usuário autenticado deve ver eventos
      const { data: userEvents, error: userError } = await supabaseUser1
        .from('eventos')
        .select('*')
        .eq('id', testEventId)

      expect(userError).toBeNull()
      expect(userEvents).toHaveLength(1)

      // Usuário anônimo também deve ver eventos
      const { data: anonEvents, error: anonError } = await supabaseAnon
        .from('eventos')
        .select('*')
        .eq('id', testEventId)

      expect(anonError).toBeNull()
      expect(anonEvents).toHaveLength(1)
    })

    it('deve permitir que apenas organizador atualize seus eventos', async () => {
      // Organizador pode atualizar
      const { error: ownerError } = await supabaseUser1
        .from('eventos')
        .update({ titulo: 'Título Atualizado RLS' })
        .eq('id', testEventId)

      expect(ownerError).toBeNull()

      // Outro usuário não pode atualizar
      const { error: otherError } = await supabaseUser2
        .from('eventos')
        .update({ titulo: 'Hack Attempt' })
        .eq('id', testEventId)

      expect(otherError).toBeTruthy()
    })
  })

  describe('Validação de Performance Básica', () => {
    it('deve executar consultas RLS em tempo aceitável', async () => {
      const startTime = Date.now()

      await Promise.all([
        supabaseUser1.from('usuarios').select('*').eq('id', testUser1Id),
        supabaseUser1.from('eventos').select('*').limit(5),
        supabaseAnon.from('eventos').select('*').limit(5)
      ])

      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Deve executar em menos de 2 segundos
      expect(executionTime).toBeLessThan(2000)
      
      console.log(`⚡ Tempo de execução: ${executionTime}ms`)
    })
  })
})