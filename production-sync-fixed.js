#!/usr/bin/env node

/**
 * PRODUCTION DATABASE SYNCHRONIZATION SCRIPT - FIXED VERSION
 * 
 * CRITICAL: This script modifies the production Turso database
 * Purpose: Sync local database changes for 4to C Colegiales students
 * 
 * Fixed for libSQL transaction handling
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
        
        // Update subjects (individual transaction per update for safety)
        try {
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
          
        } catch (updateError) {
          console.error(`❌ Failed to update ${studentId}: ${updateError.message}`);
          this.changes.errors.push(`Update failed for ${studentId}: ${updateError.message}`);
        }
      }
      
      console.log(`\n✅ Subject updates completed. Updated ${updateCount} students.`);
      
    } catch (error) {
      console.error('❌ Subject update process failed:', error.message);
      this.changes.errors.push(`Subject update process failed: ${error.message}`);
      throw error;
    }
  }

  async deleteDuplicateAccounts() {
    console.log('\n🗑️  Starting duplicate account deletion...');
    
    try {
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
        
        try {
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
          
        } catch (deleteError) {
          console.error(`❌ Failed to delete ${studentId}: ${deleteError.message}`);
          this.changes.errors.push(`Deletion failed for ${studentId}: ${deleteError.message}`);
        }
      }
      
      console.log(`\n✅ Account deletion completed. Deleted ${this.changes.accountsDeleted.length} accounts.`);
      
    } catch (error) {
      console.error('❌ Account deletion process failed:', error.message);
      this.changes.errors.push(`Account deletion process failed: ${error.message}`);
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
      
      // Show final subject distribution
      const subjectDistribution = await this.client.execute(`
        SELECT subjects, COUNT(*) as count
        FROM User 
        WHERE sede = 'Colegiales' 
          AND academicYear = '4to Año' 
          AND division = 'C'
          AND role = 'STUDENT'
        GROUP BY subjects
        ORDER BY count DESC
      `);
      
      console.log('📈 Subject distribution after sync:');
      subjectDistribution.rows.forEach((row) => {
        console.log(`   "${row.subjects}": ${row.count} students`);
      });
      
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
    console.log('🚀 STARTING PRODUCTION DATABASE SYNCHRONIZATION - FIXED VERSION');
    console.log('🎯 Target: 4to C Colegiales students');
    console.log('📅 Date:', new Date().toISOString());
    console.log('🔧 Fixed: libSQL transaction handling');
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
    
    console.log('\n🎉 SYNCHRONIZATION COMPLETED!');
    
    if (report.summary.totalErrors === 0) {
      console.log('✅ All operations completed successfully without errors');
    } else {
      console.log(`⚠️  ${report.summary.totalErrors} errors occurred. Check the report for details.`);
      console.log('💡 Partial success: Some operations may have completed successfully');
    }
    
  } catch (error) {
    console.error('\n💥 SYNCHRONIZATION PROCESS FAILED:', error.message);
    console.error('📋 Error details:', error.stack);
  } finally {
    await syncManager.close();
  }
}

// Confirmation prompt
console.log('⚠️  PRODUCTION DATABASE MODIFICATION WARNING ⚠️');
console.log('This script will modify the live Turso production database');
console.log('Changes to be made:');
console.log('  - Update subjects for ~28 students: Física → Física,Química');
console.log('  - Delete 3 duplicate accounts: EST-2025-038, EST-2025-021, EST-2025-037');
console.log('');

// Auto-start for direct execution
if (process.argv[2] === '--execute') {
  main();
} else {
  console.log('Use --execute flag to run: node production-sync-fixed.js --execute');
}