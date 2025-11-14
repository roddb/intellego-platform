/**
 * Script to reassign evaluation eval_65de359118b7791f to Isabel Ortiz Güemes
 *
 * Issue: Evaluation was incorrectly assigned to Ignacio Ortiz Gagliano
 * due to file naming error by instructor.
 *
 * Correct student: Isabel Ortiz Güemes (u_bap6b4k2rme73bmwt)
 * Incorrect student: Ignacio Ortiz Gagliano (u_ppoee7dwpme2xaxbm)
 */

import { createClient } from '@libsql/client';

const EVALUATION_ID = 'eval_65de359118b7791f';
const CORRECT_STUDENT_ID = 'u_bap6b4k2rme73bmwt'; // Isabel Ortiz Güemes
const CORRECT_STUDENT_NAME = 'Isabel Ortiz Güemes';
const INCORRECT_STUDENT_ID = 'u_ppoee7dwpme2xaxbm'; // Ignacio Ortiz Gagliano

async function reassignEvaluation() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('🔄 Starting evaluation reassignment...');
    console.log(`Evaluation ID: ${EVALUATION_ID}`);
    console.log(`From: ${INCORRECT_STUDENT_ID}`);
    console.log(`To: ${CORRECT_STUDENT_ID} (${CORRECT_STUDENT_NAME})`);

    // Step 1: Verify current state
    console.log('\n📋 Step 1: Verifying current evaluation...');
    const currentEval = await client.execute({
      sql: 'SELECT id, studentId, subject, examDate, score, createdAt FROM Evaluation WHERE id = ?',
      args: [EVALUATION_ID]
    });

    if (currentEval.rows.length === 0) {
      console.error('❌ Error: Evaluation not found');
      process.exit(1);
    }

    console.log('Current evaluation:', currentEval.rows[0]);

    // Step 2: Verify correct student exists
    console.log('\n📋 Step 2: Verifying Isabel Ortiz Güemes exists...');
    const student = await client.execute({
      sql: 'SELECT id, name, email, academicYear, division FROM User WHERE id = ?',
      args: [CORRECT_STUDENT_ID]
    });

    if (student.rows.length === 0) {
      console.error('❌ Error: Student Isabel not found');
      process.exit(1);
    }

    console.log('Student found:', student.rows[0]);

    // Step 3: Update studentId
    console.log('\n🔧 Step 3: Updating studentId...');
    await client.execute({
      sql: 'UPDATE Evaluation SET studentId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [CORRECT_STUDENT_ID, EVALUATION_ID]
    });

    // Step 4: Update feedback with correct name
    console.log('\n🔧 Step 4: Updating feedback with correct student name...');
    const feedbackUpdate = await client.execute({
      sql: `UPDATE Evaluation
            SET feedback = REPLACE(feedback, 'Ignacio Ortiz Gagliano', ?)
            WHERE id = ?`,
      args: [CORRECT_STUDENT_NAME, EVALUATION_ID]
    });

    console.log('Feedback updated');

    // Step 5: Verify the change
    console.log('\n✅ Step 5: Verifying reassignment...');
    const updatedEval = await client.execute({
      sql: `SELECT e.id, e.studentId, u.name, u.email, e.subject, e.score, e.createdAt
            FROM Evaluation e
            JOIN User u ON e.studentId = u.id
            WHERE e.id = ?`,
      args: [EVALUATION_ID]
    });

    console.log('Updated evaluation:', updatedEval.rows[0]);

    // Step 6: Verify Isabel can now see her evaluation
    console.log('\n✅ Step 6: Checking Isabel\'s evaluations...');
    const isabelEvaluations = await client.execute({
      sql: 'SELECT id, subject, examDate, score, createdAt FROM Evaluation WHERE studentId = ?',
      args: [CORRECT_STUDENT_ID]
    });

    console.log(`\nIsabel now has ${isabelEvaluations.rows.length} evaluation(s):`);
    isabelEvaluations.rows.forEach(row => {
      console.log(`  - ${row.subject} (${row.examDate}): ${row.score}/100`);
    });

    console.log('\n✅ SUCCESS: Evaluation successfully reassigned to Isabel Ortiz Güemes!');
    console.log('\n📌 Next steps:');
    console.log('  1. Ask Isabel to refresh her browser and check /dashboard/student/evaluations');
    console.log('  2. Verify she can see her Química evaluation with score 68/100');
    console.log('  3. Inform her the issue has been resolved');

  } catch (error) {
    console.error('\n❌ Error during reassignment:', error);
    throw error;
  } finally {
    client.close();
  }
}

// Run the script
reassignEvaluation()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
