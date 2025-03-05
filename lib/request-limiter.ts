/**
 * Client-side request limiter to prevent multiple requests
 * from the same user within a specific time period
 */

// Constants
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STORAGE_PREFIX = 'request_timestamp_';

/**
 * Check if a request can be made to the specified recipient
 * @param recipient The recipient identifier
 * @returns Boolean indicating if request can be made
 */
export function canMakeRequest(recipient: string): boolean {
  const lastRequestTime = getLastRequestTime(recipient);
  
  // If no previous request or cooldown period has passed
  if (!lastRequestTime) {
    return true;
  }
  
  const currentTime = Date.now();
  const timeSinceLastRequest = currentTime - lastRequestTime;
  
  return timeSinceLastRequest > COOLDOWN_PERIOD;
}

/**
 * Records that a request has been made to the specified recipient
 * @param recipient The recipient identifier
 */
export function recordRequest(recipient: string): void {
  const currentTime = Date.now();
  localStorage.setItem(getStorageKey(recipient), currentTime.toString());
}

/**
 * Gets the remaining cooldown time in milliseconds
 * @param recipient The recipient identifier
 * @returns Remaining time in milliseconds, or 0 if no cooldown is active
 */
export function getRemainingCooldownTime(recipient: string): number {
  const lastRequestTime = getLastRequestTime(recipient);
  
  if (!lastRequestTime) {
    return 0;
  }
  
  const currentTime = Date.now();
  const timeSinceLastRequest = currentTime - lastRequestTime;
  const remainingTime = COOLDOWN_PERIOD - timeSinceLastRequest;
  
  return remainingTime > 0 ? remainingTime : 0;
}

/**
 * Helper function to get the last request time
 * @param recipient The recipient identifier
 * @returns Timestamp of last request or null if no request was made
 */
function getLastRequestTime(recipient: string): number | null {
  const value = localStorage.getItem(getStorageKey(recipient));
  return value ? parseInt(value, 10) : null;
}

/**
 * Helper function to generate the storage key
 * @param recipient The recipient identifier
 * @returns The storage key
 */
function getStorageKey(recipient: string): string {
  return `${STORAGE_PREFIX}${recipient}`;
}
