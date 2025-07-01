const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const attendanceRoutes = require('./attendance');
const leaveRoutes = require('./leave');

// API routes
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);

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