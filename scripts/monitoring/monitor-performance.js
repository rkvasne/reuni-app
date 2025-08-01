#!/usr/bin/env node

/**
 * Monitor de performance para requisições
 * Detecta gargalos e requisições excessivas
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

// Estatísticas
let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  slowRequests: 0, // > 2 segundos
  verySlowRequests: 0, // > 5 segundos
  requestsByType: {},
  errors: {}
};

// Interceptar requisições do Supabase
const originalFetch = global.fetch;
global.fetch = async function(url, options) {
  const startTime = Date.now();
  const requestType = identifyRequestType(url);
  
  stats.totalRequests++;
  stats.requestsByType[requestType] = (stats.requestsByType[requestType] || 0) + 1;
  
  try {
    const response = await originalFetch(url, options);
    const responseTime = Date.now() - startTime;
    
    // Atualizar estatísticas
    updateStats(response, responseTime, requestType);
    
    // Log da requisição
    logRequest(url, response.status, responseTime, requestType);
    
    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    stats.failedRequests++;
    stats.errors[error.message] = (stats.errors[error.message] || 0) + 1;
    
    console.error(`❌ ${new Date().toLocaleTimeString()} | ${requestType} | ERRO | ${responseTime}ms | ${error.message}`);
    throw error;
  }
};

function identifyRequestType(url) {
  if (!url || typeof url !== 'string') return 'unknown';
  
  if (url.includes('/rest/v1/eventos')) {
    if (url.includes('select=')) {
      const selectMatch = url.match(/select=([^&]*)/);
      if (selectMatch && selectMatch[1].includes('participacoes')) {
        return 'eventos_with_participacoes';
      }
      return 'eventos_basic';
    }
    return 'eventos';
  }
  
  if (url.includes('/rest/v1/participacoes')) {
    if (url.includes('count')) return 'participacoes_count';
    return 'participacoes';
  }
  
  if (url.includes('/rest/v1/usuarios')) return 'usuarios';
  if (url.includes('/storage/v1/')) return 'storage';
  
  return 'other';
}

function updateStats(response, responseTime, requestType) {
  if (response.ok) {
    stats.successfulRequests++;
  } else {
    stats.failedRequests++;
    stats.errors[`HTTP_${response.status}`] = (stats.errors[`HTTP_${response.status}`] || 0) + 1;
  }
  
  // Atualizar tempo médio de resposta
  stats.averageResponseTime = (stats.averageResponseTime * (stats.totalRequests - 1) + responseTime) / stats.totalRequests;
  
  // Contar requisições lentas
  if (responseTime > 2000) {
    stats.slowRequests++;
  }
  if (responseTime > 5000) {
    stats.verySlowRequests++;
  }
}

function logRequest(url, status, responseTime, requestType) {
  const timestamp = new Date().toLocaleTimeString();
  const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
  const speedIcon = responseTime > 5000 ? '🐌' : responseTime > 2000 ? '⚠️' : '⚡';
  
  console.log(`${statusIcon} ${timestamp} | ${requestType} | ${status} | ${responseTime}ms ${speedIcon}`);
  
  // Alertas para problemas
  if (responseTime > 5000) {
    console.log(`🚨 ALERTA: Requisição muito lenta (${responseTime}ms) - ${requestType}`);
  }
  
  if (status >= 500) {
    console.log(`🚨 ALERTA: Erro do servidor (${status}) - ${requestType}`);
  }
}

// Simular uso típico da aplicação
async function simulateUsage() {
  console.log('🔄 Simulando uso típico da aplicação...\n');
  
  try {
    // 1. Buscar eventos (como na página inicial)
    console.log('📋 Buscando eventos...');
    const { data: eventos } = await supabase
      .from('eventos')
      .select(`
        *,
        organizador:usuarios!organizador_id (nome, email, avatar),
        participacoes!left (id, status)
      `)
      .order('data', { ascending: true })
      .limit(12);
    
    console.log(`✅ ${eventos?.length || 0} eventos carregados`);
    
    // 2. Simular múltiplas requisições de contagem (problema atual)
    if (eventos && eventos.length > 0) {
      console.log('\n⚠️ Simulando problema atual: múltiplas requisições de contagem...');
      
      const promises = eventos.slice(0, 5).map(evento => 
        supabase
          .from('participacoes')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', evento.id)
          .eq('status', 'confirmado')
      );
      
      await Promise.all(promises);
      console.log('❌ Múltiplas requisições simultâneas executadas');
    }
    
    // 3. Buscar participantes de um evento
    if (eventos && eventos.length > 0) {
      console.log('\n👥 Buscando participantes...');
      await supabase
        .from('participacoes')
        .select(`
          *,
          usuario:usuarios!usuario_id (nome, email, avatar)
        `)
        .eq('evento_id', eventos[0].id)
        .eq('status', 'confirmado');
    }
    
  } catch (error) {
    console.error('Erro na simulação:', error);
  }
}

// Relatório de estatísticas
function printStats() {
  console.log('\n📊 RELATÓRIO DE PERFORMANCE:');
  console.log('================================');
  console.log(`Total de requisições: ${stats.totalRequests}`);
  console.log(`Sucessos: ${stats.successfulRequests} (${((stats.successfulRequests/stats.totalRequests)*100).toFixed(1)}%)`);
  console.log(`Falhas: ${stats.failedRequests} (${((stats.failedRequests/stats.totalRequests)*100).toFixed(1)}%)`);
  console.log(`Tempo médio: ${stats.averageResponseTime.toFixed(0)}ms`);
  console.log(`Requisições lentas (>2s): ${stats.slowRequests}`);
  console.log(`Requisições muito lentas (>5s): ${stats.verySlowRequests}`);
  
  console.log('\n📈 REQUISIÇÕES POR TIPO:');
  Object.entries(stats.requestsByType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('\n❌ ERROS:');
    Object.entries(stats.errors)
      .sort(([,a], [,b]) => b - a)
      .forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
  }
  
  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES:');
  
  if (stats.requestsByType.participacoes_count > 5) {
    console.log('  ⚠️ Muitas requisições de contagem de participantes');
    console.log('     → Use JOIN na query principal em vez de requisições separadas');
  }
  
  if (stats.slowRequests > stats.totalRequests * 0.2) {
    console.log('  ⚠️ Muitas requisições lentas');
    console.log('     → Considere implementar cache ou otimizar queries');
  }
  
  if (stats.requestsByType.eventos_with_participacoes > 0) {
    console.log('  ✅ Usando queries otimizadas com JOIN');
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('  1. Implemente o hook useOptimizedEvents');
  console.log('  2. Use OptimizedEventsList na página inicial');
  console.log('  3. Configure cache para reduzir requisições');
  console.log('  4. Monitore performance em produção');
}

// Executar simulação
console.log('🚀 Iniciando monitor de performance...\n');

simulateUsage()
  .then(() => {
    setTimeout(() => {
      printStats();
      process.exit(0);
    }, 2000);
  })
  .catch(error => {
    console.error('Erro:', error);
    printStats();
    process.exit(1);
  });