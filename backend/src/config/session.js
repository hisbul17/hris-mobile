const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./database');

const sessionConfig = {
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  name: process.env.SESSION_NAME || 'hris_session',
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF protection
  }
};

// In production, ensure secure cookies
if (process.env.NODE_ENV === 'production') {
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'strict';
}

module.exports = sessionConfig;