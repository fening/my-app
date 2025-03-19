// TextEncoder/TextDecoder polyfills must come first
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Use require instead of import
require('@testing-library/jest-dom');

// Mock fetch API properly
const crossFetch = require('cross-fetch');
global.fetch = jest.fn();

// Mock the environment variables
process.env.API_KEY = 'test-api-key';
process.env.API_SECRET = 'test-api-secret';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/test_db';

// Suppress console errors during tests (optional)
console.error = jest.fn();
