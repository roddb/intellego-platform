/**
 * Script to update Josefina Verdier's Equilibrio Químico exam score
 * From: 48 → To: 74
 * Evaluation ID: eval_ac1796af8743145e
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Error: Missing Turso environment variables');
  console.error('Required: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN');
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function updateJosefinaScore(): Promise<void> {
  try {
    console.log('🔍 Verificando datos actuales...\n');

    // Verify current data
    const currentData = await db.execute({
      sql: `
        SELECT
          e.id,
          e.examTopic,
          e.score,
          u.name as student_name,
          u.email,
          u.division,
          e.examDate,
          e.createdAt
        FROM Evaluation e
        JOIN User u ON e.studentId = u.id
        WHERE e.id = ?
      `,
      args: ['eval_ac1796af8743145e']
    });

    if (currentData.rows.length === 0) {
      console.error('❌ Error: Evaluation not found');
      process.exit(1);
    }

    const evaluation = currentData.rows[0];
    console.log('📊 Datos actuales:');
    console.log(`   Estudiante: ${evaluation.student_name}`);
    console.log(`   Email: ${evaluation.email}`);
    console.log(`   División: 5to ${evaluation.division}`);
    console.log(`   Tema: ${evaluation.examTopic}`);
    console.log(`   Fecha: ${evaluation.examDate}`);
    console.log(`   Nota actual: ${evaluation.score}`);
    console.log('');

    // Update score
    console.log('✏️  Actualizando nota a 74...\n');

    const updateResult = await db.execute({
      sql: `
        UPDATE Evaluation
        SET score = ?,
            updatedAt = datetime('now')
        WHERE id = ?
      `,
      args: [74, 'eval_ac1796af8743145e']
    });

    console.log(`✅ Actualización exitosa (${updateResult.rowsAffected} fila afectada)\n`);

    // Verify updated data
    const updatedData = await db.execute({
      sql: `
        SELECT
          e.id,
          e.examTopic,
          e.score,
          u.name as student_name,
          e.updatedAt
        FROM Evaluation e
        JOIN User u ON e.studentId = u.id
        WHERE e.id = ?
      `,
      args: ['eval_ac1796af8743145e']
    });

    const updatedEval = updatedData.rows[0];
    console.log('📊 Datos actualizados:');
    console.log(`   Estudiante: ${updatedEval.student_name}`);
    console.log(`   Tema: ${updatedEval.examTopic}`);
    console.log(`   Nueva nota: ${updatedEval.score}`);
    console.log(`   Actualizado: ${updatedEval.updatedAt}`);
    console.log('');
    console.log('✨ Operación completada exitosamente');

  } catch (error: unknown) {
    console.error('❌ Error durante la actualización:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error('   Error desconocido');
    }
    process.exit(1);
  }
}

// Execute
updateJosefinaScore()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('❌ Error fatal:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  });
