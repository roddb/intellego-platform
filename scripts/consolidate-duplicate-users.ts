/**
 * Script to consolidate duplicate user accounts
 *
 * This script:
 * 1. Updates email for Lucio Fernández
 * 2. Deletes duplicate user accounts (keeping the primary one)
 * 3. Verifies no duplicates remain
 *
 * Usage: npx tsx scripts/consolidate-duplicate-users.ts [--dry-run]
 */

import { createClient } from '@libsql/client';

// Database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

interface DuplicateRecord {
  name: string;
  keepId: string;
  keepCode: string;
  deleteIds: string[];
  deleteCodes: string[];
  emailCorrection?: { from: string; to: string };
}

// Duplicates to consolidate
const DUPLICATES: DuplicateRecord[] = [
  {
    name: 'catalina cresci',
    keepId: 'u_yjrnyfsg2me6bmfeg',
    keepCode: 'EST-2025-117',
    deleteIds: [
      '271939b0-23ab-4ee4-9b2a-1ac4fc117d94',
      'bf75d4ac-5f88-4043-a227-4a512846cafe',
      '7cfecfff-7374-43c3-94b0-3bd182f7345e'
    ],
    deleteCodes: ['EST-2025-1019', 'EST-2025-1743', 'EST-2025-1747']
  },
  {
    name: 'Lucio Fernández rico',
    keepId: 'u_0ewscw8ksmdyn9paz',
    keepCode: 'EST-2025-003',
    deleteIds: ['u_qjugmxdtzme5ry9mk'],
    deleteCodes: ['EST-2025-102'],
    emailCorrection: {
      from: 'fernandezlucio4@gnail.com',
      to: 'fernandezlucio4@gmail.com'
    }
  },
  {
    name: 'Charo Reig',
    keepId: '7c833c54-face-42df-8ba9-758c9e0a838e',
    keepCode: 'EST-2025-1020',
    deleteIds: ['0dc9641c-192c-4b0f-9d9c-a900dc161495'],
    deleteCodes: ['EST-2025-1023']
  },
  {
    name: 'Salvador Veltri',
    keepId: 'u_t7fxqb0y0me1fm6ec',
    keepCode: 'EST-2025-072',
    deleteIds: ['u_zsmjtajb0me1fut40'],
    deleteCodes: ['EST-2025-077']
  },
  {
    name: 'Isabel Ortiz Güemes',
    keepId: 'u_bap6b4k2rme73bmwt',
    keepCode: 'EST-2025-134',
    deleteIds: ['75188ebe-9c16-467d-8353-7313d6d65b7a'],
    deleteCodes: ['EST-2025-1744']
  },
  {
    name: 'Agustin Gonzalez Castro Feijoo ',
    keepId: 'd5aec9ad-a91c-4304-87e1-01fa6f8d399b',
    keepCode: 'EST-2025-1008',
    deleteIds: ['f5c6ca4e-cd98-4729-bbc6-51c26cd7c505'],
    deleteCodes: ['EST-2025-1010']
  }
];

/**
 * Check if user has any data before deleting
 */
async function checkUserData(userId: string): Promise<{ evaluations: number; reports: number }> {
  // Check evaluations
  const evalResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM Evaluation WHERE studentId = ?',
    args: [userId]
  });

  const evaluations = Number(evalResult.rows[0]?.count || 0);

  // For reports, we'll check if table exists and has the column
  let reports = 0;
  try {
    const reportResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM ProgressReport WHERE userId = ?',
      args: [userId]
    });
    reports = Number(reportResult.rows[0]?.count || 0);
  } catch (error) {
    // Table might not have userId column, skip
    console.log(`   ℹ️  Could not check ProgressReport for user ${userId}`);
  }

  return { evaluations, reports };
}

/**
 * Update email for a user
 */
async function updateEmail(userId: string, newEmail: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE User SET email = ? WHERE id = ?',
    args: [newEmail, userId]
  });
}

/**
 * Migrate ProgressReports to the primary user
 * Only migrates reports that don't exist in the primary user (no duplicates)
 */
async function migrateProgressReports(fromUserId: string, toUserId: string): Promise<{ migrated: number; deleted: number }> {
  // First, delete reports from duplicate user that would conflict
  const deleteResult = await db.execute({
    sql: `DELETE FROM ProgressReport
          WHERE userId = ?
          AND EXISTS (
            SELECT 1 FROM ProgressReport pr2
            WHERE pr2.userId = ?
              AND pr2.weekStart = ProgressReport.weekStart
              AND pr2.subject = ProgressReport.subject
          )`,
    args: [fromUserId, toUserId]
  });

  const deleted = deleteResult.rowsAffected || 0;

  // Then migrate the remaining non-conflicting reports
  const migrateResult = await db.execute({
    sql: 'UPDATE ProgressReport SET userId = ? WHERE userId = ?',
    args: [toUserId, fromUserId]
  });

  const migrated = migrateResult.rowsAffected || 0;

  return { migrated, deleted };
}

/**
 * Delete a user
 */
async function deleteUser(userId: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM User WHERE id = ?',
    args: [userId]
  });
}

/**
 * Verify no duplicates remain
 */
async function verifyNoDuplicates(): Promise<number> {
  const result = await db.execute(
    `SELECT
       name,
       COUNT(*) as count
     FROM User
     WHERE role = 'STUDENT'
     GROUP BY LOWER(TRIM(name)), academicYear, division
     HAVING COUNT(*) > 1`
  );

  return result.rows.length;
}

/**
 * Main consolidation function
 */
async function consolidateDuplicates(dryRun: boolean = false): Promise<void> {
  console.log('🔧 User Consolidation Script');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '✏️  LIVE'}\n`);

  let totalDeleted = 0;
  let totalEmailsFixed = 0;

  for (const duplicate of DUPLICATES) {
    console.log('\n' + '='.repeat(80));
    console.log(`Processing: ${duplicate.name}`);
    console.log('='.repeat(80));

    console.log(`\n✅ KEEP: ${duplicate.keepCode} (${duplicate.keepId})`);

    // Delete duplicates FIRST (before email correction)
    console.log(`\n❌ DELETE: ${duplicate.deleteIds.length} duplicate(s)`);

    for (let i = 0; i < duplicate.deleteIds.length; i++) {
      const deleteId = duplicate.deleteIds[i];
      const deleteCode = duplicate.deleteCodes[i];

      console.log(`\n   Processing: ${deleteCode} (${deleteId})`);

      // Check for data
      const data = await checkUserData(deleteId);

      if (data.evaluations > 0) {
        console.log(`   ⚠️  WARNING: User has ${data.evaluations} evaluation(s)!`);
        console.log(`   ❌ SKIPPING - Cannot auto-migrate evaluations`);
        continue;
      }

      if (data.reports > 0) {
        console.log(`   ℹ️  User has ${data.reports} progress report(s)`);
        console.log(`   🔄 Will migrate unique reports, delete duplicates`);

        if (!dryRun) {
          const result = await migrateProgressReports(deleteId, duplicate.keepId);
          if (result.deleted > 0) {
            console.log(`   🗑️  Deleted ${result.deleted} duplicate report(s)`);
          }
          if (result.migrated > 0) {
            console.log(`   ✅ Migrated ${result.migrated} unique report(s)`);
          }
        } else {
          console.log(`   🔍 DRY RUN - Would process ${data.reports} reports`);
        }
      } else {
        console.log(`   ✓ No data found`);
      }

      if (!dryRun) {
        await deleteUser(deleteId);
        console.log(`   ✅ User deleted`);
        totalDeleted++;
      } else {
        console.log(`   🔍 DRY RUN - Would delete`);
      }
    }

    // Email correction AFTER deleting duplicates (to avoid UNIQUE constraint)
    if (duplicate.emailCorrection) {
      console.log(`\n📧 Email correction:`);
      console.log(`   From: ${duplicate.emailCorrection.from}`);
      console.log(`   To:   ${duplicate.emailCorrection.to}`);

      if (!dryRun) {
        await updateEmail(duplicate.keepId, duplicate.emailCorrection.to);
        console.log(`   ✅ Email updated`);
        totalEmailsFixed++;
      } else {
        console.log(`   🔍 DRY RUN - No changes made`);
      }
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 CONSOLIDATION SUMMARY');
  console.log('='.repeat(80));

  console.log(`\nProcessed ${DUPLICATES.length} duplicate groups`);

  if (!dryRun) {
    console.log(`✅ Emails corrected: ${totalEmailsFixed}`);
    console.log(`✅ Users deleted: ${totalDeleted}`);

    // Verify
    console.log(`\n🔍 Verifying no duplicates remain...`);
    const remaining = await verifyNoDuplicates();

    if (remaining === 0) {
      console.log(`✅ SUCCESS! No duplicates found`);
    } else {
      console.log(`⚠️  WARNING: ${remaining} duplicate groups still exist`);
    }
  } else {
    console.log(`\n🔍 DRY RUN - No changes made`);
    console.log(`   Would correct ${DUPLICATES.filter(d => d.emailCorrection).length} emails`);
    console.log(`   Would delete ${DUPLICATES.reduce((sum, d) => sum + d.deleteIds.length, 0)} users`);
    console.log(`\n💡 Run without --dry-run to apply changes`);
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    await consolidateDuplicates(dryRun);
    console.log('\n✅ Script completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during consolidation:', error);
    process.exit(1);
  }
}

// Execute
main();
