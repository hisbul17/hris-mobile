const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');
const { validateDepartment, validateId, validatePagination } = require('../middleware/validation');
const { csrfProtection } = require('../middleware/csrf');

// All routes require authentication
router.use(requireAuth);

// Routes accessible by all authenticated users
router.get('/', validatePagination, departmentController.getAllDepartments);
router.get('/:id', validateId, departmentController.getDepartmentById);
router.get('/:id/employees', validateId, validatePagination, departmentController.getDepartmentEmployees);

// Admin only routes
router.post('/', authorizeRoles('admin'), csrfProtection, validateDepartment, departmentController.createDepartment);
router.put('/:id', authorizeRoles('admin'), csrfProtection, validateId, validateDepartment, departmentController.updateDepartment);
router.delete('/:id', authorizeRoles('admin'), csrfProtection, validateId, departmentController.deleteDepartment);

module.exports = router;