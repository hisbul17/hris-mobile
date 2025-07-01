const pool = require('../config/database');
const logger = require('../utils/logger');

const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Get user from database to ensure they still exist and are active
    const userResult = await pool.query(
      'SELECT id, employee_id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      // Clear invalid session
      req.session.destroy();
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      // Clear session for inactive user
      req.session.destroy();
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Update last activity
    req.session.lastActivity = new Date();
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const userResult = await pool.query(
        'SELECT id, employee_id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
        [req.session.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        req.user = userResult.rows[0];
        req.session.lastActivity = new Date();
      }
    }
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    // Continue without authentication for optional auth
  }

  next();
};

// Session cleanup middleware
const cleanupExpiredSessions = async (req, res, next) => {
  try {
    // Clean up expired sessions (older than 7 days)
    await pool.query(
      'DELETE FROM user_sessions WHERE expire < NOW() - INTERVAL \'7 days\''
    );
  } catch (error) {
    logger.error('Session cleanup error:', error);
  }
  next();
};

module.exports = {
  requireAuth,
  authorizeRoles,
  optionalAuth,
  cleanupExpiredSessions
};