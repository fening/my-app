module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(pg|pg-pool|postgres-array|postgres-date|postgres-interval|pg-protocol|pg-types|pgpass|pg-connection-string)/)'
  ],
  testTimeout: 10000,
  verbose: true,
  testEnvironmentOptions: {
    url: "http://localhost/"
  },
  // Exclude the request limiter tests since we're not using that functionality anymore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/lib/request-limiter.test.ts',
    '/lib/request-limiter.test.js'
  ]
};
