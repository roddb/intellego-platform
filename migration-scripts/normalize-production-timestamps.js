const { client, testConnection } = require('./turso-connection');
const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--execute');
const BATCH_SIZE = 50;

async function normalizeTimestamps() {
  console.log('🔄 Starting timestamp normalization in production...\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE'}\n`);
  
  if (!DRY_RUN) {
    console.log('⚠️  WARNING: This will modify production data!');
    console.log('Make sure you have a backup before proceeding.\n');
  }
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'DRY_RUN' : 'EXECUTE',
    changes: [],
    summary: {}
  };
  
  try {
    // 1. Analyze current state
    console.log('📊 Analyzing current timestamps...\n');
    
    const buggyReports = await client.execute(`
      SELECT id, weekStart, weekEnd, userId, subject
      FROM ProgressReport
      WHERE weekStart LIKE '%T00:00:00.000Z'
      ORDER BY weekStart
    `);
    
    const correctReports = await client.execute(`
      SELECT COUNT(*) as count
      FROM ProgressReport
      WHERE weekStart LIKE '%T03:00:00.000Z'
    `);
    
    const totalReports = await client.execute(
      'SELECT COUNT(*) as count FROM ProgressReport'
    );
    
    console.log(`   • Total reports: ${totalReports.rows[0].count}`);
    console.log(`   • Reports with bug (T00:00:00.000Z): ${buggyReports.rows.length}`);
    console.log(`   • Reports already correct (T03:00:00.000Z): ${correctReports.rows[0].count}`);
    console.log(`   • Other formats: ${totalReports.rows[0].count - buggyReports.rows.length - correctReports.rows[0].count}\n`);
    
    if (buggyReports.rows.length === 0) {
      console.log('✅ No timestamps need normalization. All are correct!');
      return;
    }
    
    // 2. Prepare updates
    console.log('📋 Preparing updates...\n');
    
    const updates = [];
    const weekCounts = {};
    
    for (const report of buggyReports.rows) {
      const date = report.weekStart.split('T')[0];
      const newWeekStart = date + 'T03:00:00.000Z';
      
      // Calculate correct weekEnd (Sunday 23:59:59 = Monday 02:59:59 UTC)
      const weekEndDate = new Date(date);
      weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);
      weekEndDate.setUTCHours(2, 59, 59, 999);
      const newWeekEnd = weekEndDate.toISOString();
      
      updates.push({
        id: report.id,
        userId: report.userId,
        subject: report.subject,
        oldWeekStart: report.weekStart,
        oldWeekEnd: report.weekEnd,
        newWeekStart: newWeekStart,
        newWeekEnd: newWeekEnd
      });
      
      // Count by week
      if (!weekCounts[date]) {
        weekCounts[date] = 0;
      }
      weekCounts[date]++;
    }
    
    // Show distribution
    console.log('   Distribution by week:');
    Object.entries(weekCounts).sort().forEach(([week, count]) => {
      console.log(`   • ${week}: ${count} reports`);
    });
    
    // 3. Show examples
    console.log('\n📋 Example updates (first 3):');
    updates.slice(0, 3).forEach(u => {
      console.log(`\n   Report ID: ${u.id}`);
      console.log(`   Subject: ${u.subject}`);
      console.log(`   weekStart: ${u.oldWeekStart} → ${u.newWeekStart}`);
      console.log(`   weekEnd:   ${u.oldWeekEnd} → ${u.newWeekEnd}`);
    });
    
    if (DRY_RUN) {
      // Save dry run report
      report.summary = {
        totalReports: totalReports.rows[0].count,
        reportsToUpdate: updates.length,
        reportsAlreadyCorrect: correctReports.rows[0].count,
        distributionByWeek: weekCounts
      };
      report.changes = updates;
      
      const reportPath = path.join(
        process.cwd(),
        `normalize-dryrun-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      );
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n' + '='.repeat(60));
      console.log('🔍 DRY RUN COMPLETED');
      console.log(`   • ${updates.length} reports would be updated`);
      console.log(`   • Report saved to: ${reportPath}`);
      console.log('\n   To apply changes, run with --execute flag');
      console.log('='.repeat(60));
      
      return;
    }
    
    // 4. Apply updates in batches
    console.log(`\n⚙️  Applying updates in batches of ${BATCH_SIZE}...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, Math.min(i + BATCH_SIZE, updates.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
      
      console.log(`   Processing batch ${batchNum}/${totalBatches} (${batch.length} records)...`);
      
      try {
        // Create batch update statements
        const statements = batch.map(u => ({
          sql: 'UPDATE ProgressReport SET weekStart = ?, weekEnd = ? WHERE id = ?',
          args: [u.newWeekStart, u.newWeekEnd, u.id]
        }));
        
        // Execute batch
        await client.batch(statements);
        
        successCount += batch.length;
        console.log(`   ✅ Batch ${batchNum} completed successfully`);
        
      } catch (error) {
        errorCount += batch.length;
        errors.push({
          batch: batchNum,
          error: error.message,
          records: batch.map(b => b.id)
        });
        console.log(`   ❌ Batch ${batchNum} failed: ${error.message}`);
      }
    }
    
    // 5. Verify results
    console.log('\n🔍 Verifying results...\n');
    
    const finalBuggy = await client.execute(`
      SELECT COUNT(*) as count
      FROM ProgressReport
      WHERE weekStart LIKE '%T00:00:00.000Z'
    `);
    
    const finalCorrect = await client.execute(`
      SELECT COUNT(*) as count
      FROM ProgressReport
      WHERE weekStart LIKE '%T03:00:00.000Z'
    `);
    
    const finalTotal = await client.execute(
      'SELECT COUNT(*) as count FROM ProgressReport'
    );
    
    console.log('   Final state:');
    console.log(`   • Total reports: ${finalTotal.rows[0].count}`);
    console.log(`   • Reports with T00:00:00.000Z: ${finalBuggy.rows[0].count}`);
    console.log(`   • Reports with T03:00:00.000Z: ${finalCorrect.rows[0].count}`);
    
    // 6. Generate final report
    report.summary = {
      totalReports: finalTotal.rows[0].count,
      updatedSuccessfully: successCount,
      updatesFailed: errorCount,
      remainingBuggy: finalBuggy.rows[0].count,
      totalCorrect: finalCorrect.rows[0].count
    };
    
    if (errors.length > 0) {
      report.errors = errors;
    }
    
    const reportPath = path.join(
      process.cwd(),
      `normalize-executed-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    if (errorCount === 0) {
      console.log('✅ NORMALIZATION COMPLETED SUCCESSFULLY!');
      console.log(`   • ${successCount} reports updated`);
      console.log(`   • All timestamps now in correct format`);
    } else {
      console.log('⚠️  NORMALIZATION COMPLETED WITH ERRORS');
      console.log(`   • ${successCount} reports updated successfully`);
      console.log(`   • ${errorCount} reports failed to update`);
      console.log('   Check the report for error details.');
    }
    console.log(`\n   Report saved to: ${reportPath}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Normalization failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  normalizeTimestamps()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { normalizeTimestamps };