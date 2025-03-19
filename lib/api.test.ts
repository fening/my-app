// Setup the mock first, before any imports
jest.mock('cross-fetch', () => {
  const mockFetch = jest.fn();
  return mockFetch;
});

// Import the module under test with the mock already in place
const { sendAirtime } = require('./api');

describe('Airtime API', () => {
  let mockFetch;
  
  beforeEach(() => {
    // Get a reference to the mocked fetch function
    mockFetch = require('cross-fetch');
    mockFetch.mockClear();
  });
  
  test('should send airtime successfully', async () => {
    // Mock a successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Airtime sent successfully' })
    });

    const result = await sendAirtime({
      recipient: '0245667942',
      retailer: '',
      amount: ''
    });

    // Check that fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  test('should handle failed airtime request', async () => {
    // Mock a failed response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Invalid request' })
    });

    const result = await sendAirtime({
      recipient: '0245667942',
      retailer: '',
      amount: ''
    });

    expect(result.success).toBe(false);
  });
});
