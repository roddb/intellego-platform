#!/usr/bin/env node

/**
 * Analyze 4to C Colegiales students in production database
 */

import { createClient } from '@libsql/client';

const TURSO_DATABASE_URL = "libsql://intellego-production-roddb.aws-us-east-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw";

async function analyzeStudents() {
  try {
    console.log('🔍 Analyzing 4to C Colegiales students in production database...\n');
    
    const client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    // Find all 4to C Colegiales students
    console.log('📊 Finding 4to C Colegiales students...');
    const studentsResult = await client.execute(`
      SELECT id, name, email, studentId, subjects, status
      FROM User 
      WHERE sede = 'Colegiales' 
        AND academicYear = '4to Año' 
        AND division = 'C'
        AND role = 'STUDENT'
      ORDER BY studentId
    `);

    console.log(`\n✅ Found ${studentsResult.rows.length} 4to C Colegiales students:\n`);
    
    let needsSubjectUpdate = 0;
    let duplicateAccounts = [];
    
    studentsResult.rows.forEach((student, index) => {
      const status = student.status === 'ACTIVE' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   StudentID: ${student.studentId}`);
      console.log(`   Subjects: "${student.subjects}"`);
      console.log(`   Status: ${student.status}`);
      
      // Check if subject needs update
      if (student.subjects === "Física" && student.status === 'ACTIVE') {
        needsSubjectUpdate++;
        console.log(`   🔄 NEEDS UPDATE: Física → Física,Química`);
      }
      
      // Check for duplicate accounts to delete
      if (['EST-2025-038', 'EST-2025-021', 'EST-2025-037'].includes(student.studentId)) {
        duplicateAccounts.push(student);
        console.log(`   🗑️  NEEDS DELETION: Duplicate/inactive account`);
      }
      
      console.log('');
    });

    // Check for specific duplicate student IDs
    console.log('🔍 Checking for duplicate student accounts...\n');
    const duplicateCheck = await client.execute(`
      SELECT studentId, COUNT(*) as count, GROUP_CONCAT(status) as statuses
      FROM User 
      WHERE sede = 'Colegiales' 
        AND academicYear = '4to Año' 
        AND division = 'C'
        AND role = 'STUDENT'
      GROUP BY studentId
      HAVING count > 1
      ORDER BY studentId
    `);

    if (duplicateCheck.rows.length > 0) {
      console.log(`❌ Found ${duplicateCheck.rows.length} duplicate studentIds:`);
      duplicateCheck.rows.forEach((row) => {
        console.log(`   ${row.studentId}: ${row.count} accounts (${row.statuses})`);
      });
    } else {
      console.log('✅ No duplicate studentIds found');
    }

    console.log('\n📋 SUMMARY:');
    console.log(`   Total 4to C students: ${studentsResult.rows.length}`);
    console.log(`   Students needing subject update: ${needsSubjectUpdate}`);
    console.log(`   Duplicate accounts to delete: ${duplicateAccounts.length}`);
    
    if (duplicateAccounts.length > 0) {
      console.log('\n🗑️  Accounts to be deleted:');
      duplicateAccounts.forEach((account) => {
        console.log(`   - ${account.studentId} (${account.name}) - Status: ${account.status}`);
      });
    }

    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

analyzeStudents();