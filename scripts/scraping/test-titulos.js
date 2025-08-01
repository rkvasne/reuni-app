#!/usr/bin/env node

/**
 * Teste do algoritmo de extração de títulos esportivos
 */

class TestScraper {
  isEventoEsportivo(titulo) {
    const tituloLower = titulo.toLowerCase();
    const palavrasEsportivas = [
      'corrida', 'run', 'marathon', 'maratona', 'caminhada', 'pedalada',
      'ciclismo', 'triathlon', 'natação', 'atletismo', 'cooper'
    ];
    return palavrasEsportivas.some(palavra => tituloLower.includes(palavra));
  }

  processarTituloEsportivo(titulo) {
    let tituloProcessado = titulo;
    
    // Padrão: evento esportivo com ano seguido de distância e K
    const padraoAnoK = /^(.+20\d{2})[\.\s]*\d+K.*$/i;
    const matchAnoK = titulo.match(padraoAnoK);
    if (matchAnoK) {
      return matchAnoK[1].trim();
    }
    
    // Padrão: evento esportivo terminando com distância e K (sem ano)
    const padraoK = /^(.+?)\s*\d+K.*$/i;
    const matchK = titulo.match(padraoK);
    if (matchK) {
      const tituloSemK = matchK[1].trim();
      
      // Verificar se não cortou muito (mínimo 15 caracteres para eventos esportivos)
      if (tituloSemK.length >= 15) {
        return tituloSemK;
      }
    }
    
    return tituloProcessado;
  }

  calcularSimilaridade(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    // Matriz de distância
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    
    return (maxLen - distance) / maxLen;
  }

  testarTitulos() {
    const titulosTest = [
      '2ª PVH CITY HALF MARATHON 2025. 5K',
      '5ª CORRIDA E CAMINHADA OUTUBRO ROSA OAB 5KOAB-Ordem dos Advogados do Brasil',
      'Léo Lins novo show, Enterrado vivo',
      'MARATONA DE SÃO PAULO 2025 42K INSCRIÇÕES ABERTAS',
      'CORRIDA DE RUA CIDADE DE GOIÂNIA 10K',
      'CAMINHADA PELA PAZ 2025 5K GRATUITA'
    ];

    console.log('🧪 Testando algoritmo de títulos esportivos:');
    console.log('='.repeat(60));
    
    titulosTest.forEach((titulo, index) => {
      const isEsportivo = this.isEventoEsportivo(titulo);
      let resultado = titulo;
      
      if (isEsportivo) {
        resultado = this.processarTituloEsportivo(titulo);
      }
      
      console.log(`\n${index + 1}. TESTE:`);
      console.log('📝 Original:', titulo);
      console.log('🏃 Esportivo:', isEsportivo ? '✅ SIM' : '❌ NÃO');
      console.log('✨ Processado:', resultado);
      console.log('📏 Tamanho:', resultado.length, 'caracteres');
      console.log('🎯 Melhoria:', titulo !== resultado ? '✅ MELHORADO' : '⚪ INALTERADO');
    });

    console.log('\n' + '='.repeat(60));
    console.log('🔍 Testando detecção de duplicatas:');
    console.log('='.repeat(60));

    const duplicatasTest = [
      ['Léo Lins novo show, Enterrado vivo', 'Léo Lins novo show, Enterrado vivo'],
      ['5ª CORRIDA OUTUBRO ROSA OAB', '5ª CORRIDA E CAMINHADA OUTUBRO ROSA OAB'],
      ['MARATONA DE SÃO PAULO 2025', 'MARATONA DE SAO PAULO 2025'],
      ['Show de Rock', 'Evento de Música Clássica']
    ];

    duplicatasTest.forEach(([titulo1, titulo2], index) => {
      const similaridade = this.calcularSimilaridade(titulo1, titulo2);
      const isDuplicata = similaridade > 0.85;
      
      console.log(`\n${index + 1}. COMPARAÇÃO:`);
      console.log('📝 Título 1:', titulo1);
      console.log('📝 Título 2:', titulo2);
      console.log('📊 Similaridade:', (similaridade * 100).toFixed(1) + '%');
      console.log('🔄 Duplicata:', isDuplicata ? '✅ SIM' : '❌ NÃO');
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Testes concluídos!');
  }
}

const tester = new TestScraper();
tester.testarTitulos();