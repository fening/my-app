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

      // In a real application, you'd make the API call here
      // For testing, we'll simulate a successful response
      const simulatedSuccess = true;
      
      if (simulatedSuccess) {
        // Update transaction status to completed
        const txRef = 'TX-' + Date.now().toString();
        logApiRequest(`[${requestId}] Updating transaction to completed, ref: ${txRef}`);
        try {
          // Make sure we're passing a string literal that matches the expected enum values
          const status: 'completed' = 'completed';
          await airtimeTransactions.updateStatus(transaction.id, status, txRef);
        } catch (error) {
          logApiRequest(`[${requestId}] Error updating transaction status:`, error);
          // Continue to provide successful response to user, but log the error
        }
        
        return NextResponse.json({
          success: true,
          message: "Airtime sent successfully",
          data: { recipient, amount }
        });
      } else {
        // Update transaction status to failed
        logApiRequest(`[${requestId}] Transaction failed`);
        try {
          // Make sure we're passing a string literal that matches the expected enum values
          const status: 'failed' = 'failed';
          await airtimeTransactions.updateStatus(transaction.id, status, null);
        } catch (error) {
          logApiRequest(`[${requestId}] Error updating transaction status:`, error);
        }
        
        return NextResponse.json({
          success: false,
          message: "Failed to send airtime",
        }, { status: 400 });
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
