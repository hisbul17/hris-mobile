/*
  # Create leave_types table

  1. New Tables
    - `leave_types`
      - `id` (serial, primary key)
      - `name` (varchar, unique)
      - `description` (text)
      - `max_days_per_year` (integer)
      - `is_paid` (boolean)
      - `requires_approval` (boolean)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leave_types` table
    - Add policies for all authenticated users to read leave types
    - Add policies for admin to manage leave types
*/

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

-- Enable Row Level Security
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All users can read active leave types"
  ON leave_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage leave types"
  ON leave_types
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');