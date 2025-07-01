const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class UserController {
  // Get all users (Admin/HRD only)
  async getAllUsers(req, res) {
    try {
      const { search, role, department_id, is_active, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT u.*, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE 1=1
      `;
      let queryParams = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.employee_id ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      if (role) {
        paramCount++;
        query += ` AND u.role = $${paramCount}`;
        queryParams.push(role);
      }

      if (department_id) {
        paramCount++;
        query += ` AND u.department_id = $${paramCount}`;
        queryParams.push(department_id);
      }

      if (is_active !== undefined) {
        paramCount++;
        query += ` AND u.is_active = $${paramCount}`;
        queryParams.push(is_active === 'true');
      }

      query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM users u
        WHERE 1=1
      `;
      let countParams = [];
      let countParamCount = 0;

      if (search) {
        countParamCount++;
        countQuery += ` AND (u.first_name ILIKE $${countParamCount} OR u.last_name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount} OR u.employee_id ILIKE $${countParamCount})`;
        countParams.push(`%${search}%`);
      }

      if (role) {
        countParamCount++;
        countQuery += ` AND u.role = $${countParamCount}`;
        countParams.push(role);
      }

      if (department_id) {
        countParamCount++;
        countQuery += ` AND u.department_id = $${countParamCount}`;
        countParams.push(department_id);
      }

      if (is_active !== undefined) {
        countParamCount++;
        countQuery += ` AND u.is_active = $${countParamCount}`;
        countParams.push(is_active === 'true');
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count);

      // Remove password_hash from results
      const users = result.rows.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalRecords / limit),
            total_records: totalRecords,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT u.*, d.name as department_name
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { password_hash, ...user } = result.rows[0];

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new user (Admin only)
  async createUser(req, res) {
    try {
      const {
        employee_id,
        email,
        password,
        role,
        first_name,
        last_name,
        phone,
        nik,
        position,
        department_id,
        hire_date,
        birth_date,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        must_change_password = true
      } = req.body;

      // Check if employee_id or email already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE employee_id = $1 OR email = $2',
        [employee_id, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID or email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (
          employee_id, email, password_hash, role, first_name, last_name,
          phone, nik, position, department_id, hire_date, birth_date,
          address, emergency_contact_name, emergency_contact_phone, must_change_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          employee_id, email, hashedPassword, role, first_name, last_name,
          phone, nik, position, department_id, hire_date, birth_date,
          address, emergency_contact_name, emergency_contact_phone, must_change_password
        ]
      );

      const { password_hash, ...newUser } = result.rows[0];

      // Create leave balances for the new user
      if (role === 'user') {
        const currentYear = new Date().getFullYear();
        const leaveTypesResult = await pool.query('SELECT id, max_days_per_year FROM leave_types WHERE is_active = true');
        
        for (const leaveType of leaveTypesResult.rows) {
          await pool.query(
            `INSERT INTO leave_balances (user_id, leave_type_id, year, allocated_days, remaining_days)
             VALUES ($1, $2, $3, $4, $4)`,
            [newUser.id, leaveType.id, currentYear, leaveType.max_days_per_year]
          );
        }
      }

      logger.info(`User created: ${newUser.email} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user (Admin only)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        employee_id,
        email,
        role,
        first_name,
        last_name,
        phone,
        nik,
        position,
        department_id,
        hire_date,
        birth_date,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        is_active
      } = req.body;

      // Check if user exists
      const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      if (userExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if employee_id or email already exists for other users
      if (employee_id || email) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE (employee_id = $1 OR email = $2) AND id != $3',
          [employee_id, email, id]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID or email already exists'
          });
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      const fieldsToUpdate = {
        employee_id,
        email,
        role,
        first_name,
        last_name,
        phone,
        nik,
        position,
        department_id,
        hire_date,
        birth_date,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        is_active
      };

      Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(value);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await pool.query(query, updateValues);
      const { password_hash, ...updatedUser } = result.rows[0];

      logger.info(`User updated: ${updatedUser.email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user (Admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deleting the current user
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      // Delete user (cascade will handle related records)
      await pool.query('DELETE FROM users WHERE id = $1', [id]);

      logger.info(`User deleted: ${userResult.rows[0].email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Reset user password (Admin only)
  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      // Check if user exists
      const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password and set must_change_password flag
      await pool.query(
        'UPDATE users SET password_hash = $1, must_change_password = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, id]
      );

      logger.info(`Password reset for user: ${userResult.rows[0].email} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user statistics (Admin/HRD only)
  async getUserStats(req, res) {
    try {
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'hrd' THEN 1 END) as hrd_count,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
          COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_30_days
        FROM users
      `);

      const departmentStatsResult = await pool.query(`
        SELECT 
          d.name as department_name,
          COUNT(u.id) as user_count
        FROM departments d
        LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
        GROUP BY d.id, d.name
        ORDER BY user_count DESC
      `);

      res.json({
        success: true,
        data: {
          overview: statsResult.rows[0],
          departments: departmentStatsResult.rows
        }
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();