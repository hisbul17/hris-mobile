# HRIS Mobile App - Supabase Migration

A comprehensive Human Resource Information System mobile application built with Expo Router and Supabase.

## 🚀 Features

- **Authentication**: Secure user authentication with Supabase Auth
- **Attendance Tracking**: Check-in/check-out with location and photo capture
- **Leave Management**: Submit, track, and manage leave requests
- **User Management**: Admin and HRD user management capabilities
- **Real-time Updates**: Live data synchronization with Supabase
- **Role-based Access**: Different permissions for Admin, HRD, and Users
- **Responsive Design**: Beautiful UI that works across all devices

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo Router
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native

## 📋 Prerequisites

- Node.js 16+ 
- Expo CLI
- Supabase account

## 🔧 Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the migrations in the Supabase SQL editor (in order):
   - `001_create_departments.sql`
   - `002_create_users.sql`
   - `003_create_attendance.sql`
   - `004_create_leave_types.sql`
   - `005_create_leave_requests.sql`
   - `006_create_leave_balances.sql`
   - `007_create_audit_logs.sql`
   - `008_create_notifications.sql`
   - `009_seed_initial_data.sql`

### 2. Environment Configuration

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🗄️ Database Schema

### Core Tables

- **departments**: Organizational departments
- **users**: User profiles and authentication data
- **attendance**: Daily attendance records
- **leave_types**: Types of leave available
- **leave_requests**: Leave applications and approvals
- **leave_balances**: User leave balances by type and year
- **audit_logs**: System activity tracking
- **notifications**: User notifications

### Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based Policies**: Different access levels for admin, hrd, and user roles
- **Secure Authentication**: Supabase Auth with JWT tokens
- **Real-time Subscriptions**: Live data updates

## 👥 User Roles

### Admin
- Full system access
- User management (create, update, delete)
- Department management
- System configuration
- All reports and analytics

### HRD (Human Resources)
- User profile viewing
- Leave request management
- Attendance monitoring
- HR reports

### User (Employee)
- Personal profile management
- Attendance check-in/out
- Leave request submission
- Personal reports

## 📱 App Structure

```
app/
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx          # Dashboard
│   ├── attendance.tsx     # Attendance tracking
│   ├── leave.tsx          # Leave management
│   ├── users.tsx          # User management (Admin/HRD)
│   ├── admin.tsx          # Admin dashboard
│   └── profile.tsx        # User profile
├── _layout.tsx
└── +not-found.tsx

utils/
├── supabase.ts           # Supabase client configuration
└── api.ts               # API functions and database operations
```

## 🔐 Security Implementation

### Authentication
- Supabase Auth with email/password
- Automatic session management
- Role-based access control

### Database Security
- Row Level Security (RLS) policies
- User can only access their own data
- Admin/HRD have elevated permissions
- Secure API endpoints

### Data Protection
- Encrypted data transmission
- Secure token storage
- Input validation and sanitization

## 🚀 Deployment

### Frontend (Expo)
```bash
# Build for web
npm run build:web

# Deploy to Expo
expo publish
```

### Backend (Supabase)
- Database is automatically managed by Supabase
- Real-time subscriptions work out of the box
- Automatic backups and scaling

## 📊 Key Features Implementation

### Attendance System
- GPS location tracking
- Photo capture for verification
- Automatic working hours calculation
- Real-time status updates

### Leave Management
- Multiple leave types support
- Approval workflow
- Balance tracking
- Calendar integration

### User Management
- Role-based permissions
- Profile management
- Department assignments
- Activity tracking

### Real-time Features
- Live attendance updates
- Instant notifications
- Real-time dashboard data
- Collaborative features

## 🔄 Migration from Previous System

This implementation replaces the previous session-based backend with:

1. **Supabase Auth**: Instead of custom session management
2. **PostgreSQL**: Managed database with automatic scaling
3. **Real-time**: Built-in real-time subscriptions
4. **Security**: Row Level Security instead of middleware
5. **Scalability**: Cloud-native architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the migration guides
- Contact the development team

---

**Note**: This application uses Supabase for backend services. Ensure you have proper Supabase configuration before running the application.