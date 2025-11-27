/**
 * Script para duplicar evaluaciones del informe "APP Dinámica" a todos los integrantes de cada grupo
 *
 * Contexto:
 * - Los informes de laboratorio son trabajos GRUPALES
 * - Solo 1 integrante por grupo subió el archivo → solo ese integrante tiene evaluación
 * - Este script duplica la evaluación a todos los demás integrantes del mismo grupo
 *
 * Ejecución:
 * npx tsx scripts/duplicate-group-evaluations-app-dinamica.ts
 */

import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

// Configurar cliente Turso
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Definición de grupos (basado en imagen proporcionada)
const GRUPOS = [
  {
    nombre: 'Grupo Bargas',
    evaluacionBase: 'eval_a994efe107b21b83', // Sofia Bargas - 95 pts
    integrantes: ['Bargas', 'Fontan', 'Marrazzo', 'Rizzo'],
  },
  {
    nombre: 'Grupo Behmer',
    evaluacionBase: 'eval_836434856b240f65', // Brenda Behmer - 85 pts
    integrantes: ['Behmer', 'Gaeta', 'Monsegur', 'Vertedor'],
  },
  {
    nombre: 'Grupo Bongiovanni',
    evaluacionBase: 'eval_46c360386fbf48f5', // Lourdes Bongiovanni - 90 pts
    integrantes: ['Bongiovanni', 'Paccie', 'Pasarin', 'García'],
  },
  {
    nombre: 'Grupo Ceriani',
    evaluacionBase: 'eval_8f037eb3cfb9ddc7', // Juliana Ceriani - 78 pts
    integrantes: ['Ceriani', 'Perri', 'Garmendia', 'Papa', 'Palamenghi'],
  },
  {
    nombre: 'Grupo Lo Valvo',
    evaluacionBase: 'eval_e81bbbf8bc444949', // Agustin Lo Valvo - 82 pts
    integrantes: ['Lo Valvo', 'Lázaro', 'Giles', 'Maioli', 'Isola'],
  },
];

/**
 * Normaliza apellido para matching
 * - Remueve tildes
 * - Convierte a minúsculas
 * - Remueve caracteres especiales excepto espacios
 */
function normalizeApellido(apellido: string): string {
  return apellido
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .trim();
}

/**
 * Busca un estudiante por apellido en la tabla User
 * Usa fuzzy matching (normalización) para tolerar diferencias de tildes/mayúsculas
 */
async function findStudentByApellido(apellido: string): Promise<{ id: string; name: string } | null> {
  try {
    // Buscar estudiantes activos
    const result = await client.execute({
      sql: `SELECT id, name FROM User WHERE role = 'STUDENT' AND status = 'ACTIVE'`,
      args: [],
    });

    const normalizedSearch = normalizeApellido(apellido);

    // Buscar match por apellido normalizado
    for (const row of result.rows) {
      const studentName = row.name as string;
      const studentApellidos = studentName.split(' ').slice(1); // Tomar todo después del nombre

      for (const studentApellido of studentApellidos) {
        if (normalizeApellido(studentApellido) === normalizedSearch) {
          return {
            id: row.id as string,
            name: studentName,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`❌ Error buscando estudiante "${apellido}":`, error);
    return null;
  }
}

/**
 * Verifica si un estudiante ya tiene una evaluación para el tema "Dinámica"
 */
async function hasEvaluationForTopic(studentId: string, topic: string): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: `SELECT COUNT(*) as count FROM Evaluation WHERE studentId = ? AND examTopic = ?`,
      args: [studentId, topic],
    });

    const count = result.rows[0]?.count as number;
    return count > 0;
  } catch (error) {
    console.error(`❌ Error verificando evaluación existente:`, error);
    return false;
  }
}

/**
 * Duplica una evaluación para un nuevo estudiante
 * Mantiene todos los campos idénticos excepto id y studentId
 */
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

/**
 * Main function - procesa todos los grupos
 */
async function main() {
  console.log('🚀 Iniciando duplicación de evaluaciones grupales - APP Dinámica\n');
  console.log(`📋 Total de grupos a procesar: ${GRUPOS.length}\n`);

  let totalCreadas = 0;
  let totalErrores = 0;

  for (const grupo of GRUPOS) {
    console.log(`\n📁 Procesando ${grupo.nombre}...`);
    console.log(`   Evaluación base: ${grupo.evaluacionBase}`);
    console.log(`   Integrantes: ${grupo.integrantes.join(', ')}`);

    // Saltar el primer integrante (ya tiene la evaluación)
    const integrantesRestantes = grupo.integrantes.slice(1);

    for (const apellido of integrantesRestantes) {
      console.log(`\n   👤 Procesando: ${apellido}`);

      // 1. Buscar estudiante
      const student = await findStudentByApellido(apellido);
      if (!student) {
        console.log(`      ⚠️  Estudiante no encontrado en DB`);
        totalErrores++;
        continue;
      }

      console.log(`      ✓ Encontrado: ${student.name} (${student.id})`);

      // 2. Verificar si ya tiene evaluación
      const hasEval = await hasEvaluationForTopic(student.id, 'Dinámica');
      if (hasEval) {
        console.log(`      ⚠️  Ya tiene evaluación para este tema - omitiendo`);
        continue;
      }

      // 3. Duplicar evaluación
      const success = await duplicateEvaluation(
        grupo.evaluacionBase,
        student.id,
        student.name
      );

      if (success) {
        totalCreadas++;
      } else {
        totalErrores++;
      }
    }
  }

  console.log('\n\n✅ Proceso completado');
  console.log(`   📊 Evaluaciones creadas: ${totalCreadas}`);
  console.log(`   ❌ Errores: ${totalErrores}`);
  console.log(`   📈 Total esperado: 15 (3-4 por grupo × 5 grupos)\n`);

  await client.close();
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
