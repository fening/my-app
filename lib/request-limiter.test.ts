import { canMakeRequest, recordRequest, getRemainingCooldownTime } from './request-limiter';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    }
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Request Limiter', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should allow first-time requests', () => {
    const recipient = '0245667942';
    expect(canMakeRequest(recipient)).toBe(true);
  });

  test('should prevent duplicate requests within cooldown period', () => {
    const recipient = '0245667942';
    
    // Record a request
    recordRequest(recipient);
    
    // Should not allow another request
    expect(canMakeRequest(recipient)).toBe(false);
  });

  test('should allow requests after cooldown period', () => {
    const recipient = '0245667942';
    
    // Record a request
    recordRequest(recipient);
    
    // Fast-forward time by 25 hours (past the 24 hour cooldown)
    jest.advanceTimersByTime(25 * 60 * 60 * 1000);
    
    // Should allow request now
    expect(canMakeRequest(recipient)).toBe(true);
  });

  test('should return remaining cooldown time', () => {
    const recipient = '0245667942';
    
    // Record a request
    recordRequest(recipient);
    
    // Fast-forward time by 12 hours
    jest.advanceTimersByTime(12 * 60 * 60 * 1000);
    
    // About 12 hours remaining (allowing for small test execution time differences)
    const remainingTime = getRemainingCooldownTime(recipient);
    expect(remainingTime).toBeGreaterThan(11 * 60 * 60 * 1000);
    expect(remainingTime).toBeLessThan(13 * 60 * 60 * 1000);
  });
});
