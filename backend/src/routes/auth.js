const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

// Public routes
router.post('/login', validateLogin, authController.login);

// Protected routes
router.use(authenticateToken);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;