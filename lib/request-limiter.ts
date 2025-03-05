/**
 * Client-side request limiter to prevent multiple requests
 * from the same user within a specific time period
 */

const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface RequestRecord {
  recipient: string;
  timestamp: number;
}

export function canMakeRequest(recipient: string): boolean {
  // Don't run on server
  if (typeof window === 'undefined') return true;
  
  try {
    // Get previous requests
    const requestsJson = localStorage.getItem('airtime_requests');
    const requests: RequestRecord[] = requestsJson ? JSON.parse(requestsJson) : [];
    
    // Current time
    const now = Date.now();
    
    // Filter out expired records
    const validRequests = requests.filter(req => now - req.timestamp < COOLDOWN_TIME);
    
    // Check if this recipient already has a recent request
    const hasRecentRequest = validRequests.some(req => req.recipient === recipient);
    
    // If no recent request, it's allowed
    return !hasRecentRequest;
  } catch (error) {
    console.error('Error checking request limit:', error);
    // In case of error, allow the request
    return true;
  }
}

export function recordRequest(recipient: string): void {
  // Don't run on server
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing records
    const requestsJson = localStorage.getItem('airtime_requests');
    const requests: RequestRecord[] = requestsJson ? JSON.parse(requestsJson) : [];
    
    // Current time
    const now = Date.now();
    
    // Filter out expired records
    const validRequests = requests.filter(req => now - req.timestamp < COOLDOWN_TIME);
    
    // Add new record
    validRequests.push({
      recipient,
      timestamp: now
    });
    
    // Save back to localStorage
    localStorage.setItem('airtime_requests', JSON.stringify(validRequests));
  } catch (error) {
    console.error('Error recording request:', error);
  }
}

export function getRemainingCooldownTime(recipient: string): number | null {
  // Don't run on server
  if (typeof window === 'undefined') return null;
  
  try {
    // Get previous requests
    const requestsJson = localStorage.getItem('airtime_requests');
    const requests: RequestRecord[] = requestsJson ? JSON.parse(requestsJson) : [];
    
    // Current time
    const now = Date.now();
    
    // Find request for this recipient
    const request = requests.find(req => req.recipient === recipient);
    
    if (!request) return null;
    
    // Calculate remaining time
    const elapsed = now - request.timestamp;
    const remaining = COOLDOWN_TIME - elapsed;
    
    return remaining > 0 ? remaining : null;
  } catch (error) {
    console.error('Error getting cooldown time:', error);
    return null;
  }
}
