import fetch from 'cross-fetch';

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

// Get API credentials from environment variables
const getApiCredentials = () => ({
  apiKey: process.env.API_KEY || '',
  apiSecret: process.env.API_SECRET || ''
});

// Logger function for external API calls
const logExternalApi = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[ExternalAPI ${timestamp}] ${message}`, data ? data : '');
};

export async function sendAirtime(data: AirtimeRequest): Promise<AirtimeResponse> {
  const requestId = Date.now().toString(36);
  logExternalApi(`[${requestId}] Starting airtime request for ${data.recipient}`);
  
  try {
    // Get credentials
    const { apiKey, apiSecret } = getApiCredentials();
    
    // Create the URL with query parameters
    const url = new URL("https://tppgh.myone4all.com/api/TopUpApi/airtime");
    
    // Use fixed retailer ID instead of from data
    url.searchParams.append("retailer", "FIXED_RETAILER_ID");
    
    // Only the recipient is variable from input
    url.searchParams.append("recipient", data.recipient);
    
    // Use fixed amount instead of from data
    url.searchParams.append("amount", "10.00");
    
    // Add API credentials to request
    url.searchParams.append("key", apiKey);

    logExternalApi(`[${requestId}] Sending request to external API:`, url.toString());
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiSecret}` // Example of using the secret for auth
      },
    });

    logExternalApi(`[${requestId}] External API response status: ${response.status}`);
    
    // Parse the JSON response regardless of status code
    const result = await response.json();
    logExternalApi(`[${requestId}] External API response body:`, result);
    
    // If the response has a JSON structure, return it
    if (result) {
      return result;
    }
    
    // If no result from JSON parsing, handle based on status code
    if (!response.ok) {
      const errorMsg = `HTTP error! Status: ${response.status}`;
      logExternalApi(`[${requestId}] Error: ${errorMsg}`);
      return {
        success: false,
        message: errorMsg,
      };
    }

    // Fallback for unexpected cases
    logExternalApi(`[${requestId}] Unknown response format`);
    return {
      success: false,
      message: "Unknown response format",
    };
  } catch (error) {
    logExternalApi(`[${requestId}] Exception:`, error);
    console.error("Error sending airtime:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

