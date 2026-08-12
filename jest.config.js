export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  verbose: true,
  collectCoverageFrom: [
    'src/core/**/*.js',
    '!src/core/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
