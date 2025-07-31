#!/usr/bin/env node

/**
 * Monitor de conectividade Supabase em tempo real
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let consecutiveErrors = 0;
let totalRequests = 0;
let successfulRequests = 0;

async function checkHealth() {
  const startTime = Date.now();
  totalRequests++;
  
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      throw error;
    }
    
    successfulRequests++;
    consecutiveErrors = 0;
    
    const successRate = ((successfulRequests / totalRequests) * 100).toFixed(1);
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`✅ ${timestamp} | OK | ${responseTime}ms | Taxa: ${successRate}% | Total: ${data[0]?.count || 0} eventos`);
    
    // Alerta se tempo de resposta alto
    if (responseTime > 5000) {
      console.log(`⚠️  Tempo de resposta alto: ${responseTime}ms`);
    }
    
  } catch (error) {
    consecutiveErrors++;
    const timestamp = new Date().toLocaleTimeString();
    const responseTime = Date.now() - startTime;
    
    console.error(`❌ ${timestamp} | ERRO | ${responseTime}ms | ${error.message}`);
    
    // Alerta para erros consecutivos
    if (consecutiveErrors >= 3) {
      console.log(`🚨 ALERTA: ${consecutiveErrors} erros consecutivos!`);
      
      if (error.message.includes('503')) {
        console.log('💡 Possível causa: Projeto Supabase pausado ou em manutenção');
      }
      
      if (error.message.includes('timeout')) {
        console.log('💡 Possível causa: Servidor sobrecarregado ou problema de rede');
      }
    }
  }
}

console.log('🔍 Iniciando monitoramento Supabase...');
console.log(`📡 URL: ${supabaseUrl}`);
console.log('⏱️  Verificando a cada 10 segundos...');
console.log('🛑 Pressione Ctrl+C para parar\n');

// Verificação inicial
checkHealth();

// Verificação periódica
const interval = setInterval(checkHealth, 10000);

// Estatísticas a cada minuto
const statsInterval = setInterval(() => {
  const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : '0.0';
  const errorRate = totalRequests > 0 ? (((totalRequests - successfulRequests) / totalRequests) * 100).toFixed(1) : '0.0';
  
  console.log(`\n📊 ESTATÍSTICAS (último minuto):`);
  console.log(`   Total de requisições: ${totalRequests}`);
  console.log(`   Sucessos: ${successfulRequests} (${successRate}%)`);
  console.log(`   Erros: ${totalRequests - successfulRequests} (${errorRate}%)`);
  console.log(`   Erros consecutivos: ${consecutiveErrors}\n`);
  
  // Reset das estatísticas
  totalRequests = 0;
  successfulRequests = 0;
}, 60000);

// Cleanup ao sair
process.on('SIGINT', () => {
  console.log('\n🛑 Parando monitoramento...');
  clearInterval(interval);
  clearInterval(statsInterval);
  
  const finalSuccessRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : '0.0';
  console.log(`\n📊 ESTATÍSTICAS FINAIS:`);
  console.log(`   Taxa de sucesso: ${finalSuccessRate}%`);
  console.log(`   Última verificação: ${new Date().toLocaleString()}`);
  
  process.exit(0);
});