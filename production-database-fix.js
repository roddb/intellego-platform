#!/usr/bin/env node

/**
 * Production Database Fix Script
 * Fixes 4to C student data inconsistencies in Turso production database
 * 
 * WARNING: This script operates on PRODUCTION data
 */

const { createClient } = require('@libsql/client');

const TURSO_URL = 'libsql://intellego-production-roddb.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw';

// Initialize Turso client
const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

/**
 * Log function for detailed tracking
 */
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Execute query with error handling
 */
async function executeQuery(sql, params = []) {
  try {
    log(`Executing query: ${sql}`);
    if (params.length > 0) {
      log(`Parameters:`, params);
    }
    const result = await client.execute({ sql, args: params });
    log(`Query successful. Rows affected: ${result.changes || 0}`);
    return result;
  } catch (error) {
    log(`Query error: ${error.message}`);
    throw error;
  }
}

/**
 * Step 1: Examine current state of 4to C students
 */
async function examineCurrentState() {
  log('=== STEP 1: EXAMINING CURRENT STATE ===');
  
  // Get all 4to C students (division='C', academicYear='4to Año', sede='Colegiales')
  const students = await executeQuery(`
    SELECT id, name, email, studentId, sede, academicYear, division, subjects, status
    FROM User 
    WHERE division = 'C' AND academicYear = '4to Año' AND sede = 'Colegiales'
    ORDER BY name
  `);
  
  log(`Found ${students.rows.length} students in 4to C`);
  
  // Check for test user
  const testUser = await executeQuery(`
    SELECT id, name, email, studentId
    FROM User 
    WHERE id = 'cmdxovtsx0000le04793gasa2'
  `);
  
  if (testUser.rows.length > 0) {
    log('Test user EST-2025-001 found:', testUser.rows[0]);
  } else {
    log('Test user EST-2025-001 not found');
  }
  
  // Analyze subjects distribution
  const subjectAnalysis = students.rows.reduce((acc, student) => {
    const subjects = student.subjects || '';
    if (!acc[subjects]) {
      acc[subjects] = [];
    }
    acc[subjects].push({
      name: student.name,
      studentId: student.studentId,
      id: student.id
    });
    return acc;
  }, {});
  
  log('Subjects distribution analysis:', subjectAnalysis);
  
  return { students: students.rows, testUser: testUser.rows[0] || null, subjectAnalysis };
}

/**
 * Step 2: Check related data for test user
 */
async function checkTestUserData(testUserId) {
  if (!testUserId) {
    log('No test user to check');
    return null;
  }
  
  log('=== STEP 2: CHECKING TEST USER RELATED DATA ===');
  
  const progressReports = await executeQuery(`
    SELECT id, weekStart, weekEnd, subject, submittedAt
    FROM ProgressReport 
    WHERE userId = ?
  `, [testUserId]);
  
  const answers = await executeQuery(`
    SELECT a.id, a.questionId, a.progressReportId, a.answer
    FROM Answer a
    JOIN ProgressReport pr ON a.progressReportId = pr.id
    WHERE pr.userId = ?
  `, [testUserId]);
  
  const relatedData = {
    progressReports: progressReports.rows.length,
    answers: answers.rows.length
  };
  
  log('Test user related data counts:', relatedData);
  
  return relatedData;
}

/**
 * Step 3: Delete test user and all related data
 */
async function deleteTestUser(testUserId) {
  if (!testUserId) {
    log('No test user to delete');
    return;
  }
  
  log('=== STEP 3: DELETING TEST USER AND RELATED DATA ===');
  
  try {
    // Start transaction
    await executeQuery('BEGIN TRANSACTION');
    
    // Delete in correct order (foreign key constraints)
    
    // 1. Delete answers first (references ProgressReport)
    await executeQuery(`
      DELETE FROM Answer 
      WHERE progressReportId IN (
        SELECT id FROM ProgressReport WHERE userId = ?
      )
    `, [testUserId]);
    
    // 2. Delete progress reports
    await executeQuery(`
      DELETE FROM ProgressReport 
      WHERE userId = ?
    `, [testUserId]);
    
    // 3. Finally delete the user
    await executeQuery(`
      DELETE FROM User 
      WHERE id = ?
    `, [testUserId]);
    
    // Commit transaction
    await executeQuery('COMMIT');
    
    log('Test user and all related data successfully deleted');
    
  } catch (error) {
    log('Error during deletion, rolling back transaction');
    await executeQuery('ROLLBACK');
    throw error;
  }
}

/**
 * Step 4: Update subjects for incomplete students
 */
async function updateIncompleteStudents() {
  log('=== STEP 4: UPDATING STUDENTS WITH INCOMPLETE SUBJECTS ===');
  
  // Students that need both "Física,Química" (with exact names from database)
  const studentsToUpdate = [
    'Juliana Ceriani Cernadas',
    'Miranda  Lazaro',  // Note: extra space in database
    'lola perri',
    'zoe poggi '       // Note: trailing space in database
  ];
  
  log(`Updating subjects for ${studentsToUpdate.length} students`);
  
  for (const studentName of studentsToUpdate) {
    try {
      // First check current subjects
      const current = await executeQuery(`
        SELECT id, name, subjects
        FROM User 
        WHERE name = ? AND division = 'C' AND academicYear = '4to Año' AND sede = 'Colegiales'
      `, [studentName]);
      
      if (current.rows.length === 0) {
        log(`Warning: Student ${studentName} not found`);
        continue;
      }
      
      const student = current.rows[0];
      log(`Current subjects for ${studentName}: "${student.subjects}"`);
      
      // Update to "Física,Química"
      await executeQuery(`
        UPDATE User 
        SET subjects = 'Física,Química',
            updatedAt = datetime('now')
        WHERE id = ?
      `, [student.id]);
      
      log(`Updated ${studentName} subjects to "Física,Química"`);
      
    } catch (error) {
      log(`Error updating ${studentName}: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Step 5: Verify final state
 */
async function verifyFinalState() {
  log('=== STEP 5: VERIFYING FINAL STATE ===');
  
  // Count total 4to C students
  const totalCount = await executeQuery(`
    SELECT COUNT(*) as count
    FROM User 
    WHERE division = 'C' AND academicYear = '4to Año' AND sede = 'Colegiales'
  `);
  
  log(`Total 4to C students: ${totalCount.rows[0].count}`);
  
  // Check subjects distribution
  const subjectsCheck = await executeQuery(`
    SELECT subjects, COUNT(*) as count
    FROM User 
    WHERE division = 'C' AND academicYear = '4to Año' AND sede = 'Colegiales'
    GROUP BY subjects
    ORDER BY subjects
  `);
  
  log('Final subjects distribution:');
  subjectsCheck.rows.forEach(row => {
    log(`  "${row.subjects}": ${row.count} students`);
  });
  
  // Verify test user is gone
  const testUserCheck = await executeQuery(`
    SELECT COUNT(*) as count
    FROM User 
    WHERE id = 'cmdxovtsx0000le04793gasa2'
  `);
  
  log(`Test user still exists: ${testUserCheck.rows[0].count > 0 ? 'YES' : 'NO'}`);
  
  return {
    totalStudents: totalCount.rows[0].count,
    subjectsDistribution: subjectsCheck.rows,
    testUserExists: testUserCheck.rows[0].count > 0
  };
}

/**
 * Main execution function
 */
async function main() {
  try {
    log('=== PRODUCTION DATABASE FIX STARTING ===');
    log('WARNING: Operating on PRODUCTION data');
    
    // Step 1: Examine current state
    const currentState = await examineCurrentState();
    
    // Step 2: Check test user data
    const testUserData = await checkTestUserData(currentState.testUser?.id);
    
    // Step 3: Delete test user
    if (currentState.testUser) {
      await deleteTestUser(currentState.testUser.id);
    }
    
    // Step 4: Update incomplete students
    await updateIncompleteStudents();
    
    // Step 5: Verify final state
    const finalState = await verifyFinalState();
    
    // Generate summary
    log('=== FINAL SUMMARY ===');
    log(`Initial 4to C students: ${currentState.students.length}`);
    log(`Final 4to C students: ${finalState.totalStudents}`);
    log(`Test user deleted: ${currentState.testUser ? 'YES' : 'N/A'}`);
    log('Final subjects distribution:', finalState.subjectsDistribution);
    
    if (finalState.totalStudents === 32) {
      log('✅ SUCCESS: Exactly 32 students in 4to C');
    } else {
      log('⚠️  WARNING: Student count is not 32');
    }
    
    // Check if all students have "Física,Química"
    const correctSubjects = finalState.subjectsDistribution.find(
      row => row.subjects === 'Física,Química'
    );
    
    if (correctSubjects && correctSubjects.count === 32) {
      log('✅ SUCCESS: All 32 students have "Física,Química" subjects');
    } else {
      log('⚠️  WARNING: Not all students have correct subjects');
    }
    
    log('=== PRODUCTION DATABASE FIX COMPLETED ===');
    
  } catch (error) {
    log('FATAL ERROR:', error.message);
    log('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = { main };