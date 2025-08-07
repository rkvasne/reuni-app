/**
 * Testes de Políticas RLS (Row Level Security)
 * 
 * Este arquivo testa todas as políticas RLS implementadas no banco de dados
 * para garantir que a segurança está funcionando corretamente.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configuração de teste
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

// Clientes Supabase para diferentes cenários
let supabaseAdmin: SupabaseClient
let supabaseUser1: SupabaseClient
let supabaseUser2: SupabaseClient
let supabaseAnon: SupabaseClient

// IDs de teste
let testUser1Id: string
let testUser2Id: string
let testEventId: string
let testCommunityId: string
let testCommentId: string

describe('Políticas RLS - Testes de Segurança', () => {
  beforeAll(async () => {
    // Configurar clientes Supabase
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Criar usuários de teste
    const { data: user1, error: error1 } = await supabaseAdmin.auth.admin.createUser({
      email: 'test1@example.com',
      password: 'password123',
      email_confirm: true
    })

    const { data: user2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
      email: 'test2@example.com', 
      password: 'password123',
      email_confirm: true
    })

    if (error1 || error2 || !user1?.user || !user2?.user) {
      throw new Error('Falha ao criar usuários de teste')
    }

    testUser1Id = user1.user.id
    testUser2Id = user2.user.id

    // Inserir usuários na tabela usuarios (necessário para foreign keys)
    await supabaseAdmin.from('usuarios').insert([
      {
        id: testUser1Id,
        email: 'test1@example.com',
        nome: 'Test User 1'
      },
      {
        id: testUser2Id,
        email: 'test2@example.com',
        nome: 'Test User 2'
      }
    ])

    // Configurar clientes autenticados
    supabaseUser1 = createClient(supabaseUrl, supabaseAnonKey)
    supabaseUser2 = createClient(supabaseUrl, supabaseAnonKey)

    // Autenticar usuários
    await supabaseUser1.auth.signInWithPassword({
      email: 'test1@example.com',
      password: 'password123'
    })

    await supabaseUser2.auth.signInWithPassword({
      email: 'test2@example.com',
      password: 'password123'
    })

    // Criar dados de teste
    await setupTestData()
  })

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData()
    
    // Remover usuários de teste
    if (testUser1Id) {
      await supabaseAdmin.auth.admin.deleteUser(testUser1Id)
    }
    if (testUser2Id) {
      await supabaseAdmin.auth.admin.deleteUser(testUser2Id)
    }
  })

  describe('Tabela usuarios - Políticas RLS', () => {
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
      const { data: otherProfile, error: otherError } = await supabaseUser1
        .from('usuarios')
        .select('*')
        .eq('id', testUser2Id)
        .single()

      expect(otherProfile).toBeNull()
      // Supabase retorna erro quando não encontra dados devido ao RLS
    })

    it('deve permitir que usuário insira apenas seu próprio perfil', async () => {
      // Tentar inserir perfil com ID diferente deve falhar
      const { data, error } = await supabaseUser1
        .from('usuarios')
        .insert({
          id: testUser2Id, // ID diferente do usuário autenticado
          nome: 'Teste Inválido',
          email: 'invalido@test.com'
        })

      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })

    it('deve permitir que usuário atualize apenas seu próprio perfil', async () => {
      // Atualizar próprio perfil deve funcionar
      const { data: ownUpdate, error: ownError } = await supabaseUser1
        .from('usuarios')
        .update({ nome: 'Nome Atualizado' })
        .eq('id', testUser1Id)

      expect(ownError).toBeNull()

      // Tentar atualizar perfil de outro usuário deve falhar
      const { data: otherUpdate, error: otherError } = await supabaseUser1
        .from('usuarios')
        .update({ nome: 'Hack Attempt' })
        .eq('id', testUser2Id)

      expect(otherError).toBeTruthy()
    })

    it('deve bloquear acesso de usuários não autenticados', async () => {
      const { data, error } = await supabaseAnon
        .from('usuarios')
        .select('*')

      expect(data).toEqual([])
    })
  })

  describe('Tabela eventos - Políticas RLS', () => {
    it('deve permitir que todos vejam eventos públicos', async () => {
      // Usuário autenticado deve ver eventos
      const { data: userEvents, error: userError } = await supabaseUser1
        .from('eventos')
        .select('*')

      expect(userError).toBeNull()
      expect(Array.isArray(userEvents)).toBe(true)

      // Usuário anônimo também deve ver eventos
      const { data: anonEvents, error: anonError } = await supabaseAnon
        .from('eventos')
        .select('*')

      expect(anonError).toBeNull()
      expect(Array.isArray(anonEvents)).toBe(true)
    })

    it('deve permitir que apenas organizador crie eventos', async () => {
      const { data, error } = await supabaseUser1
        .from('eventos')
        .insert({
          titulo: 'Evento de Teste',
          descricao: 'Descrição do evento',
          local: 'Local de Teste',
          cidade: 'São Paulo',
          data: '2025-12-31',
          hora: '20:00',
          categoria: 'social',
          organizador_id: testUser1Id
        })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('deve permitir que apenas organizador atualize seus eventos', async () => {
      // Organizador pode atualizar
      const { data: ownerUpdate, error: ownerError } = await supabaseUser1
        .from('eventos')
        .update({ titulo: 'Título Atualizado' })
        .eq('id', testEventId)

      expect(ownerError).toBeNull()

      // Outro usuário não pode atualizar
      const { data: otherUpdate, error: otherError } = await supabaseUser2
        .from('eventos')
        .update({ titulo: 'Hack Attempt' })
        .eq('id', testEventId)

      expect(otherError).toBeTruthy()
    })

    it('deve permitir que apenas organizador delete seus eventos', async () => {
      // Criar evento para teste de deleção
      const { data: newEvent, error: createError } = await supabaseUser2
        .from('eventos')
        .insert({
          titulo: 'Evento para Deletar',
          descricao: 'Será deletado',
          local: 'Local',
          cidade: 'São Paulo',
          data: '2025-12-31',
          hora: '20:00',
          categoria: 'social',
          organizador_id: testUser2Id
        })
        .select()
        .single()

      expect(createError).toBeNull()
      const eventToDeleteId = newEvent.id

      // Outro usuário não pode deletar
      const { error: otherDeleteError } = await supabaseUser1
        .from('eventos')
        .delete()
        .eq('id', eventToDeleteId)

      expect(otherDeleteError).toBeTruthy()

      // Organizador pode deletar
      const { error: ownerDeleteError } = await supabaseUser2
        .from('eventos')
        .delete()
        .eq('id', eventToDeleteId)

      expect(ownerDeleteError).toBeNull()
    })
  })

  describe('Tabela presencas - Políticas RLS', () => {
    it('deve permitir que todos vejam presenças', async () => {
      const { data, error } = await supabaseUser1
        .from('presencas')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('deve permitir que usuário confirme apenas sua própria presença', async () => {
      // Confirmar própria presença deve funcionar
      const { data, error } = await supabaseUser1
        .from('presencas')
        .insert({
          evento_id: testEventId,
          usuario_id: testUser1Id,
          status: 'confirmado'
        })

      expect(error).toBeNull()

      // Tentar confirmar presença de outro usuário deve falhar
      const { data: hackData, error: hackError } = await supabaseUser1
        .from('presencas')
        .insert({
          evento_id: testEventId,
          usuario_id: testUser2Id, // ID diferente
          status: 'confirmado'
        })

      expect(hackError).toBeTruthy()
    })

    it('deve permitir que usuário atualize apenas sua própria presença', async () => {
      // Atualizar própria presença deve funcionar
      const { error: ownError } = await supabaseUser1
        .from('presencas')
        .update({ status: 'interessado' })
        .eq('evento_id', testEventId)
        .eq('usuario_id', testUser1Id)

      expect(ownError).toBeNull()

      // Tentar atualizar presença de outro usuário deve falhar
      const { error: otherError } = await supabaseUser1
        .from('presencas')
        .update({ status: 'cancelado' })
        .eq('usuario_id', testUser2Id)

      expect(otherError).toBeTruthy()
    })
  })

  describe('Tabela comentarios - Políticas RLS', () => {
    it('deve permitir que todos vejam comentários', async () => {
      const { data, error } = await supabaseAnon
        .from('comentarios')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('deve permitir que usuário crie comentários', async () => {
      const { data, error } = await supabaseUser1
        .from('comentarios')
        .insert({
          evento_id: testEventId,
          usuario_id: testUser1Id,
          conteudo: 'Comentário de teste'
        })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('deve permitir que usuário atualize apenas seus comentários', async () => {
      // Atualizar próprio comentário deve funcionar
      const { error: ownError } = await supabaseUser1
        .from('comentarios')
        .update({ conteudo: 'Comentário atualizado' })
        .eq('id', testCommentId)

      expect(ownError).toBeNull()

      // Tentar atualizar comentário de outro usuário deve falhar
      const { error: otherError } = await supabaseUser2
        .from('comentarios')
        .update({ conteudo: 'Hack attempt' })
        .eq('id', testCommentId)

      expect(otherError).toBeTruthy()
    })
  })

  describe('Tabela curtidas_evento - Políticas RLS', () => {
    it('deve permitir que todos vejam curtidas', async () => {
      const { data, error } = await supabaseAnon
        .from('curtidas_evento')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('deve permitir que usuário curta eventos', async () => {
      const { data, error } = await supabaseUser1
        .from('curtidas_evento')
        .insert({
          evento_id: testEventId,
          usuario_id: testUser1Id
        })

      expect(error).toBeNull()
    })

    it('deve permitir que usuário remova apenas suas próprias curtidas', async () => {
      // Remover própria curtida deve funcionar
      const { error: ownError } = await supabaseUser1
        .from('curtidas_evento')
        .delete()
        .eq('evento_id', testEventId)
        .eq('usuario_id', testUser1Id)

      expect(ownError).toBeNull()

      // Criar curtida do usuário 2 para testar
      await supabaseUser2
        .from('curtidas_evento')
        .insert({
          evento_id: testEventId,
          usuario_id: testUser2Id
        })

      // Tentar remover curtida de outro usuário deve falhar
      const { error: otherError } = await supabaseUser1
        .from('curtidas_evento')
        .delete()
        .eq('evento_id', testEventId)
        .eq('usuario_id', testUser2Id)

      expect(otherError).toBeTruthy()
    })
  })

  describe('Tabela comunidades - Políticas RLS', () => {
    it('deve permitir visualização de comunidades públicas', async () => {
      const { data, error } = await supabaseAnon
        .from('comunidades')
        .select('*')
        .eq('privada', false)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('deve permitir que usuário crie comunidades', async () => {
      const { data, error } = await supabaseUser1
        .from('comunidades')
        .insert({
          nome: 'Comunidade de Teste',
          descricao: 'Descrição da comunidade',
          categoria: 'tecnologia',
          criador_id: testUser1Id,
          privada: false
        })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('deve permitir que apenas criador/admin atualize comunidades', async () => {
      // Criador pode atualizar
      const { error: creatorError } = await supabaseUser1
        .from('comunidades')
        .update({ descricao: 'Descrição atualizada' })
        .eq('id', testCommunityId)

      expect(creatorError).toBeNull()

      // Outro usuário não pode atualizar
      const { error: otherError } = await supabaseUser2
        .from('comunidades')
        .update({ descricao: 'Hack attempt' })
        .eq('id', testCommunityId)

      expect(otherError).toBeTruthy()
    })
  })

  describe('Tabela membros_comunidade - Políticas RLS', () => {
    it('deve permitir que usuário se junte a comunidades', async () => {
      const { data, error } = await supabaseUser2
        .from('membros_comunidade')
        .insert({
          comunidade_id: testCommunityId,
          usuario_id: testUser2Id,
          role: 'member'
        })

      expect(error).toBeNull()
    })

    it('deve permitir visualização de membros para membros da comunidade', async () => {
      // Membro da comunidade deve ver outros membros
      const { data, error } = await supabaseUser1
        .from('membros_comunidade')
        .select('*')
        .eq('comunidade_id', testCommunityId)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('deve permitir que usuário saia da comunidade', async () => {
      const { error } = await supabaseUser2
        .from('membros_comunidade')
        .delete()
        .eq('comunidade_id', testCommunityId)
        .eq('usuario_id', testUser2Id)

      expect(error).toBeNull()
    })
  })

  describe('Tabela posts_comunidade - Políticas RLS', () => {
    it('deve permitir que apenas membros vejam posts da comunidade', async () => {
      // Membro deve ver posts
      const { data: memberData, error: memberError } = await supabaseUser1
        .from('posts_comunidade')
        .select('*')
        .eq('comunidade_id', testCommunityId)

      expect(memberError).toBeNull()
      expect(Array.isArray(memberData)).toBe(true)

      // Não-membro não deve ver posts
      const { data: nonMemberData, error: nonMemberError } = await supabaseUser2
        .from('posts_comunidade')
        .select('*')
        .eq('comunidade_id', testCommunityId)

      expect(nonMemberData).toEqual([])
    })

    it('deve permitir que apenas membros criem posts', async () => {
      // Membro pode criar post
      const { data: memberPost, error: memberError } = await supabaseUser1
        .from('posts_comunidade')
        .insert({
          comunidade_id: testCommunityId,
          usuario_id: testUser1Id,
          conteudo: 'Post de teste'
        })

      expect(memberError).toBeNull()

      // Não-membro não pode criar post
      const { data: nonMemberPost, error: nonMemberError } = await supabaseUser2
        .from('posts_comunidade')
        .insert({
          comunidade_id: testCommunityId,
          usuario_id: testUser2Id,
          conteudo: 'Post não autorizado'
        })

      expect(nonMemberError).toBeTruthy()
    })
  })

  describe('Performance das Políticas RLS', () => {
    it('deve executar consultas com RLS em tempo aceitável', async () => {
      const startTime = Date.now()

      // Executar várias consultas para testar performance
      await Promise.all([
        supabaseUser1.from('usuarios').select('*').eq('id', testUser1Id),
        supabaseUser1.from('eventos').select('*').limit(10),
        supabaseUser1.from('presencas').select('*').limit(10),
        supabaseUser1.from('comentarios').select('*').limit(10),
        supabaseUser1.from('comunidades').select('*').limit(10)
      ])

      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Políticas RLS devem executar em menos de 1 segundo
      expect(executionTime).toBeLessThan(1000)
    })
  })
})

/**
 * Função auxiliar para configurar dados de teste
 */
async function setupTestData() {
  // Inserir perfis de usuário
  await supabaseAdmin.from('usuarios').upsert([
    {
      id: testUser1Id,
      nome: 'Usuário Teste 1',
      email: 'test1@example.com'
    },
    {
      id: testUser2Id,
      nome: 'Usuário Teste 2', 
      email: 'test2@example.com'
    }
  ])

  // Criar evento de teste
  const { data: event } = await supabaseAdmin
    .from('eventos')
    .insert({
      titulo: 'Evento de Teste RLS',
      local: 'Local de Teste', // Este era 'descricao' antes da migração
      cidade: 'São Paulo',
      data: '2025-12-31', // Campo DATE separado
      hora: '20:00:00', // Campo TIME separado
      categoria: 'social',
      organizador_id: testUser1Id
    })
    .select()
    .single()

  testEventId = event.id

  // Criar comunidade de teste
  const { data: community } = await supabaseAdmin
    .from('comunidades')
    .insert({
      nome: 'Comunidade RLS Test',
      descricao: 'Comunidade para testar RLS',
      tipo: 'publica', // Campo obrigatório: 'publica', 'privada', 'restrita'
      categoria: 'tecnologia',
      criador_id: testUser1Id,
      privada: false
    })
    .select()
    .single()

  testCommunityId = community.id

  // Adicionar criador como admin da comunidade
  await supabaseAdmin
    .from('membros_comunidade')
    .insert({
      comunidade_id: testCommunityId,
      usuario_id: testUser1Id,
      role: 'admin'
    })

  // Criar comentário de teste
  const { data: comment } = await supabaseAdmin
    .from('comentarios')
    .insert({
      evento_id: testEventId,
      usuario_id: testUser1Id,
      conteudo: 'Comentário de teste RLS'
    })
    .select()
    .single()

  testCommentId = comment.id
}

/**
 * Função auxiliar para limpar dados de teste
 */
async function cleanupTestData() {
  // Remover dados de teste na ordem correta (respeitando foreign keys)
  await supabaseAdmin.from('comentarios_post_comunidade').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('posts_comunidade').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('curtidas_evento').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('comentarios').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('presencas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('membros_comunidade').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('eventos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('comunidades').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('usuarios').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}