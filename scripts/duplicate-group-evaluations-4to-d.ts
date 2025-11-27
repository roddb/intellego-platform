/**
 * Script para duplicar evaluaciones del informe APP Dinámica
 * para los 5 grupos de trabajo de 4to D
 *
 * Total: 16 evaluaciones a crear
 */

import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

const GRUPOS_4TO_D = [
  {
    nombre: 'Grupo 1 - Cifone',
    evaluacionBase: 'eval_cd4400e56f8d9628', // Cifone, Juana - 86 pts
    integrantes: [
      {
        nombre: 'Hansen, Veronica Ivana',
        studentId: 'u_icojg9yv3me1yt3l8',
      },
      {
        nombre: 'Opacak, Maria Sofia',
        studentId: 'eed629ef-850b-4038-be81-a18fb3d06600',
      },
    ],
  },
  {
    nombre: 'Grupo 2 - Carbajales',
    evaluacionBase: 'eval_263ab8240e735d0e', // Carbajales, Tomás - 86 pts
    integrantes: [
      {
        nombre: 'Veltri, Salvador',
        studentId: 'u_t7fxqb0y0me1fm6ec',
      },
      {
        nombre: 'Chitarino, Constantino',
        studentId: 'fc83bcc5-a971-4f25-a493-fee973aedbbe',
      },
      // NOTA: Rodriguez y Merediz EXCLUIDOS (no participaron del proyecto)
    ],
  },
  {
    nombre: 'Grupo 3 - Janson',
    evaluacionBase: 'eval_e4a527535613671e', // Janson, Kiara - 86 pts
    integrantes: [
      {
        nombre: 'Cesarini, Uma Bianca',
        studentId: 'u_7l7mqqsh4me06hzx8',
      },
      {
        nombre: 'Delaico, María Emilia',
        studentId: 'u_tk1vcmquxme06mhr4',
      },
      {
        nombre: 'Gilardi, Catalina',
        studentId: 'u_abe3h0317me06njgs',
      },
      {
        nombre: 'Barria, María',
        studentId: '081cc56b-878d-4f2c-8fb1-18a35171589b',
      },
      {
        nombre: 'Gonzalez Arce, Mia',
        studentId: 'u_axwjy36zgme06m4sr',
      },
    ],
  },
  {
    nombre: 'Grupo 4 - Bono',
    evaluacionBase: 'eval_5553f482bd3fac81', // Bono, Emma - 95 pts
    integrantes: [
      {
        nombre: 'Diaz, Conrado',
        studentId: 'u_asv9bhh8zme06j7jo',
      },
      {
        nombre: 'Focke, Olivia',
        studentId: '1f8c28c1-98fc-464b-a822-d8adfba4725f',
      },
      {
        nombre: 'Lugo Ibañez, Franco',
        studentId: 'u_h52avro4ome1fmelf',
      },
      {
        nombre: 'Manzullo, María Justina',
        studentId: 'u_92u4fm0txme1fny4m',
      },
      {
        nombre: 'Rios, Juan Ignacio',
        studentId: 'u_0dw79d8pume1fp20s',
      },
    ],
  },
  {
    nombre: 'Grupo 5 - Alborello',
    evaluacionBase: 'eval_9818cc83da66297e', // Alborello Arena, Clara - 87 pts
    integrantes: [
      {
        nombre: 'Grasso, Delfina',
        studentId: 'u_fcr9p35cgme607v47',
      },
      {
        nombre: 'Pinto, Oriana Victoria',
        studentId: 'u_yxgl6st6zme03hza8',
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
  console.log('🚀 Duplicando evaluaciones - 4to D APP Dinámica\n');
  console.log('📋 5 grupos de trabajo');
  console.log('📁 16 evaluaciones a crear\n');

  let exitosas = 0;
  let omitidas = 0;

  for (const grupo of GRUPOS_4TO_D) {
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
  console.log(`   📊 Evaluaciones creadas: ${exitosas}/16`);
  console.log(`   ⚠️  Evaluaciones omitidas: ${omitidas}`);
  console.log(`   🎯 Total 4to D: ${exitosas + 5} estudiantes con evaluación de Dinámica\n`);

  await client.close();
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
