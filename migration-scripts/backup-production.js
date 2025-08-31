const { client, testConnection } = require('./turso-connection');
const fs = require('fs');
const path = require('path');

async function backupProduction() {
  console.log('🔄 Starting production database backup...\n');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  const backup = {
    timestamp: new Date().toISOString(),
    database: 'turso-production',
    tables: {}
  };
  
  try {
    // 1. Backup Users table
    console.log('📊 Backing up Users...');
    const users = await client.execute('SELECT * FROM User');
    backup.tables.users = {
      count: users.rows.length,
      data: users.rows
    };
    console.log(`   ✅ ${users.rows.length} users backed up`);
    
    // 2. Backup ProgressReport table
    console.log('📊 Backing up ProgressReports...');
    const reports = await client.execute('SELECT * FROM ProgressReport ORDER BY weekStart');
    backup.tables.progressReports = {
      count: reports.rows.length,
      data: reports.rows
    };
    console.log(`   ✅ ${reports.rows.length} progress reports backed up`);
    
    // 3. Backup Answer table
    console.log('📊 Backing up Answers...');
    const answers = await client.execute('SELECT * FROM Answer');
    backup.tables.answers = {
      count: answers.rows.length,
      data: answers.rows
    };
    console.log(`   ✅ ${answers.rows.length} answers backed up`);
    
    // 4. Backup CalendarEvent table
    console.log('📊 Backing up CalendarEvents...');
    const events = await client.execute('SELECT * FROM CalendarEvent');
    backup.tables.calendarEvents = {
      count: events.rows.length,
      data: events.rows
    };
    console.log(`   ✅ ${events.rows.length} calendar events backed up`);
    
    // 5. Backup Task table
    console.log('📊 Backing up Tasks...');
    const tasks = await client.execute('SELECT * FROM Task');
    backup.tables.tasks = {
      count: tasks.rows.length,
      data: tasks.rows
    };
    console.log(`   ✅ ${tasks.rows.length} tasks backed up`);
    
    // 6. Check if Feedback table exists
    console.log('📊 Checking Feedback table...');
    try {
      const feedback = await client.execute('SELECT * FROM Feedback');
      backup.tables.feedback = {
        count: feedback.rows.length,
        data: feedback.rows
      };
      console.log(`   ✅ ${feedback.rows.length} feedback records backed up`);
    } catch (error) {
      console.log('   ℹ️  Feedback table does not exist yet');
      backup.tables.feedback = {
        count: 0,
        data: [],
        note: 'Table does not exist in production yet'
      };
    }
    
    // 7. Analyze timestamps
    console.log('\n📊 Analyzing timestamps...');
    const timestampAnalysis = await client.execute(`
      SELECT 
        weekStart,
        COUNT(*) as count
      FROM ProgressReport
      GROUP BY weekStart
      ORDER BY weekStart
    `);
    
    backup.analysis = {
      timestamps: timestampAnalysis.rows,
      buggyTimestamps: timestampAnalysis.rows.filter(r => r.weekStart.includes('T00:00:00.000Z')).length,
      correctTimestamps: timestampAnalysis.rows.filter(r => r.weekStart.includes('T03:00:00.000Z')).length
    };
    
    console.log(`   • Reports with T00:00:00.000Z: ${backup.analysis.buggyTimestamps}`);
    console.log(`   • Reports with T03:00:00.000Z: ${backup.analysis.correctTimestamps}`);
    
    // Save backup
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const filename = `turso-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`📊 Total size: ${(JSON.stringify(backup).length / 1024).toFixed(2)} KB`);
    
    // Summary
    console.log('\n📋 BACKUP SUMMARY:');
    console.log(`   • Users: ${backup.tables.users.count}`);
    console.log(`   • Progress Reports: ${backup.tables.progressReports.count}`);
    console.log(`   • Answers: ${backup.tables.answers.count}`);
    console.log(`   • Calendar Events: ${backup.tables.calendarEvents.count}`);
    console.log(`   • Tasks: ${backup.tables.tasks.count}`);
    console.log(`   • Feedback: ${backup.tables.feedback.count}`);
    
    return filepath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  backupProduction()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { backupProduction };