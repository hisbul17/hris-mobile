-- Migration: Create leave_types table
-- Description: Creates the leave_types table to define different types of leave

CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    max_days_per_year INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_leave_types_name ON leave_types(name);
CREATE INDEX IF NOT EXISTS idx_leave_types_is_active ON leave_types(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_leave_types_updated_at 
    BEFORE UPDATE ON leave_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();