/**
 * Script: Agregar 6 nuevas rúbricas de recuperatorio 2025
 *
 * Rúbricas incluidas:
 * - Física: Caída Libre y Tiro Vertical, MRU y MRUV, Tiro Oblicuo
 * - Química: Estructura Atómica, Gases Ideales, Magnitudes Atómicas
 *
 * Usage: npx tsx scripts/add-rubricas-recuperatorio-2025.ts
 */

import { db } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

interface RubricData {
  id: string;
  name: string;
  description: string;
  fileName: string;
  subject: string;
  examType: string;
}

const RUBRICAS: RubricData[] = [
  // Física
  {
    id: 'rubric-fisica-caida-libre-tiro-vertical',
    name: 'Caída Libre y Tiro Vertical - Recuperatorio',
    description: 'Rúbrica para recuperatorio de Física - 4to Año: Caída libre (v₀ = 0), tiro vertical hacia arriba, altura máxima y tiempos de vuelo',
    fileName: 'Rubrica_Fisica_CaidaLibre_TiroVertical.md',
    subject: 'Física',
    examType: 'Recuperatorio',
  },
  {
    id: 'rubric-fisica-mru-mruv',
    name: 'MRU y MRUV - Recuperatorio',
    description: 'Rúbrica para recuperatorio de Física - 4to Año: Movimiento rectilíneo uniforme y uniformemente variado, conversión de unidades, movimientos combinados',
    fileName: 'Rubrica_Fisica_MRU_MRUV.md',
    subject: 'Física',
    examType: 'Recuperatorio',
  },
  {
    id: 'rubric-fisica-tiro-oblicuo',
    name: 'Tiro Oblicuo - Recuperatorio',
    description: 'Rúbrica para recuperatorio de Física - 4to Año: Descomposición de velocidad, movimiento parabólico, altura máxima, alcance horizontal, tiro horizontal',
    fileName: 'Rubrica_Fisica_TiroOblicuo.md',
    subject: 'Física',
    examType: 'Recuperatorio',
  },
  // Química
  {
    id: 'rubric-quimica-estructura-atomica',
    name: 'Estructura Atómica - Recuperatorio',
    description: 'Rúbrica para recuperatorio de Química - 4to Año: Partículas subatómicas, número atómico y másico, configuración electrónica, isótopos/isóbaros/isótonos',
    fileName: 'Rubrica_Quimica_EstructuraAtomica.md',
    subject: 'Química',
    examType: 'Recuperatorio',
  },
  {
    id: 'rubric-quimica-gases-ideales',
    name: 'Gases Ideales - Recuperatorio',
    description: 'Rúbrica para recuperatorio de Química - 4to Año: Ecuación de estado PV=nRT, ecuación combinada, procesos isotérmicos/isobáricos/isocóricos',
    fileName: 'Rubrica_Quimica_GasesIdeales.md',
    subject: 'Química',
    examType: 'Recuperatorio',
  },
  {
    id: 'rubric-quimica-magnitudes-atomicas',
    name: 'Magnitudes Atómicas y Moleculares - Recuperatorio',
    description: 'Rúbrica para recuperatorio de Química - 4to Año: Mol, número de Avogadro, masa molar, conversiones masa-moles-partículas',
    fileName: 'Rubrica_Quimica_MagnitudesAtomicas.md',
    subject: 'Química',
    examType: 'Recuperatorio',
  },
];

async function addRubricasRecuperatorio2025(): Promise<void> {
  console.log('============================================');
  console.log('  Agregar Rúbricas Recuperatorio 2025');
  console.log('============================================\n');

  try {
    const client = db();

    // Get an instructor user
    const usersResult = await client.execute(`
      SELECT id FROM User WHERE role = 'INSTRUCTOR' LIMIT 1
    `);

    if (usersResult.rows.length === 0) {
      throw new Error('No instructor found. Please create an instructor user first.');
    }

    const instructorId = (usersResult.rows[0] as unknown as { id: string }).id;
    const now = new Date().toISOString();
    const rubricasDir = path.join(process.cwd(), 'rubricas_2025');

    let created = 0;
    let skipped = 0;

    for (const rubricData of RUBRICAS) {
      console.log(`\n📝 Procesando: ${rubricData.name}`);
      console.log('   -----------------------------------------');

      // Check if rubric already exists
      const existingRubric = await client.execute({
        sql: 'SELECT id FROM Rubric WHERE id = ?',
        args: [rubricData.id],
      });

      if (existingRubric.rows.length > 0) {
        console.log('   ⏭️  Ya existe, saltando...');
        skipped++;
        continue;
      }

      // Read rubric content from file
      const filePath = path.join(rubricasDir, rubricData.fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`   ❌ Archivo no encontrado: ${rubricData.fileName}`);
        continue;
      }

      const rubricText = fs.readFileSync(filePath, 'utf-8');

      // Create rubric
      await client.execute({
        sql: `
          INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt, rubricType)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          rubricData.id,
          rubricData.name,
          rubricData.description,
          rubricText,
          rubricData.subject,
          rubricData.examType,
          1, // isActive
          instructorId,
          now,
          now,
          '5-phases', // rubricType
        ],
      });

      console.log('   ✅ Creada exitosamente');
      console.log(`      ID: ${rubricData.id}`);
      console.log(`      Materia: ${rubricData.subject}`);
      console.log(`      Tipo: ${rubricData.examType}`);
      created++;
    }

    // Final summary
    console.log('\n============================================');
    console.log('  RESUMEN');
    console.log('============================================');
    console.log(`   ✅ Creadas: ${created}`);
    console.log(`   ⏭️  Saltadas (ya existían): ${skipped}`);
    console.log(`   📊 Total procesadas: ${RUBRICAS.length}`);

    // Verify all rubrics
    console.log('\n📋 Verificando rúbricas en la BD...\n');
    const allRubrics = await client.execute({
      sql: `
        SELECT id, name, subject, examType, rubricType
        FROM Rubric
        WHERE isActive = 1
        ORDER BY subject, name
      `,
      args: [],
    });

    console.log('Rúbricas activas en la BD:');
    console.log('-------------------------------------------');
    for (const row of allRubrics.rows) {
      const rubric = row as unknown as { id: string; name: string; subject: string; examType: string; rubricType: string };
      console.log(`  • ${rubric.name}`);
      console.log(`    [${rubric.subject}] [${rubric.examType}] [${rubric.rubricType}]`);
    }

    console.log('\n🎉 Script completado exitosamente!\n');

  } catch (error: unknown) {
    console.error('\n❌ Script failed:');
    if (error instanceof Error) {
      console.error(error.message);
      console.error('\nStack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

addRubricasRecuperatorio2025();
