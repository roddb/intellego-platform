#!/usr/bin/env node

/**
 * INTELLEGO PLATFORM - MIGRACIÓN CORRECTIVA SUBJECTS
 * 
 * Corrige formato JSON en campo subjects de todos los usuarios
 * Convierte ["Materia1","Materia2"] -> "Materia1" (toma primera materia)
 * 
 * CRÍTICO: Script de migración en base de datos de producción
 */

import { createClient } from '@libsql/client';
import fs from 'fs';

const TURSO_DATABASE_URL = "libsql://intellego-production-roddb.aws-us-east-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw";

async function createBackup() {
  const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  
  try {
    console.log('🔒 Creando backup completo antes de migración...');
    const result = await client.execute('SELECT * FROM User');
    
    const backup = {
      timestamp: new Date().toISOString(),
      totalRecords: result.rows.length,
      purpose: 'Pre-migration backup for subjects field correction',
      records: result.rows
    };
    
    const backupPath = `./backup-subjects-migration-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup creado: ${backupPath}`);
    console.log(`📊 Registros respaldados: ${backup.totalRecords}`);
    
    await client.close();
    return backupPath;
  } catch (error) {
    await client.close();
    throw error;
  }
}

async function analyzeBeforeMigration() {
  const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  
  try {
    console.log('🔍 Análisis pre-migración...');
    
    // Contar todos los usuarios
    const totalResult = await client.execute('SELECT COUNT(*) as count FROM User');
    const total = totalResult.rows[0].count;
    
    // Contar registros con formato JSON
    const corruptedResult = await client.execute(`
      SELECT COUNT(*) as count FROM User 
      WHERE subjects LIKE '%[%' OR subjects LIKE '%]%'
    `);
    const corrupted = corruptedResult.rows[0].count;
    
    // Patrones específicos
    const patternsResult = await client.execute(`
      SELECT subjects, COUNT(*) as count 
      FROM User 
      WHERE subjects LIKE '%[%' OR subjects LIKE '%]%'
      GROUP BY subjects 
      ORDER BY count DESC
    `);
    
    console.log(`📊 Total usuarios: ${total}`);
    console.log(`❌ Registros corruptos: ${corrupted}`);
    console.log(`✅ Registros válidos: ${total - corrupted}`);
    
    console.log('\n📈 Patrones de corrupción encontrados:');
    patternsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. "${row.subjects}" → ${row.count} registros`);
    });
    
    await client.close();
    return { total, corrupted, patterns: patternsResult.rows };
  } catch (error) {
    await client.close();
    throw error;
  }
}

function extractFirstSubject(subjectsJson) {
  try {
    // Si ya es string simple, devolverlo
    if (typeof subjectsJson === 'string' && !subjectsJson.includes('[')) {
      return subjectsJson;
    }
    
    // Si contiene formato JSON, parsearlo
    if (subjectsJson.includes('[') && subjectsJson.includes(']')) {
      const parsed = JSON.parse(subjectsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0]; // Tomar primera materia
      }
    }
    
    // Fallback: limpiar manualmente
    return subjectsJson.replace(/[\[\]"]/g, '').split(',')[0].trim();
  } catch (error) {
    // Si falla el parsing, limpiar manualmente
    return subjectsJson.replace(/[\[\]"]/g, '').split(',')[0].trim();
  }
}

async function performMigration() {
  const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  
  try {
    console.log('🚀 Iniciando migración de subjects...');
    
    // Obtener todos los registros que necesitan migración
    const usersResult = await client.execute(`
      SELECT id, name, email, subjects 
      FROM User 
      WHERE subjects LIKE '%[%' OR subjects LIKE '%]%'
    `);
    
    console.log(`🔄 Procesando ${usersResult.rows.length} registros...`);
    
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Procesar cada usuario individualmente para mayor control
    for (const user of usersResult.rows) {
      try {
        const originalSubjects = user.subjects;
        const cleanedSubjects = extractFirstSubject(originalSubjects);
        
        // Solo actualizar si hay cambio
        if (originalSubjects !== cleanedSubjects) {
          await client.execute({
            sql: 'UPDATE User SET subjects = ? WHERE id = ?',
            args: [cleanedSubjects, user.id]
          });
          
          updatedCount++;
          
          // Log cada 10 actualizaciones
          if (updatedCount % 10 === 0) {
            console.log(`  ✅ Procesados ${updatedCount} registros...`);
          }
          
          // Log detallado para primeros 5 registros
          if (updatedCount <= 5) {
            console.log(`    👤 ${user.name}: "${originalSubjects}" → "${cleanedSubjects}"`);
          }
        }
      } catch (userError) {
        errorCount++;
        errors.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          originalSubjects: user.subjects,
          error: userError.message
        });
        console.error(`❌ Error con usuario ${user.name}: ${userError.message}`);
      }
    }
    
    console.log(`✅ Migración completada:`);
    console.log(`  📊 Registros actualizados: ${updatedCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);
    
    if (errors.length > 0) {
      fs.writeFileSync(
        './migration-errors.json',
        JSON.stringify(errors, null, 2)
      );
      console.log(`⚠️ Errores guardados en: migration-errors.json`);
    }
    
    await client.close();
    return { updatedCount, errorCount, errors };
  } catch (error) {
    await client.close();
    throw error;
  }
}

async function validateAfterMigration() {
  const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  
  try {
    console.log('🧪 Validación post-migración...');
    
    // Contar registros que aún tienen formato JSON
    const stillCorruptedResult = await client.execute(`
      SELECT COUNT(*) as count FROM User 
      WHERE subjects LIKE '%[%' OR subjects LIKE '%]%'
    `);
    const stillCorrupted = stillCorruptedResult.rows[0].count;
    
    // Total de usuarios
    const totalResult = await client.execute('SELECT COUNT(*) as count FROM User');
    const total = totalResult.rows[0].count;
    
    // Nuevos valores únicos de subjects
    const uniqueSubjectsResult = await client.execute(`
      SELECT subjects, COUNT(*) as count 
      FROM User 
      GROUP BY subjects 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Validación post-migración:`);
    console.log(`  Total usuarios: ${total}`);
    console.log(`  Registros aún corruptos: ${stillCorrupted}`);
    console.log(`  Registros válidos: ${total - stillCorrupted}`);
    
    if (stillCorrupted === 0) {
      console.log('✅ MIGRACIÓN EXITOSA: No quedan registros corruptos');
    } else {
      console.log('⚠️ ATENCIÓN: Aún quedan registros que requieren atención manual');
    }
    
    console.log('\n📈 Top 10 materias después de migración:');
    uniqueSubjectsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. "${row.subjects}" (${row.count} estudiantes)`);
    });
    
    await client.close();
    return { total, stillCorrupted, uniqueSubjects: uniqueSubjectsResult.rows };
  } catch (error) {
    await client.close();
    throw error;
  }
}

async function testDashboardImpact() {
  const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  
  try {
    console.log('🎯 Probando impacto en dashboard de instructor...');
    
    // Simular query del dashboard de instructor
    const instructorViewResult = await client.execute(`
      SELECT DISTINCT subjects, sede, academicYear, division, COUNT(*) as student_count
      FROM User 
      WHERE role = 'STUDENT' AND status = 'ACTIVE'
      GROUP BY subjects, sede, academicYear, division
      ORDER BY sede, academicYear, division, subjects
    `);
    
    console.log('🎯 Vista del dashboard de instructor:');
    let currentSede = '';
    let currentYear = '';
    
    instructorViewResult.rows.forEach(row => {
      if (row.sede !== currentSede) {
        currentSede = row.sede;
        console.log(`\n📍 SEDE: ${row.sede}`);
      }
      if (row.academicYear !== currentYear) {
        currentYear = row.academicYear;
        console.log(`  📚 AÑO: ${row.academicYear}`);
      }
      console.log(`    📖 ${row.subjects} (${row.division}) - ${row.student_count} estudiantes`);
    });
    
    await client.close();
    return instructorViewResult.rows;
  } catch (error) {
    await client.close();
    throw error;
  }
}

async function main() {
  console.log('🔥 MIGRACIÓN CRÍTICA: CORRECCIÓN DE SUBJECTS EN PRODUCCIÓN');
  console.log('⚠️ IMPORTANTE: La plataforma está siendo usada por estudiantes reales');
  console.log('================================================================================\n');
  
  try {
    // 1. Crear backup
    const backupPath = await createBackup();
    
    // 2. Análisis pre-migración
    const beforeAnalysis = await analyzeBeforeMigration();
    
    // 3. Confirmar migración
    console.log('\n🤔 ¿Proceder con la migración?');
    console.log(`   • Se migrarán ${beforeAnalysis.corrupted} registros`);
    console.log(`   • Backup creado en: ${backupPath}`);
    console.log(`   • La migración tomará la PRIMERA materia de cada array`);
    
    // Para automatizar, procedemos directamente
    console.log('\n✅ Procediendo con migración automática...\n');
    
    // 4. Realizar migración
    const migrationResult = await performMigration();
    
    // 5. Validar resultados
    const afterAnalysis = await validateAfterMigration();
    
    // 6. Probar impacto en dashboard
    await testDashboardImpact();
    
    // 7. Reporte final
    console.log('\n================================================================================');
    console.log('📋 REPORTE FINAL DE MIGRACIÓN');
    console.log('================================================================================');
    console.log(`✅ Backup creado: ${backupPath}`);
    console.log(`📊 Registros actualizados: ${migrationResult.updatedCount}`);
    console.log(`❌ Errores durante migración: ${migrationResult.errorCount}`);
    console.log(`🎯 Registros aún corruptos: ${afterAnalysis.stillCorrupted}`);
    
    if (afterAnalysis.stillCorrupted === 0) {
      console.log('\n🎉 MIGRACIÓN COMPLETAMENTE EXITOSA');
      console.log('   • Todos los registros subjects han sido corregidos');
      console.log('   • Dashboard de instructor debe mostrar materias sin duplicados');
      console.log('   • Se recomienda probar el dashboard inmediatamente');
    } else {
      console.log('\n⚠️ MIGRACIÓN PARCIALMENTE EXITOSA');
      console.log(`   • ${afterAnalysis.stillCorrupted} registros requieren atención manual`);
      console.log('   • Revisar archivo migration-errors.json para detalles');
    }
    
    console.log('================================================================================');
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n🆘 ACCIÓN INMEDIATA REQUERIDA:');
    console.error('   • Revisar logs de error');
    console.error('   • Considerar rollback desde backup');
    console.error('   • Contactar administrador de sistema');
    process.exit(1);
  }
}

// Ejecutar migración
main();