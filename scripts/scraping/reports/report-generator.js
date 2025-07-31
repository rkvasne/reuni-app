/**
 * Report Generator
 * 
 * Gera relatórios detalhados sobre eventos coletados,
 * estatísticas por fonte, categoria e região.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const fs = require('fs').promises;
const path = require('path');
const { Logger } = require('../utils/logger');
const { DatabaseHandler } = require('../storage/database-handler');
const { DateParser } = require('../processors/date-parser');
const config = require('../utils/config');

class ReportGenerator {
  constructor() {
    this.logger = new Logger('report-generator');
    this.dbHandler = new DatabaseHandler();
    this.dateParser = new DateParser();
    
    // Configurações de relatório
    this.reportConfig = config.reports;
    this.reportsDir = this.reportConfig.directory;
    
    // Estatísticas
    this.stats = {
      reportsGenerated: 0,
      lastReportAt: null,
      totalEventsAnalyzed: 0
    };
  }

  /**
   * Gera relatório completo de eventos
   */
  async generateCompleteReport(options = {}) {
    try {
      this.logger.info('Iniciando geração de relatório completo');
      
      // Conecta ao banco se necessário
      if (!this.dbHandler.isConnected) {
        await this.dbHandler.connect();
      }

      // Coleta dados
      const reportData = await this.collectReportData(options);
      
      // Gera relatório em diferentes formatos
      const reports = {};
      
      if (this.reportConfig.formats.includes('json')) {
        reports.json = await this.generateJSONReport(reportData);
      }
      
      if (this.reportConfig.formats.includes('html')) {
        reports.html = await this.generateHTMLReport(reportData);
      }
      
      if (this.reportConfig.formats.includes('csv')) {
        reports.csv = await this.generateCSVReport(reportData);
      }

      // Salva relatórios
      const savedReports = await this.saveReports(reports, 'complete');
      
      this.stats.reportsGenerated++;
      this.stats.lastReportAt = new Date().toISOString();
      this.stats.totalEventsAnalyzed = reportData.summary.totalEvents;
      
      this.logger.success(`Relatório completo gerado: ${Object.keys(savedReports).length} formatos`);
      
      return {
        success: true,
        data: reportData,
        files: savedReports,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Erro ao gerar relatório completo:', error);
      throw error;
    }
  }

  /**
   * Coleta dados para o relatório
   */
  async collectReportData(options = {}) {
    const data = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Sistema de Scraping de Eventos Brasil',
        version: '1.0.0',
        filters: options.filters || {},
        period: options.period || 'all_time'
      },
      summary: {},
      eventsBySource: {},
      eventsByCategory: {},
      eventsByRegion: {},
      eventsByDate: {},
      qualityMetrics: {},
      topEvents: [],
      recentEvents: [],
      upcomingEvents: []
    };

    // Filtros de data
    const dateFilters = this.buildDateFilters(options.period);

    // Resumo geral
    data.summary = await this.generateSummary(dateFilters);
    
    // Eventos por fonte
    data.eventsBySource = await this.getEventsBySource(dateFilters);
    
    // Eventos por categoria
    data.eventsByCategory = await this.getEventsByCategory(dateFilters);
    
    // Eventos por região
    data.eventsByRegion = await this.getEventsByRegion(dateFilters);
    
    // Distribuição temporal
    data.eventsByDate = await this.getEventsByDate(dateFilters);
    
    // Métricas de qualidade
    data.qualityMetrics = await this.getQualityMetrics(dateFilters);
    
    // Top eventos (por popularidade)
    data.topEvents = await this.getTopEvents(dateFilters, 10);
    
    // Eventos recentes (últimos coletados)
    data.recentEvents = await this.getRecentEvents(10);
    
    // Próximos eventos
    data.upcomingEvents = await this.getUpcomingEvents(dateFilters, 20);

    return data;
  }

  /**
   * Constrói filtros de data baseado no período
   */
  buildDateFilters(period) {
    const now = new Date();
    const filters = {};

    switch (period) {
      case 'last_7_days':
        filters.dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'last_30_days':
        filters.dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'last_90_days':
        filters.dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'next_30_days':
        filters.dateFrom = now.toISOString();
        filters.dateTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'next_90_days':
        filters.dateFrom = now.toISOString();
        filters.dateTo = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        // all_time - sem filtros
        break;
    }

    return filters;
  }

  /**
   * Gera resumo geral
   */
  async generateSummary(dateFilters) {
    const events = await this.dbHandler.getEvents(dateFilters);
    
    const summary = {
      totalEvents: events.length,
      regionalEvents: events.filter(e => e.is_regional).length,
      nationalEvents: events.filter(e => !e.is_regional).length,
      freeEvents: events.filter(e => e.price_is_free).length,
      paidEvents: events.filter(e => !e.price_is_free && e.price_min > 0).length,
      eventsWithImages: events.filter(e => e.image_url).length,
      averageQualityScore: events.length > 0 ? 
        Math.round((events.reduce((sum, e) => sum + (e.quality_score || 0), 0) / events.length) * 100) / 100 : 0,
      dateRange: {
        earliest: events.length > 0 ? 
          events.reduce((min, e) => e.date < min ? e.date : min, events[0].date) : null,
        latest: events.length > 0 ? 
          events.reduce((max, e) => e.date > max ? e.date : max, events[0].date) : null
      }
    };

    // Adiciona percentuais
    if (summary.totalEvents > 0) {
      summary.regionalPercentage = Math.round((summary.regionalEvents / summary.totalEvents) * 100);
      summary.freeEventsPercentage = Math.round((summary.freeEvents / summary.totalEvents) * 100);
      summary.eventsWithImagesPercentage = Math.round((summary.eventsWithImages / summary.totalEvents) * 100);
    }

    return summary;
  }

  /**
   * Obtém eventos agrupados por fonte
   */
  async getEventsBySource(dateFilters) {
    const events = await this.dbHandler.getEvents(dateFilters);
    const bySource = {};

    events.forEach(event => {
      const source = event.source || 'unknown';
      if (!bySource[source]) {
        bySource[source] = {
          count: 0,
          events: [],
          qualityAverage: 0,
          regionalCount: 0,
          categories: {}
        };
      }

      bySource[source].count++;
      bySource[source].events.push(event);
      bySource[source].qualityAverage += event.quality_score || 0;
      
      if (event.is_regional) {
        bySource[source].regionalCount++;
      }

      const category = event.category || 'outros';
      bySource[source].categories[category] = (bySource[source].categories[category] || 0) + 1;
    });

    // Calcula médias
    Object.keys(bySource).forEach(source => {
      const data = bySource[source];
      data.qualityAverage = data.count > 0 ? 
        Math.round((data.qualityAverage / data.count) * 100) / 100 : 0;
      data.regionalPercentage = data.count > 0 ? 
        Math.round((data.regionalCount / data.count) * 100) : 0;
      
      // Remove eventos detalhados para economizar espaço
      delete data.events;
    });

    return bySource;
  }

  /**
   * Obtém eventos agrupados por categoria
   */
  async getEventsByCategory(dateFilters) {
    const events = await this.dbHandler.getEvents(dateFilters);
    const byCategory = {};

    events.forEach(event => {
      const category = event.category || 'outros';
      if (!byCategory[category]) {
        byCategory[category] = {
          count: 0,
          regionalCount: 0,
          freeCount: 0,
          averageConfidence: 0,
          sources: {},
          upcomingCount: 0
        };
      }

      byCategory[category].count++;
      byCategory[category].averageConfidence += event.category_confidence || 0;
      
      if (event.is_regional) {
        byCategory[category].regionalCount++;
      }
      
      if (event.price_is_free) {
        byCategory[category].freeCount++;
      }

      const source = event.source || 'unknown';
      byCategory[category].sources[source] = (byCategory[category].sources[source] || 0) + 1;

      // Verifica se é evento futuro
      if (event.date && this.dateParser.isFutureEvent(new Date(event.date))) {
        byCategory[category].upcomingCount++;
      }
    });

    // Calcula médias e percentuais
    Object.keys(byCategory).forEach(category => {
      const data = byCategory[category];
      data.averageConfidence = data.count > 0 ? 
        Math.round((data.averageConfidence / data.count) * 100) / 100 : 0;
      data.regionalPercentage = data.count > 0 ? 
        Math.round((data.regionalCount / data.count) * 100) : 0;
      data.freePercentage = data.count > 0 ? 
        Math.round((data.freeCount / data.count) * 100) : 0;
    });

    return byCategory;
  }

  /**
   * Obtém eventos agrupados por região
   */
  async getEventsByRegion(dateFilters) {
    const events = await this.dbHandler.getEvents(dateFilters);
    const byRegion = {
      regional: {
        count: 0,
        cities: {},
        categories: {},
        sources: {}
      },
      national: {
        count: 0,
        cities: {},
        categories: {},
        sources: {}
      }
    };

    events.forEach(event => {
      const region = event.is_regional ? 'regional' : 'national';
      const data = byRegion[region];
      
      data.count++;

      // Por cidade
      const city = event.location_city || 'Não informado';
      data.cities[city] = (data.cities[city] || 0) + 1;

      // Por categoria
      const category = event.category || 'outros';
      data.categories[category] = (data.categories[category] || 0) + 1;

      // Por fonte
      const source = event.source || 'unknown';
      data.sources[source] = (data.sources[source] || 0) + 1;
    });

    return byRegion;
  }

  /**
   * Obtém distribuição temporal de eventos
   */
  async getEventsByDate(dateFilters) {
    const events = await this.dbHandler.getEvents(dateFilters);
    const byDate = {
      byMonth: {},
      byWeekday: {},
      byHour: {},
      timeline: []
    };

    events.forEach(event => {
      if (!event.date) return;

      const eventDate = new Date(event.date);
      
      // Por mês
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      byDate.byMonth[monthKey] = (byDate.byMonth[monthKey] || 0) + 1;

      // Por dia da semana
      const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const weekday = weekdays[eventDate.getDay()];
      byDate.byWeekday[weekday] = (byDate.byWeekday[weekday] || 0) + 1;

      // Por hora (se disponível)
      const hour = eventDate.getHours();
      if (hour >= 0 && hour <= 23) {
        byDate.byHour[hour] = (byDate.byHour[hour] || 0) + 1;
      }
    });

    // Timeline dos próximos 30 dias
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(event => {
        if (!event.date) return false;
        return event.date.startsWith(dateKey);
      });

      byDate.timeline.push({
        date: dateKey,
        count: dayEvents.length,
        events: dayEvents.slice(0, 3).map(e => ({
          title: e.title,
          category: e.category,
          location: e.location_city
        }))
      });
    }

    return byDate;
  }

  /**
   * Obtém métricas de qualidade
   */
  async getQualityMetrics(dateFilters) {
    const events = await this.dbHandler.getEvents(dateFilters);
    
    const metrics = {
      averageQualityScore: 0,
      qualityDistribution: {
        high: 0,    // > 0.8
        medium: 0,  // 0.5 - 0.8
        low: 0      // < 0.5
      },
      completenessMetrics: {
        withImages: 0,
        withDescriptions: 0,
        withPrices: 0,
        withLocations: 0,
        withOrganizers: 0
      },
      dataQualityIssues: {
        missingDates: 0,
        invalidDates: 0,
        shortTitles: 0,
        missingLocations: 0
      }
    };

    if (events.length === 0) return metrics;

    let totalQuality = 0;

    events.forEach(event => {
      // Score de qualidade
      const quality = event.quality_score || 0;
      totalQuality += quality;

      if (quality > 0.8) metrics.qualityDistribution.high++;
      else if (quality >= 0.5) metrics.qualityDistribution.medium++;
      else metrics.qualityDistribution.low++;

      // Métricas de completude
      if (event.image_url) metrics.completenessMetrics.withImages++;
      if (event.description) metrics.completenessMetrics.withDescriptions++;
      if (event.price_min !== null || event.price_is_free) metrics.completenessMetrics.withPrices++;
      if (event.location_venue || event.location_address) metrics.completenessMetrics.withLocations++;
      if (event.organizer_name) metrics.completenessMetrics.withOrganizers++;

      // Problemas de qualidade
      if (!event.date) metrics.dataQualityIssues.missingDates++;
      else if (!this.dateParser.isValidDate(new Date(event.date))) metrics.dataQualityIssues.invalidDates++;
      
      if (!event.title || event.title.length < 10) metrics.dataQualityIssues.shortTitles++;
      if (!event.location_venue && !event.location_address) metrics.dataQualityIssues.missingLocations++;
    });

    metrics.averageQualityScore = Math.round((totalQuality / events.length) * 100) / 100;

    // Converte para percentuais
    Object.keys(metrics.completenessMetrics).forEach(key => {
      const count = metrics.completenessMetrics[key];
      metrics.completenessMetrics[key] = {
        count,
        percentage: Math.round((count / events.length) * 100)
      };
    });

    return metrics;
  }

  /**
   * Obtém top eventos por popularidade
   */
  async getTopEvents(dateFilters, limit = 10) {
    const events = await this.dbHandler.getEvents(dateFilters);
    
    return events
      .filter(event => event.popularity_score > 0)
      .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
      .slice(0, limit)
      .map(event => ({
        title: event.title,
        date: event.date,
        location: event.location_city,
        category: event.category,
        source: event.source,
        popularityScore: event.popularity_score,
        qualityScore: event.quality_score,
        isRegional: event.is_regional,
        isFree: event.price_is_free,
        url: event.url
      }));
  }

  /**
   * Obtém eventos recentemente coletados
   */
  async getRecentEvents(limit = 10) {
    const { data, error } = await this.dbHandler.supabase
      .from(this.dbHandler.tables.events)
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.warn('Erro ao buscar eventos recentes:', error.message);
      return [];
    }

    return (data || []).map(event => ({
      title: event.title,
      date: event.date,
      location: event.location_city,
      category: event.category,
      source: event.source,
      scrapedAt: event.scraped_at,
      qualityScore: event.quality_score
    }));
  }

  /**
   * Obtém próximos eventos
   */
  async getUpcomingEvents(dateFilters, limit = 20) {
    const now = new Date().toISOString();
    
    const filters = {
      ...dateFilters,
      dateFrom: now
    };

    const events = await this.dbHandler.getEvents(filters);
    
    return events
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit)
      .map(event => ({
        title: event.title,
        date: event.date,
        location: event.location_city,
        category: event.category,
        source: event.source,
        isRegional: event.is_regional,
        isFree: event.price_is_free,
        daysUntil: this.dateParser.daysDifference(new Date(), new Date(event.date))
      }));
  }

  /**
   * Gera relatório em formato JSON
   */
  async generateJSONReport(data) {
    return {
      format: 'json',
      content: JSON.stringify(data, null, 2),
      filename: `relatorio-eventos-${this.getTimestamp()}.json`
    };
  }

  /**
   * Gera relatório em formato HTML
   */
  async generateHTMLReport(data) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Eventos - ${data.metadata.generatedAt}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #007bff; }
        .header h1 { color: #007bff; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .stat-card h3 { margin: 0 0 10px 0; color: #007bff; font-size: 2em; }
        .stat-card p { margin: 0; color: #666; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: bold; color: #333; }
        .table tr:hover { background: #f8f9fa; }
        .progress-bar { background: #e9ecef; border-radius: 4px; overflow: hidden; height: 20px; margin: 5px 0; }
        .progress-fill { background: #007bff; height: 100%; transition: width 0.3s ease; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .badge-primary { background: #007bff; color: white; }
        .badge-success { background: #28a745; color: white; }
        .badge-warning { background: #ffc107; color: black; }
        .badge-danger { background: #dc3545; color: white; }
        .event-list { list-style: none; padding: 0; }
        .event-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .event-title { font-weight: bold; color: #333; margin-bottom: 5px; }
        .event-details { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Relatório de Eventos Brasil</h1>
            <p><strong>Gerado em:</strong> ${new Date(data.metadata.generatedAt).toLocaleString('pt-BR')}</p>
            <p><strong>Período:</strong> ${data.metadata.period}</p>
            <p><strong>Foco:</strong> Ji-Paraná/RO + Artistas Famosos do Brasil</p>
        </div>

        <div class="section">
            <h2>📊 Resumo Geral</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${data.summary.totalEvents}</h3>
                    <p>Total de Eventos</p>
                </div>
                <div class="stat-card">
                    <h3>${data.summary.regionalEvents}</h3>
                    <p>Eventos Regionais</p>
                </div>
                <div class="stat-card">
                    <h3>${data.summary.nationalEvents}</h3>
                    <p>Eventos Nacionais</p>
                </div>
                <div class="stat-card">
                    <h3>${data.summary.freeEvents}</h3>
                    <p>Eventos Gratuitos</p>
                </div>
                <div class="stat-card">
                    <h3>${data.summary.averageQualityScore}</h3>
                    <p>Score Médio de Qualidade</p>
                </div>
                <div class="stat-card">
                    <h3>${data.summary.eventsWithImagesPercentage || 0}%</h3>
                    <p>Com Imagens</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📡 Eventos por Fonte</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Fonte</th>
                        <th>Quantidade</th>
                        <th>Qualidade Média</th>
                        <th>% Regional</th>
                        <th>Principais Categorias</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.eventsBySource).map(([source, info]) => `
                        <tr>
                            <td><span class="badge badge-primary">${source}</span></td>
                            <td>${info.count}</td>
                            <td>${info.qualityAverage}</td>
                            <td>${info.regionalPercentage}%</td>
                            <td>${Object.keys(info.categories).slice(0, 3).join(', ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🎭 Eventos por Categoria</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th>Quantidade</th>
                        <th>% Regional</th>
                        <th>% Gratuitos</th>
                        <th>Próximos</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.eventsByCategory).map(([category, info]) => `
                        <tr>
                            <td><span class="badge badge-success">${category}</span></td>
                            <td>${info.count}</td>
                            <td>${info.regionalPercentage}%</td>
                            <td>${info.freePercentage}%</td>
                            <td>${info.upcomingCount}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🏆 Top Eventos</h2>
            <ul class="event-list">
                ${data.topEvents.slice(0, 10).map(event => `
                    <li class="event-item">
                        <div class="event-title">${event.title}</div>
                        <div class="event-details">
                            📅 ${new Date(event.date).toLocaleDateString('pt-BR')} | 
                            📍 ${event.location || 'Local não informado'} | 
                            🎭 ${event.category} | 
                            ⭐ ${event.popularityScore}
                            ${event.isRegional ? '<span class="badge badge-warning">Regional</span>' : '<span class="badge badge-primary">Nacional</span>'}
                            ${event.isFree ? '<span class="badge badge-success">Gratuito</span>' : ''}
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>📅 Próximos Eventos</h2>
            <ul class="event-list">
                ${data.upcomingEvents.slice(0, 15).map(event => `
                    <li class="event-item">
                        <div class="event-title">${event.title}</div>
                        <div class="event-details">
                            📅 ${new Date(event.date).toLocaleDateString('pt-BR')} (em ${event.daysUntil} dias) | 
                            📍 ${event.location || 'Local não informado'} | 
                            🎭 ${event.category}
                            ${event.isRegional ? '<span class="badge badge-warning">Regional</span>' : '<span class="badge badge-primary">Nacional</span>'}
                            ${event.isFree ? '<span class="badge badge-success">Gratuito</span>' : ''}
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>📈 Métricas de Qualidade</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${data.qualityMetrics.qualityDistribution.high}</h3>
                    <p>Alta Qualidade (>0.8)</p>
                </div>
                <div class="stat-card">
                    <h3>${data.qualityMetrics.qualityDistribution.medium}</h3>
                    <p>Qualidade Média (0.5-0.8)</p>
                </div>
                <div class="stat-card">
                    <h3>${data.qualityMetrics.qualityDistribution.low}</h3>
                    <p>Baixa Qualidade (<0.5)</p>
                </div>
            </div>
            
            <h3>Completude dos Dados</h3>
            ${Object.entries(data.qualityMetrics.completenessMetrics).map(([metric, info]) => `
                <div style="margin: 10px 0;">
                    <strong>${metric}:</strong> ${info.count} eventos (${info.percentage}%)
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${info.percentage}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
            <p>Relatório gerado pelo Sistema de Scraping de Eventos Brasil</p>
            <p>Foco: Ji-Paraná/RO + Artistas Famosos do Brasil | Política: Apenas eventos reais</p>
        </div>
    </div>
</body>
</html>`;

    return {
      format: 'html',
      content: html,
      filename: `relatorio-eventos-${this.getTimestamp()}.html`
    };
  }

  /**
   * Gera relatório em formato CSV
   */
  async generateCSVReport(data) {
    const events = await this.dbHandler.getEvents();
    
    const csvHeaders = [
      'Título',
      'Data',
      'Local',
      'Cidade',
      'Estado',
      'Categoria',
      'Fonte',
      'Regional',
      'Gratuito',
      'Preço Mín',
      'Preço Máx',
      'Organizador',
      'Score Qualidade',
      'Score Popularidade',
      'URL',
      'Coletado em'
    ];

    const csvRows = events.map(event => [
      `"${(event.title || '').replace(/"/g, '""')}"`,
      event.date || '',
      `"${(event.location_venue || '').replace(/"/g, '""')}"`,
      event.location_city || '',
      event.location_state || '',
      event.category || '',
      event.source || '',
      event.is_regional ? 'Sim' : 'Não',
      event.price_is_free ? 'Sim' : 'Não',
      event.price_min || '',
      event.price_max || '',
      `"${(event.organizer_name || '').replace(/"/g, '""')}"`,
      event.quality_score || '',
      event.popularity_score || '',
      event.url || '',
      event.scraped_at || ''
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    return {
      format: 'csv',
      content: csvContent,
      filename: `eventos-dados-${this.getTimestamp()}.csv`
    };
  }

  /**
   * Salva relatórios em arquivos
   */
  async saveReports(reports, type = 'report') {
    // Garante que o diretório existe
    await this.ensureReportsDirectory();

    const savedFiles = {};

    for (const [format, report] of Object.entries(reports)) {
      try {
        const filePath = path.join(this.reportsDir, report.filename);
        await fs.writeFile(filePath, report.content, 'utf8');
        
        savedFiles[format] = {
          filename: report.filename,
          path: filePath,
          size: Buffer.byteLength(report.content, 'utf8')
        };

        this.logger.debug(`Relatório ${format.toUpperCase()} salvo: ${report.filename}`);

      } catch (error) {
        this.logger.error(`Erro ao salvar relatório ${format}:`, error);
      }
    }

    return savedFiles;
  }

  /**
   * Garante que o diretório de relatórios existe
   */
  async ensureReportsDirectory() {
    try {
      await fs.access(this.reportsDir);
    } catch (error) {
      await fs.mkdir(this.reportsDir, { recursive: true });
      this.logger.info(`Diretório de relatórios criado: ${this.reportsDir}`);
    }
  }

  /**
   * Gera timestamp para nomes de arquivo
   */
  getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  }

  /**
   * Obtém estatísticas do gerador
   */
  getStats() {
    return {
      ...this.stats,
      reportsDirectory: this.reportsDir,
      supportedFormats: this.reportConfig.formats
    };
  }
}

module.exports = { ReportGenerator };