/*
  # Fix Users Table Schema - Convert ID to UUID

  This migration fixes the users table schema to use UUID for the id column
  instead of integer, which is required for Supabase Auth integration.

  ## Changes Made
  1. Drop existing users table (with CASCADE to handle foreign key dependencies)
  2. Recreate users table with correct UUID id column
  3. Set up proper foreign key relationship with auth.users
  4. Re-enable Row Level Security (RLS)
  5. Create appropriate RLS policies for different user roles
  6. Add necessary indexes for performance
  7. Create trigger for updated_at timestamp

  ## Important Notes
  - This will delete all existing data in the users table
  - You will need to re-run seed data after this migration
  - All foreign key relationships will be recreated
*/

-- Drop existing users table and all dependent objects
DROP TABLE IF EXISTS public.users CASCADE;

-- Create the users table with correct UUID schema
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id character varying(20) UNIQUE NOT NULL,
    email character varying(255) UNIQUE NOT NULL,
    password_hash character varying(255) NOT NULL DEFAULT '',
    role character varying(20) NOT NULL DEFAULT 'user',
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    nik character varying(20) UNIQUE,
    position character varying(100),
    department_id integer REFERENCES public.departments(id) ON DELETE SET NULL,
    hire_date date,
    birth_date date,
    address text,
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(20),
    profile_picture character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Add check constraints
    CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'hrd'::character varying, 'user'::character varying]::text[]))
);

-- Create indexes for performance
CREATE INDEX idx_users_department_id ON public.users USING btree (department_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_employee_id ON public.users USING btree (employee_id);
CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);
CREATE INDEX idx_users_nik ON public.users USING btree (nik);
CREATE INDEX idx_users_role ON public.users USING btree (role);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Admins and HRD can view all users
DROP POLICY IF EXISTS "Admins and HRD can view all users" ON public.users;
CREATE POLICY "Admins and HRD can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR role = 'hrd')
        )
    );

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can insert new users
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update all users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update departments table foreign key constraint to reference the new users table
ALTER TABLE public.departments 
DROP CONSTRAINT IF EXISTS fk_departments_manager;

ALTER TABLE public.departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update other tables that reference users table
-- Attendance table
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_user_id_fkey;

ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_approved_by_fkey;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Leave requests table
ALTER TABLE public.leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;

ALTER TABLE public.leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_reviewed_by_fkey;

ALTER TABLE public.leave_requests 
ADD CONSTRAINT leave_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.leave_requests 
ADD CONSTRAINT leave_requests_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Leave balances table
ALTER TABLE public.leave_balances 
DROP CONSTRAINT IF EXISTS leave_balances_user_id_fkey;

ALTER TABLE public.leave_balances 
ADD CONSTRAINT leave_balances_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Audit logs table
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Notifications table
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;