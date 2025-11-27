/**
 * Script: Update rubric types
 *
 * Sets:
 * - "Rúbrica 5 Fases (Por Defecto)" → rubricType = '5-phases'
 * - "Uniones Químicas" → rubricType = 'custom'
 *
 * Usage: npx tsx scripts/update-rubric-types.ts
 */

import { db } from '../src/lib/db';

async function updateRubricTypes() {
  console.log('🔄 Updating rubric types...\n');

  try {
    const client = db();

    // Update "Rúbrica 5 Fases (Por Defecto)" to '5-phases'
    console.log('📝 Setting "Rúbrica 5 Fases" to type: 5-phases...');
    await client.execute({
      sql: "UPDATE Rubric SET rubricType = '5-phases' WHERE id = 'rubric-5-fases-default'",
      args: [],
    });
    console.log('✅ Updated\n');

    // Update "Uniones Químicas" to 'custom'
    console.log('📝 Setting "Uniones Químicas" to type: custom...');
    await client.execute({
      sql: "UPDATE Rubric SET rubricType = 'custom' WHERE id = 'rubric-uniones-quimicas'",
      args: [],
    });
    console.log('✅ Updated\n');

    // Verify
    console.log('🔍 Verifying updates...');
    const result = await client.execute({
      sql: 'SELECT id, name, rubricType FROM Rubric',
      args: [],
    });

    console.log('\nCurrent rubrics:');
    for (const row of result.rows) {
      const rubric = row as any;
      console.log(`  ✓ ${rubric.name} (${rubric.id})`);
      console.log(`    Type: ${rubric.rubricType}\n`);
    }

    console.log('🎉 Rubric types updated successfully!\n');

  } catch (error: unknown) {
    console.error('\n❌ Update failed:');
    if (error instanceof Error) {
      console.error(error.message);
      console.error('\nStack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

updateRubricTypes();
