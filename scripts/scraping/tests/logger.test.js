/**
 * Testes Unitários para Sistema de Logging
 */

const { Logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

describe('Logger', () => {
  let logger;
  let originalEnv;

  beforeEach(() => {
    // Salva variáveis de ambiente originais
    originalEnv = {
      LOG_LEVEL: process.env.LOG_LEVEL,
      LOG_TO_FILE: process.env.LOG_TO_FILE,
      NODE_ENV: process.env.NODE_ENV
    };
    
    logger = new Logger('test');
  });

  afterEach(() => {
    // Restaura variáveis de ambiente
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    });
  });

  describe('inicialização', () => {
    test('deve inicializar com contexto padrão', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger.context).toBe('scraping');
    });

    test('deve inicializar com contexto personalizado', () => {
      const customLogger = new Logger('custom');
      expect(customLogger.context).toBe('custom');
    });

    test('deve configurar nível de log baseado em variável de ambiente', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const errorLogger = new Logger('error');
      expect(errorLogger.currentLevel).toBe(0); // ERROR = 0
      
      process.env.LOG_LEVEL = 'DEBUG';
      const debugLogger = new Logger('debug');
      expect(debugLogger.currentLevel).toBe(3); // DEBUG = 3
    });

    test('deve usar nível INFO como padrão', () => {
      delete process.env.LOG_LEVEL;
      const defaultLogger = new Logger('default');
      expect(defaultLogger.currentLevel).toBe(defaultLogger.levels.INFO);
    });
  });

  describe('getTimestamp', () => {
    test('deve retornar timestamp válido', () => {
      const timestamp = logger.getTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('métodos de logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = {
        log: jest.spyOn(console, 'log').mockImplementation(),
        warn: jest.spyOn(console, 'warn').mockImplementation(),
        error: jest.spyOn(console, 'error').mockImplementation()
      };
    });

    afterEach(() => {
      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    describe('info', () => {
      test('deve logar mensagem de info', () => {
        logger.info('Mensagem de teste');
        expect(consoleSpy.log).toHaveBeenCalled();
        
        const call = consoleSpy.log.mock.calls[0][0];
        expect(call).toContain('[INFO]');
        expect(call).toContain('[test]');
        expect(call).toContain('Mensagem de teste');
      });

      test('deve logar dados adicionais', () => {
        const data = { key: 'value', number: 123 };
        logger.info('Mensagem com dados', data);
        
        expect(consoleSpy.log).toHaveBeenCalledTimes(2);
        expect(consoleSpy.log.mock.calls[1][1]).toEqual(data);
      });

      test('deve respeitar nível de log', () => {
        // Cria logger com nível ERROR (0) - não deve logar INFO (2)
        const errorLogger = new Logger('error');
        errorLogger.currentLevel = 0; // Força nível ERROR
        
        errorLogger.info('Não deve aparecer');
        expect(consoleSpy.log).not.toHaveBeenCalled();
      });
    });

    describe('warn', () => {
      test('deve logar mensagem de warning', () => {
        logger.warn('Aviso de teste');
        expect(consoleSpy.warn).toHaveBeenCalled();
        
        const call = consoleSpy.warn.mock.calls[0][0];
        expect(call).toContain('[WARN]');
        expect(call).toContain('[test]');
        expect(call).toContain('Aviso de teste');
      });
    });

    describe('error', () => {
      test('deve logar mensagem de erro', () => {
        logger.error('Erro de teste');
        expect(consoleSpy.error).toHaveBeenCalled();
        
        const call = consoleSpy.error.mock.calls[0][0];
        expect(call).toContain('[ERROR]');
        expect(call).toContain('[test]');
        expect(call).toContain('Erro de teste');
      });

      test('deve logar objeto Error', () => {
        const error = new Error('Erro simulado');
        logger.error('Erro capturado', error);
        
        expect(consoleSpy.error).toHaveBeenCalledTimes(2);
        expect(consoleSpy.error.mock.calls[1][1]).toBe('Erro simulado');
      });

      test('deve logar stack trace em desenvolvimento', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('Erro com stack');
        
        logger.error('Erro com stack', error);
        
        expect(consoleSpy.error).toHaveBeenCalledTimes(3);
        expect(consoleSpy.error.mock.calls[2][1]).toContain('Error: Erro com stack');
      });
    });

    describe('debug', () => {
      test('deve logar apenas em desenvolvimento', () => {
        process.env.NODE_ENV = 'development';
        process.env.LOG_LEVEL = 'DEBUG';
        
        const debugLogger = new Logger('debug');
        debugLogger.debug('Debug message');
        
        expect(consoleSpy.log).toHaveBeenCalled();
        
        const call = consoleSpy.log.mock.calls[0][0];
        expect(call).toContain('[DEBUG]');
      });

      test('não deve logar em produção', () => {
        process.env.NODE_ENV = 'production';
        process.env.LOG_LEVEL = 'DEBUG';
        
        const debugLogger = new Logger('debug');
        debugLogger.debug('Debug message');
        
        expect(consoleSpy.log).not.toHaveBeenCalled();
      });
    });

    describe('success', () => {
      test('deve logar mensagem de sucesso', () => {
        logger.success('Operação bem-sucedida');
        expect(consoleSpy.log).toHaveBeenCalled();
        
        const call = consoleSpy.log.mock.calls[0][0];
        expect(call).toContain('[SUCCESS]');
        expect(call).toContain('[test]');
        expect(call).toContain('Operação bem-sucedida');
      });
    });
  });

  describe('child logger', () => {
    test('deve criar logger filho com contexto combinado', () => {
      const childLogger = logger.child('child');
      expect(childLogger.context).toBe('test:child');
      expect(childLogger).toBeInstanceOf(Logger);
    });

    test('deve funcionar com múltiplos níveis', () => {
      const childLogger = logger.child('child');
      const grandChildLogger = childLogger.child('grandchild');
      
      expect(grandChildLogger.context).toBe('test:child:grandchild');
    });
  });

  describe('writeToFile', () => {
    const logDir = path.join(__dirname, '../logs');
    
    beforeEach(() => {
      // Remove diretório de logs se existir
      if (fs.existsSync(logDir)) {
        fs.rmSync(logDir, { recursive: true, force: true });
      }
    });

    afterEach(() => {
      // Limpa diretório de logs após teste
      if (fs.existsSync(logDir)) {
        fs.rmSync(logDir, { recursive: true, force: true });
      }
    });

    test('deve criar diretório de logs quando habilitado', () => {
      process.env.LOG_TO_FILE = 'true';
      const fileLogger = new Logger('file');
      
      expect(fs.existsSync(logDir)).toBe(true);
    });

    test('não deve criar diretório quando desabilitado', () => {
      process.env.LOG_TO_FILE = 'false';
      const fileLogger = new Logger('file');
      
      expect(fs.existsSync(logDir)).toBe(false);
    });
  });
});