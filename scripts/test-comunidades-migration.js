/**
 * Script para testar a migração da tabela comunidades
 * Executa verificações antes e depois da migração
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testComunidadesMigration() {
  console.log('🧪 TESTANDO MIGRAÇÃO DA TABELA COMUNIDADES\n');

  try {
    // Testar consulta básica para verificar estrutura atual
    console.log('🔍 Testando consulta básica na tabela comunidades...');
    const { data: comunidades, error: queryError } = await supabase
      .from('comunidades')
      .select('*')
      .limit(1);

    if (queryError) {
      console.log(`   ❌ Erro na consulta: ${queryError.message}`);
      console.log('   Isso pode indicar que a tabela precisa de correções');
    } else {
      console.log(`   ✅ Consulta executada com sucesso`);
      
      // Verificar se campos existem
      if (comunidades && comunidades.length > 0) {
        const firstRecord = comunidades[0];
        console.log('\n   📋 Campos verificados no primeiro registro:');
        console.log(`   - id: ${firstRecord.id !== undefined ? '✅' : '❌'}`);
        console.log(`   - nome: ${firstRecord.nome !== undefined ? '✅' : '❌'}`);
        console.log(`   - categoria: ${firstRecord.categoria !== undefined ? '✅' : '❌'}`);
        console.log(`   - privada: ${firstRecord.privada !== undefined ? '✅' : '❌'}`);
        console.log(`   - tags: ${firstRecord.tags !== undefined ? '✅' : '❌'}`);
        console.log(`   - regras: ${firstRecord.regras !== undefined ? '✅' : '❌'}`);
        console.log(`   - cidade: ${firstRecord.cidade !== undefined ? '✅' : '❌'}`);
        console.log(`   - updated_at: ${firstRecord.updated_at !== undefined ? '✅' : '❌'}`);
      } else {
        console.log('   ⚠️  Nenhum registro encontrado para verificar campos');
      }
    }

    console.log('\n✅ TESTE CONCLUÍDO');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Aplicar a migração 017_fix_comunidades_table.sql');
    console.log('   2. Executar este teste novamente para verificar mudanças');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    process.exit(1);
  }
}

// Executar teste
testComunidadesMigration();