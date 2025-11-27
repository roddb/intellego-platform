/**
 * Migration Script: Add Rubric System
 *
 * This script creates the Rubric table and adds rubricId column to Evaluation table.
 *
 * Usage: npx tsx scripts/run-migration-rubric.ts
 */

import { db } from '../src/lib/db';

async function runMigration() {
  console.log('🚀 Starting migration: Add Rubric System...\n');

  try {
    // Get the database client
    const client = db();

    // Step 1: Create Rubric table
    console.log('📋 Creating Rubric table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Rubric (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        rubricText TEXT NOT NULL,
        subject TEXT,
        examType TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES User(id)
      )
    `);
    console.log('✅ Rubric table created successfully\n');

    // Step 2: Add rubricId column to Evaluation table
    console.log('📋 Adding rubricId column to Evaluation table...');
    try {
      await client.execute('ALTER TABLE Evaluation ADD COLUMN rubricId TEXT');
      console.log('✅ rubricId column added successfully\n');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('duplicate column')) {
        console.log('ℹ️  rubricId column already exists, skipping\n');
      } else {
        throw error;
      }
    }

    // Step 3: Create indexes
    console.log('📋 Creating indexes...');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_rubric_active ON Rubric(isActive)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_evaluation_rubricId ON Evaluation(rubricId)');
    console.log('✅ Indexes created successfully\n');

    // Step 4: Verify tables
    console.log('🔍 Verifying migration...');
    const rubricTable = await client.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='Rubric'
    `);

    if (rubricTable.rows.length > 0) {
      console.log('✅ Rubric table verified');
    } else {
      throw new Error('❌ Rubric table not found after migration');
    }

    const evaluationSchema = await client.execute(`
      PRAGMA table_info(Evaluation)
    `);

    const hasRubricId = evaluationSchema.rows.some(
      (row: any) => row.name === 'rubricId'
    );

    if (hasRubricId) {
      console.log('✅ Evaluation.rubricId column verified');
    } else {
      throw new Error('❌ Evaluation.rubricId column not found after migration');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext step: Run seed script to create default rubric');
    console.log('Command: npx tsx scripts/seed-default-rubric.ts\n');

  } catch (error: unknown) {
    console.error('\n❌ Migration failed:');
    if (error instanceof Error) {
      console.error(error.message);
      console.error('\nStack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

runMigration();
