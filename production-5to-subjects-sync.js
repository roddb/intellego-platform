/**
 * Production Database Subject Synchronization Script
 * Applies subject corrections for 5to Año students to Turso production database
 * 
 * TARGET CORRECTIONS:
 * - 5to A: All students -> "Física,Química"  
 * - 5to B: All students -> "Química"
 * - 5to D: All students -> "Química"
 */

import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

// ANSI color codes for better output readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection() {
  try {
    colorLog('cyan', '🔗 Testing Turso production database connection...');
    const result = await client.execute('SELECT COUNT(*) as total FROM User');
    const userCount = result.rows[0].total;
    colorLog('green', `✅ Connection successful! Total users: ${userCount}`);
    return true;
  } catch (error) {
    colorLog('red', `❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function getCurrentState() {
  try {
    colorLog('blue', '\n📊 CHECKING CURRENT STATE IN PRODUCTION...');
    
    // Query current 5to Año students by division
    const divisions = ['A', 'B', 'D'];
    const currentState = {};
    
    for (const division of divisions) {
      const result = await client.execute({
        sql: `SELECT studentId, name, subjects 
              FROM User 
              WHERE academicYear = '5to Año' AND division = ?
              ORDER BY name`,
        args: [division]
      });
      
      currentState[division] = result.rows;
      colorLog('yellow', `📍 5to ${division}: ${result.rows.length} students found`);
      
      // Show current subject assignments
      const subjectCounts = {};
      result.rows.forEach(student => {
        const subjects = student.subjects || 'NULL';
        subjectCounts[subjects] = (subjectCounts[subjects] || 0) + 1;
      });
      
      Object.entries(subjectCounts).forEach(([subjects, count]) => {
        console.log(`   - "${subjects}": ${count} students`);
      });
    }
    
    return currentState;
  } catch (error) {
    colorLog('red', `❌ Error checking current state: ${error.message}`);
    throw error;
  }
}

async function applySubjectCorrections() {
  try {
    colorLog('magenta', '\n🔄 APPLYING SUBJECT CORRECTIONS...');
    
    const corrections = [
      { division: 'A', subjects: 'Física,Química', description: 'All 5to A students -> Física,Química' },
      { division: 'B', subjects: 'Química', description: 'All 5to B students -> Química' },
      { division: 'D', subjects: 'Química', description: 'All 5to D students -> Química' }
    ];
    
    const results = [];
    
    for (const correction of corrections) {
      colorLog('blue', `\n📝 Processing 5to ${correction.division}...`);
      colorLog('white', `   Target: ${correction.description}`);
      
      try {
        // Execute update within a transaction
        const result = await client.execute({
          sql: `UPDATE User 
                SET subjects = ?, updatedAt = datetime('now', 'localtime')
                WHERE academicYear = '5to Año' AND division = ?`,
          args: [correction.subjects, correction.division]
        });
        
        const updatedCount = result.rowsAffected;
        colorLog('green', `   ✅ Updated ${updatedCount} students in 5to ${correction.division}`);
        
        results.push({
          division: correction.division,
          targetSubjects: correction.subjects,
          studentsUpdated: updatedCount,
          status: 'success'
        });
        
      } catch (error) {
        colorLog('red', `   ❌ Failed to update 5to ${correction.division}: ${error.message}`);
        results.push({
          division: correction.division,
          targetSubjects: correction.subjects,
          studentsUpdated: 0,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    colorLog('red', `❌ Error applying corrections: ${error.message}`);
    throw error;
  }
}

async function verifyFinalState() {
  try {
    colorLog('cyan', '\n🔍 VERIFYING FINAL STATE...');
    
    const divisions = ['A', 'B', 'D'];
    const expectedSubjects = {
      'A': 'Física,Química',
      'B': 'Química', 
      'D': 'Química'
    };
    
    let allCorrect = true;
    const verificationResults = [];
    
    for (const division of divisions) {
      const result = await client.execute({
        sql: `SELECT studentId, name, subjects 
              FROM User 
              WHERE academicYear = '5to Año' AND division = ?
              ORDER BY name`,
        args: [division]
      });
      
      const students = result.rows;
      const expected = expectedSubjects[division];
      const incorrectStudents = students.filter(s => s.subjects !== expected);
      
      colorLog('blue', `\n📋 5to ${division} Verification:`);
      colorLog('white', `   Expected: "${expected}"`);
      colorLog('white', `   Total students: ${students.length}`);
      
      if (incorrectStudents.length === 0) {
        colorLog('green', `   ✅ ALL students have correct subjects`);
      } else {
        colorLog('red', `   ❌ ${incorrectStudents.length} students have incorrect subjects:`);
        incorrectStudents.forEach(student => {
          console.log(`      - ${student.studentId} (${student.name}): "${student.subjects}"`);
        });
        allCorrect = false;
      }
      
      verificationResults.push({
        division,
        expected,
        totalStudents: students.length,
        correctStudents: students.length - incorrectStudents.length,
        incorrectStudents: incorrectStudents.length,
        isCorrect: incorrectStudents.length === 0
      });
    }
    
    return { allCorrect, results: verificationResults };
  } catch (error) {
    colorLog('red', `❌ Error verifying final state: ${error.message}`);
    throw error;
  }
}

async function generateSummaryReport(initialState, updateResults, finalVerification) {
  colorLog('magenta', '\n📄 PRODUCTION SYNCHRONIZATION SUMMARY REPORT');
  colorLog('magenta', '='.repeat(55));
  
  console.log('\n🎯 TARGET CORRECTIONS APPLIED:');
  updateResults.forEach(result => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${status} 5to ${result.division}: ${result.studentsUpdated} students -> "${result.targetSubjects}"`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  console.log('\n🔍 FINAL VERIFICATION:');
  finalVerification.results.forEach(result => {
    const status = result.isCorrect ? '✅' : '❌';
    console.log(`   ${status} 5to ${result.division}: ${result.correctStudents}/${result.totalStudents} correct`);
  });
  
  const overallStatus = finalVerification.allCorrect ? 'SUCCESS' : 'NEEDS ATTENTION';
  const statusColor = finalVerification.allCorrect ? 'green' : 'red';
  
  colorLog(statusColor, `\n🏁 OVERALL STATUS: ${overallStatus}`);
  
  if (finalVerification.allCorrect) {
    colorLog('green', '✅ Production database successfully synchronized!');
    colorLog('green', '✅ All 5to Año students have correct subject assignments');
  } else {
    colorLog('red', '❌ Some students still have incorrect subjects - manual review needed');
  }
  
  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    updatesApplied: updateResults,
    finalVerification: finalVerification.results
  };
}

async function main() {
  try {
    colorLog('white', '🚀 STARTING PRODUCTION 5TO AÑO SUBJECT SYNCHRONIZATION');
    colorLog('white', '='.repeat(60));
    
    // 1. Test connection
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
    
    // 2. Check current state
    const initialState = await getCurrentState();
    
    // 3. Apply corrections
    const updateResults = await applySubjectCorrections();
    
    // 4. Verify final state
    const finalVerification = await verifyFinalState();
    
    // 5. Generate summary report
    const summaryReport = await generateSummaryReport(initialState, updateResults, finalVerification);
    
    // Save report to file
    const reportData = {
      scriptName: 'production-5to-subjects-sync.js',
      executionTime: new Date().toISOString(),
      database: 'Turso Production',
      operation: '5to Año Subject Corrections',
      initialState,
      updateResults,
      finalVerification,
      summaryReport
    };
    
    const fs = await import('fs');
    const reportPath = './production-5to-subjects-sync-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    colorLog('cyan', `\n📁 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    colorLog('red', `\n💥 CRITICAL ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close database connection
    client.close();
    colorLog('blue', '\n🔐 Database connection closed');
  }
}

// Execute the script
main().catch(console.error);