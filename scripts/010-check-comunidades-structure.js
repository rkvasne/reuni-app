/**
 * Script para verificar a estrutura atual da tabela comunidades
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkComunidadesStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA COMUNIDADES\n');

  try {
    // Tentar inserir um registro de teste para verificar campos obrigatórios
    console.log('📝 Tentando inserir registro de teste...');
    
    const testData = {
      nome: 'Teste Estrutura',
      descricao: 'Comunidade de teste para verificar estrutura',
      categoria: 'Teste',
      tipo: 'publica'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('comunidades')
      .insert(testData)
      .select('*')
      .single();

    if (insertError) {
      console.log(`   ❌ Erro ao inserir: ${insertError.message}`);
      console.log('   Isso nos ajuda a entender a estrutura atual');
      
      // Analisar o erro para entender campos obrigatórios
      if (insertError.message.includes('null value')) {
        console.log('   💡 Campos obrigatórios identificados no erro');
      }
    } else {
      console.log('   ✅ Registro inserido com sucesso!');
      console.log('\n   📋 Estrutura atual identificada:');
      
      Object.keys(insertResult).forEach(field => {
        console.log(`   - ${field}: ${typeof insertResult[field]} = ${insertResult[field]}`);
      });

      // Limpar o registro de teste
      await supabase
        .from('comunidades')
        .delete()
        .eq('id', insertResult.id);
      
      console.log('\n   🧹 Registro de teste removido');
    }

    // Tentar uma consulta com campos específicos para verificar se existem
    console.log('\n🔍 Verificando campos específicos...');
    
    const fieldsToCheck = [
      'id', 'nome', 'descricao', 'categoria', 'tipo', 'privada', 
      'criador_id', 'tags', 'regras', 'cidade', 'membros_count', 
      'eventos_count', 'created_at', 'updated_at'
    ];

    for (const field of fieldsToCheck) {
      try {
        const { error } = await supabase
          .from('comunidades')
          .select(field)
          .limit(1);
        
        console.log(`   ${field}: ${error ? '❌' : '✅'}`);
      } catch (e) {
        console.log(`   ${field}: ❌`);
      }
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA');

  } catch (error) {
    console.error('❌ ERRO NA VERIFICAÇÃO:', error.message);
  }
}

checkComunidadesStructure();