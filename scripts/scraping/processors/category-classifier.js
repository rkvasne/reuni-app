/**
 * Classificador de Categorias
 * 
 * Classifica automaticamente eventos em categorias
 * baseado em palavras-chave e padrões.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { Logger } = require('../utils/logger');
const config = require('../utils/config');

class CategoryClassifier {
  constructor() {
    this.logger = new Logger('category-classifier');
    this.categories = config.categories;
    
    // Cache para melhorar performance
    this.classificationCache = new Map();
    
    // Estatísticas
    this.stats = {
      totalClassifications: 0,
      cacheHits: 0,
      categoryDistribution: {}
    };
  }

  /**
   * Classifica um evento em uma categoria
   */
  classifyEvent(title, description = '') {
    const text = `${title} ${description}`.toLowerCase().trim();
    
    // Verifica cache primeiro
    const cacheKey = this.generateCacheKey(text);
    if (this.classificationCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.classificationCache.get(cacheKey);
    }
    
    this.stats.totalClassifications++;
    
    // Classifica baseado em palavras-chave
    const classification = this.performClassification(text, title, description);
    
    // Atualiza estatísticas
    this.updateCategoryStats(classification.category);
    
    // Salva no cache
    this.classificationCache.set(cacheKey, classification);
    
    this.logger.debug(`Evento "${title}" classificado como "${classification.category}" (confiança: ${classification.confidence})`);
    
    return classification;
  }

  /**
   * Realiza a classificação baseada em palavras-chave
   */
  performClassification(text, title, description) {
    const scores = {};
    const matchedKeywords = {};
    
    // Calcula pontuação para cada categoria
    for (const [categoryKey, categoryData] of Object.entries(this.categories)) {
      scores[categoryKey] = 0;
      matchedKeywords[categoryKey] = [];
      
      for (const keyword of categoryData.keywords) {
        const keywordLower = keyword.toLowerCase();
        const matches = this.countKeywordMatches(text, keywordLower);
        
        if (matches > 0) {
          // Pontuação baseada na frequência e posição
          let keywordScore = matches;
          
          // Bonus se aparecer no título (mais importante)
          if (title.toLowerCase().includes(keywordLower)) {
            keywordScore *= 2;
          }
          
          // Bonus para palavras-chave mais específicas (mais longas)
          if (keyword.length > 5) {
            keywordScore *= 1.5;
          }
          
          scores[categoryKey] += keywordScore;
          matchedKeywords[categoryKey].push({
            keyword,
            matches,
            score: keywordScore
          });
        }
      }
      
      // Aplica prioridade da categoria
      if (scores[categoryKey] > 0) {
        scores[categoryKey] *= (10 - categoryData.priority) / 10;
      }
    }
    
    // Encontra a categoria com maior pontuação
    const sortedCategories = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedCategories.length === 0) {
      return {
        category: 'outros',
        confidence: 0.1,
        matchedKeywords: [],
        alternativeCategories: [],
        tags: this.extractTags(text)
      };
    }
    
    const [bestCategory, bestScore] = sortedCategories[0];
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = Math.min(bestScore / Math.max(totalScore, 1), 1);
    
    // Categorias alternativas (com pontuação significativa)
    const alternatives = sortedCategories
      .slice(1, 3)
      .filter(([_, score]) => score >= bestScore * 0.3)
      .map(([category, score]) => ({
        category,
        confidence: score / totalScore
      }));
    
    return {
      category: bestCategory,
      confidence: Math.round(confidence * 100) / 100,
      matchedKeywords: matchedKeywords[bestCategory] || [],
      alternativeCategories: alternatives,
      tags: this.extractTags(text)
    };
  }

  /**
   * Conta ocorrências de uma palavra-chave no texto
   */
  countKeywordMatches(text, keyword) {
    // Busca exata
    const exactMatches = (text.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
    
    // Busca parcial (para palavras compostas)
    const partialMatches = (text.match(new RegExp(keyword, 'gi')) || []).length - exactMatches;
    
    return exactMatches + (partialMatches * 0.5);
  }

  /**
   * Extrai tags automáticas do texto
   */
  extractTags(text) {
    const tags = new Set();
    
    // Tags de gêneros musicais
    const musicalGenres = [
      'rock', 'pop', 'sertanejo', 'funk', 'rap', 'eletrônica', 'jazz',
      'blues', 'reggae', 'forró', 'pagode', 'samba', 'mpb', 'gospel',
      'country', 'indie', 'metal', 'punk', 'bossa nova'
    ];
    
    // Tags de tipos de evento
    const eventTypes = [
      'festival', 'show', 'concert', 'turnê', 'apresentação', 'espetáculo',
      'peça', 'musical', 'stand-up', 'palestra', 'workshop', 'curso',
      'competição', 'campeonato', 'torneio', 'corrida', 'maratona'
    ];
    
    // Tags de público-alvo
    const targetAudience = [
      'infantil', 'família', 'adulto', 'jovem', 'terceira idade',
      'profissional', 'estudante', 'empresarial'
    ];
    
    // Tags de formato
    const formats = [
      'presencial', 'online', 'híbrido', 'ao vivo', 'gravado',
      'interativo', 'imersivo', 'virtual'
    ];
    
    const allTagCategories = [
      ...musicalGenres,
      ...eventTypes,
      ...targetAudience,
      ...formats
    ];
    
    // Busca tags no texto
    for (const tag of allTagCategories) {
      if (text.includes(tag.toLowerCase())) {
        tags.add(tag);
      }
    }
    
    // Tags baseadas em padrões
    if (text.includes('grátis') || text.includes('gratuito') || text.includes('free')) {
      tags.add('gratuito');
    }
    
    if (text.includes('vip') || text.includes('premium')) {
      tags.add('premium');
    }
    
    if (text.includes('nacional') || text.includes('brasil')) {
      tags.add('nacional');
    }
    
    if (text.includes('internacional') || text.includes('mundial')) {
      tags.add('internacional');
    }
    
    if (text.includes('ao ar livre') || text.includes('outdoor')) {
      tags.add('ao-ar-livre');
    }
    
    return Array.from(tags);
  }

  /**
   * Classifica múltiplos eventos em lote
   */
  classifyEvents(events) {
    this.logger.info(`Classificando ${events.length} eventos em lote`);
    
    const startTime = Date.now();
    const results = events.map(event => {
      const classification = this.classifyEvent(event.title, event.description);
      
      return {
        ...event,
        category: classification.category,
        categoryConfidence: classification.confidence,
        alternativeCategories: classification.alternativeCategories,
        tags: classification.tags,
        matchedKeywords: classification.matchedKeywords
      };
    });
    
    const duration = Date.now() - startTime;
    this.logger.info(`Classificação em lote concluída em ${duration}ms`);
    
    return results;
  }

  /**
   * Sugere melhorias na classificação baseado em feedback
   */
  suggestImprovements(event, correctCategory) {
    const currentClassification = this.classifyEvent(event.title, event.description);
    
    if (currentClassification.category === correctCategory) {
      return null; // Classificação já está correta
    }
    
    const suggestions = {
      event: {
        title: event.title,
        currentCategory: currentClassification.category,
        correctCategory: correctCategory
      },
      improvements: []
    };
    
    // Analisa palavras-chave que poderiam melhorar a classificação
    const correctCategoryData = this.categories[correctCategory];
    if (correctCategoryData) {
      const text = `${event.title} ${event.description || ''}`.toLowerCase();
      
      for (const keyword of correctCategoryData.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          suggestions.improvements.push({
            type: 'keyword_weight',
            suggestion: `Aumentar peso da palavra-chave "${keyword}" para categoria "${correctCategory}"`
          });
        }
      }
      
      // Sugere novas palavras-chave baseadas no texto
      const words = text.split(/\s+/).filter(word => word.length > 3);
      const potentialKeywords = words.filter(word => 
        !correctCategoryData.keywords.some(k => k.toLowerCase().includes(word))
      );
      
      if (potentialKeywords.length > 0) {
        suggestions.improvements.push({
          type: 'new_keywords',
          suggestion: `Considerar adicionar palavras-chave: ${potentialKeywords.slice(0, 3).join(', ')}`
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Obtém estatísticas do classificador
   */
  getStats() {
    const cacheEfficiency = this.stats.totalClassifications > 0 ? 
      Math.round((this.stats.cacheHits / this.stats.totalClassifications) * 100) : 0;
    
    return {
      ...this.stats,
      cacheSize: this.classificationCache.size,
      cacheEfficiency: `${cacheEfficiency}%`
    };
  }

  /**
   * Limpa cache e estatísticas
   */
  reset() {
    this.classificationCache.clear();
    this.stats = {
      totalClassifications: 0,
      cacheHits: 0,
      categoryDistribution: {}
    };
    
    this.logger.info('Classificador resetado');
  }

  /**
   * Exporta configuração de categorias personalizada
   */
  exportCategoryConfig() {
    return {
      categories: this.categories,
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Importa configuração de categorias personalizada
   */
  importCategoryConfig(config) {
    if (config.categories) {
      this.categories = { ...this.categories, ...config.categories };
      this.classificationCache.clear(); // Limpa cache para reprocessar
      
      this.logger.info('Configuração de categorias importada');
    }
  }

  /**
   * Gera chave de cache para um texto
   */
  generateCacheKey(text) {
    // Usa hash simples para economizar memória
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converte para 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Atualiza estatísticas de distribuição de categorias
   */
  updateCategoryStats(category) {
    this.stats.categoryDistribution[category] = 
      (this.stats.categoryDistribution[category] || 0) + 1;
  }

  /**
   * Valida se uma categoria existe
   */
  isValidCategory(category) {
    return category in this.categories;
  }

  /**
   * Obtém informações de uma categoria
   */
  getCategoryInfo(category) {
    return this.categories[category] || null;
  }

  /**
   * Lista todas as categorias disponíveis
   */
  getAvailableCategories() {
    return Object.keys(this.categories);
  }
}

module.exports = { CategoryClassifier };