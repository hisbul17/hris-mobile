const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateUserRegistration, validateUserUpdate, validateId, validatePagination } = require('../middleware/validation');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Admin/HRD routes
router.get('/', authorizeRoles('admin', 'hrd'), validatePagination, userController.getAllUsers);
router.get('/stats', authorizeRoles('admin', 'hrd'), userController.getUserStats);
router.get('/:id', authorizeRoles('admin', 'hrd'), validateId, userController.getUserById);

// Admin only routes
router.post('/', authorizeRoles('admin'), validateUserRegistration, userController.createUser);
router.put('/:id', authorizeRoles('admin'), validateId, validateUserUpdate, userController.updateUser);
router.delete('/:id', authorizeRoles('admin'), validateId, userController.deleteUser);

// Password reset route
router.post('/:id/reset-password', 
  authorizeRoles('admin'), 
  validateId,
  [
    body('new_password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  userController.resetPassword
);

module.exports = router;