const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const logger = require('../utils/logger');

class AuthController {
  // User login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const userResult = await pool.query(
        `SELECT u.*, d.name as department_name 
         FROM users u 
         LEFT JOIN departments d ON u.department_id = d.id 
         WHERE u.email = $1 AND u.is_active = true`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = userResult.rows[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      delete user.password_hash;

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userResult = await pool.query(
        `SELECT u.*, d.name as department_name 
         FROM users u 
         LEFT JOIN departments d ON u.department_id = d.id 
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];
      delete user.password_hash;

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { first_name, last_name, phone, address, emergency_contact_name, emergency_contact_phone } = req.body;
      
      const updateResult = await pool.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone = COALESCE($3, phone),
             address = COALESCE($4, address),
             emergency_contact_name = COALESCE($5, emergency_contact_name),
             emergency_contact_phone = COALESCE($6, emergency_contact_phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [first_name, last_name, phone, address, emergency_contact_name, emergency_contact_phone, req.user.id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = updateResult.rows[0];
      delete user.password_hash;

      logger.info(`Profile updated for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      // Get current user
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedNewPassword, req.user.id]
      );

      logger.info(`Password changed for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      // Generate new token
      const token = jwt.sign(
        { 
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();