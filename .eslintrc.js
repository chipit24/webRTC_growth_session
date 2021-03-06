module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    strict: 'off',
    'no-console': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'object-curly-newline': ['error', { 'consistent': true }]
  },
};
