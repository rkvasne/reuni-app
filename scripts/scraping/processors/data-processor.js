/**
 * Processador de Dados
 * 
 * Responsável por processar, validar e estruturar
 * os dados coletados pelos scrapers.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { Logger } = require('../utils/logger');
const { DateParser } = require('./date-parser');
const { CategoryClassifier } = require('./category-classifier');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('../utils/error-handler');
const config = require('../utils/config');

class DataProcessor {
  constructor() {
    this.logger = new Logger('data-processor');
    this.dateParser = new DateParser();
    this.categoryClassifier = new CategoryClassifier();
    
    // Regras de validação baseadas na configuração
    this.validationRules = config.validation.event;
    
    // Estatísticas
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      rejected: 0,
      rejectionReasons: {},
      sourceDistribution: {},
      categoryDistribution: {}
    };
  }

  /**
   * Processa dados de evento coletados
   */
  async processEventData(rawData, source = 'unknown') {
    this.stats.totalProcessed++;
    this.updateSourceStats(source);
    
    try {
      this.logger.debug(`Processando evento: "${rawData.title}" de ${source}`);
      
      // 1. Normalização inicial
      const normalizedData = await this.normalizeData(rawData, source);
      
      // 2. Validação de integridade
      const validationResult = await this.validateData(normalizedData);
      if (!validationResult.isValid) {
        this.stats.rejected++;
        this.updateRejectionStats(validationResult.reasons);
        
        this.logger.debug(`Evento rejeitado: "${rawData.title}" - ${validationResult.reasons.join(', ')}`);
        
        return {
          success: false,
          data: null,
          errors: validationResult.reasons,
          source
        };
      }
      
      // 3. Processamento avançado
      const processedData = await this.enhanceData(normalizedData, source);
      
      // 4. Classificação automática
      const classification = this.categoryClassifier.classifyEvent(
        processedData.title,
        processedData.description
      );
      
      processedData.category = classification.category;
      processedData.categoryConfidence = classification.confidence;
      processedData.tags = classification.tags;
      
      this.updateCategoryStats(classification.category);
      
      // 5. Validação final
      const finalValidation = await this.validateProcessedData(processedData);
      if (!finalValidation.isValid) {
        this.stats.rejected++;
        this.updateRejectionStats(finalValidation.reasons);
        
        return {
          success: false,
          data: null,
          errors: finalValidation.reasons,
          source
        };
      }
      
      this.stats.successful++;
      
      this.logger.debug(`Evento processado com sucesso: "${processedData.title}"`);
      
      return {
        success: true,
        data: processedData,
        errors: [],
        source
      };
      
    } catch (error) {
      this.stats.rejected++;
      this.updateRejectionStats(['processing_error']);
      
      this.logger.error(`Erro ao processar evento "${rawData.title}":`, error);
      
      return {
        success: false,
        data: null,
        errors: ['processing_error'],
        source,
        originalError: error.message
      };
    }
  }

  /**
   * Normaliza dados brutos
   */
  async normalizeData(rawData, source) {
    const normalized = {
      // Dados básicos
      title: this.normalizeTitle(rawData.title),
      description: this.normalizeDescription(rawData.description),
      
      // Data e hora
      date: this.normalizeDate(rawData.date),
      
      // Localização
      location: this.normalizeLocation(rawData.location),
      
      // Imagem
      image: this.normalizeImage(rawData.image),
      
      // Preço
      price: this.normalizePrice(rawData.price),
      
      // Organizador
      organizer: this.normalizeOrganizer(rawData.organizer),
      
      // URL
      url: this.normalizeUrl(rawData.url),
      
      // Metadados
      source: source,
      scrapedAt: new Date().toISOString(),
      isRegional: rawData.isRegional || false,
      searchTerm: rawData.searchTerm || null
    };
    
    return normalized;
  }

  /**
   * Normaliza título do evento
   */
  normalizeTitle(title) {
    if (!title) return null;
    
    return title
      .trim()
      .replace(/\s+/g, ' ') // Normaliza espaços
      .replace(/[^\w\s\-\(\)\[\]]/g, '') // Remove caracteres especiais
      .substring(0, this.validationRules.titleMaxLength); // Limita tamanho
  }

  /**
   * Normaliza descrição do evento
   */
  normalizeDescription(description) {
    if (!description) return null;
    
    return description
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, this.validationRules.descriptionMaxLength);
  }

  /**
   * Normaliza data do evento
   */
  normalizeDate(dateInput) {
    if (!dateInput) return null;
    
    // Se já é uma data válida
    if (dateInput instanceof Date) {
      return this.dateParser.formatToStandard(dateInput);
    }
    
    // Se é string, faz parsing
    if (typeof dateInput === 'string') {
      const parsedDate = this.dateParser.parseDate(dateInput);
      return parsedDate ? this.dateParser.formatToStandard(parsedDate) : null;
    }
    
    return null;
  }

  /**
   * Normaliza localização do evento
   */
  normalizeLocation(locationInput) {
    if (!locationInput) return null;
    
    // Se é string simples
    if (typeof locationInput === 'string') {
      return {
        venue: locationInput.trim(),
        address: locationInput.trim(),
        city: this.extractCityFromText(locationInput),
        state: this.extractStateFromText(locationInput),
        coordinates: null
      };
    }
    
    // Se é objeto estruturado
    if (typeof locationInput === 'object') {
      return {
        venue: locationInput.venue || null,
        address: locationInput.address || locationInput.venue || null,
        city: locationInput.city || this.extractCityFromText(locationInput.address || ''),
        state: locationInput.state || this.extractStateFromText(locationInput.address || ''),
        coordinates: locationInput.coordinates || null
      };
    }
    
    return null;
  }

  /**
   * Normaliza imagem do evento
   */
  normalizeImage(imageInput) {
    if (!imageInput) return null;
    
    // Se é string (URL)
    if (typeof imageInput === 'string') {
      return {
        url: this.normalizeImageUrl(imageInput),
        alt: null,
        width: null,
        height: null
      };
    }
    
    // Se é objeto
    if (typeof imageInput === 'object') {
      return {
        url: this.normalizeImageUrl(imageInput.url),
        alt: imageInput.alt || null,
        width: imageInput.width || null,
        height: imageInput.height || null
      };
    }
    
    return null;
  }

  /**
   * Normaliza URL da imagem
   */
  normalizeImageUrl(url) {
    if (!url) return null;
    
    // Garante HTTPS
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    
    return url;
  }

  /**
   * Normaliza preço do evento
   */
  normalizePrice(priceInput) {
    if (!priceInput) return null;
    
    // Se é string
    if (typeof priceInput === 'string') {
      const cleanPrice = priceInput.toLowerCase();
      
      if (cleanPrice.includes('grátis') || cleanPrice.includes('gratuito')) {
        return {
          min: 0,
          max: 0,
          currency: 'BRL',
          isFree: true,
          display: 'Gratuito'
        };
      }
      
      // Extrai valores numéricos
      const priceMatch = priceInput.match(/R\$?\s*(\d+(?:[,.]\d{2})?)/g);
      if (priceMatch) {
        const prices = priceMatch.map(p => {
          const numStr = p.replace(/R\$?\s*/, '').replace(',', '.');
          return parseFloat(numStr);
        });
        
        return {
          min: Math.min(...prices),
          max: Math.max(...prices),
          currency: 'BRL',
          isFree: false,
          display: priceInput.trim()
        };
      }
    }
    
    // Se é objeto
    if (typeof priceInput === 'object') {
      return {
        min: priceInput.min || 0,
        max: priceInput.max || priceInput.min || 0,
        currency: priceInput.currency || 'BRL',
        isFree: priceInput.isFree || false,
        display: priceInput.display || null
      };
    }
    
    return null;
  }

  /**
   * Normaliza organizador do evento
   */
  normalizeOrganizer(organizer) {
    if (!organizer) return null;
    
    return {
      name: organizer.trim(),
      verified: false // TODO: Implementar verificação de organizadores
    };
  }

  /**
   * Normaliza URL do evento
   */
  normalizeUrl(url) {
    if (!url) return null;
    
    try {
      const normalizedUrl = new URL(url);
      return normalizedUrl.toString();
    } catch (error) {
      this.logger.debug(`URL inválida: ${url}`);
      return null;
    }
  }

  /**
   * Valida dados normalizados
   */
  async validateData(data) {
    const errors = [];
    
    // Validação de campos obrigatórios
    for (const field of this.validationRules.requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`missing_${field}`);
      }
    }
    
    // Validação de título
    if (data.title) {
      if (data.title.length < this.validationRules.titleMinLength) {
        errors.push('title_too_short');
      }
      if (data.title.length > this.validationRules.titleMaxLength) {
        errors.push('title_too_long');
      }
    }
    
    // Validação de data
    if (data.date) {
      const eventDate = new Date(data.date);
      
      if (!this.dateParser.isValidDate(eventDate)) {
        errors.push('invalid_date');
      } else if (this.validationRules.futureEventsOnly && !this.dateParser.isFutureEvent(eventDate)) {
        errors.push('past_event');
      } else {
        const daysInFuture = this.dateParser.daysDifference(new Date(), eventDate);
        if (daysInFuture > this.validationRules.maxDaysInFuture) {
          errors.push('event_too_far_future');
        }
      }
    }
    
    // Validação de localização
    if (data.location && !data.location.venue && !data.location.address) {
      errors.push('invalid_location');
    }
    
    // Validação de imagem (se obrigatória)
    const sourceConfig = config.scrapers[data.source];
    if (sourceConfig?.qualityFilters?.requireImage && !data.image?.url) {
      errors.push('missing_image');
    }
    
    // Validação de descrição (se obrigatória)
    if (sourceConfig?.qualityFilters?.requireDescription && !data.description) {
      errors.push('missing_description');
    }
    
    return {
      isValid: errors.length === 0,
      reasons: errors
    };
  }

  /**
   * Enriquece dados com informações adicionais
   */
  async enhanceData(data, source) {
    const enhanced = { ...data };
    
    // Adiciona informações de geolocalização
    if (enhanced.location?.city) {
      enhanced.location.isRegional = this.isRegionalCity(enhanced.location.city);
    }
    
    // Adiciona informações de popularidade baseadas na fonte
    enhanced.popularity = this.calculatePopularityScore(enhanced, source);
    
    // Adiciona hash único para detecção de duplicatas
    enhanced.hash = this.generateEventHash(enhanced);
    
    // Adiciona informações de qualidade
    enhanced.qualityScore = this.calculateQualityScore(enhanced);
    
    return enhanced;
  }

  /**
   * Validação final dos dados processados
   */
  async validateProcessedData(data) {
    const errors = [];
    
    // Validação de qualidade mínima
    if (data.qualityScore < 0.3) {
      errors.push('low_quality_score');
    }
    
    // Validação de categoria
    if (!data.category || data.category === 'outros') {
      if (data.categoryConfidence < 0.1) {
        errors.push('uncategorizable');
      }
    }
    
    return {
      isValid: errors.length === 0,
      reasons: errors
    };
  }

  /**
   * Extrai cidade do texto
   */
  extractCityFromText(text) {
    const cities = [
      'Ji-Paraná', 'Ariquemes', 'Cacoal', 'Rolim de Moura', 'Vilhena',
      'Porto Velho', 'São Paulo', 'Rio de Janeiro', 'Brasília'
    ];
    
    for (const city of cities) {
      if (text.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    
    return null;
  }

  /**
   * Extrai estado do texto
   */
  extractStateFromText(text) {
    const states = {
      'rondônia': 'RO', 'ro': 'RO',
      'são paulo': 'SP', 'sp': 'SP',
      'rio de janeiro': 'RJ', 'rj': 'RJ'
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [stateName, stateCode] of Object.entries(states)) {
      if (lowerText.includes(stateName)) {
        return stateCode;
      }
    }
    
    return null;
  }

  /**
   * Verifica se cidade é regional
   */
  isRegionalCity(city) {
    const regionalCities = config.regions.nearby.concat(['Ji-Paraná']);
    return regionalCities.some(regional => 
      city.toLowerCase().includes(regional.toLowerCase())
    );
  }

  /**
   * Calcula score de popularidade
   */
  calculatePopularityScore(data, source) {
    let score = 0.5; // Base score
    
    // Bonus por fonte confiável
    if (source === 'eventbrite') score += 0.2;
    if (source === 'sympla') score += 0.15;
    
    // Bonus por ter imagem
    if (data.image?.url) score += 0.1;
    
    // Bonus por ter descrição
    if (data.description) score += 0.1;
    
    // Bonus por ser regional
    if (data.isRegional) score += 0.15;
    
    return Math.min(score, 1.0);
  }

  /**
   * Gera hash único para o evento
   */
  generateEventHash(data) {
    const hashString = `${data.title}_${data.date}_${data.location?.venue || ''}`;
    
    // Hash simples
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Calcula score de qualidade
   */
  calculateQualityScore(data) {
    let score = 0;
    
    // Título (30%)
    if (data.title && data.title.length >= this.validationRules.titleMinLength) {
      score += 0.3;
    }
    
    // Data válida (20%)
    if (data.date && this.dateParser.isValidDate(new Date(data.date))) {
      score += 0.2;
    }
    
    // Localização (20%)
    if (data.location?.venue) {
      score += 0.2;
    }
    
    // Imagem (15%)
    if (data.image?.url) {
      score += 0.15;
    }
    
    // Descrição (10%)
    if (data.description && data.description.length > 20) {
      score += 0.1;
    }
    
    // URL válida (5%)
    if (data.url) {
      score += 0.05;
    }
    
    return Math.round(score * 100) / 100;
  }

  /**
   * Processa múltiplos eventos em lote
   */
  async processEventsBatch(rawEvents, source) {
    this.logger.info(`Processando lote de ${rawEvents.length} eventos de ${source}`);
    
    const results = {
      successful: [],
      rejected: [],
      errors: []
    };
    
    for (const rawEvent of rawEvents) {
      try {
        const result = await this.processEventData(rawEvent, source);
        
        if (result.success) {
          results.successful.push(result.data);
        } else {
          results.rejected.push({
            originalData: rawEvent,
            errors: result.errors
          });
        }
      } catch (error) {
        results.errors.push({
          originalData: rawEvent,
          error: error.message
        });
      }
    }
    
    this.logger.info(`Lote processado: ${results.successful.length} sucessos, ${results.rejected.length} rejeitados, ${results.errors.length} erros`);
    
    return results;
  }

  /**
   * Obtém estatísticas do processador
   */
  getStats() {
    const successRate = this.stats.totalProcessed > 0 ? 
      Math.round((this.stats.successful / this.stats.totalProcessed) * 100) : 0;
    
    return {
      ...this.stats,
      successRate: `${successRate}%`,
      dateParserStats: this.dateParser.getStats(),
      categoryClassifierStats: this.categoryClassifier.getStats()
    };
  }

  /**
   * Atualiza estatísticas de fonte
   */
  updateSourceStats(source) {
    this.stats.sourceDistribution[source] = 
      (this.stats.sourceDistribution[source] || 0) + 1;
  }

  /**
   * Atualiza estatísticas de rejeição
   */
  updateRejectionStats(reasons) {
    for (const reason of reasons) {
      this.stats.rejectionReasons[reason] = 
        (this.stats.rejectionReasons[reason] || 0) + 1;
    }
  }

  /**
   * Atualiza estatísticas de categoria
   */
  updateCategoryStats(category) {
    this.stats.categoryDistribution[category] = 
      (this.stats.categoryDistribution[category] || 0) + 1;
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      rejected: 0,
      rejectionReasons: {},
      sourceDistribution: {},
      categoryDistribution: {}
    };
    
    this.dateParser.resetStats();
    this.categoryClassifier.reset();
  }
}

module.exports = { DataProcessor };