const pool = require('../config/database');
const logger = require('../utils/logger');
const moment = require('moment');

class LeaveController {
  // Submit leave request
  async submitLeaveRequest(req, res) {
    try {
      const { leave_type_id, start_date, end_date, reason, emergency_contact_during_leave } = req.body;
      const userId = req.user.id;

      // Calculate total days
      const startDate = moment(start_date);
      const endDate = moment(end_date);
      const totalDays = endDate.diff(startDate, 'days') + 1;

      // Check if user has sufficient leave balance
      const currentYear = moment().year();
      const balanceResult = await pool.query(
        'SELECT remaining_days FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3',
        [userId, leave_type_id, currentYear]
      );

      if (balanceResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Leave balance not found for this leave type'
        });
      }

      const remainingDays = parseFloat(balanceResult.rows[0].remaining_days);
      if (totalDays > remainingDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. Available: ${remainingDays} days, Requested: ${totalDays} days`
        });
      }

      // Check for overlapping leave requests
      const overlapResult = await pool.query(
        `SELECT * FROM leave_requests 
         WHERE user_id = $1 
           AND status IN ('pending', 'approved')
           AND (
             (start_date <= $2 AND end_date >= $2) OR
             (start_date <= $3 AND end_date >= $3) OR
             (start_date >= $2 AND end_date <= $3)
           )`,
        [userId, start_date, end_date]
      );

      if (overlapResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have overlapping leave requests for the selected dates'
        });
      }

      // Create leave request
      const result = await pool.query(
        `INSERT INTO leave_requests (
           user_id, leave_type_id, start_date, end_date, total_days, reason, emergency_contact_during_leave
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          leave_type_id,
          start_date,
          end_date,
          totalDays,
          reason,
          emergency_contact_during_leave ? JSON.stringify(emergency_contact_during_leave) : null
        ]
      );

      logger.info(`Leave request submitted by user ${req.user.email} for ${totalDays} days`);

      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Submit leave request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user's leave requests
  async getUserLeaveRequests(req, res) {
    try {
      const userId = req.user.id;
      const { status, year, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT lr.*, lt.name as leave_type_name, lt.is_paid,
               r.first_name as reviewer_first_name, r.last_name as reviewer_last_name
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        LEFT JOIN users r ON lr.reviewed_by = r.id
        WHERE lr.user_id = $1
      `;
      let queryParams = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND lr.status = $${paramCount}`;
        queryParams.push(status);
      }

      if (year) {
        paramCount++;
        query += ` AND EXTRACT(YEAR FROM lr.start_date) = $${paramCount}`;
        queryParams.push(year);
      }

      query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM leave_requests WHERE user_id = $1';
      let countParams = [userId];
      let countParamCount = 1;

      if (status) {
        countParamCount++;
        countQuery += ` AND status = $${countParamCount}`;
        countParams.push(status);
      }

      if (year) {
        countParamCount++;
        countQuery += ` AND EXTRACT(YEAR FROM start_date) = $${countParamCount}`;
        countParams.push(year);
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          leave_requests: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalRecords / limit),
            total_records: totalRecords,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get user leave requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user's leave balance
  async getUserLeaveBalance(req, res) {
    try {
      const userId = req.user.id;
      const { year } = req.query;
      const currentYear = year || moment().year();

      const result = await pool.query(
        `SELECT lb.*, lt.name as leave_type_name, lt.is_paid
         FROM leave_balances lb
         JOIN leave_types lt ON lb.leave_type_id = lt.id
         WHERE lb.user_id = $1 AND lb.year = $2
         ORDER BY lt.name`,
        [userId, currentYear]
      );

      res.json({
        success: true,
        data: {
          year: currentYear,
          balances: result.rows
        }
      });
    } catch (error) {
      logger.error('Get user leave balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Cancel leave request
  async cancelLeaveRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if leave request exists and belongs to user
      const leaveResult = await pool.query(
        'SELECT * FROM leave_requests WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (leaveResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        });
      }

      const leaveRequest = leaveResult.rows[0];

      if (leaveRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending leave requests can be cancelled'
        });
      }

      // Update status to cancelled
      const result = await pool.query(
        'UPDATE leave_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['cancelled', id]
      );

      logger.info(`Leave request ${id} cancelled by user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Leave request cancelled successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Cancel leave request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Admin/HRD: Get all leave requests
  async getAllLeaveRequests(req, res) {
    try {
      const { status, user_id, leave_type_id, start_date, end_date, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT lr.*, 
               u.first_name, u.last_name, u.employee_id, d.name as department_name,
               lt.name as leave_type_name, lt.is_paid,
               r.first_name as reviewer_first_name, r.last_name as reviewer_last_name
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN users r ON lr.reviewed_by = r.id
        WHERE 1=1
      `;
      let queryParams = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND lr.status = $${paramCount}`;
        queryParams.push(status);
      }

      if (user_id) {
        paramCount++;
        query += ` AND lr.user_id = $${paramCount}`;
        queryParams.push(user_id);
      }

      if (leave_type_id) {
        paramCount++;
        query += ` AND lr.leave_type_id = $${paramCount}`;
        queryParams.push(leave_type_id);
      }

      if (start_date) {
        paramCount++;
        query += ` AND lr.start_date >= $${paramCount}`;
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND lr.end_date <= $${paramCount}`;
        queryParams.push(end_date);
      }

      query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count (similar filtering logic)
      let countQuery = `
        SELECT COUNT(*) 
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE 1=1
      `;
      let countParams = [];
      let countParamCount = 0;

      if (status) {
        countParamCount++;
        countQuery += ` AND lr.status = $${countParamCount}`;
        countParams.push(status);
      }

      if (user_id) {
        countParamCount++;
        countQuery += ` AND lr.user_id = $${countParamCount}`;
        countParams.push(user_id);
      }

      if (leave_type_id) {
        countParamCount++;
        countQuery += ` AND lr.leave_type_id = $${countParamCount}`;
        countParams.push(leave_type_id);
      }

      if (start_date) {
        countParamCount++;
        countQuery += ` AND lr.start_date >= $${countParamCount}`;
        countParams.push(start_date);
      }

      if (end_date) {
        countParamCount++;
        countQuery += ` AND lr.end_date <= $${countParamCount}`;
        countParams.push(end_date);
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          leave_requests: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalRecords / limit),
            total_records: totalRecords,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get all leave requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Admin/HRD: Review leave request
  async reviewLeaveRequest(req, res) {
    try {
      const { id } = req.params;
      const { status, review_notes } = req.body;
      const reviewerId = req.user.id;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either approved or rejected'
        });
      }

      // Get leave request details
      const leaveResult = await pool.query(
        'SELECT * FROM leave_requests WHERE id = $1',
        [id]
      );

      if (leaveResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        });
      }

      const leaveRequest = leaveResult.rows[0];

      if (leaveRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending leave requests can be reviewed'
        });
      }

      // Start transaction
      await pool.query('BEGIN');

      try {
        // Update leave request
        const updateResult = await pool.query(
          `UPDATE leave_requests 
           SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, review_notes = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`,
          [status, reviewerId, review_notes, id]
        );

        // If approved, update leave balance
        if (status === 'approved') {
          const currentYear = moment(leaveRequest.start_date).year();
          
          await pool.query(
            `UPDATE leave_balances 
             SET used_days = used_days + $1,
                 remaining_days = remaining_days - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND leave_type_id = $3 AND year = $4`,
            [leaveRequest.total_days, leaveRequest.user_id, leaveRequest.leave_type_id, currentYear]
          );
        }

        // Commit transaction
        await pool.query('COMMIT');

        logger.info(`Leave request ${id} ${status} by ${req.user.email}`);

        res.json({
          success: true,
          message: `Leave request ${status} successfully`,
          data: updateResult.rows[0]
        });
      } catch (error) {
        // Rollback transaction
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error('Review leave request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get leave types
  async getLeaveTypes(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM leave_types WHERE is_active = true ORDER BY name'
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Get leave types error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new LeaveController();