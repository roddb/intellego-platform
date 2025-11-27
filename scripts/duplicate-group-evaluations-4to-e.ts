/**
 * Script para duplicar evaluaciones del informe APP Dinámica
 * para los 6 grupos de trabajo de 4to E
 *
 * Total: 18 evaluaciones a crear
 */

import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const GRUPOS_4TO_E = [
  {
    nombre: 'Grupo 1 - Attanasio',
    evaluacionBase: 'eval_c6a444fc01343d03', // Attanasio, Bautista - 86 pts
    integrantes: [
      {
        nombre: 'Lopez, Benjamín',
        studentId: 'u_eg4pqh49ume1bzrv3',
      },
      {
        nombre: 'Osepyan, Valentin Nicolas',
        studentId: 'u_knlu3efo1me1c39r9',
      },
      {
        nombre: 'Shofs Turoni Lima, Enzo',
        studentId: 'u_9ecakaqjlme1bw973',
      },
    ],
  },
  {
    nombre: 'Grupo 2 - Sarti, Maria Agustina',
    evaluacionBase: 'eval_e739cd15c174e72b', // Sarti, Maria Agustina - 90 pts
    integrantes: [
      {
        nombre: 'Zubero Horisberger, Iñaki',
        studentId: 'u_ps7y0ovuvme1bx96e',
      },
      {
        nombre: 'Bollmann, Gabriel Maximiliano',
        studentId: 'u_jb53muhskme2x8253',
      },
      {
        nombre: 'Chouela, Lourdes Agustina',
        studentId: 'u_34ikfk0ctme1bvm6k',
      },
      {
        nombre: 'Lopez Milano, Sebastián José',
        studentId: 'u_jjcjumyigme1bxb6d',
      },
    ],
  },
  {
    nombre: 'Grupo 3 - Castro',
    evaluacionBase: 'eval_0b10880f5ca2c5c0', // Castro Jalile, Paloma - 71 pts
    integrantes: [
      {
        nombre: 'Laugier, Juan Cruz',
        studentId: 'u_q0wslezygme2xa6aw',
      },
      {
        nombre: 'Fantin, Isabella',
        studentId: 'u_tnjcagj37me1c4n0j',
      },
      {
        nombre: 'Medriano, Juan Bautista',
        studentId: 'u_94wnlwgwqme1bxmqu',
      },
    ],
  },
  {
    nombre: 'Grupo 4 - Ces Casali',
    evaluacionBase: 'eval_20985d0ece7ccd68', // Ces Casali, Teodora - 86 pts
    integrantes: [
      {
        nombre: 'Valle, Uma',
        studentId: 'u_3wmjdusbdme1bxp0i',
      },
      {
        nombre: 'Mayenfisch Paz, Julia',
        studentId: 'u_g4dq2j6g8me1bxxtu',
      },
    ],
  },
  {
    nombre: 'Grupo 5 - Legname',
    evaluacionBase: 'eval_d78b704b591e10e1', // Legname, Violeta - 86 pts
    integrantes: [
      {
        nombre: 'Cacopardo, Catalina',
        studentId: 'u_dolvu0ftme1bvul5',
      },
      {
        nombre: 'Hetenyi, Joaquin Valentino',
        studentId: 'u_bfdrl08g5me1c1b1m',
      },
      {
        nombre: 'Santos, Milo',
        studentId: 'u_6greeuiz1me1bxwwd',
      },
    ],
  },
  {
    nombre: 'Grupo 6 - Claro',
    evaluacionBase: 'eval_fcb79662d7663239', // Claro, Dunia - 84 pts
    integrantes: [
      {
        nombre: 'Amato, Francisco',
        studentId: 'u_tmyqpybslme1bxt15',
      },
      {
        nombre: 'Reig, Charo',
        studentId: '7c833c54-face-42df-8ba9-758c9e0a838e',
      },
      {
        nombre: 'Kemel Basso, Agustin Lucas',
        studentId: 'u_gcjmjnrnqme1c1o1f',
      },
    ],
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
  console.log('🚀 Duplicando evaluaciones - 4to E APP Dinámica\n');
  console.log('📋 6 grupos de trabajo');
  console.log('📁 18 evaluaciones a crear\n');

  let exitosas = 0;
  let omitidas = 0;

  for (const grupo of GRUPOS_4TO_E) {
    console.log(`\n📦 ${grupo.nombre}`);
    console.log(`   🔑 Evaluación base: ${grupo.evaluacionBase}`);
    console.log(`   👥 Integrantes a procesar: ${grupo.integrantes.length}`);

    for (const integrante of grupo.integrantes) {
      console.log(`\n   👤 ${integrante.nombre}`);
      console.log(`   🔑 ID: ${integrante.studentId}`);

      const success = await duplicateEvaluation(
        grupo.evaluacionBase,
        integrante.studentId,
        integrante.nombre
      );

      if (success) {
        exitosas++;
      } else {
        omitidas++;
      }
    }
    console.log('');
  }

  console.log('\n✅ Proceso completado');
  console.log(`   📊 Evaluaciones creadas: ${exitosas}/18`);
  console.log(`   ⚠️  Evaluaciones omitidas: ${omitidas}`);
  console.log(`   🎯 Total 4to E: ${exitosas + 6} estudiantes con evaluación de Dinámica\n`);

  await client.close();
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
