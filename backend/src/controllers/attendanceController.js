const pool = require('../config/database');
const logger = require('../utils/logger');
const moment = require('moment');

class AttendanceController {
  // Check in
  async checkIn(req, res) {
    try {
      const { date, check_in_time, check_in_location, notes } = req.body;
      const userId = req.user.id;
      const attendanceDate = date || moment().format('YYYY-MM-DD');

      // Check if already checked in today
      const existingAttendance = await pool.query(
        'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
        [userId, attendanceDate]
      );

      if (existingAttendance.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Already checked in for today'
        });
      }

      // Create attendance record
      const result = await pool.query(
        `INSERT INTO attendance (user_id, date, check_in_time, check_in_location, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          attendanceDate,
          check_in_time || new Date(),
          check_in_location ? JSON.stringify(check_in_location) : null,
          notes,
          'present'
        ]
      );

      logger.info(`User ${req.user.email} checked in at ${attendanceDate}`);

      res.status(201).json({
        success: true,
        message: 'Checked in successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Check in error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Check out
  async checkOut(req, res) {
    try {
      const { date, check_out_time, check_out_location, notes } = req.body;
      const userId = req.user.id;
      const attendanceDate = date || moment().format('YYYY-MM-DD');

      // Find today's attendance record
      const attendanceResult = await pool.query(
        'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
        [userId, attendanceDate]
      );

      if (attendanceResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No check-in record found for today'
        });
      }

      const attendance = attendanceResult.rows[0];

      if (attendance.check_out_time) {
        return res.status(400).json({
          success: false,
          message: 'Already checked out for today'
        });
      }

      // Calculate working hours
      const checkOutDateTime = check_out_time ? new Date(check_out_time) : new Date();
      const checkInDateTime = new Date(attendance.check_in_time);
      const workingHours = (checkOutDateTime - checkInDateTime) / (1000 * 60 * 60);

      // Update attendance record
      const result = await pool.query(
        `UPDATE attendance 
         SET check_out_time = $1, 
             check_out_location = $2, 
             working_hours = $3,
             notes = COALESCE($4, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [
          checkOutDateTime,
          check_out_location ? JSON.stringify(check_out_location) : null,
          workingHours.toFixed(2),
          notes,
          attendance.id
        ]
      );

      logger.info(`User ${req.user.email} checked out at ${attendanceDate}`);

      res.json({
        success: true,
        message: 'Checked out successfully',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Check out error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user's attendance records
  async getUserAttendance(req, res) {
    try {
      const userId = req.user.id;
      const { start_date, end_date, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT * FROM attendance 
        WHERE user_id = $1
      `;
      let queryParams = [userId];
      let paramCount = 1;

      if (start_date) {
        paramCount++;
        query += ` AND date >= $${paramCount}`;
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND date <= $${paramCount}`;
        queryParams.push(end_date);
      }

      query += ` ORDER BY date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM attendance WHERE user_id = $1';
      let countParams = [userId];
      let countParamCount = 1;

      if (start_date) {
        countParamCount++;
        countQuery += ` AND date >= $${countParamCount}`;
        countParams.push(start_date);
      }

      if (end_date) {
        countParamCount++;
        countQuery += ` AND date <= $${countParamCount}`;
        countParams.push(end_date);
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          attendance: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalRecords / limit),
            total_records: totalRecords,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get user attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get today's attendance status
  async getTodayStatus(req, res) {
    try {
      const userId = req.user.id;
      const today = moment().format('YYYY-MM-DD');

      const result = await pool.query(
        'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
        [userId, today]
      );

      const attendance = result.rows[0] || null;

      res.json({
        success: true,
        data: {
          date: today,
          attendance,
          is_checked_in: attendance && attendance.check_in_time && !attendance.check_out_time,
          is_completed: attendance && attendance.check_in_time && attendance.check_out_time
        }
      });
    } catch (error) {
      logger.error('Get today status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get attendance summary
  async getAttendanceSummary(req, res) {
    try {
      const userId = req.user.id;
      const { month, year } = req.query;
      const currentMonth = month || moment().month() + 1;
      const currentYear = year || moment().year();

      // Get monthly attendance summary
      const summaryResult = await pool.query(
        `SELECT 
           COUNT(*) as total_days,
           COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
           COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
           COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
           COUNT(CASE WHEN status = 'sick' THEN 1 END) as sick_days,
           COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_days,
           COALESCE(SUM(working_hours), 0) as total_working_hours,
           COALESCE(AVG(working_hours), 0) as average_working_hours
         FROM attendance 
         WHERE user_id = $1 
           AND EXTRACT(MONTH FROM date) = $2 
           AND EXTRACT(YEAR FROM date) = $3`,
        [userId, currentMonth, currentYear]
      );

      const summary = summaryResult.rows[0];

      // Calculate attendance percentage
      const attendancePercentage = summary.total_days > 0 
        ? ((summary.present_days / summary.total_days) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: {
          month: currentMonth,
          year: currentYear,
          summary: {
            ...summary,
            attendance_percentage: parseFloat(attendancePercentage),
            total_working_hours: parseFloat(summary.total_working_hours),
            average_working_hours: parseFloat(summary.average_working_hours)
          }
        }
      });
    } catch (error) {
      logger.error('Get attendance summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Admin: Get all attendance records
  async getAllAttendance(req, res) {
    try {
      const { start_date, end_date, user_id, status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT a.*, u.first_name, u.last_name, u.employee_id, d.name as department_name
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE 1=1
      `;
      let queryParams = [];
      let paramCount = 0;

      if (start_date) {
        paramCount++;
        query += ` AND a.date >= $${paramCount}`;
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND a.date <= $${paramCount}`;
        queryParams.push(end_date);
      }

      if (user_id) {
        paramCount++;
        query += ` AND a.user_id = $${paramCount}`;
        queryParams.push(user_id);
      }

      if (status) {
        paramCount++;
        query += ` AND a.status = $${paramCount}`;
        queryParams.push(status);
      }

      query += ` ORDER BY a.date DESC, a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;
      let countParams = [];
      let countParamCount = 0;

      if (start_date) {
        countParamCount++;
        countQuery += ` AND a.date >= $${countParamCount}`;
        countParams.push(start_date);
      }

      if (end_date) {
        countParamCount++;
        countQuery += ` AND a.date <= $${countParamCount}`;
        countParams.push(end_date);
      }

      if (user_id) {
        countParamCount++;
        countQuery += ` AND a.user_id = $${countParamCount}`;
        countParams.push(user_id);
      }

      if (status) {
        countParamCount++;
        countQuery += ` AND a.status = $${countParamCount}`;
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          attendance: result.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalRecords / limit),
            total_records: totalRecords,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get all attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AttendanceController();