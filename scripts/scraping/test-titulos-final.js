const chalk = require('chalk');

// Função simplificada para testar apenas aplicarPadroesDeCorte
function aplicarPadroesDeCorte(titulo) {
  if (!titulo) return '';
  let tituloProcessado = titulo;

  // 1. Padrão: Mudança de MAIÚSCULAS para Mistas (indica local)
  const padraoMudancaCaixa = /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?)([A-Z][a-záàâãéêíóôõúç].*)$/;
  const matchCaixa = titulo.match(padraoMudancaCaixa);
  if (matchCaixa && matchCaixa[1].trim().length >= 10) {
    tituloProcessado = matchCaixa[1].trim();
  }

  // 2. Padrão: Palavra "dia" seguida de data
  const padraoDia = /^(.+?)\s+dia\s+\d{1,2}.*$/i;
  const matchDia = tituloProcessado.match(padraoDia);
  if (matchDia && matchDia[1].trim().length >= 8) {
    tituloProcessado = matchDia[1].trim();
  }

  // 3. Padrão: Preposição "com" seguida de complementos
  const padraoCom = /^(.+?)\s+com\s+[A-Z].*$/i;
  const matchCom = tituloProcessado.match(padraoCom);
  if (matchCom && matchCom[1].trim().length >= 10) {
    tituloProcessado = matchCom[1].trim();
  }

  // 4. Padrão: Endereços e Locais
  const padraoEndereco = /^(.+?)(Av\.|Rua|R\.|Alameda|Travessa|Praça|Igreja|Clube|Estádio|Arena|Centro|Ginásio|Bar|Teatro|Rodovia|BR|Pub|Universidade|Espaço|Restaurante|Hotel|Beco|Porão|Cervejaria|Largo|Hall|Galpão|Rancho).*$/i;
  const matchEndereco = tituloProcessado.match(padraoEndereco);
  if (matchEndereco && matchEndereco[1].trim().length >= 10) {
    tituloProcessado = matchEndereco[1].trim();
  }

  // 5. Padrão: Ano no final
  const padraoAnoFinal = /^(.+20\d{2})[A-Z]{2,}.*$/;
  const matchAnoFinal = tituloProcessado.match(padraoAnoFinal);
  if (matchAnoFinal && matchAnoFinal[1].trim().length >= 15) {
    tituloProcessado = matchAnoFinal[1].trim();
  }

  // 6. NOVO: Padrão para detectar partes de local que estão sendo incluídas no título
  // 6.1. Padrão: Ausência de espaço entre palavras (múltiplas abordagens)
  
  // Abordagem 1: Locais conhecidos sem espaço
  const locaisEspecificos = [
    'Sesi', 'Teatro', 'Bar', 'Pub', 'Hotel', 'Restaurante', 'Clube', 
    'Igreja', 'Centro', 'Espaço', 'Arena', 'Estádio', 'Ginásio', 
    'Cervejaria', 'Beco', 'Porão', 'Largo', 'Hall', 'Galpão', 
    'Rancho', 'Concha', 'Hostel', 'Universidade', 'Academia', 'Plaza'
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
  

  
  // Abordagem 3: Mudança de caixa no meio da palavra (ex: "MesuraMoto") - DEVE VIR DEPOIS dos casos específicos
  const padraoMudancaCaixaMeio = /^(.+?)([a-z][A-Z][a-z]+.*)$/;
  const matchMudancaCaixaMeio = tituloProcessado.match(padraoMudancaCaixaMeio);
  if (matchMudancaCaixaMeio && matchMudancaCaixaMeio[1].trim().length >= 10) {
    tituloProcessado = matchMudancaCaixaMeio[1].trim();
  }
  
  // Abordagem 4: Ponto seguido de local (ex: "II SIMPÓSIO RONDONIENSE DE CIRURGIA BUCOMAXILO.Golden Plaza")
  const padraoPontoLocal = /^(.+?)\.([A-Z][a-záàâãéêíóôõúç\s]+)$/;
  const matchPontoLocal = tituloProcessado.match(padraoPontoLocal);
  if (matchPontoLocal && matchPontoLocal[1].trim().length >= 10) {
    tituloProcessado = matchPontoLocal[1].trim();
  }
  

  
  // 7. NOVO: Padrão: Siglas de estado/cidade no final sem espaço
  const padraoSiglaFinal = /^(.+?)([A-Z]{2,3})\s*$/;
  const matchSiglaFinal = tituloProcessado.match(padraoSiglaFinal);
  if (matchSiglaFinal && matchSiglaFinal[1].trim().length >= 10) {
    const sigla = matchSiglaFinal[2];
    if (['BH', 'SP', 'RJ', 'MG', 'RS', 'SC', 'PR', 'BA', 'CE', 'PE', 'GO', 'MT', 'MS', 'PA', 'AM', 'AC', 'RO', 'RR', 'AP', 'TO', 'PI', 'MA', 'RN', 'PB', 'AL', 'SE'].includes(sigla)) {
      tituloProcessado = matchSiglaFinal[1].trim();
    }
  }
  


  // 8. NOVO: Padrão para limpar hífens duplos e caracteres estranhos
  tituloProcessado = tituloProcessado.replace(/[-–—]+\s*[-–—]+\s*$/, '');
  tituloProcessado = tituloProcessado.replace(/[-–—]+\s*\d+\s*$/, '');
  tituloProcessado = tituloProcessado.replace(/\s+[-–—]+\s*$/, '');
  tituloProcessado = tituloProcessado.replace(/[-–—]+\s*$/, '');
  
  tituloProcessado = tituloProcessado.replace(/\s+/g, ' ').trim();
  tituloProcessado = tituloProcessado.replace(/[^\w\s\-–—~@#$%&*()\[\]{}|\\:;"'<>,.?/áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
  tituloProcessado = tituloProcessado.replace(/\s+/g, ' ').trim();

  // 9. NOVO: Padrão para detectar quando o local está sendo incluído incorretamente
  const padraoMaisLocal = /^(.+?)\s+\+\s+([A-Z][a-záàâãéêíóôõúç\s]+)$/;
  const matchMaisLocal = tituloProcessado.match(padraoMaisLocal);
  if (matchMaisLocal && matchMaisLocal[1].trim().length >= 8) {
    const parteEvento = matchMaisLocal[1].trim();
    const parteLocal = matchMaisLocal[2].trim();
    
    const palavrasLocalComuns = ['Moto', 'Li', 'Bar', 'Pub', 'Teatro', 'Centro', 'Espaço', 'Arena', 'Clube', 'Restaurante', 'Hotel', 'Municipal'];
    const pareceLocal = palavrasLocalComuns.some(palavra => 
      parteLocal.toLowerCase().includes(palavra.toLowerCase())
    );
    
    if (pareceLocal) {
      tituloProcessado = parteEvento;
    }
  }

  return tituloProcessado;
}

// Casos de teste específicos mencionados pelo usuário
const casosTeste = [
  {
    titulo: "Só no Sapatinho ~ Karenzinha + MesuraMoto Li",
    esperado: "Só no Sapatinho ~ Karenzinha + Mesura"
  },
  {
    titulo: "REBEL XX com Allan Natal e Ian Padilha- - 02",
    esperado: "REBEL XX com Allan Natal e Ian Padilha"
  },
  {
    titulo: "WARUNG TOUR BELO HORIZONTEBH",
    esperado: "WARUNG TOUR BELO HORIZONTE"
  },
  {
    titulo: "Festival de Música + Teatro Municipal",
    esperado: "Festival de Música"
  },
  {
    titulo: "Show de RockSP",
    esperado: "Show de Rock"
  },
  {
    titulo: "Oswaldo Montenegro Cele",
    esperado: "Oswaldo Montenegro Cele"
  },
  {
    titulo: "II SIMPÓSIO RONDONIENSE DE CIRURGIA BUCOMAXILO.Golden Plaza",
    esperado: "II SIMPÓSIO RONDONIENSE DE CIRURGIA BUCOMAXILO"
  }
];

// Executar testes
console.log(chalk.blue('\n🧪 TESTE FINAL - MELHORIAS NA GERAÇÃO DE TÍTULOS\n'));

casosTeste.forEach((caso, index) => {
  console.log(chalk.yellow(`\n📋 Caso ${index + 1}:`));
  console.log(chalk.gray(`Título original: "${caso.titulo}"`));
  console.log(chalk.gray(`Esperado: "${caso.esperado}"`));
  
  const resultado = aplicarPadroesDeCorte(caso.titulo);
  
  console.log(chalk.green(`✅ Título processado: "${resultado}"`));
  
  if (resultado === caso.esperado) {
    console.log(chalk.green(`✅ CORRETO! Resultado igual ao esperado`));
  } else {
    console.log(chalk.red(`❌ DIFERENTE! Resultado não corresponde ao esperado`));
  }
});

console.log(chalk.blue('\n✨ Teste final concluído!\n')); 