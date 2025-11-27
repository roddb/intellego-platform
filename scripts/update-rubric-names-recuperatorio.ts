/**
 * Script: Actualizar nombres de rúbricas de recuperatorio
 *
 * Usage: npx tsx scripts/update-rubric-names-recuperatorio.ts
 */

import { db } from '../src/lib/db';

const RUBRICS_TO_UPDATE = [
  { id: 'rubric-fisica-termodinamica', newName: 'Termodinámica - Recuperatorio' },
  { id: 'rubric-quimica-equilibrio', newName: 'Equilibrio Químico - Recuperatorio' },
  { id: 'rubric-quimica-estequiometria', newName: 'Estequiometría - Recuperatorio' },
  { id: 'rubric-quimica-soluciones', newName: 'Soluciones - Recuperatorio' },
];

async function updateRubricNames(): Promise<void> {
  console.log('🔄 Actualizando nombres de rúbricas de recuperatorio...\n');

  try {
    const client = db();
    const now = new Date().toISOString();

    for (const rubric of RUBRICS_TO_UPDATE) {
      console.log(`📝 Actualizando: ${rubric.id} → "${rubric.newName}"`);

      await client.execute({
        sql: 'UPDATE Rubric SET name = ?, updatedAt = ? WHERE id = ?',
        args: [rubric.newName, now, rubric.id],
      });
    }

    console.log('\n✅ Nombres actualizados correctamente\n');

    // Verify
    console.log('🔍 Verificando cambios...\n');
    const result = await client.execute(`
      SELECT id, name, subject FROM Rubric
      WHERE examType = 'Recuperatorio' AND isActive = 1
      ORDER BY subject, name
    `);

    for (const row of result.rows) {
      const r = row as any;
      console.log(`   ${r.subject}: ${r.name}`);
    }

    console.log('\n🎉 Script completado!\n');

  } catch (error: unknown) {
    console.error('\n❌ Error:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

updateRubricNames();
