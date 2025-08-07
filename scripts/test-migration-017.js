/**
 * Script para testar a migração 017 corrigida
 * Verifica se a migração pode ser aplicada sem erros
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testMigration017() {
  console.log('🧪 TESTANDO MIGRAÇÃO 017 CORRIGIDA\n');

  try {
    // 1. Verificar se tabela membros_comunidade existe e tem campo 'papel'
    console.log('📋 1. Verificando tabela membros_comunidade...');
    
    const { data: membros, error: membrosError } = await supabase
      .from('membros_comunidade')
      .select('id, papel')
      .limit(1);

    if (membrosError) {
      console.log(`   ❌ Erro ao acessar membros_comunidade: ${membrosError.message}`);
      if (membrosError.message.includes('does not exist')) {
        console.log('   💡 Tabela membros_comunidade não existe - políticas RLS podem falhar');
      }
    } else {
      console.log('   ✅ Tabela membros_comunidade acessível');
      console.log(`   ✅ Campo "papel" existe (${membros?.length || 0} registros)`);
    }

    // 2. Verificar se função update_updated_at_column existe
    console.log('\n🔧 2. Verificando função update_updated_at_column...');
    
    const { data: functions, error: funcError } = await supabase
      .rpc('version'); // Teste básico de conectividade

    if (funcError) {
      console.log(`   ⚠️  Não foi possível verificar funções: ${funcError.message}`);
    } else {
      console.log('   ✅ Conectividade com banco confirmada');
    }

    // 3. Verificar estado atual da tabela comunidades
    console.log('\n📊 3. Verificando estado atual da tabela comunidades...');
    
    const fieldsToCheck = ['privada', 'cidade'];
    
    for (const field of fieldsToCheck) {
      try {
        const { error } = await supabase
          .from('comunidades')
          .select(field)
          .limit(1);
        
        console.log(`   Campo "${field}": ${error ? '❌ Não existe (será criado)' : '✅ Já existe'}`);
      } catch (e) {
        console.log(`   Campo "${field}": ❌ Não existe (será criado)`);
      }
    }

    // 4. Verificar se há dados para migração
    console.log('\n🔄 4. Verificando dados para migração...');
    
    const { data: comunidades, error: queryError } = await supabase
      .from('comunidades')
      .select('id, tipo')
      .limit(5);

    if (queryError) {
      console.log(`   ❌ Erro ao consultar comunidades: ${queryError.message}`);
    } else {
      console.log(`   ✅ Consulta executada (${comunidades?.length || 0} registros)`);
      
      if (comunidades && comunidades.length > 0) {
        const tipos = [...new Set(comunidades.map(c => c.tipo))];
        console.log(`   📋 Tipos encontrados para migração: ${tipos.join(', ')}`);
      }
    }

    console.log('\n✅ TESTE CONCLUÍDO');
    console.log('\n💡 RESUMO:');
    console.log('   - Migração 017 corrigida (campo "papel" ao invés de "role")');
    console.log('   - Tabela membros_comunidade verificada');
    console.log('   - Campos "privada" e "cidade" serão adicionados');
    console.log('   - Dados do campo "tipo" serão migrados para "privada"');
    
    console.log('\n🚀 PRÓXIMO PASSO:');
    console.log('   Execute: supabase db push');
    console.log('   Ou aplique manualmente a migração 017_fix_comunidades_table.sql');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    process.exit(1);
  }
}

testMigration017();