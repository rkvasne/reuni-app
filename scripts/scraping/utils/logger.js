/**
 * Sistema de Logging
 * 
 * Logging estruturado para todas as operações
 * de scraping com diferentes níveis.
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(context = 'scraping') {
    this.context = context;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = this.levels[process.env.LOG_LEVEL?.toUpperCase()] ?? this.levels.INFO;
    this.logToFile = process.env.LOG_TO_FILE === 'true';
    this.logDir = path.join(__dirname, '../logs');
    
    // Cria diretório de logs se necessário
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Formata timestamp para logs
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Escreve log em arquivo se habilitado
   */
  writeToFile(level, message, data = null) {
    if (!this.logToFile) return;

    const logEntry = {
      timestamp: this.getTimestamp(),
      level,
      context: this.context,
      message,
      data: data || undefined
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(this.logDir, `scraping-${new Date().toISOString().split('T')[0]}.log`);

    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Erro ao escrever log em arquivo:', error.message);
    }
  }

  /**
   * Log de informação
   */
  info(message, data = null) {
    if (this.currentLevel < this.levels.INFO) return;

    const timestamp = this.getTimestamp();
    const formattedMessage = chalk.blue(`[INFO]`) + 
                           chalk.gray(` [${this.context}]`) + 
                           chalk.gray(` [${timestamp}]`) + 
                           ` ${message}`;

    console.log(formattedMessage);
    
    if (data && Object.keys(data).length > 0) {
      console.log(chalk.gray('  Data:'), data);
    }

    this.writeToFile('INFO', message, data);
  }

  /**
   * Log de aviso
   */
  warn(message, data = null) {
    if (this.currentLevel < this.levels.WARN) return;

    const timestamp = this.getTimestamp();
    const formattedMessage = chalk.yellow(`[WARN]`) + 
                           chalk.gray(` [${this.context}]`) + 
                           chalk.gray(` [${timestamp}]`) + 
                           ` ${message}`;

    console.warn(formattedMessage);
    
    if (data && Object.keys(data).length > 0) {
      console.warn(chalk.gray('  Data:'), data);
    }

    this.writeToFile('WARN', message, data);
  }

  /**
   * Log de erro
   */
  error(message, error = null) {
    if (this.currentLevel < this.levels.ERROR) return;

    const timestamp = this.getTimestamp();
    const formattedMessage = chalk.red(`[ERROR]`) + 
                           chalk.gray(` [${this.context}]`) + 
                           chalk.gray(` [${timestamp}]`) + 
                           ` ${message}`;

    console.error(formattedMessage);
    
    if (error) {
      if (error instanceof Error) {
        console.error(chalk.red('  Error:'), error.message);
        if (process.env.NODE_ENV === 'development') {
          console.error(chalk.gray('  Stack:'), error.stack);
        }
      } else {
        console.error(chalk.red('  Details:'), error);
      }
    }

    this.writeToFile('ERROR', message, error ? {
      message: error.message || error,
      stack: error.stack || undefined
    } : null);
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message, data = null) {
    if (this.currentLevel < this.levels.DEBUG) return;
    if (process.env.NODE_ENV !== 'development') return;

    const timestamp = this.getTimestamp();
    const formattedMessage = chalk.magenta(`[DEBUG]`) + 
                           chalk.gray(` [${this.context}]`) + 
                           chalk.gray(` [${timestamp}]`) + 
                           ` ${message}`;

    console.log(formattedMessage);
    
    if (data && Object.keys(data).length > 0) {
      console.log(chalk.gray('  Data:'), data);
    }

    this.writeToFile('DEBUG', message, data);
  }

  /**
   * Log de sucesso (variação do info com cor verde)
   */
  success(message, data = null) {
    if (this.currentLevel < this.levels.INFO) return;

    const timestamp = this.getTimestamp();
    const formattedMessage = chalk.green(`[SUCCESS]`) + 
                           chalk.gray(` [${this.context}]`) + 
                           chalk.gray(` [${timestamp}]`) + 
                           ` ${message}`;

    console.log(formattedMessage);
    
    if (data && Object.keys(data).length > 0) {
      console.log(chalk.gray('  Data:'), data);
    }

    this.writeToFile('SUCCESS', message, data);
  }

  /**
   * Cria um logger filho com contexto específico
   */
  child(childContext) {
    return new Logger(`${this.context}:${childContext}`);
  }
}

module.exports = { Logger };