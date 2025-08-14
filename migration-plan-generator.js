#!/usr/bin/env node

/**
 * INTELLEGO PLATFORM - MIGRATION PLAN GENERATOR
 * 
 * Genera plan de migración específico para corregir materias corruptas
 * Basado en el análisis del diagnóstico previo
 * 
 * Autor: Claude Code (Database Engineer)
 * Fecha: 2025-01-13
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Configuración
const MIGRATION_CONFIG = {
  inputDir: './database-diagnosis',
  outputDir: './database-migration',
  reportFile: 'subjects-corruption-report.json',
  migrationPlanFile: 'migration-plan.json',
  migrationSqlFile: 'migration-queries.sql',
  testPlanFile: 'test-plan.md'
};

/**
 * Cargar reporte de diagnóstico
 */
function loadDiagnosisReport() {
  const reportPath = path.join(MIGRATION_CONFIG.inputDir, MIGRATION_CONFIG.reportFile);
  
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Reporte de diagnóstico no encontrado: ${reportPath}`);
  }

  const reportData = fs.readFileSync(reportPath, 'utf8');
  return JSON.parse(reportData);
}

/**
 * Generar queries SQL específicas para cada tipo de corrupción
 */
function generateMigrationQueries(analysis) {
  const queries = {
    preValidation: [],
    migration: [],
    postValidation: [],
    rollback: []
  };

  // Pre-validación: Verificar estado antes de migración
  queries.preValidation.push(
    `-- Pre-validación: Contar registros corruptos por tipo`,
    `SELECT 
      'single_array_string' as corruption_type,
      COUNT(*) as count 
    FROM User 
    WHERE subjects REGEXP '^\\["[^"]+\\"]$';`,
    
    `SELECT 
      'multiple_array_string' as corruption_type,
      COUNT(*) as count 
    FROM User 
    WHERE subjects REGEXP '^\\[.*,.*\\]$';`,
    
    `SELECT 
      'mixed_format' as corruption_type,
      COUNT(*) as count 
    FROM User 
    WHERE subjects LIKE '%[%' AND subjects LIKE '%]%' 
      AND subjects NOT REGEXP '^\\[.*\\]$';`,
    
    `SELECT 
      'total_corrupted' as corruption_type,
      COUNT(*) as count 
    FROM User 
    WHERE subjects LIKE '%[%' OR subjects LIKE '%]%';`
  );

  // Migración: Queries específicas para cada patrón de corrupción
  
  if (analysis.statistics.single_array_string > 0) {
    queries.migration.push(
      `-- Migración 1: Corregir formato ["Materia"] a Materia`,
      `UPDATE User 
       SET subjects = TRIM(subjects, '[]"') 
       WHERE subjects REGEXP '^\\["[^"]+\\"]$' 
         AND subjects NOT LIKE '%,%';`
    );
  }

  if (analysis.statistics.multiple_array_string > 0) {
    // Para múltiples materias, tomar la primera por defecto
    queries.migration.push(
      `-- Migración 2: Corregir formato ["Mat1","Mat2"] - tomar primera materia`,
      `UPDATE User 
       SET subjects = (
         SELECT TRIM(SUBSTR(subjects, 3, INSTR(subjects, '","') - 3))
         FROM (SELECT subjects as subjects FROM User WHERE id = User.id)
       )
       WHERE subjects REGEXP '^\\[.*,.*\\]$' 
         AND subjects LIKE '%","%';`
    );
  }

  // Para casos mixtos, crear queries específicas basadas en patrones encontrados
  if (analysis.patterns && Object.keys(analysis.patterns).length > 0) {
    Object.entries(analysis.patterns).forEach(([pattern, records]) => {
      if (records.length > 0) {
        // Generar query específico por patrón
        const sampleRecord = records[0];
        if (sampleRecord.extractedSubjects.length > 0) {
          const fixedValue = sampleRecord.extractedSubjects[0];
          queries.migration.push(
            `-- Migración específica para patrón: ${pattern}`,
            `-- Ejemplo: ${sampleRecord.rawValue} -> ${fixedValue}`,
            `-- NOTA: Requiere revisión manual para ${records.length} registros`
          );
        }
      }
    });
  }

  // Post-validación: Verificar resultado después de migración
  queries.postValidation.push(
    `-- Post-validación: Verificar que no queden registros corruptos`,
    `SELECT 
      COUNT(*) as remaining_corrupted_count
    FROM User 
    WHERE subjects LIKE '%[%' OR subjects LIKE '%]%';`,
    
    `-- Mostrar registros que aún requieren atención manual`,
    `SELECT id, name, email, subjects, 'NEEDS_MANUAL_FIX' as status
    FROM User 
    WHERE subjects LIKE '%[%' OR subjects LIKE '%]%'
    LIMIT 10;`,
    
    `-- Verificar integridad general`,
    `SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN subjects IS NOT NULL AND subjects != '' THEN 1 END) as users_with_subjects,
      COUNT(CASE WHEN subjects LIKE '%[%' OR subjects LIKE '%]%' THEN 1 END) as still_corrupted
    FROM User;`
  );

  // Rollback: Queries para revertir cambios (usando backup)
  queries.rollback.push(
    `-- ROLLBACK: Restaurar desde backup`,
    `-- ADVERTENCIA: Esto restaurará TODOS los datos User desde el backup`,
    `-- Ejecutar solo si la migración falló completamente`,
    `-- `,
    `-- 1. Crear tabla temporal con backup`,
    `-- CREATE TABLE User_backup AS SELECT * FROM User;`,
    `-- `,
    `-- 2. Restaurar datos desde archivo JSON backup`,
    `-- (Proceso manual usando script de restauración)`
  );

  return queries;
}

/**
 * Generar plan de migración detallado
 */
function generateMigrationPlan(analysis) {
  const plan = {
    metadata: {
      generatedAt: new Date().toISOString(),
      basedOnDiagnosis: analysis.timestamp,
      totalRecordsToMigrate: analysis.statistics.total_corrupted,
      estimatedDuration: calculateEstimatedDuration(analysis.statistics.total_corrupted),
      riskLevel: calculateRiskLevel(analysis.statistics.total_corrupted, analysis.totalUsers)
    },
    phases: [],
    requirements: {
      backupRequired: true,
      testingRequired: true,
      rollbackPlanRequired: true,
      maintenanceWindow: analysis.statistics.total_corrupted > 50
    },
    affectedRecords: {
      byType: analysis.statistics,
      criticalRecords: identifyCriticalRecords(analysis)
    }
  };

  // Fase 1: Preparación
  plan.phases.push({
    phase: 1,
    name: 'Preparación y Validación',
    duration: '10 minutos',
    tasks: [
      'Verificar backup de seguridad existe',
      'Validar conexión a base de datos',
      'Ejecutar queries de pre-validación',
      'Documentar estado actual'
    ],
    rollbackAvailable: false,
    criticalityLevel: 'LOW'
  });

  // Fase 2: Migración de casos simples
  if (analysis.statistics.single_array_string > 0) {
    plan.phases.push({
      phase: 2,
      name: 'Migración Casos Simples',
      duration: '5 minutos',
      description: `Corregir ${analysis.statistics.single_array_string} registros con formato ["Materia"]`,
      tasks: [
        'Ejecutar UPDATE para formato ["Materia"] -> Materia',
        'Verificar registros actualizados',
        'Validar integridad de datos'
      ],
      rollbackAvailable: true,
      criticalityLevel: 'MEDIUM',
      affectedRecords: analysis.statistics.single_array_string
    });
  }

  // Fase 3: Migración de casos complejos
  if (analysis.statistics.multiple_array_string > 0 || analysis.statistics.mixed_format > 0) {
    plan.phases.push({
      phase: 3,
      name: 'Migración Casos Complejos',
      duration: '15-30 minutos',
      description: 'Corregir registros con múltiples materias o formatos mixtos',
      tasks: [
        'Revisar casos complejos individualmente',
        'Aplicar migración con lógica de negocio',
        'Validar cada cambio',
        'Documentar decisiones tomadas'
      ],
      rollbackAvailable: true,
      criticalityLevel: 'HIGH',
      affectedRecords: analysis.statistics.multiple_array_string + analysis.statistics.mixed_format,
      requiresManualReview: true
    });
  }

  // Fase 4: Validación final
  plan.phases.push({
    phase: 4,
    name: 'Validación y Verificación',
    duration: '10 minutos',
    tasks: [
      'Ejecutar queries de post-validación',
      'Verificar dashboard de instructor',
      'Probar funcionalidad completa',
      'Documentar resultados'
    ],
    rollbackAvailable: true,
    criticalityLevel: 'LOW'
  });

  return plan;
}

/**
 * Calcular duración estimada
 */
function calculateEstimatedDuration(corruptedCount) {
  const baseTime = 10; // minutos base
  const perRecordTime = corruptedCount > 100 ? 0.1 : 0.2; // minutos por registro
  
  const totalMinutes = Math.ceil(baseTime + (corruptedCount * perRecordTime));
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minutos`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Calcular nivel de riesgo
 */
function calculateRiskLevel(corruptedCount, totalUsers) {
  const corruptionPercentage = (corruptedCount / totalUsers) * 100;
  
  if (corruptionPercentage > 50) return 'CRITICAL';
  if (corruptionPercentage > 20) return 'HIGH';
  if (corruptionPercentage > 5) return 'MEDIUM';
  return 'LOW';
}

/**
 * Identificar registros críticos
 */
function identifyCriticalRecords(analysis) {
  const critical = [];
  
  // Instructores con datos corruptos
  const instructorsWithIssues = analysis.corruptedUsers.filter(user => 
    user.role === 'INSTRUCTOR'
  );
  
  if (instructorsWithIssues.length > 0) {
    critical.push({
      type: 'INSTRUCTOR_CORRUPTION',
      count: instructorsWithIssues.length,
      description: 'Instructores con materias corruptas - afecta dashboard',
      priority: 'CRITICAL'
    });
  }

  // Usuarios activos con problemas
  const activeUsersWithIssues = analysis.corruptedUsers.filter(user => 
    user.status === 'ACTIVE'
  );
  
  if (activeUsersWithIssues.length > 0) {
    critical.push({
      type: 'ACTIVE_USER_CORRUPTION',
      count: activeUsersWithIssues.length,
      description: 'Usuarios activos con datos corruptos',
      priority: 'HIGH'
    });
  }

  return critical;
}

/**
 * Generar archivo SQL con todas las queries
 */
function generateSqlFile(queries) {
  const sqlContent = [
    `-- INTELLEGO PLATFORM - MIGRATION SQL QUERIES`,
    `-- Generado automáticamente el ${new Date().toISOString()}`,
    `-- `,
    `-- ADVERTENCIA: Ejecutar solo después de crear backup completo`,
    `-- `,
    '',
    '-- =============================================',
    '-- FASE 1: PRE-VALIDACIÓN',
    '-- =============================================',
    ...queries.preValidation,
    '',
    '-- =============================================',
    '-- FASE 2: MIGRACIÓN',
    '-- =============================================',
    '-- IMPORTANTE: Ejecutar una query a la vez y verificar resultados',
    ...queries.migration,
    '',
    '-- =============================================',
    '-- FASE 3: POST-VALIDACIÓN',
    '-- =============================================',
    ...queries.postValidation,
    '',
    '-- =============================================',
    '-- PLAN DE ROLLBACK (EMERGENCIA)',
    '-- =============================================',
    ...queries.rollback
  ].join('\n');

  return sqlContent;
}

/**
 * Generar plan de testing
 */
function generateTestPlan(analysis, migrationPlan) {
  const testPlan = `# PLAN DE TESTING - MIGRACIÓN DE MATERIAS CORRUPTAS

## Información General
- **Fecha de generación**: ${new Date().toISOString()}
- **Registros a migrar**: ${analysis.statistics.total_corrupted}
- **Duración estimada**: ${migrationPlan.metadata.estimatedDuration}
- **Nivel de riesgo**: ${migrationPlan.metadata.riskLevel}

## Pre-Requisitos de Testing
- [ ] Backup completo creado y verificado
- [ ] Acceso a base de datos de producción
- [ ] Dashboard de instructor accesible
- [ ] Cuentas de prueba disponibles

## Casos de Prueba por Fase

### Fase 1: Preparación
- [ ] **TC001**: Verificar que backup existe y es accesible
- [ ] **TC002**: Ejecutar queries de pre-validación sin errores
- [ ] **TC003**: Documentar conteos actuales por tipo de corrupción

### Fase 2: Migración Casos Simples ${analysis.statistics.single_array_string > 0 ? `(${analysis.statistics.single_array_string} registros)` : '(No aplicable)'}
${analysis.statistics.single_array_string > 0 ? `- [ ] **TC004**: Ejecutar migración de formato ["Materia"] -> Materia
- [ ] **TC005**: Verificar que registros se actualizaron correctamente
- [ ] **TC006**: Confirmar que no se perdieron datos` : '- No hay casos simples para migrar'}

### Fase 3: Migración Casos Complejos ${analysis.statistics.multiple_array_string + analysis.statistics.mixed_format > 0 ? `(${analysis.statistics.multiple_array_string + analysis.statistics.mixed_format} registros)` : '(No aplicable)'}
${analysis.statistics.multiple_array_string > 0 ? `- [ ] **TC007**: Revisar registros con múltiples materias manualmente
- [ ] **TC008**: Aplicar lógica de negocio (primera materia)
- [ ] **TC009**: Validar cada cambio individualmente` : ''}
${analysis.statistics.mixed_format > 0 ? `- [ ] **TC010**: Identificar patrones en formatos mixtos
- [ ] **TC011**: Aplicar correcciones específicas por patrón
- [ ] **TC012**: Documentar decisiones de migración` : ''}

### Fase 4: Validación Final
- [ ] **TC013**: Ejecutar queries de post-validación
- [ ] **TC014**: Verificar que contador de corruptos = 0
- [ ] **TC015**: Probar dashboard de instructor
- [ ] **TC016**: Verificar que no aparecen materias duplicadas

## Testing Funcional Post-Migración

### Dashboard de Instructor
- [ ] **FT001**: Login como instructor
- [ ] **FT002**: Acceder a dashboard de materias
- [ ] **FT003**: Verificar que materias se muestran sin duplicados
- [ ] **FT004**: Confirmar formato correcto: "Física", "Química" (sin corchetes)
- [ ] **FT005**: Navegar por diferentes sedes/años/divisiones

### Funcionalidad de Estudiantes
- [ ] **FT006**: Login como estudiante
- [ ] **FT007**: Crear nuevo reporte de progreso
- [ ] **FT008**: Verificar que materia se guarda correctamente
- [ ] **FT009**: Confirmar persistencia en base de datos

### Integridad de Datos
- [ ] **DT001**: Verificar conteo total de usuarios no cambió
- [ ] **DT002**: Confirmar que roles no se alteraron
- [ ] **DT003**: Validar que otros campos permanecen intactos
- [ ] **DT004**: Verificar relaciones con otras tablas

## Criterios de Éxito
1. **Cero registros corruptos**: Query post-validación muestra 0 registros con corchetes
2. **Dashboard funcional**: Instructores ven materias sin duplicados
3. **Sin pérdida de datos**: Conteo total de usuarios se mantiene
4. **Funcionalidad intacta**: Estudiantes pueden crear reportes normalmente

## Criterios de Rollback
- Si cualquier test crítico falla (TC004, TC007, FT003, FT004)
- Si se detecta pérdida de datos
- Si el dashboard muestra errores
- Si la funcionalidad de reportes se rompe

## Contactos de Emergencia
- **Database Engineer**: Claude Code
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Turso Console**: https://app.turso.tech/roddb/databases/intellego-production

## Notas Importantes
⚠️ **La plataforma está en uso por estudiantes reales**
⚠️ **Ejecutar durante horario de menor actividad**
⚠️ **Tener plan de rollback listo antes de empezar**
`;

  return testPlan;
}

/**
 * Función principal
 */
async function main() {
  console.log('📋 GENERANDO PLAN DE MIGRACIÓN PARA MATERIAS CORRUPTAS');
  
  try {
    // Crear directorio de salida
    if (!fs.existsSync(MIGRATION_CONFIG.outputDir)) {
      fs.mkdirSync(MIGRATION_CONFIG.outputDir, { recursive: true });
    }

    // Cargar reporte de diagnóstico
    console.log('📊 Cargando reporte de diagnóstico...');
    const analysis = loadDiagnosisReport();
    
    if (analysis.statistics.total_corrupted === 0) {
      console.log('✅ No se encontraron registros corruptos. No se requiere migración.');
      return;
    }

    console.log(`🔍 Procesando ${analysis.statistics.total_corrupted} registros corruptos...`);

    // Generar queries de migración
    console.log('🛠️ Generando queries SQL de migración...');
    const queries = generateMigrationQueries(analysis);

    // Generar plan de migración
    console.log('📅 Creando plan de migración detallado...');
    const migrationPlan = generateMigrationPlan(analysis);

    // Generar archivo SQL
    console.log('💾 Generando archivo SQL...');
    const sqlContent = generateSqlFile(queries);
    const sqlPath = path.join(MIGRATION_CONFIG.outputDir, MIGRATION_CONFIG.migrationSqlFile);
    fs.writeFileSync(sqlPath, sqlContent);

    // Generar plan de testing
    console.log('🧪 Creando plan de testing...');
    const testPlan = generateTestPlan(analysis, migrationPlan);
    const testPlanPath = path.join(MIGRATION_CONFIG.outputDir, MIGRATION_CONFIG.testPlanFile);
    fs.writeFileSync(testPlanPath, testPlan);

    // Guardar plan de migración
    const planPath = path.join(MIGRATION_CONFIG.outputDir, MIGRATION_CONFIG.migrationPlanFile);
    fs.writeFileSync(planPath, JSON.stringify(migrationPlan, null, 2));

    // Mostrar resumen
    console.log('\n' + '='.repeat(80));
    console.log('PLAN DE MIGRACIÓN GENERADO EXITOSAMENTE');
    console.log('='.repeat(80));
    console.log(`📂 Archivos generados en: ${MIGRATION_CONFIG.outputDir}`);
    console.log(`   • Plan detallado: ${MIGRATION_CONFIG.migrationPlanFile}`);
    console.log(`   • Queries SQL: ${MIGRATION_CONFIG.migrationSqlFile}`);
    console.log(`   • Plan de testing: ${MIGRATION_CONFIG.testPlanFile}`);
    
    console.log(`\n📊 Resumen de migración:`);
    console.log(`   • Total registros a migrar: ${analysis.statistics.total_corrupted}`);
    console.log(`   • Duración estimada: ${migrationPlan.metadata.estimatedDuration}`);
    console.log(`   • Nivel de riesgo: ${migrationPlan.metadata.riskLevel}`);
    console.log(`   • Fases de migración: ${migrationPlan.phases.length}`);
    
    if (migrationPlan.requirements.maintenanceWindow) {
      console.log(`\n⚠️  ADVERTENCIA: Se recomienda ventana de mantenimiento`);
    }
    
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error generando plan de migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar generador
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as generateMigrationPlan };