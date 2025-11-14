/**
 * Script de migración: Crear tablas para sistema de actividades CONSUDEC
 *
 * Uso:
 *   npx tsx scripts/create-consudec-tables.ts
 */

import { db } from '../src/lib/db';

async function createConsudecTables() {
  console.log('🚀 Iniciando migración de tablas CONSUDEC...\n');

  // Obtener cliente de base de datos
  const client = db();

  try {
    // ========================================
    // Tabla 1: ConsudecActivity
    // ========================================
    console.log('📝 Creando tabla ConsudecActivity...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ConsudecActivity (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        caseText TEXT NOT NULL,
        questions TEXT NOT NULL,
        subject TEXT,
        difficulty TEXT DEFAULT 'medium',
        estimatedTime INTEGER,
        status TEXT DEFAULT 'active',
        availableFrom TEXT,
        availableUntil TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES User(id)
      )
    `);
    console.log('✅ Tabla ConsudecActivity creada\n');

    // ========================================
    // Tabla 2: ConsudecSubmission
    // ========================================
    console.log('📝 Creando tabla ConsudecSubmission...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ConsudecSubmission (
        id TEXT PRIMARY KEY,
        activityId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        answers TEXT NOT NULL,
        questionScores TEXT,
        overallScore REAL,
        percentageAchieved REAL,
        generalFeedback TEXT,
        apiCost REAL,
        apiModel TEXT DEFAULT 'claude-haiku-4-5',
        apiTokensInput INTEGER,
        apiTokensOutput INTEGER,
        manualScore REAL,
        manualFeedback TEXT,
        evaluatedBy TEXT,
        evaluatedAt TEXT,
        status TEXT DEFAULT 'draft',
        submittedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (activityId) REFERENCES ConsudecActivity(id),
        FOREIGN KEY (studentId) REFERENCES User(id),
        FOREIGN KEY (evaluatedBy) REFERENCES User(id)
      )
    `);
    console.log('✅ Tabla ConsudecSubmission creada\n');

    // ========================================
    // Índices para optimización
    // ========================================
    console.log('🔧 Creando índices...');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_consudec_activity_status
      ON ConsudecActivity(status)
    `);
    console.log('  ✓ idx_consudec_activity_status');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_consudec_activity_created_by
      ON ConsudecActivity(createdBy)
    `);
    console.log('  ✓ idx_consudec_activity_created_by');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_consudec_submission_activity
      ON ConsudecSubmission(activityId)
    `);
    console.log('  ✓ idx_consudec_submission_activity');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_consudec_submission_student
      ON ConsudecSubmission(studentId)
    `);
    console.log('  ✓ idx_consudec_submission_student');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_consudec_submission_status
      ON ConsudecSubmission(status)
    `);
    console.log('  ✓ idx_consudec_submission_status\n');

    // ========================================
    // Verificación
    // ========================================
    console.log('🔍 Verificando tablas creadas...');

    const tables = await client.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name LIKE 'Consudec%'
      ORDER BY name
    `);

    console.log('\n📊 Tablas CONSUDEC en la base de datos:');
    tables.rows.forEach((row: any) => {
      console.log(`  ✓ ${row.name}`);
    });

    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('  - 2 tablas creadas');
    console.log('  - 5 índices creados');
    console.log('  - Sistema listo para actividades CONSUDEC\n');

  } catch (error: unknown) {
    console.error('\n❌ Error durante la migración:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      console.error('\n📚 Stack trace:');
      console.error(error.stack);
    } else {
      console.error('  Error desconocido');
    }
    process.exit(1);
  }
}

// Ejecutar migración
createConsudecTables()
  .then(() => {
    console.log('🎉 Script finalizado');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('💥 Error fatal:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  });
