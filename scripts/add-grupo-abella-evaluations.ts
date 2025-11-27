/**
 * Script para duplicar la evaluación del informe APP Dinámica
 * al Grupo 7 - Abella (Catapulta)
 *
 * Evaluación base: Martin Bautista Abella - 85 pts
 */

import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const GRUPO_ABELLA = [
  {
    nombre: 'Donadio, Magdalena',
    studentId: 'u_q8vglr2n7me0b5ree',
  },
  {
    nombre: 'Margueirat, Joaquín',
    studentId: 'u_0mkknqzfwme0b1gv6',
  },
  {
    nombre: 'Pleitel, Mia',
    studentId: 'u_orrudyvptme0b5ua2',
  },
];

const EVALUACION_BASE_ABELLA = 'eval_e21dada584b09996'; // Martin Bautista Abella - 85 pts

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

    // 2. Verificar si ya tiene evaluación
    const checkResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM Evaluation WHERE studentId = ? AND examTopic = ?`,
      args: [targetStudentId, baseEval.examTopic],
    });

    const count = checkResult.rows[0]?.count as number;
    if (count > 0) {
      console.log(`   ⚠️  ${targetStudentName} ya tiene evaluación - omitiendo`);
      return false;
    }

    // 3. Generar nuevo ID único
    const newId = `eval_${randomBytes(8).toString('hex')}`;

    // 4. Insertar nueva evaluación
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
  console.log('🚀 Duplicando evaluación - Grupo 7 Abella (APP Dinámica - Catapulta)\n');
  console.log('📋 Evaluación base: Martin Bautista Abella - 85 pts');
  console.log(`📁 Integrantes a procesar: ${GRUPO_ABELLA.length}\n`);

  let exitosas = 0;

  for (const integrante of GRUPO_ABELLA) {
    console.log(`   👤 ${integrante.nombre}`);
    console.log(`   🔑 ID: ${integrante.studentId}`);

    const success = await duplicateEvaluation(
      EVALUACION_BASE_ABELLA,
      integrante.studentId,
      integrante.nombre
    );

    if (success) {
      exitosas++;
    }
    console.log('');
  }

  console.log('✅ Proceso completado');
  console.log(`   📊 Evaluaciones creadas: ${exitosas}/3`);
  console.log(`   🎯 Total Grupo Abella: 4/4 (Martin + ${exitosas})\n`);

  await client.close();
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
