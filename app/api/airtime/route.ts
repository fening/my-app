import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AirtimeRequest, AirtimeResponse } from '@/lib/api';
import { phoneNumbers, airtimeTransactions } from '@/lib/db';
import dotenv from 'dotenv';

// Load environment variables based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, load from /etc/app.env.production
  dotenv.config({ path: '/etc/app.env.production' });
} else {
  // In development, load from local .env.development
  dotenv.config({ path: '.env.development' });
}

// Create a logger function
const logApiRequest = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[API ${timestamp}] ${message}`, data ? data : '');
};

export async function POST(request: NextRequest) {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  logApiRequest(`[${requestId}] Received airtime request`);
  
  try {
    const body = await request.json() as AirtimeRequest;
    logApiRequest(`[${requestId}] Request body:`, body);
    
    // Validate the recipient
    if (!body.recipient || body.recipient.length < 10) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number" },
        { status: 400 }
      );
    }
    
    // Clean the phone number (remove spaces)
    const recipient = body.recipient.replace(/\s+/g, '');
    
    // Check if phone number exists in database
    const existingPhone = await phoneNumbers.findByNumber(recipient);
    
    // If the phone number already exists in the database, reject the request
    if (existingPhone) {
      return NextResponse.json(
        { 
          success: false, 
          message: `This number has already received airtime and is not eligible for more.` 
        },
        { status: 403 } // 403 Forbidden status code
      );
    }
    
    // Create the URL with query parameters for the actual airtime API
    const url = new URL("https://tppgh.myone4all.com/api/TopUpApi/airtime");
    
    // Use fixed retailer ID
    url.searchParams.append("retailer", "FIXED_RETAILER_ID");
    
    // The recipient from the request
    url.searchParams.append("recipient", recipient);
    
    // Use fixed amount
    const FIXED_AMOUNT = 1.00;  // Fixed amount in GHS
    
    // Save phone number to database immediately to prevent duplicate requests
    await phoneNumbers.save(recipient);

    try {
      // Create a pending transaction
      logApiRequest(`[${requestId}] Creating transaction for ${recipient}, amount: ${FIXED_AMOUNT}`);
      const transaction = await airtimeTransactions.create(recipient, FIXED_AMOUNT);

      if (process.env.NODE_ENV === 'development') {
        // Development mode: Simulate successful response
        const txRef = 'TX-' + Date.now().toString();
        logApiRequest(`[${requestId}] Development mode - simulating successful transaction`);
        
        try {
          const status: 'completed' = 'completed';
          await airtimeTransactions.updateStatus(transaction.id, status, txRef);
        } catch (error) {
          logApiRequest(`[${requestId}] Error updating transaction status:`, error);
        }
        
        return NextResponse.json({
          success: true,
          message: "Airtime sent successfully (Development Mode)",
          data: { 
            recipient, 
            amount: FIXED_AMOUNT, 
            reference: txRef 
          }
        });
      } else {
        // Production mode: Make actual API call
        const url = new URL("https://tppgh.myone4all.com/api/TopUpApi/airtime");
        const transactionRef = 'TX-' + Date.now().toString();

        // Add query parameters according to the API spec
        const params = {
          retailer: process.env.API_KEY || '',
          recipient,
          amount: FIXED_AMOUNT.toString(),
          network: "0", // Auto detect
          trxn: transactionRef
        };

        // Build query string the same way as PHP
        url.search = new URLSearchParams(params).toString();

        logApiRequest(`[${requestId}] Production mode - calling MyOne4All API`, {
          url: url.toString(),
          params: {
            ...params,
            retailer: '[REDACTED]'
          }
        });
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'ApiKey': process.env.API_KEY || '',
            'ApiSecret': process.env.API_SECRET || '',
            'User-Agent': 'TppMyOne4All Node.js Library',
            'Accept': 'application/json'
          },
          // Disable SSL verification as in PHP client
          //@ts-ignore - Next.js fetch doesn't support this option, but node-fetch does
          rejectUnauthorized: false
        });

        // Log response status and headers for debugging
        logApiRequest(`[${requestId}] API Response Status:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        logApiRequest(`[${requestId}] Raw API response:`, responseText);

        // If we got a 404, log it clearly
        if (response.status === 404) {
          logApiRequest(`[${requestId}] API endpoint not found (404)`);
          return NextResponse.json({
            success: false,
            message: "Airtime provider API endpoint not found",
            error: "ENDPOINT_NOT_FOUND"
          }, { status: 404 });
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          logApiRequest(`[${requestId}] Failed to parse API response as JSON:`, e);
          return NextResponse.json({
            success: false,
            message: "Invalid response from airtime provider",
            error: "INVALID_RESPONSE",
            details: responseText.substring(0, 500) // First 500 chars of response for debugging
          }, { status: 502 });
        }
        
        // Check if the response is successful (status-code === "00" and not pending)
        const isSuccessful = result['status-code'] === "00" && !result.pending;
        const isPending = result.pending === true;
        
        if (isSuccessful) {
          logApiRequest(`[${requestId}] MyOne4All API call successful:`, result);
          try {
            const status: 'completed' = 'completed';
            await airtimeTransactions.updateStatus(transaction.id, status, transactionRef);
          } catch (error) {
            logApiRequest(`[${requestId}] Error updating transaction status:`, error);
          }
          
          return NextResponse.json({
            success: true,
            message: result.message || "Airtime sent successfully",
            data: { 
              recipient, 
              amount: FIXED_AMOUNT, 
              reference: transactionRef,
              balance: {
                before: result.balance_before,
                after: result.balance_after
              }
            }
          });
        } else if (isPending) {
          logApiRequest(`[${requestId}] MyOne4All API call pending:`, result);
          try {
            const status: 'pending' = 'pending';
            await airtimeTransactions.updateStatus(transaction.id, status, transactionRef);
          } catch (error) {
            logApiRequest(`[${requestId}] Error updating transaction status:`, error);
          }
          
          return NextResponse.json({
            success: true,
            message: result.message || "Airtime request is pending",
            data: { 
              recipient, 
              amount: FIXED_AMOUNT, 
              reference: transactionRef,
              status: 'pending'
            }
          });
        } else {
          logApiRequest(`[${requestId}] MyOne4All API call failed:`, result);
          try {
            const status: 'failed' = 'failed';
            await airtimeTransactions.updateStatus(transaction.id, status, null);
          } catch (error) {
            logApiRequest(`[${requestId}] Error updating transaction status:`, error);
          }
          
          return NextResponse.json({
            success: false,
            message: result.message || "Failed to send airtime",
            error: result['status-code'] || 'UNKNOWN_ERROR'
          }, { status: 400 });
        }
      }
    } catch (dbError: any) {
      // Check for specific database errors
      if (dbError.code === '42P01') { // Relation does not exist
        logApiRequest(`[${requestId}] Database tables not set up properly. Run setup-db.js script.`);
        return NextResponse.json(
          {
            success: false,
            message: "Database not configured. Please run setup script.",
            error: "DATABASE_NOT_CONFIGURED"
          },
          { status: 500 }
        );
      }
      
      // Re-throw other errors
      throw dbError;
    }
  } catch (error) {
    logApiRequest(`[${requestId}] Error processing request:`, error);
    console.error("Error processing airtime request:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      },
      { status: 500 }
    );
  }
}
