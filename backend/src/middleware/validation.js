const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('employee_id')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  
  body('role')
    .isIn(['admin', 'hrd', 'user'])
    .withMessage('Role must be admin, hrd, or user'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('nik')
    .optional()
    .isLength({ max: 20 })
    .withMessage('NIK must not exceed 20 characters'),
  
  body('department_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Department ID must be a positive integer'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('first_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  
  body('last_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('department_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Department ID must be a positive integer'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Attendance validation
const validateAttendance = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required (YYYY-MM-DD)'),
  
  body('check_in_time')
    .optional()
    .isISO8601()
    .withMessage('Valid check-in time is required'),
  
  body('check_out_time')
    .optional()
    .isISO8601()
    .withMessage('Valid check-out time is required'),
  
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half_day', 'sick', 'leave'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

// Leave request validation
const validateLeaveRequest = [
  body('leave_type_id')
    .isInt({ min: 1 })
    .withMessage('Valid leave type ID is required'),
  
  body('start_date')
    .isISO8601()
    .withMessage('Valid start date is required (YYYY-MM-DD)'),
  
  body('end_date')
    .isISO8601()
    .withMessage('Valid end date is required (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Department validation
const validateDepartment = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Department name must not exceed 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('manager_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Manager ID must be a positive integer'),
  
  handleValidationErrors
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  
  handleValidationErrors
];

// Query validation for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserUpdate,
  validateLogin,
  validateAttendance,
  validateLeaveRequest,
  validateDepartment,
  validateId,
  validatePagination
};