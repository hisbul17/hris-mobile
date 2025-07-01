let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => {
  return authToken;
};

export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  data: any = null
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error: any) {
    console.error('API Request Error:', error);
    throw error;
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
    apiRequest(`/leave/cancel/${id}`, 'PUT')
};

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', 'POST', { email, password }),
  
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
  
  refreshToken: () =>
    apiRequest('/auth/refresh-token', 'POST')
};