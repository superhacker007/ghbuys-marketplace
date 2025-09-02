-- Initialize Ghana Buys marketplace database

-- Create additional databases for testing and development
CREATE DATABASE ghbuys_test;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone to Ghana (GMT+0)
SET timezone = 'UTC';

-- Ghana regions enum (for reference)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ghana_region') THEN
        CREATE TYPE ghana_region AS ENUM (
            'Greater Accra',
            'Ashanti',
            'Northern',
            'Western',
            'Eastern',
            'Volta',
            'Upper East',
            'Upper West',
            'Central',
            'Brong Ahafo',
            'Western North',
            'Ahafo',
            'Bono',
            'Bono East',
            'Oti',
            'Savannah',
            'North East'
        );
    END IF;
END
$$;

-- Mobile money providers enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mobile_money_provider') THEN
        CREATE TYPE mobile_money_provider AS ENUM (
            'mtn',
            'vodafone',
            'airtel_tigo'
        );
    END IF;
END
$$;