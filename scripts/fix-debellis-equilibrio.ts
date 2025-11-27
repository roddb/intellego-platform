/**
 * Script to fix Fiamma De Bellis's Equilibrio Químico evaluation
 *
 * Issue: Evaluation eval_dbd62c70f2ac3712 (Química 5to B - Equilibrio Químico)
 * was incorrectly assigned to Matilde Pasarin de la Torre (4to C) instead of
 * Fiamma De Bellis (5to B), and has wrong score (50 instead of 60)
 *
 * Correct student: Fiamma De Bellis (81aa2e40-c8e4-4c55-838c-5afe808c5bd8) - 5to B
 * Incorrect student: Matilde Pasarin de la Torre (u_tid7bop2gme6i2g6e) - 4to C
 * Correct score: 60 (currently 50)
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const EQUILIBRIO_EVAL_ID = 'eval_dbd62c70f2ac3712';
const CORRECT_STUDENT_ID = '81aa2e40-c8e4-4c55-838c-5afe808c5bd8'; // Fiamma De Bellis
const CORRECT_STUDENT_NAME = 'Fiamma De Bellis';
const INCORRECT_STUDENT_ID = 'u_tid7bop2gme6i2g6e'; // Matilde Pasarin de la Torre
const INCORRECT_STUDENT_NAME = 'Matilde Pasarin de la Torre';
const CORRECT_SCORE = 60;
const INCORRECT_SCORE = 50;

async function fixDeBellisEquilibrio() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('🔄 Starting Fiamma De Bellis Equilibrio Químico fix...');
    console.log(`Evaluation ID: ${EQUILIBRIO_EVAL_ID}`);
    console.log(`From: ${INCORRECT_STUDENT_ID} (${INCORRECT_STUDENT_NAME} - 4to C)`);
    console.log(`To: ${CORRECT_STUDENT_ID} (${CORRECT_STUDENT_NAME} - 5to B)`);
    console.log(`Score: ${INCORRECT_SCORE} → ${CORRECT_SCORE}`);

    // Step 1: Verify evaluation exists
    console.log('\n📋 Step 1: Verifying evaluation exists...');
    const evalResult = await client.execute({
      sql: 'SELECT id, studentId, subject, examTopic, examDate, score FROM Evaluation WHERE id = ?',
      args: [EQUILIBRIO_EVAL_ID]
    });

    if (evalResult.rows.length === 0) {
      console.error('❌ Error: Evaluation not found');
      process.exit(1);
    }

    console.log('Current evaluation:', evalResult.rows[0]);

    // Step 2: Verify Fiamma De Bellis exists
    console.log('\n📋 Step 2: Verifying Fiamma De Bellis exists...');
    const student = await client.execute({
      sql: 'SELECT id, name, email, academicYear, division FROM User WHERE id = ?',
      args: [CORRECT_STUDENT_ID]
    });

    if (student.rows.length === 0) {
      console.error('❌ Error: Fiamma De Bellis not found');
      process.exit(1);
    }

    console.log('Target student:', student.rows[0]);

    // Step 3: Update evaluation studentId and score
    console.log('\n🔧 Step 3: Reassigning evaluation to Fiamma De Bellis and updating score...');
    await client.execute({
      sql: 'UPDATE Evaluation SET studentId = ?, score = ?, updatedAt = datetime(\'now\') WHERE id = ?',
      args: [CORRECT_STUDENT_ID, CORRECT_SCORE, EQUILIBRIO_EVAL_ID]
    });
    console.log('✅ StudentId and score updated');

    // Step 4: Update feedback with correct name
    console.log('\n🔧 Step 4: Updating feedback with correct student name...');
    await client.execute({
      sql: `UPDATE Evaluation
            SET feedback = REPLACE(feedback, ?, ?)
            WHERE id = ?`,
      args: [INCORRECT_STUDENT_NAME, CORRECT_STUDENT_NAME, EQUILIBRIO_EVAL_ID]
    });
    console.log('✅ Feedback updated');

    // Step 5: Verify the changes
    console.log('\n✅ Step 5: Verifying reassignment...');
    const updatedEval = await client.execute({
      sql: `SELECT e.id, e.studentId, u.name, u.academicYear, u.division, e.subject, e.examTopic, e.score, e.examDate
            FROM Evaluation e
            JOIN User u ON e.studentId = u.id
            WHERE e.id = ?`,
      args: [EQUILIBRIO_EVAL_ID]
    });

    console.log('Updated evaluation:', updatedEval.rows[0]);

    // Step 6: Verify Fiamma's evaluations
    console.log('\n✅ Step 6: Checking Fiamma De Bellis\'s evaluations...');
    const fiammaEvaluations = await client.execute({
      sql: 'SELECT id, subject, examTopic, examDate, score FROM Evaluation WHERE studentId = ? ORDER BY examDate DESC',
      args: [CORRECT_STUDENT_ID]
    });

    console.log(`\nFiamma De Bellis now has ${fiammaEvaluations.rows.length} evaluation(s):`);
    fiammaEvaluations.rows.forEach((row) => {
      console.log(`  - ${row.subject} - ${row.examTopic} (${row.examDate}): ${row.score}/100`);
    });

    // Step 7: Verify Matilde's evaluations
    console.log('\n✅ Step 7: Checking Matilde Pasarin de la Torre\'s evaluations...');
    const matildeEvaluations = await client.execute({
      sql: 'SELECT id, subject, examTopic, examDate, score FROM Evaluation WHERE studentId = ? ORDER BY examDate DESC',
      args: [INCORRECT_STUDENT_ID]
    });

    console.log(`\nMatilde Pasarin de la Torre now has ${matildeEvaluations.rows.length} evaluation(s):`);
    if (matildeEvaluations.rows.length > 0) {
      matildeEvaluations.rows.forEach((row) => {
        console.log(`  - ${row.subject} - ${row.examTopic} (${row.examDate}): ${row.score}/100`);
      });
    } else {
      console.log('  (No evaluations)');
    }

    console.log('\n✅ SUCCESS: Evaluation fixed successfully!');
    console.log('\n📌 Summary:');
    console.log('  ✅ Química 5to B - Equilibrio Químico reassigned to Fiamma De Bellis');
    console.log(`  ✅ Score updated from ${INCORRECT_SCORE} to ${CORRECT_SCORE}`);
    console.log('  ✅ Feedback updated with correct student name');
    console.log('\n📌 Next steps:');
    console.log('  1. Inform Fiamma De Bellis to check /dashboard/student/evaluations');
    console.log('  2. Verify she sees "Química 5to B - Equilibrio Químico" with score 60/100');
    console.log('  3. Verify Matilde Pasarin de la Torre no longer sees this evaluation');

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
fixDeBellisEquilibrio()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
