/**
 * Script to update Isabel Ortiz Güemes evaluation score from 68 to 80
 *
 * Reason: Instructor made manual corrections to the evaluation
 *
 * Student: Isabel Ortiz Güemes (u_bap6b4k2rme73bmwt)
 * Evaluation: eval_65de359118b7791f
 * Old score: 68
 * New score: 80
 */

import { createClient } from '@libsql/client';

const EVALUATION_ID = 'eval_65de359118b7791f';
const STUDENT_ID = 'u_bap6b4k2rme73bmwt'; // Isabel Ortiz Güemes
const OLD_SCORE = 68;
const NEW_SCORE = 80;

async function updateScore() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('🔄 Starting score update...');
    console.log(`Evaluation ID: ${EVALUATION_ID}`);
    console.log(`Student: Isabel Ortiz Güemes (${STUDENT_ID})`);
    console.log(`Old score: ${OLD_SCORE}`);
    console.log(`New score: ${NEW_SCORE}`);

    // Step 1: Verify current evaluation
    console.log('\n📋 Step 1: Verifying current evaluation...');
    const currentEval = await client.execute({
      sql: `SELECT e.id, e.studentId, u.name, e.subject, e.examDate, e.score, e.createdAt
            FROM Evaluation e
            JOIN User u ON e.studentId = u.id
            WHERE e.id = ?`,
      args: [EVALUATION_ID]
    });

    if (currentEval.rows.length === 0) {
      console.error('❌ Error: Evaluation not found');
      process.exit(1);
    }

    const current = currentEval.rows[0];
    console.log('Current evaluation:', current);

    if (current.studentId !== STUDENT_ID) {
      console.error(`❌ Error: Evaluation belongs to different student: ${current.name}`);
      process.exit(1);
    }

    if (current.score !== OLD_SCORE) {
      console.warn(`⚠️ Warning: Current score (${current.score}) differs from expected (${OLD_SCORE})`);
      console.log('Proceeding with update anyway...');
    }

    // Step 2: Update score
    console.log('\n🔧 Step 2: Updating score...');
    await client.execute({
      sql: 'UPDATE Evaluation SET score = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [NEW_SCORE, EVALUATION_ID]
    });

    console.log(`✅ Score updated from ${current.score} to ${NEW_SCORE}`);

    // Step 3: Update feedback to reflect new score
    console.log('\n🔧 Step 3: Updating feedback text with new score...');

    // Replace all occurrences of the old score in feedback
    await client.execute({
      sql: `UPDATE Evaluation
            SET feedback = REPLACE(REPLACE(REPLACE(feedback, 'Nota Final: ${OLD_SCORE}/100', 'Nota Final: ${NEW_SCORE}/100'), '**${OLD_SCORE}/100**', '**${NEW_SCORE}/100**'), 'obtenido **${OLD_SCORE}/100**', 'obtenido **${NEW_SCORE}/100**')
            WHERE id = ?`,
      args: [EVALUATION_ID]
    });

    console.log('✅ Feedback text updated with new score');

    // Step 4: Verify the change
    console.log('\n✅ Step 4: Verifying score update...');
    const updatedEval = await client.execute({
      sql: `SELECT e.id, e.studentId, u.name, u.email, e.subject, e.examDate, e.score, e.updatedAt
            FROM Evaluation e
            JOIN User u ON e.studentId = u.id
            WHERE e.id = ?`,
      args: [EVALUATION_ID]
    });

    console.log('Updated evaluation:', updatedEval.rows[0]);

    console.log('\n✅ SUCCESS: Score successfully updated for Isabel Ortiz Güemes!');
    console.log('\n📌 Summary:');
    console.log(`  • Student: ${current.name}`);
    console.log(`  • Subject: ${current.subject}`);
    console.log(`  • Exam Date: ${current.examDate}`);
    console.log(`  • Old Score: ${current.score}/100`);
    console.log(`  • New Score: ${NEW_SCORE}/100`);
    console.log(`  • Difference: +${NEW_SCORE - Number(current.score)} points`);
    console.log('\n📌 Next steps:');
    console.log('  1. Ask Isabel to refresh her browser');
    console.log('  2. She should now see her updated score of 80/100');

  } catch (error) {
    console.error('\n❌ Error during score update:', error);
    throw error;
  } finally {
    client.close();
  }
}

// Run the script
updateScore()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
