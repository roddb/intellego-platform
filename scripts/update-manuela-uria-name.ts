/**
 * Script to update Manuela Uria's name in the database
 * From: "manuela " → To: "Manuela Uria"
 * User ID: u_itbn7il5cme6h0gl3
 * Division: 5to B
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

async function updateManuelaName(): Promise<void> {
  try {
    console.log('🔍 Verificando datos actuales...\n');

    // Verify current data
    const currentData = await db.execute({
      sql: `
        SELECT
          id,
          name,
          email,
          studentId,
          academicYear,
          division,
          role,
          createdAt
        FROM User
        WHERE id = ?
      `,
      args: ['u_itbn7il5cme6h0gl3']
    });

    if (currentData.rows.length === 0) {
      console.error('❌ Error: Usuario no encontrado');
      process.exit(1);
    }

    const user = currentData.rows[0];
    console.log('📊 Datos actuales:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre actual: "${user.name}"`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Student ID: ${user.studentId}`);
    console.log(`   Curso: ${user.academicYear} ${user.division}`);
    console.log(`   Rol: ${user.role}`);
    console.log('');

    // Update name
    console.log('✏️  Actualizando nombre a "Manuela Uria"...\n');

    const updateResult = await db.execute({
      sql: `
        UPDATE User
        SET name = ?,
            updatedAt = datetime('now')
        WHERE id = ?
      `,
      args: ['Manuela Uria', 'u_itbn7il5cme6h0gl3']
    });

    console.log(`✅ Actualización exitosa (${updateResult.rowsAffected} fila afectada)\n`);

    // Verify updated data
    const updatedData = await db.execute({
      sql: `
        SELECT
          id,
          name,
          email,
          studentId,
          academicYear,
          division,
          updatedAt
        FROM User
        WHERE id = ?
      `,
      args: ['u_itbn7il5cme6h0gl3']
    });

    const updatedUser = updatedData.rows[0];
    console.log('📊 Datos actualizados:');
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Nuevo nombre: "${updatedUser.name}"`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Student ID: ${updatedUser.studentId}`);
    console.log(`   Curso: ${updatedUser.academicYear} ${updatedUser.division}`);
    console.log(`   Actualizado: ${updatedUser.updatedAt}`);
    console.log('');
    console.log('✨ Operación completada exitosamente');
    console.log('');
    console.log('ℹ️  Ahora el sistema debería poder detectar correctamente');
    console.log('   a la alumna cuando corrijas sus exámenes.');

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
updateManuelaName()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('❌ Error fatal:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  });
