-- Migration: Create leave_requests table
-- Description: Creates the leave_requests table to manage employee leave applications

CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    applied_date DATE DEFAULT CURRENT_DATE,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    attachment VARCHAR(255),
    emergency_contact_during_leave JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure end_date is not before start_date
    CHECK (end_date >= start_date),
    -- Ensure total_days is positive
    CHECK (total_days > 0)
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type_id ON leave_requests(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date ON leave_requests(end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_reviewed_by ON leave_requests(reviewed_by);

-- Create trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at 
    BEFORE UPDATE ON leave_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();