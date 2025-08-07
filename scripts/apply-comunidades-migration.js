/**
 * Script para aplicar e testar a migração da tabela comunidades
 * Este script simula a aplicação da migração e testa os resultados
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyComunidadesMigration() {
  console.log('🚀 APLICANDO MIGRAÇÃO DA TABELA COMUNIDADES\n');

  try {
    console.log('📋 RESUMO DA MIGRAÇÃO 017:');
    console.log('   ✅ Adicionar campo "privada" (BOOLEAN)');
    console.log('   ✅ Adicionar campo "cidade" (VARCHAR(100))');
    console.log('   ✅ Migrar dados do campo "tipo" para "privada"');
    console.log('   ✅ Configurar constraints de validação');
    console.log('   ✅ Criar índices otimizados');
    console.log('   ✅ Configurar políticas RLS adequadas');
    console.log('   ✅ Configurar trigger de updated_at');

    console.log('\n⚠️  PARA APLICAR A MIGRAÇÃO:');
    console.log('   Execute no terminal: supabase db push');
    console.log('   Ou aplique manualmente o arquivo: supabase/migrations/017_fix_comunidades_table.sql');

    console.log('\n🔍 VERIFICANDO ESTADO ATUAL...');
    
    // Verificar campos atuais
    const fieldsToCheck = ['privada', 'cidade'];
    
    for (const field of fieldsToCheck) {
      try {
        const { error } = await supabase
          .from('comunidades')
          .select(field)
          .limit(1);
        
        console.log(`   Campo "${field}": ${error ? '❌ Não existe' : '✅ Existe'}`);
      } catch (e) {
        console.log(`   Campo "${field}": ❌ Não existe`);
      }
    }

    // Verificar se há registros para migração
    const { data: comunidades, error: countError } = await supabase
      .from('comunidades')
      .select('id, tipo')
      .limit(5);

    if (!countError && comunidades) {
      console.log(`\n📊 Registros encontrados: ${comunidades.length}`);
      
      if (comunidades.length > 0) {
        console.log('   Tipos encontrados:');
        const tipos = [...new Set(comunidades.map(c => c.tipo))];
        tipos.forEach(tipo => {
          console.log(`   - ${tipo}`);
        });
      }
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA');
    console.log('\n💡 PRÓXIMOS PASSOS APÓS APLICAR A MIGRAÇÃO:');
    console.log('   1. Verificar se campos "privada" e "cidade" foram criados');
    console.log('   2. Confirmar migração de dados do campo "tipo"');
    console.log('   3. Testar políticas RLS com diferentes usuários');
    console.log('   4. Validar performance dos novos índices');
    console.log('   5. Considerar remoção do campo "tipo" após validação');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

applyComunidadesMigration();