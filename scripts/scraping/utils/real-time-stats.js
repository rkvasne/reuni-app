/**
 * Real Time Stats
 * 
 * Sistema de estatísticas em tempo real com progress bars
 * e métricas durante o scraping.
 * 
 * FOCO: Ji-Paraná/RO + Artistas Famosos do Brasil
 * POLÍTICA: Apenas eventos reais, sem dados fictícios
 */

const chalk = require('chalk');
const { Logger } = require('./logger');

class RealTimeStats {
  constructor() {
    this.logger = new Logger('real-time-stats');
    
    // Estado das estatísticas
    this.stats = {
      startTime: Date.now(),
      currentPhase: 'initializing',
      totalOperations: 0,
      completedOperations: 0,
      
      // Estatísticas de scraping
      scraping: {
        totalSources: 0,
        completedSources: 0,
        currentSource: null,
        eventsFound: 0,
        eventsProcessed: 0,
        eventsValid: 0,
        eventsRejected: 0,
        eventsSaved: 0,
        duplicatesFound: 0,
        errors: 0
      },
      
      // Performance
      performance: {
        averageEventProcessingTime: 0,
        eventsPerSecond: 0,
        estimatedTimeRemaining: 0,
        memoryUsage: 0
      }
    };
    
    // Configurações de display
    this.displayConfig = {
      updateInterval: 1000, // 1 segundo
      progressBarWidth: 40,
      showMemoryUsage: true,
      showPerformanceMetrics: true
    };
    
    // Estado do display
    this.displayState = {
      lastUpdate: 0,
      updateInterval: null,
      isDisplaying: false,
      currentLine: 0
    };
  }

  /**
   * Inicia exibição de estatísticas em tempo real
   */
  startRealTimeDisplay() {
    if (this.displayState.isDisplaying) return;
    
    this.displayState.isDisplaying = true;
    this.stats.startTime = Date.now();
    
    // Limpa tela e posiciona cursor
    this.clearScreen();
    this.showHeader();
    
    // Inicia atualização periódica
    this.displayState.updateInterval = setInterval(() => {
      this.updateDisplay();
    }, this.displayConfig.updateInterval);
    
    this.logger.debug('Display de estatísticas em tempo real iniciado');
  }

  /**
   * Para exibição de estatísticas
   */
  stopRealTimeDisplay() {
    if (!this.displayState.isDisplaying) return;
    
    this.displayState.isDisplaying = false;
    
    if (this.displayState.updateInterval) {
      clearInterval(this.displayState.updateInterval);
      this.displayState.updateInterval = null;
    }
    
    // Mostra estatísticas finais
    this.showFinalStats();
    
    this.logger.debug('Display de estatísticas em tempo real parado');
  }

  /**
   * Atualiza fase atual
   */
  setPhase(phase, details = {}) {
    this.stats.currentPhase = phase;
    
    // Configurações específicas por fase
    switch (phase) {
      case 'authentication':
        this.stats.totalOperations = 1;
        break;
      case 'health_check':
        this.stats.totalOperations = 3; // DB, Structure, Config
        break;
      case 'scraping':
        this.stats.totalOperations = details.totalSources || 2;
        this.stats.scraping.totalSources = details.totalSources || 2;
        break;
      case 'processing':
        this.stats.totalOperations = details.totalEvents || 0;
        break;
      case 'saving':
        this.stats.totalOperations = details.totalEvents || 0;
        break;
      case 'reporting':
        this.stats.totalOperations = 3; // Complete, Error, Summary
        break;
    }
    
    this.stats.completedOperations = 0;
    this.logger.debug(`Fase alterada para: ${phase}`, details);
  }

  /**
   * Atualiza progresso da operação atual
   */
  updateProgress(completed, total = null) {
    if (total !== null) {
      this.stats.totalOperations = total;
    }
    
    this.stats.completedOperations = completed;
    
    // Calcula tempo estimado
    this.calculateEstimatedTime();
  }

  /**
   * Atualiza estatísticas de scraping
   */
  updateScrapingStats(updates) {
    Object.assign(this.stats.scraping, updates);
    
    // Calcula performance
    this.calculatePerformanceMetrics();
  }

  /**
   * Registra evento encontrado
   */
  recordEventFound() {
    this.stats.scraping.eventsFound++;
  }

  /**
   * Registra evento processado
   */
  recordEventProcessed(isValid = true) {
    this.stats.scraping.eventsProcessed++;
    
    if (isValid) {
      this.stats.scraping.eventsValid++;
    } else {
      this.stats.scraping.eventsRejected++;
    }
  }

  /**
   * Registra evento salvo
   */
  recordEventSaved(isDuplicate = false) {
    if (isDuplicate) {
      this.stats.scraping.duplicatesFound++;
    } else {
      this.stats.scraping.eventsSaved++;
    }
  }

  /**
   * Registra erro
   */
  recordError() {
    this.stats.scraping.errors++;
  }

  /**
   * Limpa tela
   */
  clearScreen() {
    process.stdout.write('\x1b[2J\x1b[H');
    this.displayState.currentLine = 0;
  }

  /**
   * Mostra cabeçalho
   */
  showHeader() {
    console.log(chalk.cyan('🎫 ═══════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan('   SISTEMA DE SCRAPING DE EVENTOS BRASIL - TEMPO REAL'));
    console.log(chalk.cyan('   ═══════════════════════════════════════════════════════════════'));
    console.log('');
    this.displayState.currentLine = 4;
  }

  /**
   * Atualiza display principal
   */
  updateDisplay() {
    // Move cursor para linha de estatísticas
    process.stdout.write(`\x1b[${this.displayState.currentLine}H`);
    
    // Limpa linhas antigas
    for (let i = 0; i < 20; i++) {
      process.stdout.write('\x1b[K\n');
    }
    
    // Volta para posição inicial
    process.stdout.write(`\x1b[${this.displayState.currentLine}H`);
    
    // Mostra estatísticas atuais
    this.showCurrentStats();
  }

  /**
   * Mostra estatísticas atuais
   */
  showCurrentStats() {
    const elapsed = Date.now() - this.stats.startTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);
    
    // Fase atual
    console.log(chalk.yellow(`📍 Fase Atual: ${this.getPhaseDisplayName()}`));
    console.log('');
    
    // Progress bar principal
    this.showProgressBar(
      'Progresso Geral',
      this.stats.completedOperations,
      this.stats.totalOperations,
      'cyan'
    );
    
    console.log('');
    
    // Estatísticas de scraping
    if (this.stats.currentPhase === 'scraping' || this.stats.scraping.eventsFound > 0) {
      this.showScrapingStats();
    }
    
    // Performance
    if (this.displayConfig.showPerformanceMetrics) {
      this.showPerformanceStats(elapsedSeconds);
    }
    
    // Memória
    if (this.displayConfig.showMemoryUsage) {
      this.showMemoryStats();
    }
    
    // Tempo
    console.log(chalk.gray(`⏱️  Tempo decorrido: ${this.formatDuration(elapsed)}`));
    
    if (this.stats.performance.estimatedTimeRemaining > 0) {
      console.log(chalk.gray(`⏳ Tempo estimado restante: ${this.formatDuration(this.stats.performance.estimatedTimeRemaining)}`));
    }
  }

  /**
   * Mostra progress bar
   */
  showProgressBar(label, current, total, color = 'green') {
    if (total === 0) return;
    
    const percentage = Math.min(Math.round((current / total) * 100), 100);
    const filled = Math.round((current / total) * this.displayConfig.progressBarWidth);
    const empty = this.displayConfig.progressBarWidth - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const coloredBar = chalk[color](bar);
    
    console.log(`${label}: [${coloredBar}] ${percentage}% (${current}/${total})`);
  }

  /**
   * Mostra estatísticas de scraping
   */
  showScrapingStats() {
    console.log(chalk.blue('📊 Estatísticas de Scraping:'));
    
    if (this.stats.scraping.currentSource) {
      console.log(chalk.gray(`   🎯 Fonte atual: ${this.stats.scraping.currentSource}`));
    }
    
    // Progress bar de fontes
    if (this.stats.scraping.totalSources > 0) {
      this.showProgressBar(
        '   Fontes',
        this.stats.scraping.completedSources,
        this.stats.scraping.totalSources,
        'blue'
      );
    }
    
    console.log(chalk.white(`   📈 Eventos encontrados: ${this.stats.scraping.eventsFound}`));
    console.log(chalk.white(`   ⚙️  Eventos processados: ${this.stats.scraping.eventsProcessed}`));
    console.log(chalk.green(`   ✅ Eventos válidos: ${this.stats.scraping.eventsValid}`));
    console.log(chalk.yellow(`   🔄 Duplicatas: ${this.stats.scraping.duplicatesFound}`));
    console.log(chalk.red(`   ❌ Rejeitados: ${this.stats.scraping.eventsRejected}`));
    console.log(chalk.blue(`   💾 Salvos: ${this.stats.scraping.eventsSaved}`));
    
    if (this.stats.scraping.errors > 0) {
      console.log(chalk.red(`   🚨 Erros: ${this.stats.scraping.errors}`));
    }
    
    console.log('');
  }

  /**
   * Mostra estatísticas de performance
   */
  showPerformanceStats(elapsedSeconds) {
    console.log(chalk.magenta('⚡ Performance:'));
    
    if (this.stats.performance.eventsPerSecond > 0) {
      console.log(chalk.white(`   📊 Eventos/segundo: ${this.stats.performance.eventsPerSecond.toFixed(1)}`));
    }
    
    if (this.stats.performance.averageEventProcessingTime > 0) {
      console.log(chalk.white(`   ⏱️  Tempo médio/evento: ${this.stats.performance.averageEventProcessingTime}ms`));
    }
    
    console.log('');
  }

  /**
   * Mostra estatísticas de memória
   */
  showMemoryStats() {
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    console.log(chalk.gray(`💾 Memória: ${memUsageMB}MB / ${memTotalMB}MB`));
    console.log('');
  }

  /**
   * Calcula métricas de performance
   */
  calculatePerformanceMetrics() {
    const elapsed = Date.now() - this.stats.startTime;
    const elapsedSeconds = elapsed / 1000;
    
    if (elapsedSeconds > 0) {
      this.stats.performance.eventsPerSecond = this.stats.scraping.eventsProcessed / elapsedSeconds;
    }
    
    if (this.stats.scraping.eventsProcessed > 0) {
      this.stats.performance.averageEventProcessingTime = Math.round(elapsed / this.stats.scraping.eventsProcessed);
    }
  }

  /**
   * Calcula tempo estimado restante
   */
  calculateEstimatedTime() {
    if (this.stats.completedOperations === 0 || this.stats.totalOperations === 0) {
      this.stats.performance.estimatedTimeRemaining = 0;
      return;
    }
    
    const elapsed = Date.now() - this.stats.startTime;
    const averageTimePerOperation = elapsed / this.stats.completedOperations;
    const remainingOperations = this.stats.totalOperations - this.stats.completedOperations;
    
    this.stats.performance.estimatedTimeRemaining = averageTimePerOperation * remainingOperations;
  }

  /**
   * Obtém nome de exibição da fase
   */
  getPhaseDisplayName() {
    const phaseNames = {
      'initializing': 'Inicializando',
      'authentication': 'Autenticação',
      'health_check': 'Verificação de Saúde',
      'menu': 'Menu Interativo',
      'scraping': 'Coletando Eventos',
      'processing': 'Processando Dados',
      'saving': 'Salvando no Banco',
      'reporting': 'Gerando Relatórios',
      'finalizing': 'Finalizando'
    };
    
    return phaseNames[this.stats.currentPhase] || this.stats.currentPhase;
  }

  /**
   * Formata duração em formato legível
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Mostra estatísticas finais
   */
  showFinalStats() {
    const totalDuration = Date.now() - this.stats.startTime;
    
    console.log('\n' + chalk.cyan('📈 ESTATÍSTICAS FINAIS'));
    console.log(chalk.cyan('═'.repeat(60)));
    
    // Resumo geral
    console.log(chalk.white(`⏱️  Duração total: ${this.formatDuration(totalDuration)}`));
    console.log(chalk.white(`📊 Eventos encontrados: ${this.stats.scraping.eventsFound}`));
    console.log(chalk.white(`⚙️  Eventos processados: ${this.stats.scraping.eventsProcessed}`));
    console.log(chalk.green(`✅ Eventos salvos: ${this.stats.scraping.eventsSaved}`));
    console.log(chalk.yellow(`🔄 Duplicatas encontradas: ${this.stats.scraping.duplicatesFound}`));
    console.log(chalk.red(`❌ Eventos rejeitados: ${this.stats.scraping.eventsRejected}`));
    
    if (this.stats.scraping.errors > 0) {
      console.log(chalk.red(`🚨 Erros encontrados: ${this.stats.scraping.errors}`));
    }
    
    // Taxa de sucesso
    const successRate = this.stats.scraping.eventsFound > 0 ? 
      Math.round((this.stats.scraping.eventsSaved / this.stats.scraping.eventsFound) * 100) : 0;
    console.log(chalk.blue(`📈 Taxa de sucesso: ${successRate}%`));
    
    // Performance final
    if (this.stats.performance.eventsPerSecond > 0) {
      console.log(chalk.magenta(`⚡ Performance média: ${this.stats.performance.eventsPerSecond.toFixed(1)} eventos/segundo`));
    }
    
    console.log(chalk.cyan('═'.repeat(60)));
  }

  /**
   * Obtém estatísticas atuais
   */
  getCurrentStats() {
    return {
      ...this.stats,
      elapsed: Date.now() - this.stats.startTime,
      isDisplaying: this.displayState.isDisplaying
    };
  }

  /**
   * Reseta estatísticas
   */
  reset() {
    this.stats = {
      startTime: Date.now(),
      currentPhase: 'initializing',
      totalOperations: 0,
      completedOperations: 0,
      scraping: {
        totalSources: 0,
        completedSources: 0,
        currentSource: null,
        eventsFound: 0,
        eventsProcessed: 0,
        eventsValid: 0,
        eventsRejected: 0,
        eventsSaved: 0,
        duplicatesFound: 0,
        errors: 0
      },
      performance: {
        averageEventProcessingTime: 0,
        eventsPerSecond: 0,
        estimatedTimeRemaining: 0,
        memoryUsage: 0
      }
    };
  }
}

module.exports = { RealTimeStats };