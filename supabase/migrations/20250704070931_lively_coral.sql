/*
  # Seed initial data

  1. Departments
    - Create default departments
  
  2. Leave Types
    - Create standard leave types with proper configurations
  
  3. Sample Users
    - Create admin, hrd, and user accounts for testing
*/

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Human Resources', 'Manages employee relations and policies'),
('Engineering', 'Software development and technical operations'),
('Marketing', 'Brand promotion and customer acquisition'),
('Sales', 'Revenue generation and client relations'),
('Finance', 'Financial planning and accounting'),
('Operations', 'Day-to-day business operations')
ON CONFLICT (name) DO NOTHING;

-- Insert default leave types
INSERT INTO leave_types (name, description, max_days_per_year, is_paid, requires_approval) VALUES
('Annual Leave', 'Yearly vacation leave', 21, true, true),
('Sick Leave', 'Medical leave for illness', 12, true, false),
('Personal Leave', 'Personal time off', 5, false, true),
('Maternity Leave', 'Leave for new mothers', 90, true, true),
('Paternity Leave', 'Leave for new fathers', 14, true, true),
('Emergency Leave', 'Urgent personal matters', 3, true, false)
ON CONFLICT (name) DO NOTHING;