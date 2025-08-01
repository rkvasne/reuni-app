#!/usr/bin/env node

/**
 * Teste dos filtros avançados implementados
 */

const chalk = require('chalk');

class TestFiltrosAvancados {
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
      'fetish', 'bdsm', 'swing', 'orgia',
      
      // Títulos muito genéricos
      'evento', 'show', 'festa', 'encontro'
    ];
  }

  // Detectar conteúdo inadequado por imagem ou descrição
  isConteudoInadequado(evento) {
    const textoCompleto = `${evento.title} ${evento.description || ''}`.toLowerCase();
    
    const palavrasInadequadas = [
      'fuck', 'shit', 'porno', 'sex', 'nude', 'naked',
      'strip', 'adult', 'xxx', 'erotic', 'sensual',
      'fetish', 'bdsm', 'swing', 'orgia', 'putaria',
      'safadeza', 'tesão', 'gostosa', 'gostoso'
    ];
    
    return palavrasInadequadas.some(palavra => textoCompleto.includes(palavra));
  }

  // Detectar se título é apenas cidade/estado
  isTituloApenasCidade(titulo) {
    const tituloLimpo = titulo.trim().toLowerCase();
    
    // Padrões de cidade/estado
    const padroesCidade = [
      /^[a-záàâãéêíóôõúç\s]+,?\s*[a-z]{2}$/i, // "Belém, PA" ou "São Paulo SP"
      /^[a-záàâãéêíóôõúç\s]+\/[a-z]{2}$/i,    // "Belém/PA"
      /^[a-záàâãéêíóôõúç\s]+\s*-\s*[a-z]{2}$/i // "Belém - PA"
    ];
    
    return padroesCidade.some(padrao => padrao.test(tituloLimpo)) || tituloLimpo.length < 5;
  }

  // Detectar se título é apenas nome de pessoa
  isTituloNomePessoa(titulo) {
    const tituloLimpo = titulo.trim();
    
    // Padrões de nome de pessoa
    const padroes = [
      /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+$/,
      /^[A-Z]+\s+[A-Z]+$/
    ];
    
    return padroes.some(padrao => padrao.test(tituloLimpo)) && 
           tituloLimpo.length < 30 && 
           !tituloLimpo.includes('SHOW') && 
           !tituloLimpo.includes('EVENTO');
  }

  // Extrair título real de eventos com nomes genéricos
  extrairTituloReal(evento) {
    const titulo = evento.title;
    const descricao = evento.description || '';
    
    // Se título é apenas cidade, tentar extrair da descrição
    if (this.isTituloApenasCidade(titulo)) {
      // Procurar por padrões de título na descrição
      const padroesTitulo = [
        /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,})/m, // Linha em maiúsculas
        /(?:evento|show|apresenta[çc]ão|curso|workshop|palestra):\s*([^.\n]{10,})/i,
        /^([^.\n]{15,})/m // Primeira linha com mais de 15 caracteres
      ];
      
      for (const padrao of padroesTitulo) {
        const match = descricao.match(padrao);
        if (match && match[1]) {
          const tituloExtraido = match[1].trim();
          if (tituloExtraido.length > 10 && !this.isTituloApenasCidade(tituloExtraido)) {
            return tituloExtraido;
          }
        }
      }
      
      return null; // Descartar se não conseguir extrair título válido
    }
    
    // Se título é nome de pessoa, tentar extrair contexto
    if (this.isTituloNomePessoa(titulo)) {
      const contextoMatch = descricao.match(new RegExp(`(.{10,}?)\\b${titulo}\\b`, 'i'));
      if (contextoMatch && contextoMatch[1]) {
        return `${contextoMatch[1].trim()} COM ${titulo.toUpperCase()}`;
      }
    }
    
    return titulo;
  }

  // Verificar relevância
  isEventoRelevante(titulo) {
    const tituloLower = titulo.toLowerCase();
    const irrelevantes = this.getEventosIrrelevantes();
    
    return !irrelevantes.some(palavra => tituloLower.includes(palavra));
  }

  testarFiltros() {
    console.log(chalk.cyan('\n🔍 Testando Filtros Avançados'));
    console.log(chalk.cyan('═'.repeat(50)));

    const eventosTest = [
      // Casos problemáticos identificados
      {
        title: 'Belém, PA',
        description: 'O LEVANTAR DE UM EXÉRCITO DE MULHERES - Evento especial para mulheres empreendedoras',
        image: 'https://example.com/image1.jpg'
      },
      {
        title: 'RAFAEL ARAGÃO',
        description: 'REI DOS PEÃO COM RAFAEL ARAGÃO - Show sertanejo imperdível',
        image: 'https://example.com/image2.jpg'
      },
      {
        title: 'Curso Presencial',
        description: 'CURSO DE VELAS PERFUMADAS - Aprenda a fazer velas artesanais',
        image: 'https://example.com/image3.jpg'
      },
      {
        title: 'Cintia Chagas',
        description: 'ORATÓRIA DA ELEGANCIA COM CINTIA CHAGAS - Workshop de comunicação',
        image: 'https://example.com/image4.jpg'
      },
      
      // Conteúdo inadequado
      {
        title: 'Festa Fuck Yeah',
        description: 'Balada com muito sexo e diversão',
        image: 'https://example.com/image5.jpg'
      },
      {
        title: 'Show Erótico',
        description: 'Apresentação sensual para adultos',
        image: 'https://example.com/image6.jpg'
      },
      
      // Sem imagem
      {
        title: 'Evento Legal',
        description: 'Descrição do evento',
        image: null
      },
      {
        title: 'Show de Rock',
        description: 'Banda local',
        image: 'placeholder.jpg'
      },
      
      // Eventos válidos
      {
        title: 'FESTIVAL DE MÚSICA BRASILEIRA 2025',
        description: 'Grande festival com artistas nacionais',
        image: 'https://example.com/valid1.jpg'
      }
    ];

    console.log(chalk.yellow('\n📋 Testando cada evento:'));
    console.log('='.repeat(60));

    eventosTest.forEach((evento, index) => {
      console.log(`\n${index + 1}. EVENTO:`);
      console.log(chalk.gray(`📝 Título: ${evento.title}`));
      console.log(chalk.gray(`📄 Descrição: ${evento.description?.substring(0, 50)}...`));
      console.log(chalk.gray(`🖼️ Imagem: ${evento.image || 'SEM IMAGEM'}`));

      // Testes
      const temImagem = evento.image && !evento.image.includes('placeholder');
      const conteudoInadequado = this.isConteudoInadequado(evento);
      const relevante = this.isEventoRelevante(evento.title);
      const apenasCidade = this.isTituloApenasCidade(evento.title);
      const nomePessoa = this.isTituloNomePessoa(evento.title);
      
      let tituloReal = null;
      if (apenasCidade || nomePessoa) {
        tituloReal = this.extrairTituloReal(evento);
      }

      // Resultados
      console.log(chalk.blue('🔍 Análises:'));
      console.log(`  • Tem imagem: ${temImagem ? '✅' : '❌'}`);
      console.log(`  • Conteúdo adequado: ${!conteudoInadequado ? '✅' : '❌'}`);
      console.log(`  • Relevante: ${relevante ? '✅' : '❌'}`);
      console.log(`  • Apenas cidade: ${apenasCidade ? '⚠️ SIM' : '✅ NÃO'}`);
      console.log(`  • Nome pessoa: ${nomePessoa ? '⚠️ SIM' : '✅ NÃO'}`);
      
      if (tituloReal) {
        console.log(chalk.green(`  • Título extraído: "${tituloReal}"`));
      }

      // Decisão final
      const aprovado = temImagem && !conteudoInadequado && relevante && 
                      (tituloReal || (!apenasCidade && !nomePessoa));
      
      console.log(chalk.bold(`🎯 RESULTADO: ${aprovado ? '✅ APROVADO' : '❌ REJEITADO'}`));
      
      if (!aprovado) {
        const motivos = [];
        if (!temImagem) motivos.push('sem imagem');
        if (conteudoInadequado) motivos.push('conteúdo inadequado');
        if (!relevante) motivos.push('irrelevante');
        if (apenasCidade && !tituloReal) motivos.push('título apenas cidade');
        if (nomePessoa && !tituloReal) motivos.push('título apenas nome');
        
        console.log(chalk.red(`   Motivos: ${motivos.join(', ')}`));
      }
    });

    console.log(chalk.cyan('\n📊 Resumo dos Testes:'));
    console.log('='.repeat(40));
    
    const aprovados = eventosTest.filter(evento => {
      const temImagem = evento.image && !evento.image.includes('placeholder');
      const conteudoInadequado = this.isConteudoInadequado(evento);
      const relevante = this.isEventoRelevante(evento.title);
      const apenasCidade = this.isTituloApenasCidade(evento.title);
      const nomePessoa = this.isTituloNomePessoa(evento.title);
      const tituloReal = (apenasCidade || nomePessoa) ? this.extrairTituloReal(evento) : true;
      
      return temImagem && !conteudoInadequado && relevante && 
             (tituloReal || (!apenasCidade && !nomePessoa));
    });

    console.log(chalk.green(`✅ Eventos aprovados: ${aprovados.length}/${eventosTest.length}`));
    console.log(chalk.red(`❌ Eventos rejeitados: ${eventosTest.length - aprovados.length}/${eventosTest.length}`));
    console.log(chalk.blue(`📈 Taxa de filtragem: ${((eventosTest.length - aprovados.length) / eventosTest.length * 100).toFixed(1)}%`));

    console.log(chalk.yellow('\n🎯 Filtros Implementados:'));
    console.log('✅ Rejeição de conteúdo inadequado (palavrões, sexo)');
    console.log('✅ Obrigatoriedade de imagem válida');
    console.log('✅ Extração de títulos reais de eventos genéricos');
    console.log('✅ Detecção de títulos apenas cidade/estado');
    console.log('✅ Detecção de títulos apenas nome de pessoa');
    console.log('✅ Validação de tamanho mínimo de título');

    console.log(chalk.green('\n🎉 Testes de filtros concluídos!'));
  }
}

const tester = new TestFiltrosAvancados();
tester.testarFiltros();