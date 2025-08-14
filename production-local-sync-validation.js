/**
 * Production-Local Database Synchronization Validation
 * Compares 5to Año student subjects between production and local databases
 * Ensures complete synchronization after subject corrections
 */

import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

// Production database connection
const productionClient = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

// Local database connection
const localDbPath = path.join(process.cwd(), 'prisma', 'data', 'intellego.db');
let localDb;

// ANSI color codes
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

async function connectToDatabases() {
  try {
    colorLog('cyan', '🔗 Connecting to databases...');
    
    // Test production connection
    const prodTest = await productionClient.execute('SELECT COUNT(*) as total FROM User');
    colorLog('green', `✅ Production DB: ${prodTest.rows[0].total} total users`);
    
    // Connect to local database
    localDb = new Database(localDbPath);
    const localTest = localDb.prepare('SELECT COUNT(*) as total FROM User').get();
    colorLog('green', `✅ Local DB: ${localTest.total} total users`);
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function getProductionStudents() {
  try {
    const divisions = ['A', 'B', 'D'];
    const students = {};
    
    for (const division of divisions) {
      const result = await productionClient.execute({
        sql: `SELECT studentId, name, subjects, division
              FROM User 
              WHERE academicYear = '5to Año' AND division = ?
              ORDER BY studentId`,
        args: [division]
      });
      students[division] = result.rows;
    }
    
    return students;
  } catch (error) {
    colorLog('red', `❌ Error fetching production students: ${error.message}`);
    throw error;
  }
}

function getLocalStudents() {
  try {
    const divisions = ['A', 'B', 'D'];
    const students = {};
    
    for (const division of divisions) {
      const query = localDb.prepare(`
        SELECT studentId, name, subjects, division
        FROM User 
        WHERE academicYear = '5to Año' AND division = ?
        ORDER BY studentId
      `);
      students[division] = query.all(division);
    }
    
    return students;
  } catch (error) {
    colorLog('red', `❌ Error fetching local students: ${error.message}`);
    throw error;
  }
}

function compareStudents(productionStudents, localStudentsData) {
  colorLog('blue', '\n🔍 COMPARING PRODUCTION VS LOCAL DATABASES...');
  
  const divisions = ['A', 'B', 'D'];
  const expectedSubjects = {
    'A': 'Física,Química',
    'B': 'Química',
    'D': 'Química'
  };
  
  let allSynchronized = true;
  const comparisonResults = {};
  
  for (const division of divisions) {
    colorLog('yellow', `\n📋 Division 5to ${division}:`);
    const expected = expectedSubjects[division];
    
    const prodStudents = productionStudents[division] || [];
    const localStudents = localStudentsData[division] || [];
    
    // Create maps for easier comparison
    const prodMap = new Map(prodStudents.map(s => [s.studentId, s]));
    const localMap = new Map(localStudents.map(s => [s.studentId, s]));
    
    // Find differences
    const onlyInProd = prodStudents.filter(s => !localMap.has(s.studentId));
    const onlyInLocal = localStudents.filter(s => !prodMap.has(s.studentId));
    const subjectMismatches = [];
    
    // Check common students for subject mismatches
    for (const [studentId, prodStudent] of prodMap) {
      const localStudent = localMap.get(studentId);
      if (localStudent && prodStudent.subjects !== localStudent.subjects) {
        subjectMismatches.push({
          studentId,
          name: prodStudent.name,
          production: prodStudent.subjects,
          local: localStudent.subjects
        });
      }
    }
    
    // Validate subjects against expected values
    const prodIncorrect = prodStudents.filter(s => s.subjects !== expected);
    const localIncorrect = localStudents.filter(s => s.subjects !== expected);
    
    const results = {
      division,
      expected,
      production: {
        total: prodStudents.length,
        correct: prodStudents.length - prodIncorrect.length,
        incorrect: prodIncorrect.length
      },
      local: {
        total: localStudents.length,
        correct: localStudents.length - localIncorrect.length,
        incorrect: localIncorrect.length
      },
      differences: {
        onlyInProd: onlyInProd.length,
        onlyInLocal: onlyInLocal.length,
        subjectMismatches: subjectMismatches.length
      },
      synchronized: onlyInProd.length === 0 && onlyInLocal.length === 0 && subjectMismatches.length === 0,
      bothCorrect: prodIncorrect.length === 0 && localIncorrect.length === 0
    };
    
    // Display results
    console.log(`   Expected subjects: "${expected}"`);
    console.log(`   Production: ${results.production.correct}/${results.production.total} correct`);
    console.log(`   Local: ${results.local.correct}/${results.local.total} correct`);
    
    if (results.synchronized && results.bothCorrect) {
      colorLog('green', `   ✅ SYNCHRONIZED & CORRECT`);
    } else {
      colorLog('red', `   ❌ ISSUES FOUND:`);
      if (!results.synchronized) {
        if (onlyInProd.length > 0) {
          console.log(`      - ${onlyInProd.length} students only in production`);
        }
        if (onlyInLocal.length > 0) {
          console.log(`      - ${onlyInLocal.length} students only in local`);
        }
        if (subjectMismatches.length > 0) {
          console.log(`      - ${subjectMismatches.length} subject mismatches`);
          subjectMismatches.forEach(mismatch => {
            console.log(`        * ${mismatch.studentId}: Prod="${mismatch.production}" vs Local="${mismatch.local}"`);
          });
        }
      }
      if (!results.bothCorrect) {
        if (prodIncorrect.length > 0) {
          console.log(`      - ${prodIncorrect.length} incorrect subjects in production`);
        }
        if (localIncorrect.length > 0) {
          console.log(`      - ${localIncorrect.length} incorrect subjects in local`);
        }
      }
      allSynchronized = false;
    }
    
    comparisonResults[division] = results;
  }
  
  return { allSynchronized, comparisonResults };
}

function generateFinalReport(comparisonResults, allSynchronized) {
  colorLog('magenta', '\n📄 SYNCHRONIZATION VALIDATION REPORT');
  colorLog('magenta', '='.repeat(50));
  
  console.log('\n🎯 TARGET STATE (After Corrections):');
  console.log('   - 5to A: All students -> "Física,Química"');
  console.log('   - 5to B: All students -> "Química"');
  console.log('   - 5to D: All students -> "Química"');
  
  console.log('\n📊 SYNCHRONIZATION STATUS:');
  Object.entries(comparisonResults).forEach(([division, results]) => {
    const syncStatus = results.synchronized ? '✅ SYNC' : '❌ DIFF';
    const correctStatus = results.bothCorrect ? '✅ CORRECT' : '❌ INCORRECT';
    console.log(`   5to ${division}: ${syncStatus} ${correctStatus} (Prod: ${results.production.total}, Local: ${results.local.total})`);
  });
  
  const overallStatus = allSynchronized ? 'SUCCESS' : 'NEEDS ATTENTION';
  const statusColor = allSynchronized ? 'green' : 'red';
  
  colorLog(statusColor, `\n🏁 OVERALL STATUS: ${overallStatus}`);
  
  if (allSynchronized) {
    colorLog('green', '✅ Production and local databases are fully synchronized!');
    colorLog('green', '✅ All 5to Año students have correct subject assignments');
    colorLog('green', '✅ Mission accomplished - both databases match perfectly');
  } else {
    colorLog('red', '❌ Databases are not fully synchronized - manual review needed');
  }
  
  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    allSynchronized,
    comparisonResults
  };
}

async function main() {
  try {
    colorLog('white', '🚀 PRODUCTION-LOCAL SYNCHRONIZATION VALIDATION');
    colorLog('white', '='.repeat(55));
    
    // Connect to databases
    const connected = await connectToDatabases();
    if (!connected) {
      process.exit(1);
    }
    
    // Fetch students from both databases
    colorLog('blue', '\n📥 Fetching student data...');
    const productionStudents = await getProductionStudents();
    const localStudents = getLocalStudents();
    
    // Compare databases
    const { allSynchronized, comparisonResults } = compareStudents(productionStudents, localStudents);
    
    // Generate final report
    const finalReport = generateFinalReport(comparisonResults, allSynchronized);
    
    // Save validation report
    const reportData = {
      scriptName: 'production-local-sync-validation.js',
      executionTime: new Date().toISOString(),
      operation: 'Production-Local Synchronization Validation',
      productionStudents,
      localStudents,
      comparisonResults,
      finalReport
    };
    
    const fs = await import('fs');
    const reportPath = './production-local-sync-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    colorLog('cyan', `\n📁 Validation report saved to: ${reportPath}`);
    
  } catch (error) {
    colorLog('red', `\n💥 CRITICAL ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close database connections
    if (productionClient) {
      productionClient.close();
    }
    if (localDb) {
      localDb.close();
    }
    colorLog('blue', '\n🔐 Database connections closed');
  }
}

// Execute the validation
main().catch(console.error);