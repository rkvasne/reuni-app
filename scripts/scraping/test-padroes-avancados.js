#!/usr/bin/env node

/**
 * Teste dos novos padrões de corte de títulos identificados
 */

const chalk = require('chalk');

class TestPadroesAvancados {
  // Aplicar padrões de corte identificados nos títulos
  aplicarPadroesDeCorte(titulo) {
    let tituloProcessado = titulo;

    // 1. Padrão: Mudança de MAIÚSCULAS para Mistas (indica local)
    // Ex: "RESENHA DO ASSISSeu Geraldo Boteco" -> "RESENHA DO ASSIS"
    const padraoMudancaCaixa = /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)([A-Z][a-záàâãéêíóôõúç].*)$/;
    const matchCaixa = titulo.match(padraoMudancaCaixa);
    if (matchCaixa && matchCaixa[1].trim().length >= 10) {
      tituloProcessado = matchCaixa[1].trim();
    }

    // 2. Padrão: Palavra "dia" seguida de data
    // Ex: "Baile Fest Car dia 30 de agosto no Piazza Notte" -> "Baile Fest Car"
    const padraoDia = /^(.+?)\s+dia\s+\d{1,2}.*$/i;
    const matchDia = tituloProcessado.match(padraoDia);
    if (matchDia && matchDia[1].trim().length >= 8) {
      tituloProcessado = matchDia[1].trim();
    }

    // 3. Padrão: Preposição "com" seguida de complementos
    // Ex: "POSICIONA 360° com Elas N Sucesso" -> "POSICIONA 360°"
    const padraoCom = /^(.+?)\s+com\s+[A-Z].*$/i;
    const matchCom = tituloProcessado.match(padraoCom);
    if (matchCom && matchCom[1].trim().length >= 10) {
      tituloProcessado = matchCom[1].trim();
    }

    // 3.1. Padrão específico: Remover prefixo de cidade com data
    // Ex: "Cuiabá 16/08 POSICIONA 360°" -> "POSICIONA 360°"
    const padraoDataCidade = /^[A-Za-záàâãéêíóôõúç\s]+\s+\d{1,2}\/\d{1,2}\s+(.+)$/;
    const matchDataCidade = tituloProcessado.match(padraoDataCidade);
    if (matchDataCidade && matchDataCidade[1].trim().length >= 10) {
      tituloProcessado = matchDataCidade[1].trim();
    }

    // 4. Padrão: Endereços e Locais (Av., Rua, Igreja, Clube, etc.)
    // Ex: "III JORNADA UNIVERSO DO PSI ESCOLARAv. Álvaro Otacílio" -> "III JORNADA UNIVERSO DO PSI ESCOLAR"
    // Ex: "Seminário de Ciências Bíblicas em Natal (RN)Igreja do Nazareno" -> "Seminário de Ciências Bíblicas em Natal (RN)"
    const padraoEndereco = /^(.+?)(Av\.|Rua|R\.|Alameda|Travessa|Praça|Igreja|Clube|Estádio|Arena|Centro|Ginásio).*$/i;
    const matchEndereco = tituloProcessado.match(padraoEndereco);
    if (matchEndereco && matchEndereco[1].trim().length >= 10) {
      tituloProcessado = matchEndereco[1].trim();
    }

    // 4.1. Padrão: Ausência de espaço entre palavras (indica fim do título)
    // Ex: "A voz do sem voz TributoMercedes Sosa" -> "A voz do sem voz Tributo"
    // Ex: "LOBÃO POWER TRIO NO ACRE ROCK FESTIVAL E AMAZÔNIA MOTORCYCLESCLUBE JUVENTUS" -> "LOBÃO POWER TRIO NO ACRE ROCK FESTIVAL E AMAZÔNIA MOTORCYCLES"
    const padraoSemEspaco = /^(.+?)([A-Z][a-z]+)([A-Z][A-Za-z\s]+)$/;
    const matchSemEspaco = tituloProcessado.match(padraoSemEspaco);
    if (matchSemEspaco && matchSemEspaco[1].trim().length >= 10) {
      // Verificar se realmente parece ser fim do título
      const parteAntes = matchSemEspaco[1] + matchSemEspaco[2];
      const parteDepois = matchSemEspaco[3];
      
      // Se a parte depois parece ser nome próprio ou local, cortar
      if (parteDepois.match(/^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/) || 
          parteDepois.toLowerCase().includes('clube') ||
          parteDepois.toLowerCase().includes('igreja') ||
          parteDepois.toLowerCase().includes('centro')) {
        tituloProcessado = parteAntes.trim();
      }
    }

    // 5. Padrão: Ano no final (para eventos não esportivos)
    // Ex: "CORRIDA NOTURNA CACOAL ROTA DA JUSTIÇA 2025OAB" -> "CORRIDA NOTURNA CACOAL ROTA DA JUSTIÇA 2025"
    const padraoAnoFinal = /^(.+20\d{2})[A-Z]{2,}.*$/;
    const matchAnoFinal = tituloProcessado.match(padraoAnoFinal);
    if (matchAnoFinal && matchAnoFinal[1].trim().length >= 15) {
      tituloProcessado = matchAnoFinal[1].trim();
    }

    // 6. Padrão: Repetição de local/estabelecimento
    // Ex: "Festival no Piazza NottePiazza Notte" -> "Festival no Piazza Notte"
    const padraoRepeticao = /^(.+?)([A-Z][a-záàâãéêíóôõúç\s]+)\2.*$/;
    const matchRepeticao = tituloProcessado.match(padraoRepeticao);
    if (matchRepeticao && matchRepeticao[1].trim().length >= 10) {
      tituloProcessado = matchRepeticao[1].trim() + matchRepeticao[2];
    }

    // 7. Padrão: Nome de cidade repetido com data
    // Ex: "Cuiabá 16/08 POSICIONA 360° com Elas N SucessoCuiabá Lar Shopping" -> "POSICIONA 360°"
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Cuiabá', 'Goiânia', 'Brasília', 'Salvador', 'Fortaleza'];
    for (const cidade of cidades) {
      const regexCidade = new RegExp(`^${cidade}\\s+\\d{1,2}/\\d{1,2}\\s+(.+?)\\s+com\\s+.*${cidade}.*$`, 'i');
      const matchCidade = tituloProcessado.match(regexCidade);
      if (matchCidade && matchCidade[1].trim().length >= 8) {
        tituloProcessado = matchCidade[1].trim();
        break;
      }
    }

    return tituloProcessado;
  }

  testarPadroes() {
    console.log(chalk.cyan('\n🔍 Testando Padrões Avançados de Corte de Títulos'));
    console.log(chalk.cyan('═'.repeat(60)));

    const casosTest = [
      // Casos identificados pelo usuário
      {
        original: 'RESENHA DO ASSISSeu Geraldo Boteco',
        esperado: 'RESENHA DO ASSIS',
        padrao: 'Mudança de maiúsculas para mistas'
      },
      {
        original: 'Baile Fest Car dia 30 de agosto no Piazza NottePiazza Notte',
        esperado: 'Baile Fest Car',
        padrao: 'Palavra "dia" indica data'
      },
      {
        original: 'Cuiabá 16/08 POSICIONA 360° com Elas N SucessoCuiabá Lar Shopping',
        esperado: 'POSICIONA 360°',
        padrao: 'Preposição "com" + cidade repetida'
      },
      {
        original: 'III JORNADA UNIVERSO DO PSI ESCOLARAv. Álvaro Otacílio, 4065',
        esperado: 'III JORNADA UNIVERSO DO PSI ESCOLAR',
        padrao: 'Endereço com "Av."'
      },
      {
        original: 'Festival do Chefe dia 08 de novembro no Piazza NottePiazza Notte',
        esperado: 'Festival do Chefe',
        padrao: 'Palavra "dia" + repetição de local'
      },
      {
        original: 'CORRIDA NOTURNA CACOAL ROTA DA JUSTIÇA 2025OAB',
        esperado: 'CORRIDA NOTURNA CACOAL ROTA DA JUSTIÇA 2025',
        padrao: 'Ano encerra título'
      },

      // Novos casos identificados
      {
        original: 'Seminário de Ciências Bíblicas em Natal (RN)Igreja do Nazareno de Lagoa Nova',
        esperado: 'Seminário de Ciências Bíblicas em Natal (RN)',
        padrao: 'Palavra "Igreja" indica local'
      },
      {
        original: 'PINK POWER CONFERENCE 25Igreja Angelim Teresina',
        esperado: 'PINK POWER CONFERENCE 25',
        padrao: 'Palavra "Igreja" + ausência de espaço'
      },
      {
        original: 'A voz do sem voz TributoMercedes Sosa',
        esperado: 'A voz do sem voz Tributo',
        padrao: 'Ausência de espaço entre palavras'
      },
      {
        original: 'LOBÃO POWER TRIO NO ACRE ROCK FESTIVAL E AMAZÔNIA MOTORCYCLESCLUBE JUVENTUS',
        esperado: 'LOBÃO POWER TRIO NO ACRE ROCK FESTIVAL E AMAZÔNIA MOTORCYCLES',
        padrao: 'Ausência de espaço + "CLUBE"'
      },

      // Casos adicionais para testar robustez
      {
        original: 'WORKSHOP DE MARKETING DIGITALRua das Flores, 123',
        esperado: 'WORKSHOP DE MARKETING DIGITAL',
        padrao: 'Endereço com "Rua"'
      },
      {
        original: 'SHOW DE ROCK dia 15 de dezembro',
        esperado: 'SHOW DE ROCK',
        padrao: 'Palavra "dia" simples'
      },
      {
        original: 'PALESTRA MOTIVACIONAL com João Silva',
        esperado: 'PALESTRA MOTIVACIONAL',
        padrao: 'Preposição "com"'
      },
      {
        original: 'EVENTO CORPORATIVOPraça Central, s/n',
        esperado: 'EVENTO CORPORATIVO',
        padrao: 'Endereço com "Praça"'
      }
    ];

    console.log(chalk.yellow('\n📋 Testando cada padrão:'));
    console.log('='.repeat(80));

    let acertos = 0;
    let total = casosTest.length;

    casosTest.forEach((caso, index) => {
      console.log(`\n${index + 1}. TESTE:`);
      console.log(chalk.gray(`📝 Original: "${caso.original}"`));
      console.log(chalk.gray(`🎯 Esperado: "${caso.esperado}"`));
      console.log(chalk.gray(`🔧 Padrão: ${caso.padrao}`));

      const resultado = this.aplicarPadroesDeCorte(caso.original);
      const sucesso = resultado === caso.esperado;
      
      if (sucesso) {
        acertos++;
        console.log(chalk.green(`✅ Resultado: "${resultado}"`));
        console.log(chalk.green(`🎉 SUCESSO!`));
      } else {
        console.log(chalk.red(`❌ Resultado: "${resultado}"`));
        console.log(chalk.red(`💥 FALHOU!`));
        
        // Análise do que aconteceu
        if (resultado === caso.original) {
          console.log(chalk.yellow(`⚠️  Nenhum padrão foi aplicado`));
        } else {
          console.log(chalk.yellow(`⚠️  Padrão aplicado, mas resultado diferente do esperado`));
        }
      }
    });

    console.log(chalk.cyan('\n📊 Resumo dos Testes:'));
    console.log('='.repeat(50));
    console.log(chalk.green(`✅ Sucessos: ${acertos}/${total}`));
    console.log(chalk.red(`❌ Falhas: ${total - acertos}/${total}`));
    console.log(chalk.blue(`📈 Taxa de sucesso: ${((acertos / total) * 100).toFixed(1)}%`));

    if (acertos === total) {
      console.log(chalk.green('\n🎉 TODOS OS PADRÕES FUNCIONANDO PERFEITAMENTE!'));
    } else {
      console.log(chalk.yellow('\n⚠️  Alguns padrões precisam de ajustes'));
    }

    console.log(chalk.yellow('\n🎯 Padrões Implementados:'));
    console.log('✅ Mudança de maiúsculas para mistas (local)');
    console.log('✅ Palavra "dia" seguida de data');
    console.log('✅ Preposição "com" + complementos');
    console.log('✅ Endereços (Av., Rua, Praça, etc.)');
    console.log('✅ Ano no final + siglas');
    console.log('✅ Repetição de estabelecimentos');
    console.log('✅ Cidades repetidas com datas');

    console.log(chalk.green('\n🚀 Algoritmo de padrões avançados testado!'));
  }
}

const tester = new TestPadroesAvancados();
tester.testarPadroes();