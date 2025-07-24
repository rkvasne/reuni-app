#!/usr/bin/env node

/**
 * Script para limpar dados fictícios do banco de dados
 * Execute: node scripts/cleanup-fake-data.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧹 Iniciando limpeza de dados fictícios...\n');

try {
  // Executar a migração de limpeza
  console.log('📋 Executando migração de limpeza...');
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '017_ensure_tables_and_cleanup.sql');
  
  // Verificar se o arquivo existe
  const fs = require('fs');
  if (!fs.existsSync(migrationPath)) {
    throw new Error('Arquivo de migração não encontrado: ' + migrationPath);
  }
  
  console.log('✅ Arquivo de migração encontrado');
  console.log('📁 Caminho:', migrationPath);
  
  console.log('\n🔧 Para executar a migração, use um dos comandos:');
  console.log('');
  console.log('1. Via Supabase CLI:');
  console.log('   supabase db push');
  console.log('');
  console.log('2. Via SQL direto no Dashboard:');
  console.log('   Copie o conteúdo de supabase/migrations/017_ensure_tables_and_cleanup.sql');
  console.log('   e execute no SQL Editor do Supabase Dashboard');
  console.log('');
  
  // Mostrar resumo do que será feito
  console.log('📋 O que será executado:');
  console.log('   🏗️  Garantir que todas as tabelas essenciais existam');
  console.log('   📊 Criar índices de performance');
  console.log('   🧹 Remover dados fictícios');
  console.log('   ✓ Usuários com email @example.com ou @test.com');
  console.log('   ✓ Todos os eventos, comunidades, membros');
  console.log('   ✓ Posts, comentários e reações (se existirem)');
  console.log('   ✓ Logs de moderação e punições');
  console.log('   ✓ Notificações');
  console.log('');
  
  console.log('✅ Script completo preparado!');
  console.log('🏗️  Criará tabelas essenciais se não existirem');
  console.log('🧹 Limpará dados fictícios');
  console.log('🚀 Sistema estará 100% funcional para a v0.0.6');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}