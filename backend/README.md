# HRIS Backend API

A comprehensive Human Resource Information System backend built with Node.js, Express.js, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Employee Management**: Complete CRUD operations for employee data
- **Attendance Tracking**: Check-in/check-out functionality with location tracking
- **Leave Management**: Leave request submission, approval workflow, and balance tracking
- **Reporting**: Comprehensive attendance and leave reports
- **Audit Logging**: Track all system activities
- **Security**: Rate limiting, CORS, helmet, and input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── attendanceController.js # Attendance management
│   │   └── leaveController.js   # Leave management
│   ├── database/
│   │   ├── migrations/          # Database migration files
│   │   ├── migrate.js          # Migration runner
│   │   └── seed.js             # Database seeder
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── attendance.js       # Attendance routes
│   │   ├── leave.js            # Leave routes
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

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=3000
   NODE_ENV=development

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
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/refresh-token` - Refresh JWT token

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

## Database Schema

### Users Table
- Employee information and authentication
- Role-based access control (admin, hrd, user)
- Department relationships

### Departments Table
- Organizational structure
- Manager assignments

### Attendance Table
- Check-in/check-out records
- Location tracking
- Working hours calculation

### Leave Management Tables
- `leave_types`: Different types of leave
- `leave_requests`: Leave applications
- `leave_balances`: Employee leave balances

### Audit & Notifications
- `audit_logs`: System activity tracking
- `notifications`: User notifications

## Default Users (After Seeding)

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@company.com | password123 | System Administrator |
| HRD | hr@company.com | password123 | HR Manager |
| User | john.doe@company.com | password123 | Regular Employee |

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for admin, HRD, and users
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Password Hashing**: bcrypt for secure password storage

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