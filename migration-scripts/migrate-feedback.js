const { client, testConnection } = require('./turso-connection');
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

async function migrateFeedbackTable() {
  console.log('🔄 Starting Feedback table migration...\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE'}\n`);
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Check if table already exists
    console.log('📊 Checking if Feedback table exists...');
    try {
      const result = await client.execute('SELECT COUNT(*) as count FROM Feedback');
      console.log(`   ⚠️  Feedback table already exists with ${result.rows[0].count} records`);
      
      const response = DRY_RUN ? 'n' : 
        await new Promise(resolve => {
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          readline.question('   Do you want to continue anyway? (y/N): ', answer => {
            readline.close();
            resolve(answer.toLowerCase());
          });
        });
      
      if (response !== 'y') {
        console.log('   Migration cancelled.');
        return;
      }
    } catch (error) {
      console.log('   ✅ Feedback table does not exist. Proceeding with creation.');
    }
    
    // Read migration SQL
    console.log('\n📄 Reading migration file...');
    const migrationPath = path.join(process.cwd(), '../prisma/migrations/add_feedback_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`   ✅ Migration file loaded (${migrationSQL.length} characters)`);
    
    if (DRY_RUN) {
      console.log('\n🔍 DRY RUN - Would execute the following SQL:');
      console.log('─'.repeat(60));
      console.log(migrationSQL);
      console.log('─'.repeat(60));
      console.log('\n✅ DRY RUN completed. No changes were made.');
      return;
    }
    
    // Execute migration
    console.log('\n⚙️  Executing migration...');
    
    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await client.execute(statement);
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }
    
    // Verify table creation
    console.log('\n🔍 Verifying migration...');
    
    // Check table structure
    const tableInfo = await client.execute(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='Feedback'
    `);
    
    if (tableInfo.rows.length > 0) {
      console.log('   ✅ Feedback table created successfully');
    } else {
      throw new Error('Feedback table was not created');
    }
    
    // Check indexes
    const indexes = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='Feedback'
    `);
    
    console.log(`   ✅ ${indexes.rows.length} indexes created`);
    indexes.rows.forEach(idx => {
      console.log(`      • ${idx.name}`);
    });
    
    // Test insert (will rollback)
    console.log('\n🧪 Testing table with dummy insert...');
    try {
      await client.execute(`
        INSERT INTO Feedback (
          id, studentId, weekStart, subject, score, 
          generalComments, createdBy, createdAt, updatedAt
        ) VALUES (
          'test_feedback_migration',
          'test_student',
          '2025-08-25T03:00:00.000Z',
          'Test',
          85,
          'Test feedback',
          'migration_script',
          datetime('now'),
          datetime('now')
        )
      `);
      
      // Verify insert worked
      const testResult = await client.execute(
        "SELECT * FROM Feedback WHERE id = 'test_feedback_migration'"
      );
      
      if (testResult.rows.length === 1) {
        console.log('   ✅ Test insert successful');
        
        // Clean up test data
        await client.execute(
          "DELETE FROM Feedback WHERE id = 'test_feedback_migration'"
        );
        console.log('   ✅ Test data cleaned up');
      }
    } catch (error) {
      console.error('   ❌ Test insert failed:', error.message);
      throw error;
    }
    
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('   The Feedback table has been created in production.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease check the error and try again.');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  migrateFeedbackTable()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrateFeedbackTable };