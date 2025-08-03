#!/usr/bin/env node

/**
 * Script para executar a migração de renomeação dos campos da tabela eventos
 * 
 * Uso:
 * node scripts/run-rename-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function runMigration() {
  try {
    console.log('🔄 Iniciando migração de renomeação dos campos...');
    console.log('📋 Alterações:');
    console.log('   - eventos.descricao → eventos.local');
    console.log('   - eventos.local → eventos.cidade');
    console.log('');

    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../supabase/migrations/013_rename_eventos_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Executando migração...');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      process.exit(1);
    }

    console.log('✅ Migração executada com sucesso!');
    console.log('');
    console.log('🔍 Verificando estrutura atual...');

    // Verificar estrutura atual
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'eventos')
      .in('column_name', ['local', 'cidade'])
      .order('column_name');

    if (columnsError) {
      console.error('❌ Erro ao verificar estrutura:', columnsError);
    } else {
      console.log('📊 Campos encontrados:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    console.log('');
    console.log('🎉 Migração concluída com sucesso!');
    console.log('');
    console.log('⚠️  IMPORTANTE: Agora você precisa atualizar o código da aplicação');
    console.log('   para usar os novos nomes dos campos:');
    console.log('   - Use "local" em vez de "descricao"');
    console.log('   - Use "cidade" em vez de "local"');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar migração
runMigration(); 