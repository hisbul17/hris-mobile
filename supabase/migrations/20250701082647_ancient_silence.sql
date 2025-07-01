-- Migration: Create attendance table
-- Description: Creates the attendance table to track employee check-ins and check-outs

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_photo VARCHAR(255),
    check_out_photo VARCHAR(255),
    check_in_location JSONB,
    check_out_location JSONB,
    working_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'sick', 'leave')),
    notes TEXT,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one attendance record per user per date
    UNIQUE(user_id, date)
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_approved_by ON attendance(approved_by);

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();