/**
 * INVESTIGATE 5to AÑO SUBJECTS REGISTRATION ISSUE
 * Specific investigation to understand why all students show "Invalid subjects JSON"
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'data', 'intellego.db');

console.log('🔍 INVESTIGATING 5to AÑO SUBJECTS ISSUE');
console.log('=========================================');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to local SQLite database\n');
});

// Check the actual structure and content of subjects field
async function investigateSubjectsField() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        name,
        studentId,
        division,
        subjects,
        typeof(subjects) as subjects_type,
        length(subjects) as subjects_length
      FROM User 
      WHERE academicYear = '5to Año' 
        AND division IN ('A', 'B', 'D')
        AND role = 'STUDENT'
        AND status = 'ACTIVE'
      ORDER BY division, name
      LIMIT 10
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('📊 SUBJECTS FIELD ANALYSIS (Sample of 10 students):');
      console.log('=====================================================');
      
      rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ${row.name} (5to ${row.division})`);
        console.log(`   Student ID: ${row.studentId}`);
        console.log(`   Subjects Field: ${row.subjects}`);
        console.log(`   Subjects Type: ${row.subjects_type}`);
        console.log(`   Subjects Length: ${row.subjects_length}`);
        
        // Try to understand the actual content
        if (row.subjects === null) {
          console.log(`   Analysis: NULL value`);
        } else if (row.subjects === '') {
          console.log(`   Analysis: Empty string`);
        } else {
          console.log(`   Analysis: Contains data - "${row.subjects}"`);
          
          // Try to parse it
          try {
            const parsed = JSON.parse(row.subjects);
            console.log(`   Parsed Successfully: ${JSON.stringify(parsed)}`);
          } catch (e) {
            console.log(`   Parse Error: ${e.message}`);
          }
        }
      });

      resolve(rows);
    });
  });
}

// Check what subjects are being submitted in reports
async function checkReportSubjects() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT 
        pr.subject,
        u.division,
        COUNT(*) as report_count
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE u.academicYear = '5to Año' 
        AND u.division IN ('A', 'B', 'D')
        AND u.role = 'STUDENT'
        AND u.status = 'ACTIVE'
      GROUP BY pr.subject, u.division
      ORDER BY u.division, pr.subject
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('\n📈 ACTUAL REPORT SUBJECTS BY COURSE:');
      console.log('====================================');
      
      const courseSubjects = {};
      rows.forEach(row => {
        if (!courseSubjects[row.division]) {
          courseSubjects[row.division] = [];
        }
        courseSubjects[row.division].push({
          subject: row.subject,
          reports: row.report_count
        });
      });

      Object.keys(courseSubjects).sort().forEach(division => {
        console.log(`\n🎓 5to ${division}:`);
        courseSubjects[division].forEach(item => {
          console.log(`   - ${item.subject}: ${item.reports} reports`);
        });
      });

      resolve(courseSubjects);
    });
  });
}

// Check if this is a systematic issue across all 5to students
async function checkAllUsers5to() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN subjects IS NULL THEN 1 END) as null_subjects,
        COUNT(CASE WHEN subjects = '' THEN 1 END) as empty_subjects,
        COUNT(CASE WHEN subjects IS NOT NULL AND subjects != '' THEN 1 END) as has_subjects
      FROM User 
      WHERE academicYear = '5to Año' 
        AND division IN ('A', 'B', 'D')
        AND role = 'STUDENT'
        AND status = 'ACTIVE'
    `;

    db.get(query, [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('\n📊 SUBJECTS FIELD STATISTICS:');
      console.log('============================');
      console.log(`Total 5to Students: ${row.total_count}`);
      console.log(`NULL subjects field: ${row.null_subjects}`);
      console.log(`Empty subjects field: ${row.empty_subjects}`);
      console.log(`Has subjects data: ${row.has_subjects}`);

      if (row.has_subjects === 0) {
        console.log('\n⚠️  CRITICAL FINDING: NO students have subjects data!');
        console.log('This indicates a systematic registration issue.');
      }

      resolve(row);
    });
  });
}

// Compare with 4to courses to see if it's a year-specific issue
async function compareWith4to() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        academicYear,
        COUNT(*) as total_count,
        COUNT(CASE WHEN subjects IS NULL THEN 1 END) as null_subjects,
        COUNT(CASE WHEN subjects = '' THEN 1 END) as empty_subjects,
        COUNT(CASE WHEN subjects IS NOT NULL AND subjects != '' THEN 1 END) as has_subjects
      FROM User 
      WHERE academicYear IN ('4to Año', '5to Año')
        AND role = 'STUDENT'
        AND status = 'ACTIVE'
      GROUP BY academicYear
      ORDER BY academicYear
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('\n📊 COMPARISON: 4to vs 5to SUBJECTS REGISTRATION:');
      console.log('================================================');
      
      rows.forEach(row => {
        console.log(`\n${row.academicYear}:`);
        console.log(`   Total Students: ${row.total_count}`);
        console.log(`   NULL subjects: ${row.null_subjects} (${((row.null_subjects/row.total_count)*100).toFixed(1)}%)`);
        console.log(`   Empty subjects: ${row.empty_subjects} (${((row.empty_subjects/row.total_count)*100).toFixed(1)}%)`);
        console.log(`   Has subjects: ${row.has_subjects} (${((row.has_subjects/row.total_count)*100).toFixed(1)}%)`);
      });

      resolve(rows);
    });
  });
}

// Main execution
async function runInvestigation() {
  try {
    console.log('🚀 Starting subjects field investigation...\n');
    
    await investigateSubjectsField();
    await checkReportSubjects();
    await checkAllUsers5to();
    await compareWith4to();
    
    console.log('\n✅ INVESTIGATION COMPLETE');
    console.log('========================');
    console.log('Key findings will help identify the root cause of subjects registration issue.');
    
  } catch (error) {
    console.error('\n❌ INVESTIGATION ERROR:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('📚 Database connection closed.');
      }
    });
  }
}

runInvestigation();