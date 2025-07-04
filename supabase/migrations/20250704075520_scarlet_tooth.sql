/*
  # Fix RLS Policy Infinite Recursion

  1. Problem Analysis
    - The error "infinite recursion detected in policy for relation 'users'" occurs when RLS policies create circular dependencies
    - This typically happens when policies on tables that reference 'users' try to check user roles by querying back to the 'users' table
    - The current policies are causing recursive lookups that Supabase cannot resolve

  2. Solution
    - Simplify RLS policies to avoid circular dependencies
    - Use direct auth.uid() checks instead of complex subqueries
    - Remove or simplify policies that cause recursive lookups on the users table
    - Ensure policies are straightforward and don't trigger infinite loops

  3. Changes
    - Drop and recreate problematic policies with simpler logic
    - Use auth.uid() directly for user identification
    - Avoid complex joins back to users table in policy conditions
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Users can view departments" ON departments;
DROP POLICY IF EXISTS "Admins and HRD can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins and HRD can manage all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins and HRD can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view their own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage leave types" ON leave_types;
DROP POLICY IF EXISTS "Users can view active leave types" ON leave_types;
DROP POLICY IF EXISTS "Admins and HRD can manage all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins and HRD can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can create their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can update their own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins and HRD can view all leave balances" ON leave_balances;
DROP POLICY IF EXISTS "Admins can manage all leave balances" ON leave_balances;
DROP POLICY IF EXISTS "Users can view their own leave balances" ON leave_balances;

-- Create simplified policies for users table
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create a function to check if current user is admin or hrd
-- This avoids recursive queries in policies
CREATE OR REPLACE FUNCTION auth.is_admin_or_hrd()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'hrd')
  );
$$;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Simplified policies for departments
CREATE POLICY "Users can view departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- Simplified policies for attendance
CREATE POLICY "Users can view their own attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own attendance"
  ON attendance
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and HRD can view all attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_hrd());

CREATE POLICY "Admins and HRD can manage all attendance"
  ON attendance
  FOR ALL
  TO authenticated
  USING (auth.is_admin_or_hrd());

-- Simplified policies for leave_types
CREATE POLICY "Users can view active leave types"
  ON leave_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage leave types"
  ON leave_types
  FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- Simplified policies for leave_requests
CREATE POLICY "Users can view their own leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins and HRD can view all leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_hrd());

CREATE POLICY "Admins and HRD can manage all leave requests"
  ON leave_requests
  FOR ALL
  TO authenticated
  USING (auth.is_admin_or_hrd());

-- Simplified policies for leave_balances
CREATE POLICY "Users can view their own leave balances"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all leave balances"
  ON leave_balances
  FOR ALL
  TO authenticated
  USING (auth.is_admin());

CREATE POLICY "Admins and HRD can view all leave balances"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_hrd());

-- Add policies for users table that allow admins and HRD to view/manage other users
CREATE POLICY "Admins and HRD can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_hrd());

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.is_admin());