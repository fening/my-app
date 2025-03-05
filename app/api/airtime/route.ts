import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AirtimeRequest, AirtimeResponse } from '@/lib/api';

// In-memory store for rate limiting (will be reset on server restart)
// In production, you'd use Redis or a database
const requestLog: Map<string, number> = new Map();
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 hours

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
    
    // Check rate limiting
    const recipient = body.recipient;
    const lastRequestTime = requestLog.get(recipient);
    const now = Date.now();
    
    if (lastRequestTime && now - lastRequestTime < COOLDOWN_TIME) {
      const remainingTime = Math.ceil((COOLDOWN_TIME - (now - lastRequestTime)) / (1000 * 60 * 60));
      return NextResponse.json(
        { 
          success: false, 
          message: `This number already received airtime. Try again in ${remainingTime} hours.` 
        },
        { status: 429 }
      );
    }
    
    // Create the URL with query parameters for the actual airtime API
    const url = new URL("https://tppgh.myone4all.com/api/TopUpApi/airtime");
    
    // Use fixed retailer ID
    url.searchParams.append("retailer", "FIXED_RETAILER_ID");
    
    // The recipient from the request
    url.searchParams.append("recipient", recipient);
    
    // Use fixed amount
    url.searchParams.append("amount", "10.00");

    const apiResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await apiResponse.json() as AirtimeResponse;
    
    // If successful, record the request
    if (result.success) {
      requestLog.set(recipient, now);
    }
    
    return NextResponse.json(result, { 
      status: apiResponse.ok ? 200 : 400 
    });
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
