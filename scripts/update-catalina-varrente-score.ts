/**
 * Script to update Catalina Varrente's Termodinámica score
 *
 * Issue: Evaluation eval_bc153864c28eb8e7 (Física 5to A - Termodinámica)
 * needs score update from 48 to 61
 *
 * Student: Catalina Varrente (u_4cnmxf77amdynltex) - 5to A
 * Current score: 48
 * New score: 61
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const EVALUATION_ID = 'eval_bc153864c28eb8e7';
const STUDENT_ID = 'u_4cnmxf77amdynltex';
const STUDENT_NAME = 'Catalina Varrente';
const OLD_SCORE = 48;
const NEW_SCORE = 61;

async function updateCatalinaVarrenteScore() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('🔄 Starting Catalina Varrente score update...');
    console.log(`Evaluation ID: ${EVALUATION_ID}`);
    console.log(`Student: ${STUDENT_NAME} (${STUDENT_ID}) - 5to A`);
    console.log(`Score: ${OLD_SCORE} → ${NEW_SCORE}`);

    // Step 1: Verify evaluation exists
    console.log('\n📋 Step 1: Verifying evaluation exists...');
    const evalResult = await client.execute({
      sql: 'SELECT id, studentId, subject, examTopic, examDate, score FROM Evaluation WHERE id = ?',
      args: [EVALUATION_ID]
    });

    if (evalResult.rows.length === 0) {
      console.error('❌ Error: Evaluation not found');
      process.exit(1);
    }

    console.log('Current evaluation:', evalResult.rows[0]);

    // Step 2: Update score
    console.log('\n🔧 Step 2: Updating score...');
    await client.execute({
      sql: 'UPDATE Evaluation SET score = ?, updatedAt = datetime(\'now\') WHERE id = ?',
      args: [NEW_SCORE, EVALUATION_ID]
    });
    console.log('✅ Score updated');

    // Step 3: Verify the changes
    console.log('\n✅ Step 3: Verifying update...');
    const updatedEval = await client.execute({
      sql: `SELECT e.id, e.studentId, u.name, u.academicYear, u.division, e.subject, e.examTopic, e.score, e.examDate
            FROM Evaluation e
            JOIN User u ON e.studentId = u.id
            WHERE e.id = ?`,
      args: [EVALUATION_ID]
    });

    console.log('Updated evaluation:', updatedEval.rows[0]);

    // Step 4: Show all Catalina's evaluations
    console.log('\n✅ Step 4: Checking Catalina Varrente\'s evaluations...');
    const catalinaEvaluations = await client.execute({
      sql: 'SELECT id, subject, examTopic, examDate, score FROM Evaluation WHERE studentId = ? ORDER BY examDate DESC',
      args: [STUDENT_ID]
    });

    console.log(`\nCatalina Varrente has ${catalinaEvaluations.rows.length} evaluation(s):`);
    catalinaEvaluations.rows.forEach((row) => {
      console.log(`  - ${row.subject} - ${row.examTopic} (${row.examDate}): ${row.score}/100`);
    });

    console.log('\n✅ SUCCESS: Score updated successfully!');
    console.log('\n📌 Summary:');
    console.log(`  ✅ Física 5to A - Termodinámica score updated from ${OLD_SCORE} to ${NEW_SCORE}`);
    console.log('\n📌 Next steps:');
    console.log('  1. Inform Catalina Varrente that her score has been updated');
    console.log('  2. She can verify at /dashboard/student/evaluations');

  } catch (error: unknown) {
    console.error('\n❌ Error during update:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  } finally {
    client.close();
  }
}

// Run the script
updateCatalinaVarrenteScore()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
