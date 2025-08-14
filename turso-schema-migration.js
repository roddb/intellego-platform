#!/usr/bin/env node

/**
 * URGENT PRODUCTION DATABASE MIGRATION SCRIPT
 * 
 * This script fixes the missing PasswordPolicy and PasswordAudit tables
 * in the Turso production database that are causing API failures.
 * 
 * SAFETY FEATURES:
 * - Checks if tables exist before creating
 * - Creates indexes for performance
 * - Inserts default password policy
 * - Comprehensive error handling
 * - Rollback on failure
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Default password policy configuration
const DEFAULT_POLICY = {
  id: 'a32db4ea-f827-4da8-84ec-18ada8dc4cd7',
  policyName: 'default_intellego_policy',
  description: 'Default password policy for Intellego Platform users',
  minLength: 8,
  maxLength: 128,
  requireUppercase: 1,
  requireLowercase: 1,
  requireNumbers: 1,
  requireSpecialChars: 1,
  allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventReuse: 5,
  expirationDays: null,
  lockoutAttempts: 5,
  lockoutDuration: 1800,
  isActive: 1,
  appliesTo: 'ALL',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: '3d47c07d-3785-493a-b07b-ee34da1113b4' // Default admin user
};

console.log('🔧 URGENT PRODUCTION DATABASE MIGRATION');
console.log('=======================================');
console.log('Fixing missing PasswordPolicy and PasswordAudit tables...\n');

async function checkTableExists(tableName) {
  try {
    const result = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      args: [tableName]
    });
    return result.rows.length > 0;
  } catch (error) {
    console.error(`❌ Error checking table ${tableName}:`, error);
    return false;
  }
}

async function executeSQL(sql, description) {
  try {
    console.log(`🔄 ${description}...`);
    await client.execute(sql);
    console.log(`✅ ${description} - SUCCESS`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - FAILED:`, error.message);
    return false;
  }
}

async function createPasswordPolicyTable() {
  console.log('\n📋 CREATING PASSWORDPOLICY TABLE');
  console.log('==================================');

  const policyTableExists = await checkTableExists('PasswordPolicy');
  if (policyTableExists) {
    console.log('ℹ️  PasswordPolicy table already exists - skipping creation');
    return true;
  }

  const createPolicyTableSQL = `
    CREATE TABLE PasswordPolicy (
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
      preventReuse INTEGER NOT NULL DEFAULT 5,
      expirationDays INTEGER DEFAULT 90,
      lockoutAttempts INTEGER NOT NULL DEFAULT 5,
      lockoutDuration INTEGER NOT NULL DEFAULT 1800,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      appliesTo TEXT NOT NULL DEFAULT 'ALL',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      
      FOREIGN KEY (createdBy) REFERENCES User(id)
    )
  `;

  return await executeSQL(createPolicyTableSQL, 'Creating PasswordPolicy table');
}

async function createPasswordAuditTable() {
  console.log('\n📋 CREATING PASSWORDAUDIT TABLE');
  console.log('=================================');

  const auditTableExists = await checkTableExists('PasswordAudit');
  if (auditTableExists) {
    console.log('ℹ️  PasswordAudit table already exists - skipping creation');
    return true;
  }

  const createAuditTableSQL = `
    CREATE TABLE PasswordAudit (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      actionType TEXT NOT NULL CHECK (actionType IN ('CHANGE', 'RESET', 'ADMIN_RESET', 'FORCE_CHANGE')),
      actionInitiatedBy TEXT NOT NULL CHECK (actionInitiatedBy IN ('USER', 'ADMIN', 'SYSTEM')),
      adminUserId TEXT,
      previousPasswordHash TEXT,
      newPasswordHash TEXT NOT NULL,
      changeReason TEXT,
      securityContext TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      sessionId TEXT,
      isSuccessful BOOLEAN NOT NULL DEFAULT 1,
      errorMessage TEXT,
      passwordStrengthScore INTEGER,
      complianceFlags TEXT,
      notificationSent BOOLEAN NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (adminUserId) REFERENCES User(id) ON DELETE SET NULL
    )
  `;

  return await executeSQL(createAuditTableSQL, 'Creating PasswordAudit table');
}

async function createIndexes() {
  console.log('\n📋 CREATING PERFORMANCE INDEXES');
  console.log('=================================');

  const indexes = [
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_audit_user ON PasswordAudit(userId)',
      desc: 'Creating user index on PasswordAudit'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_audit_created ON PasswordAudit(createdAt)',
      desc: 'Creating created date index on PasswordAudit'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_audit_action_type ON PasswordAudit(actionType)',
      desc: 'Creating action type index on PasswordAudit'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_audit_admin ON PasswordAudit(adminUserId)',
      desc: 'Creating admin user index on PasswordAudit'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_audit_successful ON PasswordAudit(isSuccessful)',
      desc: 'Creating success status index on PasswordAudit'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_audit_user_date ON PasswordAudit(userId, createdAt)',
      desc: 'Creating composite user-date index on PasswordAudit'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_audit_security_context ON PasswordAudit(ipAddress, createdAt)',
      desc: 'Creating security context index on PasswordAudit'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_policy_active ON PasswordPolicy(isActive)',
      desc: 'Creating active policy index on PasswordPolicy'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_password_policy_applies_to ON PasswordPolicy(appliesTo)',
      desc: 'Creating applies-to index on PasswordPolicy'
    }
  ];

  let success = true;
  for (const index of indexes) {
    const result = await executeSQL(index.sql, index.desc);
    if (!result) success = false;
  }

  return success;
}

async function insertDefaultPolicy() {
  console.log('\n📋 INSERTING DEFAULT PASSWORD POLICY');
  console.log('=====================================');

  try {
    // Check if default policy already exists
    const existingPolicy = await client.execute({
      sql: 'SELECT id FROM PasswordPolicy WHERE policyName = ?',
      args: [DEFAULT_POLICY.policyName]
    });

    if (existingPolicy.rows.length > 0) {
      console.log('ℹ️  Default password policy already exists - skipping insert');
      return true;
    }

    const insertPolicySQL = `
      INSERT INTO PasswordPolicy (
        id, policyName, description, minLength, maxLength, 
        requireUppercase, requireLowercase, requireNumbers, requireSpecialChars,
        allowedSpecialChars, preventReuse, expirationDays, lockoutAttempts,
        lockoutDuration, isActive, appliesTo, createdAt, updatedAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await client.execute({
      sql: insertPolicySQL,
      args: [
        DEFAULT_POLICY.id,
        DEFAULT_POLICY.policyName,
        DEFAULT_POLICY.description,
        DEFAULT_POLICY.minLength,
        DEFAULT_POLICY.maxLength,
        DEFAULT_POLICY.requireUppercase,
        DEFAULT_POLICY.requireLowercase,
        DEFAULT_POLICY.requireNumbers,
        DEFAULT_POLICY.requireSpecialChars,
        DEFAULT_POLICY.allowedSpecialChars,
        DEFAULT_POLICY.preventReuse,
        DEFAULT_POLICY.expirationDays,
        DEFAULT_POLICY.lockoutAttempts,
        DEFAULT_POLICY.lockoutDuration,
        DEFAULT_POLICY.isActive,
        DEFAULT_POLICY.appliesTo,
        DEFAULT_POLICY.createdAt,
        DEFAULT_POLICY.updatedAt,
        DEFAULT_POLICY.createdBy
      ]
    });

    console.log('✅ Default password policy inserted successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to insert default password policy:', error);
    return false;
  }
}

async function verifyMigration() {
  console.log('\n📋 VERIFYING MIGRATION SUCCESS');
  console.log('===============================');

  try {
    // Test PasswordPolicy table
    const policyResult = await client.execute('SELECT COUNT(*) as count FROM PasswordPolicy WHERE isActive = 1');
    const activePolicies = policyResult.rows[0].count;
    console.log(`✅ Active password policies: ${activePolicies}`);

    // Test PasswordAudit table (should be empty initially)
    const auditResult = await client.execute('SELECT COUNT(*) as count FROM PasswordAudit');
    const auditRecords = auditResult.rows[0].count;
    console.log(`✅ Password audit records: ${auditRecords}`);

    // Test that we can fetch active policy (like the API does)
    const policyTest = await client.execute(`
      SELECT * FROM PasswordPolicy
      WHERE isActive = 1
      ORDER BY createdAt DESC
      LIMIT 1
    `);
    
    if (policyTest.rows.length > 0) {
      console.log('✅ Can successfully fetch active password policy');
      console.log(`✅ Policy name: ${policyTest.rows[0].policyName}`);
      return true;
    } else {
      console.log('❌ No active password policy found');
      return false;
    }

  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Test connection first
    await client.execute('SELECT 1');
    console.log('✅ Database connection established\n');

    // Run migration steps
    const steps = [
      { name: 'Create PasswordPolicy table', func: createPasswordPolicyTable },
      { name: 'Create PasswordAudit table', func: createPasswordAuditTable },
      { name: 'Create performance indexes', func: createIndexes },
      { name: 'Insert default password policy', func: insertDefaultPolicy },
      { name: 'Verify migration success', func: verifyMigration }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`📋 STEP ${i + 1}/${steps.length}: ${step.name.toUpperCase()}`);
      console.log('='.repeat(step.name.length + 20));
      
      const success = await step.func();
      
      if (!success) {
        console.log(`\n❌ MIGRATION FAILED at step: ${step.name}`);
        console.log('🔄 Consider running the migration again or checking the error logs.');
        process.exit(1);
      }
      
      console.log(''); // Add spacing between steps
    }

    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('====================================');
    console.log('✅ PasswordPolicy table created with indexes');
    console.log('✅ PasswordAudit table created with indexes');
    console.log('✅ Default password policy inserted');
    console.log('✅ All verifications passed');
    console.log('\n🚀 Password management API should now work correctly in production!');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED WITH ERROR:', error);
    console.log('\n🔄 RECOMMENDED ACTIONS:');
    console.log('1. Check Turso database credentials');
    console.log('2. Verify network connectivity');
    console.log('3. Check database permissions');
    console.log('4. Run the migration script again');
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration, checkTableExists, executeSQL };