/**
 * Migration Script: Extend CONSUDEC System for Clinical Cases
 *
 * Adds support for Bioelectricity clinical cases with calculation-type questions
 * while maintaining full backward compatibility with existing pedagogical activities.
 *
 * Changes:
 * - Add activityType column to ConsudecActivity table
 *
 * Run with: npx tsx scripts/extend-consudec-for-clinical.ts
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing Turso credentials in .env');
  console.error('Required: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN');
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function extendConsudecSchema(): Promise<void> {
  console.log('🔧 Starting CONSUDEC schema extension for clinical cases...\n');

  try {
    // Check if activityType column already exists
    console.log('1️⃣ Checking if activityType column exists...');
    const checkColumn = await db.execute({
      sql: `SELECT COUNT(*) as count FROM pragma_table_info('ConsudecActivity') WHERE name = 'activityType'`,
      args: [],
    });

    const columnExists = (checkColumn.rows[0] as unknown as { count: number }).count > 0;

    if (columnExists) {
      console.log('   ✅ activityType column already exists, skipping creation');
    } else {
      console.log('   ➕ Adding activityType column...');
      await db.execute({
        sql: `ALTER TABLE ConsudecActivity ADD COLUMN activityType TEXT DEFAULT 'pedagogical'`,
        args: [],
      });
      console.log('   ✅ activityType column added successfully');
    }

    // Verify the change
    console.log('\n2️⃣ Verifying schema changes...');
    const verifySchema = await db.execute({
      sql: `SELECT sql FROM sqlite_master WHERE type='table' AND name='ConsudecActivity'`,
      args: [],
    });

    if (verifySchema.rows.length > 0) {
      console.log('   ✅ ConsudecActivity table schema verified');
      console.log(`   📋 Schema: ${(verifySchema.rows[0] as unknown as { sql: string }).sql.substring(0, 100)}...`);
    }

    // Check existing activities
    console.log('\n3️⃣ Checking existing activities...');
    const countActivities = await db.execute({
      sql: `SELECT COUNT(*) as total,
                   SUM(CASE WHEN activityType IS NULL OR activityType = 'pedagogical' THEN 1 ELSE 0 END) as pedagogical,
                   SUM(CASE WHEN activityType = 'clinical' THEN 1 ELSE 0 END) as clinical
            FROM ConsudecActivity`,
      args: [],
    });

    const stats = countActivities.rows[0] as unknown as { total: number; pedagogical: number; clinical: number };
    console.log(`   📊 Total activities: ${stats.total}`);
    console.log(`   📚 Pedagogical: ${stats.pedagogical}`);
    console.log(`   🏥 Clinical: ${stats.clinical}`);

    console.log('\n✅ CONSUDEC schema extension completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - activityType column added to ConsudecActivity');
    console.log('   - Default value: "pedagogical" (backward compatible)');
    console.log('   - Existing activities remain unchanged');
    console.log('   - Ready for clinical cases with calculation questions');

  } catch (error: unknown) {
    console.error('\n❌ Migration failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

// Execute migration
extendConsudecSchema()
  .then(() => {
    console.log('\n🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('\n💥 Migration failed');
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  });
