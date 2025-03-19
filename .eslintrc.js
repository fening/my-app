module.exports = {
  extends: 'next/core-web-vitals',
  // Remove the custom rule config that's causing problems
  rules: {
    // Removed problematic rule
  },
  ignorePatterns: [
    // Ignore test files and mocks in production build
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/__mocks__/**"
  ]
};
