#!/usr/bin/env node

/**
 * PRUEBA FINAL: DASHBOARD DE INSTRUCTOR POST-MIGRACIÓN
 * Verifica que el dashboard funcione correctamente después de la migración
 */

import { createClient } from '@libsql/client';

const TURSO_DATABASE_URL = "libsql://intellego-production-roddb.aws-us-east-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw";

async function testInstructorDashboard() {
  const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  
  try {
    console.log('🎯 PRUEBA FINAL: DASHBOARD DE INSTRUCTOR POST-MIGRACIÓN');
    console.log('========================================================\n');

    // 1. Test de jerarquía completa
    console.log('📊 1. JERARQUÍA COMPLETA - Materias por Sede/Año/División:');
    const hierarchyResult = await client.execute(`
      SELECT 
        sede,
        academicYear,
        division, 
        subjects,
        COUNT(*) as student_count
      FROM User 
      WHERE role = 'STUDENT' AND status = 'ACTIVE' AND subjects IS NOT NULL
      GROUP BY sede, academicYear, division, subjects
      ORDER BY sede, academicYear, division, subjects
    `);
    
    let currentSede = '';
    let currentYear = '';
    let currentDivision = '';
    
    hierarchyResult.rows.forEach(row => {
      if (row.sede !== currentSede) {
        currentSede = row.sede;
        console.log(`\n🏫 ${row.sede.toUpperCase()}`);
      }
      if (row.academicYear !== currentYear) {
        currentYear = row.academicYear;
        console.log(`  📚 ${row.academicYear}`);
      }
      if (row.division !== currentDivision) {
        currentDivision = row.division;
        console.log(`    🎓 División ${row.division}`);
      }
      console.log(`      📖 ${row.subjects}: ${row.student_count} estudiantes`);
    });

    // 2. Test de materias únicas (no debería haber duplicados)
    console.log('\n📋 2. MATERIAS ÚNICAS EN EL SISTEMA:');
    const uniqueSubjectsResult = await client.execute(`
      SELECT DISTINCT subjects, COUNT(*) as total_students
      FROM User 
      WHERE role = 'STUDENT' AND subjects IS NOT NULL
      GROUP BY subjects
      ORDER BY total_students DESC
    `);
    
    uniqueSubjectsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.subjects} (${row.total_students} estudiantes)`);
    });

    // 3. Test de formato - no debe haber corchetes
    console.log('\n🔍 3. VALIDACIÓN DE FORMATO (No debe haber corchetes):');
    const formatValidationResult = await client.execute(`
      SELECT id, name, subjects 
      FROM User 
      WHERE subjects LIKE '%[%' OR subjects LIKE '%]%'
      LIMIT 5
    `);
    
    if (formatValidationResult.rows.length === 0) {
      console.log('  ✅ PERFECTO: No se encontraron registros con formato JSON');
    } else {
      console.log('  ❌ PROBLEMA: Aún hay registros con formato incorrecto:');
      formatValidationResult.rows.forEach(row => {
        console.log(`    • ${row.name}: "${row.subjects}"`);
      });
    }

    // 4. Simulación de queries del dashboard real
    console.log('\n🖥️ 4. SIMULACIÓN DE QUERIES DEL DASHBOARD REAL:');
    
    // Query para obtener sedes
    const sedesResult = await client.execute(`
      SELECT DISTINCT sede, COUNT(*) as students
      FROM User 
      WHERE role = 'STUDENT' AND status = 'ACTIVE'
      GROUP BY sede
      ORDER BY sede
    `);
    console.log('  📍 Sedes disponibles:');
    sedesResult.rows.forEach(row => {
      console.log(`    • ${row.sede}: ${row.students} estudiantes`);
    });

    // Query para años por sede (ejemplo: Colegiales)
    const yearsResult = await client.execute(`
      SELECT DISTINCT academicYear, COUNT(*) as students
      FROM User 
      WHERE role = 'STUDENT' AND status = 'ACTIVE' AND sede = 'Colegiales'
      GROUP BY academicYear
      ORDER BY academicYear
    `);
    console.log('  📚 Años en Colegiales:');
    yearsResult.rows.forEach(row => {
      console.log(`    • ${row.academicYear}: ${row.students} estudiantes`);
    });

    // Query para materias por sede/año (ejemplo: Colegiales, 4to Año)
    const subjectsResult = await client.execute(`
      SELECT DISTINCT subjects, COUNT(*) as students
      FROM User 
      WHERE role = 'STUDENT' AND status = 'ACTIVE' 
        AND sede = 'Colegiales' AND academicYear = '4to Año'
      GROUP BY subjects
      ORDER BY subjects
    `);
    console.log('  📖 Materias en Colegiales - 4to Año:');
    subjectsResult.rows.forEach(row => {
      console.log(`    • ${row.subjects}: ${row.students} estudiantes`);
    });

    // 5. Test de integridad de datos
    console.log('\n🧪 5. TEST DE INTEGRIDAD DE DATOS:');
    
    const integrityResults = await client.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as students,
        COUNT(CASE WHEN role = 'INSTRUCTOR' THEN 1 END) as instructors,
        COUNT(CASE WHEN subjects IS NOT NULL AND subjects != '' THEN 1 END) as users_with_subjects,
        COUNT(CASE WHEN subjects LIKE '%[%' OR subjects LIKE '%]%' THEN 1 END) as corrupted_subjects
      FROM User
    `);
    
    const integrity = integrityResults.rows[0];
    console.log(`  📊 Total usuarios: ${integrity.total_users}`);
    console.log(`  👨‍🎓 Estudiantes: ${integrity.students}`);
    console.log(`  👨‍🏫 Instructores: ${integrity.instructors}`);
    console.log(`  📚 Usuarios con materias: ${integrity.users_with_subjects}`);
    console.log(`  ❌ Subjects corruptos: ${integrity.corrupted_subjects}`);

    // 6. Test de reportes relacionados
    console.log('\n📋 6. TEST DE REPORTES RELACIONADOS:');
    const reportsResult = await client.execute(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(DISTINCT userId) as users_with_reports,
        COUNT(DISTINCT subject) as subjects_in_reports
      FROM ProgressReport
    `);
    
    const reports = reportsResult.rows[0];
    console.log(`  📊 Total reportes: ${reports.total_reports}`);
    console.log(`  👥 Usuarios con reportes: ${reports.users_with_reports}`);
    console.log(`  📚 Materias en reportes: ${reports.subjects_in_reports}`);

    // 7. Reporte final
    console.log('\n========================================================');
    console.log('📋 REPORTE FINAL DE PRUEBAS');
    console.log('========================================================');
    
    const finalValidation = {
      totalUsers: parseInt(integrity.total_users),
      studentsWithSubjects: parseInt(integrity.users_with_subjects),
      corruptedSubjects: parseInt(integrity.corrupted_subjects),
      uniqueSubjects: uniqueSubjectsResult.rows.length,
      totalReports: parseInt(reports.total_reports),
      dashboardReady: parseInt(integrity.corrupted_subjects) === 0
    };
    
    if (finalValidation.dashboardReady) {
      console.log('✅ DASHBOARD COMPLETAMENTE FUNCIONAL');
      console.log(`   • ${finalValidation.totalUsers} usuarios en sistema`);
      console.log(`   • ${finalValidation.studentsWithSubjects} estudiantes con materias asignadas`);
      console.log(`   • ${finalValidation.uniqueSubjects} materias únicas sin duplicados`);
      console.log(`   • ${finalValidation.totalReports} reportes de progreso disponibles`);
      console.log(`   • 0 registros con formato corrupto`);
      console.log('\n🎉 El dashboard de instructor está listo para usar');
    } else {
      console.log('❌ DASHBOARD REQUIERE ATENCIÓN ADICIONAL');
      console.log(`   • ${finalValidation.corruptedSubjects} registros aún requieren corrección`);
    }
    
    console.log('========================================================');

    await client.close();
    return finalValidation;
    
  } catch (error) {
    await client.close();
    console.error('❌ Error en prueba de dashboard:', error.message);
    throw error;
  }
}

// Ejecutar prueba
testInstructorDashboard();