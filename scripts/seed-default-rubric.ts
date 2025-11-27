/**
 * Seed Script: Create Default Rubric
 *
 * This script creates the default "Rúbrica 5 Fases" rubric in the database.
 *
 * Usage: npx tsx scripts/seed-default-rubric.ts
 */

import { db } from '../src/lib/db';
import { RUBRICA_5_FASES } from '../src/lib/evaluation/prompts/rubrica-5-fases';

async function seedDefaultRubric() {
  console.log('🌱 Starting seed: Create default rubric...\n');

  try {
    // Get the database client
    const client = db();

    // Get an admin or instructor user to use as createdBy
    const usersResult = await client.execute(`
      SELECT id FROM User WHERE role = 'INSTRUCTOR' LIMIT 1
    `);

    if (usersResult.rows.length === 0) {
      throw new Error('No instructor found. Please create an instructor user first.');
    }

    const instructorId = (usersResult.rows[0] as any).id;
    const now = new Date().toISOString();
    const rubricId = `rubric-5-fases-default`;

    // Check if default rubric already exists
    console.log('🔍 Checking if default rubric already exists...');
    const existingRubric = await client.execute({
      sql: 'SELECT id FROM Rubric WHERE id = ?',
      args: [rubricId],
    });

    if (existingRubric.rows.length > 0) {
      console.log('ℹ️  Default rubric already exists, skipping creation\n');
      console.log('✅ Seed completed (rubric already exists)\n');
      return;
    }

    // Create default rubric
    console.log('📝 Creating default rubric: "Rúbrica 5 Fases"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Rúbrica 5 Fases (Por Defecto)',
        'Sistema de evaluación de 5 fases metodológicas para ciencias exactas: Comprensión (15%), Variables (20%), Herramientas (25%), Ejecución (30%), Verificación (10%)',
        RUBRICA_5_FASES,
        'General', // Can be used for all subjects
        'Resolución de Problemas',
        1, // isActive
        instructorId,
        now,
        now,
      ],
    });

    console.log('✅ Default rubric created successfully\n');

    // Verify creation
    console.log('🔍 Verifying rubric creation...');
    const verifyResult = await client.execute({
      sql: 'SELECT id, name, description FROM Rubric WHERE id = ?',
      args: [rubricId],
    });

    if (verifyResult.rows.length > 0) {
      const rubric = verifyResult.rows[0] as any;
      console.log('✅ Rubric verified:');
      console.log(`   ID: ${rubric.id}`);
      console.log(`   Name: ${rubric.name}`);
      console.log(`   Description: ${rubric.description}\n`);
    } else {
      throw new Error('❌ Rubric not found after creation');
    }

    console.log('🎉 Seed completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Verify rubric in database: SELECT * FROM Rubric;');
    console.log('2. Continue with implementation of API endpoints\n');

  } catch (error: unknown) {
    console.error('\n❌ Seed failed:');
    if (error instanceof Error) {
      console.error(error.message);
      console.error('\nStack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

seedDefaultRubric();
