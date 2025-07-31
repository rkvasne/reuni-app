/**
 * Error Report Generator
 * 
 * Gera relatórios específicos de erros e sugestões
 * para melhorar a coleta futura de eventos.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const fs = require('fs').promises;
const path = require('path');
const { Logger } = require('../utils/logger');
const { DatabaseHandler } = require('../storage/database-handler');
const { globalErrorHandler } = require('../utils/error-handler');
const config = require('../utils/config');

class ErrorReportGenerator {
  constructor() {
    this.logger = new Logger('error-report-generator');
    this.dbHandler = new DatabaseHandler();
    this.reportsDir = config.reports.directory;
    
    // Estatísticas
    this.stats = {
      errorReportsGenerated: 0,
      totalErrorsAnalyzed: 0,
      suggestionsGenerated: 0
    };
  }

  /**
   * Gera relatório completo de erros
   */
  async generateErrorReport(options = {}) {
    try {
      this.logger.info('Iniciando geração de relatório de erros');
      
      // Conecta ao banco se necessário
      if (!this.dbHandler.isConnected) {
        await this.dbHandler.connect();
      }

      // Coleta dados de erro
      const errorData = await this.collectErrorData(options);
      
      // Gera análises e sugestões
      const analysis = await this.analyzeErrors(errorData);
      
      // Gera sugestões de melhoria
      const suggestions = await this.generateSuggestions(errorData, analysis);
      
      const reportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          period: options.period || 'last_7_days',
          analysisType: 'error_analysis'
        },
        summary: this.generateErrorSummary(errorData),
        errorsByType: this.categorizeErrors(errorData),
        errorsBySource: this.groupErrorsBySource(errorData),
        performanceMetrics: this.calculatePerformanceMetrics(errorData),
        suggestions: suggestions,
        recommendations: this.generateRecommendations(analysis)
      };

      // Salva relatório
      const report = await this.generateHTMLErrorReport(reportData);
      const savedReport = await this.saveErrorReport(report);
      
      this.stats.errorReportsGenerated++;
      this.stats.totalErrorsAnalyzed = errorData.length;
      this.stats.suggestionsGenerated = suggestions.length;
      
      this.logger.success(`Relatório de erros gerado: ${savedReport.filename}`);
      
      return {
        success: true,
        data: reportData,
        file: savedReport,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Erro ao gerar relatório de erros:', error);
      throw error;
    }
  } 
 /**
   * Coleta dados de erro dos logs
   */
  async collectErrorData(options = {}) {
    const period = options.period || 'last_7_days';
    const cutoffDate = this.calculateCutoffDate(period);

    try {
      const { data, error } = await this.dbHandler.supabase
        .from(this.dbHandler.tables.scraping_logs)
        .select('*')
        .gte('started_at', cutoffDate.toISOString())
        .order('started_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Filtra apenas operações com erros
      const errorLogs = (data || []).filter(log => 
        log.status === 'failed' || log.errors_count > 0
      );

      return errorLogs;

    } catch (error) {
      this.logger.error('Erro ao coletar dados de erro:', error);
      return [];
    }
  }

  /**
   * Calcula data de corte baseada no período
   */
  calculateCutoffDate(period) {
    const now = new Date();
    
    switch (period) {
      case 'last_24_hours':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'last_7_days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'last_30_days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Gera resumo dos erros
   */
  generateErrorSummary(errorData) {
    const summary = {
      totalOperations: errorData.length,
      failedOperations: errorData.filter(log => log.status === 'failed').length,
      totalErrors: errorData.reduce((sum, log) => sum + (log.errors_count || 0), 0),
      averageErrorsPerOperation: 0,
      mostCommonErrorType: null,
      worstPerformingSource: null
    };

    if (summary.totalOperations > 0) {
      summary.averageErrorsPerOperation = 
        Math.round((summary.totalErrors / summary.totalOperations) * 100) / 100;
    }

    // Encontra tipo de erro mais comum
    const errorTypes = {};
    errorData.forEach(log => {
      if (log.error_details && log.error_details.type) {
        errorTypes[log.error_details.type] = (errorTypes[log.error_details.type] || 0) + 1;
      }
    });

    if (Object.keys(errorTypes).length > 0) {
      summary.mostCommonErrorType = Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)[0][0];
    }

    // Encontra fonte com pior performance
    const sourceErrors = {};
    errorData.forEach(log => {
      const source = log.source || 'unknown';
      sourceErrors[source] = (sourceErrors[source] || 0) + (log.errors_count || 0);
    });

    if (Object.keys(sourceErrors).length > 0) {
      summary.worstPerformingSource = Object.entries(sourceErrors)
        .sort(([,a], [,b]) => b - a)[0][0];
    }

    return summary;
  }

  /**
   * Categoriza erros por tipo
   */
  categorizeErrors(errorData) {
    const categories = {
      network_errors: { count: 0, operations: [] },
      parsing_errors: { count: 0, operations: [] },
      rate_limit_errors: { count: 0, operations: [] },
      database_errors: { count: 0, operations: [] },
      validation_errors: { count: 0, operations: [] },
      timeout_errors: { count: 0, operations: [] },
      unknown_errors: { count: 0, operations: [] }
    };

    errorData.forEach(log => {
      let category = 'unknown_errors';
      
      if (log.error_details) {
        const errorType = log.error_details.type || '';
        
        if (errorType.includes('network') || errorType.includes('connection')) {
          category = 'network_errors';
        } else if (errorType.includes('parsing') || errorType.includes('selector')) {
          category = 'parsing_errors';
        } else if (errorType.includes('rate') || errorType.includes('429')) {
          category = 'rate_limit_errors';
        } else if (errorType.includes('database')) {
          category = 'database_errors';
        } else if (errorType.includes('validation')) {
          category = 'validation_errors';
        } else if (errorType.includes('timeout')) {
          category = 'timeout_errors';
        }
      }

      categories[category].count += log.errors_count || 1;
      categories[category].operations.push({
        id: log.id,
        source: log.source,
        startedAt: log.started_at,
        errorMessage: log.error_details?.message || 'Erro não especificado'
      });
    });

    return categories;
  }

  /**
   * Agrupa erros por fonte
   */
  groupErrorsBySource(errorData) {
    const bySource = {};

    errorData.forEach(log => {
      const source = log.source || 'unknown';
      
      if (!bySource[source]) {
        bySource[source] = {
          totalOperations: 0,
          failedOperations: 0,
          totalErrors: 0,
          errorRate: 0,
          commonErrors: {},
          averageDuration: 0
        };
      }

      const sourceData = bySource[source];
      sourceData.totalOperations++;
      sourceData.totalErrors += log.errors_count || 0;
      sourceData.averageDuration += log.duration_ms || 0;

      if (log.status === 'failed') {
        sourceData.failedOperations++;
      }

      // Conta tipos de erro comuns
      if (log.error_details && log.error_details.type) {
        const errorType = log.error_details.type;
        sourceData.commonErrors[errorType] = (sourceData.commonErrors[errorType] || 0) + 1;
      }
    });

    // Calcula médias e percentuais
    Object.keys(bySource).forEach(source => {
      const data = bySource[source];
      data.errorRate = data.totalOperations > 0 ? 
        Math.round((data.failedOperations / data.totalOperations) * 100) : 0;
      data.averageDuration = data.totalOperations > 0 ? 
        Math.round(data.averageDuration / data.totalOperations) : 0;
    });

    return bySource;
  }

  /**
   * Calcula métricas de performance
   */
  calculatePerformanceMetrics(errorData) {
    const metrics = {
      reliability: {
        uptime: 0,
        successRate: 0,
        mtbf: 0 // Mean Time Between Failures
      },
      performance: {
        averageResponseTime: 0,
        slowestOperations: [],
        timeoutRate: 0
      },
      quality: {
        dataQualityScore: 0,
        rejectionRate: 0,
        duplicateRate: 0
      }
    };

    if (errorData.length === 0) return metrics;

    // Calcula métricas de confiabilidade
    const totalOperations = errorData.length;
    const failedOperations = errorData.filter(log => log.status === 'failed').length;
    metrics.reliability.successRate = Math.round(((totalOperations - failedOperations) / totalOperations) * 100);

    // Calcula métricas de performance
    const durations = errorData.map(log => log.duration_ms || 0).filter(d => d > 0);
    if (durations.length > 0) {
      metrics.performance.averageResponseTime = Math.round(
        durations.reduce((sum, d) => sum + d, 0) / durations.length
      );
    }

    // Operações mais lentas
    metrics.performance.slowestOperations = errorData
      .filter(log => log.duration_ms > 0)
      .sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0))
      .slice(0, 5)
      .map(log => ({
        source: log.source,
        duration: log.duration_ms,
        startedAt: log.started_at,
        errorCount: log.errors_count
      }));

    // Taxa de timeout
    const timeoutErrors = errorData.filter(log => 
      log.error_details && log.error_details.type && 
      log.error_details.type.includes('timeout')
    ).length;
    metrics.performance.timeoutRate = Math.round((timeoutErrors / totalOperations) * 100);

    // Métricas de qualidade
    const totalEventsFound = errorData.reduce((sum, log) => sum + (log.events_found || 0), 0);
    const totalEventsRejected = errorData.reduce((sum, log) => sum + (log.events_rejected || 0), 0);
    const totalEventsDuplicated = errorData.reduce((sum, log) => sum + (log.events_duplicated || 0), 0);

    if (totalEventsFound > 0) {
      metrics.quality.rejectionRate = Math.round((totalEventsRejected / totalEventsFound) * 100);
      metrics.quality.duplicateRate = Math.round((totalEventsDuplicated / totalEventsFound) * 100);
      
      const qualityEvents = totalEventsFound - totalEventsRejected;
      metrics.quality.dataQualityScore = Math.round((qualityEvents / totalEventsFound) * 100);
    }

    return metrics;
  }

  /**
   * Gera sugestões baseadas nos erros
   */
  async generateSuggestions(errorData, analysis) {
    const suggestions = [];

    // Sugestões baseadas em tipos de erro
    const errorsByType = this.categorizeErrors(errorData);

    if (errorsByType.network_errors.count > 0) {
      suggestions.push({
        type: 'network_improvement',
        priority: 'high',
        title: 'Melhorar Tratamento de Erros de Rede',
        description: `Detectados ${errorsByType.network_errors.count} erros de rede. Considere implementar retry automático e verificação de conectividade.`,
        actions: [
          'Implementar retry exponencial para falhas de rede',
          'Adicionar verificação de conectividade antes do scraping',
          'Configurar timeout mais apropriado para conexões lentas'
        ]
      });
    }

    if (errorsByType.parsing_errors.count > 0) {
      suggestions.push({
        type: 'parsing_improvement',
        priority: 'high',
        title: 'Atualizar Seletores CSS',
        description: `Detectados ${errorsByType.parsing_errors.count} erros de parsing. Os sites podem ter mudado sua estrutura.`,
        actions: [
          'Revisar e atualizar seletores CSS para Eventbrite e Sympla',
          'Implementar seletores alternativos (fallback)',
          'Adicionar monitoramento automático de mudanças estruturais'
        ]
      });
    }

    if (errorsByType.rate_limit_errors.count > 0) {
      suggestions.push({
        type: 'rate_limit_improvement',
        priority: 'medium',
        title: 'Otimizar Rate Limiting',
        description: `Detectados ${errorsByType.rate_limit_errors.count} erros de rate limit. Ajustar delays entre requisições.`,
        actions: [
          'Aumentar delay base entre requisições',
          'Implementar rate limiting adaptativo',
          'Distribuir scraping em horários de menor tráfego'
        ]
      });
    }

    // Sugestões baseadas em performance
    const performanceMetrics = this.calculatePerformanceMetrics(errorData);
    
    if (performanceMetrics.reliability.successRate < 80) {
      suggestions.push({
        type: 'reliability_improvement',
        priority: 'critical',
        title: 'Melhorar Confiabilidade do Sistema',
        description: `Taxa de sucesso atual: ${performanceMetrics.reliability.successRate}%. Meta: >90%.`,
        actions: [
          'Implementar health checks automáticos',
          'Adicionar monitoramento em tempo real',
          'Criar alertas para falhas críticas'
        ]
      });
    }

    if (performanceMetrics.performance.averageResponseTime > 30000) {
      suggestions.push({
        type: 'performance_improvement',
        priority: 'medium',
        title: 'Otimizar Performance',
        description: `Tempo médio de resposta: ${performanceMetrics.performance.averageResponseTime}ms. Meta: <30s.`,
        actions: [
          'Otimizar seletores CSS para melhor performance',
          'Implementar cache para elementos repetitivos',
          'Reduzir número de elementos processados por página'
        ]
      });
    }

    return suggestions;
  }

  /**
   * Gera recomendações gerais
   */
  generateRecommendations(analysis) {
    const recommendations = [
      {
        category: 'Monitoramento',
        items: [
          'Implementar dashboard em tempo real para monitorar operações',
          'Configurar alertas automáticos para falhas críticas',
          'Criar relatórios automáticos diários de saúde do sistema'
        ]
      },
      {
        category: 'Manutenção',
        items: [
          'Revisar seletores CSS mensalmente',
          'Atualizar configurações de rate limiting baseado em performance',
          'Limpar logs antigos automaticamente'
        ]
      },
      {
        category: 'Qualidade',
        items: [
          'Implementar validação mais rigorosa de dados coletados',
          'Adicionar verificação automática de qualidade de imagens',
          'Criar sistema de feedback para melhorar classificação de categorias'
        ]
      }
    ];

    return recommendations;
  }  /**

   * Gera relatório HTML de erros
   */
  async generateHTMLErrorReport(data) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Erros - ${data.metadata.generatedAt}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #dc3545; }
        .header h1 { color: #dc3545; margin: 0; }
        .alert { padding: 15px; margin: 20px 0; border-radius: 8px; }
        .alert-danger { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.error { border-left: 4px solid #dc3545; }
        .stat-card.warning { border-left: 4px solid #ffc107; }
        .stat-card.info { border-left: 4px solid #17a2b8; }
        .stat-card h3 { margin: 0 0 10px 0; font-size: 2em; }
        .stat-card.error h3 { color: #dc3545; }
        .stat-card.warning h3 { color: #ffc107; }
        .stat-card.info h3 { color: #17a2b8; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: bold; }
        .suggestion { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .suggestion.high { border-left: 4px solid #dc3545; }
        .suggestion.medium { border-left: 4px solid #ffc107; }
        .suggestion.critical { border-left: 4px solid #6f42c1; }
        .suggestion h4 { margin: 0 0 10px 0; color: #333; }
        .suggestion ul { margin: 10px 0; padding-left: 20px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .badge-danger { background: #dc3545; color: white; }
        .badge-warning { background: #ffc107; color: black; }
        .badge-info { background: #17a2b8; color: white; }
        .progress-bar { background: #e9ecef; border-radius: 4px; overflow: hidden; height: 20px; margin: 5px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-success { background: #28a745; }
        .progress-warning { background: #ffc107; }
        .progress-danger { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Relatório de Erros e Sugestões</h1>
            <p><strong>Gerado em:</strong> ${new Date(data.metadata.generatedAt).toLocaleString('pt-BR')}</p>
            <p><strong>Período:</strong> ${data.metadata.period}</p>
        </div>

        ${data.summary.totalErrors > 0 ? `
        <div class="alert alert-danger">
            <strong>⚠️ Atenção:</strong> Foram detectados ${data.summary.totalErrors} erros em ${data.summary.totalOperations} operações.
            Taxa de falha: ${Math.round((data.summary.failedOperations / data.summary.totalOperations) * 100)}%
        </div>
        ` : `
        <div class="alert alert-info">
            <strong>✅ Boa notícia:</strong> Nenhum erro crítico detectado no período analisado.
        </div>
        `}

        <div class="section">
            <h2>📊 Resumo de Erros</h2>
            <div class="stats-grid">
                <div class="stat-card error">
                    <h3>${data.summary.totalErrors}</h3>
                    <p>Total de Erros</p>
                </div>
                <div class="stat-card warning">
                    <h3>${data.summary.failedOperations}</h3>
                    <p>Operações Falhadas</p>
                </div>
                <div class="stat-card info">
                    <h3>${data.summary.averageErrorsPerOperation}</h3>
                    <p>Erros por Operação</p>
                </div>
                <div class="stat-card warning">
                    <h3>${data.summary.mostCommonErrorType || 'N/A'}</h3>
                    <p>Tipo Mais Comum</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔍 Erros por Tipo</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Tipo de Erro</th>
                        <th>Quantidade</th>
                        <th>Operações Afetadas</th>
                        <th>Severidade</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.errorsByType).map(([type, info]) => `
                        <tr>
                            <td>${type.replace(/_/g, ' ').toUpperCase()}</td>
                            <td>${info.count}</td>
                            <td>${info.operations.length}</td>
                            <td>
                                ${info.count > 10 ? '<span class="badge badge-danger">Alta</span>' : 
                                  info.count > 5 ? '<span class="badge badge-warning">Média</span>' : 
                                  '<span class="badge badge-info">Baixa</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📡 Performance por Fonte</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Fonte</th>
                        <th>Taxa de Erro</th>
                        <th>Total de Erros</th>
                        <th>Tempo Médio</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.errorsBySource).map(([source, info]) => `
                        <tr>
                            <td>${source}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill ${info.errorRate > 20 ? 'progress-danger' : info.errorRate > 10 ? 'progress-warning' : 'progress-success'}" 
                                         style="width: ${info.errorRate}%"></div>
                                </div>
                                ${info.errorRate}%
                            </td>
                            <td>${info.totalErrors}</td>
                            <td>${Math.round(info.averageDuration / 1000)}s</td>
                            <td>
                                ${info.errorRate > 20 ? '<span class="badge badge-danger">Crítico</span>' : 
                                  info.errorRate > 10 ? '<span class="badge badge-warning">Atenção</span>' : 
                                  '<span class="badge badge-info">OK</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📈 Métricas de Performance</h2>
            <div class="stats-grid">
                <div class="stat-card ${data.performanceMetrics.reliability.successRate > 90 ? 'info' : data.performanceMetrics.reliability.successRate > 70 ? 'warning' : 'error'}">
                    <h3>${data.performanceMetrics.reliability.successRate}%</h3>
                    <p>Taxa de Sucesso</p>
                </div>
                <div class="stat-card info">
                    <h3>${Math.round(data.performanceMetrics.performance.averageResponseTime / 1000)}s</h3>
                    <p>Tempo Médio</p>
                </div>
                <div class="stat-card ${data.performanceMetrics.performance.timeoutRate > 10 ? 'error' : data.performanceMetrics.performance.timeoutRate > 5 ? 'warning' : 'info'}">
                    <h3>${data.performanceMetrics.performance.timeoutRate}%</h3>
                    <p>Taxa de Timeout</p>
                </div>
                <div class="stat-card ${data.performanceMetrics.quality.dataQualityScore > 80 ? 'info' : data.performanceMetrics.quality.dataQualityScore > 60 ? 'warning' : 'error'}">
                    <h3>${data.performanceMetrics.quality.dataQualityScore}%</h3>
                    <p>Qualidade dos Dados</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>💡 Sugestões de Melhoria</h2>
            ${data.suggestions.map(suggestion => `
                <div class="suggestion ${suggestion.priority}">
                    <h4>${suggestion.title}</h4>
                    <p>${suggestion.description}</p>
                    <strong>Ações Recomendadas:</strong>
                    <ul>
                        ${suggestion.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                    <span class="badge badge-${suggestion.priority === 'critical' ? 'danger' : suggestion.priority === 'high' ? 'danger' : suggestion.priority === 'medium' ? 'warning' : 'info'}">
                        Prioridade: ${suggestion.priority.toUpperCase()}
                    </span>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🔧 Recomendações Gerais</h2>
            ${data.recommendations.map(rec => `
                <div class="suggestion">
                    <h4>${rec.category}</h4>
                    <ul>
                        ${rec.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
            <p>Relatório de Erros gerado pelo Sistema de Scraping de Eventos Brasil</p>
            <p>Use essas informações para melhorar a confiabilidade e performance do sistema</p>
        </div>
    </div>
</body>
</html>`;

    return {
      format: 'html',
      content: html,
      filename: `relatorio-erros-${this.getTimestamp()}.html`
    };
  }

  /**
   * Salva relatório de erro
   */
  async saveErrorReport(report) {
    // Garante que o diretório existe
    await this.ensureReportsDirectory();

    try {
      const filePath = path.join(this.reportsDir, report.filename);
      await fs.writeFile(filePath, report.content, 'utf8');
      
      this.logger.debug(`Relatório de erros salvo: ${report.filename}`);

      return {
        filename: report.filename,
        path: filePath,
        size: Buffer.byteLength(report.content, 'utf8')
      };

    } catch (error) {
      this.logger.error('Erro ao salvar relatório de erros:', error);
      throw error;
    }
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
      reportsDirectory: this.reportsDir
    };
  }
}

module.exports = { ErrorReportGenerator };