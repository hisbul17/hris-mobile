const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.migrationTable = 'schema_migrations';
  }

  async createMigrationTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await pool.query(query);
      console.log('Migration table created successfully');
    } catch (error) {
      console.error('Error creating migration table:', error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await pool.query(
        `SELECT filename FROM ${this.migrationTable} ORDER BY filename`
      );
      return result.rows.map(row => row.filename);
    } catch (error) {
      console.error('Error getting executed migrations:', error);
      return [];
    }
  }

  async getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.error('Error reading migration files:', error);
      return [];
    }
  }

  async executeMigration(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Start transaction
      await pool.query('BEGIN');
      
      // Execute migration
      await pool.query(sql);
      
      // Record migration
      await pool.query(
        `INSERT INTO ${this.migrationTable} (filename) VALUES ($1)`,
        [filename]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log(`✓ Executed migration: ${filename}`);
    } catch (error) {
      // Rollback transaction
      await pool.query('ROLLBACK');
      console.error(`✗ Failed to execute migration: ${filename}`, error);
      throw error;
    }
  }

  async rollbackMigration(filename) {
    try {
      // Remove from migration table
      await pool.query(
        `DELETE FROM ${this.migrationTable} WHERE filename = $1`,
        [filename]
      );
      
      console.log(`✓ Rolled back migration: ${filename}`);
      console.log('Note: You may need to manually reverse database changes');
    } catch (error) {
      console.error(`✗ Failed to rollback migration: ${filename}`, error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      await this.createMigrationTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }
      
      console.log(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }

  async rollbackLastMigration() {
    try {
      const result = await pool.query(
        `SELECT filename FROM ${this.migrationTable} ORDER BY executed_at DESC LIMIT 1`
      );
      
      if (result.rows.length === 0) {
        console.log('No migrations to rollback');
        return;
      }
      
      const lastMigration = result.rows[0].filename;
      await this.rollbackMigration(lastMigration);
    } catch (error) {
      console.error('Rollback failed:', error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrationRunner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'rollback':
        await migrationRunner.rollbackLastMigration();
        break;
      default:
        await migrationRunner.runMigrations();
        break;
    }
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationRunner;