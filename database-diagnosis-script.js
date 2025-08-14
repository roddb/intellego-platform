#!/usr/bin/env node

/**
 * INTELLEGO PLATFORM - DATABASE DIAGNOSIS SCRIPT
 * 
 * Diagnóstico completo de materias corruptas en producción
 * Identifica registros User con formato JSON en campo subjects
 * 
 * Autor: Claude Code (Database Engineer)
 * Fecha: 2025-01-13
 * 
 * CONTEXTO DEL PROBLEMA:
 * - Dashboard instructor muestra: "Física", "Química", ["Química"], ["Química"]
 * - Campo subjects debe ser TEXT simple, no JSON array
 * - Algunos registros tienen formato: ["Materia"] en lugar de: Materia
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Configuración de conexión a Turso (producción)
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Configuración del diagnóstico
const DIAGNOSIS_CONFIG = {
  outputDir: './database-diagnosis',
  backupDir: './database-backups',
  reportFile: 'subjects-corruption-report.json',
  backupFile: `users-backup-${new Date().toISOString().split('T')[0]}.json`,
  logFile: 'diagnosis.log'
};

/**
 * Función para logging con timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Escribir al archivo de log
  const logPath = path.join(DIAGNOSIS_CONFIG.outputDir, DIAGNOSIS_CONFIG.logFile);
  fs.appendFileSync(logPath, logMessage + '\n');
}

/**
 * Crear directorios necesarios
 */
function createDirectories() {
  [DIAGNOSIS_CONFIG.outputDir, DIAGNOSIS_CONFIG.backupDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Directorio creado: ${dir}`);
    }
  });
}

/**
 * Verificar conexión a la base de datos
 */
async function testDatabaseConnection() {
  try {
    log('Verificando conexión a base de datos Turso...');
    const result = await client.execute('SELECT COUNT(*) as count FROM User');
    const userCount = result.rows[0].count;
    log(`✅ Conexión exitosa. Total usuarios: ${userCount}`);
    return true;
  } catch (error) {
    log(`❌ Error de conexión: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Crear backup completo de la tabla User
 */
async function createUserBackup() {
  try {
    log('Creando backup completo de tabla User...');
    const result = await client.execute('SELECT * FROM User');
    
    const backup = {
      timestamp: new Date().toISOString(),
      totalRecords: result.rows.length,
      records: result.rows
    };
    
    const backupPath = path.join(DIAGNOSIS_CONFIG.backupDir, DIAGNOSIS_CONFIG.backupFile);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    log(`✅ Backup creado: ${backupPath}`);
    log(`Total registros respaldados: ${backup.totalRecords}`);
    return backupPath;
  } catch (error) {
    log(`❌ Error creando backup: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Analizar patrones de corrupción en subjects
 */
function analyzeSubjectsCorruption(subjects) {
  const patterns = {
    valid: /^[^[\]]+$/,                    // String simple sin corchetes
    singleArrayString: /^\["[^"]+"\]$/,    // ["Materia"]
    multipleArrayString: /^\[.*,.*\]$/,    // ["Mat1","Mat2"]
    mixedFormat: /.*\[.*\].*/,             // Cualquier formato con corchetes
    empty: /^(\[\]|""|null|undefined)?$/   // Vacío o null
  };

  const analysis = {
    type: 'unknown',
    isCorrupted: false,
    pattern: null,
    extractedSubjects: [],
    rawValue: subjects
  };

  if (!subjects || subjects === 'null' || subjects === '') {
    analysis.type = 'empty';
    return analysis;
  }

  // Verificar si es un string válido simple
  if (patterns.valid.test(subjects) && !subjects.includes('[')) {
    analysis.type = 'valid';
    analysis.extractedSubjects = [subjects];
    return analysis;
  }

  // Verificar diferentes tipos de corrupción
  analysis.isCorrupted = true;

  if (patterns.singleArrayString.test(subjects)) {
    analysis.type = 'single_array_string';
    analysis.pattern = 'single_array_string';
    try {
      const parsed = JSON.parse(subjects);
      analysis.extractedSubjects = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      analysis.extractedSubjects = [subjects.replace(/[\[\]"]/g, '')];
    }
  } else if (patterns.multipleArrayString.test(subjects)) {
    analysis.type = 'multiple_array_string';
    analysis.pattern = 'multiple_array_string';
    try {
      const parsed = JSON.parse(subjects);
      analysis.extractedSubjects = Array.isArray(parsed) ? parsed : [subjects];
    } catch (e) {
      analysis.extractedSubjects = subjects.replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
    }
  } else if (patterns.mixedFormat.test(subjects)) {
    analysis.type = 'mixed_format';
    analysis.pattern = 'mixed_format';
    // Intentar extraer materias de formato mixto
    const matches = subjects.match(/\["([^"]+)"\]/g);
    if (matches) {
      analysis.extractedSubjects = matches.map(m => m.replace(/[\[\]"]/g, ''));
    }
  }

  return analysis;
}

/**
 * Análisis completo de todos los usuarios
 */
async function performFullAnalysis() {
  try {
    log('Iniciando análisis completo de tabla User...');
    
    const result = await client.execute(`
      SELECT id, name, email, role, studentId, sede, academicYear, division, subjects, status, createdAt 
      FROM User 
      ORDER BY createdAt DESC
    `);

    const analysis = {
      timestamp: new Date().toISOString(),
      totalUsers: result.rows.length,
      corruptedUsers: [],
      validUsers: [],
      emptySubjects: [],
      statistics: {
        valid: 0,
        single_array_string: 0,
        multiple_array_string: 0,
        mixed_format: 0,
        empty: 0,
        total_corrupted: 0
      },
      patterns: {},
      recommendations: []
    };

    log(`Analizando ${result.rows.length} registros de usuarios...`);

    result.rows.forEach((user, index) => {
      if (index % 50 === 0) {
        log(`Progreso: ${index}/${result.rows.length} registros analizados`);
      }

      const subjectsAnalysis = analyzeSubjectsCorruption(user.subjects);
      
      const userRecord = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        sede: user.sede,
        academicYear: user.academicYear,
        division: user.division,
        subjects: user.subjects,
        status: user.status,
        createdAt: user.createdAt,
        analysis: subjectsAnalysis
      };

      // Clasificar usuario
      if (subjectsAnalysis.isCorrupted) {
        analysis.corruptedUsers.push(userRecord);
        analysis.statistics.total_corrupted++;
      } else if (subjectsAnalysis.type === 'empty') {
        analysis.emptySubjects.push(userRecord);
      } else {
        analysis.validUsers.push(userRecord);
      }

      // Incrementar contadores por tipo
      analysis.statistics[subjectsAnalysis.type]++;

      // Registrar patrones únicos
      if (subjectsAnalysis.pattern) {
        if (!analysis.patterns[subjectsAnalysis.pattern]) {
          analysis.patterns[subjectsAnalysis.pattern] = [];
        }
        analysis.patterns[subjectsAnalysis.pattern].push({
          userId: user.id,
          rawValue: user.subjects,
          extractedSubjects: subjectsAnalysis.extractedSubjects
        });
      }
    });

    log('✅ Análisis completado');
    
    // Generar recomendaciones
    generateRecommendations(analysis);
    
    return analysis;
  } catch (error) {
    log(`❌ Error en análisis: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Generar recomendaciones de migración
 */
function generateRecommendations(analysis) {
  log('Generando recomendaciones de migración...');
  
  if (analysis.statistics.total_corrupted === 0) {
    analysis.recommendations.push({
      priority: 'LOW',
      action: 'NO_ACTION_NEEDED',
      description: 'No se encontraron registros corruptos en el campo subjects'
    });
    return;
  }

  // Recomendación principal
  analysis.recommendations.push({
    priority: 'HIGH',
    action: 'MIGRATION_REQUIRED',
    description: `Se encontraron ${analysis.statistics.total_corrupted} registros con subjects corruptos que requieren migración`,
    affectedRecords: analysis.statistics.total_corrupted,
    estimatedTime: '15-30 minutos'
  });

  // Recomendaciones por tipo de corrupción
  if (analysis.statistics.single_array_string > 0) {
    analysis.recommendations.push({
      priority: 'MEDIUM',
      action: 'PARSE_SINGLE_ARRAY',
      description: `${analysis.statistics.single_array_string} registros con formato ["Materia"] - conversión directa`,
      sqlExample: `UPDATE User SET subjects = JSON_EXTRACT(subjects, '$[0]') WHERE subjects LIKE '["%"]' AND subjects NOT LIKE '%,%';`
    });
  }

  if (analysis.statistics.multiple_array_string > 0) {
    analysis.recommendations.push({
      priority: 'HIGH',
      action: 'HANDLE_MULTIPLE_SUBJECTS',
      description: `${analysis.statistics.multiple_array_string} registros con múltiples materias - requiere decisión de negocio`,
      note: 'Determinar si tomar la primera materia o concatenar con separador'
    });
  }

  if (analysis.statistics.mixed_format > 0) {
    analysis.recommendations.push({
      priority: 'HIGH',
      action: 'MANUAL_REVIEW',
      description: `${analysis.statistics.mixed_format} registros con formato mixto - requiere revisión manual`,
      note: 'Estos registros pueden tener datos inconsistentes'
    });
  }
}

/**
 * Generar reporte detallado
 */
function generateDetailedReport(analysis) {
  log('Generando reporte detallado...');
  
  const reportPath = path.join(DIAGNOSIS_CONFIG.outputDir, DIAGNOSIS_CONFIG.reportFile);
  
  const report = {
    ...analysis,
    generatedBy: 'Intellego Platform Database Diagnosis Script',
    version: '1.0.0',
    databaseInfo: {
      environment: 'production',
      provider: 'Turso libSQL',
      url: process.env.TURSO_DATABASE_URL ? 'Configured' : 'Missing'
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`✅ Reporte generado: ${reportPath}`);
  
  return reportPath;
}

/**
 * Mostrar resumen en consola
 */
function displaySummary(analysis) {
  console.log('\n' + '='.repeat(80));
  console.log('RESUMEN EJECUTIVO - DIAGNÓSTICO DE MATERIAS CORRUPTAS');
  console.log('='.repeat(80));
  console.log(`📊 Total de usuarios analizados: ${analysis.totalUsers}`);
  console.log(`❌ Registros corruptos encontrados: ${analysis.statistics.total_corrupted}`);
  console.log(`✅ Registros válidos: ${analysis.statistics.valid}`);
  console.log(`⚠️  Registros con subjects vacío: ${analysis.statistics.empty}`);
  
  console.log('\n📈 DISTRIBUCIÓN POR TIPO DE CORRUPCIÓN:');
  Object.entries(analysis.statistics).forEach(([type, count]) => {
    if (type !== 'total_corrupted' && count > 0) {
      console.log(`   ${type.replace(/_/g, ' ').toUpperCase()}: ${count} registros`);
    }
  });

  if (analysis.statistics.total_corrupted > 0) {
    console.log('\n🚨 ACCIÓN REQUERIDA:');
    analysis.recommendations.forEach(rec => {
      console.log(`   [${rec.priority}] ${rec.action}: ${rec.description}`);
    });
  }

  console.log('\n📁 ARCHIVOS GENERADOS:');
  console.log(`   • Reporte completo: ${DIAGNOSIS_CONFIG.outputDir}/${DIAGNOSIS_CONFIG.reportFile}`);
  console.log(`   • Backup de seguridad: ${DIAGNOSIS_CONFIG.backupDir}/${DIAGNOSIS_CONFIG.backupFile}`);
  console.log(`   • Log de diagnóstico: ${DIAGNOSIS_CONFIG.outputDir}/${DIAGNOSIS_CONFIG.logFile}`);
  
  console.log('='.repeat(80));
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE BASE DE DATOS INTELLEGO PLATFORM');
  console.log('Identificando materias corruptas en producción...\n');

  try {
    // Verificar variables de entorno
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('Variables de entorno TURSO_DATABASE_URL y TURSO_AUTH_TOKEN son requeridas');
    }

    // Preparar entorno
    createDirectories();
    
    // Verificar conexión
    const connectionOk = await testDatabaseConnection();
    if (!connectionOk) {
      throw new Error('No se pudo establecer conexión con la base de datos');
    }

    // Crear backup de seguridad
    await createUserBackup();

    // Realizar análisis completo
    const analysis = await performFullAnalysis();

    // Generar reporte
    generateDetailedReport(analysis);

    // Mostrar resumen
    displaySummary(analysis);

    // Cerrar conexión
    await client.close();

    log('✅ Diagnóstico completado exitosamente');
    process.exit(0);

  } catch (error) {
    log(`❌ Error crítico: ${error.message}`, 'ERROR');
    console.error('Error en diagnóstico:', error);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runDiagnosis };