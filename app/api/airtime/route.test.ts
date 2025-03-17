// Mock DB functions to avoid actual database connections
jest.mock('@/lib/db', () => ({
  phoneNumbers: {
    save: jest.fn().mockResolvedValue({ id: 1, phone_number: '0245667942' }),
    findByNumber: jest.fn().mockImplementation((number) => {
      // Return null for new numbers, or an object for existing ones based on test needs
      if (number === '0245667943') {
        return Promise.resolve({ id: 2, phone_number: number, created_at: new Date() });
      }
      return Promise.resolve(null);
    }),
    getAll: jest.fn().mockResolvedValue([])
  },
  airtimeTransactions: {
    create: jest.fn().mockResolvedValue({ id: 1, status: 'pending' }),
    updateStatus: jest.fn().mockResolvedValue({ id: 1, status: 'completed' }),
    getByPhoneNumber: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body, init = { status: 200 }) => ({
      status: init.status,
      body,
      json: async () => body
    })
  },
  NextRequest: class {
    constructor(url, options) {
      this.url = url;
      this.method = options.method;
      this.bodyContent = options.body || '{}';
    }

    json() {
      return Promise.resolve(JSON.parse(this.bodyContent));
    }
  }
}));

// Now it's safe to import the module being tested
const { POST } = require('./route');

// Mock fetch function
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);

describe('Airtime API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 for invalid phone number', async () => {
    const NextRequest = require('next/server').NextRequest;
    
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

  test('should send airtime for valid request', async () => {
    const NextRequest = require('next/server').NextRequest;
    
    // Mock a successful API response
    global.fetch.mockResolvedValueOnce({
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

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('should return 403 for already processed number', async () => {
    const NextRequest = require('next/server').NextRequest;
    
    // Create a mock request with a phone number that already exists
    const mockRequest = new NextRequest(
      'http://localhost:3000/api/airtime',
      {
        method: 'POST',
        body: JSON.stringify({ recipient: '0245667943' }), // This number is set to return an existing record
      }
    );

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(403); // Forbidden
    expect(data.success).toBe(false);
    expect(data.message).toContain('already received airtime');
  });
});
