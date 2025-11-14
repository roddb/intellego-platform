/**
 * Script to normalize exam topic names in the Evaluation table
 *
 * Fixes:
 * - "Equilibrio Quimico" → "Equilibrio Químico"
 * - "Gases Idelaes" → "Gases Ideales"
 * - "Termoedinámica" → "Termodinámica"
 *
 * Usage: npx tsx scripts/normalize-exam-topics.ts [--dry-run]
 */

import { createClient } from '@libsql/client';

// Database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

// Normalization rules
const NORMALIZATION_RULES: Array<{
  from: string;
  to: string;
  reason: string;
}> = [
  {
    from: 'Equilibrio Quimico',
    to: 'Equilibrio Químico',
    reason: 'Falta tilde en "Químico"'
  },
  {
    from: 'Gases Idelaes',
    to: 'Gases Ideales',
    reason: 'Typo: "Idelaes" → "Ideales"'
  },
  {
    from: 'Termoedinámica',
    to: 'Termodinámica',
    reason: 'Error ortográfico: "Termoedinámica" → "Termodinámica"'
  },
  {
    from: 'Tiro Oblicuo y Lanzamiento Horizontal',
    to: 'Tiro Oblicuo',
    reason: 'Simplificar tema (solo 1 registro con nombre largo)'
  }
];

interface NormalizationResult {
  from: string;
  to: string;
  count: number;
  evaluationIds: string[];
}

/**
 * Get all evaluations that need normalization
 */
async function findEvaluationsToNormalize(from: string): Promise<Array<{ id: string; studentId: string; examDate: string }>> {
  const result = await db.execute({
    sql: `SELECT id, studentId, examDate FROM Evaluation WHERE examTopic = ?`,
    args: [from]
  });

  return result.rows.map(row => ({
    id: String(row.id),
    studentId: String(row.studentId),
    examDate: String(row.examDate)
  }));
}

/**
 * Update exam topic for a specific evaluation
 */
async function updateExamTopic(evaluationId: string, newTopic: string): Promise<void> {
  await db.execute({
    sql: `UPDATE Evaluation SET examTopic = ?, updatedAt = datetime('now') WHERE id = ?`,
    args: [newTopic, evaluationId]
  });
}

/**
 * Perform normalization
 */
async function normalizeTopics(dryRun: boolean = false): Promise<NormalizationResult[]> {
  const results: NormalizationResult[] = [];

  console.log('🔍 Starting exam topic normalization...\n');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '✏️  LIVE (will update database)'}\n`);

  for (const rule of NORMALIZATION_RULES) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Processing: "${rule.from}" → "${rule.to}"`);
    console.log(`Reason: ${rule.reason}`);
    console.log('='.repeat(80));

    // Find evaluations to update
    const evaluations = await findEvaluationsToNormalize(rule.from);

    console.log(`\n📊 Found ${evaluations.length} evaluations to update`);

    if (evaluations.length === 0) {
      console.log('   ✅ Nothing to update');
      continue;
    }

    // Show sample of what will be updated
    console.log('\n📋 Sample evaluations:');
    for (const evaluation of evaluations.slice(0, 5)) {
      console.log(`   - ID: ${evaluation.id} | Student: ${evaluation.studentId} | Date: ${evaluation.examDate}`);
    }

    if (evaluations.length > 5) {
      console.log(`   ... and ${evaluations.length - 5} more`);
    }

    // Update if not dry run
    if (!dryRun) {
      console.log('\n🔄 Updating database...');

      let successCount = 0;
      let errorCount = 0;

      for (const evaluation of evaluations) {
        try {
          await updateExamTopic(evaluation.id, rule.to);
          successCount++;
        } catch (error) {
          console.error(`   ❌ Error updating ${evaluation.id}:`, error);
          errorCount++;
        }
      }

      console.log(`\n✅ Updated: ${successCount}`);
      if (errorCount > 0) {
        console.log(`❌ Errors: ${errorCount}`);
      }
    } else {
      console.log('\n🔍 DRY RUN - No changes made');
    }

    results.push({
      from: rule.from,
      to: rule.to,
      count: evaluations.length,
      evaluationIds: evaluations.map(e => e.id)
    });
  }

  return results;
}

/**
 * Verify normalization results
 */
async function verifyNormalization(): Promise<void> {
  console.log('\n\n' + '='.repeat(80));
  console.log('🔍 VERIFICATION - Current exam topics in database');
  console.log('='.repeat(80) + '\n');

  const result = await db.execute(
    `SELECT DISTINCT examTopic, COUNT(*) as count
     FROM Evaluation
     GROUP BY examTopic
     ORDER BY examTopic`
  );

  console.log('Current exam topics:');
  for (const row of result.rows) {
    console.log(`   - "${row.examTopic}": ${row.count} evaluations`);
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Exam Topic Normalization Script');
  console.log('=' .repeat(80));
  console.log();

  try {
    // Show current state
    console.log('📊 BEFORE normalization:');
    await verifyNormalization();

    // Perform normalization
    const results = await normalizeTopics(dryRun);

    // Show summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 NORMALIZATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    let totalUpdated = 0;
    for (const result of results) {
      console.log(`✓ "${result.from}" → "${result.to}": ${result.count} evaluations`);
      totalUpdated += result.count;
    }

    console.log(`\n📈 Total evaluations ${dryRun ? 'to be updated' : 'updated'}: ${totalUpdated}`);

    // Show final state if not dry run
    if (!dryRun) {
      console.log('\n📊 AFTER normalization:');
      await verifyNormalization();
    }

    console.log('\n✅ Normalization completed successfully!\n');

    if (dryRun) {
      console.log('💡 TIP: Run without --dry-run to apply changes');
      console.log('   Command: npx tsx scripts/normalize-exam-topics.ts\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during normalization:', error);
    process.exit(1);
  }
}

// Execute
main();
