/**
 * Cliente Supabase para Armazenamento
 * 
 * Gerencia todas as operações de banco de dados
 * usando Supabase como backend.
 */

const { createClient } = require('@supabase/supabase-js');
const { Logger } = require('../utils/logger');
const config = require('../utils/config');

class SupabaseStorage {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.logger = new Logger('supabase-storage');
  }

  /**
   * Inicializa conexão com Supabase
   */
  async initialize() {
    try {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error('Credenciais do Supabase não configuradas');
      }

      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Testar conexão
      const { data, error } = await this.client
        .from('events')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      this.isConnected = true;
      this.logger.info('Conexão com Supabase estabelecida');
      return true;
    } catch (error) {
      this.logger.error('Erro ao conectar com Supabase:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Salva um evento no banco de dados
   */
  async saveEvent(eventData) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // Verificar se evento já existe
      const existing = await this.findEventByUrl(eventData.url);
      if (existing) {
        this.logger.info(`Evento já existe: ${eventData.title}`);
        return { action: 'skipped', event: existing };
      }

      const { data, error } = await this.client
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.logger.info(`Evento salvo: ${eventData.title}`);
      return { action: 'created', event: data };
    } catch (error) {
      this.logger.error('Erro ao salvar evento:', error.message);
      throw error;
    }
  }

  /**
   * Busca evento por URL
   */
  async findEventByUrl(url) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const { data, error } = await this.client
        .from('events')
        .select('*')
        .eq('url', url)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Erro ao buscar evento por URL:', error.message);
      return null;
    }
  }

  /**
   * Busca eventos com filtros
   */
  async getEvents(filters = {}) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      let query = this.client.from('events').select('*');

      // Aplicar filtros
      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.city) {
        query = query.ilike('location->>city', `%${filters.city}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      // Ordenar por data
      query = query.order('date', { ascending: true });

      // Limitar resultados
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Erro ao buscar eventos:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza um evento
   */
  async updateEvent(id, updateData) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const { data, error } = await this.client
        .from('events')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.logger.info(`Evento atualizado: ${id}`);
      return data;
    } catch (error) {
      this.logger.error('Erro ao atualizar evento:', error.message);
      throw error;
    }
  }

  /**
   * Remove um evento
   */
  async deleteEvent(id) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const { error } = await this.client
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      this.logger.info(`Evento removido: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Erro ao remover evento:', error.message);
      throw error;
    }
  }

  /**
   * Salva log de scraping
   */
  async saveScrapingLog(logData) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const { data, error } = await this.client
        .from('scraping_logs')
        .insert([logData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Erro ao salvar log de scraping:', error.message);
      throw error;
    }
  }

  /**
   * Busca estatísticas de eventos
   */
  async getEventStats() {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // Total de eventos
      const { count: totalEvents } = await this.client
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Eventos por fonte
      const { data: bySource } = await this.client
        .from('events')
        .select('source')
        .then(({ data }) => {
          const stats = {};
          data?.forEach(event => {
            stats[event.source] = (stats[event.source] || 0) + 1;
          });
          return { data: stats };
        });

      // Eventos por categoria
      const { data: byCategory } = await this.client
        .from('events')
        .select('category')
        .then(({ data }) => {
          const stats = {};
          data?.forEach(event => {
            const category = event.category || 'Sem categoria';
            stats[category] = (stats[category] || 0) + 1;
          });
          return { data: stats };
        });

      return {
        total: totalEvents || 0,
        bySource: bySource || {},
        byCategory: byCategory || {}
      };
    } catch (error) {
      this.logger.error('Erro ao buscar estatísticas:', error.message);
      throw error;
    }
  }

  /**
   * Limpa eventos antigos
   */
  async cleanupOldEvents(daysOld = 365) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.client
        .from('events')
        .delete()
        .lt('date', cutoffDate.toISOString())
        .select();

      if (error) {
        throw error;
      }

      const deletedCount = data?.length || 0;
      this.logger.info(`Removidos ${deletedCount} eventos antigos`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Erro ao limpar eventos antigos:', error.message);
      throw error;
    }
  }

  /**
   * Testa a conexão
   */
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('events')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return {
        connected: true,
        eventCount: data || 0
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = SupabaseStorage;