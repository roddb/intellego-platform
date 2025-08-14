/**
 * Production 4to D Corrections Script
 * Applies the same corrections made locally to the Turso production database
 * CRITICAL: This operates on live production data
 */

import { createClient } from '@libsql/client';

// Production database configuration
const client = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

// Salvador Veltri accounts to skip (as requested by user)
const SKIP_ACCOUNTS = ['EST-2025-072', 'EST-2025-077'];

async function verifyCurrentState() {
  console.log('=== VERIFYING CURRENT STATE OF 4TO D IN PRODUCTION ===');
  
  try {
    const result = await client.execute(`
      SELECT studentId, name, subjects, sede, academicYear, division
      FROM User 
      WHERE academicYear = '4to Año' AND division = 'D'
      ORDER BY name
    `);
    
    console.log(`\nTotal 4to D students found: ${result.rows.length}`);
    console.log('\nCurrent state:');
    
    const studentsData = [];
    result.rows.forEach(row => {
      const data = {
        studentId: row.studentId,
        name: row.name,
        subjects: row.subjects,
        sede: row.sede,
        nameHasTrailingSpace: row.name?.toString().endsWith(' '),
        needsCapitalization: row.name?.toString().toLowerCase() === row.name?.toString()
      };
      studentsData.push(data);
      
      console.log(`- ${data.studentId}: "${data.name}" | Subjects: ${data.subjects} | Issues: ${[
        data.nameHasTrailingSpace ? 'trailing space' : null,
        data.needsCapitalization ? 'capitalization' : null,
        data.subjects === 'Física' || data.subjects === 'Química' ? 'incomplete subjects' : null
      ].filter(Boolean).join(', ') || 'none'}`);
    });
    
    return studentsData;
  } catch (error) {
    console.error('Error verifying current state:', error);
    throw error;
  }
}

async function updateSubjects(studentsData) {
  console.log('\n=== UPDATING SUBJECTS FOR 4TO D STUDENTS ===');
  
  const studentsToUpdate = studentsData.filter(student => {
    if (SKIP_ACCOUNTS.includes(student.studentId)) {
      console.log(`⏭️  Skipping ${student.studentId} (Salvador Veltri account)`);
      return false;
    }
    return student.subjects === 'Física' || student.subjects === 'Química';
  });
  
  if (studentsToUpdate.length === 0) {
    console.log('No students need subject updates');
    return [];
  }
  
  console.log(`\nUpdating subjects for ${studentsToUpdate.length} students:`);
  
  const updates = [];
  
  for (const student of studentsToUpdate) {
    try {
      console.log(`Updating ${student.studentId}: "${student.name}" from "${student.subjects}" to "Física,Química"`);
      
      await client.execute({
        sql: `UPDATE User SET subjects = ?, updatedAt = datetime('now') 
              WHERE studentId = ? AND academicYear = '4to Año' AND division = 'D'`,
        args: ['Física,Química', student.studentId]
      });
      
      updates.push({
        studentId: student.studentId,
        name: student.name,
        oldSubjects: student.subjects,
        newSubjects: 'Física,Química'
      });
      
      console.log(`✅ Updated ${student.studentId}`);
    } catch (error) {
      console.error(`❌ Error updating ${student.studentId}:`, error);
      throw error;
    }
  }
  
  return updates;
}

async function fixNameFormatting(studentsData) {
  console.log('\n=== FIXING NAME FORMATTING ISSUES ===');
  
  const studentsToFix = studentsData.filter(student => {
    if (SKIP_ACCOUNTS.includes(student.studentId)) {
      return false;
    }
    return student.nameHasTrailingSpace || student.needsCapitalization;
  });
  
  if (studentsToFix.length === 0) {
    console.log('No students need name formatting fixes');
    return [];
  }
  
  console.log(`\nFixing name formatting for ${studentsToFix.length} students:`);
  
  const nameUpdates = [];
  
  for (const student of studentsToFix) {
    try {
      let fixedName = student.name.toString().trim();
      
      // Special case for mia gonzalez arce -> Mia Gonzalez Arce
      if (fixedName.toLowerCase() === 'mia gonzalez arce') {
        fixedName = 'Mia Gonzalez Arce';
      } else {
        // Proper case formatting: first letter of each word capitalized
        fixedName = fixedName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      }
      
      if (fixedName !== student.name) {
        console.log(`Updating ${student.studentId}: "${student.name}" -> "${fixedName}"`);
        
        await client.execute({
          sql: `UPDATE User SET name = ?, updatedAt = datetime('now') 
                WHERE studentId = ? AND academicYear = '4to Año' AND division = 'D'`,
          args: [fixedName, student.studentId]
        });
        
        nameUpdates.push({
          studentId: student.studentId,
          oldName: student.name,
          newName: fixedName
        });
        
        console.log(`✅ Fixed name for ${student.studentId}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing name for ${student.studentId}:`, error);
      throw error;
    }
  }
  
  return nameUpdates;
}

async function verifyUpdates() {
  console.log('\n=== VERIFYING UPDATES ===');
  
  try {
    const result = await client.execute(`
      SELECT studentId, name, subjects
      FROM User 
      WHERE academicYear = '4to Año' AND division = 'D'
      ORDER BY name
    `);
    
    console.log(`\nFinal state - Total 4to D students: ${result.rows.length}`);
    
    let allCorrect = true;
    const summary = {
      total: result.rows.length,
      correctSubjects: 0,
      skippedAccounts: 0,
      issues: []
    };
    
    result.rows.forEach(row => {
      const isSkipped = SKIP_ACCOUNTS.includes(row.studentId);
      if (isSkipped) {
        summary.skippedAccounts++;
        console.log(`- ${row.studentId}: "${row.name}" | Subjects: ${row.subjects} | Status: SKIPPED (Salvador Veltri)`);
      } else {
        const hasCorrectSubjects = row.subjects === 'Física,Química';
        const nameFormatted = !row.name.toString().endsWith(' ') && row.name.toString() !== row.name.toString().toLowerCase();
        
        if (hasCorrectSubjects) summary.correctSubjects++;
        
        const status = [];
        if (!hasCorrectSubjects) {
          status.push('INCORRECT SUBJECTS');
          summary.issues.push(`${row.studentId}: wrong subjects`);
          allCorrect = false;
        }
        if (!nameFormatted) {
          status.push('NAME FORMAT ISSUE');
          summary.issues.push(`${row.studentId}: name format`);
          allCorrect = false;
        }
        if (status.length === 0) status.push('OK');
        
        console.log(`- ${row.studentId}: "${row.name}" | Subjects: ${row.subjects} | Status: ${status.join(', ')}`);
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total students: ${summary.total}`);
    console.log(`Students with correct subjects: ${summary.correctSubjects}`);
    console.log(`Skipped accounts: ${summary.skippedAccounts}`);
    console.log(`Expected students with Física,Química: ${summary.total - summary.skippedAccounts}`);
    console.log(`All updates successful: ${allCorrect ? '✅ YES' : '❌ NO'}`);
    
    if (summary.issues.length > 0) {
      console.log('\nRemaining issues:');
      summary.issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    return { allCorrect, summary };
    
  } catch (error) {
    console.error('Error verifying updates:', error);
    throw error;
  }
}

async function main() {
  console.log('🚨 PRODUCTION 4TO D CORRECTIONS - TURSO DATABASE');
  console.log('⚠️  WARNING: This operates on live production data');
  console.log(`⏭️  Will skip Salvador Veltri accounts: ${SKIP_ACCOUNTS.join(', ')}`);
  console.log('');
  
  try {
    // Step 1: Verify current state
    const studentsData = await verifyCurrentState();
    
    // Step 2: Update subjects
    const subjectUpdates = await updateSubjects(studentsData);
    
    // Step 3: Fix name formatting
    const nameUpdates = await fixNameFormatting(studentsData);
    
    // Step 4: Verify all updates
    const verification = await verifyUpdates();
    
    // Final summary
    console.log('\n=== OPERATION COMPLETE ===');
    console.log(`Subjects updated: ${subjectUpdates.length} students`);
    console.log(`Names fixed: ${nameUpdates.length} students`);
    console.log(`All corrections applied: ${verification.allCorrect ? '✅ YES' : '❌ NO'}`);
    
    if (subjectUpdates.length > 0) {
      console.log('\nSubject updates applied:');
      subjectUpdates.forEach(update => {
        console.log(`- ${update.studentId}: ${update.oldSubjects} -> ${update.newSubjects}`);
      });
    }
    
    if (nameUpdates.length > 0) {
      console.log('\nName formatting fixes applied:');
      nameUpdates.forEach(update => {
        console.log(`- ${update.studentId}: "${update.oldName}" -> "${update.newName}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ OPERATION FAILED:', error);
    process.exit(1);
  }
}

// Execute the script
main();