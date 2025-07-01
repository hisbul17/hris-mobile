const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const attendanceRoutes = require('./attendance');
const leaveRoutes = require('./leave');
const userRoutes = require('./users');
const departmentRoutes = require('./departments');

// API routes
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HRIS API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to HRIS API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'POST /api/auth/change-password',
        refreshToken: 'POST /api/auth/refresh-token'
      },
      users: {
        getAllUsers: 'GET /api/users (Admin/HRD only)',
        getUserById: 'GET /api/users/:id (Admin/HRD only)',
        createUser: 'POST /api/users (Admin only)',
        updateUser: 'PUT /api/users/:id (Admin only)',
        deleteUser: 'DELETE /api/users/:id (Admin only)',
        resetPassword: 'POST /api/users/:id/reset-password (Admin only)',
        getUserStats: 'GET /api/users/stats (Admin/HRD only)'
      },
      departments: {
        getAllDepartments: 'GET /api/departments',
        getDepartmentById: 'GET /api/departments/:id',
        createDepartment: 'POST /api/departments (Admin only)',
        updateDepartment: 'PUT /api/departments/:id (Admin only)',
        deleteDepartment: 'DELETE /api/departments/:id (Admin only)',
        getDepartmentEmployees: 'GET /api/departments/:id/employees'
      },
      attendance: {
        checkIn: 'POST /api/attendance/check-in',
        checkOut: 'POST /api/attendance/check-out',
        myAttendance: 'GET /api/attendance/my-attendance',
        todayStatus: 'GET /api/attendance/today-status',
        summary: 'GET /api/attendance/summary',
        allAttendance: 'GET /api/attendance/all (Admin/HRD only)'
      },
      leave: {
        types: 'GET /api/leave/types',
        submitRequest: 'POST /api/leave/request',
        myRequests: 'GET /api/leave/my-requests',
        myBalance: 'GET /api/leave/my-balance',
        cancelRequest: 'PUT /api/leave/cancel/:id',
        allRequests: 'GET /api/leave/all (Admin/HRD only)',
        reviewRequest: 'PUT /api/leave/review/:id (Admin/HRD only)'
      }
    }
  });
});

module.exports = router;