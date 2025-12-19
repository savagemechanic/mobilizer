-- Database initialization script for Mobilizer v2
-- This script runs automatically when PostgreSQL container starts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for text search
-- Additional tables and indexes will be created by Prisma migrations

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Mobilizer v2 database initialized successfully';
END $$;
