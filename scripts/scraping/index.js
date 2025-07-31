/**
 * Sistema de Scraping de Eventos Brasil
 * Ponto de entrada principal
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const path = require('path');
const chalk = require('chalk');

// Configuração do ambiente
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Importações dos módulos principais
const { Authenticator } = require('./auth/authenticator');
const { InteractiveMenu } = require('./cli/interactive-menu');
const { ScraperFactory } = require('./scrapers/scraper-factory');
const { DataProcessor } = require('./processors/data-processor');
const { DatabaseHandler } = require('./storage/database-handler');
const { OperationLogger } = require('./storage/operation-logger');
const { ReportGenerator } = require('./reports/report-generator');
const { RetryHandler } = require('./utils/retry-handler');
const { StructureMonitor } = require('./monitoring/structure-monitor');
const { RealTimeStats } = require('./utils/real-time-stats');
const { Logger } = require('./utils/logger');
const { ScrapingError, ErrorTypes, ErrorSeverity } = require('./utils/error-handler');
const config = require('./utils/config');

class ScrapingOrchestrator {
  constructor() {
    this.logger = new Logger('orchestrator');
    this.authenticator = new Authenticator();
    this.menu = new InteractiveMenu();
    this.scraperFactory = new ScraperFactory();
    this.dataProcessor = new DataProcessor();
    this.dbHandler = new DatabaseHandler();
    this.operationLogger = new OperationLogger();
    this.reportGenerator = new ReportGenerator();
    this.retryHandler = new RetryHandler();
    this.structureMonitor = new StructureMonitor();
    this.realTimeStats = new RealTimeStats();
    
    // Estado da sessão
    this.session = {
      authenticated: false,
      user: null,
      config: null,
      startTime: Date.now()
    };
    
    // Estatísticas da execução
    this.executionStats = {
      totalEvents: 0,
      eventsInserted: 0,
      eventsDuplicated: 0,
      eventsRejected: 0,
      errors: 0,
      duration: 0
    };
  }

  /**
   * Exibe banner inicial
   */
  showBanner() {
    console.log('\n' + chalk.cyan('🎫 ═══════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan('   SISTEMA DE SCRAPING DE EVENTOS BRASIL'));
    console.log(chalk.cyan('   ═══════════════════════════════════════════════════════════════'));
    console.log(chalk.gray('   📍 Foco: Ji-Paraná/RO + Artistas Famosos do Brasil'));
    console.log(chalk.gray('   ✅ Política: Apenas eventos reais, sem dados fictícios'));
    console.log(chalk.gray('   🔒 Sistema autenticado e seguro'));
    console.log(chalk.gray('   🚀 Versão: 1.0.0\n'));
  }

  /**
   * Fluxo principal do sistema
   */
  async run() {
    try {
      this.showBanner();
      this.logger.info('Iniciando Sistema de Scraping de Eventos Brasil');

      // Inicia estatísticas em tempo real
      this.realTimeStats.startRealTimeDisplay();

      // 1. Autenticação obrigatória
      this.realTimeStats.setPhase('authentication');
      await this.authenticate();
      this.realTimeStats.updateProgress(1, 1);

      // 2. Verificação de saúde do sistema
      this.realTimeStats.setPhase('health_check');
      await this.performHealthCheck();

      // 3. Menu interativo para configuração
      this.realTimeStats.setPhase('menu');
      const menuResult = await this.showInteractiveMenu();

      if (menuResult.action === 'exit') {
        this.realTimeStats.stopRealTimeDisplay();
        await this.gracefulShutdown();
        return;
      }

      // 4. Execução do scraping
      await this.executeScraping(menuResult.config);

      // 5. Geração de relatórios
      await this.generateReports();

      // 6. Finalização
      this.realTimeStats.setPhase('finalizing');
      this.realTimeStats.stopRealTimeDisplay();
      await this.gracefulShutdown();

    } catch (error) {
      this.realTimeStats.stopRealTimeDisplay();
      await this.handleCriticalError(error);
    }
  }

  /**
   * Etapa 1: Autenticação
   */
  async authenticate() {
    console.log(chalk.yellow('🔐 Etapa 1: Autenticação'));
    
    try {
      const authResult = await this.authenticator.authenticate();

      if (!authResult.success) {
        throw new ScrapingError(
          'Falha na autenticação',
          ErrorTypes.AUTHENTICATION_FAILED,
          ErrorSeverity.CRITICAL,
          { error: authResult.error }
        );
      }

      this.session.authenticated = true;
      this.session.user = authResult.username;

      this.logger.success(`Usuário autenticado: ${authResult.username}`);
      console.log(chalk.green(`✅ Autenticado como: ${authResult.username}\n`));

    } catch (error) {
      this.logger.error('Falha na autenticação', error);
      console.log(chalk.red('\n❌ Acesso negado. Sistema encerrado.'));
      process.exit(1);
    }
  }

  /**
   * Verificação de saúde do sistema
   */
  async performHealthCheck() {
    console.log(chalk.yellow('🏥 Verificação de Saúde do Sistema'));
    
    try {
      // Conecta ao banco de dados
      await this.dbHandler.connect();
      console.log(chalk.green('✅ Banco de dados conectado'));

      // Verifica estrutura dos sites
      console.log(chalk.gray('🔍 Verificando estrutura dos sites...'));
      const structureCheck = await this.structureMonitor.checkAllStructures();
      
      let healthyScrapers = 0;
      for (const [scraper, result] of Object.entries(structureCheck)) {
        if (result.success && result.overallHealth >= 70) {
          console.log(chalk.green(`✅ ${scraper}: ${result.overallHealth}% saudável`));
          healthyScrapers++;
        } else {
          console.log(chalk.yellow(`⚠️  ${scraper}: ${result.overallHealth || 0}% saudável`));
        }
      }

      if (healthyScrapers === 0) {
        console.log(chalk.yellow('⚠️  Nenhum scraper está completamente saudável, mas continuando...'));
      }

      console.log(chalk.green('✅ Verificação de saúde concluída\n'));

    } catch (error) {
      this.logger.warn('Problemas detectados na verificação de saúde:', error);
      console.log(chalk.yellow('⚠️  Alguns problemas detectados, mas continuando...\n'));
    }
  }

  /**
   * Etapa 2: Menu interativo
   */
  async showInteractiveMenu() {
    console.log(chalk.yellow('🎯 Etapa 2: Configuração'));
    
    try {
      const menuResult = await this.menu.showMainMenu();
      
      if (menuResult.action === 'start_scraping') {
        this.session.config = menuResult.config;
        this.logger.info('Configuração de scraping definida', menuResult.config);
      }

      return menuResult;

    } catch (error) {
      this.logger.error('Erro no menu interativo:', error);
      throw new ScrapingError(
        'Falha na configuração do sistema',
        ErrorTypes.CONFIGURATION_ERROR,
        ErrorSeverity.HIGH,
        { originalError: error }
      );
    }
  }

  /**
   * Etapa 3: Execução do scraping
   */
  async executeScraping(scrapingConfig) {
    const operationId = this.operationLogger.generateOperationId('orchestrator', 'full_scraping');
    
    try {
      // Configura estatísticas para scraping
      this.realTimeStats.setPhase('scraping', { 
        totalSources: scrapingConfig.sources.length 
      });

      // Inicia operação
      this.operationLogger.startOperation(operationId, 'full_scraping', 'multiple', scrapingConfig);

      // Cria scrapers baseado na configuração
      const scrapers = await this.createScrapers(scrapingConfig.sources);
      
      // Executa scraping com estatísticas em tempo real
      const allEvents = await this.executeScrapingWithStats(scrapers, scrapingConfig, operationId);

      this.operationLogger.recordEventsFound(operationId, allEvents.length);
      this.realTimeStats.updateScrapingStats({ eventsFound: allEvents.length });

      // Processa dados com estatísticas
      this.realTimeStats.setPhase('processing', { totalEvents: allEvents.length });
      const processedResults = await this.processEventsWithStats(allEvents, operationId);

      // Salva no banco de dados com estatísticas
      this.realTimeStats.setPhase('saving', { totalEvents: processedResults.successful.length });
      const dbResults = await this.saveEventsWithStats(processedResults.successful, operationId);

      // Atualiza estatísticas finais
      this.updateExecutionStats(processedResults, dbResults);
      
      // Finaliza operação
      await this.operationLogger.completeOperation(operationId, {
        eventsFound: allEvents.length,
        eventsInserted: dbResults.inserted.length,
        eventsDuplicated: dbResults.duplicates.length,
        eventsRejected: processedResults.rejected.length
      });

    } catch (error) {
      await this.operationLogger.failOperation(operationId, error);
      this.realTimeStats.recordError();
      throw error;
    }
  }

  /**
   * Cria scrapers baseado na configuração
   */
  async createScrapers(sources) {
    const scrapers = [];
    
    for (const source of sources) {
      try {
        const scraper = await this.scraperFactory.createScraper(source);
        scrapers.push(scraper);
        this.logger.debug(`Scraper ${source} criado com sucesso`);
      } catch (error) {
        this.logger.warn(`Erro ao criar scraper ${source}:`, error.message);
      }
    }

    if (scrapers.length === 0) {
      throw new ScrapingError(
        'Nenhum scraper pôde ser criado',
        ErrorTypes.CONFIGURATION_ERROR,
        ErrorSeverity.CRITICAL
      );
    }

    return scrapers;
  }

  /**
   * Constrói filtros para scraping
   */
  buildScrapingFilters(config) {
    return {
      maxEvents: config.options.maxEvents,
      categories: config.options.categories,
      dateRange: config.options.dateRange,
      requireImages: config.options.requireImages,
      includeRegional: config.region !== 'national_only',
      includeNational: config.region !== 'jiparana_only'
    };
  }

  /**
   * Executa scraping com estatísticas em tempo real
   */
  async executeScrapingWithStats(scrapers, scrapingConfig, operationId) {
    const allEvents = [];
    const filters = this.buildScrapingFilters(scrapingConfig);
    
    for (let i = 0; i < scrapers.length; i++) {
      const scraper = scrapers[i];
      const sourceName = scraper.scraperName || `scraper_${i}`;
      
      try {
        this.realTimeStats.updateScrapingStats({ 
          currentSource: sourceName,
          completedSources: i 
        });
        
        const events = await scraper.scrapeEvents(filters);
        allEvents.push(...events);
        
        // Atualiza estatísticas
        events.forEach(() => this.realTimeStats.recordEventFound());
        
        this.realTimeStats.updateScrapingStats({ 
          completedSources: i + 1 
        });
        
      } catch (error) {
        this.logger.warn(`Erro no scraper ${sourceName}:`, error.message);
        this.realTimeStats.recordError();
      }
    }
    
    return allEvents;
  }

  /**
   * Processa eventos com estatísticas em tempo real
   */
  async processEventsWithStats(events, operationId) {
    const results = {
      successful: [],
      rejected: []
    };
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      try {
        const result = await this.dataProcessor.processEventData(event, event.source || 'unknown');
        
        if (result.success) {
          results.successful.push(result.data);
          this.realTimeStats.recordEventProcessed(true);
        } else {
          results.rejected.push({
            originalData: event,
            errors: result.errors
          });
          this.realTimeStats.recordEventProcessed(false);
          this.operationLogger.recordEventRejected(operationId, result.errors[0] || 'unknown');
        }

      } catch (error) {
        this.logger.warn('Erro ao processar evento:', error.message);
        results.rejected.push({
          originalData: event,
          errors: ['processing_error']
        });
        this.realTimeStats.recordEventProcessed(false);
        this.realTimeStats.recordError();
        this.operationLogger.recordError(operationId, error);
      }
      
      // Atualiza progresso
      this.realTimeStats.updateProgress(i + 1, events.length);
    }
    
    return results;
  }

  /**
   * Salva eventos com estatísticas em tempo real
   */
  async saveEventsWithStats(events, operationId) {
    if (events.length === 0) {
      return { inserted: [], duplicates: [], errors: [] };
    }

    const results = { inserted: [], duplicates: [], errors: [] };
    
    // Processa em lotes para melhor performance
    const batchSize = 10;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      for (const event of batch) {
        try {
          const result = await this.dbHandler.insertEvent(event);
          
          if (result.success) {
            results.inserted.push(result);
            this.realTimeStats.recordEventSaved(false);
            this.operationLogger.recordEventInserted(operationId);
          } else if (result.reason === 'duplicate') {
            results.duplicates.push(result);
            this.realTimeStats.recordEventSaved(true);
            this.operationLogger.recordEventDuplicated(operationId);
          }
          
        } catch (error) {
          results.errors.push({ event, error: error.message });
          this.realTimeStats.recordError();
          this.operationLogger.recordError(operationId, error);
        }
      }
      
      // Atualiza progresso
      const processed = Math.min(i + batchSize, events.length);
      this.realTimeStats.updateProgress(processed, events.length);
    }
    
    return results;
  }

  /**
   * Salva eventos no banco de dados
   */
  async saveEvents(events, operationId) {
    if (events.length === 0) {
      console.log(chalk.yellow('⚠️  Nenhum evento válido para salvar'));
      return { inserted: [], duplicates: [], errors: [] };
    }

    const results = await this.dbHandler.insertEventsBatch(events);
    
    // Atualiza logger de operação
    results.inserted.forEach(() => this.operationLogger.recordEventInserted(operationId));
    results.duplicates.forEach(() => this.operationLogger.recordEventDuplicated(operationId));
    results.errors.forEach(error => this.operationLogger.recordError(operationId, new Error(error.error)));

    console.log(chalk.green(`✅ Salvamento concluído: ${results.inserted.length} inseridos, ${results.duplicates.length} duplicados, ${results.errors.length} erros`));
    
    return results;
  }

  /**
   * Atualiza estatísticas de execução
   */
  updateExecutionStats(processedResults, dbResults) {
    this.executionStats.totalEvents = processedResults.successful.length + processedResults.rejected.length;
    this.executionStats.eventsInserted = dbResults.inserted.length;
    this.executionStats.eventsDuplicated = dbResults.duplicates.length;
    this.executionStats.eventsRejected = processedResults.rejected.length;
    this.executionStats.errors = dbResults.errors.length;
    this.executionStats.duration = Date.now() - this.session.startTime;
  }

  /**
   * Exibe resultados do scraping
   */
  displayScrapingResults() {
    console.log('\n' + chalk.cyan('📊 RESULTADOS DO SCRAPING'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.white(`📈 Total de eventos processados: ${this.executionStats.totalEvents}`));
    console.log(chalk.green(`✅ Eventos inseridos: ${this.executionStats.eventsInserted}`));
    console.log(chalk.yellow(`🔄 Eventos duplicados: ${this.executionStats.eventsDuplicated}`));
    console.log(chalk.red(`❌ Eventos rejeitados: ${this.executionStats.eventsRejected}`));
    console.log(chalk.gray(`⏱️  Tempo de execução: ${Math.round(this.executionStats.duration / 1000)}s`));
    console.log(chalk.cyan('═'.repeat(50)) + '\n');
  }

  /**
   * Etapa 4: Geração de relatórios
   */
  async generateReports() {
    this.realTimeStats.setPhase('reporting');
    
    try {
      // Gera relatório completo
      this.realTimeStats.updateProgress(1, 3);
      const reportResult = await this.reportGenerator.generateCompleteReport({
        period: 'last_30_days'
      });

      this.realTimeStats.updateProgress(2, 3);

      // Gera relatório de erros se houver erros
      if (this.executionStats.errors > 0) {
        const { ErrorReportGenerator } = require('./reports/error-report-generator');
        const errorReportGenerator = new ErrorReportGenerator();
        await errorReportGenerator.generateErrorReport({
          period: 'last_24_hours'
        });
      }

      this.realTimeStats.updateProgress(3, 3);

    } catch (error) {
      this.logger.warn('Erro ao gerar relatórios:', error);
      this.realTimeStats.recordError();
    }
  }

  /**
   * Finalização elegante
   */
  async gracefulShutdown() {
    console.log(chalk.yellow('🔄 Finalizando sistema...'));
    
    try {
      // Para monitoramento
      this.structureMonitor.stopMonitoring();
      
      // Desconecta do banco
      await this.dbHandler.disconnect();
      
      // Invalida sessão
      if (this.session.authenticated) {
        this.authenticator.invalidateSession();
      }
      
      // Exibe estatísticas finais
      this.displayFinalStats();
      
      console.log(chalk.green('✅ Sistema finalizado com sucesso!'));
      console.log(chalk.gray('Obrigado por usar o Sistema de Scraping de Eventos Brasil\n'));

    } catch (error) {
      this.logger.warn('Erro durante finalização:', error);
    }
  }

  /**
   * Exibe estatísticas finais
   */
  displayFinalStats() {
    const totalDuration = Date.now() - this.session.startTime;
    
    console.log('\n' + chalk.cyan('📈 ESTATÍSTICAS FINAIS'));
    console.log(chalk.cyan('═'.repeat(40)));
    console.log(chalk.white(`👤 Usuário: ${this.session.user}`));
    console.log(chalk.white(`⏱️  Duração total: ${Math.round(totalDuration / 1000)}s`));
    console.log(chalk.white(`🎯 Eventos coletados: ${this.executionStats.eventsInserted}`));
    console.log(chalk.white(`📊 Taxa de sucesso: ${this.calculateSuccessRate()}%`));
    console.log(chalk.cyan('═'.repeat(40)));
  }

  /**
   * Calcula taxa de sucesso
   */
  calculateSuccessRate() {
    if (this.executionStats.totalEvents === 0) return 0;
    return Math.round((this.executionStats.eventsInserted / this.executionStats.totalEvents) * 100);
  }

  /**
   * Manipula erros críticos
   */
  async handleCriticalError(error) {
    this.logger.error('Erro crítico durante execução', error);
    
    console.log(chalk.red('\n❌ ERRO CRÍTICO'));
    console.log(chalk.red('═'.repeat(50)));
    console.log(chalk.red(`Mensagem: ${error.message}`));
    
    if (error.type) {
      console.log(chalk.red(`Tipo: ${error.type}`));
    }
    
    if (process.env.NODE_ENV === 'development' && error.stack) {
      console.log(chalk.gray('\nStack trace:'));
      console.log(chalk.gray(error.stack));
    }
    
    console.log(chalk.red('═'.repeat(50)));
    
    // Tenta finalização de emergência
    try {
      await this.gracefulShutdown();
    } catch (shutdownError) {
      this.logger.error('Erro durante finalização de emergência:', shutdownError);
    }
    
    process.exit(1);
  }
}

/**
 * Função principal
 */
async function main() {
  const orchestrator = new ScrapingOrchestrator();
  await orchestrator.run();
}

// Manipuladores de sinal para finalização elegante
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Interrupção detectada. Finalizando...'));
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n🛑 Término solicitado. Finalizando...'));
  process.exit(0);
});

// Executa automaticamente se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Erro não capturado:'), error.message);
    process.exit(1);
  });
}

module.exports = { main, ScrapingOrchestrator };