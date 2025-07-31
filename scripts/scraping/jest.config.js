module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'auth/**/*.js',
    'utils/**/*.js',
    'processors/**/*.js',
    'scrapers/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^inquirer$': '<rootDir>/tests/__mocks__/inquirer.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(inquirer)/)'
  ]
};