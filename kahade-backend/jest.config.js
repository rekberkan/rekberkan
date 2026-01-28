module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',
    '!src/**/main.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@integrations/(.*)$': '<rootDir>/src/integrations/$1',
    '^@security/(.*)$': '<rootDir>/src/security/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
  },
  // Test timeout for async operations
  testTimeout: 30000,
  // Verbose output for CI
  verbose: true,
  // Clear mocks between tests
  clearMocks: true,
  // Restore mocks between tests
  restoreMocks: true,
  // Pass with no tests for now (unit tests are in test folder)
  passWithNoTests: false,
};
