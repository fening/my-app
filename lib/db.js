const { Pool } = require('pg');
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development'
});

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
  async save(phoneNumber) {
    const query = `
      INSERT INTO phone_numbers(phone_number) 
      VALUES($1) 
      ON CONFLICT (phone_number) DO NOTHING 
      RETURNING *
    `;
    
    const result = await pool.query(query, [phoneNumber]);
    return result.rows[0];
  },
  
  // Get all phone numbers
  async getAll() {
    const { rows } = await pool.query('SELECT * FROM phone_numbers ORDER BY created_at DESC');
    return rows;
  },
  
  // Find a phone number
  async findByNumber(phoneNumber) {
    const { rows } = await pool.query(
      'SELECT * FROM phone_numbers WHERE phone_number = $1',
      [phoneNumber]
    );
    return rows[0];
  }
};

/**
 * Airtime transaction database functions
 */
const airtimeTransactions = {
  // Create a new transaction
  async create(phoneNumber, amount, networkProvider) {
    const query = `
      INSERT INTO airtime_transactions(phone_number, amount, network_provider)
      VALUES($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [phoneNumber, amount, networkProvider]);
    return result.rows[0];
  },
  
  // Update transaction status
  async updateStatus(id, status, transactionRef = null) {
    const query = `
      UPDATE airtime_transactions
      SET status = $2::varchar, 
          transaction_reference = COALESCE($3, transaction_reference),
          processed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE processed_at END
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, status, transactionRef]);
    return result.rows[0];
  },
  
  // Get all transactions for a phone number
  async getByPhoneNumber(phoneNumber) {
    const { rows } = await pool.query(
      'SELECT * FROM airtime_transactions WHERE phone_number = $1 ORDER BY created_at DESC',
      [phoneNumber]
    );
    return rows;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  phoneNumbers,
  airtimeTransactions,
  pool
};
