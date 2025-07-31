/**
 * Configuração global para testes
 */

// Configurar timeout para testes assíncronos
jest.setTimeout(10000);

// Suprimir logs durante testes
const originalConsole = console;

beforeAll(() => {
  // Silencia logs durante testes, exceto erros
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error;
});

afterAll(() => {
  // Restaura console original
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});