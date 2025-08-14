#!/usr/bin/env node

const { createClient } = require('@libsql/client');
const fs = require('fs');

// Production database credentials
const client = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

async function backupAndFixProductionUTC() {
  try {
    console.log('🔄 BACKUP AND FIX PRODUCTION UTC MIDNIGHT CUTOFF BUG');
    console.log('='.repeat(60));

    // STEP 1: Create complete backup
    console.log('📦 Step 1: Creating complete backup...');
    
    const backupQuery = `
      SELECT 
        pr.id,
        pr.userId,
        pr.weekStart,
        pr.weekEnd,
        pr.subject,
        pr.submittedAt,
        u.name as userName,
        u.studentId
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.weekStart IN ('2025-08-04T00:00:00.000Z', '2025-08-11T00:00:00.000Z')
      ORDER BY pr.submittedAt
    `;

    const backupData = await client.execute(backupQuery);
    
    const backupFilename = `production-utc-backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupFilename, JSON.stringify({
      timestamp: new Date().toISOString(),
      description: 'Backup before UTC midnight cutoff corrections',
      totalReports: backupData.rows.length,
      reports: backupData.rows
    }, null, 2));

    console.log(`✅ Backup saved to: ${backupFilename}`);
    console.log(`📊 Backed up ${backupData.rows.length} reports`);

    // STEP 2: Identify reports to correct
    console.log('\n🔍 Step 2: Identifying reports to correct...');
    
    const week3Reports = backupData.rows.filter(r => r.weekStart === '2025-08-11T00:00:00.000Z');
    
    const reportsToMove = week3Reports.filter(report => {
      const submitTime = new Date(report.submittedAt);
      const argentinaTime = new Date(submitTime.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
      const dayOfWeek = argentinaTime.getDay(); // 0 = Sunday
      
      // Move Sunday submissions from Week 3 to Week 2
      return dayOfWeek === 0;
    });

    console.log(`🎯 Found ${reportsToMove.length} reports to move from Week 3 to Week 2:`);
    
    reportsToMove.forEach(report => {
      const submitTime = new Date(report.submittedAt);
      const argentinaTime = new Date(submitTime.getTime() - (3 * 60 * 60 * 1000));
      console.log(`- ${report.userName} (${report.studentId}): ${report.subject}`);
      console.log(`  Submitted: ${argentinaTime.toLocaleString()} (Argentina)`);
    });

    // STEP 3: Apply corrections in transaction
    console.log('\n⚡ Step 3: Applying corrections...');
    
    if (reportsToMove.length === 0) {
      console.log('ℹ️  No reports need to be moved. UTC bug may already be fixed.');
      return;
    }

    // Use transaction for safety
    await client.execute('BEGIN TRANSACTION');
    
    try {
      let correctedCount = 0;
      
      for (const report of reportsToMove) {
        const updateQuery = `
          UPDATE ProgressReport 
          SET weekStart = '2025-08-04T00:00:00.000Z',
              weekEnd = '2025-08-10T23:59:59.999Z'
          WHERE id = ?
        `;
        
        await client.execute({
          sql: updateQuery,
          args: [report.id]
        });
        
        correctedCount++;
        console.log(`✅ Moved ${report.userName}'s ${report.subject} report to Week 2`);
      }
      
      // Commit the transaction
      await client.execute('COMMIT');
      
      console.log(`\n🎉 Successfully corrected ${correctedCount} reports!`);
      
    } catch (error) {
      // Rollback on error
      await client.execute('ROLLBACK');
      console.error('❌ Error during correction, transaction rolled back:', error);
      throw error;
    }

    // STEP 4: Verification
    console.log('\n🔎 Step 4: Verifying corrections...');
    
    // Check Mia Pleitel specifically
    const miaCheck = `
      SELECT 
        pr.id,
        pr.weekStart,
        pr.weekEnd,
        pr.subject,
        pr.submittedAt,
        u.name as userName,
        u.studentId
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE u.name LIKE '%Mia%' AND u.name LIKE '%Pleitel%'
      ORDER BY pr.submittedAt
    `;

    const miaResult = await client.execute(miaCheck);
    
    console.log('👩‍🎓 Mia Pleitel reports after correction:');
    miaResult.rows.forEach(report => {
      const weekNum = report.weekStart === '2025-08-04T00:00:00.000Z' ? '2' : '3';
      console.log(`- ${report.subject}: Week ${weekNum} (${report.weekStart.split('T')[0]})`);
    });

    // Final week distribution
    const finalDistribution = `
      SELECT weekStart, COUNT(*) as count
      FROM ProgressReport 
      WHERE weekStart IN ('2025-08-04T00:00:00.000Z', '2025-08-11T00:00:00.000Z')
      GROUP BY weekStart
      ORDER BY weekStart
    `;

    const distribution = await client.execute(finalDistribution);
    
    console.log('\n📊 Final week distribution:');
    distribution.rows.forEach(row => {
      const weekNum = row.weekStart === '2025-08-04T00:00:00.000Z' ? '2' : '3';
      console.log(`Week ${weekNum} (${row.weekStart.split('T')[0]}): ${row.count} reports`);
    });

    return {
      backupFile: backupFilename,
      correctedReports: reportsToMove.length,
      miaReportsFixed: miaResult.rows.filter(r => r.weekStart === '2025-08-04T00:00:00.000Z').length
    };

  } catch (error) {
    console.error('❌ Error in backup and fix operation:', error);
    throw error;
  }
}

// Run the backup and fix
backupAndFixProductionUTC()
  .then(results => {
    console.log('\n✅ PRODUCTION UTC MIDNIGHT CUTOFF BUG FIXED SUCCESSFULLY!');
    console.log(`📁 Backup: ${results.backupFile}`);
    console.log(`🔧 Corrected: ${results.correctedReports} reports`);
    console.log(`👩‍🎓 Mia's reports in correct week: ${results.miaReportsFixed}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fix operation failed:', error);
    process.exit(1);
  });