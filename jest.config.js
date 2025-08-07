const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Caminho para sua aplicação Next.js
  dir: './',
})

// Configuração customizada do Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  // Configuração para suportar módulos ES do Supabase
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|isows)/)'
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'middleware.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  // Configuração específica para testes de middleware
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
}

module.exports = createJestConfig(customJestConfig)