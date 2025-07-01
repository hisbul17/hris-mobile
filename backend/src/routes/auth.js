const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');
const { csrfProtection, provideCsrfToken } = require('../middleware/csrf');

// Public routes
router.post('/login', validateLogin, authController.login);
router.get('/csrf-token', csrfProtection, provideCsrfToken, authController.getCsrfToken);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.get('/profile', requireAuth, authController.getProfile);
router.put('/profile', requireAuth, csrfProtection, authController.updateProfile);
router.post('/change-password', requireAuth, csrfProtection, authController.changePassword);
router.get('/session', requireAuth, authController.checkSession);

module.exports = router;