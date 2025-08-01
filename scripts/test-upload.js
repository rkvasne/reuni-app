#!/usr/bin/env node

/**
 * Script para testar upload de imagens no Supabase Storage
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

async function testUpload() {
  console.log('🧪 Testando upload de imagens...\n')

  try {
    // 1. Verificar buckets existentes
    console.log('1. Verificando buckets existentes...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message)
      console.log('💡 Isso pode acontecer se você não tiver permissões de admin')
      console.log('   Vamos tentar usar o bucket padrão "images"...')
    } else {
      console.log('✅ Buckets encontrados:', buckets.map(b => b.name))
    }

    // 2. Testar upload para bucket "images" (padrão)
    console.log('\n2. Testando upload para bucket "images"...')
    
    // Criar um arquivo de teste simples
    const testContent = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM2OWVmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3Q8L3RleHQ+PC9zdmc+'
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload('test-upload.svg', testContent, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError.message)
      console.log('💡 Isso pode acontecer se:')
      console.log('   - O bucket não existe')
      console.log('   - Você não tem permissões de upload')
      console.log('   - As políticas RLS estão bloqueando')
    } else {
      console.log('✅ Upload realizado com sucesso!')
      console.log('   Arquivo:', uploadData.path)
      
      // 3. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(uploadData.path)
      
      console.log('   URL pública:', publicUrl)
    }

    // 4. Testar bucket "avatars" se existir
    console.log('\n3. Testando bucket "avatars"...')
    const { data: avatarUpload, error: avatarError } = await supabase.storage
      .from('avatars')
      .upload('test-avatar.svg', testContent, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: true
      })

    if (avatarError) {
      console.log('ℹ️  Bucket "avatars" não disponível ou sem permissões')
      console.log('   Erro:', avatarError.message)
    } else {
      console.log('✅ Upload para avatars realizado com sucesso!')
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarUpload.path)
      console.log('   URL pública:', publicUrl)
    }

    console.log('\n🏁 Teste concluído!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Se os uploads falharam, configure os buckets no painel do Supabase')
    console.log('2. Configure as políticas RLS para permitir uploads')
    console.log('3. Teste o upload na aplicação')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testUpload().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
}) 