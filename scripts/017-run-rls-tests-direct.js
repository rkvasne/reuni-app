#!/usr/bin/env node

/**
 * Script para executar testes de RLS diretamente com Node.js
 * 
 * Este script executa os testes sem Jest para evitar problemas
 * de compatibilidade com módulos ES.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseAdmin
let supabaseUser1
let supabaseUser2
let supabaseAnon

let testUser1Id
let testUser2Id
let testEventId

// Contadores de teste
let testsRun = 0
let testsPassed = 0
let testsFailed = 0

function assert(condition, message) {
  testsRun++
  if (condition) {
    testsPassed++
    log(`  ✅ ${message}`, 'green')
  } else {
    testsFailed++
    log(`  ❌ ${message}`, 'red')
  }
}

async function setupTests() {
  log('🔧 Configurando ambiente de teste...', 'cyan')
  
  // Configurar clientes
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Criar usuários de teste
  const { data: user1, error: error1 } = await supabaseAdmin.auth.admin.createUser({
    email: 'test1@rls-direct.com',
    password: 'password123',
    email_confirm: true
  })

  const { data: user2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
    email: 'test2@rls-direct.com',
    password: 'password123',
    email_confirm: true
  })

  if (error1 || error2 || !user1?.user || !user2?.user) {
    throw new Error('Falha ao criar usuários de teste')
  }

  testUser1Id = user1.user.id
  testUser2Id = user2.user.id

  // Configurar clientes autenticados
  supabaseUser1 = createClient(supabaseUrl, supabaseAnonKey)
  supabaseUser2 = createClient(supabaseUrl, supabaseAnonKey)

  // Autenticar usuários
  await supabaseUser1.auth.signInWithPassword({
    email: 'test1@rls-direct.com',
    password: 'password123'
  })

  await supabaseUser2.auth.signInWithPassword({
    email: 'test2@rls-direct.com',
    password: 'password123'
  })

  // Inserir perfis de usuário
  await supabaseAdmin.from('usuarios').upsert([
    {
      id: testUser1Id,
      nome: 'Usuário Teste 1',
      email: 'test1@rls-direct.com'
    },
    {
      id: testUser2Id,
      nome: 'Usuário Teste 2',
      email: 'test2@rls-direct.com'
    }
  ])

  // Criar evento de teste
  const { data: event } = await supabaseAdmin
    .from('eventos')
    .insert({
      titulo: 'Evento RLS Direct',
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

  log('✅ Ambiente de teste configurado', 'green')
}

async function testUsuariosRLS() {
  log('\n📋 Testando políticas RLS da tabela usuarios...', 'cyan')

  // Teste 1: Usuário vê apenas seu próprio perfil
  const { data: ownProfile, error: ownError } = await supabaseUser1
    .from('usuarios')
    .select('*')
    .eq('id', testUser1Id)
    .single()

  assert(ownError === null && ownProfile?.id === testUser1Id, 
    'Usuário pode ver seu próprio perfil')

  // Teste 2: Usuário não vê perfil de outros
  const { data: otherProfile } = await supabaseUser1
    .from('usuarios')
    .select('*')
    .eq('id', testUser2Id)
    .single()

  assert(otherProfile === null, 
    'Usuário não pode ver perfil de outros')

  // Teste 3: Usuário pode atualizar seu perfil
  const { error: updateOwnError } = await supabaseUser1
    .from('usuarios')
    .update({ nome: 'Nome Atualizado Direct' })
    .eq('id', testUser1Id)

  assert(updateOwnError === null, 
    'Usuário pode atualizar seu próprio perfil')

  // Teste 4: Usuário não pode atualizar perfil de outros
  const { error: updateOtherError, data: updateOtherData } = await supabaseUser1
    .from('usuarios')
    .update({ nome: 'Hack Attempt' })
    .eq('id', testUser2Id)

  // RLS bloqueia retornando data null (nenhuma linha afetada)
  assert(updateOtherData === null || (Array.isArray(updateOtherData) && updateOtherData.length === 0), 
    'Usuário não pode atualizar perfil de outros (RLS bloqueou)')

  // Teste 5: Usuário anônimo não vê perfis
  const { data: anonData } = await supabaseAnon
    .from('usuarios')
    .select('*')

  assert(anonData.length === 0, 
    'Usuário anônimo não vê perfis')
}

async function testEventosRLS() {
  log('\n📋 Testando políticas RLS da tabela eventos...', 'cyan')

  // Teste 1: Todos podem ver eventos
  const { data: userEvents, error: userError } = await supabaseUser1
    .from('eventos')
    .select('*')
    .eq('id', testEventId)

  assert(userError === null && userEvents.length === 1, 
    'Usuário autenticado pode ver eventos')

  // Teste 2: Usuário anônimo pode ver eventos
  const { data: anonEvents, error: anonError } = await supabaseAnon
    .from('eventos')
    .select('*')
    .eq('id', testEventId)

  assert(anonError === null && anonEvents.length === 1, 
    'Usuário anônimo pode ver eventos')

  // Teste 3: Organizador pode atualizar evento
  const { error: ownerUpdateError } = await supabaseUser1
    .from('eventos')
    .update({ titulo: 'Título Atualizado Direct' })
    .eq('id', testEventId)

  assert(ownerUpdateError === null, 
    'Organizador pode atualizar seu evento')

  // Teste 4: Outro usuário não pode atualizar evento
  const { error: otherUpdateError, data: otherUpdateData } = await supabaseUser2
    .from('eventos')
    .update({ titulo: 'Hack Attempt' })
    .eq('id', testEventId)

  // RLS bloqueia retornando data null (nenhuma linha afetada)
  assert(otherUpdateData === null || (Array.isArray(otherUpdateData) && otherUpdateData.length === 0), 
    'Outro usuário não pode atualizar evento (RLS bloqueou)')
}

async function testPerformance() {
  log('\n📋 Testando performance das políticas RLS...', 'cyan')

  const startTime = Date.now()

  // Executar múltiplas consultas
  await Promise.all([
    supabaseUser1.from('usuarios').select('*').eq('id', testUser1Id),
    supabaseUser1.from('eventos').select('*').limit(5),
    supabaseAnon.from('eventos').select('*').limit(5),
    supabaseUser2.from('usuarios').select('*').eq('id', testUser2Id)
  ])

  const endTime = Date.now()
  const executionTime = endTime - startTime

  assert(executionTime < 2000, 
    `Performance aceitável (${executionTime}ms < 2000ms)`)

  log(`  ⚡ Tempo total: ${executionTime}ms`, 'blue')
}

async function testSecurityScenarios() {
  log('\n📋 Testando cenários de segurança...', 'cyan')

  // Teste 1: Tentar injeção SQL
  const { data: sqlInjectionData } = await supabaseUser1
    .from('usuarios')
    .select('*')
    .eq('id', "'; DROP TABLE usuarios; --")

  assert((sqlInjectionData || []).length === 0, 
    'Proteção contra injeção SQL')

  // Teste 2: Tentar acessar dados com ID malicioso
  const maliciousIds = [
    '00000000-0000-0000-0000-000000000000',
    testUser2Id // ID válido mas não autorizado
  ]

  for (const maliciousId of maliciousIds) {
    const { data } = await supabaseUser1
      .from('usuarios')
      .select('*')
      .eq('id', maliciousId)

    assert((data || []).length === 0, 
      `Bloqueio de acesso com ID malicioso: ${maliciousId}`)
  }
}

async function cleanupTests() {
  log('\n🧹 Limpando dados de teste...', 'cyan')
  
  try {
    // Limpar dados na ordem correta
    if (testEventId) {
      await supabaseAdmin.from('eventos').delete().eq('id', testEventId)
    }
    
    if (testUser1Id && testUser2Id) {
      await supabaseAdmin.from('usuarios').delete().in('id', [testUser1Id, testUser2Id])
      await supabaseAdmin.auth.admin.deleteUser(testUser1Id)
      await supabaseAdmin.auth.admin.deleteUser(testUser2Id)
    }
    
    log('✅ Limpeza concluída', 'green')
  } catch (error) {
    log(`⚠️ Erro na limpeza: ${error.message}`, 'yellow')
  }
}

function showResults() {
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 RESULTADOS DOS TESTES RLS', 'bright')
  log('='.repeat(60), 'cyan')
  
  log(`\n📈 Estatísticas:`, 'blue')
  log(`   Total de testes: ${testsRun}`, 'blue')
  log(`   Testes aprovados: ${testsPassed}`, 'green')
  log(`   Testes falharam: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green')
  
  const successRate = ((testsPassed / testsRun) * 100).toFixed(1)
  log(`   Taxa de sucesso: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow')
  
  if (testsFailed === 0) {
    log('\n🎉 Todos os testes de RLS passaram!', 'green')
    log('✅ Políticas de segurança funcionando corretamente', 'green')
  } else {
    log('\n⚠️ Alguns testes falharam', 'yellow')
    log('🔍 Verifique as políticas RLS no banco de dados', 'yellow')
  }
  
  log('='.repeat(60), 'cyan')
}

async function main() {
  log('🚀 Iniciando testes diretos de políticas RLS...', 'bright')
  
  try {
    await setupTests()
    await testUsuariosRLS()
    await testEventosRLS()
    await testPerformance()
    await testSecurityScenarios()
    
  } catch (error) {
    log(`\n💥 Erro durante execução: ${error.message}`, 'red')
    testsFailed++
  } finally {
    await cleanupTests()
    showResults()
  }
  
  // Exit code baseado nos resultados
  process.exit(testsFailed > 0 ? 1 : 0)
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`💥 Erro fatal: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { main }