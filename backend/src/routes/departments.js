const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateDepartment, validateId, validatePagination } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by all authenticated users
router.get('/', validatePagination, departmentController.getAllDepartments);
router.get('/:id', validateId, departmentController.getDepartmentById);
router.get('/:id/employees', validateId, validatePagination, departmentController.getDepartmentEmployees);

// Admin only routes
router.post('/', authorizeRoles('admin'), validateDepartment, departmentController.createDepartment);
router.put('/:id', authorizeRoles('admin'), validateId, validateDepartment, departmentController.updateDepartment);
router.delete('/:id', authorizeRoles('admin'), validateId, departmentController.deleteDepartment);

module.exports = router;