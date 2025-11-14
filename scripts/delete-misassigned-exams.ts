/**
 * Script to delete misassigned exams
 *
 * Deletes 8 exams that were incorrectly assigned to students from wrong courses
 *
 * Usage: npx tsx scripts/delete-misassigned-exams.ts [--dry-run]
 */

import { createClient } from '@libsql/client';

// Database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

// IDs of exams to delete
const MISASSIGNED_EXAM_IDS = [
  // Federica Fontan (4to C) with 5to A exams
  'eval_7af5c789080489c2',  // Química 5to A - 2025-10-30
  'eval_0cfb40124bf121f7',  // Física 5to A - 2025-10-30
  'eval_883e21ac7ca4a6c6',  // Física 5to A - 2025-10-30
  'eval_eb03f54abf5e81ab',  // Química 5to A - 2025-10-07
  'eval_af09ec1869eade83',  // Química 5to A - 2025-10-07

  // Ignacio Ortiz Gagliano (4to E) with 5to B exams
  'eval_d6e2044a029e8d02',  // Química 5to B - 2025-10-30
  'eval_8d6eb79047c665b1',  // Química 5to B - 2025-10-30

  // Matilde Pasarin de la Torre (4to C) with 5to B exam
  'eval_b9b85dc53e0fbdbb'   // Química 5to B - 2025-10-30
];

interface ExamDetails {
  id: string;
  studentId: string;
  studentName: string;
  studentCourse: string;
  subject: string;
  examTopic: string;
  examDate: string;
  score: number;
}

/**
 * Get details of an exam
 */
async function getExamDetails(examId: string): Promise<ExamDetails | null> {
  const result = await db.execute({
    sql: `SELECT
            e.id,
            e.studentId,
            u.name as studentName,
            u.academicYear || ' ' || u.division as studentCourse,
            e.subject,
            e.examTopic,
            e.examDate,
            e.score
          FROM Evaluation e
          JOIN User u ON e.studentId = u.id
          WHERE e.id = ?`,
    args: [examId]
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: String(row.id),
    studentId: String(row.studentId),
    studentName: String(row.studentName),
    studentCourse: String(row.studentCourse),
    subject: String(row.subject),
    examTopic: String(row.examTopic),
    examDate: String(row.examDate),
    score: Number(row.score)
  };
}

/**
 * Delete an exam
 */
async function deleteExam(examId: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM Evaluation WHERE id = ?',
    args: [examId]
  });
}

/**
 * Main deletion function
 */
async function deleteMisassignedExams(dryRun: boolean = false): Promise<void> {
  console.log('🗑️  Delete Misassigned Exams Script');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '✏️  LIVE'}\n`);

  let foundCount = 0;
  let deletedCount = 0;
  let notFoundCount = 0;

  console.log(`Processing ${MISASSIGNED_EXAM_IDS.length} exam IDs...\n`);

  for (const examId of MISASSIGNED_EXAM_IDS) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Exam ID: ${examId}`);

    // Get exam details
    const exam = await getExamDetails(examId);

    if (!exam) {
      console.log(`⚠️  Exam not found (may have been deleted already)`);
      notFoundCount++;
      continue;
    }

    foundCount++;

    // Show details
    console.log(`\nStudent: ${exam.studentName} (${exam.studentCourse})`);
    console.log(`Exam: ${exam.subject} - ${exam.examTopic}`);
    console.log(`Date: ${exam.examDate} | Score: ${exam.score}`);
    console.log(`❌ MISASSIGNED (student should not have this exam)`);

    // Delete
    if (!dryRun) {
      await deleteExam(examId);
      console.log(`✅ Deleted`);
      deletedCount++;
    } else {
      console.log(`🔍 DRY RUN - Would delete`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 DELETION SUMMARY');
  console.log('='.repeat(80));

  console.log(`\nTotal IDs to process: ${MISASSIGNED_EXAM_IDS.length}`);
  console.log(`✅ Found: ${foundCount}`);
  console.log(`⚠️  Not found: ${notFoundCount}`);

  if (!dryRun) {
    console.log(`🗑️  Deleted: ${deletedCount}`);
  } else {
    console.log(`\n🔍 DRY RUN - No changes made`);
    console.log(`   Would delete ${foundCount} exams`);
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
    await deleteMisassignedExams(dryRun);
    console.log('\n✅ Script completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    process.exit(1);
  }
}

// Execute
main();
