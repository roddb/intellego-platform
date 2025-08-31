const { client, testConnection } = require('./turso-connection');
const fs = require('fs');
const path = require('path');

async function validateMigration() {
  console.log('🔍 Starting migration validation...\n');
  console.log('='.repeat(60));
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  const validation = {
    timestamp: new Date().toISOString(),
    checks: [],
    passed: true
  };
  
  try {
    // 1. Check Feedback table
    console.log('\n📊 1. VALIDATING FEEDBACK TABLE');
    console.log('─'.repeat(40));
    
    let feedbackCheck = { name: 'Feedback Table', status: 'pending', details: {} };
    
    try {
      // Check table exists
      const tableExists = await client.execute(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='Feedback'
      `);
      
      if (tableExists.rows.length > 0) {
        feedbackCheck.details.tableExists = true;
        console.log('   ✅ Feedback table exists');
        
        // Check structure
        const columns = await client.execute(`
          PRAGMA table_info(Feedback)
        `);
        feedbackCheck.details.columnCount = columns.rows.length;
        console.log(`   ✅ Table has ${columns.rows.length} columns`);
        
        // Check indexes
        const indexes = await client.execute(`
          SELECT name FROM sqlite_master 
          WHERE type='index' AND tbl_name='Feedback'
        `);
        feedbackCheck.details.indexCount = indexes.rows.length;
        console.log(`   ✅ ${indexes.rows.length} indexes created`);
        
        // Count records
        const recordCount = await client.execute(
          'SELECT COUNT(*) as count FROM Feedback'
        );
        feedbackCheck.details.recordCount = recordCount.rows[0].count;
        console.log(`   ℹ️  ${recordCount.rows[0].count} feedback records in table`);
        
        feedbackCheck.status = 'passed';
      } else {
        feedbackCheck.status = 'failed';
        feedbackCheck.details.error = 'Table does not exist';
        console.log('   ❌ Feedback table NOT found');
        validation.passed = false;
      }
    } catch (error) {
      feedbackCheck.status = 'failed';
      feedbackCheck.details.error = error.message;
      console.log(`   ❌ Error checking Feedback table: ${error.message}`);
      validation.passed = false;
    }
    
    validation.checks.push(feedbackCheck);
    
    // 2. Check timestamp normalization
    console.log('\n📊 2. VALIDATING TIMESTAMP NORMALIZATION');
    console.log('─'.repeat(40));
    
    let timestampCheck = { name: 'Timestamp Normalization', status: 'pending', details: {} };
    
    try {
      // Count different timestamp formats
      const totalReports = await client.execute(
        'SELECT COUNT(*) as count FROM ProgressReport'
      );
      timestampCheck.details.totalReports = totalReports.rows[0].count;
      console.log(`   ℹ️  Total progress reports: ${totalReports.rows[0].count}`);
      
      const buggyTimestamps = await client.execute(`
        SELECT COUNT(*) as count
        FROM ProgressReport
        WHERE weekStart LIKE '%T00:00:00.000Z'
      `);
      timestampCheck.details.buggyTimestamps = buggyTimestamps.rows[0].count;
      
      const correctTimestamps = await client.execute(`
        SELECT COUNT(*) as count
        FROM ProgressReport
        WHERE weekStart LIKE '%T03:00:00.000Z'
      `);
      timestampCheck.details.correctTimestamps = correctTimestamps.rows[0].count;
      
      const otherTimestamps = totalReports.rows[0].count - 
        buggyTimestamps.rows[0].count - 
        correctTimestamps.rows[0].count;
      timestampCheck.details.otherTimestamps = otherTimestamps;
      
      console.log(`   • T00:00:00.000Z (buggy): ${buggyTimestamps.rows[0].count}`);
      console.log(`   • T03:00:00.000Z (correct): ${correctTimestamps.rows[0].count}`);
      console.log(`   • Other formats: ${otherTimestamps}`);
      
      if (buggyTimestamps.rows[0].count === 0 && otherTimestamps === 0) {
        timestampCheck.status = 'passed';
        console.log('   ✅ All timestamps are normalized correctly!');
      } else if (buggyTimestamps.rows[0].count > 0) {
        timestampCheck.status = 'warning';
        console.log(`   ⚠️  ${buggyTimestamps.rows[0].count} timestamps still need normalization`);
      } else {
        timestampCheck.status = 'warning';
        console.log(`   ⚠️  ${otherTimestamps} timestamps have unexpected format`);
      }
      
      // Show distribution by week
      const weekDistribution = await client.execute(`
        SELECT 
          DATE(weekStart) as week,
          COUNT(*) as count
        FROM ProgressReport
        GROUP BY DATE(weekStart)
        ORDER BY week
      `);
      
      console.log('\n   Week distribution:');
      weekDistribution.rows.forEach(w => {
        console.log(`   • ${w.week}: ${w.count} reports`);
      });
      timestampCheck.details.weekDistribution = weekDistribution.rows;
      
    } catch (error) {
      timestampCheck.status = 'failed';
      timestampCheck.details.error = error.message;
      console.log(`   ❌ Error checking timestamps: ${error.message}`);
      validation.passed = false;
    }
    
    validation.checks.push(timestampCheck);
    
    // 3. Data integrity check
    console.log('\n📊 3. VALIDATING DATA INTEGRITY');
    console.log('─'.repeat(40));
    
    let integrityCheck = { name: 'Data Integrity', status: 'pending', details: {} };
    
    try {
      // Check user count
      const users = await client.execute(
        "SELECT COUNT(*) as count FROM User WHERE role = 'STUDENT'"
      );
      integrityCheck.details.studentCount = users.rows[0].count;
      console.log(`   ℹ️  Student users: ${users.rows[0].count}`);
      
      // Check for orphaned reports
      const orphanedReports = await client.execute(`
        SELECT COUNT(*) as count
        FROM ProgressReport pr
        LEFT JOIN User u ON pr.userId = u.id
        WHERE u.id IS NULL
      `);
      integrityCheck.details.orphanedReports = orphanedReports.rows[0].count;
      
      if (orphanedReports.rows[0].count === 0) {
        console.log('   ✅ No orphaned reports found');
      } else {
        console.log(`   ⚠️  ${orphanedReports.rows[0].count} orphaned reports found`);
      }
      
      // Check for duplicate reports
      const duplicates = await client.execute(`
        SELECT userId, weekStart, subject, COUNT(*) as count
        FROM ProgressReport
        GROUP BY userId, weekStart, subject
        HAVING COUNT(*) > 1
      `);
      integrityCheck.details.duplicateReports = duplicates.rows.length;
      
      if (duplicates.rows.length === 0) {
        console.log('   ✅ No duplicate reports found');
        integrityCheck.status = 'passed';
      } else {
        console.log(`   ⚠️  ${duplicates.rows.length} duplicate report combinations found`);
        integrityCheck.status = 'warning';
      }
      
    } catch (error) {
      integrityCheck.status = 'failed';
      integrityCheck.details.error = error.message;
      console.log(`   ❌ Error checking data integrity: ${error.message}`);
      validation.passed = false;
    }
    
    validation.checks.push(integrityCheck);
    
    // 4. Performance check
    console.log('\n📊 4. VALIDATING PERFORMANCE');
    console.log('─'.repeat(40));
    
    let performanceCheck = { name: 'Query Performance', status: 'pending', details: {} };
    
    try {
      // Test query performance
      const startTime = Date.now();
      
      await client.execute(`
        SELECT pr.*, u.name, u.email
        FROM ProgressReport pr
        JOIN User u ON pr.userId = u.id
        WHERE pr.weekStart >= '2025-08-01'
        ORDER BY pr.weekStart DESC
        LIMIT 100
      `);
      
      const queryTime = Date.now() - startTime;
      performanceCheck.details.complexQueryTime = queryTime;
      
      if (queryTime < 1000) {
        console.log(`   ✅ Complex query executed in ${queryTime}ms`);
        performanceCheck.status = 'passed';
      } else {
        console.log(`   ⚠️  Complex query took ${queryTime}ms (consider optimization)`);
        performanceCheck.status = 'warning';
      }
      
    } catch (error) {
      performanceCheck.status = 'failed';
      performanceCheck.details.error = error.message;
      console.log(`   ❌ Performance check failed: ${error.message}`);
    }
    
    validation.checks.push(performanceCheck);
    
    // Save validation report
    const reportPath = path.join(
      process.cwd(),
      `validation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(validation, null, 2));
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY\n');
    
    validation.checks.forEach(check => {
      const icon = check.status === 'passed' ? '✅' : 
                   check.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${check.name}: ${check.status.toUpperCase()}`);
    });
    
    console.log('\n' + '─'.repeat(60));
    
    if (validation.passed) {
      console.log('✅ ALL CRITICAL CHECKS PASSED!');
      console.log('   The migration has been validated successfully.');
    } else {
      console.log('❌ VALIDATION FAILED');
      console.log('   Some critical checks did not pass.');
      console.log('   Please review the report for details.');
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  validateMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { validateMigration };