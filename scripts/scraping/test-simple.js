console.log('Teste simples funcionando!');

const { Authenticator } = require('./auth/authenticator');
console.log('Authenticator importado com sucesso!');

const { Logger } = require('./utils/logger');
console.log('Logger importado com sucesso!');

const logger = new Logger('test');
logger.info('Logger funcionando!');

console.log('✅ Todos os módulos funcionando!');