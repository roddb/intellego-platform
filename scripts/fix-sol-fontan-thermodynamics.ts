/**
 * Script to fix Sol Fontán's Termodinámica evaluation
 *
 * Issue: Evaluation eval_a13c279ddcf60b43 (Física 5to A - Termodinámica)
 * was incorrectly assigned to Federica Fontan (4to C) instead of Sol Fontán (5to A)
 *
 * Correct student: Sol Fontán (u_67kfbewk9me6cn6qp) - 5to A
 * Incorrect student: Federica Fontan (u_pv2qe98lhme0b4xi4) - 4to C
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const THERMODYNAMICS_EVAL_ID = 'eval_a13c279ddcf60b43'; // Reassign to Sol
const CORRECT_STUDENT_ID = 'u_67kfbewk9me6cn6qp'; // Sol Fontán
const CORRECT_STUDENT_NAME = 'Sol Fontán';
const INCORRECT_STUDENT_ID = 'u_pv2qe98lhme0b4xi4'; // Federica Fontan
const INCORRECT_STUDENT_NAME = 'Federica Fontan';

async function fixSolFontanThermodynamics() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('🔄 Starting Sol Fontán Thermodynamics evaluation fix...');
    console.log(`Evaluation ID: ${THERMODYNAMICS_EVAL_ID}`);
    console.log(`From: ${INCORRECT_STUDENT_ID} (${INCORRECT_STUDENT_NAME} - 4to C)`);
    console.log(`To: ${CORRECT_STUDENT_ID} (${CORRECT_STUDENT_NAME} - 5to A)`);

    // Step 1: Verify evaluation exists
    console.log('\n📋 Step 1: Verifying evaluation exists...');
    const evalResult = await client.execute({
      sql: 'SELECT id, studentId, subject, examTopic, examDate, score FROM Evaluation WHERE id = ?',
      args: [THERMODYNAMICS_EVAL_ID]
    });

    if (evalResult.rows.length === 0) {
      console.error('❌ Error: Evaluation not found');
      process.exit(1);
    }

    console.log('Current evaluation:', evalResult.rows[0]);

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

    console.log('Target student:', student.rows[0]);

    // Step 3: Update evaluation studentId
    console.log('\n🔧 Step 3: Reassigning evaluation to Sol Fontán...');
    await client.execute({
      sql: 'UPDATE Evaluation SET studentId = ?, updatedAt = datetime(\'now\') WHERE id = ?',
      args: [CORRECT_STUDENT_ID, THERMODYNAMICS_EVAL_ID]
    });
    console.log('✅ StudentId updated');

    // Step 4: Update feedback with correct name
    console.log('\n🔧 Step 4: Updating feedback with correct student name...');
    await client.execute({
      sql: `UPDATE Evaluation
            SET feedback = REPLACE(feedback, ?, ?)
            WHERE id = ?`,
      args: [INCORRECT_STUDENT_NAME, CORRECT_STUDENT_NAME, THERMODYNAMICS_EVAL_ID]
    });
    console.log('✅ Feedback updated');

    // Step 5: Verify the changes
    console.log('\n✅ Step 5: Verifying reassignment...');
    const updatedEval = await client.execute({
      sql: `SELECT e.id, e.studentId, u.name, u.academicYear, u.division, e.subject, e.examTopic, e.score, e.examDate
            FROM Evaluation e
            JOIN User u ON e.studentId = u.id
            WHERE e.id = ?`,
      args: [THERMODYNAMICS_EVAL_ID]
    });

    console.log('Updated evaluation:', updatedEval.rows[0]);

    // Step 6: Verify Sol's evaluations
    console.log('\n✅ Step 6: Checking Sol Fontán\'s evaluations...');
    const solEvaluations = await client.execute({
      sql: 'SELECT id, subject, examTopic, examDate, score FROM Evaluation WHERE studentId = ? ORDER BY examDate DESC',
      args: [CORRECT_STUDENT_ID]
    });

    console.log(`\nSol Fontán now has ${solEvaluations.rows.length} evaluation(s):`);
    solEvaluations.rows.forEach((row) => {
      console.log(`  - ${row.subject} - ${row.examTopic} (${row.examDate}): ${row.score}/100`);
    });

    // Step 7: Verify Federica's evaluations
    console.log('\n✅ Step 7: Checking Federica Fontan\'s evaluations...');
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

    console.log('\n✅ SUCCESS: Evaluation fixed successfully!');
    console.log('\n📌 Summary:');
    console.log('  ✅ Física 5to A - Termodinámica reassigned to Sol Fontán');
    console.log('  ✅ Feedback updated with correct student name');
    console.log('\n📌 Next steps:');
    console.log('  1. Inform Sol Fontán to check /dashboard/student/evaluations');
    console.log('  2. Verify she sees "Física 5to A - Termodinámica" with score 61/100');
    console.log('  3. Verify Federica Fontan no longer sees this evaluation');

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
fixSolFontanThermodynamics()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
