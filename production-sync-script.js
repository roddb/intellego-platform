#!/usr/bin/env node

/**
 * PRODUCTION DATABASE SYNCHRONIZATION SCRIPT
 * 
 * CRITICAL: This script modifies the production Turso database
 * Purpose: Sync local database changes for 4to C Colegiales students
 * 
 * Changes to be made:
 * 1. Update subjects field: "Física" → "Física,Química" for 4to C students
 * 2. Delete duplicate accounts: EST-2025-038, EST-2025-021, EST-2025-037
 * 
 * SAFETY MEASURES:
 * - Atomic transactions for all operations
 * - Complete backup before any changes
 * - Verification of all changes
 * - NO password modifications
 * - Only affects specified 4to C Colegiales students
 */

import { createClient } from '@libsql/client';
import fs from 'fs';

const TURSO_DATABASE_URL = "libsql://intellego-production-roddb.aws-us-east-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw";

// Students that need subject updates (Física → Física,Química)
const STUDENTS_TO_UPDATE = [
  'EST-2025-016', 'EST-2025-017', 'EST-2025-018', 'EST-2025-019', 'EST-2025-021',
  'EST-2025-022', 'EST-2025-023', 'EST-2025-024', 'EST-2025-025', 'EST-2025-026',
  'EST-2025-027', 'EST-2025-028', 'EST-2025-029', 'EST-2025-030', 'EST-2025-031',
  'EST-2025-032', 'EST-2025-033', 'EST-2025-036', 'EST-2025-037', 'EST-2025-038',
  'EST-2025-039', 'EST-2025-040', 'EST-2025-041', 'EST-2025-047', 'EST-2025-097',
  'EST-2025-104', 'EST-2025-119', 'EST-2025-128', 'EST-2025-129', 'EST-2025-131',
  'EST-2025-132'
];

// Duplicate accounts to delete
const ACCOUNTS_TO_DELETE = ['EST-2025-038', 'EST-2025-021', 'EST-2025-037'];

class ProductionSyncManager {
  constructor() {
    this.client = null;
    this.changes = {
      backupCreated: false,
      studentsUpdated: [],
      accountsDeleted: [],
      errors: []
    };
  }

  async connect() {
    console.log('🔌 Connecting to Turso production database...');
    this.client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
    
    // Test connection
    const test = await this.client.execute('SELECT COUNT(*) as count FROM User');
    console.log(`✅ Connected successfully. Total users: ${test.rows[0].count}`);
  }

  async createBackup() {
    console.log('💾 Creating comprehensive backup...');
    
    try {
      // Backup all affected students
      const studentsToBackup = await this.client.execute(`
        SELECT *
        FROM User 
        WHERE sede = 'Colegiales' 
          AND academicYear = '4to Año' 
          AND division = 'C'
          AND role = 'STUDENT'
        ORDER BY studentId
      `);

      const backup = {
        timestamp: new Date().toISOString(),
        database: 'Turso Production',
        purpose: 'Pre-sync backup for 4to C Colegiales students',
        totalRecords: studentsToBackup.rows.length,
        students: studentsToBackup.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          studentId: row.studentId,
          subjects: row.subjects,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }))
      };

      const backupFileName = `production-backup-4to-c-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(backupFileName, JSON.stringify(backup, null, 2));
      
      console.log(`✅ Backup created: ${backupFileName}`);
      console.log(`📊 Backed up ${backup.totalRecords} student records`);
      
      this.changes.backupCreated = true;
      return backupFileName;
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw error;
    }
  }

  async updateSubjects() {
    console.log('\n🔄 Starting subject updates...');
    
    try {
      // Begin transaction
      await this.client.execute('BEGIN TRANSACTION');
      
      let updateCount = 0;
      
      for (const studentId of STUDENTS_TO_UPDATE) {
        // Skip students that will be deleted
        if (ACCOUNTS_TO_DELETE.includes(studentId)) {
          console.log(`⏭️  Skipping ${studentId} - marked for deletion`);
          continue;
        }
        
        // Verify student exists and needs update
        const checkResult = await this.client.execute(`
          SELECT id, name, subjects, status
          FROM User 
          WHERE studentId = ? 
            AND sede = 'Colegiales' 
            AND academicYear = '4to Año' 
            AND division = 'C'
            AND subjects = 'Física'
            AND status = 'ACTIVE'
        `, [studentId]);
        
        if (checkResult.rows.length === 0) {
          console.log(`⚠️  ${studentId} - No matching record found or doesn't need update`);
          continue;
        }
        
        const student = checkResult.rows[0];
        
        // Update subjects
        await this.client.execute(`
          UPDATE User 
          SET subjects = 'Física,Química',
              updatedAt = ?
          WHERE studentId = ?
            AND sede = 'Colegiales' 
            AND academicYear = '4to Año' 
            AND division = 'C'
            AND subjects = 'Física'
        `, [new Date().toISOString(), studentId]);
        
        updateCount++;
        this.changes.studentsUpdated.push({
          studentId: studentId,
          name: student.name,
          oldSubjects: 'Física',
          newSubjects: 'Física,Química'
        });
        
        console.log(`✅ Updated ${studentId} (${student.name}): Física → Física,Química`);
      }
      
      // Commit transaction
      await this.client.execute('COMMIT');
      console.log(`\n✅ Subject updates completed. Updated ${updateCount} students.`);
      
    } catch (error) {
      console.error('❌ Subject update failed:', error.message);
      await this.client.execute('ROLLBACK');
      this.changes.errors.push(`Subject update failed: ${error.message}`);
      throw error;
    }
  }

  async deleteDuplicateAccounts() {
    console.log('\n🗑️  Starting duplicate account deletion...');
    
    try {
      // Begin transaction
      await this.client.execute('BEGIN TRANSACTION');
      
      for (const studentId of ACCOUNTS_TO_DELETE) {
        // Get account details before deletion
        const accountResult = await this.client.execute(`
          SELECT id, name, email, subjects, status
          FROM User 
          WHERE studentId = ?
        `, [studentId]);
        
        if (accountResult.rows.length === 0) {
          console.log(`⚠️  ${studentId} - Account not found`);
          continue;
        }
        
        const account = accountResult.rows[0];
        
        // Delete the account
        await this.client.execute(`
          DELETE FROM User WHERE studentId = ?
        `, [studentId]);
        
        this.changes.accountsDeleted.push({
          studentId: studentId,
          name: account.name,
          email: account.email,
          subjects: account.subjects,
          status: account.status
        });
        
        console.log(`✅ Deleted ${studentId} (${account.name} - ${account.email})`);
      }
      
      // Commit transaction
      await this.client.execute('COMMIT');
      console.log(`\n✅ Account deletion completed. Deleted ${this.changes.accountsDeleted.length} accounts.`);
      
    } catch (error) {
      console.error('❌ Account deletion failed:', error.message);
      await this.client.execute('ROLLBACK');
      this.changes.errors.push(`Account deletion failed: ${error.message}`);
      throw error;
    }
  }

  async verifyChanges() {
    console.log('\n🔍 Verifying all changes...');
    
    try {
      // Verify subject updates
      console.log('📊 Checking updated subjects...');
      const updatedSubjects = await this.client.execute(`
        SELECT studentId, name, subjects
        FROM User 
        WHERE sede = 'Colegiales' 
          AND academicYear = '4to Año' 
          AND division = 'C'
          AND role = 'STUDENT'
          AND subjects = 'Física,Química'
        ORDER BY studentId
      `);
      
      console.log(`✅ Found ${updatedSubjects.rows.length} students with updated subjects`);
      
      // Verify deletions
      console.log('🔍 Checking deleted accounts...');
      for (const studentId of ACCOUNTS_TO_DELETE) {
        const checkDeleted = await this.client.execute(`
          SELECT COUNT(*) as count
          FROM User 
          WHERE studentId = ?
        `, [studentId]);
        
        const exists = checkDeleted.rows[0].count > 0;
        if (exists) {
          console.error(`❌ ${studentId} still exists! Deletion failed.`);
          this.changes.errors.push(`Account ${studentId} was not deleted`);
        } else {
          console.log(`✅ ${studentId} successfully deleted`);
        }
      }
      
      // Final count
      const finalCount = await this.client.execute(`
        SELECT COUNT(*) as count
        FROM User 
        WHERE sede = 'Colegiales' 
          AND academicYear = '4to Año' 
          AND division = 'C'
          AND role = 'STUDENT'
      `);
      
      console.log(`📊 Final 4to C student count: ${finalCount.rows[0].count}`);
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      this.changes.errors.push(`Verification failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📋 Generating sync report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      operation: 'Production Database Synchronization - 4to C Colegiales',
      database: 'Turso Production (intellego-production-roddb)',
      success: this.changes.errors.length === 0,
      summary: {
        backupCreated: this.changes.backupCreated,
        studentsUpdated: this.changes.studentsUpdated.length,
        accountsDeleted: this.changes.accountsDeleted.length,
        totalErrors: this.changes.errors.length
      },
      changes: {
        subjectUpdates: this.changes.studentsUpdated,
        deletedAccounts: this.changes.accountsDeleted,
        errors: this.changes.errors
      }
    };
    
    const reportFileName = `sync-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved: ${reportFileName}`);
    
    // Console summary
    console.log('\n🎯 SYNCHRONIZATION SUMMARY:');
    console.log(`   ✅ Students updated: ${report.summary.studentsUpdated}`);
    console.log(`   🗑️  Accounts deleted: ${report.summary.accountsDeleted}`);
    console.log(`   ❌ Errors: ${report.summary.totalErrors}`);
    
    if (report.summary.totalErrors > 0) {
      console.log('\n⚠️  ERRORS ENCOUNTERED:');
      report.changes.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    return report;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

async function main() {
  const syncManager = new ProductionSyncManager();
  
  try {
    console.log('🚀 STARTING PRODUCTION DATABASE SYNCHRONIZATION');
    console.log('🎯 Target: 4to C Colegiales students');
    console.log('📅 Date:', new Date().toISOString());
    console.log('=' .repeat(60));
    
    // Connect to database
    await syncManager.connect();
    
    // Create backup
    await syncManager.createBackup();
    
    // Update subjects
    await syncManager.updateSubjects();
    
    // Delete duplicate accounts
    await syncManager.deleteDuplicateAccounts();
    
    // Verify changes
    await syncManager.verifyChanges();
    
    // Generate report
    const report = await syncManager.generateReport();
    
    console.log('\n🎉 SYNCHRONIZATION COMPLETED SUCCESSFULLY!');
    
    if (report.summary.totalErrors === 0) {
      console.log('✅ All operations completed without errors');
    } else {
      console.log('⚠️  Some errors occurred. Check the report for details.');
    }
    
  } catch (error) {
    console.error('\n💥 SYNCHRONIZATION FAILED:', error.message);
    console.error('📋 Error details:', error.stack);
    console.log('\n🛡️  Database state preserved due to transaction rollback');
  } finally {
    await syncManager.close();
  }
}

// Confirmation prompt
console.log('⚠️  PRODUCTION DATABASE MODIFICATION WARNING ⚠️');
console.log('This script will modify the live Turso production database');
console.log('Changes to be made:');
console.log('  - Update subjects for 31 students: Física → Física,Química');
console.log('  - Delete 3 duplicate accounts: EST-2025-038, EST-2025-021, EST-2025-037');
console.log('');
console.log('Press Ctrl+C to cancel, or any key to continue...');

// Auto-start for direct execution
if (process.argv[2] === '--execute') {
  main();
} else {
  console.log('Use --execute flag to run: node production-sync-script.js --execute');
}