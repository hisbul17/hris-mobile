/*
  # Fix User ID Schema - Change from INTEGER to UUID

  This migration fixes the schema mismatch where user ID columns were defined as INTEGER
  but Supabase Auth uses UUID strings. This resolves the "invalid input syntax for type integer" errors.

  ## Changes Made

  1. **Users Table**
     - Change `id` column from INTEGER to UUID
     - Set default to reference auth.users.id
     - Update foreign key references

  2. **Attendance Table** 
     - Change `user_id` column from INTEGER to UUID
     - Update foreign key to reference users(id)

  3. **Leave Requests Table**
     - Change `user_id` and `reviewed_by` columns to UUID
     - Update foreign key references

  4. **Leave Balances Table**
     - Change `user_id` column to UUID
     - Update foreign key references

  5. **Departments Table**
     - Change `manager_id` column to UUID
     - Update foreign key references

  6. **Audit Logs Table**
     - Change `user_id` column to UUID
     - Update foreign key references

  7. **Notifications Table**
     - Change `user_id` column to UUID
     - Update foreign key references

  ## Important Notes
  - This migration will drop and recreate tables to ensure clean schema
  - All existing data will be lost - this is expected for a schema fix
  - Run this migration in a fresh Supabase project or backup data first
*/

-- Drop all existing tables in reverse dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS departments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS attendance_id_seq CASCADE;
DROP SEQUENCE IF EXISTS leave_types_id_seq CASCADE;
DROP SEQUENCE IF EXISTS leave_requests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS leave_balances_id_seq CASCADE;
DROP SEQUENCE IF EXISTS audit_logs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS notifications_id_seq CASCADE;

-- Create trigger function for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for departments
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_departments_is_active ON departments(is_active);

-- Create trigger for departments
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create users table with UUID id
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'hrd', 'user')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    nik VARCHAR(20) UNIQUE,
    position VARCHAR(100),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    profile_picture VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nik ON users(nik);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Create trigger for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update departments foreign key to reference users
ALTER TABLE departments 
DROP CONSTRAINT IF EXISTS fk_departments_manager,
ADD CONSTRAINT fk_departments_manager 
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create attendance table with UUID user_id
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_photo VARCHAR(255),
    check_out_photo VARCHAR(255),
    check_in_location JSONB,
    check_out_location JSONB,
    working_hours NUMERIC(4,2) DEFAULT 0,
    overtime_hours NUMERIC(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'sick', 'leave')),
    notes TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create indexes for attendance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_approved_by ON attendance(approved_by);

-- Create trigger for attendance
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create leave_types table
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    max_days_per_year INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for leave_types
CREATE INDEX idx_leave_types_name ON leave_types(name);
CREATE INDEX idx_leave_types_is_active ON leave_types(is_active);

-- Create trigger for leave_types
CREATE TRIGGER update_leave_types_updated_at
    BEFORE UPDATE ON leave_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create leave_requests table with UUID user_id
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    applied_date DATE DEFAULT CURRENT_DATE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    attachment VARCHAR(255),
    emergency_contact_during_leave JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date >= start_date)
);

-- Create indexes for leave_requests
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_leave_type_id ON leave_requests(leave_type_id);
CREATE INDEX idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX idx_leave_requests_end_date ON leave_requests(end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_reviewed_by ON leave_requests(reviewed_by);

-- Create trigger for leave_requests
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create leave_balances table with UUID user_id
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
    allocated_days NUMERIC(4,2) DEFAULT 0,
    used_days NUMERIC(4,2) DEFAULT 0,
    remaining_days NUMERIC(4,2) DEFAULT 0,
    carried_forward NUMERIC(4,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, leave_type_id, year),
    CHECK (allocated_days >= 0 AND used_days >= 0 AND remaining_days >= 0 AND carried_forward >= 0)
);

-- Create indexes for leave_balances
CREATE INDEX idx_leave_balances_user_id ON leave_balances(user_id);
CREATE INDEX idx_leave_balances_leave_type_id ON leave_balances(leave_type_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);
CREATE INDEX idx_leave_balances_user_year ON leave_balances(user_id, year);

-- Create trigger for leave_balances
CREATE TRIGGER update_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit_logs table with UUID user_id
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create notifications table with UUID user_id
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    related_table VARCHAR(100),
    related_id INTEGER,
    action_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departments
CREATE POLICY "Users can view departments" ON departments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage departments" ON departments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create RLS policies for users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins and HRD can view all users" ON users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'hrd')
        )
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create RLS policies for attendance
CREATE POLICY "Users can view their own attendance" ON attendance
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own attendance" ON attendance
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins and HRD can view all attendance" ON attendance
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'hrd')
        )
    );

CREATE POLICY "Admins and HRD can manage all attendance" ON attendance
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'hrd')
        )
    );

-- Create RLS policies for leave_types
CREATE POLICY "Users can view active leave types" ON leave_types
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage leave types" ON leave_types
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create RLS policies for leave_requests
CREATE POLICY "Users can view their own leave requests" ON leave_requests
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own leave requests" ON leave_requests
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending leave requests" ON leave_requests
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins and HRD can view all leave requests" ON leave_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'hrd')
        )
    );

CREATE POLICY "Admins and HRD can manage all leave requests" ON leave_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'hrd')
        )
    );

-- Create RLS policies for leave_balances
CREATE POLICY "Users can view their own leave balances" ON leave_balances
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins and HRD can view all leave balances" ON leave_balances
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'hrd')
        )
    );

CREATE POLICY "Admins can manage all leave balances" ON leave_balances
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create RLS policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Insert initial data
INSERT INTO departments (name, description, is_active) VALUES
('Information Technology', 'IT Department responsible for technology infrastructure', true),
('Human Resources', 'HR Department managing employee relations and policies', true),
('Finance', 'Finance Department handling financial operations', true),
('Marketing', 'Marketing Department managing brand and customer outreach', true),
('Operations', 'Operations Department overseeing daily business operations', true);

INSERT INTO leave_types (name, description, max_days_per_year, is_paid, requires_approval, is_active) VALUES
('Annual Leave', 'Yearly vacation leave', 21, true, true, true),
('Sick Leave', 'Medical leave for illness', 14, true, false, true),
('Personal Leave', 'Personal time off', 5, false, true, true),
('Maternity Leave', 'Leave for new mothers', 90, true, true, true),
('Paternity Leave', 'Leave for new fathers', 14, true, true, true),
('Emergency Leave', 'Emergency situations', 3, true, true, true);