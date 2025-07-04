/*
  # Create leave_requests table

  1. New Tables
    - `leave_requests`
      - `id` (serial, primary key)
      - `user_id` (uuid, references users)
      - `leave_type_id` (integer, references leave_types)
      - `start_date` (date)
      - `end_date` (date)
      - `total_days` (integer)
      - `reason` (text)
      - `status` (varchar, check constraint)
      - `applied_date` (date)
      - `reviewed_by` (uuid, references users)
      - `reviewed_at` (timestamp)
      - `review_notes` (text)
      - `attachment` (varchar)
      - `emergency_contact_during_leave` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leave_requests` table
    - Add policies for users to manage their own requests
    - Add policies for admin/hrd to review all requests

  3. Constraints
    - End date must be >= start date
    - Total days must be positive
    - Status must be one of: pending, approved, rejected, cancelled
*/

CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    applied_date DATE DEFAULT CURRENT_DATE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- Enable Row Level Security
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own leave requests"
  ON leave_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin and HRD can view all leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'hrd'));

CREATE POLICY "Admin and HRD can review leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'hrd'));