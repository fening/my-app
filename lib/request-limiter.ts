/**
 * NOTE: This module is deprecated and no longer used in the application.
 * 
 * The application now uses database checks to permanently block numbers
 * that have already received airtime, rather than a temporary cooldown period.
 * 
 * This file is kept for reference only.
 */

/**
 * Client-side request limiter to prevent multiple requests
 * from the same user within a specific time period
 */

/**
 * Storage adapter to allow working with both browser localStorage and tests
 */
const storage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    // For tests or SSR
    return (storage as any)._store?.[key] || null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    } else {
      // For tests or SSR
      if (!(storage as any)._store) {
        (storage as any)._store = {};
      }
      (storage as any)._store[key] = value;
    }
  },
  _store: {} // In-memory storage for testing/SSR
};

/**
 * Time in milliseconds before another request can be made
 * 24 hours = 24 * 60 * 60 * 1000 = 86400000 ms
 */
const COOLDOWN_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a storage key for a specific phone number
 */
function getStorageKey(recipient: string): string {
  return `airtime_request_${recipient.replace(/\D/g, '')}`;
}

/**
 * Check if a phone number can make a new request
 * @returns true if allowed, false if too recent
 */
export function canMakeRequest(recipient: string): boolean {
  const lastRequestTime = getLastRequestTime(recipient);
  if (lastRequestTime === null) {
    return true;
  }
  
  const currentTime = Date.now();
  const elapsedTime = currentTime - lastRequestTime;
  
  return elapsedTime >= COOLDOWN_PERIOD_MS;
}

/**
 * Records a successful request for a phone number
 */
export function recordRequest(recipient: string): void {
  const currentTime = Date.now();
  storage.setItem(getStorageKey(recipient), currentTime.toString());
}

/**
 * Gets the remaining cooldown time in milliseconds
 * @returns milliseconds remaining, or 0 if no cooldown
 */
export function getRemainingCooldownTime(recipient: string): number {
  const lastRequestTime = getLastRequestTime(recipient);
  if (lastRequestTime === null) {
    return 0;
  }
  
  const currentTime = Date.now();
  const elapsedTime = currentTime - lastRequestTime;
  
  if (elapsedTime >= COOLDOWN_PERIOD_MS) {
    return 0;
  }
  
  return COOLDOWN_PERIOD_MS - elapsedTime;
}

/**
 * Gets the timestamp of the last request for a phone number
 * @returns timestamp in milliseconds, or null if no previous request
 */
function getLastRequestTime(recipient: string): number | null {
  const value = storage.getItem(getStorageKey(recipient));
  return value ? parseInt(value, 10) : null;
}
