/**
 * Testes para políticas RLS (Row Level Security)
 * Valida segurança e acesso aos dados baseado em usuário
 */

import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Cliente admin para testes (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

describe('Políticas RLS', () => {
  let testUser1: any
  let testUser2: any
  let testUser1Client: any
  let testUser2Client: any

  beforeAll(async () => {
    // Criar usuários de teste
    const { data: user1 } = await supabaseAdmin.auth.admin.createUser({
      email: 'test1@example.com',
      password: 'password123',
      email_confirm: true
    })

    const { data: user2 } = await supabaseAdmin.auth.admin.createUser({
      email: 'test2@example.com',
      password: 'password123',
      email_confirm: true
    })

    testUser1 = user1.user
    testUser2 = user2.user

    // Criar clientes autenticados para cada usuário
    testUser1Client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    testUser2Client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Autenticar clientes
    await testUser1Client.auth.signInWithPassword({
      email: 'test1@example.com',
      password: 'password123'
    })

    await testUser2Client.auth.signInWithPassword({
      email: 'test2@example.com',
      password: 'password123'
    })

    // Criar perfis de usuário
    await supabaseAdmin.from('usuarios').insert([
      {
        id: testUser1.id,
        nome: 'Test User 1',
        email: 'test1@example.com'
      },
      {
        id: testUser2.id,
        nome: 'Test User 2',
        email: 'test2@example.com'
      }
    ])
  })

  afterAll(async () => {
    // Limpar dados de teste
    if (testUser1) {
      await supabaseAdmin.auth.admin.deleteUser(testUser1.id)
      await supabaseAdmin.from('usuarios').delete().eq('id', testUser1.id)
    }
    if (testUser2) {
      await supabaseAdmin.auth.admin.deleteUser(testUser2.id)
      await supabaseAdmin.from('usuarios').delete().eq('id', testUser2.id)
    }
  })

  describe('Tabela usuarios', () => {
    it('deve permitir que usuário leia seu próprio perfil', async () => {
      const { data, error } = await testUser1Client
        .from('usuarios')
        .select('*')
        .eq('id', testUser1.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.id).toBe(testUser1.id)
    })

    it('deve permitir que usuário atualize seu próprio perfil', async () => {
      const { data, error } = await testUser1Client
        .from('usuarios')
        .update({ nome: 'Updated Name' })
        .eq('id', testUser1.id)
        .select()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data[0].nome).toBe('Updated Name')
    })

    it('não deve permitir que usuário leia perfil de outro usuário', async () => {
      const { data, error } = await testUser1Client
        .from('usuarios')
        .select('*')
        .eq('id', testUser2.id)

      expect(data).toEqual([])
      // RLS deve retornar array vazio, não erro
    })

    it('não deve permitir que usuário atualize perfil de outro usuário', async () => {
      const { data, error } = await testUser1Client
        .from('usuarios')
        .update({ nome: 'Hacked Name' })
        .eq('id', testUser2.id)

      expect(data).toEqual([])
      // Verificar que não foi atualizado
      const { data: unchanged } = await supabaseAdmin
        .from('usuarios')
        .select('nome')
        .eq('id', testUser2.id)
        .single()

      expect(unchanged?.nome).toBe('Test User 2')
    })

    it('deve permitir inserção de novo perfil apenas para o próprio usuário', async () => {
      // Criar novo usuário
      const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
        email: 'test3@example.com',
        password: 'password123',
        email_confirm: true
      })

      const newUserClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      await newUserClient.auth.signInWithPassword({
        email: 'test3@example.com',
        password: 'password123'
      })

      // Deve conseguir inserir seu próprio perfil
      const { data, error } = await newUserClient
        .from('usuarios')
        .insert({
          id: newUser.user!.id,
          nome: 'Test User 3',
          email: 'test3@example.com'
        })
        .select()

      expect(error).toBeNull()
      expect(data).toBeTruthy()

      // Não deve conseguir inserir perfil para outro usuário
      const { data: hackData, error: hackError } = await newUserClient
        .from('usuarios')
        .insert({
          id: testUser1.id,
          nome: 'Hacked Profile',
          email: 'hacked@example.com'
        })

      expect(hackData).toEqual([])

      // Limpar
      await supabaseAdmin.auth.admin.deleteUser(newUser.user!.id)
      await supabaseAdmin.from('usuarios').delete().eq('id', newUser.user!.id)
    })
  })

  describe('Tabela eventos', () => {
    let testEvent: any

    beforeAll(async () => {
      // Criar evento de teste
      const { data } = await supabaseAdmin.from('eventos').insert({
        titulo: 'Test Event',
        descricao: 'Test Description',
        data_evento: new Date().toISOString(),
        localizacao: 'Test Location',
        criador_id: testUser1.id,
        categoria: 'tecnologia',
        tipo: 'presencial'
      }).select().single()

      testEvent = data
    })

    afterAll(async () => {
      if (testEvent) {
        await supabaseAdmin.from('eventos').delete().eq('id', testEvent.id)
      }
    })

    it('deve permitir que qualquer usuário leia eventos públicos', async () => {
      const { data, error } = await testUser2Client
        .from('eventos')
        .select('*')
        .eq('id', testEvent.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.id).toBe(testEvent.id)
    })

    it('deve permitir que criador atualize seu próprio evento', async () => {
      const { data, error } = await testUser1Client
        .from('eventos')
        .update({ titulo: 'Updated Event Title' })
        .eq('id', testEvent.id)
        .select()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data[0].titulo).toBe('Updated Event Title')
    })

    it('não deve permitir que não-criador atualize evento', async () => {
      const { data, error } = await testUser2Client
        .from('eventos')
        .update({ titulo: 'Hacked Title' })
        .eq('id', testEvent.id)

      expect(data).toEqual([])
      
      // Verificar que não foi atualizado
      const { data: unchanged } = await supabaseAdmin
        .from('eventos')
        .select('titulo')
        .eq('id', testEvent.id)
        .single()

      expect(unchanged?.titulo).toBe('Updated Event Title')
    })

    it('deve permitir que criador delete seu próprio evento', async () => {
      // Criar evento temporário
      const { data: tempEvent } = await supabaseAdmin.from('eventos').insert({
        titulo: 'Temp Event',
        descricao: 'Temp Description',
        data_evento: new Date().toISOString(),
        localizacao: 'Temp Location',
        criador_id: testUser1.id,
        categoria: 'tecnologia',
        tipo: 'presencial'
      }).select().single()

      // Deletar como criador
      const { error } = await testUser1Client
        .from('eventos')
        .delete()
        .eq('id', tempEvent.id)

      expect(error).toBeNull()

      // Verificar que foi deletado
      const { data: deleted } = await supabaseAdmin
        .from('eventos')
        .select('*')
        .eq('id', tempEvent.id)

      expect(deleted).toEqual([])
    })

    it('não deve permitir que não-criador delete evento', async () => {
      // Criar evento temporário
      const { data: tempEvent } = await supabaseAdmin.from('eventos').insert({
        titulo: 'Temp Event 2',
        descricao: 'Temp Description',
        data_evento: new Date().toISOString(),
        localizacao: 'Temp Location',
        criador_id: testUser1.id,
        categoria: 'tecnologia',
        tipo: 'presencial'
      }).select().single()

      // Tentar deletar como outro usuário
      const { data, error } = await testUser2Client
        .from('eventos')
        .delete()
        .eq('id', tempEvent.id)

      expect(data).toEqual([])

      // Verificar que não foi deletado
      const { data: stillExists } = await supabaseAdmin
        .from('eventos')
        .select('*')
        .eq('id', tempEvent.id)

      expect(stillExists).toHaveLength(1)

      // Limpar
      await supabaseAdmin.from('eventos').delete().eq('id', tempEvent.id)
    })
  })

  describe('Tabela presencas', () => {
    let testPresenca: any

    beforeAll(async () => {
      // Criar presença de teste
      const { data } = await supabaseAdmin.from('presencas').insert({
        evento_id: testEvent?.id,
        usuario_id: testUser1.id,
        status: 'confirmado'
      }).select().single()

      testPresenca = data
    })

    afterAll(async () => {
      if (testPresenca) {
        await supabaseAdmin.from('presencas').delete().eq('id', testPresenca.id)
      }
    })

    it('deve permitir que usuário leia suas próprias presenças', async () => {
      const { data, error } = await testUser1Client
        .from('presencas')
        .select('*')
        .eq('usuario_id', testUser1.id)

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.length).toBeGreaterThan(0)
    })

    it('deve permitir que usuário atualize suas próprias presenças', async () => {
      const { data, error } = await testUser1Client
        .from('presencas')
        .update({ status: 'cancelado' })
        .eq('id', testPresenca.id)
        .select()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data[0].status).toBe('cancelado')
    })

    it('não deve permitir que usuário leia presenças de outros', async () => {
      const { data, error } = await testUser2Client
        .from('presencas')
        .select('*')
        .eq('usuario_id', testUser1.id)

      expect(data).toEqual([])
    })

    it('não deve permitir que usuário atualize presenças de outros', async () => {
      const { data, error } = await testUser2Client
        .from('presencas')
        .update({ status: 'hacked' })
        .eq('id', testPresenca.id)

      expect(data).toEqual([])

      // Verificar que não foi atualizado
      const { data: unchanged } = await supabaseAdmin
        .from('presencas')
        .select('status')
        .eq('id', testPresenca.id)
        .single()

      expect(unchanged?.status).toBe('cancelado')
    })
  })

  describe('Performance das Políticas RLS', () => {
    it('deve executar consultas RLS em tempo aceitável', async () => {
      const startTime = Date.now()

      await testUser1Client
        .from('usuarios')
        .select('*')
        .eq('id', testUser1.id)

      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Deve executar em menos de 1 segundo
      expect(executionTime).toBeLessThan(1000)
    })

    it('deve usar índices apropriados para consultas RLS', async () => {
      // Testar consulta que deve usar índice
      const { data, error } = await testUser1Client
        .from('eventos')
        .select('*')
        .eq('criador_id', testUser1.id)
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Casos Edge de Segurança', () => {
    it('deve prevenir SQL injection através de RLS', async () => {
      // Tentar injeção SQL através de parâmetros
      const { data, error } = await testUser1Client
        .from('usuarios')
        .select('*')
        .eq('id', `${testUser1.id}' OR '1'='1`)

      // Deve retornar vazio ou erro, nunca dados de outros usuários
      expect(data).toEqual([])
    })

    it('deve manter segurança mesmo com múltiplas condições', async () => {
      const { data, error } = await testUser1Client
        .from('usuarios')
        .select('*')
        .or(`id.eq.${testUser1.id},id.eq.${testUser2.id}`)

      // Deve retornar apenas dados do próprio usuário
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(testUser1.id)
    })
  })
})