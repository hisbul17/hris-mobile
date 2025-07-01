const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');
const { validateUserRegistration, validateUserUpdate, validateId, validatePagination } = require('../middleware/validation');
const { csrfProtection } = require('../middleware/csrf');
const { body } = require('express-validator');

// All routes require authentication
router.use(requireAuth);

// Admin/HRD routes
router.get('/', authorizeRoles('admin', 'hrd'), validatePagination, userController.getAllUsers);
router.get('/stats', authorizeRoles('admin', 'hrd'), userController.getUserStats);
router.get('/:id', authorizeRoles('admin', 'hrd'), validateId, userController.getUserById);

// Admin only routes
router.post('/', authorizeRoles('admin'), csrfProtection, validateUserRegistration, userController.createUser);
router.put('/:id', authorizeRoles('admin'), csrfProtection, validateId, validateUserUpdate, userController.updateUser);
router.delete('/:id', authorizeRoles('admin'), csrfProtection, validateId, userController.deleteUser);

// Password reset route
router.post('/:id/reset-password', 
  authorizeRoles('admin'), 
  csrfProtection,
  validateId,
  [
    body('new_password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  userController.resetPassword
);

module.exports = router;