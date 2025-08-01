#!/usr/bin/env node

/**
 * Script de teste para verificar as correções implementadas
 * - Teste de formatação de data
 * - Teste de construção de local
 * - Teste de limpeza de descrição
 */

// Simular as funções corrigidas
function testarFormatacaoData() {
  console.log('🧪 Testando formatação de data...');
  
  const datas = [
    '2025-08-20',
    '2025-08-21', 
    '2025-09-07',
    '2025-10-26'
  ];
  
  datas.forEach(data => {
    // Simular a correção do EventDateBadge
    const [year, month, day] = data.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    
    console.log(`  ${data} → ${eventDate.toLocaleDateString('pt-BR')} (dia: ${eventDate.getDate()})`);
  });
}

function testarConstruirLocal() {
  console.log('\n🏙️ Testando construção de local...');
  
  const cidades = [
    'Ji-Paraná',
    'Porto Velho', 
    'Salvador',
    'Fortaleza',
    'Porto Alegre',
    'Brasília',
    'Rio de Janeiro',
    'São Paulo'
  ];
  
  cidades.forEach(cidade => {
    // Simular a função construirLocal corrigida
    let estado = 'SP'; // padrão
    const cidadeLower = cidade.toLowerCase();
    
    if (cidadeLower.includes('ji-paraná') || cidadeLower.includes('porto velho')) {
      estado = 'RO';
    } else if (cidadeLower.includes('salvador')) {
      estado = 'BA';
    } else if (cidadeLower.includes('fortaleza')) {
      estado = 'CE';
    } else if (cidadeLower.includes('porto alegre')) {
      estado = 'RS';
    } else if (cidadeLower.includes('brasília')) {
      estado = 'DF';
    } else if (cidadeLower.includes('rio de janeiro')) {
      estado = 'RJ';
    }
    
    console.log(`  ${cidade} → ${cidade}, ${estado}`);
  });
}

function testarLimpezaDescricao() {
  console.log('\n🧹 Testando limpeza de descrição...');
  
  const descricoes = [
    'Local a definir - Ji-Paraná, RO',
    'Delegacia De Policia Federal De Ji-parana - Ji-Paraná, RO',
    'Academia Cia Fitness - Jaru, RO',
    'Golden Plaza Hotel - Porto Velho, RO',
    'órico-Cultural Santa Casa - Porto Alegre, RS',
    'Eaço Fábrica Cultural - Salvador, BA',
    'Sesc Palladium - Belo Horizonte, MG'
  ];
  
  descricoes.forEach(descricao => {
    let descricaoLimpa = descricao;
    
    // Simular a limpeza corrigida
    const padroesCidadeEstado = [
      /-\s*[A-Za-zÀ-ÿ\s]+,\s*[A-Z]{2}/gi,
      /,\s*[A-Za-zÀ-ÿ\s]+,\s*[A-Z]{2}/gi,
      /\s+[A-Za-zÀ-ÿ\s]+,\s*[A-Z]{2}/gi
    ];
    
    padroesCidadeEstado.forEach(padrao => {
      descricaoLimpa = descricaoLimpa.replace(padrao, '').trim();
    });
    
    // Limpar espaços duplos, vírgulas soltas e hífens soltos
    descricaoLimpa = descricaoLimpa
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/-\s*-/g, '-')
      .replace(/^\s*[-,\s]+\s*/, '')
      .replace(/\s*[-,\s]+\s*$/, '')
      .trim();
    
    console.log(`  "${descricao}" → "${descricaoLimpa}"`);
  });
}

// Executar testes
console.log('🔧 Testando correções do scraping...\n');

testarFormatacaoData();
testarConstruirLocal();
testarLimpezaDescricao();

console.log('\n✅ Testes concluídos!'); 