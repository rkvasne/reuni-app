/**
 * Script para validar a migração da tabela comunidades após aplicação
 * Execute este script APÓS aplicar a migração 017_fix_comunidades_table.sql
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function validateComunidadesMigration() {
  console.log('✅ VALIDANDO MIGRAÇÃO DA TABELA COMUNIDADES\n');

  const results = {
    fields: {},
    constraints: {},
    indexes: {},
    rls: {},
    overall: true
  };

  try {
    // 1. Verificar campos obrigatórios
    console.log('📋 1. Verificando campos da tabela...');
    
    const requiredFields = [
      'id', 'nome', 'descricao', 'categoria', 'criador_id',
      'privada', 'cidade', 'regras', 'tags', 'membros_count', 
      'eventos_count', 'created_at', 'updated_at'
    ];

    for (const field of requiredFields) {
      try {
        const { error } = await supabase
          .from('comunidades')
          .select(field)
          .limit(1);
        
        results.fields[field] = !error;
        console.log(`   ${field}: ${error ? '❌' : '✅'}`);
        
        if (error) results.overall = false;
      } catch (e) {
        results.fields[field] = false;
        console.log(`   ${field}: ❌`);
        results.overall = false;
      }
    }

    // 2. Testar inserção com novos campos
    console.log('\n🧪 2. Testando inserção com novos campos...');
    
    // Primeiro, vamos tentar sem autenticação para ver o erro de RLS
    const testData = {
      nome: 'Comunidade Teste Migração',
      descricao: 'Teste da migração da tabela comunidades',
      categoria: 'Teste',
      privada: false,
      cidade: 'São Paulo',
      regras: 'Regras de teste',
      tags: ['teste', 'migração']
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('comunidades')
      .insert(testData)
      .select('*');

    if (insertError) {
      if (insertError.message.includes('row-level security')) {
        console.log('   ✅ RLS está funcionando (bloqueou inserção não autenticada)');
        results.rls.enabled = true;
      } else {
        console.log(`   ❌ Erro inesperado: ${insertError.message}`);
        results.rls.enabled = false;
        results.overall = false;
      }
    } else {
      console.log('   ⚠️  Inserção permitida sem autenticação (RLS pode estar desabilitado)');
      results.rls.enabled = false;
      
      // Limpar registro de teste se foi inserido
      if (insertResult && insertResult.length > 0) {
        await supabase
          .from('comunidades')
          .delete()
          .eq('id', insertResult[0].id);
      }
    }

    // 3. Verificar se migração de dados funcionou
    console.log('\n🔄 3. Verificando migração de dados...');
    
    const { data: comunidades, error: queryError } = await supabase
      .from('comunidades')
      .select('id, tipo, privada')
      .limit(10);

    if (queryError) {
      console.log(`   ❌ Erro ao consultar dados: ${queryError.message}`);
      results.overall = false;
    } else {
      console.log(`   ✅ Consulta executada (${comunidades?.length || 0} registros)`);
      
      if (comunidades && comunidades.length > 0) {
        // Verificar se migração de tipo->privada funcionou
        const migratedCorrectly = comunidades.every(c => 
          c.privada !== null && c.privada !== undefined
        );
        
        console.log(`   Migração tipo->privada: ${migratedCorrectly ? '✅' : '❌'}`);
        results.constraints.dataMigration = migratedCorrectly;
        
        if (!migratedCorrectly) results.overall = false;
      }
    }

    // 4. Resumo final
    console.log('\n📊 RESUMO DA VALIDAÇÃO:');
    console.log('=====================================');
    
    console.log('\n🏗️  ESTRUTURA:');
    const fieldCount = Object.values(results.fields).filter(Boolean).length;
    console.log(`   Campos: ${fieldCount}/${requiredFields.length} ✅`);
    
    console.log('\n🔒 SEGURANÇA:');
    console.log(`   RLS: ${results.rls.enabled ? '✅ Habilitado' : '❌ Problema'}`);
    
    console.log('\n🎯 RESULTADO GERAL:');
    if (results.overall) {
      console.log('   ✅ MIGRAÇÃO APLICADA COM SUCESSO!');
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('   1. Testar políticas RLS com usuários autenticados');
      console.log('   2. Validar performance dos novos índices');
      console.log('   3. Considerar remoção do campo "tipo" após validação completa');
      console.log('   4. Marcar task 6 como concluída');
    } else {
      console.log('   ❌ MIGRAÇÃO INCOMPLETA - VERIFICAR PROBLEMAS ACIMA');
      console.log('\n🔧 AÇÕES NECESSÁRIAS:');
      console.log('   1. Verificar se a migração foi aplicada corretamente');
      console.log('   2. Corrigir campos ou configurações faltantes');
      console.log('   3. Executar este script novamente');
    }

  } catch (error) {
    console.error('❌ ERRO NA VALIDAÇÃO:', error.message);
    results.overall = false;
  }

  return results;
}

// Executar validação
validateComunidadesMigration()
  .then(results => {
    process.exit(results.overall ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });