#!/usr/bin/env node

/**
 * TEMPORARY PASSWORD SETTER FOR LOCAL TESTING
 * 
 * This script sets temporary passwords for specific students in the LOCAL SQLite database only.
 * It is designed for testing timezone interface fixes and should never be used on production.
 * 
 * Target Students:
 * 1. Mia Pleitel (EST-2025-031) - pleitelmia@gmail.com
 * 2. Bianca Nazareth Picone (EST-2025-078) - bncpicone@gmail.com
 * 
 * Temporary Password: "Testing123!"
 * Hashing: bcrypt with cost factor 12 (same as production)
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');

// Configuration
const TEMP_PASSWORD = 'Testing123!';
const BCRYPT_ROUNDS = 12;

// Target students for password reset
const TARGET_STUDENTS = [
  {
    studentId: 'EST-2025-031',
    email: 'pleitelmia@gmail.com',
    name: 'Mia Pleitel',
    expectedCourse: '4to C'
  },
  {
    studentId: 'EST-2025-078', 
    email: 'bncpicone@gmail.com',
    name: 'Bianca Nazareth Picone',
    expectedCourse: '5to A'
  }
];

// Local SQLite connection
const client = createClient({
  url: 'file:./prisma/data/intellego.db',
  intMode: "number"
});

// Logging functions
function logInfo(message, data = null) {
  console.log(`ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logSuccess(message, data = null) {
  console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logWarning(message, data = null) {
  console.log(`⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logError(message, error = null) {
  console.error(`❌ ${message}`, error ? error.message || error : '');
}

// Verify database accessibility
async function verifyDatabaseAccess() {
  try {
    logInfo('Verifying local SQLite database access...');
    
    const result = await client.execute('SELECT COUNT(*) as user_count FROM User WHERE role = ?', ['STUDENT']);
    const userCount = result.rows[0].user_count;
    
    logSuccess(`Database accessible. Found ${userCount} students in local database.`);
    return true;
  } catch (error) {
    logError('Failed to access local database:', error);
    return false;
  }
}

// Find student by email or studentId
async function findStudent(email, studentId) {
  try {
    const result = await client.execute(
      'SELECT id, name, email, studentId, academicYear, division, subjects FROM User WHERE email = ? OR studentId = ? LIMIT 1',
      [email, studentId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logError(`Error finding student ${email}:`, error);
    return null;
  }
}

// Hash password using bcrypt
async function hashPassword(password) {
  try {
    logInfo(`Hashing password with bcrypt (rounds: ${BCRYPT_ROUNDS})...`);
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    logSuccess('Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    logError('Failed to hash password:', error);
    throw error;
  }
}

// Update student password
async function updateStudentPassword(studentId, email, hashedPassword) {
  try {
    const result = await client.execute(
      'UPDATE User SET password = ?, updatedAt = ? WHERE (email = ? OR studentId = ?) AND role = ?',
      [hashedPassword, new Date().toISOString(), email, studentId, 'STUDENT']
    );
    
    if (result.rowsAffected > 0) {
      logSuccess(`Password updated for student: ${email} (${studentId})`);
      return true;
    } else {
      logWarning(`No rows affected for student: ${email} (${studentId})`);
      return false;
    }
  } catch (error) {
    logError(`Failed to update password for ${email}:`, error);
    return false;
  }
}

// Verify password was set correctly
async function verifyPasswordUpdate(email, password) {
  try {
    const result = await client.execute(
      'SELECT password FROM User WHERE email = ? LIMIT 1',
      [email]
    );
    
    if (result.rows.length === 0) {
      logError(`Student not found for verification: ${email}`);
      return false;
    }
    
    const storedHash = result.rows[0].password;
    const isValid = await bcrypt.compare(password, storedHash);
    
    if (isValid) {
      logSuccess(`Password verification successful for: ${email}`);
      return true;
    } else {
      logError(`Password verification failed for: ${email}`);
      return false;
    }
  } catch (error) {
    logError(`Error verifying password for ${email}:`, error);
    return false;
  }
}

// Main execution function
async function setTemporaryPasswords() {
  console.log('\n🔐 TEMPORARY PASSWORD SETTER - LOCAL DATABASE ONLY');
  console.log('=' * 60);
  
  try {
    // Step 1: Verify database access
    const dbAccessible = await verifyDatabaseAccess();
    if (!dbAccessible) {
      logError('Database not accessible. Exiting.');
      process.exit(1);
    }
    
    // Step 2: Hash the temporary password
    const hashedPassword = await hashPassword(TEMP_PASSWORD);
    
    // Step 3: Process each target student
    const results = [];
    
    for (const targetStudent of TARGET_STUDENTS) {
      logInfo(`\nProcessing student: ${targetStudent.name}`);
      console.log('-'.repeat(50));
      
      // Find student in database
      const foundStudent = await findStudent(targetStudent.email, targetStudent.studentId);
      
      if (!foundStudent) {
        logError(`Student not found: ${targetStudent.email} (${targetStudent.studentId})`);
        results.push({
          ...targetStudent,
          success: false,
          reason: 'Student not found in database'
        });
        continue;
      }
      
      // Log found student details
      logInfo('Found student:', {
        id: foundStudent.id,
        name: foundStudent.name,
        email: foundStudent.email,
        studentId: foundStudent.studentId,
        course: `${foundStudent.academicYear} ${foundStudent.division}`,
        subjects: foundStudent.subjects
      });
      
      // Update password
      const updateSuccess = await updateStudentPassword(
        targetStudent.studentId,
        targetStudent.email,
        hashedPassword
      );
      
      if (!updateSuccess) {
        results.push({
          ...targetStudent,
          success: false,
          reason: 'Failed to update password'
        });
        continue;
      }
      
      // Verify password was set correctly
      const verifySuccess = await verifyPasswordUpdate(targetStudent.email, TEMP_PASSWORD);
      
      results.push({
        ...targetStudent,
        success: verifySuccess,
        reason: verifySuccess ? 'Password set and verified successfully' : 'Password update failed verification',
        foundDetails: {
          id: foundStudent.id,
          name: foundStudent.name,
          course: `${foundStudent.academicYear} ${foundStudent.division}`
        }
      });
    }
    
    // Step 4: Summary report
    console.log('\n📋 OPERATION SUMMARY');
    console.log('=' * 60);
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    logInfo(`Total students processed: ${totalCount}`);
    logInfo(`Successful updates: ${successCount}`);
    logInfo(`Failed updates: ${totalCount - successCount}`);
    
    console.log('\n📝 DETAILED RESULTS:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Email: ${result.email}`);
      console.log(`   Student ID: ${result.studentId}`);
      console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   Reason: ${result.reason}`);
      if (result.foundDetails) {
        console.log(`   Course: ${result.foundDetails.course}`);
      }
    });
    
    // Step 5: Login instructions
    if (successCount > 0) {
      console.log('\n🔑 LOGIN CREDENTIALS FOR TESTING');
      console.log('=' * 60);
      console.log('Temporary password for all updated accounts: "Testing123!"');
      console.log('');
      
      results.filter(r => r.success).forEach(result => {
        console.log(`📧 ${result.email}`);
        console.log(`   Password: ${TEMP_PASSWORD}`);
        console.log(`   Student: ${result.name}`);
        console.log(`   Course: ${result.foundDetails?.course || 'Unknown'}`);
        console.log('');
      });
      
      console.log('⚠️  IMPORTANT NOTES:');
      console.log('• These are temporary passwords for LOCAL TESTING ONLY');
      console.log('• Passwords are set in LOCAL SQLite database only');
      console.log('• Production database is NOT affected');
      console.log('• Use these credentials to test timezone interface fixes');
      console.log('• Test at: http://localhost:3000/auth/signin');
    }
    
    // Step 6: Next steps
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Start local development server: npm run dev');
    console.log('2. Navigate to: http://localhost:3000/auth/signin');
    console.log('3. Login with the provided credentials');
    console.log('4. Test timezone interface functionality');
    console.log('5. Submit progress reports to verify data persistence');
    
    logSuccess('\nTemporary password setup completed!');
    
  } catch (error) {
    logError('Fatal error during password setup:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  setTemporaryPasswords()
    .then(() => {
      console.log('\n✨ Script execution completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logError('Script execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  setTemporaryPasswords,
  TARGET_STUDENTS,
  TEMP_PASSWORD
};