/*
  # Create attendance table

  1. New Tables
    - `attendance`
      - `id` (serial, primary key)
      - `user_id` (uuid, references users)
      - `date` (date)
      - `check_in_time` (timestamp)
      - `check_out_time` (timestamp)
      - `check_in_photo` (varchar)
      - `check_out_photo` (varchar)
      - `check_in_location` (jsonb)
      - `check_out_location` (jsonb)
      - `working_hours` (decimal)
      - `overtime_hours` (decimal)
      - `status` (varchar, check constraint)
      - `notes` (text)
      - `approved_by` (uuid, references users)
      - `approved_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `attendance` table
    - Add policies for users to manage their own attendance
    - Add policies for admin/hrd to view all attendance

  3. Constraints
    - Unique constraint on user_id and date
    - Status must be one of: present, absent, late, half_day, sick, leave
*/

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own attendance"
  ON attendance
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin and HRD can view all attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'hrd'));

CREATE POLICY "Admin and HRD can manage all attendance"
  ON attendance
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'hrd'));