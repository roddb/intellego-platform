/**
 * Script to fix Sol Fontán's Equilibrio Químico evaluation
 *
 * Issue 1: Evaluation eval_ea74ed925bbae424 was incorrectly assigned to
 * Federica Fontan (4to C) instead of Sol Fontán (5to A)
 *
 * Issue 2: Duplicate incorrect evaluation eval_6d384a6d17328ced (Física)
 * also assigned to Federica needs to be deleted
 *
 * Correct student: Sol Fontán (u_67kfbewk9me6bcn6qp)
 * Incorrect student: Federica Fontan (u_pv2qe98lhme0b4xi4)
 */

import { createClient } from '@libsql/client';

const CHEMISTRY_EVAL_ID = 'eval_ea74ed925bbae424'; // Keep and reassign
const PHYSICS_EVAL_ID = 'eval_6d384a6d17328ced'; // Delete
const CORRECT_STUDENT_ID = 'u_67kfbewk9me6cn6qp'; // Sol Fontán
const CORRECT_STUDENT_NAME = 'Sol Fontán';
const INCORRECT_STUDENT_ID = 'u_pv2qe98lhme0b4xi4'; // Federica Fontan
const INCORRECT_STUDENT_NAME = 'Federica Fontan';

async function fixSolFontanEvaluation() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('🔄 Starting Sol Fontán evaluation fix...');
    console.log(`Chemistry Evaluation ID: ${CHEMISTRY_EVAL_ID} (reassign)`);
    console.log(`Physics Evaluation ID: ${PHYSICS_EVAL_ID} (delete)`);
    console.log(`From: ${INCORRECT_STUDENT_ID} (${INCORRECT_STUDENT_NAME})`);
    console.log(`To: ${CORRECT_STUDENT_ID} (${CORRECT_STUDENT_NAME})`);

    // Step 1: Verify both evaluations exist
    console.log('\n📋 Step 1: Verifying both evaluations...');
    const chemEval = await client.execute({
      sql: 'SELECT id, studentId, subject, examTopic, examDate, score FROM Evaluation WHERE id = ?',
      args: [CHEMISTRY_EVAL_ID]
    });

    const physEval = await client.execute({
      sql: 'SELECT id, studentId, subject, examTopic, examDate, score FROM Evaluation WHERE id = ?',
      args: [PHYSICS_EVAL_ID]
    });

    if (chemEval.rows.length === 0) {
      console.error('❌ Error: Chemistry evaluation not found');
      process.exit(1);
    }

    if (physEval.rows.length === 0) {
      console.error('⚠️ Warning: Physics evaluation not found (may have been deleted already)');
    } else {
      console.log('Physics evaluation found:', physEval.rows[0]);
    }

    console.log('Chemistry evaluation found:', chemEval.rows[0]);

    // Step 2: Verify Sol Fontán exists
    console.log('\n📋 Step 2: Verifying Sol Fontán exists...');
    const student = await client.execute({
      sql: 'SELECT id, name, email, academicYear, division FROM User WHERE id = ?',
      args: [CORRECT_STUDENT_ID]
    });

    if (student.rows.length === 0) {
      console.error('❌ Error: Sol Fontán not found');
      process.exit(1);
    }

    console.log('Student found:', student.rows[0]);

    // Step 3: Delete Physics evaluation (incorrect duplicate)
    if (physEval.rows.length > 0) {
      console.log('\n🗑️ Step 3: Deleting incorrect Physics evaluation...');
      await client.execute({
        sql: 'DELETE FROM Evaluation WHERE id = ?',
        args: [PHYSICS_EVAL_ID]
      });
      console.log('✅ Physics evaluation deleted');
    } else {
      console.log('\n⏭️ Step 3: Skipping Physics deletion (already deleted)');
    }

    // Step 4: Update Chemistry evaluation studentId
    console.log('\n🔧 Step 4: Reassigning Chemistry evaluation to Sol Fontán...');
    await client.execute({
      sql: 'UPDATE Evaluation SET studentId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [CORRECT_STUDENT_ID, CHEMISTRY_EVAL_ID]
    });
    console.log('✅ StudentId updated');

    // Step 5: Update feedback with correct name
    console.log('\n🔧 Step 5: Updating feedback with correct student name...');
    await client.execute({
      sql: `UPDATE Evaluation
            SET feedback = REPLACE(feedback, ?, ?)
            WHERE id = ?`,
      args: [INCORRECT_STUDENT_NAME, CORRECT_STUDENT_NAME, CHEMISTRY_EVAL_ID]
    });
    console.log('✅ Feedback updated');

    // Step 6: Verify the changes
    console.log('\n✅ Step 6: Verifying reassignment...');
    const updatedEval = await client.execute({
      sql: `SELECT e.id, e.studentId, u.name, u.email, e.subject, e.examTopic, e.score, e.examDate
            FROM Evaluation e
            JOIN User u ON e.studentId = u.id
            WHERE e.id = ?`,
      args: [CHEMISTRY_EVAL_ID]
    });

    console.log('Updated evaluation:', updatedEval.rows[0]);

    // Step 7: Verify Sol can now see her evaluation
    console.log('\n✅ Step 7: Checking Sol Fontán\'s evaluations...');
    const solEvaluations = await client.execute({
      sql: 'SELECT id, subject, examTopic, examDate, score FROM Evaluation WHERE studentId = ? ORDER BY examDate DESC',
      args: [CORRECT_STUDENT_ID]
    });

    console.log(`\nSol Fontán now has ${solEvaluations.rows.length} evaluation(s):`);
    solEvaluations.rows.forEach((row) => {
      console.log(`  - ${row.subject} - ${row.examTopic} (${row.examDate}): ${row.score}/100`);
    });

    // Step 8: Verify Federica no longer has incorrect evaluations
    console.log('\n✅ Step 8: Checking Federica Fontan\'s evaluations...');
    const federicaEvaluations = await client.execute({
      sql: 'SELECT id, subject, examTopic, examDate, score FROM Evaluation WHERE studentId = ? ORDER BY examDate DESC',
      args: [INCORRECT_STUDENT_ID]
    });

    console.log(`\nFederica Fontan now has ${federicaEvaluations.rows.length} evaluation(s):`);
    if (federicaEvaluations.rows.length > 0) {
      federicaEvaluations.rows.forEach((row) => {
        console.log(`  - ${row.subject} - ${row.examTopic} (${row.examDate}): ${row.score}/100`);
      });
    } else {
      console.log('  (No evaluations)');
    }

    console.log('\n✅ SUCCESS: Evaluations fixed successfully!');
    console.log('\n📌 Summary:');
    console.log('  ✅ Physics evaluation deleted');
    console.log('  ✅ Chemistry evaluation reassigned to Sol Fontán');
    console.log('  ✅ Feedback updated with correct student name');
    console.log('\n📌 Next steps:');
    console.log('  1. Inform Sol Fontán to check /dashboard/student/evaluations');
    console.log('  2. Verify she sees "Química 5to A - Equilibrio Químico" with score 68/100');
    console.log('  3. Verify Federica Fontan no longer sees these incorrect evaluations');

  } catch (error: unknown) {
    console.error('\n❌ Error during fix:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  } finally {
    client.close();
  }
}

// Run the script
fixSolFontanEvaluation()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
