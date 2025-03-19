// Database setup script - run this once to create the required tables

const { Pool } = require('pg');
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development'
});

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  console.log('Connecting to database:', process.env.DATABASE_URL?.replace(/:([^:]+)@/, ':****@'));

  try {
    // Create phone_numbers table
    console.log('Creating phone_numbers table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS phone_numbers (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT phone_number_unique UNIQUE (phone_number)
      )
    `);
    console.log('✓ phone_numbers table created or already exists');

    // Create airtime_transactions table
    console.log('Creating airtime_transactions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS airtime_transactions (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'NGN',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        network_provider VARCHAR(50),
        transaction_reference VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP WITH TIME ZONE,
        
        CONSTRAINT status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        CONSTRAINT fk_phone_number FOREIGN KEY (phone_number) REFERENCES phone_numbers(phone_number)
      )
    `);
    console.log('✓ airtime_transactions table created or already exists');

    // Create indexes for better query performance
    console.log('Creating indexes...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_phone_numbers ON phone_numbers(phone_number)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_phone ON airtime_transactions(phone_number)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON airtime_transactions(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON airtime_transactions(created_at)`);
    console.log('✓ All indexes created');

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();

