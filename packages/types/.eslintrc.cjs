module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off', // Types can use any
    'import/order': 'off', // Disable import ordering for types package
  },
};
