const pool = require('../config/database');
const logger = require('../utils/logger');

class DepartmentController {
  // Get all departments
  async getAllDepartments(req, res) {
    try {
      const { is_active, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT d.*, 
               m.first_name as manager_first_name, 
               m.last_name as manager_last_name,
               COUNT(u.id) as employee_count
        FROM departments d
        LEFT JOIN users m ON d.manager_id = m.id
        LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
        WHERE 1=1
      `;
      let queryParams = [];
      let paramCount = 0;

      if (is_active !== undefined) {
        paramCount++;
        query += ` AND d.is_active = $${paramCount}`;
        queryParams.push(is_active === 'true');
      }

      query += ` GROUP BY d.id, m.first_name, m.last_name ORDER BY d.name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM departments WHERE 1=1';
      let countParams = [];
      let countParamCount = 0;

      if (is_active !== undefined) {
        countParamCount++;
        countQuery += ` AND is_active = $${countParamCount}`;
        countParams.push(is_active === 'true');
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          departments: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalRecords / limit),
            total_records: totalRecords,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get all departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get department by ID
  async getDepartmentById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT d.*, 
                m.first_name as manager_first_name, 
                m.last_name as manager_last_name,
                COUNT(u.id) as employee_count
         FROM departments d
         LEFT JOIN users m ON d.manager_id = m.id
         LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
         WHERE d.id = $1
         GROUP BY d.id, m.first_name, m.last_name`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Get department by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new department (Admin only)
  async createDepartment(req, res) {
    try {
      const { name, description, manager_id } = req.body;

      // Check if department name already exists
      const existingDept = await pool.query(
        'SELECT id FROM departments WHERE name = $1',
        [name]
      );

      if (existingDept.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Department name already exists'
        });
      }

      // Verify manager exists if provided
      if (manager_id) {
        const managerExists = await pool.query(
          'SELECT id FROM users WHERE id = $1 AND is_active = true',
          [manager_id]
        );

        if (managerExists.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Manager not found or inactive'
          });
        }
      }

      // Create department
      const result = await pool.query(
        'INSERT INTO departments (name, description, manager_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description, manager_id]
      );

      logger.info(`Department created: ${name} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Create department error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update department (Admin only)
  async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const { name, description, manager_id, is_active } = req.body;

      // Check if department exists
      const deptExists = await pool.query('SELECT id FROM departments WHERE id = $1', [id]);
      if (deptExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      // Check if name already exists for other departments
      if (name) {
        const existingDept = await pool.query(
          'SELECT id FROM departments WHERE name = $1 AND id != $2',
          [name, id]
        );

        if (existingDept.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Department name already exists'
          });
        }
      }

      // Verify manager exists if provided
      if (manager_id) {
        const managerExists = await pool.query(
          'SELECT id FROM users WHERE id = $1 AND is_active = true',
          [manager_id]
        );

        if (managerExists.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Manager not found or inactive'
          });
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      const fieldsToUpdate = { name, description, manager_id, is_active };

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
        UPDATE departments 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await pool.query(query, updateValues);

      logger.info(`Department updated: ${result.rows[0].name} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Update department error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete department (Admin only)
  async deleteDepartment(req, res) {
    try {
      const { id } = req.params;

      // Check if department exists
      const deptResult = await pool.query('SELECT name FROM departments WHERE id = $1', [id]);
      if (deptResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      // Check if department has active employees
      const employeeCount = await pool.query(
        'SELECT COUNT(*) FROM users WHERE department_id = $1 AND is_active = true',
        [id]
      );

      if (parseInt(employeeCount.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department with active employees'
        });
      }

      // Delete department
      await pool.query('DELETE FROM departments WHERE id = $1', [id]);

      logger.info(`Department deleted: ${deptResult.rows[0].name} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      logger.error('Delete department error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get department employees
  async getDepartmentEmployees(req, res) {
    try {
      const { id } = req.params;
      const { is_active, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, 
               u.position, u.hire_date, u.is_active
        FROM users u
        WHERE u.department_id = $1
      `;
      let queryParams = [id];
      let paramCount = 1;

      if (is_active !== undefined) {
        paramCount++;
        query += ` AND u.is_active = $${paramCount}`;
        queryParams.push(is_active === 'true');
      }

      query += ` ORDER BY u.first_name, u.last_name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM users WHERE department_id = $1';
      let countParams = [id];
      let countParamCount = 1;

      if (is_active !== undefined) {
        countParamCount++;
        countQuery += ` AND is_active = $${countParamCount}`;
        countParams.push(is_active === 'true');
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          employees: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalRecords / limit),
            total_records: totalRecords,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get department employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new DepartmentController();