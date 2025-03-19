const { Pool } = require('pg');
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development'
});

// Log connection details (without password) for debugging
console.log('Attempting to connect with the following parameters:');
console.log('Database URL:', process.env.DATABASE_URL?.replace(/:([^:]+)@/, ':****@'));
console.log('Host:', process.env.POSTGRES_HOST);
console.log('Port:', process.env.POSTGRES_PORT);
console.log('User:', process.env.POSTGRES_USER);
console.log('Database:', process.env.POSTGRES_DB);

// Create a connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database successfully!');
    
    // Test phone_numbers table existence and creation if necessary
    await client.query(`
      CREATE TABLE IF NOT EXISTS phone_numbers (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT phone_number_unique UNIQUE (phone_number)
      );
    `);
    
    // Insert a test phone number
    const testPhone = '+2347012345678';
    const insertResult = await client.query(
      'INSERT INTO phone_numbers(phone_number) VALUES($1) ON CONFLICT DO NOTHING RETURNING *',
      [testPhone]
    );
    
    console.log('Insertion result:', insertResult.rows);
    
    // Query the database to verify
    const { rows } = await client.query('SELECT * FROM phone_numbers');
    console.log('Phone numbers in database:', rows);

    console.log('Database test completed successfully!');
    return true;
  } catch (error) {
    console.error('Database connection or test failed:', error);
    console.log('\nTROUBLESHOOTING TIPS:');
    console.log('1. Verify PostgreSQL is running on your machine');
    console.log('2. Ensure your password is correct in .env.development');
    console.log('3. Make sure the database "airtime_dev" exists');
    console.log('4. Try connecting with psql to test credentials: psql -U postgres -h localhost');
    return false;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testDatabaseConnection();
