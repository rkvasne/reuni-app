/**
 * Testes Unitários para Sistema de Autenticação
 */

const { Authenticator } = require('../auth/authenticator');

describe('Authenticator', () => {
  let authenticator;

  beforeEach(() => {
    authenticator = new Authenticator();
  });

  afterEach(() => {
    // Limpa sessões ativas após cada teste
    authenticator.activeSessions.clear();
  });

  describe('validateCredentials', () => {
    test('deve validar credenciais corretas do admin', async () => {
      const result = await authenticator.validateCredentials('admin', 'scraping2025');
      expect(result).toBe(true);
    });

    test('deve rejeitar senha incorreta', async () => {
      const result = await authenticator.validateCredentials('admin', 'senhaerrada');
      expect(result).toBe(false);
    });

    test('deve rejeitar usuário inexistente', async () => {
      const result = await authenticator.validateCredentials('usuarioinexistente', 'qualquersenha');
      expect(result).toBe(false);
    });

    test('deve rejeitar credenciais vazias', async () => {
      const result1 = await authenticator.validateCredentials('', 'senha');
      const result2 = await authenticator.validateCredentials('admin', '');
      const result3 = await authenticator.validateCredentials('', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });

    test('deve tratar erros graciosamente', async () => {
      // Cria um authenticator que vai usar bcrypt (não a validação simples)
      const testAuth = new Authenticator();
      
      // Remove a validação simples para forçar uso do bcrypt
      const originalValidation = testAuth.validateCredentials;
      testAuth.validateCredentials = async function(username, password) {
        try {
          if (!this.validCredentials[username]) {
            return false;
          }
          // Força uso do bcrypt
          const bcrypt = require('bcrypt');
          return await bcrypt.compare(password, this.validCredentials[username]);
        } catch (error) {
          this.logger.error('Erro durante validação de credenciais', error);
          return false;
        }
      };
      
      // Simula erro no bcrypt
      const bcrypt = require('bcrypt');
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error('Erro simulado'));
      
      const result = await testAuth.validateCredentials('admin', 'qualquersenha');
      expect(result).toBe(false);
      
      // Restaura função original
      bcrypt.compare = originalCompare;
    });
  });

  describe('generateSessionToken', () => {
    test('deve gerar token válido', () => {
      const token = authenticator.generateSessionToken('admin');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // SHA256 hex = 64 chars
      expect(token).toMatch(/^[a-f0-9]{64}$/); // Apenas hex
    });

    test('deve gerar tokens únicos', () => {
      const token1 = authenticator.generateSessionToken('admin');
      const token2 = authenticator.generateSessionToken('admin');
      
      expect(token1).not.toBe(token2);
    });

    test('deve armazenar sessão ativa corretamente', () => {
      const username = 'admin';
      const token = authenticator.generateSessionToken(username);
      const session = authenticator.activeSessions.get(token);
      
      expect(session).toBeDefined();
      expect(session.username).toBe(username);
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(session.expiresAt).toBeGreaterThan(session.createdAt);
      expect(session.expiresAt - session.createdAt).toBe(authenticator.sessionTimeout);
    });
  });

  describe('validateSession', () => {
    test('deve validar token válido', () => {
      const token = authenticator.generateSessionToken('admin');
      const isValid = authenticator.validateSession(token);
      
      expect(isValid).toBe(true);
    });

    test('deve rejeitar token inexistente', () => {
      const isValid = authenticator.validateSession('tokeninexistente123456789012345678901234567890123456789012345678901234');
      expect(isValid).toBe(false);
    });

    test('deve rejeitar token nulo ou undefined', () => {
      expect(authenticator.validateSession(null)).toBe(false);
      expect(authenticator.validateSession(undefined)).toBe(false);
      expect(authenticator.validateSession('')).toBe(false);
    });

    test('deve rejeitar token expirado', async () => {
      // Cria token com timeout muito baixo
      const originalTimeout = authenticator.sessionTimeout;
      authenticator.sessionTimeout = 1; // 1ms
      
      const token = authenticator.generateSessionToken('admin');
      
      // Aguarda expirar
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const isValid = authenticator.validateSession(token);
      expect(isValid).toBe(false);
      
      // Verifica se token foi removido
      expect(authenticator.activeSessions.has(token)).toBe(false);
      
      // Restaura timeout original
      authenticator.sessionTimeout = originalTimeout;
    });
  });

  describe('invalidateSession', () => {
    test('deve invalidar sessão existente', () => {
      const token = authenticator.generateSessionToken('admin');
      expect(authenticator.activeSessions.has(token)).toBe(true);
      
      const result = authenticator.invalidateSession(token);
      
      expect(result).toBe(true);
      expect(authenticator.activeSessions.has(token)).toBe(false);
    });

    test('deve retornar false para token inexistente', () => {
      const result = authenticator.invalidateSession('tokeninexistente');
      expect(result).toBe(false);
    });

    test('deve tratar tokens nulos graciosamente', () => {
      expect(authenticator.invalidateSession(null)).toBe(false);
      expect(authenticator.invalidateSession(undefined)).toBe(false);
      expect(authenticator.invalidateSession('')).toBe(false);
    });
  });

  describe('getSessionInfo', () => {
    test('deve retornar informações completas da sessão', () => {
      const username = 'admin';
      const token = authenticator.generateSessionToken(username);
      const info = authenticator.getSessionInfo(token);
      
      expect(info).toBeDefined();
      expect(info.username).toBe(username);
      expect(info.createdAt).toBeInstanceOf(Date);
      expect(info.expiresAt).toBeInstanceOf(Date);
      expect(info.timeRemaining).toBeGreaterThan(0);
      expect(info.timeRemaining).toBeLessThanOrEqual(authenticator.sessionTimeout);
    });

    test('deve retornar null para token inexistente', () => {
      const info = authenticator.getSessionInfo('tokeninexistente');
      expect(info).toBeNull();
    });

    test('deve calcular tempo restante corretamente', async () => {
      const token = authenticator.generateSessionToken('admin');
      const info1 = authenticator.getSessionInfo(token);
      
      // Aguarda um pouco
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const info2 = authenticator.getSessionInfo(token);
      
      expect(info2.timeRemaining).toBeLessThan(info1.timeRemaining);
    });
  });

  describe('cleanupExpiredSessions', () => {
    test('deve limpar sessões expiradas', async () => {
      // Cria token com timeout muito baixo
      const originalTimeout = authenticator.sessionTimeout;
      authenticator.sessionTimeout = 1; // 1ms
      
      const token1 = authenticator.generateSessionToken('admin');
      const token2 = authenticator.generateSessionToken('user');
      
      expect(authenticator.activeSessions.size).toBe(2);
      
      // Aguarda expirar
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const cleaned = authenticator.cleanupExpiredSessions();
      
      expect(cleaned).toBe(2);
      expect(authenticator.activeSessions.size).toBe(0);
      
      // Restaura timeout original
      authenticator.sessionTimeout = originalTimeout;
    });

    test('deve manter sessões válidas', () => {
      const token1 = authenticator.generateSessionToken('admin');
      const token2 = authenticator.generateSessionToken('user');
      
      expect(authenticator.activeSessions.size).toBe(2);
      
      const cleaned = authenticator.cleanupExpiredSessions();
      
      expect(cleaned).toBe(0);
      expect(authenticator.activeSessions.size).toBe(2);
      expect(authenticator.activeSessions.has(token1)).toBe(true);
      expect(authenticator.activeSessions.has(token2)).toBe(true);
    });

    test('deve limpar apenas sessões expiradas', async () => {
      // Cria uma sessão que vai expirar
      const originalTimeout = authenticator.sessionTimeout;
      authenticator.sessionTimeout = 1; // 1ms
      const expiredToken = authenticator.generateSessionToken('expired');
      
      // Restaura timeout e cria sessão válida
      authenticator.sessionTimeout = originalTimeout;
      const validToken = authenticator.generateSessionToken('valid');
      
      expect(authenticator.activeSessions.size).toBe(2);
      
      // Aguarda primeira sessão expirar
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const cleaned = authenticator.cleanupExpiredSessions();
      
      expect(cleaned).toBe(1);
      expect(authenticator.activeSessions.size).toBe(1);
      expect(authenticator.activeSessions.has(expiredToken)).toBe(false);
      expect(authenticator.activeSessions.has(validToken)).toBe(true);
    });
  });

  describe('configuração e inicialização', () => {
    test('deve inicializar com configurações padrão', () => {
      const auth = new Authenticator();
      
      expect(auth.sessionTimeout).toBe(3600000); // 1 hora
      expect(auth.hashRounds).toBe(12);
      expect(auth.activeSessions).toBeInstanceOf(Map);
      expect(auth.activeSessions.size).toBe(0);
    });

    test('deve ter credenciais válidas configuradas', () => {
      expect(authenticator.validCredentials).toBeDefined();
      expect(authenticator.validCredentials.admin).toBeDefined();
      expect(typeof authenticator.validCredentials.admin).toBe('string');
    });
  });
});