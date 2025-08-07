/**
 * Testes de Cenários Edge Case para Políticas RLS
 * 
 * Este arquivo testa cenários específicos e edge cases de segurança
 * que podem não ser cobertos pelos testes básicos de RLS.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

let supabaseAdmin: SupabaseClient
let supabaseUser: SupabaseClient
let supabaseAnon: SupabaseClient

let testUserId: string
let testEventId: string
let testCommunityId: string

describe('RLS Edge Cases - Cenários de Segurança Avançados', () => {
  beforeAll(async () => {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Criar usuário de teste
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'edgecase@example.com',
      password: 'password123',
      email_confirm: true
    })

    if (error || !user?.user) {
      throw new Error('Falha ao criar usuário de teste')
    }

    testUserId = user.user.id

    supabaseUser = createClient(supabaseUrl, supabaseAnonKey)
    await supabaseUser.auth.signInWithPassword({
      email: 'edgecase@example.com',
      password: 'password123'
    })

    await setupEdgeCaseData()
  })

  afterAll(async () => {
    await cleanupEdgeCaseData()
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId)
    }
  })

  describe('Ataques de Injeção SQL via RLS', () => {
    it('deve prevenir injeção SQL em filtros de usuário', async () => {
      // Tentar injeção SQL através de parâmetros
      const maliciousId = "'; DROP TABLE usuarios; --"
      
      const { data, error } = await supabaseUser
        .from('usuarios')
        .select('*')
        .eq('id', maliciousId)

      // Não deve retornar dados nem causar erro de SQL
      expect(data).toEqual([])
      expect(error).toBeNull()
    })

    it('deve prevenir bypass de RLS através de UNION attacks', async () => {
      // Tentar bypass com UNION
      const maliciousQuery = "1 UNION SELECT * FROM usuarios"
      
      const { data, error } = await supabaseUser
        .from('eventos')
        .select('*')
        .eq('titulo', maliciousQuery)

      expect(data).toEqual([])
      expect(error).toBeNull()
    })
  })

  describe('Ataques de Escalação de Privilégios', () => {
    it('deve prevenir modificação de auth.uid() através de headers', async () => {
      // Criar cliente com headers maliciosos
      const maliciousClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            'Authorization': `Bearer fake-jwt-token`,
            'X-User-ID': 'fake-user-id'
          }
        }
      })

      const { data, error } = await maliciousClient
        .from('usuarios')
        .select('*')

      // Deve falhar ou retornar vazio
      expect(data).toEqual([])
    })

    it('deve prevenir acesso através de service_role simulado', async () => {
      // Tentar usar service role key falsa
      const fakeServiceClient = createClient(supabaseUrl, 'fake-service-key')
      
      const { data, error } = await fakeServiceClient
        .from('usuarios')
        .select('*')

      expect(error).toBeTruthy()
    })
  })

  describe('Ataques de Timing e Information Disclosure', () => {
    it('deve ter tempo de resposta consistente para dados existentes e inexistentes', async () => {
      // Medir tempo para dados existentes
      const startExisting = Date.now()
      await supabaseUser
        .from('usuarios')
        .select('*')
        .eq('id', testUserId)
      const timeExisting = Date.now() - startExisting

      // Medir tempo para dados inexistentes
      const startNonExisting = Date.now()
      await supabaseUser
        .from('usuarios')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
      const timeNonExisting = Date.now() - startNonExisting

      // Diferença de tempo não deve ser significativa (< 100ms)
      const timeDifference = Math.abs(timeExisting - timeNonExisting)
      expect(timeDifference).toBeLessThan(100)
    })

    it('deve retornar erros consistentes para operações não autorizadas', async () => {
      // Tentar acessar dados de outro usuário
      const { data: data1, error: error1 } = await supabaseUser
        .from('usuarios')
        .select('*')
        .eq('id', '11111111-1111-1111-1111-111111111111')

      // Tentar acessar dados inexistentes
      const { data: data2, error: error2 } = await supabaseUser
        .from('usuarios')
        .select('*')
        .eq('id', '22222222-2222-2222-2222-222222222222')

      // Ambos devem retornar resultados vazios (não erros diferentes)
      expect(data1).toEqual([])
      expect(data2).toEqual([])
    })
  })

  describe('Ataques de Bypass através de Relacionamentos', () => {
    it('deve prevenir acesso a dados através de JOINs não autorizados', async () => {
      // Tentar acessar dados de usuário através de eventos
      const { data, error } = await supabaseAnon
        .from('eventos')
        .select(`
          *,
          organizador:usuarios(*)
        `)

      // Deve retornar eventos mas não dados do organizador
      if (data && data.length > 0) {
        data.forEach(evento => {
          expect(evento.organizador).toBeNull()
        })
      }
    })

    it('deve prevenir acesso a comunidades privadas através de membros', async () => {
      // Criar comunidade privada
      const { data: privateCommunity } = await supabaseAdmin
        .from('comunidades')
        .insert({
          nome: 'Comunidade Privada Edge Case',
          descricao: 'Comunidade para testar edge cases',
          categoria: 'privado',
          criador_id: testUserId,
          privada: true
        })
        .select()
        .single()

      // Usuário não-membro não deve ver a comunidade
      const { data, error } = await supabaseAnon
        .from('comunidades')
        .select('*')
        .eq('id', privateCommunity.id)

      expect(data).toEqual([])
    })
  })

  describe('Ataques de Concorrência e Race Conditions', () => {
    it('deve manter consistência em operações concorrentes', async () => {
      // Executar múltiplas operações simultaneamente
      const promises = Array.from({ length: 10 }, (_, i) => 
        supabaseUser
          .from('curtidas_evento')
          .insert({
            evento_id: testEventId,
            usuario_id: testUserId
          })
      )

      const results = await Promise.allSettled(promises)
      
      // Apenas uma operação deve ter sucesso (devido ao UNIQUE constraint)
      const successful = results.filter(r => r.status === 'fulfilled').length
      expect(successful).toBe(1)
    })

    it('deve prevenir condições de corrida em contadores', async () => {
      // Executar múltiplas operações de curtida/descurtida
      const operations = []
      
      for (let i = 0; i < 5; i++) {
        operations.push(
          supabaseUser
            .from('curtidas_evento')
            .insert({
              evento_id: testEventId,
              usuario_id: testUserId
            })
        )
        
        operations.push(
          supabaseUser
            .from('curtidas_evento')
            .delete()
            .eq('evento_id', testEventId)
            .eq('usuario_id', testUserId)
        )
      }

      await Promise.allSettled(operations)

      // Verificar se contador está consistente
      const { data: evento } = await supabaseAdmin
        .from('eventos')
        .select('likes_count')
        .eq('id', testEventId)
        .single()

      const { count } = await supabaseAdmin
        .from('curtidas_evento')
        .select('*', { count: 'exact' })
        .eq('evento_id', testEventId)

      expect(evento.likes_count).toBe(count)
    })
  })

  describe('Ataques de Enumeração de Dados', () => {
    it('deve prevenir enumeração de IDs de usuários', async () => {
      const testIds = [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
      ]

      const results = await Promise.all(
        testIds.map(id => 
          supabaseAnon
            .from('usuarios')
            .select('id')
            .eq('id', id)
        )
      )

      // Todos devem retornar vazio
      results.forEach(({ data }) => {
        expect(data).toEqual([])
      })
    })

    it('deve prevenir enumeração através de mensagens de erro diferentes', async () => {
      // Tentar operações em recursos existentes vs inexistentes
      const existingEventUpdate = supabaseUser
        .from('eventos')
        .update({ titulo: 'Novo Título' })
        .eq('id', testEventId)

      const nonExistingEventUpdate = supabaseUser
        .from('eventos')
        .update({ titulo: 'Novo Título' })
        .eq('id', '00000000-0000-0000-0000-000000000000')

      const [result1, result2] = await Promise.allSettled([
        existingEventUpdate,
        nonExistingEventUpdate
      ])

      // Ambos devem falhar com erro similar (não autorizado)
      expect(result1.status).toBe('rejected')
      expect(result2.status).toBe('rejected')
    })
  })

  describe('Validação de Constraints com RLS', () => {
    it('deve aplicar constraints mesmo com RLS ativo', async () => {
      // Tentar inserir dados inválidos
      const { data, error } = await supabaseUser
        .from('usuarios')
        .update({
          nome: 'A', // Muito curto (constraint: >= 2)
          bio: 'A'.repeat(501) // Muito longo (constraint: <= 500)
        })
        .eq('id', testUserId)

      expect(error).toBeTruthy()
      expect(error?.message).toContain('constraint')
    })

    it('deve validar foreign keys com RLS', async () => {
      // Tentar inserir evento com organizador inexistente
      const { data, error } = await supabaseUser
        .from('eventos')
        .insert({
          titulo: 'Evento Inválido',
          descricao: 'Teste',
          local: 'Local',
          cidade: 'São Paulo',
          data: '2025-12-31',
          hora: '20:00',
          categoria: 'social',
          organizador_id: '00000000-0000-0000-0000-000000000000' // ID inexistente
        })

      expect(error).toBeTruthy()
    })
  })

  describe('Performance sob Carga com RLS', () => {
    it('deve manter performance aceitável com múltiplas consultas simultâneas', async () => {
      const startTime = Date.now()

      // Executar 50 consultas simultâneas
      const promises = Array.from({ length: 50 }, () => 
        supabaseUser
          .from('eventos')
          .select('*')
          .limit(5)
      )

      await Promise.all(promises)

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Deve completar em menos de 5 segundos
      expect(totalTime).toBeLessThan(5000)
    })

    it('deve manter performance com consultas complexas', async () => {
      const startTime = Date.now()

      await supabaseUser
        .from('eventos')
        .select(`
          *,
          presencas(count),
          comentarios(count),
          curtidas_evento(count)
        `)
        .limit(10)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      // Consulta complexa deve completar em menos de 2 segundos
      expect(queryTime).toBeLessThan(2000)
    })
  })
})

async function setupEdgeCaseData() {
  // Inserir perfil de usuário
  await supabaseAdmin.from('usuarios').upsert({
    id: testUserId,
    nome: 'Edge Case User',
    email: 'edgecase@example.com'
  })

  // Criar evento de teste
  const { data: event } = await supabaseAdmin
    .from('eventos')
    .insert({
      titulo: 'Evento Edge Case',
      descricao: 'Evento para testar edge cases',
      local: 'Local de Teste',
      cidade: 'São Paulo',
      data: '2025-12-31',
      hora: '20:00',
      categoria: 'social',
      organizador_id: testUserId
    })
    .select()
    .single()

  testEventId = event.id

  // Criar comunidade de teste
  const { data: community } = await supabaseAdmin
    .from('comunidades')
    .insert({
      nome: 'Comunidade Edge Case',
      descricao: 'Comunidade para testar edge cases',
      categoria: 'tecnologia',
      criador_id: testUserId,
      privada: false
    })
    .select()
    .single()

  testCommunityId = community.id
}

async function cleanupEdgeCaseData() {
  // Limpar dados de teste
  await supabaseAdmin.from('curtidas_evento').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('presencas').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('comentarios').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('membros_comunidade').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('eventos').delete().eq('organizador_id', testUserId)
  await supabaseAdmin.from('comunidades').delete().eq('criador_id', testUserId)
  await supabaseAdmin.from('usuarios').delete().eq('id', testUserId)
}