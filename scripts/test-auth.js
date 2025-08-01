#!/usr/bin/env node

/**
 * Script para testar autenticação e sistema de perfil
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.error('Crie um arquivo .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('🔐 Testando autenticação...\n')

  try {
    // 1. Verificar sessão atual
    console.log('1. Verificando sessão atual...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message)
      return
    }

    if (session) {
      console.log('✅ Usuário autenticado:', session.user.email)
      console.log('   ID:', session.user.id)
      console.log('   Metadata:', session.user.user_metadata)
    } else {
      console.log('ℹ️  Nenhuma sessão ativa')
    }

    // 2. Testar busca de perfil
    if (session) {
      console.log('\n2. Testando busca de perfil...')
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message)
        console.log('   Código:', profileError.code)
        
        // Se usuário não existe, tentar criar
        if (profileError.code === 'PGRST116') {
          console.log('\n3. Tentando criar perfil...')
          const newUser = {
            id: session.user.id,
            nome: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url || undefined,
            bio: undefined
          }

          const { data: createdUser, error: createError } = await supabase
            .from('usuarios')
            .insert([newUser])
            .select('*')
            .single()

          if (createError) {
            console.error('❌ Erro ao criar perfil:', createError.message)
            console.error('   Código:', createError.code)
            console.error('   Detalhes:', createError.details)
            console.error('   Hint:', createError.hint)
          } else {
            console.log('✅ Perfil criado com sucesso:', createdUser)
          }
        }
      } else {
        console.log('✅ Perfil encontrado:', profile)
      }
    }

    // 3. Testar atualização de perfil
    if (session) {
      console.log('\n4. Testando atualização de perfil...')
      const updates = {
        nome: 'Teste de Atualização ' + new Date().toISOString().slice(0, 19)
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', session.user.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError.message)
        console.error('   Código:', updateError.code)
        console.error('   Detalhes:', updateError.details)
        console.error('   Hint:', updateError.hint)
      } else {
        console.log('✅ Perfil atualizado com sucesso:', updatedProfile)
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testAuth().then(() => {
  console.log('\n🏁 Teste concluído!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
}) 