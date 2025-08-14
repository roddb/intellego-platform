#!/usr/bin/env node

/**
 * Prueba rápida de conexión a Turso
 */

import { createClient } from '@libsql/client';

const TURSO_DATABASE_URL = "libsql://intellego-production-roddb.aws-us-east-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw";

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Turso...');
    
    const client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    // Probar conexión básica
    console.log('📊 Contando usuarios...');
    const countResult = await client.execute('SELECT COUNT(*) as count FROM User');
    const userCount = countResult.rows[0].count;
    console.log(`✅ Total usuarios: ${userCount}`);

    // Probar query de subjects
    console.log('🔍 Analizando campo subjects...');
    const subjectsResult = await client.execute(`
      SELECT subjects, COUNT(*) as count 
      FROM User 
      GROUP BY subjects 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('📈 Top 10 valores de subjects:');
    subjectsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. "${row.subjects}" (${row.count} registros)`);
    });

    // Buscar registros con corchetes
    console.log('🚨 Buscando registros con formato JSON...');
    const corruptedResult = await client.execute(`
      SELECT id, name, email, subjects 
      FROM User 
      WHERE subjects LIKE '%[%' OR subjects LIKE '%]%'
      LIMIT 5
    `);
    
    if (corruptedResult.rows.length > 0) {
      console.log(`❌ Encontrados ${corruptedResult.rows.length} registros corruptos (mostrando primeros 5):`);
      corruptedResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (${row.email}): "${row.subjects}"`);
      });
    } else {
      console.log('✅ No se encontraron registros corruptos');
    }

    await client.close();
    console.log('✅ Conexión exitosa');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();