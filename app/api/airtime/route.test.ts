import { POST } from './route';

// Mock next/server
jest.mock('next/server', () => {
  return require('./__mocks__/next-server');
});

import { NextRequest } from 'next/server';

// Mock fetch function
global.fetch = jest.fn();

describe('Airtime API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 for invalid phone number', async () => {
    // Create a mock request with an invalid number
    const mockRequest = new NextRequest(
      'http://localhost:3000/api/airtime',
      {
        method: 'POST',
        body: JSON.stringify({ recipient: '123' }), // Too short
      }
    );

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Invalid phone number');
  });

  test('should call airtime API for valid request', async () => {
    // Mock a successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Airtime sent successfully',
        transactionId: 'test123'
      })
    });

    // Create a mock request with valid data
    const mockRequest = new NextRequest(
      'http://localhost:3000/api/airtime',
      {
        method: 'POST',
        body: JSON.stringify({ 
          recipient: '0245667942',
          retailer: '',
          amount: ''
        }),
      }
    );

    const response = await POST(mockRequest);
    const data = await response.json();

    // Verify API was called with correct parameters
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0].toString();
    expect(fetchUrl).toContain('FIXED_RETAILER_ID');
    expect(fetchUrl).toContain('0245667942');
    expect(fetchUrl).toContain('10.00');

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('should prevent duplicate requests for same number', async () => {
    // Mock a successful API response for the first call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Airtime sent successfully',
      })
    });

    // First request
    const mockRequest1 = new NextRequest(
      'http://localhost:3000/api/airtime',
      {
        method: 'POST',
        body: JSON.stringify({ recipient: '0245667942' }),
      }
    );
    await POST(mockRequest1);

    // For second request - required due to jest mocks resetting
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Should not reach this',
      })
    });

    // Second request with same number
    const mockRequest2 = new NextRequest(
      'http://localhost:3000/api/airtime',
      {
        method: 'POST',
        body: JSON.stringify({ recipient: '0245667942' }),
      }
    );
    const response = await POST(mockRequest2);
    const data = await response.json();

    expect(response.status).toBe(429); // Too Many Requests
    expect(data.success).toBe(false);
    expect(data.message).toContain('already received airtime');
  });
});
