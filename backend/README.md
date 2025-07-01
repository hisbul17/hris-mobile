# HRIS Backend API

A comprehensive Human Resource Information System backend built with Node.js, Express.js, and PostgreSQL featuring secure session-based authentication.

## Features

- **Session-based Authentication**: Secure cookie-based sessions with PostgreSQL storage
- **CSRF Protection**: Cross-Site Request Forgery protection for all state-changing operations
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Employee Management**: Complete CRUD operations for employee data
- **Attendance Tracking**: Check-in/check-out functionality with location tracking
- **Leave Management**: Leave request submission, approval workflow, and balance tracking
- **Reporting**: Comprehensive attendance and leave reports
- **Audit Logging**: Track all system activities
- **Security**: Rate limiting, CORS, helmet, and input validation

## Security Features

### Authentication & Authorization
- **Session-based Authentication**: No JWT tokens, uses secure HTTP-only cookies
- **Session Storage**: PostgreSQL-backed session store for scalability
- **Role-based Access Control**: Admin, HRD, and User roles with different permissions
- **Session Timeout**: Configurable session expiration and cleanup

### Security Measures
- **CSRF Protection**: Prevents cross-site request forgery attacks
- **Password Hashing**: bcrypt with configurable salt rounds (default: 12)
- **Rate Limiting**: Prevents brute force attacks and API abuse
- **Security Headers**: Helmet.js for comprehensive security headers
- **Input Validation**: express-validator for request validation
- **CORS Protection**: Configurable cross-origin request security

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Session Store**: connect-pg-simple (PostgreSQL sessions)
- **Authentication**: express-session with secure cookies
- **Security**: Helmet, CORS, CSRF, Rate Limiting
- **Validation**: express-validator
- **Logging**: Winston
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database configuration
│   │   └── session.js           # Session configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── attendanceController.js # Attendance management
│   │   ├── leaveController.js   # Leave management
│   │   ├── userController.js    # User management
│   │   └── departmentController.js # Department management
│   ├── database/
│   │   ├── migrations/          # Database migration files
│   │   ├── migrate.js          # Migration runner
│   │   └── seed.js             # Database seeder
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── csrf.js             # CSRF protection
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── attendance.js       # Attendance routes
│   │   ├── leave.js            # Leave routes
│   │   ├── users.js            # User management routes
│   │   ├── departments.js      # Department routes
│   │   └── index.js            # Route aggregator
│   ├── utils/
│   │   └── logger.js           # Logging utility
│   └── server.js               # Application entry point
├── logs/                       # Log files
├── uploads/                    # File uploads
├── .env.example               # Environment variables template
├── package.json
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hris_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Session Configuration
   SESSION_SECRET=your_super_secret_session_key_here_make_it_very_long_and_random
   SESSION_NAME=hris_session
   SESSION_MAX_AGE=86400000

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Security Configuration
   BCRYPT_ROUNDS=12

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:8081
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb hris_db
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE hris_db;
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Database Operations
```bash
# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Seed database
npm run seed
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (creates session)
- `POST /api/auth/logout` - User logout (destroys session)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/session` - Check session status
- `GET /api/auth/csrf-token` - Get CSRF token

### User Management (Admin/HRD)
- `GET /api/users` - Get all users (Admin/HRD only)
- `GET /api/users/:id` - Get user by ID (Admin/HRD only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `POST /api/users/:id/reset-password` - Reset password (Admin only)
- `GET /api/users/stats` - Get user statistics (Admin/HRD only)

### Department Management
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department (Admin only)
- `PUT /api/departments/:id` - Update department (Admin only)
- `DELETE /api/departments/:id` - Delete department (Admin only)
- `GET /api/departments/:id/employees` - Get department employees

### Attendance
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/my-attendance` - Get user's attendance records
- `GET /api/attendance/today-status` - Get today's attendance status
- `GET /api/attendance/summary` - Get attendance summary
- `GET /api/attendance/all` - Get all attendance records (Admin/HRD only)

### Leave Management
- `GET /api/leave/types` - Get leave types
- `POST /api/leave/request` - Submit leave request
- `GET /api/leave/my-requests` - Get user's leave requests
- `GET /api/leave/my-balance` - Get user's leave balance
- `PUT /api/leave/cancel/:id` - Cancel leave request
- `GET /api/leave/all` - Get all leave requests (Admin/HRD only)
- `PUT /api/leave/review/:id` - Review leave request (Admin/HRD only)

## Session Management

### Session Configuration
- **Store**: PostgreSQL-backed session store
- **Cookie Settings**: 
  - `httpOnly: true` - Prevents XSS attacks
  - `secure: true` - HTTPS only in production
  - `sameSite: 'lax'` - CSRF protection
- **Session Timeout**: 24 hours (configurable)
- **Session Cleanup**: Automatic cleanup of expired sessions

### Session Security
- Sessions are stored in PostgreSQL for scalability
- Session cookies are HTTP-only and secure
- CSRF tokens protect against cross-site request forgery
- Session data includes user ID, email, role, and timestamps

## CSRF Protection

All state-changing operations (POST, PUT, DELETE) require CSRF tokens:

1. Get CSRF token: `GET /api/auth/csrf-token`
2. Include token in request headers: `X-CSRF-Token: <token>`
3. Or include in form data: `_csrf: <token>`

## Default Users (After Seeding)

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@company.com | password123 | System Administrator |
| HRD | hr@company.com | password123 | HR Manager |
| User | john.doe@company.com | password123 | Regular Employee |

## Security Best Practices

### Password Security
- **bcrypt Hashing**: Configurable salt rounds (default: 12)
- **Password Requirements**: Minimum 6 characters (configurable)
- **Password Reset**: Admin-only password reset functionality

### Session Security
- **Secure Cookies**: HTTP-only, secure, and SameSite attributes
- **Session Rotation**: New session ID on login
- **Session Cleanup**: Automatic cleanup of expired sessions
- **Session Validation**: User existence and status validation on each request

### API Security
- **Rate Limiting**: 100 requests per 15 minutes (general), 5 per 15 minutes (auth)
- **CORS Protection**: Configurable allowed origins
- **Security Headers**: Comprehensive security headers via Helmet
- **Input Validation**: All inputs validated and sanitized

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors (if any)
}
```

## Logging

- **Development**: Console logging with colors
- **Production**: File-based logging with rotation
- **Log Levels**: error, warn, info, debug
- **Log Files**: 
  - `logs/error.log` - Error logs only
  - `logs/combined.log` - All logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.