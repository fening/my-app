import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simple list of allowed referrers (domains that can embed your form)
const ALLOWED_REFERRERS = [
  'docs.google.com',      // Google Forms
  'forms.office.com',     // Microsoft Forms 
  'surveymonkey.com',     // SurveyMonkey
  'your-survey-domain.com', // Replace with your actual survey domain
  'localhost',            // For local testing
  // Add more as needed
];

// Use a secure token that's hard to guess (pre-computed SHA-256 of "survey2024")
// This avoids having to use the crypto module in Edge Runtime
const SURVEY_TOKEN = '94f94c9c511f351a6db9d32546478a2a6b76a837664c3bc39570c717523673bd'; 

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // Skip middleware for non-home routes
  if (pathname !== '/' && pathname !== '') {
    return NextResponse.next();
  }
  
  console.log('[Middleware] Processing request:', request.url);
  
  // 1. Check if the request has a valid survey token parameter
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  console.log('[Middleware] Token:', token);
  
  // For development, allow access without token on localhost
  if (process.env.NODE_ENV === 'development' && 
     (request.headers.get('host') || '').includes('localhost')) {
    console.log('[Middleware] Development mode - allowing access');
    return NextResponse.next();
  }
  
  // Check token
  if (token !== SURVEY_TOKEN) {
    console.log('[Middleware] Invalid token, redirecting to blocked page');
    return NextResponse.redirect(new URL('/blocked', request.url));
  }
  
  // Skip referrer check for now to simplify troubleshooting
  /*
  // 2. Check the referrer
  const referrer = request.headers.get('referer');
  const hasValidReferrer = !referrer || 
    ALLOWED_REFERRERS.some(domain => referrer.includes(domain));
    
  if (!hasValidReferrer) {
    console.log('[Middleware] Invalid referrer:', referrer);
    return NextResponse.redirect(new URL('/blocked', request.url));
  }
  */
  
  console.log('[Middleware] Access granted');
  return NextResponse.next();
}

// Update matcher to avoid blocking static resources but still check other paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|admin).*)'
  ],
};
