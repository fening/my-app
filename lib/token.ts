import { createHash } from 'crypto';

/**
 * Generate a SHA-256 hash of the input string
 */
export function generateToken(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a token URL for sharing
 */
export function generateTokenUrl(baseUrl: string, tokenValue: string): string {
  const token = generateToken(tokenValue);
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

// Example usage
if (process.env.NODE_ENV === 'development') {
  console.log('Survey token hash:', generateToken('survey2024'));
  console.log('Example URL:', generateTokenUrl('http://localhost:3000', 'survey2024'));
}
