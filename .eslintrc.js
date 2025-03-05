module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Global rules
    '@typescript-eslint/no-unused-vars': 'error',
  },
  overrides: [
    // Disable strict rules for test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/__mocks__/**'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-require-imports': 'off'
      }
    }
  ]
};
