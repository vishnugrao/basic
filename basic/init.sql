-- Basic initialization script for the database
-- This file will be executed when the PostgreSQL container starts up

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can add your initial database schema here
-- Example:
-- CREATE TABLE users (
--   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- Add any initial data or setup queries here 