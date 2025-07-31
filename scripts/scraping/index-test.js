console.log('Teste básico funcionando!');

async function testMain() {
  console.log('Função async funcionando!');
  
  const { Authenticator } = require('./auth/authenticator');
  console.log('Authenticator carregado');
  
  // Teste sem prompt interativo
  const auth = new Authenticator();
  const isValid = await auth.validateCredentials('admin', 'scraping2024');
  console.log('Credenciais testadas:', isValid);
}

testMain().catch(console.error);