/*
  # Seed Admin User

  Creates an initial admin user for the system.
  This should be run after the users table schema fix.

  ## What this does
  1. Creates an admin user in auth.users (if not exists)
  2. Creates corresponding profile in public.users
  3. Sets up initial departments and leave types

  ## Important Notes
  - Change the email and password before running in production
  - This creates a default admin account for initial setup
*/

-- Insert admin user into auth.users (this will be handled by Supabase Auth in the app)
-- The actual user creation should be done through the app's sign-up process

-- Create default departments if they don't exist
INSERT INTO public.departments (name, description, is_active) 
VALUES 
    ('Human Resources', 'Human Resources Department', true),
    ('Information Technology', 'IT Department', true),
    ('Finance', 'Finance Department', true),
    ('Operations', 'Operations Department', true)
ON CONFLICT (name) DO NOTHING;

-- Create default leave types if they don't exist
INSERT INTO public.leave_types (name, description, max_days_per_year, is_paid, requires_approval, is_active)
VALUES 
    ('Annual Leave', 'Yearly vacation leave', 21, true, true, true),
    ('Sick Leave', 'Medical leave', 10, true, false, true),
    ('Personal Leave', 'Personal time off', 5, false, true, true),
    ('Maternity Leave', 'Maternity leave', 90, true, true, true),
    ('Paternity Leave', 'Paternity leave', 14, true, true, true),
    ('Emergency Leave', 'Emergency situations', 3, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- Note: The admin user profile will be created automatically when they sign up through the app
-- using the authAPI.signUp function which handles both auth.users and public.users creation