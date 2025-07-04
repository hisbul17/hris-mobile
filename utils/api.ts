import { supabase } from './supabase';
import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

// Auth API functions
export const authAPI = {
  signUp: async (email: string, password: string, userData: {
    employee_id: string;
    role: 'admin' | 'hrd' | 'user';
    first_name: string;
    last_name: string;
    phone?: string;
    position?: string;
    department_id?: number;
  }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: userData.role,
          employee_id: userData.employee_id,
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          ...userData,
        });

      if (profileError) throw profileError;
    }

    return authData;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments!users_department_id_fkey (
          id,
          name
        )
      `)
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  updateProfile: async (updates: Tables['users']['Update']) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  changePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },
};

// User API functions
export const userAPI = {
  getAllUsers: async (filters?: {
    search?: string;
    role?: string;
    department_id?: number;
    is_active?: boolean;
  }) => {
    let query = supabase
      .from('users')
      .select(`
        *,
        departments!users_department_id_fkey (
          id,
          name
        )
      `);

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`);
    }

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getUserById: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments!users_department_id_fkey (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    employee_id: string;
    role: 'admin' | 'hrd' | 'user';
    first_name: string;
    last_name: string;
    phone?: string;
    position?: string;
    department_id?: number;
    hire_date?: string;
  }) => {
    return authAPI.signUp(userData.email, userData.password, userData);
  },

  updateUser: async (id: string, updates: Tables['users']['Update']) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getUserStats: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('role, is_active, last_login');

    if (error) throw error;

    const stats = {
      total_users: data.length,
      admin_count: data.filter(u => u.role === 'admin').length,
      hrd_count: data.filter(u => u.role === 'hrd').length,
      user_count: data.filter(u => u.role === 'user').length,
      active_users: data.filter(u => u.is_active).length,
      inactive_users: data.filter(u => !u.is_active).length,
      active_last_30_days: data.filter(u => {
        if (!u.last_login) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(u.last_login) > thirtyDaysAgo;
      }).length,
    };

    return { overview: stats };
  },
};

// Department API functions
export const departmentAPI = {
  getAllDepartments: async (filters?: { is_active?: boolean }) => {
    let query = supabase
      .from('departments')
      .select(`
        *,
        manager:users (
          id,
          first_name,
          last_name
        )
      `);

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return { departments: data };
  },

  getDepartmentById: async (id: number) => {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        manager:users (
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  createDepartment: async (department: Tables['departments']['Insert']) => {
    const { data, error } = await supabase
      .from('departments')
      .insert(department)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateDepartment: async (id: number, updates: Tables['departments']['Update']) => {
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteDepartment: async (id: number) => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getDepartmentEmployees: async (id: number, filters?: { is_active?: boolean }) => {
    let query = supabase
      .from('users')
      .select('id, employee_id, first_name, last_name, email, position, hire_date, is_active')
      .eq('department_id', id);

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query.order('first_name');

    if (error) throw error;
    return { employees: data };
  },
};

// Attendance API functions
export const attendanceAPI = {
  checkIn: async (data: {
    check_in_location?: any;
    notes?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const today = new Date().toISOString().split('T')[0];

    const { data: result, error } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        date: today,
        check_in_time: new Date().toISOString(),
        check_in_location: data.check_in_location,
        notes: data.notes,
        status: 'present',
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  checkOut: async (data: {
    check_out_location?: any;
    notes?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const today = new Date().toISOString().split('T')[0];

    // Get today's attendance record
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (fetchError) throw fetchError;

    // Calculate working hours
    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.check_in_time!);
    const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    const { data: result, error } = await supabase
      .from('attendance')
      .update({
        check_out_time: checkOutTime.toISOString(),
        check_out_location: data.check_out_location,
        working_hours: Number(workingHours.toFixed(2)),
        notes: data.notes || attendance.notes,
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  getTodayStatus: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const today = new Date().toISOString().split('T')[0];

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;

    return {
      date: today,
      attendance,
      is_checked_in: attendance && attendance.check_in_time && !attendance.check_out_time,
      is_completed: attendance && attendance.check_in_time && attendance.check_out_time,
    };
  },

  getMyAttendance: async (filters?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id);

    if (filters?.start_date) {
      query = query.gte('date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('date', filters.end_date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return { attendance: data };
  },

  getSummary: async (filters?: { month?: number; year?: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const currentMonth = filters?.month || new Date().getMonth() + 1;
    const currentYear = filters?.year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .lt('date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

    if (error) throw error;

    const summary = {
      total_days: data.length,
      present_days: data.filter(a => a.status === 'present').length,
      absent_days: data.filter(a => a.status === 'absent').length,
      late_days: data.filter(a => a.status === 'late').length,
      sick_days: data.filter(a => a.status === 'sick').length,
      leave_days: data.filter(a => a.status === 'leave').length,
      total_working_hours: data.reduce((sum, a) => sum + (a.working_hours || 0), 0),
      average_working_hours: data.length > 0 ? data.reduce((sum, a) => sum + (a.working_hours || 0), 0) / data.length : 0,
      attendance_percentage: data.length > 0 ? (data.filter(a => a.status === 'present').length / data.length) * 100 : 0,
    };

    return {
      month: currentMonth,
      year: currentYear,
      summary,
    };
  },

  getAllAttendance: async (filters?: {
    start_date?: string;
    end_date?: string;
    user_id?: string;
    status?: string;
  }) => {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        users!attendance_user_id_fkey (
          first_name,
          last_name,
          employee_id,
          departments!users_department_id_fkey (
            name
          )
        )
      `);

    if (filters?.start_date) {
      query = query.gte('date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('date', filters.end_date);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return { attendance: data };
  },
};

// Leave API functions
export const leaveAPI = {
  getTypes: async () => {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  submitRequest: async (request: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason: string;
    emergency_contact_during_leave?: any;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // Calculate total days
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: user.id,
        ...request,
        total_days: totalDays,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getMyRequests: async (filters?: {
    status?: string;
    year?: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        leave_types (
          name,
          is_paid
        ),
        reviewer:users!leave_requests_reviewed_by_fkey (
          first_name,
          last_name
        )
      `)
      .eq('user_id', user.id);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.year) {
      query = query.gte('start_date', `${filters.year}-01-01`)
                   .lt('start_date', `${filters.year + 1}-01-01`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { leave_requests: data };
  },

  getMyBalance: async (filters?: { year?: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const currentYear = filters?.year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        leave_types (
          name,
          is_paid
        )
      `)
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .order('leave_type_id');

    if (error) throw error;
    return {
      year: currentYear,
      balances: data,
    };
  },

  cancelRequest: async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getAllRequests: async (filters?: {
    status?: string;
    user_id?: string;
    leave_type_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:users!leave_requests_user_id_fkey (
          first_name,
          last_name,
          employee_id,
          departments!users_department_id_fkey (
            name
          )
        ),
        leave_types (
          name,
          is_paid
        ),
        reviewer:users!leave_requests_reviewed_by_fkey (
          first_name,
          last_name
        )
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id);
    }

    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('end_date', filters.end_date);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { leave_requests: data };
  },

  reviewRequest: async (id: number, review: {
    status: 'approved' | 'rejected';
    review_notes?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        ...review,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;

    // If approved, update leave balance
    if (review.status === 'approved') {
      const { data: leaveRequest } = await supabase
        .from('leave_requests')
        .select('user_id, leave_type_id, total_days, start_date')
        .eq('id', id)
        .single();

      if (leaveRequest) {
        const year = new Date(leaveRequest.start_date).getFullYear();
        
        await supabase
          .from('leave_balances')
          .update({
            used_days: supabase.sql`used_days + ${leaveRequest.total_days}`,
            remaining_days: supabase.sql`remaining_days - ${leaveRequest.total_days}`,
          })
          .eq('user_id', leaveRequest.user_id)
          .eq('leave_type_id', leaveRequest.leave_type_id)
          .eq('year', year);
      }
    }

    return data;
  },
};