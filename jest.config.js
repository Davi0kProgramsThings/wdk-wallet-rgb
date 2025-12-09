// @review
// @author Davide Casale <davide.casale@tether.io>
// This file is not really necessary, you can safely remove it and the unit tests
// will still work properly.
export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(rgb-sdk)/)'
  ]
}
