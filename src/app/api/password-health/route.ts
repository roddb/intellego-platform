import { NextResponse } from "next/server";
import { query } from "@/lib/db-operations";

export async function GET() {
  try {
    console.log('🔍 Starting password management database health check...');
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      tables: {
        passwordAudit: { exists: false, structure: null as any },
        passwordPolicy: { exists: false, structure: null as any }
      },
      schema: {
        requiresCreation: false,
        sql: {
          passwordAudit: "",
          passwordPolicy: ""
        }
      },
      recommendations: [] as string[]
    };

    // Check if PasswordAudit table exists
    try {
      const auditCheck = await query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='PasswordAudit'
      `);
      
      if (auditCheck.rows.length > 0) {
        healthReport.tables.passwordAudit.exists = true;
        
        // Get table structure
        const auditStructure = await query("PRAGMA table_info(PasswordAudit)");
        healthReport.tables.passwordAudit.structure = auditStructure.rows;
      }
    } catch (error) {
      console.log('PasswordAudit table does not exist');
    }

    // Check if PasswordPolicy table exists
    try {
      const policyCheck = await query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='PasswordPolicy'
      `);
      
      if (policyCheck.rows.length > 0) {
        healthReport.tables.passwordPolicy.exists = true;
        
        // Get table structure
        const policyStructure = await query("PRAGMA table_info(PasswordPolicy)");
        healthReport.tables.passwordPolicy.structure = policyStructure.rows;
      }
    } catch (error) {
      console.log('PasswordPolicy table does not exist');
    }

    // Generate creation SQL if tables don't exist
    if (!healthReport.tables.passwordAudit.exists) {
      healthReport.schema.requiresCreation = true;
      healthReport.recommendations.push("Create PasswordAudit table for audit logging");
      healthReport.schema.sql.passwordAudit = `
        CREATE TABLE PasswordAudit (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          actionType TEXT NOT NULL,
          actionInitiatedBy TEXT NOT NULL,
          adminUserId TEXT,
          previousPasswordHash TEXT,
          newPasswordHash TEXT NOT NULL,
          changeReason TEXT,
          securityContext TEXT,
          ipAddress TEXT,
          userAgent TEXT,
          sessionId TEXT,
          isSuccessful INTEGER NOT NULL DEFAULT 1,
          errorMessage TEXT,
          passwordStrengthScore INTEGER,
          complianceFlags TEXT,
          notificationSent INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES User(id),
          FOREIGN KEY (adminUserId) REFERENCES User(id)
        );
      `;
    }

    if (!healthReport.tables.passwordPolicy.exists) {
      healthReport.schema.requiresCreation = true;
      healthReport.recommendations.push("Create PasswordPolicy table for policy management");
      healthReport.schema.sql.passwordPolicy = `
        CREATE TABLE PasswordPolicy (
          id TEXT PRIMARY KEY,
          policyName TEXT NOT NULL,
          description TEXT,
          minLength INTEGER NOT NULL DEFAULT 8,
          maxLength INTEGER NOT NULL DEFAULT 128,
          requireUppercase INTEGER NOT NULL DEFAULT 1,
          requireLowercase INTEGER NOT NULL DEFAULT 1,
          requireNumbers INTEGER NOT NULL DEFAULT 1,
          requireSpecialChars INTEGER NOT NULL DEFAULT 1,
          allowedSpecialChars TEXT NOT NULL DEFAULT '!@#$%^&*()_+-=[]{}|;:,.<>?',
          preventReuse INTEGER NOT NULL DEFAULT 5,
          expirationDays INTEGER,
          lockoutAttempts INTEGER NOT NULL DEFAULT 5,
          lockoutDuration INTEGER NOT NULL DEFAULT 1800,
          isActive INTEGER NOT NULL DEFAULT 1,
          appliesTo TEXT NOT NULL DEFAULT 'ALL',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `;
      
      // Also add default policy creation
      healthReport.schema.sql.passwordPolicy += `
        
        INSERT INTO PasswordPolicy (
          id, policyName, description, minLength, maxLength,
          requireUppercase, requireLowercase, requireNumbers, requireSpecialChars,
          allowedSpecialChars, preventReuse, lockoutAttempts, lockoutDuration,
          isActive, appliesTo, createdAt, updatedAt
        ) VALUES (
          'default_policy_' || substr(datetime('now'), 1, 19),
          'default_policy',
          'Default password policy for Intellego Platform',
          8, 128, 1, 1, 1, 1,
          '!@#$%^&*()_+-=[]{}|;:,.<>?', 5, 5, 1800,
          1, 'ALL',
          datetime('now'),
          datetime('now')
        );
      `;
    }

    // Test basic password functions if tables exist
    let functionalityTest = {
      tested: false,
      bcryptAvailable: false,
      policyCan: false,
      auditCanCreate: false
    };

    try {
      // Test if bcrypt is available
      const bcrypt = require('bcryptjs');
      const testHash = await bcrypt.hash('testpassword', 12);
      const testVerify = await bcrypt.compare('testpassword', testHash);
      functionalityTest.bcryptAvailable = testVerify;
      functionalityTest.tested = true;
    } catch (error) {
      console.error('bcrypt test failed:', error);
    }

    console.log('✅ Password management health check completed');
    
    return NextResponse.json({
      status: healthReport.schema.requiresCreation ? 'NEEDS_SETUP' : 'HEALTHY',
      ...healthReport,
      functionality: functionalityTest
    });

  } catch (error) {
    console.error('❌ Password health check failed:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check password management health'
    }, { status: 500 });
  }
}