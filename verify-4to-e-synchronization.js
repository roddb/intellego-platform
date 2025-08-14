#!/usr/bin/env node

/**
 * SYNCHRONIZATION VERIFICATION SCRIPT: 4to E
 * 
 * This script compares the local SQLite database with the Turso production database
 * to ensure complete synchronization after applying the 4to E corrections.
 */

const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');

// Production database configuration
const prodClient = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

// Local database configuration
const localDbPath = path.join(__dirname, 'prisma/data/intellego.db');
let localDb;

async function main() {
  console.log('🔍 SYNCHRONIZATION VERIFICATION: 4to E');
  console.log('======================================');
  
  try {
    // Initialize local database
    localDb = new Database(localDbPath);
    
    // Get data from both databases
    const [localStudents, prodStudents] = await Promise.all([
      getLocalStudents(),
      getProductionStudents()
    ]);
    
    // Compare the data
    await compareStudents(localStudents, prodStudents);
    
    console.log('\n✅ SYNCHRONIZATION VERIFICATION COMPLETED');
    
  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error.message);
    process.exit(1);
  } finally {
    if (localDb) localDb.close();
    await prodClient.close();
  }
}

async function getLocalStudents() {
  console.log('📊 Fetching local 4to E students...');
  
  const students = localDb.prepare(`
    SELECT studentId, name, subjects, academicYear, division, sede 
    FROM User 
    WHERE academicYear = ? AND division = ? AND role = 'STUDENT'
    ORDER BY studentId
  `).all('4to Año', 'E');
  
  console.log(`  Local: ${students.length} students found`);
  return students;
}

async function getProductionStudents() {
  console.log('📊 Fetching production 4to E students...');
  
  const result = await prodClient.execute({
    sql: `SELECT studentId, name, subjects, academicYear, division, sede 
          FROM User 
          WHERE academicYear = ? AND division = ? AND role = 'STUDENT'
          ORDER BY studentId`,
    args: ['4to Año', 'E']
  });
  
  console.log(`  Production: ${result.rows.length} students found`);
  return result.rows;
}

async function compareStudents(localStudents, prodStudents) {
  console.log('\n🔄 Comparing local vs production data...');
  
  // Check counts
  if (localStudents.length !== prodStudents.length) {
    console.error(`❌ COUNT MISMATCH: Local=${localStudents.length}, Production=${prodStudents.length}`);
    return;
  }
  
  console.log(`✅ Student count matches: ${localStudents.length} students`);
  
  // Compare each student
  const discrepancies = [];
  
  for (let i = 0; i < localStudents.length; i++) {
    const local = localStudents[i];
    const prod = prodStudents[i];
    
    // Compare studentId
    if (local.studentId !== prod.studentId) {
      discrepancies.push({
        field: 'studentId',
        local: local.studentId,
        production: prod.studentId
      });
    }
    
    // Compare name
    if (local.name !== prod.name) {
      discrepancies.push({
        studentId: local.studentId,
        field: 'name',
        local: local.name,
        production: prod.name
      });
    }
    
    // Compare subjects
    if (local.subjects !== prod.subjects) {
      discrepancies.push({
        studentId: local.studentId,
        field: 'subjects',
        local: local.subjects,
        production: prod.subjects
      });
    }
  }
  
  if (discrepancies.length > 0) {
    console.log(`\n⚠️  DISCREPANCIES FOUND: ${discrepancies.length}`);
    discrepancies.forEach(disc => {
      console.log(`  - ${disc.studentId || 'Unknown'} (${disc.field}):`);
      console.log(`    Local: "${disc.local}"`);
      console.log(`    Production: "${disc.production}"`);
    });
  } else {
    console.log('\n🎉 PERFECT SYNCHRONIZATION CONFIRMED!');
  }
  
  // Verify specific corrections
  await verifyCorrections(localStudents, prodStudents);
}

async function verifyCorrections(localStudents, prodStudents) {
  console.log('\n🔧 Verifying specific corrections...');
  
  // 1. Check that ALL students have "Física,Química"
  const correctSubjectsLocal = localStudents.filter(s => s.subjects === 'Física,Química').length;
  const correctSubjectsProd = prodStudents.filter(s => s.subjects === 'Física,Química').length;
  
  console.log(`📚 Students with "Física,Química":`);
  console.log(`  Local: ${correctSubjectsLocal}/${localStudents.length}`);
  console.log(`  Production: ${correctSubjectsProd}/${prodStudents.length}`);
  
  if (correctSubjectsLocal === localStudents.length && correctSubjectsProd === prodStudents.length) {
    console.log('  ✅ All students have correct subjects');
  } else {
    console.log('  ❌ Some students have incorrect subjects');
  }
  
  // 2. Check for name formatting issues
  const nameIssuesLocal = localStudents.filter(s => s.name !== s.name.trim()).length;
  const nameIssuesProd = prodStudents.filter(s => s.name !== s.name.trim()).length;
  
  console.log(`✏️  Name formatting issues:`);
  console.log(`  Local: ${nameIssuesLocal}`);
  console.log(`  Production: ${nameIssuesProd}`);
  
  if (nameIssuesLocal === 0 && nameIssuesProd === 0) {
    console.log('  ✅ No name formatting issues in either database');
  } else {
    console.log('  ❌ Name formatting issues still exist');
  }
  
  // 3. Check specific capitalization fixes
  const capitalizationStudents = ['EST-2025-052', 'EST-2025-053'];
  const expectedNames = {
    'EST-2025-052': 'Enzo Shofs Turoni Lima',
    'EST-2025-053': 'Mateo Delaygue'
  };
  
  console.log(`🔤 Capitalization fixes:`);
  for (const studentId of capitalizationStudents) {
    const localStudent = localStudents.find(s => s.studentId === studentId);
    const prodStudent = prodStudents.find(s => s.studentId === studentId);
    const expectedName = expectedNames[studentId];
    
    if (localStudent && prodStudent) {
      const localCorrect = localStudent.name === expectedName;
      const prodCorrect = prodStudent.name === expectedName;
      
      console.log(`  ${studentId}:`);
      console.log(`    Local: "${localStudent.name}" ${localCorrect ? '✅' : '❌'}`);
      console.log(`    Production: "${prodStudent.name}" ${prodCorrect ? '✅' : '❌'}`);
    }
  }
  
  // Final summary
  const allCorrect = (
    correctSubjectsLocal === localStudents.length &&
    correctSubjectsProd === prodStudents.length &&
    nameIssuesLocal === 0 &&
    nameIssuesProd === 0
  );
  
  console.log('\n📊 CORRECTION STATUS:');
  console.log(allCorrect ? '🎉 ALL CORRECTIONS SUCCESSFULLY APPLIED AND SYNCHRONIZED!' : '⚠️  Some corrections may need attention');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}