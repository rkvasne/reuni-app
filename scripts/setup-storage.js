#!/usr/bin/env node

/**
 * Script para configurar buckets de storage no Supabase
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.error('Crie um arquivo .env.local com:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY (chave de serviço, não a anônima)')
  process.exit(1)
}

// Usar a chave de serviço para ter permissões de admin
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('🗂️  Configurando buckets de storage...\n')

  try {
    // Listar buckets existentes
    console.log('1. Verificando buckets existentes...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message)
      return
    }

    console.log('✅ Buckets existentes:', buckets.map(b => b.name))

    // Configurar bucket de avatars
    const avatarBucketName = 'avatars'
    const avatarBucketExists = buckets.find(b => b.name === avatarBucketName)

    if (!avatarBucketExists) {
      console.log(`\n2. Criando bucket '${avatarBucketName}'...`)
      const { data: avatarBucket, error: avatarError } = await supabase.storage.createBucket(avatarBucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (avatarError) {
        console.error('❌ Erro ao criar bucket de avatars:', avatarError.message)
      } else {
        console.log('✅ Bucket de avatars criado com sucesso!')
      }
    } else {
      console.log(`\n2. Bucket '${avatarBucketName}' já existe`)
    }

    // Configurar bucket de imagens gerais
    const imagesBucketName = 'images'
    const imagesBucketExists = buckets.find(b => b.name === imagesBucketName)

    if (!imagesBucketExists) {
      console.log(`\n3. Criando bucket '${imagesBucketName}'...`)
      const { data: imagesBucket, error: imagesError } = await supabase.storage.createBucket(imagesBucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      })

      if (imagesError) {
        console.error('❌ Erro ao criar bucket de imagens:', imagesError.message)
      } else {
        console.log('✅ Bucket de imagens criado com sucesso!')
      }
    } else {
      console.log(`\n3. Bucket '${imagesBucketName}' já existe`)
    }

    // Verificar políticas de acesso
    console.log('\n4. Verificando políticas de acesso...')
    
    // Para o bucket de avatars
    const { data: avatarPolicies, error: avatarPoliciesError } = await supabase.storage.getBucket(avatarBucketName)
    
    if (avatarPoliciesError) {
      console.error('❌ Erro ao verificar políticas do bucket avatars:', avatarPoliciesError.message)
    } else {
      console.log('✅ Políticas do bucket avatars:', avatarPolicies)
    }

    console.log('\n🏁 Configuração de storage concluída!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Configure as políticas RLS no painel do Supabase se necessário')
    console.log('2. Teste o upload de imagens na aplicação')
    console.log('3. Verifique se as URLs públicas estão funcionando')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar configuração
setupStorage().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
}) 