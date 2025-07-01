const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateLeaveRequest, validateId, validatePagination } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Public routes (all authenticated users)
router.get('/types', leaveController.getLeaveTypes);

// User routes
router.post('/request', validateLeaveRequest, leaveController.submitLeaveRequest);
router.get('/my-requests', validatePagination, leaveController.getUserLeaveRequests);
router.get('/my-balance', leaveController.getUserLeaveBalance);
router.put('/cancel/:id', validateId, leaveController.cancelLeaveRequest);

// Admin/HRD routes
router.get('/all', authorizeRoles('admin', 'hrd'), validatePagination, leaveController.getAllLeaveRequests);
router.put('/review/:id', authorizeRoles('admin', 'hrd'), validateId, leaveController.reviewLeaveRequest);

module.exports = router;