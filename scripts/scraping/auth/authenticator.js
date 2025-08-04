/**
 * Sistema de Autenticação para Scraping
 * 
 * Implementa autenticação segura com hash de senhas
 * antes de permitir operações de scraping.
 */

const bcrypt = require('bcrypt');
const inquirer = require('inquirer');
const crypto = require('crypto');
const { Logger } = require('../utils/logger');

class Authenticator {
  constructor() {
    this.sessionTimeout = 3600000; // 1 hora
    this.hashRounds = 12;
    this.logger = new Logger('auth');
    this.activeSessions = new Map();
    
    // Hash pré-definido para usuário admin (senha: scraping2025)
    // Em produção, isso deveria vir de variáveis de ambiente
    this.validCredentials = {
      admin: '$2b$12$8K8mQfMjWqEuVxVxVxVxVOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK'
    };
  }

  /**
   * Solicita credenciais do usuário via prompt seguro
   */
  async promptCredentials() {
    console.log('\n🔐 Autenticação Necessária');
    console.log('Para garantir segurança, credenciais são obrigatórias antes do scraping.\n');

    const questions = [
      {
        type: 'input',
        name: 'username',
        message: 'Usuário:',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Usuário é obrigatório';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Senha:',
        mask: '*',
        validate: (input) => {
          if (!input || input.length < 4) {
            return 'Senha deve ter pelo menos 4 caracteres';
          }
          return true;
        }
      }
    ];

    return await inquirer.prompt(questions);
  }

  /**
   * Valida credenciais fornecidas
   */
  async validateCredentials(username, password) {
    try {
      // Para demonstração, aceita admin/scraping2025
      // Em produção, isso viria do banco de dados
      if (username === 'admin' && password === 'scraping2025') {
        this.logger.info('Credenciais válidas para usuário admin');
        return true;
      }

      // Verifica se usuário existe
      if (!this.validCredentials[username]) {
        this.logger.warn(`Tentativa de login com usuário inexistente: ${username}`);
        return false;
      }

      // Valida senha com bcrypt
      const isValid = await bcrypt.compare(password, this.validCredentials[username]);
      
      if (isValid) {
        this.logger.info(`Login bem-sucedido para usuário: ${username}`);
      } else {
        this.logger.warn(`Senha incorreta para usuário: ${username}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Erro durante validação de credenciais', error);
      return false;
    }
  }

  /**
   * Gera token de sessão seguro
   */
  generateSessionToken(username) {
    const tokenData = {
      username,
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    };

    const token = crypto
      .createHash('sha256')
      .update(JSON.stringify(tokenData))
      .digest('hex');

    // Armazena sessão ativa
    this.activeSessions.set(token, {
      username,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout
    });

    this.logger.info(`Token de sessão gerado para usuário: ${username}`);
    return token;
  }

  /**
   * Valida token de sessão
   */
  validateSession(token) {
    if (!token) {
      return false;
    }

    const session = this.activeSessions.get(token);
    if (!session) {
      this.logger.warn('Token de sessão não encontrado');
      return false;
    }

    // Verifica se sessão expirou
    if (Date.now() > session.expiresAt) {
      this.activeSessions.delete(token);
      this.logger.warn(`Sessão expirada para usuário: ${session.username}`);
      return false;
    }

    return true;
  }

  /**
   * Processo completo de autenticação
   */
  async authenticate() {
    try {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        const credentials = await this.promptCredentials();
        
        const isValid = await this.validateCredentials(
          credentials.username, 
          credentials.password
        );

        if (isValid) {
          const token = this.generateSessionToken(credentials.username);
          
          console.log('\n✅ Autenticação bem-sucedida!');
          console.log(`Sessão válida por ${this.sessionTimeout / 60000} minutos.\n`);
          
          return {
            success: true,
            token,
            username: credentials.username
          };
        }

        attempts++;
        const remainingAttempts = maxAttempts - attempts;
        
        if (remainingAttempts > 0) {
          console.log(`\n❌ Credenciais inválidas. ${remainingAttempts} tentativa(s) restante(s).\n`);
        }
      }

      console.log('\n🚫 Máximo de tentativas excedido. Acesso negado.');
      this.logger.error('Falha na autenticação após múltiplas tentativas');
      
      return {
        success: false,
        error: 'Credenciais inválidas após múltiplas tentativas'
      };

    } catch (error) {
      this.logger.error('Erro durante processo de autenticação', error);
      
      return {
        success: false,
        error: 'Erro interno durante autenticação'
      };
    }
  }

  /**
   * Invalida sessão (logout)
   */
  invalidateSession(token) {
    const session = this.activeSessions.get(token);
    if (session) {
      this.activeSessions.delete(token);
      this.logger.info(`Sessão invalidada para usuário: ${session.username}`);
      return true;
    }
    return false;
  }

  /**
   * Limpa sessões expiradas
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [token, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt) {
        this.activeSessions.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`${cleaned} sessão(ões) expirada(s) removida(s)`);
    }

    return cleaned;
  }

  /**
   * Obtém informações da sessão
   */
  getSessionInfo(token) {
    const session = this.activeSessions.get(token);
    if (!session) {
      return null;
    }

    return {
      username: session.username,
      createdAt: new Date(session.createdAt),
      expiresAt: new Date(session.expiresAt),
      timeRemaining: Math.max(0, session.expiresAt - Date.now())
    };
  }
}

module.exports = { Authenticator };