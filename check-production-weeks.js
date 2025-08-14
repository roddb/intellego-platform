#!/usr/bin/env node

const { createClient } = require('@libsql/client');

// Production database credentials
const client = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

async function checkProductionWeeks() {
  try {
    console.log('🔍 CHECKING ALL WEEKS IN PRODUCTION DATABASE');
    console.log('='.repeat(50));

    // Get all unique weeks in production
    const weeksQuery = `
      SELECT DISTINCT weekStart, weekEnd, COUNT(*) as reportCount
      FROM ProgressReport 
      GROUP BY weekStart, weekEnd
      ORDER BY weekStart DESC
    `;

    const weeks = await client.execute(weeksQuery);
    
    console.log(`📊 Found ${weeks.rows.length} distinct weeks with reports:`);
    console.log();

    weeks.rows.forEach(week => {
      console.log(`Week: ${week.weekStart} to ${week.weekEnd} - ${week.reportCount} reports`);
    });

    // Get total report count
    const totalQuery = `SELECT COUNT(*) as total FROM ProgressReport`;
    const total = await client.execute(totalQuery);
    console.log();
    console.log(`📈 Total reports in production: ${total.rows[0].total}`);

    // Get recent reports to see submission patterns
    const recentQuery = `
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
      ORDER BY pr.submittedAt DESC
      LIMIT 20
    `;

    const recent = await client.execute(recentQuery);
    
    console.log();
    console.log('📋 MOST RECENT 20 REPORTS:');
    console.log('-'.repeat(40));

    recent.rows.forEach(report => {
      const submitTime = new Date(report.submittedAt);
      console.log(`${report.userName} (${report.studentId}): ${report.subject}`);
      console.log(`  Week: ${report.weekStart} to ${report.weekEnd}`);
      console.log(`  Submitted: ${submitTime.toISOString()}`);
      console.log(`  Local time: ${submitTime.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
      console.log();
    });

    // Check for any Mia reports in the entire database
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
      WHERE u.name LIKE '%Mia%' OR u.name LIKE '%Pleitel%'
      ORDER BY pr.submittedAt DESC
    `;

    const miaReports = await client.execute(miaQuery);
    
    console.log('👩‍🎓 CHECKING FOR MIA PLEITEL IN ENTIRE DATABASE:');
    console.log('-'.repeat(50));

    if (miaReports.rows.length > 0) {
      miaReports.rows.forEach(report => {
        const submitTime = new Date(report.submittedAt);
        console.log(`${report.userName} (${report.studentId}): ${report.subject}`);
        console.log(`  Week: ${report.weekStart} to ${report.weekEnd}`);
        console.log(`  Submitted: ${submitTime.toISOString()}`);
        console.log(`  Local time: ${submitTime.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
        console.log();
      });
    } else {
      console.log('No reports found for Mia Pleitel in entire production database');
    }

    return {
      totalWeeks: weeks.rows.length,
      totalReports: total.rows[0].total,
      weeks: weeks.rows,
      recentReports: recent.rows,
      miaReports: miaReports.rows
    };

  } catch (error) {
    console.error('❌ Error checking production database:', error);
    throw error;
  }
}

// Run check
checkProductionWeeks()
  .then(results => {
    console.log();
    console.log('✅ Production database check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });