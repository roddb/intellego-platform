#!/usr/bin/env node

/**
 * Password Management Database Migration Script
 * 
 * Creates the PasswordAudit table for comprehensive password change tracking
 * in the Intellego Platform. This script is designed to work with both
 * local SQLite and production Turso libSQL databases.
 * 
 * Schema Design:
 * - Complete audit trail for all password operations
 * - Support for user-initiated and admin-initiated changes
 * - IP address and user agent tracking for security
 * - Timestamps for all operations with foreign key relationships
 * 
 * Usage:
 *   node scripts/create-password-tables.js [--production]
 * 
 * Author: Database Engineer - Intellego Platform
 * Date: 2025-08-14
 */

const { createClient } = require('@libsql/client');
const path = require('path');

// Determine if running in production mode
const isProduction = process.argv.includes('--production');

// Database configuration
const config = isProduction ? {
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
} : {
  url: `file:${path.join(__dirname, '..', 'prisma', 'data', 'intellego.db')}`
};

console.log(`🔧 Password Management Schema Migration`);
console.log(`📊 Target: ${isProduction ? 'Turso Production' : 'Local SQLite'}`);
console.log(`📅 Date: ${new Date().toISOString()}`);

// Create database client
const db = createClient(config);

/**
 * PasswordAudit Table Schema
 * 
 * Tracks all password-related operations for security and compliance
 */
const CREATE_PASSWORD_AUDIT_TABLE = `
  CREATE TABLE IF NOT EXISTS PasswordAudit (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    actionType TEXT NOT NULL CHECK (actionType IN ('CHANGE', 'RESET', 'ADMIN_RESET', 'FORCE_CHANGE')),
    actionInitiatedBy TEXT NOT NULL CHECK (actionInitiatedBy IN ('USER', 'ADMIN', 'SYSTEM')),
    adminUserId TEXT, -- NULL if user-initiated, populated if admin-initiated
    previousPasswordHash TEXT, -- Store hash for audit trail (optional)
    newPasswordHash TEXT NOT NULL, -- New password hash
    changeReason TEXT, -- Optional reason for change
    securityContext TEXT NOT NULL, -- JSON string with security info
    ipAddress TEXT, -- IP address from where change was initiated
    userAgent TEXT, -- User agent string
    sessionId TEXT, -- Session identifier
    isSuccessful BOOLEAN NOT NULL DEFAULT 1,
    errorMessage TEXT, -- Error message if operation failed
    passwordStrengthScore INTEGER, -- Calculated password strength (1-5)
    complianceFlags TEXT, -- JSON string with compliance check results
    notificationSent BOOLEAN NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    
    -- Foreign key constraints
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (adminUserId) REFERENCES User(id) ON DELETE SET NULL
  );
`;

/**
 * Performance indexes for PasswordAudit table
 */
const CREATE_PASSWORD_AUDIT_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_password_audit_user ON PasswordAudit(userId);`,
  `CREATE INDEX IF NOT EXISTS idx_password_audit_created ON PasswordAudit(createdAt);`,
  `CREATE INDEX IF NOT EXISTS idx_password_audit_action_type ON PasswordAudit(actionType);`,
  `CREATE INDEX IF NOT EXISTS idx_password_audit_admin ON PasswordAudit(adminUserId);`,
  `CREATE INDEX IF NOT EXISTS idx_password_audit_successful ON PasswordAudit(isSuccessful);`,
  `CREATE INDEX IF NOT EXISTS idx_password_audit_user_date ON PasswordAudit(userId, createdAt);`,
  `CREATE INDEX IF NOT EXISTS idx_password_audit_security_context ON PasswordAudit(ipAddress, createdAt);`
];

/**
 * Optional PasswordPolicy table for enterprise features
 */
const CREATE_PASSWORD_POLICY_TABLE = `
  CREATE TABLE IF NOT EXISTS PasswordPolicy (
    id TEXT PRIMARY KEY,
    policyName TEXT NOT NULL UNIQUE,
    description TEXT,
    minLength INTEGER NOT NULL DEFAULT 8,
    maxLength INTEGER NOT NULL DEFAULT 128,
    requireUppercase BOOLEAN NOT NULL DEFAULT 1,
    requireLowercase BOOLEAN NOT NULL DEFAULT 1,
    requireNumbers BOOLEAN NOT NULL DEFAULT 1,
    requireSpecialChars BOOLEAN NOT NULL DEFAULT 1,
    allowedSpecialChars TEXT DEFAULT '!@#$%^&*()_+-=[]{}|;:,.<>?',
    preventReuse INTEGER NOT NULL DEFAULT 5, -- How many previous passwords to check
    expirationDays INTEGER DEFAULT 90, -- Password expiration in days
    lockoutAttempts INTEGER NOT NULL DEFAULT 5, -- Failed attempts before lockout
    lockoutDuration INTEGER NOT NULL DEFAULT 1800, -- Lockout duration in seconds
    isActive BOOLEAN NOT NULL DEFAULT 1,
    appliesTo TEXT NOT NULL DEFAULT 'ALL', -- USER_ROLE or ALL
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    
    FOREIGN KEY (createdBy) REFERENCES User(id)
  );
`;

/**
 * Execute migration with error handling
 */
async function runMigration() {
  try {
    console.log('\n📋 Starting password management schema migration...');
    
    // Step 1: Create PasswordAudit table
    console.log('🔨 Creating PasswordAudit table...');
    await db.execute(CREATE_PASSWORD_AUDIT_TABLE);
    console.log('✅ PasswordAudit table created successfully');
    
    // Step 2: Create performance indexes
    console.log('🔍 Creating performance indexes...');
    for (const [index, sql] of CREATE_PASSWORD_AUDIT_INDEXES.entries()) {
      await db.execute(sql);
      console.log(`   ✅ Index ${index + 1}/${CREATE_PASSWORD_AUDIT_INDEXES.length} created`);
    }
    
    // Step 3: Create PasswordPolicy table (optional enterprise feature)
    console.log('🛡️  Creating PasswordPolicy table...');
    await db.execute(CREATE_PASSWORD_POLICY_TABLE);
    console.log('✅ PasswordPolicy table created successfully');
    
    // Step 4: Create default password policy
    console.log('⚙️  Creating default password policy...');
    const defaultPolicyId = generateId();
    const now = new Date().toISOString();
    
    // Find an existing admin user for the createdBy field, or use NULL
    const adminResult = await db.execute(`
      SELECT id FROM User WHERE role = 'ADMIN' OR role = 'INSTRUCTOR' LIMIT 1
    `);
    
    const createdBy = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;
    
    await db.execute(`
      INSERT OR IGNORE INTO PasswordPolicy (
        id, policyName, description, 
        minLength, maxLength, requireUppercase, requireLowercase, 
        requireNumbers, requireSpecialChars, preventReuse, expirationDays,
        lockoutAttempts, lockoutDuration, isActive, appliesTo,
        createdAt, updatedAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      defaultPolicyId,
      'default_intellego_policy',
      'Default password policy for Intellego Platform users',
      8, // minLength
      128, // maxLength
      1, // requireUppercase
      1, // requireLowercase
      1, // requireNumbers
      1, // requireSpecialChars
      5, // preventReuse
      null, // expirationDays (no expiration by default)
      5, // lockoutAttempts
      1800, // lockoutDuration (30 minutes)
      1, // isActive
      'ALL', // appliesTo
      now, // createdAt
      now, // updatedAt
      createdBy // createdBy (NULL if no admin found)
    ]);
    console.log('✅ Default password policy created');
    
    // Step 5: Verify table creation
    console.log('🔍 Verifying table creation...');
    const auditTableCheck = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PasswordAudit'");
    const policyTableCheck = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PasswordPolicy'");
    
    if (auditTableCheck.rows.length === 0) {
      throw new Error('PasswordAudit table was not created');
    }
    if (policyTableCheck.rows.length === 0) {
      throw new Error('PasswordPolicy table was not created');
    }
    
    // Step 6: Display summary
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log('   ✅ PasswordAudit table: Created with comprehensive audit fields');
    console.log('   ✅ Performance indexes: Created 7 strategic indexes');
    console.log('   ✅ PasswordPolicy table: Created with configurable policies');
    console.log('   ✅ Default policy: Created and activated');
    
    console.log('\n🔧 Database Enhancements:');
    console.log('   • Complete password change audit trail');
    console.log('   • IP address and user agent tracking');
    console.log('   • Admin vs user-initiated change tracking');
    console.log('   • Password strength scoring capability');
    console.log('   • Compliance flags for regulatory requirements');
    console.log('   • Configurable password policies');
    console.log('   • Failed attempt tracking and lockout support');
    
    console.log('\n⚡ Performance Optimizations:');
    console.log('   • Optimized indexes for common queries');
    console.log('   • Foreign key constraints for data integrity');
    console.log('   • Efficient date-based lookups');
    console.log('   • User-specific audit trail queries');
    
    console.log('\n🛡️  Security Features:');
    console.log('   • Password hash audit trail');
    console.log('   • Security context logging');
    console.log('   • Admin action tracking');
    console.log('   • Failed operation logging');
    console.log('   • Session correlation');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Verify database connection');
    console.error('   • Check file permissions for local SQLite');
    console.error('   • Ensure Turso credentials are correct for production');
    console.error('   • Review any foreign key constraint violations');
    throw error;
  } finally {
    // Close database connection
    try {
      await db.close();
      console.log('\n🔌 Database connection closed');
    } catch (closeError) {
      console.warn('Warning: Failed to close database connection:', closeError.message);
    }
  }
}

/**
 * Generate unique ID for database records
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'pwd_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Execute migration with proper error handling
 */
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ Password management schema migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, db };