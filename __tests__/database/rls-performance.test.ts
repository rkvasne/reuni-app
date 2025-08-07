/**
 * Testes de Performance para Políticas RLS
 * 
 * Este arquivo testa a performance das políticas RLS para garantir
 * que não há degradação significativa de performance.
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
let testEventIds: string[] = []
let testCommunityIds: string[] = []

// Métricas de performance
interface PerformanceMetrics {
  averageTime: number
  minTime: number
  maxTime: number
  totalQueries: number
}

describe('Performance das Políticas RLS', () => {
  beforeAll(async () => {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Criar usuário de teste
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'performance@example.com',
      password: 'password123',
      email_confirm: true
    })

    if (error || !user?.user) {
      throw new Error('Falha ao criar usuário de teste')
    }

    testUserId = user.user.id

    supabaseUser = createClient(supabaseUrl, supabaseAnonKey)
    await supabaseUser.auth.signInWithPassword({
      email: 'performance@example.com',
      password: 'password123'
    })

    await setupPerformanceData()
  })

  afterAll(async () => {
    await cleanupPerformanceData()
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId)
    }
  })

  describe('Performance de Consultas Básicas', () => {
    it('deve executar SELECT em usuarios com RLS em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('usuarios')
          .select('*')
          .eq('id', testUserId),
        10
      )

      expect(metrics.averageTime).toBeLessThan(100) // < 100ms
      expect(metrics.maxTime).toBeLessThan(200) // < 200ms
      
      console.log('📊 Performance usuarios SELECT:', metrics)
    })

    it('deve executar SELECT em eventos com RLS em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('eventos')
          .select('*')
          .limit(20),
        10
      )

      expect(metrics.averageTime).toBeLessThan(150) // < 150ms
      expect(metrics.maxTime).toBeLessThan(300) // < 300ms
      
      console.log('📊 Performance eventos SELECT:', metrics)
    })

    it('deve executar INSERT com RLS em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => {
          await supabaseUser
            .from('curtidas_evento')
            .insert({
              evento_id: testEventIds[0],
              usuario_id: testUserId
            })
          
          await supabaseUser
            .from('curtidas_evento')
            .delete()
            .eq('evento_id', testEventIds[0])
            .eq('usuario_id', testUserId)
        },
        5
      )

      expect(metrics.averageTime).toBeLessThan(200) // < 200ms
      
      console.log('📊 Performance INSERT/DELETE:', metrics)
    })
  })

  describe('Performance de Consultas Complexas', () => {
    it('deve executar JOINs com RLS em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('eventos')
          .select(`
            *,
            presencas(count),
            comentarios(count)
          `)
          .limit(10),
        5
      )

      expect(metrics.averageTime).toBeLessThan(500) // < 500ms
      expect(metrics.maxTime).toBeLessThan(1000) // < 1s
      
      console.log('📊 Performance JOINs complexos:', metrics)
    })

    it('deve executar consultas com filtros múltiplos em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('eventos')
          .select('*')
          .eq('categoria', 'social')
          .eq('cidade', 'São Paulo')
          .gte('data', '2025-01-01')
          .limit(10),
        10
      )

      expect(metrics.averageTime).toBeLessThan(200) // < 200ms
      
      console.log('📊 Performance filtros múltiplos:', metrics)
    })

    it('deve executar busca full-text com RLS em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('eventos')
          .select('*')
          .textSearch('titulo', 'evento')
          .limit(10),
        5
      )

      expect(metrics.averageTime).toBeLessThan(300) // < 300ms
      
      console.log('📊 Performance busca full-text:', metrics)
    })
  })

  describe('Performance de Consultas de Comunidades', () => {
    it('deve executar consultas de membros com RLS em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('membros_comunidade')
          .select(`
            *,
            comunidade:comunidades(*),
            usuario:usuarios(nome, avatar)
          `)
          .limit(10),
        5
      )

      expect(metrics.averageTime).toBeLessThan(400) // < 400ms
      
      console.log('📊 Performance membros comunidade:', metrics)
    })

    it('deve executar consultas de posts com RLS em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('posts_comunidade')
          .select(`
            *,
            usuario:usuarios(nome, avatar)
          `)
          .eq('comunidade_id', testCommunityIds[0])
          .limit(10),
        5
      )

      expect(metrics.averageTime).toBeLessThan(300) // < 300ms
      
      console.log('📊 Performance posts comunidade:', metrics)
    })
  })

  describe('Performance sob Carga', () => {
    it('deve manter performance com múltiplas consultas simultâneas', async () => {
      const startTime = Date.now()

      // 20 consultas simultâneas
      const promises = Array.from({ length: 20 }, async (_, i) => {
        const result = await supabaseUser
          .from('eventos')
          .select('*')
          .limit(5)
        return { index: i, time: Date.now() - startTime, result }
      })

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Todas as consultas devem completar em menos de 3 segundos
      expect(totalTime).toBeLessThan(3000)
      
      // Nenhuma consulta individual deve demorar mais que 1 segundo
      results.forEach(({ time }) => {
        expect(time).toBeLessThan(1000)
      })

      console.log('📊 Performance carga simultânea:', {
        totalTime,
        averageTime: totalTime / results.length,
        queries: results.length
      })
    })

    it('deve manter performance com consultas sequenciais', async () => {
      const times: number[] = []

      // 30 consultas sequenciais
      for (let i = 0; i < 30; i++) {
        const startTime = Date.now()
        
        await supabaseUser
          .from('usuarios')
          .select('*')
          .eq('id', testUserId)
        
        const endTime = Date.now()
        times.push(endTime - startTime)
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)

      expect(averageTime).toBeLessThan(100) // < 100ms média
      expect(maxTime).toBeLessThan(300) // < 300ms máximo

      console.log('📊 Performance consultas sequenciais:', {
        averageTime,
        maxTime,
        minTime: Math.min(...times),
        queries: times.length
      })
    })
  })

  describe('Performance de Operações de Escrita', () => {
    it('deve executar INSERTs com triggers em tempo aceitável', async () => {
      const metrics = await measureQueryPerformance(
        async () => {
          // INSERT que dispara triggers de contador
          const { data } = await supabaseUser
            .from('presencas')
            .insert({
              evento_id: testEventIds[0],
              usuario_id: testUserId,
              status: 'confirmado'
            })
            .select()
            .single()

          // DELETE para limpar
          await supabaseUser
            .from('presencas')
            .delete()
            .eq('id', data.id)
        },
        5
      )

      expect(metrics.averageTime).toBeLessThan(300) // < 300ms
      
      console.log('📊 Performance INSERT com triggers:', metrics)
    })

    it('deve executar UPDATEs com triggers em tempo aceitável', async () => {
      // Criar presença para atualizar
      const { data: presenca } = await supabaseUser
        .from('presencas')
        .insert({
          evento_id: testEventIds[0],
          usuario_id: testUserId,
          status: 'interessado'
        })
        .select()
        .single()

      const metrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('presencas')
          .update({ status: 'confirmado' })
          .eq('id', presenca.id),
        5
      )

      expect(metrics.averageTime).toBeLessThan(250) // < 250ms

      // Limpar
      await supabaseUser
        .from('presencas')
        .delete()
        .eq('id', presenca.id)
      
      console.log('📊 Performance UPDATE com triggers:', metrics)
    })
  })

  describe('Comparação de Performance: Com vs Sem RLS', () => {
    it('deve comparar performance de consultas com e sem RLS', async () => {
      // Consulta com RLS (usuário autenticado)
      const withRLSMetrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('eventos')
          .select('*')
          .limit(10),
        10
      )

      // Consulta sem RLS (admin)
      const withoutRLSMetrics = await measureQueryPerformance(
        async () => await supabaseAdmin
          .from('eventos')
          .select('*')
          .limit(10),
        10
      )

      // RLS não deve adicionar mais que 50ms de overhead
      const overhead = withRLSMetrics.averageTime - withoutRLSMetrics.averageTime
      expect(overhead).toBeLessThan(50)

      console.log('📊 Comparação RLS vs Sem RLS:', {
        comRLS: withRLSMetrics.averageTime,
        semRLS: withoutRLSMetrics.averageTime,
        overhead
      })
    })
  })

  describe('Performance de Índices com RLS', () => {
    it('deve usar índices eficientemente com políticas RLS', async () => {
      // Consulta que deve usar índice
      const indexedMetrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('eventos')
          .select('*')
          .eq('organizador_id', testUserId), // Campo indexado
        10
      )

      // Consulta que pode não usar índice
      const nonIndexedMetrics = await measureQueryPerformance(
        async () => await supabaseUser
          .from('eventos')
          .select('*')
          .ilike('descricao', '%teste%'), // Campo não indexado
        5
      )

      // Consulta indexada deve ser mais rápida
      expect(indexedMetrics.averageTime).toBeLessThan(nonIndexedMetrics.averageTime)

      console.log('📊 Performance índices:', {
        indexada: indexedMetrics.averageTime,
        naoIndexada: nonIndexedMetrics.averageTime
      })
    })
  })
})

/**
 * Função auxiliar para medir performance de consultas
 */
async function measureQueryPerformance(
  queryFunction: () => any,
  iterations: number = 5
): Promise<PerformanceMetrics> {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now()
    
    try {
      await queryFunction()
    } catch (error) {
      // Ignorar erros para medir apenas tempo
    }
    
    const endTime = Date.now()
    times.push(endTime - startTime)
    
    // Pequena pausa entre consultas
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  return {
    averageTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    totalQueries: iterations
  }
}

/**
 * Configurar dados para testes de performance
 */
async function setupPerformanceData() {
  // Inserir perfil de usuário
  await supabaseAdmin.from('usuarios').upsert({
    id: testUserId,
    nome: 'Performance User',
    email: 'performance@example.com'
  })

  // Criar múltiplos eventos para testes
  const eventPromises = Array.from({ length: 20 }, (_, i) => 
    supabaseAdmin
      .from('eventos')
      .insert({
        titulo: `Evento Performance ${i + 1}`,
        descricao: `Descrição do evento ${i + 1} para testes de performance`,
        local: `Local ${i + 1}`,
        cidade: 'São Paulo',
        data: '2025-12-31',
        hora: '20:00',
        categoria: 'social',
        organizador_id: testUserId
      })
      .select('id')
      .single()
  )

  const events = await Promise.all(eventPromises)
  testEventIds = events.map(e => e.data?.id).filter(id => id !== undefined)

  // Criar múltiplas comunidades
  const communityPromises = Array.from({ length: 10 }, (_, i) => 
    supabaseAdmin
      .from('comunidades')
      .insert({
        nome: `Comunidade Performance ${i + 1}`,
        descricao: `Descrição da comunidade ${i + 1}`,
        categoria: 'tecnologia',
        criador_id: testUserId,
        privada: false
      })
      .select('id')
      .single()
  )

  const communities = await Promise.all(communityPromises)
  testCommunityIds = communities.map(c => c.data?.id).filter(id => id !== undefined)

  // Adicionar usuário como membro das comunidades
  const memberPromises = testCommunityIds.map(communityId => 
    supabaseAdmin
      .from('membros_comunidade')
      .insert({
        comunidade_id: communityId,
        usuario_id: testUserId,
        role: 'admin'
      })
  )

  await Promise.all(memberPromises)

  // Criar alguns posts para testes
  const postPromises = testCommunityIds.slice(0, 3).map(communityId => 
    supabaseAdmin
      .from('posts_comunidade')
      .insert({
        comunidade_id: communityId,
        usuario_id: testUserId,
        conteudo: `Post de teste na comunidade ${communityId}`
      })
  )

  await Promise.all(postPromises)

  // Criar algumas presenças e comentários
  const presencePromises = testEventIds.slice(0, 5).map(eventId => 
    supabaseAdmin
      .from('presencas')
      .insert({
        evento_id: eventId,
        usuario_id: testUserId,
        status: 'confirmado'
      })
  )

  const commentPromises = testEventIds.slice(0, 5).map(eventId => 
    supabaseAdmin
      .from('comentarios')
      .insert({
        evento_id: eventId,
        usuario_id: testUserId,
        conteudo: `Comentário no evento ${eventId}`
      })
  )

  await Promise.all([...presencePromises, ...commentPromises])
}

/**
 * Limpar dados de teste de performance
 */
async function cleanupPerformanceData() {
  // Limpar na ordem correta (foreign keys)
  await supabaseAdmin.from('comentarios').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('presencas').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('curtidas_evento').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('posts_comunidade').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('membros_comunidade').delete().eq('usuario_id', testUserId)
  await supabaseAdmin.from('eventos').delete().eq('organizador_id', testUserId)
  await supabaseAdmin.from('comunidades').delete().eq('criador_id', testUserId)
  await supabaseAdmin.from('usuarios').delete().eq('id', testUserId)
}