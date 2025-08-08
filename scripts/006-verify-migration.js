#!/usr/bin/env node

/**
 * Script para verificar se a migração de renomeação foi executada corretamente
 * 
 * Uso:
 * node scripts/verify-migration.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  try {
    console.log('🔍 Verificando migração de renomeação dos campos...');
    console.log('');

    // Verificar estrutura atual da tabela eventos
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'eventos')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erro ao verificar estrutura:', columnsError);
      process.exit(1);
    }

    console.log('📊 Estrutura atual da tabela eventos:');
    console.log('');

    const expectedFields = {
      'local': { found: false, oldName: 'descricao' },
      'cidade': { found: false, oldName: 'local' }
    };

    columns.forEach(col => {
      const status = col.column_name === 'local' || col.column_name === 'cidade' ? '🟢' : '⚪';
      console.log(`${status} ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
      
      if (col.column_name === 'local') {
        expectedFields.local.found = true;
      }
      if (col.column_name === 'cidade') {
        expectedFields.cidade.found = true;
      }
    });

    console.log('');
    console.log('🔍 Verificação dos campos renomeados:');

    // Verificar se os campos antigos ainda existem
    const oldFields = columns.filter(col => col.column_name === 'descricao' || col.column_name === 'local');
    
    if (oldFields.length > 0) {
      console.log('❌ Campos antigos ainda existem:');
      oldFields.forEach(field => {
        console.log(`   - ${field.column_name} (deveria ter sido renomeado)`);
      });
    } else {
      console.log('✅ Campos antigos foram renomeados corretamente');
    }

    // Verificar se os novos campos existem
    console.log('');
    if (expectedFields.local.found) {
      console.log('✅ Campo "local" existe (antigo descricao)');
    } else {
      console.log('❌ Campo "local" NÃO existe');
    }

    if (expectedFields.cidade.found) {
      console.log('✅ Campo "cidade" existe (antigo local)');
    } else {
      console.log('❌ Campo "cidade" NÃO existe');
    }

    // Verificar dados de exemplo
    console.log('');
    console.log('📋 Verificando dados de exemplo...');
    
    const { data: sampleEvents, error: sampleError } = await supabase
      .from('eventos')
      .select('id, titulo, local, cidade')
      .limit(3);

    if (sampleError) {
      console.error('❌ Erro ao buscar dados de exemplo:', sampleError);
    } else if (sampleEvents && sampleEvents.length > 0) {
      console.log('✅ Dados encontrados com os novos campos:');
      sampleEvents.forEach((event, index) => {
        console.log(`   Evento ${index + 1}:`);
        console.log(`     - ID: ${event.id}`);
        console.log(`     - Título: ${event.titulo}`);
        console.log(`     - Local: ${event.local || 'N/A'}`);
        console.log(`     - Cidade: ${event.cidade || 'N/A'}`);
      });
    } else {
      console.log('ℹ️  Nenhum evento encontrado para verificação');
    }

    // Resumo final
    console.log('');
    console.log('📋 Resumo da verificação:');
    
    const allGood = expectedFields.local.found && expectedFields.cidade.found && oldFields.length === 0;
    
    if (allGood) {
      console.log('🎉 Migração executada com SUCESSO!');
      console.log('✅ Todos os campos foram renomeados corretamente');
      console.log('✅ Dados estão acessíveis com os novos nomes');
      console.log('');
      console.log('⚠️  Lembre-se de atualizar o código da aplicação!');
    } else {
      console.log('❌ Migração INCOMPLETA ou com problemas');
      console.log('🔧 Verifique os erros acima e execute a migração novamente');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar verificação
verifyMigration(); 