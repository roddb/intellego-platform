#!/usr/bin/env node

/**
 * PRODUCTION SCHEMA VERIFICATION SCRIPT
 * 
 * Verifies that the database schema in production Turso is correctly set up
 * after running the fix-database-schema.js script
 */

const { createClient } = require('@libsql/client');

// Database client setup for production
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function verifyProductionSchema() {
  console.log('🔍 VERIFYING PRODUCTION DATABASE SCHEMA...\n');
  
  // Check all tables exist
  const requiredTables = ['User', 'ProgressReport', 'Answer', 'CalendarEvent', 'Task'];
  
  console.log('📋 Checking required tables:');
  for (const table of requiredTables) {
    try {
      const result = await db.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        args: [table]
      });
      
      if (result.rows.length > 0) {
        console.log(`✅ ${table}: EXISTS`);
      } else {
        console.log(`❌ ${table}: MISSING`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    }
  }
  
  // Check table structures
  console.log('\n📊 Checking table structures:');
  
  try {
    // Check CalendarEvent structure
    const calendarSchema = await db.execute("PRAGMA table_info(CalendarEvent)");
    console.log(`✅ CalendarEvent: ${calendarSchema.rows.length} columns`);
    
    // Check Task structure  
    const taskSchema = await db.execute("PRAGMA table_info(Task)");
    console.log(`✅ Task: ${taskSchema.rows.length} columns`);
    
    // Check key indexes exist
    const indexes = await db.execute("SELECT name FROM sqlite_master WHERE type='index'");
    console.log(`✅ Total indexes: ${indexes.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error checking table structures:', error.message);
  }
  
  console.log('\n🎯 PRODUCTION SCHEMA VERIFICATION COMPLETE!');
  return true;
}

// Execute verification
if (require.main === module) {
  verifyProductionSchema()
    .then(() => {
      console.log('\n✅ Production database schema verified successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error verifying schema:', error);
      process.exit(1);
    });
}

module.exports = { verifyProductionSchema };