/**
 * Structure Monitor
 * 
 * Monitora mudanças estruturais nos sites de eventos
 * e detecta quando seletores CSS precisam ser atualizados.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const { Logger } = require('../utils/logger');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('../utils/error-handler');
const { DatabaseHandler } = require('../storage/database-handler');
const config = require('../utils/config');

class StructureMonitor {
  constructor() {
    this.logger = new Logger('structure-monitor');
    this.dbHandler = new DatabaseHandler();
    
    // Configurações de monitoramento
    this.config = {
      checkInterval: 24 * 60 * 60 * 1000, // 24 horas
      failureThreshold: 3, // Falhas consecutivas para alertar
      selectorTimeout: 10000, // Timeout para verificar seletores
      minElementsExpected: 1 // Mínimo de elementos esperados
    };
    
    // Estado do monitoramento
    this.monitoringState = {
      lastCheck: {},
      consecutiveFailures: {},
      selectorHealth: {},
      alerts: []
    };
    
    // Estatísticas
    this.stats = {
      totalChecks: 0,
      structuralChangesDetected: 0,
      alertsGenerated: 0,
      autoRecoveries: 0
    };
  }

  /**
   * Inicia monitoramento automático
   */
  startMonitoring() {
    this.logger.info('Iniciando monitoramento de estruturas');
    
    // Verifica imediatamente
    this.checkAllStructures();
    
    // Agenda verificações periódicas
    this.monitoringInterval = setInterval(() => {
      this.checkAllStructures();
    }, this.config.checkInterval);
    
    return this.monitoringInterval;
  }

  /**
   * Para monitoramento automático
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('Monitoramento de estruturas parado');
    }
  }

  /**
   * Verifica estruturas de todos os scrapers
   */
  async checkAllStructures() {
    this.logger.info('Verificando estruturas de todos os scrapers');
    
    const scrapers = ['eventbrite', 'sympla'];
    const results = {};
    
    for (const scraperName of scrapers) {
      try {
        this.stats.totalChecks++;
        const result = await this.checkScraperStructure(scraperName);
        results[scraperName] = result;
        
        // Atualiza estado
        this.updateMonitoringState(scraperName, result);
        
      } catch (error) {
        this.logger.error(`Erro ao verificar estrutura do ${scraperName}:`, error);
        results[scraperName] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    // Gera alertas se necessário
    await this.processResults(results);
    
    return results;
  }

  /**
   * Verifica estrutura de um scraper específico
   */
  async checkScraperStructure(scraperName) {
    const scraperConfig = config.scrapers[scraperName];
    if (!scraperConfig) {
      throw new ScrapingError(
        `Configuração não encontrada para scraper: ${scraperName}`,
        ErrorTypes.CONFIGURATION_ERROR,
        ErrorSeverity.HIGH
      );
    }

    this.logger.debug(`Verificando estrutura do ${scraperName}`);
    
    const puppeteer = require('puppeteer');
    let browser = null;
    let page = null;
    
    try {
      // Inicia browser
      browser = await puppeteer.launch({
        headless: true,
        args: config.scraping.puppeteer.args
      });
      
      page = await browser.newPage();
      
      // Configura user agent
      await page.setUserAgent(config.scraping.userAgent);
      
      // Navega para página de teste
      const testUrl = this.getTestUrl(scraperName);
      await page.goto(testUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Verifica seletores principais
      const selectorResults = await this.checkSelectors(page, scraperConfig.selectors);
      
      // Verifica estrutura da página
      const structureResults = await this.checkPageStructure(page, scraperName);
      
      // Verifica performance
      const performanceResults = await this.checkPerformance(page);
      
      const result = {
        success: true,
        scraperName,
        timestamp: new Date().toISOString(),
        url: testUrl,
        selectors: selectorResults,
        structure: structureResults,
        performance: performanceResults,
        overallHealth: this.calculateOverallHealth(selectorResults, structureResults)
      };
      
      this.logger.debug(`Verificação do ${scraperName} concluída: ${result.overallHealth}% de saúde`);
      
      return result;
      
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  /**
   * Obtém URL de teste para um scraper
   */
  getTestUrl(scraperName) {
    const urls = {
      eventbrite: 'https://www.eventbrite.com.br/d/brazil/events/',
      sympla: 'https://www.sympla.com.br/eventos'
    };
    
    return urls[scraperName] || urls.eventbrite;
  }

  /**
   * Verifica seletores CSS
   */
  async checkSelectors(page, selectors) {
    const results = {};
    
    for (const [selectorName, selectorValue] of Object.entries(selectors)) {
      try {
        // Se é array de seletores, testa todos
        const selectorsToTest = Array.isArray(selectorValue) ? selectorValue : [selectorValue];
        
        let found = false;
        let elementCount = 0;
        let workingSelector = null;
        
        for (const selector of selectorsToTest) {
          try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
              found = true;
              elementCount = elements.length;
              workingSelector = selector;
              break;
            }
          } catch (error) {
            // Selector inválido, continua para o próximo
            continue;
          }
        }
        
        results[selectorName] = {
          found,
          elementCount,
          workingSelector,
          allSelectors: selectorsToTest,
          health: found ? (elementCount >= this.config.minElementsExpected ? 100 : 50) : 0
        };
        
      } catch (error) {
        results[selectorName] = {
          found: false,
          elementCount: 0,
          workingSelector: null,
          error: error.message,
          health: 0
        };
      }
    }
    
    return results;
  }

  /**
   * Verifica estrutura geral da página
   */
  async checkPageStructure(page, scraperName) {
    const checks = {
      hasTitle: false,
      hasEvents: false,
      hasNavigation: false,
      hasFooter: false,
      pageLoaded: false,
      jsErrors: []
    };
    
    try {
      // Verifica título
      const title = await page.title();
      checks.hasTitle = title && title.length > 0;
      
      // Verifica se há eventos na página
      const eventSelectors = {
        eventbrite: '[data-testid="event-card"], .event-card, .search-event-card',
        sympla: '.sympla-card, .event-item, .EventCardstyles__Container'
      };
      
      const eventSelector = eventSelectors[scraperName];
      if (eventSelector) {
        const events = await page.$$(eventSelector);
        checks.hasEvents = events.length > 0;
      }
      
      // Verifica navegação
      const navElements = await page.$$('nav, .navigation, .navbar, header');
      checks.hasNavigation = navElements.length > 0;
      
      // Verifica footer
      const footerElements = await page.$$('footer, .footer');
      checks.hasFooter = footerElements.length > 0;
      
      // Verifica se página carregou completamente
      checks.pageLoaded = await page.evaluate(() => {
        return document.readyState === 'complete';
      });
      
      // Coleta erros JavaScript
      checks.jsErrors = await page.evaluate(() => {
        return window.jsErrors || [];
      });
      
    } catch (error) {
      this.logger.warn(`Erro ao verificar estrutura da página ${scraperName}:`, error.message);
    }
    
    return checks;
  }

  /**
   * Verifica performance da página
   */
  async checkPerformance(page) {
    try {
      const metrics = await page.metrics();
      
      return {
        loadTime: metrics.Timestamp,
        jsHeapUsed: metrics.JSHeapUsedSize,
        jsHeapTotal: metrics.JSHeapTotalSize,
        domNodes: metrics.Nodes,
        layoutCount: metrics.LayoutCount,
        recalcStyleCount: metrics.RecalcStyleCount
      };
      
    } catch (error) {
      this.logger.warn('Erro ao coletar métricas de performance:', error.message);
      return {};
    }
  }

  /**
   * Calcula saúde geral baseada nos resultados
   */
  calculateOverallHealth(selectorResults, structureResults) {
    let totalHealth = 0;
    let totalChecks = 0;
    
    // Saúde dos seletores (peso 70%)
    const selectorHealthValues = Object.values(selectorResults).map(r => r.health || 0);
    if (selectorHealthValues.length > 0) {
      const avgSelectorHealth = selectorHealthValues.reduce((sum, h) => sum + h, 0) / selectorHealthValues.length;
      totalHealth += avgSelectorHealth * 0.7;
      totalChecks += 0.7;
    }
    
    // Saúde da estrutura (peso 30%)
    const structureChecks = Object.values(structureResults);
    const structureHealthCount = structureChecks.filter(check => check === true).length;
    const structureHealth = structureChecks.length > 0 ? 
      (structureHealthCount / structureChecks.length) * 100 : 0;
    
    totalHealth += structureHealth * 0.3;
    totalChecks += 0.3;
    
    return totalChecks > 0 ? Math.round(totalHealth / totalChecks) : 0;
  }

  /**
   * Atualiza estado do monitoramento
   */
  updateMonitoringState(scraperName, result) {
    this.monitoringState.lastCheck[scraperName] = result.timestamp;
    this.monitoringState.selectorHealth[scraperName] = result.overallHealth;
    
    if (!result.success || result.overallHealth < 50) {
      this.monitoringState.consecutiveFailures[scraperName] = 
        (this.monitoringState.consecutiveFailures[scraperName] || 0) + 1;
    } else {
      this.monitoringState.consecutiveFailures[scraperName] = 0;
    }
  }

  /**
   * Processa resultados e gera alertas
   */
  async processResults(results) {
    for (const [scraperName, result] of Object.entries(results)) {
      const failures = this.monitoringState.consecutiveFailures[scraperName] || 0;
      
      // Gera alerta se necessário
      if (failures >= this.config.failureThreshold) {
        await this.generateAlert(scraperName, result, failures);
      }
      
      // Detecta mudanças estruturais
      if (result.success && result.overallHealth < 70) {
        await this.detectStructuralChanges(scraperName, result);
      }
    }
  }

  /**
   * Gera alerta para problemas detectados
   */
  async generateAlert(scraperName, result, failures) {
    const alert = {
      id: `alert_${scraperName}_${Date.now()}`,
      type: 'structural_change',
      scraperName,
      severity: failures >= 5 ? 'critical' : 'high',
      message: `Detectadas ${failures} falhas consecutivas no ${scraperName}`,
      details: result,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    this.monitoringState.alerts.push(alert);
    this.stats.alertsGenerated++;
    
    this.logger.error(`ALERTA: ${alert.message}`, alert.details);
    
    // Salva alerta no banco se possível
    try {
      if (!this.dbHandler.isConnected) {
        await this.dbHandler.connect();
      }
      
      // Aqui você poderia salvar o alerta em uma tabela específica
      // await this.dbHandler.saveAlert(alert);
      
    } catch (error) {
      this.logger.warn('Erro ao salvar alerta no banco:', error.message);
    }
    
    return alert;
  }

  /**
   * Detecta mudanças estruturais específicas
   */
  async detectStructuralChanges(scraperName, result) {
    const changes = [];
    
    // Analisa seletores que falharam
    for (const [selectorName, selectorResult] of Object.entries(result.selectors || {})) {
      if (!selectorResult.found) {
        changes.push({
          type: 'selector_not_found',
          selector: selectorName,
          attempted: selectorResult.allSelectors,
          suggestion: this.suggestAlternativeSelector(selectorName, scraperName)
        });
      } else if (selectorResult.elementCount < this.config.minElementsExpected) {
        changes.push({
          type: 'insufficient_elements',
          selector: selectorName,
          found: selectorResult.elementCount,
          expected: this.config.minElementsExpected
        });
      }
    }
    
    if (changes.length > 0) {
      this.stats.structuralChangesDetected++;
      
      this.logger.warn(`Mudanças estruturais detectadas no ${scraperName}:`, changes);
      
      // Tenta auto-recuperação
      await this.attemptAutoRecovery(scraperName, changes);
    }
    
    return changes;
  }

  /**
   * Sugere seletor alternativo
   */
  suggestAlternativeSelector(selectorName, scraperName) {
    const alternatives = {
      eventbrite: {
        eventCard: ['.event-card-wrapper', '.event-listing-item', '[class*="event"]'],
        title: ['h1', 'h2', 'h3', '[class*="title"]', '[class*="name"]'],
        date: ['[class*="date"]', '[class*="time"]', 'time'],
        location: ['[class*="location"]', '[class*="venue"]', '[class*="address"]'],
        image: ['img[src*="eventbrite"]', '.event-image img', 'img[alt*="event"]']
      },
      sympla: {
        eventCard: ['.event-wrapper', '.event-container', '[class*="event"]'],
        title: ['h1', 'h2', 'h3', '[class*="title"]', '[class*="name"]'],
        date: ['[class*="date"]', '[class*="time"]', 'time'],
        location: ['[class*="location"]', '[class*="venue"]', '[class*="address"]'],
        image: ['img[src*="sympla"]', '.event-image img', 'img[alt*="event"]']
      }
    };
    
    return alternatives[scraperName]?.[selectorName] || [];
  }

  /**
   * Tenta auto-recuperação
   */
  async attemptAutoRecovery(scraperName, changes) {
    this.logger.info(`Tentando auto-recuperação para ${scraperName}`);
    
    // Por enquanto, apenas registra a tentativa
    // Em uma implementação completa, poderia:
    // 1. Testar seletores alternativos automaticamente
    // 2. Atualizar configuração temporariamente
    // 3. Notificar administradores
    
    this.stats.autoRecoveries++;
    
    return false; // Não implementado ainda
  }

  /**
   * Obtém relatório de saúde
   */
  getHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overallHealth: this.calculateOverallSystemHealth(),
      scrapers: {},
      alerts: this.monitoringState.alerts.filter(a => !a.resolved),
      stats: this.stats
    };
    
    // Saúde por scraper
    for (const [scraperName, health] of Object.entries(this.monitoringState.selectorHealth)) {
      const failures = this.monitoringState.consecutiveFailures[scraperName] || 0;
      const lastCheck = this.monitoringState.lastCheck[scraperName];
      
      report.scrapers[scraperName] = {
        health,
        consecutiveFailures: failures,
        lastCheck,
        status: health >= 80 ? 'healthy' : health >= 50 ? 'warning' : 'critical'
      };
    }
    
    return report;
  }

  /**
   * Calcula saúde geral do sistema
   */
  calculateOverallSystemHealth() {
    const healthValues = Object.values(this.monitoringState.selectorHealth);
    if (healthValues.length === 0) return 0;
    
    return Math.round(healthValues.reduce((sum, h) => sum + h, 0) / healthValues.length);
  }

  /**
   * Obtém estatísticas do monitor
   */
  getStats() {
    return {
      ...this.stats,
      monitoringState: this.monitoringState,
      config: this.config
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      totalChecks: 0,
      structuralChangesDetected: 0,
      alertsGenerated: 0,
      autoRecoveries: 0
    };
    
    this.monitoringState.alerts = [];
  }
}

module.exports = { StructureMonitor };