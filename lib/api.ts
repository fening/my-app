export interface AirtimeRequest {
  retailer: string;
  recipient: string;
  amount: string;
}

export interface AirtimeResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export async function sendAirtime(data: AirtimeRequest): Promise<AirtimeResponse> {
  try {
    // Create the URL with query parameters
    const url = new URL("https://tppgh.myone4all.com/api/TopUpApi/airtime");
    
    // Use fixed retailer ID instead of from data
    url.searchParams.append("retailer", "FIXED_RETAILER_ID");
    
    // Only the recipient is variable from input
    url.searchParams.append("recipient", data.recipient);
    
    // Use fixed amount instead of from data
    url.searchParams.append("amount", "10.00");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Parse the JSON response regardless of status code
    const result = await response.json();
    
    // If the response has a JSON structure, return it
    if (result) {
      return result;
    }
    
    // If no result from JSON parsing, handle based on status code
    if (!response.ok) {
      return {
        success: false,
        message: `HTTP error! Status: ${response.status}`,
      };
    }

    // Fallback for unexpected cases
    return {
      success: false,
      message: "Unknown response format",
    };
  } catch (error) {
    console.error("Error sending airtime:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

