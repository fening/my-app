import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AirtimeRequest, AirtimeResponse } from '@/lib/api';
import { phoneNumbers, airtimeTransactions } from '@/lib/db';

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
    const amount = 1.00;
    url.searchParams.append("amount", amount.toString());

    // Save phone number to database immediately to prevent duplicate requests
    await phoneNumbers.save(recipient);

    try {
      // Create a pending transaction
      logApiRequest(`[${requestId}] Creating transaction for ${recipient}, amount: ${amount}`);
      const transaction = await airtimeTransactions.create(recipient, amount);

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
          data: { recipient, amount, reference: txRef }
        });
      } else {
        // Production mode: Make actual API call
        const url = new URL("https://tppgh.myone4all.com/api/TopUpApi/sendAirtime");
        const transactionRef = 'TX-' + Date.now().toString();

        // Prepare request body according to MyOne4All API spec
        const apiRequestBody = {
          phoneNumber: recipient,
          amount: amount,
          transactionId: transactionRef,
          networkCode: "0" // 0 means auto-detect network
        };

        logApiRequest(`[${requestId}] Production mode - calling MyOne4All API`, apiRequestBody);
        
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Authorization': `ApiKey ${process.env.API_KEY}:${process.env.API_SECRET}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiRequestBody)
        });

        const result = await response.json();
        
        if (response.ok && result.status === "SUCCESS") {
          logApiRequest(`[${requestId}] MyOne4All API call successful:`, result);
          try {
            const status: 'completed' = 'completed';
            await airtimeTransactions.updateStatus(transaction.id, status, result.transactionId || transactionRef);
          } catch (error) {
            logApiRequest(`[${requestId}] Error updating transaction status:`, error);
          }
          
          return NextResponse.json({
            success: true,
            message: "Airtime sent successfully",
            data: { 
              recipient, 
              amount, 
              reference: result.transactionId || transactionRef,
              network: result.network,
              balance: result.balance
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
            error: result.errorCode || 'UNKNOWN_ERROR'
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
