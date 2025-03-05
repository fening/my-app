import { sendAirtime } from './api';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Define mock server
const server = setupServer(
  rest.get('https://tppgh.myone4all.com/api/TopUpApi/airtime', (req, res, ctx) => {
    const recipient = req.url.searchParams.get('recipient');
    
    // Mock successful response
    if (recipient === '0245667942') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Airtime sent successfully',
          transactionId: 'trans03423423',
        })
      );
    }
    
    // Mock failed response
    return res(
      ctx.status(400),
      ctx.json({
        success: false,
        message: 'Invalid phone number',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Airtime API', () => {
  test('should send airtime successfully', async () => {
    const response = await sendAirtime({
      recipient: '0245667942',
      retailer: '', // Will be overridden with fixed value in the implementation
      amount: '',   // Will be overridden with fixed value in the implementation
    });
    
    expect(response.success).toBe(true);
    expect(response.message).toBe('Airtime sent successfully');
    expect(response.transactionId).toBe('trans03423423');
  });
  
  test('should handle failed airtime request', async () => {
    const response = await sendAirtime({
      recipient: '0000000000', // Invalid number
      retailer: '',
      amount: '',
    });
    
    expect(response.success).toBe(false);
    expect(response.message).toBe('Invalid phone number');
  });
});
