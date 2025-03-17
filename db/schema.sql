-- Airtime Sharing Application Database Schema (Phone Number Only)

-- Create phone_numbers table to store submitted phone numbers
CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT phone_number_unique UNIQUE (phone_number)
);

-- Create airtime_transactions table to track airtime sharing
CREATE TABLE airtime_transactions (
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
);

-- Indexes for better query performance
CREATE INDEX idx_phone_numbers ON phone_numbers(phone_number);
CREATE INDEX idx_transactions_phone ON airtime_transactions(phone_number);
CREATE INDEX idx_transactions_status ON airtime_transactions(status);
CREATE INDEX idx_transactions_created_at ON airtime_transactions(created_at);
