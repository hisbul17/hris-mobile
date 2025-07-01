const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateAttendance, validatePagination } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// User routes
router.post('/check-in', validateAttendance, attendanceController.checkIn);
router.post('/check-out', validateAttendance, attendanceController.checkOut);
router.get('/my-attendance', validatePagination, attendanceController.getUserAttendance);
router.get('/today-status', attendanceController.getTodayStatus);
router.get('/summary', attendanceController.getAttendanceSummary);

// Admin/HRD routes
router.get('/all', authorizeRoles('admin', 'hrd'), validatePagination, attendanceController.getAllAttendance);

module.exports = router;