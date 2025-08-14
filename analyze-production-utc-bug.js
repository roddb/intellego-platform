#!/usr/bin/env node

const { createClient } = require('@libsql/client');

// Production database credentials
const client = createClient({
  url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
});

async function analyzeProductionUTCBug() {
  try {
    console.log('🔍 ANALYZING PRODUCTION DATABASE FOR UTC MIDNIGHT CUTOFF BUG');
    console.log('='.repeat(70));

    // First, let's get all reports for the affected weeks
    const reportsQuery = `
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
      WHERE pr.weekStart IN ('2025-08-04', '2025-08-11')
      ORDER BY pr.submittedAt, u.name
    `;

    const reports = await client.execute(reportsQuery);
    
    console.log(`📊 Found ${reports.rows.length} reports in affected weeks`);
    console.log();

    // Analyze by week
    const week2Reports = reports.rows.filter(r => r.weekStart === '2025-08-04');
    const week3Reports = reports.rows.filter(r => r.weekStart === '2025-08-11');

    console.log('📈 WEEK DISTRIBUTION:');
    console.log(`Week 2 (Aug 4-10): ${week2Reports.length} reports`);
    console.log(`Week 3 (Aug 11-17): ${week3Reports.length} reports`);
    console.log();

    // Find potential misassigned reports (Sunday night submissions in Week 3)
    console.log('🕐 ANALYZING SUNDAY NIGHT SUBMISSIONS IN WEEK 3:');
    console.log('(These should likely be in Week 2 due to UTC midnight cutoff)');
    console.log('-'.repeat(50));

    const sundayNightInWeek3 = week3Reports.filter(report => {
      const submitTime = new Date(report.submittedAt);
      const dayOfWeek = submitTime.getDay(); // 0 = Sunday
      const hour = submitTime.getHours();
      
      // Check for Sunday submissions (day 0) or very early Monday (day 1, hours 0-3)
      return dayOfWeek === 0 || (dayOfWeek === 1 && hour <= 3);
    });

    console.log(`Found ${sundayNightInWeek3.length} potentially misassigned reports:`);
    
    sundayNightInWeek3.forEach(report => {
      const submitTime = new Date(report.submittedAt);
      console.log(`- ${report.userName} (${report.studentId}): ${report.subject}`);
      console.log(`  Submitted: ${submitTime.toISOString()}`);
      console.log(`  Local time: ${submitTime.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
      console.log();
    });

    // Look specifically for Mia Pleitel
    console.log('👩‍🎓 CHECKING MIA PLEITEL SPECIFICALLY:');
    console.log('-'.repeat(30));
    
    const miaReports = reports.rows.filter(r => 
      r.userName.toLowerCase().includes('mia') || 
      r.userName.toLowerCase().includes('pleitel')
    );

    if (miaReports.length > 0) {
      miaReports.forEach(report => {
        const submitTime = new Date(report.submittedAt);
        console.log(`Mia Report: ${report.subject} in Week ${report.weekStart === '2025-08-04' ? '2' : '3'}`);
        console.log(`Submitted: ${submitTime.toISOString()}`);
        console.log(`Local time: ${submitTime.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`);
        console.log();
      });
    } else {
      console.log('No reports found for Mia Pleitel in production');
    }

    // Check submission time patterns
    console.log('📊 SUBMISSION TIME ANALYSIS:');
    console.log('-'.repeat(40));

    const timeAnalysis = {
      week3Sunday: 0,
      week3EarlyMonday: 0,
      week3RegularSubmissions: 0
    };

    week3Reports.forEach(report => {
      const submitTime = new Date(report.submittedAt);
      const dayOfWeek = submitTime.getDay();
      const hour = submitTime.getHours();

      if (dayOfWeek === 0) {
        timeAnalysis.week3Sunday++;
      } else if (dayOfWeek === 1 && hour <= 3) {
        timeAnalysis.week3EarlyMonday++;
      } else {
        timeAnalysis.week3RegularSubmissions++;
      }
    });

    console.log(`Week 3 Sunday submissions: ${timeAnalysis.week3Sunday}`);
    console.log(`Week 3 Early Monday (0-3 AM): ${timeAnalysis.week3EarlyMonday}`);
    console.log(`Week 3 Regular submissions: ${timeAnalysis.week3RegularSubmissions}`);

    const potentialMisassigned = timeAnalysis.week3Sunday + timeAnalysis.week3EarlyMonday;
    console.log();
    console.log(`🎯 TOTAL POTENTIALLY MISASSIGNED: ${potentialMisassigned} reports`);

    // Create correction plan
    console.log();
    console.log('📋 CORRECTION PLAN:');
    console.log('='.repeat(30));
    console.log(`Move ${potentialMisassigned} reports from Week 3 to Week 2`);
    console.log('These are Sunday night/early Monday submissions affected by UTC cutoff');

    return {
      totalReports: reports.rows.length,
      week2Count: week2Reports.length,
      week3Count: week3Reports.length,
      misassignedReports: sundayNightInWeek3,
      potentialCorrections: potentialMisassigned,
      miaReports: miaReports
    };

  } catch (error) {
    console.error('❌ Error analyzing production database:', error);
    throw error;
  }
}

// Run analysis
analyzeProductionUTCBug()
  .then(results => {
    console.log();
    console.log('✅ Production analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });