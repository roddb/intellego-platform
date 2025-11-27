#!/usr/bin/env node
/**
 * Script para obtener todos los feedbacks de 2025 desde Turso
 * Usa el cliente @libsql/client que ya está instalado en el proyecto
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log('='.repeat(80));
  console.log('OBTENCIÓN DE FEEDBACKS 2025 DESDE TURSO');
  console.log('='.repeat(80));
  console.log();

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ Error: Variables de entorno TURSO_DATABASE_URL o TURSO_AUTH_TOKEN no encontradas');
    console.error('Verifica que el archivo .env esté configurado correctamente');
    process.exit(1);
  }

  console.log('📡 Conectando a base de datos Turso...');

  try {
    const client = createClient({
      url,
      authToken
    });

    const query = `
      SELECT
        f.id,
        f.studentId,
        u.name as studentName,
        f.subject,
        f.weekStart,
        f.score,
        f.generalComments,
        f.strengths,
        f.improvements,
        f.createdAt
      FROM Feedback f
      JOIN User u ON f.studentId = u.id
      WHERE f.weekStart >= '2025-01-01' AND f.weekStart < '2026-01-01'
      ORDER BY u.name, f.subject, f.weekStart
    `;

    console.log('🔍 Ejecutando query SQL...');
    console.log();

    const result = await client.execute(query);

    console.log(`✅ Se obtuvieron ${result.rows.length} feedbacks`);
    console.log();

    // Guardar en archivo JSON
    const outputFile = 'feedbacks_2025_data.json';

    const data = {
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rows.length,
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`💾 Datos guardados en: ${outputFile}`);
    console.log();
    console.log('✅ Listo para procesar con Python');
    console.log();

    client.close();

  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
