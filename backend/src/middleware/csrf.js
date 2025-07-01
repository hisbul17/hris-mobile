const csrf = require('csurf');

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// Middleware to provide CSRF token to client
const provideCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

module.exports = {
  csrfProtection,
  provideCsrfToken
};