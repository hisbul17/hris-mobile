import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          manager_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
        };
      };
      users: {
        Row: {
          id: string;
          employee_id: string;
          email: string;
          role: 'admin' | 'hrd' | 'user';
          first_name: string;
          last_name: string;
          phone: string | null;
          nik: string | null;
          position: string | null;
          department_id: number | null;
          hire_date: string | null;
          birth_date: string | null;
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          profile_picture: string | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id: string;
          email: string;
          role: 'admin' | 'hrd' | 'user';
          first_name: string;
          last_name: string;
          phone?: string | null;
          nik?: string | null;
          position?: string | null;
          department_id?: number | null;
          hire_date?: string | null;
          birth_date?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          profile_picture?: string | null;
          is_active?: boolean;
        };
        Update: {
          employee_id?: string;
          email?: string;
          role?: 'admin' | 'hrd' | 'user';
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          nik?: string | null;
          position?: string | null;
          department_id?: number | null;
          hire_date?: string | null;
          birth_date?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          profile_picture?: string | null;
          is_active?: boolean;
          last_login?: string | null;
        };
      };
      attendance: {
        Row: {
          id: number;
          user_id: string;
          date: string;
          check_in_time: string | null;
          check_out_time: string | null;
          check_in_photo: string | null;
          check_out_photo: string | null;
          check_in_location: any | null;
          check_out_location: any | null;
          working_hours: number;
          overtime_hours: number;
          status: 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'leave';
          notes: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          check_in_photo?: string | null;
          check_out_photo?: string | null;
          check_in_location?: any | null;
          check_out_location?: any | null;
          working_hours?: number;
          overtime_hours?: number;
          status?: 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'leave';
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update: {
          check_in_time?: string | null;
          check_out_time?: string | null;
          check_in_photo?: string | null;
          check_out_photo?: string | null;
          check_in_location?: any | null;
          check_out_location?: any | null;
          working_hours?: number;
          overtime_hours?: number;
          status?: 'present' | 'absent' | 'late' | 'half_day' | 'sick' | 'leave';
          notes?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
        };
      };
      leave_types: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          max_days_per_year: number;
          is_paid: boolean;
          requires_approval: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          max_days_per_year?: number;
          is_paid?: boolean;
          requires_approval?: boolean;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          max_days_per_year?: number;
          is_paid?: boolean;
          requires_approval?: boolean;
          is_active?: boolean;
        };
      };
      leave_requests: {
        Row: {
          id: number;
          user_id: string;
          leave_type_id: number;
          start_date: string;
          end_date: string;
          total_days: number;
          reason: string;
          status: 'pending' | 'approved' | 'rejected' | 'cancelled';
          applied_date: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          attachment: string | null;
          emergency_contact_during_leave: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          leave_type_id: number;
          start_date: string;
          end_date: string;
          total_days: number;
          reason: string;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          applied_date?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          attachment?: string | null;
          emergency_contact_during_leave?: any | null;
        };
        Update: {
          leave_type_id?: number;
          start_date?: string;
          end_date?: string;
          total_days?: number;
          reason?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          attachment?: string | null;
          emergency_contact_during_leave?: any | null;
        };
      };
      leave_balances: {
        Row: {
          id: number;
          user_id: string;
          leave_type_id: number;
          year: number;
          allocated_days: number;
          used_days: number;
          remaining_days: number;
          carried_forward: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          leave_type_id: number;
          year: number;
          allocated_days?: number;
          used_days?: number;
          remaining_days?: number;
          carried_forward?: number;
        };
        Update: {
          allocated_days?: number;
          used_days?: number;
          remaining_days?: number;
          carried_forward?: number;
        };
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          is_read: boolean;
          related_table: string | null;
          related_id: string | null;
          action_url: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          user_id: string;
          title: string;
          message: string;
          type?: 'info' | 'success' | 'warning' | 'error';
          is_read?: boolean;
          related_table?: string | null;
          related_id?: string | null;
          action_url?: string | null;
        };
        Update: {
          title?: string;
          message?: string;
          type?: 'info' | 'success' | 'warning' | 'error';
          is_read?: boolean;
          related_table?: string | null;
          related_id?: string | null;
          action_url?: string | null;
          read_at?: string | null;
        };
      };
    };
  };
}