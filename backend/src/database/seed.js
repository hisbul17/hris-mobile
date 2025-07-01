const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class DatabaseSeeder {
  async seedDepartments() {
    const departments = [
      { name: 'Human Resources', description: 'Manages employee relations and policies' },
      { name: 'Engineering', description: 'Software development and technical operations' },
      { name: 'Marketing', description: 'Brand promotion and customer acquisition' },
      { name: 'Sales', description: 'Revenue generation and client relations' },
      { name: 'Finance', description: 'Financial planning and accounting' },
      { name: 'Operations', description: 'Day-to-day business operations' }
    ];

    for (const dept of departments) {
      try {
        await pool.query(
          'INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [dept.name, dept.description]
        );
        console.log(`✓ Seeded department: ${dept.name}`);
      } catch (error) {
        console.error(`✗ Failed to seed department: ${dept.name}`, error);
      }
    }
  }

  async seedUsers() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        employee_id: 'EMP001',
        email: 'admin@company.com',
        password_hash: hashedPassword,
        role: 'admin',
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+1234567890',
        nik: 'NIK001',
        position: 'System Administrator',
        department_id: 1, // HR
        hire_date: '2023-01-01'
      },
      {
        employee_id: 'EMP002',
        email: 'hr@company.com',
        password_hash: hashedPassword,
        role: 'hrd',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567891',
        nik: 'NIK002',
        position: 'HR Manager',
        department_id: 1, // HR
        hire_date: '2023-01-15'
      },
      {
        employee_id: 'EMP003',
        email: 'john.doe@company.com',
        password_hash: hashedPassword,
        role: 'user',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567892',
        nik: 'NIK003',
        position: 'Software Developer',
        department_id: 2, // Engineering
        hire_date: '2023-02-01'
      },
      {
        employee_id: 'EMP004',
        email: 'alice.johnson@company.com',
        password_hash: hashedPassword,
        role: 'user',
        first_name: 'Alice',
        last_name: 'Johnson',
        phone: '+1234567893',
        nik: 'NIK004',
        position: 'Marketing Specialist',
        department_id: 3, // Marketing
        hire_date: '2023-03-01'
      }
    ];

    for (const user of users) {
      try {
        await pool.query(`
          INSERT INTO users (
            employee_id, email, password_hash, role, first_name, last_name,
            phone, nik, position, department_id, hire_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (employee_id) DO NOTHING
        `, [
          user.employee_id, user.email, user.password_hash, user.role,
          user.first_name, user.last_name, user.phone, user.nik,
          user.position, user.department_id, user.hire_date
        ]);
        console.log(`✓ Seeded user: ${user.first_name} ${user.last_name}`);
      } catch (error) {
        console.error(`✗ Failed to seed user: ${user.first_name} ${user.last_name}`, error);
      }
    }
  }

  async seedLeaveTypes() {
    const leaveTypes = [
      {
        name: 'Annual Leave',
        description: 'Yearly vacation leave',
        max_days_per_year: 21,
        is_paid: true,
        requires_approval: true
      },
      {
        name: 'Sick Leave',
        description: 'Medical leave for illness',
        max_days_per_year: 12,
        is_paid: true,
        requires_approval: false
      },
      {
        name: 'Personal Leave',
        description: 'Personal time off',
        max_days_per_year: 5,
        is_paid: false,
        requires_approval: true
      },
      {
        name: 'Maternity Leave',
        description: 'Leave for new mothers',
        max_days_per_year: 90,
        is_paid: true,
        requires_approval: true
      },
      {
        name: 'Paternity Leave',
        description: 'Leave for new fathers',
        max_days_per_year: 14,
        is_paid: true,
        requires_approval: true
      },
      {
        name: 'Emergency Leave',
        description: 'Urgent personal matters',
        max_days_per_year: 3,
        is_paid: true,
        requires_approval: false
      }
    ];

    for (const leaveType of leaveTypes) {
      try {
        await pool.query(`
          INSERT INTO leave_types (name, description, max_days_per_year, is_paid, requires_approval)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO NOTHING
        `, [
          leaveType.name, leaveType.description, leaveType.max_days_per_year,
          leaveType.is_paid, leaveType.requires_approval
        ]);
        console.log(`✓ Seeded leave type: ${leaveType.name}`);
      } catch (error) {
        console.error(`✗ Failed to seed leave type: ${leaveType.name}`, error);
      }
    }
  }

  async seedLeaveBalances() {
    const currentYear = new Date().getFullYear();
    
    // Get all users and leave types
    const usersResult = await pool.query('SELECT id FROM users WHERE role = $1', ['user']);
    const leaveTypesResult = await pool.query('SELECT id, max_days_per_year FROM leave_types');
    
    for (const user of usersResult.rows) {
      for (const leaveType of leaveTypesResult.rows) {
        try {
          await pool.query(`
            INSERT INTO leave_balances (user_id, leave_type_id, year, allocated_days, remaining_days)
            VALUES ($1, $2, $3, $4, $4)
            ON CONFLICT (user_id, leave_type_id, year) DO NOTHING
          `, [user.id, leaveType.id, currentYear, leaveType.max_days_per_year]);
        } catch (error) {
          console.error('Failed to seed leave balance:', error);
        }
      }
    }
    console.log('✓ Seeded leave balances for all users');
  }

  async seedSampleAttendance() {
    const usersResult = await pool.query('SELECT id FROM users WHERE role = $1', ['user']);
    const today = new Date();
    
    for (const user of usersResult.rows) {
      // Create attendance for the last 7 days
      for (let i = 7; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const checkInTime = new Date(date);
        checkInTime.setHours(8, 30 + Math.floor(Math.random() * 30), 0, 0);
        
        const checkOutTime = new Date(date);
        checkOutTime.setHours(17, Math.floor(Math.random() * 60), 0, 0);
        
        const workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        
        try {
          await pool.query(`
            INSERT INTO attendance (
              user_id, date, check_in_time, check_out_time, working_hours, status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, date) DO NOTHING
          `, [
            user.id,
            date.toISOString().split('T')[0],
            checkInTime,
            checkOutTime,
            workingHours.toFixed(2),
            'present'
          ]);
        } catch (error) {
          console.error('Failed to seed attendance:', error);
        }
      }
    }
    console.log('✓ Seeded sample attendance records');
  }

  async run() {
    try {
      console.log('Starting database seeding...');
      
      await this.seedDepartments();
      await this.seedUsers();
      await this.seedLeaveTypes();
      await this.seedLeaveBalances();
      await this.seedSampleAttendance();
      
      console.log('Database seeding completed successfully!');
      console.log('\nDefault login credentials:');
      console.log('Admin: admin@company.com / password123');
      console.log('HRD: hr@company.com / password123');
      console.log('User: john.doe@company.com / password123');
      
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const seeder = new DatabaseSeeder();
  
  try {
    await seeder.run();
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseSeeder;