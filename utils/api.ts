import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'session_data';

let sessionData: any = null;

export const setSessionData = async (data: any) => {
  sessionData = data;
  if (data) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
};

export const getSessionData = async (): Promise<any> => {
  if (sessionData) {
    return sessionData;
  }
  
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    sessionData = data ? JSON.parse(data) : null;
    return sessionData;
  } catch (error) {
    console.error('Error getting session data:', error);
    return null;
  }
};

export const clearSession = async () => {
  sessionData = null;
  await AsyncStorage.removeItem(SESSION_KEY);
};

export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  data: any = null,
  includeCredentials: boolean = true
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: includeCredentials ? 'include' : 'omit', // Include cookies for session
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      // Handle session expiry
      if (response.status === 401) {
        await clearSession();
      }
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error: any) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// User API functions
export const userAPI = {
  getAllUsers: (params?: { search?: string; role?: string; department_id?: string; is_active?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/users${queryString}`);
  },
  
  getUserById: (id: number) =>
    apiRequest(`/users/${id}`),
  
  createUser: (data: {
    employee_id: string;
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone?: string;
    position?: string;
    department_id?: string;
    hire_date?: string;
  }) =>
    apiRequest('/users', 'POST', data),
  
  updateUser: (id: number, data: {
    employee_id?: string;
    email?: string;
    role?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    position?: string;
    department_id?: string;
    hire_date?: string;
    is_active?: boolean;
  }) =>
    apiRequest(`/users/${id}`, 'PUT', data),
  
  deleteUser: (id: number) =>
    apiRequest(`/users/${id}`, 'DELETE'),
  
  resetPassword: (id: number, new_password: string) =>
    apiRequest(`/users/${id}/reset-password`, 'POST', { new_password }),
  
  getUserStats: () =>
    apiRequest('/users/stats')
};

// Department API functions
export const departmentAPI = {
  getAllDepartments: (params?: { is_active?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/departments${queryString}`);
  },
  
  getDepartmentById: (id: number) =>
    apiRequest(`/departments/${id}`),
  
  createDepartment: (data: {
    name: string;
    description?: string;
    manager_id?: number;
  }) =>
    apiRequest('/departments', 'POST', data),
  
  updateDepartment: (id: number, data: {
    name?: string;
    description?: string;
    manager_id?: number;
    is_active?: boolean;
  }) =>
    apiRequest(`/departments/${id}`, 'PUT', data),
  
  deleteDepartment: (id: number) =>
    apiRequest(`/departments/${id}`, 'DELETE'),
  
  getDepartmentEmployees: (id: number, params?: { is_active?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/departments/${id}/employees${queryString}`);
  }
};

// Attendance API functions
export const attendanceAPI = {
  checkIn: (data: { check_in_location?: any; notes?: string }) =>
    apiRequest('/attendance/check-in', 'POST', data),
  
  checkOut: (data: { check_out_location?: any; notes?: string }) =>
    apiRequest('/attendance/check-out', 'POST', data),
  
  getTodayStatus: () =>
    apiRequest('/attendance/today-status'),
  
  getMyAttendance: (params?: { start_date?: string; end_date?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/attendance/my-attendance${queryString}`);
  },
  
  getSummary: (params?: { month?: number; year?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/attendance/summary${queryString}`);
  },
  
  getAllAttendance: (params?: { start_date?: string; end_date?: string; user_id?: number; status?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/attendance/all${queryString}`);
  }
};

// Leave API functions
export const leaveAPI = {
  getTypes: () =>
    apiRequest('/leave/types'),
  
  submitRequest: (data: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason: string;
    emergency_contact_during_leave?: any;
  }) =>
    apiRequest('/leave/request', 'POST', data),
  
  getMyRequests: (params?: { status?: string; year?: number; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/leave/my-requests${queryString}`);
  },
  
  getMyBalance: (params?: { year?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/leave/my-balance${queryString}`);
  },
  
  cancelRequest: (id: number) =>
    apiRequest(`/leave/cancel/${id}`, 'PUT'),
  
  getAllRequests: (params?: { status?: string; user_id?: number; leave_type_id?: number; start_date?: string; end_date?: string; page?: number; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/leave/all${queryString}`);
  },
  
  reviewRequest: (id: number, data: { status: 'approved' | 'rejected'; review_notes?: string }) =>
    apiRequest(`/leave/review/${id}`, 'PUT', data)
};

// Auth API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', 'POST', { email, password });
    if (response.success) {
      await setSessionData(response.data);
    }
    return response;
  },
  
  logout: async () => {
    try {
      await apiRequest('/auth/logout', 'POST');
    } finally {
      await clearSession();
    }
  },
  
  getProfile: () =>
    apiRequest('/auth/profile'),
  
  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) =>
    apiRequest('/auth/profile', 'PUT', data),
  
  changePassword: (data: {
    current_password: string;
    new_password: string;
  }) =>
    apiRequest('/auth/change-password', 'POST', data),
  
  checkSession: () =>
    apiRequest('/auth/session'),
  
  getCsrfToken: () =>
    apiRequest('/auth/csrf-token', 'GET', null, false)
};