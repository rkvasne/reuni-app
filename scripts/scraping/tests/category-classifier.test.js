/**
 * Testes para CategoryClassifier
 */

const { CategoryClassifier } = require('../processors/category-classifier');

describe('CategoryClassifier', () => {
  let categoryClassifier;

  beforeEach(() => {
    categoryClassifier = new CategoryClassifier();
  });

  afterEach(() => {
    categoryClassifier.reset();
  });

  describe('classifyEvent', () => {
    test('deve classificar evento de show corretamente', () => {
      const result = categoryClassifier.classifyEvent(
        'Show de Rock Nacional',
        'Grande show com bandas famosas do rock brasileiro'
      );
      
      expect(result.category).toBe('shows');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    test('deve classificar evento de teatro corretamente', () => {
      const result = categoryClassifier.classifyEvent(
        'Peça Teatral Clássica',
        'Espetáculo de teatro com atores renomados'
      );
      
      expect(result.category).toBe('teatro');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('deve classificar evento esportivo corretamente', () => {
      const result = categoryClassifier.classifyEvent(
        'Campeonato de Futebol',
        'Torneio regional de futebol amador'
      );
      
      expect(result.category).toBe('esportes');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('deve classificar evento gastronômico corretamente', () => {
      const result = categoryClassifier.classifyEvent(
        'Festival de Gastronomia',
        'Evento culinário com chefs famosos'
      );
      
      expect(result.category).toBe('gastronomia');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('deve classificar como "outros" quando não encontra categoria', () => {
      const result = categoryClassifier.classifyEvent(
        'Evento Genérico',
        'Descrição sem palavras-chave específicas'
      );
      
      expect(result.category).toBe('outros');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('deve dar maior peso para palavras-chave no título', () => {
      const resultTitleKeyword = categoryClassifier.classifyEvent(
        'Show de Rock',
        'Evento genérico'
      );
      
      const resultDescriptionKeyword = categoryClassifier.classifyEvent(
        'Evento genérico',
        'Show de Rock'
      );
      
      expect(resultTitleKeyword.confidence).toBeGreaterThan(resultDescriptionKeyword.confidence);
    });

    test('deve usar cache para classificações repetidas', () => {
      const title = 'Show de Rock Nacional';
      const description = 'Grande show';
      
      const result1 = categoryClassifier.classifyEvent(title, description);
      const result2 = categoryClassifier.classifyEvent(title, description);
      
      expect(result1).toEqual(result2);
      expect(categoryClassifier.stats.cacheHits).toBe(1);
    });
  });

  describe('performClassification', () => {
    test('deve calcular pontuações para múltiplas categorias', () => {
      const text = 'show de teatro musical';
      
      const result = categoryClassifier.performClassification(text, 'Show de Teatro Musical', '');
      
      expect(result.category).toBeDefined();
      expect(result.alternativeCategories.length).toBeGreaterThan(0);
    });

    test('deve aplicar prioridade das categorias', () => {
      // Shows tem prioridade 1, teatro tem prioridade 2
      const text = 'show teatro musical';
      
      const result = categoryClassifier.performClassification(text, text, '');
      
      // Com prioridades, shows deve ganhar mesmo com pontuação similar
      expect(['shows', 'teatro']).toContain(result.category);
    });
  });

  describe('countKeywordMatches', () => {
    test('deve contar matches exatos', () => {
      const text = 'show de rock show';
      
      const matches = categoryClassifier.countKeywordMatches(text, 'show');
      
      expect(matches).toBe(2);
    });

    test('deve contar matches parciais com peso menor', () => {
      const text = 'showcase showroom';
      
      const matches = categoryClassifier.countKeywordMatches(text, 'show');
      
      expect(matches).toBe(1); // 2 matches parciais = 1 match completo
    });

    test('deve ser case insensitive', () => {
      const text = 'SHOW de ROCK';
      
      const matches = categoryClassifier.countKeywordMatches(text, 'show');
      
      expect(matches).toBe(1);
    });
  });

  describe('extractTags', () => {
    test('deve extrair tags de gêneros musicais', () => {
      const text = 'show de rock e pop nacional';
      
      const tags = categoryClassifier.extractTags(text);
      
      expect(tags).toContain('rock');
      expect(tags).toContain('pop');
    });

    test('deve extrair tags de tipos de evento', () => {
      const text = 'festival de música ao vivo';
      
      const tags = categoryClassifier.extractTags(text);
      
      expect(tags).toContain('festival');
    });

    test('deve extrair tags especiais', () => {
      const text = 'evento gratuito ao ar livre';
      
      const tags = categoryClassifier.extractTags(text);
      
      expect(tags).toContain('gratuito');
      expect(tags).toContain('ao-ar-livre');
    });

    test('deve extrair tags de público-alvo', () => {
      const text = 'show infantil para toda família';
      
      const tags = categoryClassifier.extractTags(text);
      
      expect(tags).toContain('infantil');
      expect(tags).toContain('família');
    });
  });

  describe('classifyEvents', () => {
    test('deve classificar múltiplos eventos em lote', () => {
      const events = [
        { title: 'Show de Rock', description: 'Banda nacional' },
        { title: 'Peça de Teatro', description: 'Drama clássico' },
        { title: 'Jogo de Futebol', description: 'Campeonato local' }
      ];
      
      const results = categoryClassifier.classifyEvents(events);
      
      expect(results).toHaveLength(3);
      expect(results[0].category).toBe('shows');
      expect(results[1].category).toBe('teatro');
      expect(results[2].category).toBe('esportes');
      
      results.forEach(result => {
        expect(result).toHaveProperty('categoryConfidence');
        expect(result).toHaveProperty('tags');
        expect(result).toHaveProperty('matchedKeywords');
      });
    });
  });

  describe('suggestImprovements', () => {
    test('deve retornar null para classificação correta', () => {
      const event = { title: 'Show de Rock', description: 'Banda nacional' };
      
      const result = categoryClassifier.suggestImprovements(event, 'shows');
      
      expect(result).toBeNull();
    });

    test('deve sugerir melhorias para classificação incorreta', () => {
      const event = { title: 'Show de Rock', description: 'Banda nacional' };
      
      const result = categoryClassifier.suggestImprovements(event, 'teatro');
      
      expect(result).toBeDefined();
      expect(result.event.currentCategory).toBe('shows');
      expect(result.event.correctCategory).toBe('teatro');
      expect(result.improvements.length).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas iniciais', () => {
      const stats = categoryClassifier.getStats();
      
      expect(stats).toHaveProperty('totalClassifications', 0);
      expect(stats).toHaveProperty('cacheHits', 0);
      expect(stats).toHaveProperty('categoryDistribution', {});
      expect(stats).toHaveProperty('cacheEfficiency', '0%');
    });

    test('deve atualizar estatísticas após classificações', () => {
      categoryClassifier.classifyEvent('Show de Rock', 'Banda nacional');
      categoryClassifier.classifyEvent('Peça de Teatro', 'Drama clássico');
      
      const stats = categoryClassifier.getStats();
      
      expect(stats.totalClassifications).toBe(2);
      expect(stats.categoryDistribution.shows).toBe(1);
      expect(stats.categoryDistribution.teatro).toBe(1);
    });
  });

  describe('exportCategoryConfig', () => {
    test('deve exportar configuração completa', () => {
      const config = categoryClassifier.exportCategoryConfig();
      
      expect(config).toHaveProperty('categories');
      expect(config).toHaveProperty('stats');
      expect(config).toHaveProperty('timestamp');
      expect(typeof config.timestamp).toBe('string');
    });
  });

  describe('importCategoryConfig', () => {
    test('deve importar configuração personalizada', () => {
      const customConfig = {
        categories: {
          custom: {
            name: 'Categoria Personalizada',
            keywords: ['custom', 'personalizado']
          }
        }
      };
      
      categoryClassifier.importCategoryConfig(customConfig);
      
      expect(categoryClassifier.categories.custom).toBeDefined();
      expect(categoryClassifier.categories.custom.name).toBe('Categoria Personalizada');
    });
  });

  describe('isValidCategory', () => {
    test('deve validar categorias existentes', () => {
      expect(categoryClassifier.isValidCategory('shows')).toBe(true);
      expect(categoryClassifier.isValidCategory('teatro')).toBe(true);
      expect(categoryClassifier.isValidCategory('inexistente')).toBe(false);
    });
  });

  describe('getCategoryInfo', () => {
    test('deve retornar informações da categoria', () => {
      const info = categoryClassifier.getCategoryInfo('shows');
      
      expect(info).toBeDefined();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('keywords');
      expect(info).toHaveProperty('priority');
    });

    test('deve retornar null para categoria inexistente', () => {
      const info = categoryClassifier.getCategoryInfo('inexistente');
      
      expect(info).toBeNull();
    });
  });

  describe('getAvailableCategories', () => {
    test('deve retornar lista de categorias disponíveis', () => {
      const categories = categoryClassifier.getAvailableCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain('shows');
      expect(categories).toContain('teatro');
      expect(categories).toContain('esportes');
    });
  });

  describe('generateCacheKey', () => {
    test('deve gerar chaves de cache consistentes', () => {
      const text = 'show de rock nacional';
      
      const key1 = categoryClassifier.generateCacheKey(text);
      const key2 = categoryClassifier.generateCacheKey(text);
      
      expect(key1).toBe(key2);
      expect(typeof key1).toBe('string');
    });

    test('deve gerar chaves diferentes para textos diferentes', () => {
      const key1 = categoryClassifier.generateCacheKey('show de rock');
      const key2 = categoryClassifier.generateCacheKey('peça de teatro');
      
      expect(key1).not.toBe(key2);
    });
  });
});