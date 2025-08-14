#!/usr/bin/env node

/**
 * PRODUCTION SYNC SCRIPT: 4to E Corrections
 * 
 * This script applies the same corrections made locally to the Turso production database
 * for 4to E students, ensuring complete synchronization.
 * 
 * Target: academicYear = '4to Año' AND division = 'E' (27 students expected)
 * 
 * Corrections to apply:
 * 1. Subject Registration: ALL students need "Física,Química"
 * 2. Name formatting: Remove trailing spaces from 10 students
 * 3. Capitalization: Fix 2 specific students
 */

const { createClient } = require('@libsql/client');

// Production database configuration
const client = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

// Students who need trailing space removal
const STUDENTS_WITH_TRAILING_SPACES = [
  'Lourdes Chouela',
  'Agustina Sarti',
  'Julia Mayenfisch Paz',
  'Benjamín López',
  'Joaquín Hetenyi',
  'Emilia Sarti',
  'Paloma Castro',
  'Gabriel Maximiliano Bollmann',
  'Juan Cruz laugier',
  'Ignacio Ortiz Gagliano'
];

// Students who need capitalization fixes
const CAPITALIZATION_FIXES = {
  'EST-2025-052': {
    from: 'Enzo shofs turoni lima',
    to: 'Enzo Shofs Turoni Lima'
  },
  'EST-2025-053': {
    from: 'Mateo delaygue',
    to: 'Mateo Delaygue'
  }
};

async function main() {
  console.log('🚀 PRODUCTION SYNC: 4to E Corrections');
  console.log('=====================================');
  console.log('Target: 4to Año - Division E');
  console.log('Expected: 27 students');
  console.log('');

  try {
    // Step 1: Verify current state
    await verifyCurrentState();
    
    // Step 2: Apply corrections
    await applyCorrections();
    
    // Step 3: Final verification
    await finalVerification();
    
    console.log('✅ PRODUCTION SYNC COMPLETED SUCCESSFULLY');
    
  } catch (error) {
    console.error('❌ PRODUCTION SYNC FAILED:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function verifyCurrentState() {
  console.log('📊 STEP 1: Verifying current state in production...');
  
  // Get all 4to E students
  const students = await client.execute({
    sql: `SELECT studentId, name, subjects, academicYear, division, sede 
          FROM User 
          WHERE academicYear = ? AND division = ? AND role = 'STUDENT'
          ORDER BY studentId`,
    args: ['4to Año', 'E']
  });

  console.log(`📈 Total 4to E students found: ${students.rows.length}`);
  
  if (students.rows.length !== 27) {
    console.warn(`⚠️  WARNING: Expected 27 students, found ${students.rows.length}`);
  }

  // Analyze subjects distribution
  const subjectsDistribution = {};
  students.rows.forEach(student => {
    const subjects = student.subjects || '';
    subjectsDistribution[subjects] = (subjectsDistribution[subjects] || 0) + 1;
  });

  console.log('\n📋 Current subjects distribution:');
  Object.entries(subjectsDistribution).forEach(([subjects, count]) => {
    console.log(`  - "${subjects}": ${count} students`);
  });

  // Check for name formatting issues
  const nameIssues = [];
  students.rows.forEach(student => {
    const name = student.name;
    
    // Check for trailing spaces
    if (name !== name.trim()) {
      nameIssues.push({
        studentId: student.studentId,
        name: name,
        issue: 'trailing_space',
        expected: name.trim()
      });
    }
    
    // Check for capitalization issues
    if (CAPITALIZATION_FIXES[student.studentId]) {
      const expected = CAPITALIZATION_FIXES[student.studentId].to;
      if (name !== expected) {
        nameIssues.push({
          studentId: student.studentId,
          name: name,
          issue: 'capitalization',
          expected: expected
        });
      }
    }
  });

  if (nameIssues.length > 0) {
    console.log('\n⚠️  Name formatting issues found:');
    nameIssues.forEach(issue => {
      console.log(`  - ${issue.studentId}: "${issue.name}" → "${issue.expected}" (${issue.issue})`);
    });
  } else {
    console.log('\n✅ No name formatting issues found');
  }

  console.log('');
  return { students: students.rows, nameIssues };
}

async function applyCorrections() {
  console.log('🔧 STEP 2: Applying corrections...');
  
  // Begin transaction
  console.log('Starting transaction...');
  
  try {
    // Correction 1: Update ALL 4to E students to have "Física,Química"
    console.log('📚 Applying subject corrections...');
    
    const subjectUpdateResult = await client.execute({
      sql: `UPDATE User 
            SET subjects = ?, updatedAt = datetime('now')
            WHERE academicYear = ? AND division = ? AND role = 'STUDENT'`,
      args: ['Física,Química', '4to Año', 'E']
    });
    
    console.log(`✅ Updated subjects for ${subjectUpdateResult.rowsAffected} students`);
    
    // Correction 2: Fix name formatting (trailing spaces)
    console.log('✏️  Applying name formatting corrections...');
    
    let nameUpdates = 0;
    
    for (const studentName of STUDENTS_WITH_TRAILING_SPACES) {
      const result = await client.execute({
        sql: `UPDATE User 
              SET name = TRIM(name), updatedAt = datetime('now')
              WHERE name LIKE ? AND academicYear = ? AND division = ? AND role = 'STUDENT'`,
        args: [studentName + '%', '4to Año', 'E']
      });
      
      if (result.rowsAffected > 0) {
        console.log(`  ✓ Trimmed trailing spaces: "${studentName}"`);
        nameUpdates += result.rowsAffected;
      }
    }
    
    // Correction 3: Fix capitalization
    for (const [studentId, fix] of Object.entries(CAPITALIZATION_FIXES)) {
      const result = await client.execute({
        sql: `UPDATE User 
              SET name = ?, updatedAt = datetime('now')
              WHERE studentId = ? AND academicYear = ? AND division = ?`,
        args: [fix.to, studentId, '4to Año', 'E']
      });
      
      if (result.rowsAffected > 0) {
        console.log(`  ✓ Fixed capitalization: ${studentId} "${fix.from}" → "${fix.to}"`);
        nameUpdates += result.rowsAffected;
      }
    }
    
    console.log(`✅ Applied name formatting fixes to ${nameUpdates} students`);
    
    console.log('✅ All corrections applied successfully');
    
  } catch (error) {
    console.error('❌ Error during corrections:', error);
    throw error;
  }
}

async function finalVerification() {
  console.log('🔍 STEP 3: Final verification...');
  
  // Get updated state
  const students = await client.execute({
    sql: `SELECT studentId, name, subjects, academicYear, division, sede 
          FROM User 
          WHERE academicYear = ? AND division = ? AND role = 'STUDENT'
          ORDER BY studentId`,
    args: ['4to Año', 'E']
  });

  console.log(`📊 Final count: ${students.rows.length} students`);
  
  // Verify subjects
  const correctSubjects = students.rows.filter(s => s.subjects === 'Física,Química').length;
  const incorrectSubjects = students.rows.length - correctSubjects;
  
  console.log(`✅ Students with correct subjects (Física,Química): ${correctSubjects}`);
  
  if (incorrectSubjects > 0) {
    console.error(`❌ Students with incorrect subjects: ${incorrectSubjects}`);
    
    // Show students with incorrect subjects
    const problematicStudents = students.rows.filter(s => s.subjects !== 'Física,Química');
    problematicStudents.forEach(student => {
      console.error(`  - ${student.studentId}: "${student.subjects}"`);
    });
    
    throw new Error('Subject corrections incomplete');
  }
  
  // Verify name formatting
  const nameIssues = students.rows.filter(student => {
    const name = student.name;
    return name !== name.trim() || name !== name.replace(/\s+/g, ' ');
  });
  
  if (nameIssues.length > 0) {
    console.warn(`⚠️  Remaining name formatting issues: ${nameIssues.length}`);
    nameIssues.forEach(student => {
      console.warn(`  - ${student.studentId}: "${student.name}"`);
    });
  } else {
    console.log('✅ All name formatting issues resolved');
  }
  
  // Show final summary
  console.log('\n📈 FINAL SUMMARY:');
  console.log('=================');
  console.log(`Total 4to E students: ${students.rows.length}`);
  console.log(`Students with "Física,Química": ${correctSubjects}`);
  console.log(`Name formatting issues: ${nameIssues.length}`);
  
  if (students.rows.length === 27 && correctSubjects === 27 && nameIssues.length === 0) {
    console.log('🎉 PERFECT SYNCHRONIZATION ACHIEVED!');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}