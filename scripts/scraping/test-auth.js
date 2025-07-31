/**
 * Teste simples do sistema de autenticação
 */

const { Authenticator } = require('./auth/authenticator');

async function testAuth() {
  console.log('🧪 Testando sistema de autenticação...\n');
  
  const authenticator = new Authenticator();
  
  // Teste de validação de credenciais
  console.log('Testando credenciais válidas...');
  const validResult = await authenticator.validateCredentials('admin', 'scraping2024');
  console.log('Resultado:', validResult ? '✅ Válido' : '❌ Inválido');
  
  console.log('\nTestando credenciais inválidas...');
  const invalidResult = await authenticator.validateCredentials('admin', 'senhaerrada');
  console.log('Resultado:', invalidResult ? '✅ Válido' : '❌ Inválido');
  
  // Teste de geração de token
  console.log('\nTestando geração de token...');
  const token = authenticator.generateSessionToken('admin');
  console.log('Token gerado:', token.substring(0, 16) + '...');
  
  // Teste de validação de sessão
  console.log('\nTestando validação de sessão...');
  const sessionValid = authenticator.validateSession(token);
  console.log('Sessão válida:', sessionValid ? '✅ Sim' : '❌ Não');
  
  console.log('\n✅ Testes concluídos!');
}

testAuth().catch(console.error);