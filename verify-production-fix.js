#!/usr/bin/env node

const { createClient } = require('@libsql/client');

// Production database credentials
const client = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

async function verifyProductionFix() {
  try {
    console.log('🔎 VERIFYING PRODUCTION UTC MIDNIGHT CUTOFF CORRECTIONS');
    console.log('='.repeat(60));

    // Check final week distribution
    const distributionQuery = `
      SELECT weekStart, COUNT(*) as count
      FROM ProgressReport 
      WHERE weekStart IN ('2025-08-04T00:00:00.000Z', '2025-08-11T00:00:00.000Z')
      GROUP BY weekStart
      ORDER BY weekStart
    `;

    const distribution = await client.execute(distributionQuery);
    
    console.log('📊 FINAL WEEK DISTRIBUTION:');
    distribution.rows.forEach(row => {
      const weekNum = row.weekStart === '2025-08-04T00:00:00.000Z' ? '2' : '3';
      const weekDate = row.weekStart.split('T')[0];
      console.log(`Week ${weekNum} (${weekDate}): ${row.count} reports`);
    });

    // Check Mia Pleitel specifically
    const miaQuery = `
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

    const miaResult = await client.execute(miaQuery);
    
    console.log('\n👩‍🎓 MIA PLEITEL REPORTS AFTER CORRECTION:');
    console.log('-'.repeat(50));
    
    miaResult.rows.forEach(report => {
      const weekNum = report.weekStart === '2025-08-04T00:00:00.000Z' ? '2' : '3';
      const weekDate = report.weekStart.split('T')[0];
      const submitTime = new Date(report.submittedAt);
      const argentinaTime = new Date(submitTime.getTime() - (3 * 60 * 60 * 1000));
      
      console.log(`${report.subject}: Week ${weekNum} (${weekDate})`);
      console.log(`  Submitted: ${argentinaTime.toLocaleString()} (Argentina time)`);
      console.log(`  UTC: ${submitTime.toISOString()}`);
    });

    // Check for any remaining Sunday submissions in Week 3
    const remainingSundayQuery = `
      SELECT 
        pr.id,
        pr.weekStart,
        pr.subject,
        pr.submittedAt,
        u.name as userName,
        u.studentId
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.weekStart = '2025-08-11T00:00:00.000Z'
      ORDER BY pr.submittedAt
    `;

    const remainingReports = await client.execute(remainingSundayQuery);
    
    console.log('\n🕐 CHECKING REMAINING WEEK 3 SUBMISSIONS:');
    console.log('-'.repeat(45));
    
    let sundayInWeek3 = 0;
    
    remainingReports.rows.forEach(report => {
      const submitTime = new Date(report.submittedAt);
      const argentinaTime = new Date(submitTime.getTime() - (3 * 60 * 60 * 1000));
      const dayOfWeek = argentinaTime.getDay();
      
      if (dayOfWeek === 0) { // Sunday
        sundayInWeek3++;
        console.log(`⚠️  STILL IN WEEK 3: ${report.userName} - ${report.subject}`);
        console.log(`   Submitted: ${argentinaTime.toLocaleString()} (Sunday)`);
      }
    });

    if (sundayInWeek3 === 0) {
      console.log('✅ No Sunday submissions remaining in Week 3 - all correctly moved!');
    } else {
      console.log(`❌ Found ${sundayInWeek3} Sunday submissions still in Week 3`);
    }

    console.log(`\n📋 Week 3 now has ${remainingReports.rows.length} total reports`);

    // Summary comparison
    const week2Count = distribution.rows.find(r => r.weekStart === '2025-08-04T00:00:00.000Z')?.count || 0;
    const week3Count = distribution.rows.find(r => r.weekStart === '2025-08-11T00:00:00.000Z')?.count || 0;

    console.log('\n📈 CORRECTION SUMMARY:');
    console.log('='.repeat(30));
    console.log(`Week 2 (Aug 4-10): ${week2Count} reports`);
    console.log(`Week 3 (Aug 11-17): ${week3Count} reports`);
    console.log(`Total affected weeks: ${week2Count + week3Count} reports`);
    
    const miaInWeek2 = miaResult.rows.filter(r => r.weekStart === '2025-08-04T00:00:00.000Z').length;
    console.log(`\n🎯 Mia Pleitel reports in correct week: ${miaInWeek2}/2`);

    return {
      week2Count,
      week3Count,
      miaReportsFixed: miaInWeek2,
      remainingSundayInWeek3: sundayInWeek3
    };

  } catch (error) {
    console.error('❌ Error verifying production fix:', error);
    throw error;
  }
}

// Run verification
verifyProductionFix()
  .then(results => {
    console.log('\n✅ PRODUCTION VERIFICATION COMPLETE!');
    
    if (results.remainingSundayInWeek3 === 0 && results.miaReportsFixed === 2) {
      console.log('🎉 ALL CORRECTIONS APPLIED SUCCESSFULLY!');
      console.log('✅ UTC midnight cutoff bug has been completely fixed in production');
    } else {
      console.log('⚠️  Some issues may remain - check details above');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });