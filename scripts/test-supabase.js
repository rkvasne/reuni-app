#!/usr/bin/env node

/**
 * Script para testar conectividade com Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testando conectividade com Supabase...\n');

// Verificar variáveis de ambiente
console.log('📋 Configuração:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NÃO DEFINIDA'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.log('💡 Verifique se o arquivo .env.local existe e contém:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=sua_url');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔄 Testando conexão básica...');
    
    // Teste 1: Verificar se o serviço está online
    const response = await fetch(supabaseUrl);
    console.log(`✅ Serviço online - Status: ${response.status}`);
    
    // Teste 2: Testar autenticação
    console.log('🔄 Testando autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️ Sem sessão ativa (normal para usuário anônimo)');
    } else {
      console.log('✅ Autenticação funcionando');
    }
    
    // Teste 3: Testar acesso às tabelas
    console.log('🔄 Testando acesso às tabelas...');
    
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('count')
      .limit(1);
    
    if (eventosError) {
      console.error('❌ Erro ao acessar tabela eventos:', eventosError.message);
      
      // Verificar se é problema de RLS
      if (eventosError.message.includes('RLS') || eventosError.message.includes('policy')) {
        console.log('💡 Possível problema de RLS (Row Level Security)');
        console.log('   Verifique as políticas de segurança no Supabase Dashboard');
      }
      
      // Verificar se é problema de rede
      if (eventosError.message.includes('timeout') || eventosError.message.includes('connect')) {
        console.log('💡 Possível problema de conectividade');
        console.log('   - Verifique sua conexão com a internet');
        console.log('   - Verifique se o projeto Supabase está ativo');
      }
      
    } else {
      console.log('✅ Acesso à tabela eventos funcionando');
      console.log(`📊 Dados encontrados: ${JSON.stringify(eventos)}`);
    }
    
    // Teste 4: Verificar status do projeto
    console.log('🔄 Verificando status do projeto...');
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`);
    console.log(`📡 API REST Status: ${healthCheck.status}`);
    
    if (healthCheck.status === 503) {
      console.error('❌ Serviço indisponível (503)');
      console.log('💡 Possíveis causas:');
      console.log('   - Projeto Supabase pausado por inatividade');
      console.log('   - Manutenção do Supabase');
      console.log('   - Limite de uso excedido');
      console.log('   - Problema temporário do servidor');
      console.log('\n🔧 Soluções:');
      console.log('   1. Acesse o Supabase Dashboard');
      console.log('   2. Verifique se o projeto está ativo');
      console.log('   3. Reative o projeto se necessário');
      console.log('   4. Aguarde alguns minutos e tente novamente');
    }
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Erro de DNS - verifique sua conexão com a internet');
    }
    
    if (error.message.includes('timeout')) {
      console.log('💡 Timeout - o servidor pode estar sobrecarregado');
    }
  }
}

// Executar testes
testConnection().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('\n💥 Erro durante o teste:', error);
});