-- Migration: Create leave_balances table
-- Description: Creates the leave_balances table to track employee leave balances

CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    allocated_days DECIMAL(4,2) DEFAULT 0,
    used_days DECIMAL(4,2) DEFAULT 0,
    remaining_days DECIMAL(4,2) DEFAULT 0,
    carried_forward DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one balance record per user per leave type per year
    UNIQUE(user_id, leave_type_id, year),
    -- Ensure year is reasonable
    CHECK (year >= 2020 AND year <= 2050),
    -- Ensure days are not negative
    CHECK (allocated_days >= 0 AND used_days >= 0 AND remaining_days >= 0 AND carried_forward >= 0)
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_id ON leave_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_leave_type_id ON leave_balances(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_year ON leave_balances(user_id, year);

-- Create trigger for updated_at
CREATE TRIGGER update_leave_balances_updated_at 
    BEFORE UPDATE ON leave_balances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();