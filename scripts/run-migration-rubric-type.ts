/**
 * Script: Add rubricType column to Rubric table
 *
 * Usage: npx tsx scripts/run-migration-rubric-type.ts
 */

import { db } from '../src/lib/db';

async function runMigration() {
  console.log('🔄 Running migration: Add rubricType column...\n');

  try {
    const client = db();

    // Step 1: Add rubricType column
    console.log('📝 Adding rubricType column to Rubric table...');
    await client.execute(`
      ALTER TABLE Rubric ADD COLUMN rubricType TEXT NOT NULL DEFAULT '5-phases'
    `);
    console.log('✅ Column added successfully\n');

    // Step 2: Update existing rubrics (explicit)
    console.log('📝 Updating existing rubrics to use 5-phases type...');
    await client.execute(`
      UPDATE Rubric SET rubricType = '5-phases' WHERE rubricType IS NULL OR rubricType = ''
    `);
    console.log('✅ Existing rubrics updated\n');

    // Step 3: Create index
    console.log('📝 Creating index on rubricType...');
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_rubric_type ON Rubric(rubricType)
    `);
    console.log('✅ Index created successfully\n');

    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    const verifyResult = await client.execute({
      sql: 'SELECT id, name, rubricType FROM Rubric',
      args: [],
    });

    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful. Current rubrics:');
      for (const row of verifyResult.rows) {
        const rubric = row as any;
        console.log(`   - ${rubric.name} (${rubric.id}): ${rubric.rubricType}`);
      }
      console.log('');
    } else {
      console.log('⚠️  No rubrics found in database. Migration applied but no data to verify.\n');
    }

    console.log('🎉 Migration completed successfully!\n');

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
