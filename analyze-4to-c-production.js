const { createClient } = require('@libsql/client');

async function analyzeProductionStudents() {
    // Conectar a la base de datos de producción en Turso
    const db = createClient({
        url: 'libsql://intellego-production-roddb.aws-us-east-1.turso.io',
        authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw'
    });

    console.log('\n=== ANÁLISIS DE ESTUDIANTES DE 4TO C - BASE DE DATOS PRODUCCIÓN (TURSO) ===\n');
    
    try {
        // Obtener todos los estudiantes de 4to C
        const studentsQuery = await db.execute(`
            SELECT id, name, studentId, subjects 
            FROM User 
            WHERE academicYear = '4to Año' 
                AND division = 'C' 
                AND role = 'STUDENT' 
            ORDER BY name
        `);
        
        const students = studentsQuery.rows;
        console.log(`Total de estudiantes en 4to C: ${students.length}\n`);
        
        // Obtener reportes de la semana actual y anterior
        const currentWeekStart = '2025-08-11T00:00:00.000Z';
        const previousWeekStart = '2025-08-04T00:00:00.000Z';
        
        const reportsQuery = await db.execute(`
            SELECT 
                u.id as userId,
                u.name,
                pr.subject,
                pr.weekStart,
                pr.submittedAt
            FROM ProgressReport pr
            JOIN User u ON pr.userId = u.id
            WHERE u.academicYear = '4to Año' 
                AND u.division = 'C' 
                AND u.role = 'STUDENT'
                AND (pr.weekStart = ? OR pr.weekStart = ?)
            ORDER BY u.name, pr.subject, pr.weekStart
        `, [currentWeekStart, previousWeekStart]);
        
        const reports = reportsQuery.rows;
        
        // Analizar por materia
        const subjects = ['Física', 'Química'];
        
        for (const subject of subjects) {
            console.log(`\n=== MATERIA: ${subject} ===\n`);
            
            // Semana anterior (4-10 agosto)
            console.log('SEMANA 4-10 AGOSTO:');
            const previousWeekReports = reports.filter(r => 
                r.subject === subject && r.weekStart === previousWeekStart
            );
            
            const studentsWithPrevReports = [...new Set(previousWeekReports.map(r => r.name))];
            const studentsWithoutPrevReports = students
                .filter(s => !studentsWithPrevReports.includes(s.name))
                .map(s => s.name);
            
            console.log(`✅ Con reporte (${studentsWithPrevReports.length}):`);
            studentsWithPrevReports.sort().forEach(name => console.log(`   - ${name}`));
            
            if (studentsWithoutPrevReports.length > 0) {
                console.log(`\n❌ Sin reporte (${studentsWithoutPrevReports.length}):`);
                studentsWithoutPrevReports.sort().forEach(name => console.log(`   - ${name}`));
            }
            
            // Semana actual (11-17 agosto)
            console.log('\n\nSEMANA 11-17 AGOSTO:');
            const currentWeekReports = reports.filter(r => 
                r.subject === subject && r.weekStart === currentWeekStart
            );
            
            const studentsWithCurrReports = [...new Set(currentWeekReports.map(r => r.name))];
            const studentsWithoutCurrReports = students
                .filter(s => !studentsWithCurrReports.includes(s.name))
                .map(s => s.name);
            
            console.log(`✅ Con reporte (${studentsWithCurrReports.length}):`);
            studentsWithCurrReports.sort().forEach(name => console.log(`   - ${name}`));
            
            if (studentsWithoutCurrReports.length > 0) {
                console.log(`\n❌ Sin reporte (${studentsWithoutCurrReports.length}):`);
                studentsWithoutCurrReports.sort().forEach(name => console.log(`   - ${name}`));
            }
        }
        
        // Resumen general
        console.log('\n\n=== RESUMEN GENERAL ===\n');
        console.log('LISTA COMPLETA DE ESTUDIANTES DE 4TO C:');
        students.forEach((s, index) => {
            const subjects = s.subjects ? s.subjects.split(',').join(', ') : 'Sin materias';
            console.log(`${index + 1}. ${s.name} (${s.studentId}) - Materias: ${subjects}`);
        });
        
        // Comparación con base de datos local
        console.log('\n\n=== COMPARACIÓN CON BASE DE DATOS LOCAL ===');
        console.log('Local: 32 estudiantes (después de eliminar Test Production User)');
        console.log(`Producción: ${students.length} estudiantes`);
        
        if (students.length === 32) {
            console.log('✅ Las bases de datos coinciden en cantidad');
        } else {
            console.log('⚠️ Diferencia en cantidad de estudiantes');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.close();
    }
}

analyzeProductionStudents();