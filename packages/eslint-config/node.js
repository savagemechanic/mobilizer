/**
 * Node.js ESLint configuration for Mobilizer v2
 * Extends base config with Node-specific rules
 */

module.exports = {
  extends: ['./index.js'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'no-console': 'off', // Console is acceptable in Node.js
  },
};
