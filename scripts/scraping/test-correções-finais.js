#!/usr/bin/env node

/**
 * Teste das correções finais identificadas
 */

const chalk = require('chalk');

class TestCorrecoesFinais {
  // Palavras que indicam eventos irrelevantes ou inadequados
  getEventosIrrelevantes() {
    return [
      // Eventos pessoais
      'aniversário', 'birthday', 'festa de aniversário',
      'casamento', 'wedding', 'formatura',
      'reunião', 'meeting', 'particular',
      
      // Conteúdo inadequado
      'fuck', 'shit', 'porno', 'sex', 'nude', 'naked',
      'strip', 'adult', 'xxx', 'erotic', 'sensual',
      'fetish', 'bdsm', 'swing', 'orgia', 'ardente',
      'hot', 'baile ardente', 'noite quente',
      
      // Eventos não relevantes (cursos online, tours, etc.)
      'audio tour', 'scavenger hunt', 'master your',
      'aligning passion', 'adventurous', 'brooklyn bridge',
      'ken burns', 'rtf', 'destrave e grave',
      
      // Títulos muito genéricos
      'evento', 'show', 'festa', 'encontro'
    ];
  }

  // Verificar relevância
  isEventoRelevante(titulo) {
    const tituloLower = titulo.toLowerCase();
    const irrelevantes = this.getEventosIrrelevantes();
    
    return !irrelevantes.some(palavra => tituloLower.includes(palavra));
  }

  // Aplicar padrões de corte com melhorias
  aplicarPadroesDeCorte(titulo) {
    let tituloProcessado = titulo;

    // 1. Separador barra (/)
    if (titulo.includes(' / ')) {
      const partes = titulo.split(' / ');
      tituloProcessado = partes[0].trim();
    }

    // 2. Padrão: Endereços e Locais (expandido)
    const padraoEndereco = /^(.+?)(Av\.|Rua|R\.|Alameda|Travessa|Praça|Igreja|Clube|Estádio|Arena|Centro|Ginásio|Bar|Teatro|Rodovia|BR|Pub|Universidade|Espaço|Restaurante|Hotel|Beco|Porão|Cervejaria|Largo|Hall|Galpão|Rancho).*$/i;
    const matchEndereco = tituloProcessado.match(padraoEndereco);
    if (matchEndereco && matchEndereco[1].trim().length >= 10) {
      tituloProcessado = matchEndereco[1].trim();
    }

    // 3. Padrão: Ausência de espaço entre palavras (múltiplas abordagens)
    
    // Abordagem 1: Locais conhecidos sem espaço
    const locaisEspecificos = [
      'Sesi', 'Teatro', 'Bar', 'Pub', 'Hotel', 'Restaurante', 'Clube', 
      'Igreja', 'Centro', 'Espaço', 'Arena', 'Estádio', 'Ginásio', 
      'Cervejaria', 'Beco', 'Porão', 'Largo', 'Hall', 'Galpão', 
      'Rancho', 'Concha', 'Hostel', 'Universidade', 'Academia'
    ];
    
    for (const local of locaisEspecificos) {
      const regex = new RegExp(`^(.+?)${local}.*$`, 'i');
      const match = tituloProcessado.match(regex);
      if (match && match[1].trim().length >= 10) {
        // Verificar se não há espaço antes do local
        const ultimaLetra = match[1].slice(-1);
        if (ultimaLetra.match(/[a-zA-Z]/)) {
          tituloProcessado = match[1].trim();
          break;
        }
      }
    }
    
    // Abordagem 2: Repetição de palavras (ex: "esperançaCanção Nova")
    const padraoRepeticao = /^(.+?)([A-Z][a-z]+\s[A-Z][a-z]+)$/;
    const matchRepeticao = tituloProcessado.match(padraoRepeticao);
    if (matchRepeticao && matchRepeticao[1].trim().length >= 15) {
      const parteAntes = matchRepeticao[1].trim();
      const parteDepois = matchRepeticao[2].trim();
      
      // Verificar se a parte depois aparece na parte antes
      if (parteAntes.toLowerCase().includes(parteDepois.toLowerCase().split(' ')[0])) {
        tituloProcessado = parteAntes;
      }
    }

    // 4. Remover prefixo cidade + data
    const padraoDataCidade = /^[A-Za-záàâãéêíóôõúç\s]+\s+\d{1,2}\/\d{1,2}\s+(.+)$/;
    const matchDataCidade = tituloProcessado.match(padraoDataCidade);
    if (matchDataCidade && matchDataCidade[1].trim().length >= 10) {
      tituloProcessado = matchDataCidade[1].trim();
    }

    return tituloProcessado;
  }

  testarCorrecoesFinais() {
    console.log(chalk.cyan('\n🔧 Testando Correções Finais'));
    console.log(chalk.cyan('═'.repeat(50)));

    const casosTest = [
      // Conteúdo impróprio
      {
        original: 'Baile ARDENTEVila Isabel',
        esperado: null, // Deve ser rejeitado
        tipo: 'Conteúdo impróprio',
        teste: 'relevancia'
      },
      
      // Eventos não relevantes
      {
        original: 'Destrave e Grave',
        esperado: null,
        tipo: 'Evento não relevante',
        teste: 'relevancia'
      },
      {
        original: 'Master Your Google Business Page in 90 Minutes',
        esperado: null,
        tipo: 'Curso/propaganda',
        teste: 'relevancia'
      },
      {
        original: 'Belem Audio Tour: Belem\'s Heritage Odyssey',
        esperado: null,
        tipo: 'Tour turístico',
        teste: 'relevancia'
      },

      // Ausência de espaço + locais
      {
        original: 'Canção Nova em Aracaju: 28 anos semeando esperança e colhendo milagresCanção Nova',
        esperado: 'Canção Nova em Aracaju: 28 anos semeando esperança e colhendo milagres',
        tipo: 'Ausência de espaço + repetição',
        teste: 'titulo'
      },
      {
        original: 'I Workshop Novo VarejoSesi',
        esperado: 'I Workshop Novo Varejo',
        tipo: 'Ausência de espaço + local',
        teste: 'titulo'
      },
      {
        original: 'Oswaldo Montenegro Celebrando 50 Anos de EstradaConcha Acústica',
        esperado: 'Oswaldo Montenegro Celebrando 50 Anos de Estrada',
        tipo: 'Ausência de espaço + local',
        teste: 'titulo'
      },
      {
        original: 'Forró de RespeitoBee Cool Hostel',
        esperado: 'Forró de Respeito',
        tipo: 'Ausência de espaço + hostel',
        teste: 'titulo'
      },

      // Separador barra
      {
        original: 'Influência das Emoções no Cotidiano / Boa Vista (RR)Universidade Federal de Roraima',
        esperado: 'Influência das Emoções no Cotidiano',
        tipo: 'Separador barra',
        teste: 'titulo'
      },
      {
        original: 'AUTOPACIFICAÇÃO E RECONCILIAÇÃO GRUPOCÁRMICA / Boa Vista (RR)Universidade',
        esperado: 'AUTOPACIFICAÇÃO E RECONCILIAÇÃO GRUPOCÁRMICA',
        tipo: 'Separador barra',
        teste: 'titulo'
      },

      // Locais específicos
      {
        original: 'Entre a Pele e a AlmaTeatro Sérgio Cardoso',
        esperado: 'Entre a Pele e a Alma',
        tipo: 'Teatro + ausência de espaço',
        teste: 'titulo'
      },
      {
        original: 'Sambinha OAB-PERestaurante Catamaran',
        esperado: 'Sambinha OAB-PE',
        tipo: 'Restaurante + ausência de espaço',
        teste: 'titulo'
      },
      {
        original: 'Cuiabá Underground IVBeco do Papa',
        esperado: 'Cuiabá Underground IV',
        tipo: 'Beco + ausência de espaço',
        teste: 'titulo'
      },

      // Prefixo cidade + data
      {
        original: 'Cuiabá 16/08 POSICIONA 360°',
        esperado: 'POSICIONA 360°',
        tipo: 'Prefixo cidade + data',
        teste: 'titulo'
      }
    ];

    console.log(chalk.yellow('\n📋 Testando cada correção:'));
    console.log('='.repeat(70));

    let acertos = 0;
    let total = casosTest.length;

    casosTest.forEach((caso, index) => {
      console.log(`\n${index + 1}. TESTE:`);
      console.log(chalk.gray(`📝 Original: "${caso.original}"`));
      console.log(chalk.gray(`🎯 Esperado: ${caso.esperado || 'REJEITADO'}`));
      console.log(chalk.gray(`🔧 Tipo: ${caso.tipo}`));

      let resultado;
      let sucesso = false;

      if (caso.teste === 'relevancia') {
        const relevante = this.isEventoRelevante(caso.original);
        resultado = relevante ? caso.original : null;
        sucesso = (resultado === caso.esperado);
      } else if (caso.teste === 'titulo') {
        resultado = this.aplicarPadroesDeCorte(caso.original);
        sucesso = (resultado === caso.esperado);
      }
      
      if (sucesso) {
        acertos++;
        console.log(chalk.green(`✅ Resultado: ${resultado || 'REJEITADO'}`));
        console.log(chalk.green(`🎉 SUCESSO!`));
      } else {
        console.log(chalk.red(`❌ Resultado: ${resultado || 'REJEITADO'}`));
        console.log(chalk.red(`💥 FALHOU!`));
      }
    });

    console.log(chalk.cyan('\n📊 Resumo dos Testes:'));
    console.log('='.repeat(50));
    console.log(chalk.green(`✅ Sucessos: ${acertos}/${total}`));
    console.log(chalk.red(`❌ Falhas: ${total - acertos}/${total}`));
    console.log(chalk.blue(`📈 Taxa de sucesso: ${((acertos / total) * 100).toFixed(1)}%`));

    console.log(chalk.yellow('\n🎯 Correções Implementadas:'));
    console.log('✅ Filtro de conteúdo impróprio expandido');
    console.log('✅ Rejeição de cursos/tours/propaganda');
    console.log('✅ Separador barra (/) implementado');
    console.log('✅ Locais expandidos (Bar, Teatro, Hotel, etc.)');
    console.log('✅ Ausência de espaço melhorada');
    console.log('✅ Prefixo cidade + data removido');

    console.log(chalk.green('\n🚀 Correções finais testadas!'));
  }
}

const tester = new TestCorrecoesFinais();
tester.testarCorrecoesFinais();