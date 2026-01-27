module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
    '^@integrations/(.*)$': '<rootDir>/integrations/$1',
    '^@security/(.*)$': '<rootDir>/security/$1',
    '^@api/(.*)$': '<rootDir>/api/$1',
  },
  // Fix #84: Coverage threshold requirement
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 60,
      statements: 60,
    },
    // Higher thresholds for critical modules
    './core/auth/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
    './core/escrow/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
    './core/wallet/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
  // Test timeout for async operations
  testTimeout: 30000,
  // Verbose output for CI
  verbose: true,
  // Clear mocks between tests
  clearMocks: true,
  // Restore mocks between tests
  restoreMocks: true,
};
