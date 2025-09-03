// Script to add skillsMetrics column to production Feedback table
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function addSkillsMetricsColumn() {
  try {
    console.log('Adding skillsMetrics column to Feedback table...');
    
    // Add the skillsMetrics column if it doesn't exist
    await client.execute({
      sql: 'ALTER TABLE Feedback ADD COLUMN skillsMetrics TEXT',
      args: []
    });
    
    console.log('skillsMetrics column added successfully!');
    
    // Verify the column was added
    const result = await client.execute('PRAGMA table_info(Feedback)');
    console.log('\nUpdated Feedback table schema:');
    result.rows.forEach(row => {
      console.log(`- ${row.name}: ${row.type}`);
    });
    
  } catch (error: any) {
    if (error.message?.includes('duplicate column name')) {
      console.log('skillsMetrics column already exists');
    } else {
      console.error('Error:', error);
    }
  }
}

// Run the script
addSkillsMetricsColumn();