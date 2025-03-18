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

// Create a singleton database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
  async updateStatus(id: number, status: AirtimeTransaction['status'], transactionRef?: string): Promise<AirtimeTransaction | null> {
    const query = `
      UPDATE airtime_transactions
      SET status = $2, 
          transaction_reference = COALESCE($3, transaction_reference),
          processed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE processed_at END
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, status, transactionRef]);
    return result.rows[0] || null;
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
