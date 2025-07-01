const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');
const { validateAttendance, validatePagination } = require('../middleware/validation');
const { csrfProtection } = require('../middleware/csrf');

// All routes require authentication
router.use(requireAuth);

// User routes
router.post('/check-in', csrfProtection, validateAttendance, attendanceController.checkIn);
router.post('/check-out', csrfProtection, validateAttendance, attendanceController.checkOut);
router.get('/my-attendance', validatePagination, attendanceController.getUserAttendance);
router.get('/today-status', attendanceController.getTodayStatus);
router.get('/summary', attendanceController.getAttendanceSummary);

// Admin/HRD routes
router.get('/all', authorizeRoles('admin', 'hrd'), validatePagination, attendanceController.getAllAttendance);

module.exports = router;