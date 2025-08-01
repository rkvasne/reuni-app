/**
 * Script de teste para verificar melhorias no scraping
 * 
 * Testa as correções implementadas:
 * - Parsing de datas melhorado
 * - Filtragem de eventos irrelevantes
 * - Foco em Rondônia e capitais
 * - Geração de títulos melhorada
 */

const { SymplaScraper } = require('./scrapers/sympla-scraper');
const config = require('./utils/config');

async function testScrapingMelhorado() {
  console.log('🧪 Testando scraping melhorado...\n');
  
  try {
    // Inicializar scraper
    const scraper = new SymplaScraper(config.scrapers.sympla);
    
    // Testar parsing de datas
    console.log('📅 Testando parsing de datas...');
    const datasTeste = [
      '30 de nov',
      '17/08/2024',
      '17/08',
      '15 de dezembro de 2024',
      '25 Jan 2025',
      '2024-12-31',
      '31-12-2024',
      'seg, 15 de jan às 20h',
      'ter, 20 de fev às 19h30'
    ];
    
    for (const data of datasTeste) {
      const resultado = scraper.parseEventDate(data);
      console.log(`  "${data}" → ${resultado ? new Date(resultado).toLocaleDateString('pt-BR') : 'null'}`);
    }
    
    console.log('\n🏙️ Testando filtros de eventos...');
    
    // Testar filtros de eventos irrelevantes
    const eventosTeste = [
      { title: 'Show com João Silva', description: 'Apresentação musical' },
      { title: 'Ji-Paraná', description: 'Evento na cidade' },
      { title: 'Teste de Evento', description: 'Evento de teste' },
      { title: 'Workshop de Marketing', description: 'Curso profissional' },
      { title: 'Festa de Aniversário', description: 'Celebração particular' },
      { title: 'Show Nacional', description: 'Apresentação de artista famoso' }
    ];
    
    for (const evento of eventosTeste) {
      const relevante = !config.scrapers.sympla.qualityFilters.excludeKeywords.some(
        palavra => evento.title.toLowerCase().includes(palavra.toLowerCase())
      );
      console.log(`  "${evento.title}" → ${relevante ? '✅ Relevante' : '❌ Irrelevante'}`);
    }
    
    console.log('\n🎯 Testando geração de títulos...');
    
    // Testar geração de títulos
    const titulosTeste = [
      { title: 'Ji-Paraná', description: 'SHOW COM BANDA XYZ - Apresentação musical incrível', location: 'Teatro Municipal' },
      { title: 'João Silva', description: 'Apresentação musical com João Silva', location: 'Casa de Show' },
      { title: 'Evento', description: 'Workshop de Marketing Digital', location: 'Centro de Eventos' },
      { title: 'Show', description: 'Festival de Música com várias bandas', location: 'Arena' }
    ];
    
    // Simular função de extração de título
    function extrairTituloTeste(evento) {
      const titulo = evento.title;
      const descricao = evento.description || '';
      const local = evento.location || '';
      
      // Se título é apenas cidade, tentar extrair da descrição
      if (titulo.length < 15 && titulo.includes('-')) {
        const match = descricao.match(/^([A-Z][A-Z\s\d]{10,})/m);
        if (match && match[1]) {
          return match[1].trim();
        }
        
        if (local && local !== titulo) {
          return `${titulo} - ${local}`;
        }
      }
      
      // Se título é nome de pessoa
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(titulo)) {
        if (descricao.toLowerCase().includes('show')) {
          return `SHOW COM ${titulo.toUpperCase()}`;
        }
        return `APRESENTAÇÃO COM ${titulo.toUpperCase()}`;
      }
      
      // Se título é muito genérico
      if (['evento', 'show'].includes(titulo.toLowerCase())) {
        const tipos = ['workshop', 'festival', 'apresentação'];
        for (const tipo of tipos) {
          if (descricao.toLowerCase().includes(tipo)) {
            return `${titulo} - ${tipo.toUpperCase()}`;
          }
        }
      }
      
      return titulo;
    }
    
    for (const evento of titulosTeste) {
      const tituloMelhorado = extrairTituloTeste(evento);
      console.log(`  "${evento.title}" → "${tituloMelhorado}"`);
    }
    
    console.log('\n✅ Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante testes:', error);
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  testScrapingMelhorado();
}

module.exports = { testScrapingMelhorado }; 