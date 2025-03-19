import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables based on environment
dotenv.config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development'
});

// Type definitions
export interface PhoneNumberRecord {
  id: number;
  phone_number: string;
  created_at: Date;
}

export interface AirtimeTransaction {
  id: number;
  phone_number: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  network_provider?: string;
  transaction_reference?: string;
  created_at: Date;
  processed_at?: Date;
}

// Determine if this is a localhost connection
const isLocalhost = process.env.POSTGRES_HOST === 'localhost' || 
                    process.env.POSTGRES_HOST === '127.0.0.1' ||
                    (process.env.DATABASE_URL || '').includes('localhost') ||
                    (process.env.DATABASE_URL || '').includes('127.0.0.1');

// Determine if SSL should be explicitly disabled
const disableSSL = isLocalhost || process.env.POSTGRES_SSL === 'false';

// Configure PostgreSQL connection options
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: disableSSL ? false : 
      (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
};

console.log(`[DB] Connection info:`, {
  host: process.env.POSTGRES_HOST,
  isLocalhost,
  sslEnabled: dbConfig.ssl !== false,
  nodeEnv: process.env.NODE_ENV
});

// Create a singleton database connection pool
const pool = new Pool(dbConfig);

// Test the connection
pool.query('SELECT NOW()')
  .then(() => console.log('[DB] Database connection successful'))
  .catch(err => {
    console.error('[DB] Database connection error:', err);
    // If SSL is the issue, try reconnecting without SSL
    if (err.message.includes('SSL') && !disableSSL) {
      console.log('[DB] Attempting to reconnect without SSL...');
      // Update the pool's SSL config
      (pool as any).options.ssl = false;
    }
  });

// Add error handler for connection issues
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on PostgreSQL client:', err);
  
  // Handle SSL-specific errors
  if (err.message.includes('SSL')) {
    console.error('[DB] SSL error detected. Please set POSTGRES_SSL=false in your .env file');
  }
});

/**
 * Phone number database functions
 */
const phoneNumbers = {
  // Save a phone number to the database
  async save(phoneNumber: string): Promise<PhoneNumberRecord | null> {
    const query = `
      INSERT INTO phone_numbers(phone_number) 
      VALUES($1) 
      ON CONFLICT (phone_number) DO NOTHING 
      RETURNING *
    `;
    
    const result = await pool.query(query, [phoneNumber]);
    return result.rows[0] || null;
  },
  
  // Get all phone numbers
  async getAll(): Promise<PhoneNumberRecord[]> {
    const { rows } = await pool.query('SELECT * FROM phone_numbers ORDER BY created_at DESC');
    return rows;
  },
  
  // Find a phone number
  async findByNumber(phoneNumber: string): Promise<PhoneNumberRecord | null> {
    const { rows } = await pool.query(
      'SELECT * FROM phone_numbers WHERE phone_number = $1',
      [phoneNumber]
    );
    return rows[0] || null;
  }
};

/**
 * Airtime transaction database functions
 */
const airtimeTransactions = {
  // Create a new transaction
  async create(phoneNumber: string, amount: number, networkProvider?: string): Promise<AirtimeTransaction> {
    const query = `
      INSERT INTO airtime_transactions(phone_number, amount, network_provider)
      VALUES($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [phoneNumber, amount, networkProvider]);
    return result.rows[0];
  },
  
  // Update transaction status
  async updateStatus(id: number, status: AirtimeTransaction['status'], transactionRef?: string | null): Promise<AirtimeTransaction | null> {
    // Validate status to prevent SQL injection
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    const statusStr = String(status);
    
    if (!validStatuses.includes(statusStr)) {
      throw new Error(`Invalid status: ${statusStr}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Process transaction reference
    const txRef = transactionRef === undefined ? null : String(transactionRef);
    const txRefValue = txRef === null ? 'NULL' : `'${txRef.replace(/'/g, "''")}'`; // Escape single quotes
    
    // Build a safe query with explicit transaction_status enum cast
    const query = `
      UPDATE airtime_transactions
      SET status = '${statusStr}'::transaction_status, 
          transaction_reference = COALESCE(${txRefValue}, transaction_reference),
          processed_at = CASE WHEN '${statusStr}'::transaction_status IN ('completed', 'failed') THEN NOW() ELSE processed_at END
      WHERE id = ${id}
      RETURNING *
    `;
    
    console.log(`[DB] Updating transaction ${id} status to "${statusStr}", ref: ${txRefValue}`);
    
    try {
      const result = await pool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error("[DB] Error in updateStatus:", error);
      throw error;
    }
  },
  
  // Get all transactions for a phone number
  async getByPhoneNumber(phoneNumber: string): Promise<AirtimeTransaction[]> {
    const { rows } = await pool.query(
      'SELECT * FROM airtime_transactions WHERE phone_number = $1 ORDER BY created_at DESC',
      [phoneNumber]
    );
    return rows;
  }
};

// Define a named constant for the export
const dbUtils = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  phoneNumbers,
  airtimeTransactions,
  pool
};

export {
  pool,
  phoneNumbers,
  airtimeTransactions
};

export default dbUtils;
