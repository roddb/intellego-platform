/**
 * Script para agregar las 3 evaluaciones faltantes del informe APP Dinámica
 * usando IDs directos de los estudiantes
 *
 * Estudiantes faltantes:
 * - Marrazzo, Lola (Grupo Bargas)
 * - Vertedor Salinas, Fiorella (Grupo Behmer)
 * - Maioli, Bautista Lucas (Grupo Lo Valvo)
 */

import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const EVALUACIONES_FALTANTES = [
  {
    nombre: 'Marrazzo, Lola',
    studentId: 'u_gjtitt5qlme0b5p2x',
    evaluacionBase: 'eval_a994efe107b21b83', // Sofia Bargas - 95 pts
    grupo: 'Grupo Bargas',
  },
  {
    nombre: 'Vertedor Salinas, Fiorella',
    studentId: 'u_madzeow6xme0bap6m',
    evaluacionBase: 'eval_836434856b240f65', // Brenda Behmer - 85 pts
    grupo: 'Grupo Behmer',
  },
  {
    nombre: 'Maioli, Bautista Lucas',
    studentId: 'u_rkrgujb30me0b536p',
    evaluacionBase: 'eval_e81bbbf8bc444949', // Agustin Lo Valvo - 82 pts
    grupo: 'Grupo Lo Valvo',
  },
];

async function duplicateEvaluation(
  baseEvaluationId: string,
  targetStudentId: string,
  targetStudentName: string
): Promise<boolean> {
  try {
    // 1. Obtener evaluación base
    const evalResult = await client.execute({
      sql: `SELECT * FROM Evaluation WHERE id = ?`,
      args: [baseEvaluationId],
    });

    if (evalResult.rows.length === 0) {
      console.error(`❌ Evaluación base ${baseEvaluationId} no encontrada`);
      return false;
    }

    const baseEval = evalResult.rows[0];

    // 2. Generar nuevo ID único
    const newId = `eval_${randomBytes(8).toString('hex')}`;

    // 3. Insertar nueva evaluación
    await client.execute({
      sql: `
        INSERT INTO Evaluation (
          id, studentId, subject, examDate, examTopic, score, feedback,
          createdBy, createdAt, updatedAt, apiCost, apiModel,
          apiTokensInput, apiTokensOutput, rubricId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?)
      `,
      args: [
        newId,
        targetStudentId,
        baseEval.subject,
        baseEval.examDate,
        baseEval.examTopic,
        baseEval.score,
        baseEval.feedback,
        baseEval.createdBy,
        baseEval.createdAt, // Mantener fecha original (trabajo grupal)
        baseEval.apiCost,
        baseEval.apiModel,
        baseEval.apiTokensInput,
        baseEval.apiTokensOutput,
        baseEval.rubricId,
      ],
    });

    console.log(`   ✅ Evaluación duplicada para ${targetStudentName} (score: ${baseEval.score})`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error duplicando evaluación para ${targetStudentName}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Agregando 3 evaluaciones faltantes - APP Dinámica\n');

  let exitosas = 0;

  for (const evaluacion of EVALUACIONES_FALTANTES) {
    console.log(`\n📁 ${evaluacion.grupo}`);
    console.log(`   👤 ${evaluacion.nombre}`);
    console.log(`   🔑 ID: ${evaluacion.studentId}`);

    const success = await duplicateEvaluation(
      evaluacion.evaluacionBase,
      evaluacion.studentId,
      evaluacion.nombre
    );

    if (success) {
      exitosas++;
    }
  }

  console.log('\n\n✅ Proceso completado');
  console.log(`   📊 Evaluaciones creadas: ${exitosas}/3`);

  await client.close();
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
