const { createClient } = require('@libsql/client');

// Base de datos de producción
const prodClient = createClient({
  url: "libsql://intellego-production-roddb.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw"
});

async function checkProduction() {
  try {
    console.log("=== VERIFICACIÓN EN PRODUCCIÓN - 4TO C FÍSICA ===\n");
    
    // 1. Total de estudiantes registrados
    const allStudents = await prodClient.execute(
      `SELECT COUNT(*) as count
       FROM User 
       WHERE role = 'STUDENT' 
       AND academicYear = '4to Año'
       AND division = 'C'
       AND subjects LIKE '%Física%'`
    );
    console.log(`1. Total estudiantes 4to C con Física en PRODUCCIÓN: ${allStudents.rows[0].count}\n`);
    
    // 2. Estudiantes con reportes de Física
    const withReports = await prodClient.execute(
      `SELECT COUNT(DISTINCT u.id) as count
       FROM User u
       INNER JOIN ProgressReport pr ON u.id = pr.userId
       WHERE u.role = 'STUDENT' 
       AND u.academicYear = '4to Año'
       AND u.division = 'C'
       AND pr.subject = 'Física'`
    );
    console.log(`2. Estudiantes con reportes de Física: ${withReports.rows[0].count}\n`);
    
    // 3. Listar los que SÍ tienen reportes
    const studentsWithReports = await prodClient.execute(
      `SELECT u.name, COUNT(pr.id) as reportCount
       FROM User u
       INNER JOIN ProgressReport pr ON u.id = pr.userId
       WHERE u.role = 'STUDENT' 
       AND u.academicYear = '4to Año'
       AND u.division = 'C'
       AND pr.subject = 'Física'
       GROUP BY u.id, u.name
       ORDER BY u.name`
    );
    
    console.log("3. Estudiantes que SÍ aparecen en el dashboard (tienen reportes):");
    studentsWithReports.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.name} - ${row.reportCount} reportes`);
    });
    
    // 4. Verificar qué devuelve getStudentsByCourse (simulación)
    const getStudentsByCourse = await prodClient.execute(
      `SELECT DISTINCT 
        u.id, u.name, u.email, u.studentId,
        COUNT(pr.id) as reportCount
      FROM User u
      LEFT JOIN ProgressReport pr ON (u.id = pr.userId AND pr.subject = 'Física')
      WHERE u.role = 'STUDENT' 
        AND u.academicYear = '4to Año'
        AND u.division = 'C'
        AND u.subjects LIKE '%Física%'
      GROUP BY u.id, u.name, u.email, u.studentId
      ORDER BY u.name`
    );
    
    console.log(`\n4. Lo que DEBERÍA mostrar getStudentsByCourse (con LEFT JOIN):`);
    console.log(`   Total: ${getStudentsByCourse.rows.length} estudiantes`);
    console.log(`   Primeros 5:`);
    getStudentsByCourse.rows.slice(0, 5).forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.name} - ${row.reportCount} reportes`);
    });
    
    // 5. Verificar la navegación jerárquica
    const navigation = await prodClient.execute(
      `SELECT COUNT(DISTINCT u.id) as studentCount
       FROM ProgressReport pr
       INNER JOIN User u ON pr.userId = u.id
       WHERE u.role = 'STUDENT' 
         AND pr.subject = 'Física'
         AND u.academicYear = '4to Año'
         AND u.division = 'C'`
    );
    
    console.log(`\n5. Navegación jerárquica (INNER JOIN con ProgressReport):`);
    console.log(`   Solo muestra: ${navigation.rows[0].studentCount} estudiantes`);
    console.log(`   PROBLEMA: Debería mostrar los ${allStudents.rows[0].count} estudiantes registrados`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prodClient.close();
  }
}

checkProduction();