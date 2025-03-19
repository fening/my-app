module.exports = function(api) {
  // Check if we're in a test environment
  const isTest = api.env('test');
  
  // Only apply Babel config for tests
  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
    };
  }
  
  // Return empty config for non-test environments so Next.js uses SWC
  return {};
};
