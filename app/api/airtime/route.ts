import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AirtimeRequest, AirtimeResponse } from '@/lib/api';
import { phoneNumbers, airtimeTransactions } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AirtimeRequest;
    
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
    const amount = 10.00;
    url.searchParams.append("amount", amount.toString());

    // Save phone number to database immediately to prevent duplicate requests
    await phoneNumbers.save(recipient);

    // Create a pending transaction
    const transaction = await airtimeTransactions.create(recipient, amount);

    // In a real application, you'd make the API call here
    // For testing, we'll simulate a successful response
    const simulatedSuccess = true;
    
    if (simulatedSuccess) {
      // Update transaction status to completed
      await airtimeTransactions.updateStatus(transaction.id, 'completed', 'TX-' + Date.now());
      
      return NextResponse.json({
        success: true,
        message: "Airtime sent successfully",
        data: { recipient, amount }
      });
    } else {
      // Update transaction status to failed
      await airtimeTransactions.updateStatus(transaction.id, 'failed');
      
      return NextResponse.json({
        success: false,
        message: "Failed to send airtime",
      }, { status: 400 });
    }
  } catch (error) {
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
