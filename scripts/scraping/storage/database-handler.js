/**
 * Database Handler
 * 
 * Gerencia a integração com o banco de dados existente
 * para persistir eventos coletados.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { createClient } = require('@supabase/supabase-js');
const { Logger } = require('../utils/logger');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('../utils/error-handler');
const config = require('../utils/config');

class DatabaseHandler {
  constructor() {
    this.logger = new Logger('database-handler');
    this.supabase = null;
    this.isConnected = false;
    
    // Configurações do banco
    this.dbConfig = config.database;
    this.tables = this.dbConfig.tables;
    
    // Estatísticas
    this.stats = {
      totalInserts: 0,
      successfulInserts: 0,
      duplicatesFound: 0,
      errors: 0,
      operationsLogged: 0
    };
  }

  /**
   * Conecta ao banco de dados Supabase
   */
  async connect() {
    try {
      if (!this.dbConfig.connection || !this.dbConfig.apiKey) {
        throw new ScrapingError(
          'Configurações do banco de dados não encontradas. Verifique SUPABASE_URL e SUPABASE_ANON_KEY',
          ErrorTypes.CONFIGURATION_ERROR,
          ErrorSeverity.CRITICAL
        );
      }

      this.supabase = createClient(
        this.dbConfig.connection,
        this.dbConfig.apiKey,
        {
          auth: {
            persistSession: false
          }
        }
      );

      // Testa a conexão
      const { data, error } = await this.supabase
        .from(this.tables.events)
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw new ScrapingError(
          `Erro ao conectar com o banco: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          ErrorSeverity.CRITICAL,
          { originalError: error }
        );
      }

      this.isConnected = true;
      this.logger.success('Conectado ao banco de dados Supabase');
      
      return true;

    } catch (error) {
      this.isConnected = false;
      this.logger.error('Falha ao conectar com o banco de dados', error);
      throw error;
    }
  }

  /**
   * Verifica se há conexão ativa
   */
  ensureConnection() {
    if (!this.isConnected || !this.supabase) {
      throw new ScrapingError(
        'Não há conexão ativa com o banco de dados',
        ErrorTypes.DATABASE_ERROR,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Insere um evento no banco de dados
   */
  async insertEvent(eventData) {
    this.ensureConnection();
    this.stats.totalInserts++;

    try {
      // Verifica duplicatas primeiro
      const isDuplicate = await this.checkDuplicate(eventData);
      if (isDuplicate) {
        this.stats.duplicatesFound++;
        this.logger.debug(`Evento duplicado ignorado: "${eventData.title}"`);
        
        return {
          success: false,
          reason: 'duplicate',
          eventId: null
        };
      }

      // Prepara dados para inserção
      const insertData = this.prepareEventData(eventData);

      // Insere o evento
      const { data, error } = await this.supabase
        .from(this.tables.events)
        .insert([insertData])
        .select()
        .single();

      if (error) {
        this.stats.errors++;
        throw new ScrapingError(
          `Erro ao inserir evento: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          ErrorSeverity.HIGH,
          { eventData: insertData, originalError: error }
        );
      }

      this.stats.successfulInserts++;
      this.logger.debug(`Evento inserido com sucesso: "${eventData.title}" (ID: ${data.id})`);

      return {
        success: true,
        reason: 'inserted',
        eventId: data.id,
        data: data
      };

    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Erro ao inserir evento "${eventData.title}":`, error);
      throw error;
    }
  }

  /**
   * Insere múltiplos eventos em lote
   */
  async insertEventsBatch(eventsData) {
    this.ensureConnection();

    const results = {
      inserted: [],
      duplicates: [],
      errors: []
    };

    this.logger.info(`Inserindo lote de ${eventsData.length} eventos`);

    // Processa em lotes menores para evitar timeout
    const batchSize = this.dbConfig.batchSize || 50;
    
    for (let i = 0; i < eventsData.length; i += batchSize) {
      const batch = eventsData.slice(i, i + batchSize);
      
      for (const eventData of batch) {
        try {
          const result = await this.insertEvent(eventData);
          
          if (result.success) {
            results.inserted.push(result);
          } else if (result.reason === 'duplicate') {
            results.duplicates.push({
              title: eventData.title,
              hash: eventData.hash
            });
          }
          
        } catch (error) {
          results.errors.push({
            eventData,
            error: error.message
          });
        }
      }

      // Pequeno delay entre lotes
      if (i + batchSize < eventsData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.logger.info(`Lote processado: ${results.inserted.length} inseridos, ${results.duplicates.length} duplicatas, ${results.errors.length} erros`);

    return results;
  }

  /**
   * Verifica se um evento já existe (duplicata)
   */
  async checkDuplicate(eventData) {
    this.ensureConnection();

    try {
      // Verifica por hash único
      if (eventData.hash) {
        const { data, error } = await this.supabase
          .from(this.tables.events)
          .select('id')
          .eq('hash', eventData.hash)
          .limit(1);

        if (error) {
          this.logger.warn('Erro ao verificar duplicata por hash:', error.message);
        } else if (data && data.length > 0) {
          return true;
        }
      }

      // Verifica por título e data (fallback)
      if (eventData.title && eventData.date) {
        const { data, error } = await this.supabase
          .from(this.tables.events)
          .select('id')
          .eq('title', eventData.title)
          .eq('date', eventData.date)
          .limit(1);

        if (error) {
          this.logger.warn('Erro ao verificar duplicata por título/data:', error.message);
        } else if (data && data.length > 0) {
          return true;
        }
      }

      return false;

    } catch (error) {
      this.logger.warn('Erro ao verificar duplicatas:', error.message);
      return false; // Em caso de erro, permite inserção
    }
  }

  /**
   * Prepara dados do evento para inserção no banco
   */
  prepareEventData(eventData) {
    return {
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      location_venue: eventData.location?.venue,
      location_address: eventData.location?.address,
      location_city: eventData.location?.city,
      location_state: eventData.location?.state,
      location_coordinates: eventData.location?.coordinates,
      image_url: eventData.image?.url,
      image_alt: eventData.image?.alt,
      price_min: eventData.price?.min,
      price_max: eventData.price?.max,
      price_currency: eventData.price?.currency,
      price_is_free: eventData.price?.isFree || false,
      price_display: eventData.price?.display,
      organizer_name: eventData.organizer?.name,
      organizer_verified: eventData.organizer?.verified || false,
      url: eventData.url,
      source: eventData.source,
      category: eventData.category,
      category_confidence: eventData.categoryConfidence,
      tags: eventData.tags || [],
      is_regional: eventData.isRegional || false,
      search_term: eventData.searchTerm,
      popularity_score: eventData.popularity,
      quality_score: eventData.qualityScore,
      hash: eventData.hash,
      scraped_at: eventData.scrapedAt || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Registra operação de scraping
   */
  async logScrapingOperation(operation) {
    this.ensureConnection();

    try {
      const logData = {
        operation_type: operation.type || 'scraping',
        source: operation.source,
        status: operation.status,
        events_found: operation.eventsFound || 0,
        events_inserted: operation.eventsInserted || 0,
        events_duplicated: operation.eventsDuplicated || 0,
        events_rejected: operation.eventsRejected || 0,
        errors_count: operation.errorsCount || 0,
        duration_ms: operation.duration,
        filters_used: operation.filters || {},
        error_details: operation.errorDetails || null,
        started_at: operation.startedAt,
        completed_at: operation.completedAt || new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from(this.tables.scraping_logs)
        .insert([logData])
        .select()
        .single();

      if (error) {
        throw new ScrapingError(
          `Erro ao registrar log de operação: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          ErrorSeverity.MEDIUM,
          { logData, originalError: error }
        );
      }

      this.stats.operationsLogged++;
      this.logger.debug(`Operação de scraping registrada (ID: ${data.id})`);

      return data.id;

    } catch (error) {
      this.logger.error('Erro ao registrar operação de scraping:', error);
      throw error;
    }
  }

  /**
   * Obtém eventos por filtros
   */
  async getEvents(filters = {}) {
    this.ensureConnection();

    try {
      let query = this.supabase
        .from(this.tables.events)
        .select('*');

      // Aplica filtros
      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.isRegional !== undefined) {
        query = query.eq('is_regional', filters.isRegional);
      }

      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      if (filters.city) {
        query = query.eq('location_city', filters.city);
      }

      // Ordenação e limite
      query = query.order('date', { ascending: true });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new ScrapingError(
          `Erro ao buscar eventos: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          ErrorSeverity.MEDIUM,
          { filters, originalError: error }
        );
      }

      return data || [];

    } catch (error) {
      this.logger.error('Erro ao buscar eventos:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos eventos
   */
  async getEventStats() {
    this.ensureConnection();

    try {
      // Total de eventos
      const { count: totalEvents } = await this.supabase
        .from(this.tables.events)
        .select('*', { count: 'exact', head: true });

      // Eventos por fonte
      const { data: bySource } = await this.supabase
        .from(this.tables.events)
        .select('source')
        .then(result => {
          const counts = {};
          result.data?.forEach(item => {
            counts[item.source] = (counts[item.source] || 0) + 1;
          });
          return { data: counts };
        });

      // Eventos por categoria
      const { data: byCategory } = await this.supabase
        .from(this.tables.events)
        .select('category')
        .then(result => {
          const counts = {};
          result.data?.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
          });
          return { data: counts };
        });

      // Eventos regionais vs nacionais
      const { count: regionalEvents } = await this.supabase
        .from(this.tables.events)
        .select('*', { count: 'exact', head: true })
        .eq('is_regional', true);

      return {
        totalEvents: totalEvents || 0,
        regionalEvents: regionalEvents || 0,
        nationalEvents: (totalEvents || 0) - (regionalEvents || 0),
        bySource: bySource || {},
        byCategory: byCategory || {},
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Limpa eventos antigos
   */
  async cleanupOldEvents(daysOld = 365) {
    this.ensureConnection();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from(this.tables.events)
        .delete()
        .lt('date', cutoffDate.toISOString())
        .select();

      if (error) {
        throw new ScrapingError(
          `Erro ao limpar eventos antigos: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          ErrorSeverity.MEDIUM,
          { daysOld, cutoffDate, originalError: error }
        );
      }

      const deletedCount = data?.length || 0;
      this.logger.info(`Limpeza concluída: ${deletedCount} eventos antigos removidos`);

      return deletedCount;

    } catch (error) {
      this.logger.error('Erro ao limpar eventos antigos:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do handler
   */
  getStats() {
    const successRate = this.stats.totalInserts > 0 ? 
      Math.round((this.stats.successfulInserts / this.stats.totalInserts) * 100) : 0;

    const duplicateRate = this.stats.totalInserts > 0 ?
      Math.round((this.stats.duplicatesFound / this.stats.totalInserts) * 100) : 0;

    return {
      ...this.stats,
      successRate: `${successRate}%`,
      duplicateRate: `${duplicateRate}%`,
      isConnected: this.isConnected
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      totalInserts: 0,
      successfulInserts: 0,
      duplicatesFound: 0,
      errors: 0,
      operationsLogged: 0
    };
  }

  /**
   * Fecha conexão com o banco
   */
  async disconnect() {
    if (this.supabase) {
      // Supabase não tem método explícito de disconnect
      this.supabase = null;
      this.isConnected = false;
      this.logger.info('Desconectado do banco de dados');
    }
  }
}

module.exports = { DatabaseHandler };