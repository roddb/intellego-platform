const { createClient } = require('@libsql/client');
const fs = require('fs');

// Base de datos local
const localClient = createClient({
  url: "file:./prisma/data/intellego.db"
});

// Lista de 34 alumnos del archivo JSON
const alumnos4toC = [
  "Abella, Martin Bautista",
  "Aiello Pirlo, Maria Clara",
  "Bargas, Sofía Candela",
  "Barrera, Mateo",
  "Behmer Cavallo, Brenda",
  "Bongiovanni, Lourdes",
  "Ceriani Cernadas, Juliana",
  "Donadio, Magdalena",
  "Figini, Franco",
  "Fontan de Cortazar, Federica",
  "Forrester, Tomás",
  "Gaeta, Isabel",
  "Garcia Canteli, Ulises",
  "Garmendia, Morena",
  "Giles, Camilo",
  "Isola Pozzo, Facundo",
  "Lazaro, Miranda",
  "Lo Valvo, Agustín",
  "Maioli, Bautista Lucas",
  "Margueirat, Joaquín",
  "Margules, Agustina Lara",
  "Marrazzo, Lola",
  "Mingotti Tziavaras, Lucas Leonidas",
  "Monsegur, Milagros",
  "Paccie, Francesca",
  "Palamenghi, Franco",
  "Papa, Valentino",
  "Pasarin de la Torre, Matilde",
  "Perri, Lola Sofia",
  "Pleitel, Mia",
  "Poggi, Zoe",
  "Rizzo Lynch, Mercedes",
  "Rueda, Guadalupe",
  "Vertedor Salinas, Fiarella"
];

async function verifyStudents() {
  try {
    console.log("=== VERIFICACIÓN COMPLETA DE ALUMNOS 4TO C ===\n");
    console.log("Total alumnos en listado oficial: 34\n");
    
    // 1. Obtener TODOS los estudiantes de 4to C con Física de la base de datos LOCAL
    const studentsInDB = await localClient.execute(
      `SELECT id, name, email, studentId, academicYear, division, subjects
       FROM User 
       WHERE role = 'STUDENT' 
       AND academicYear = '4to Año'
       AND division = 'C'
       AND subjects LIKE '%Física%'
       ORDER BY name`
    );
    
    console.log(`Estudiantes en DB local con 4to Año, división C y Física: ${studentsInDB.rows.length}\n`);
    
    // Crear un mapa de nombres normalizados de la DB
    const dbNames = new Map();
    studentsInDB.rows.forEach(row => {
      const normalizedName = row.name.toLowerCase().replace(/[,\s]+/g, ' ').trim();
      dbNames.set(normalizedName, {
        original: row.name,
        id: row.id,
        email: row.email,
        studentId: row.studentId
      });
    });
    
    // Verificar qué alumnos del listado NO están en la DB
    const notInDB = [];
    const inDB = [];
    
    alumnos4toC.forEach(alumno => {
      // Normalizar el nombre para comparación
      const normalizedAlumno = alumno.toLowerCase().replace(/[,\s]+/g, ' ').trim();
      
      let found = false;
      for (const [dbName, data] of dbNames) {
        // Comparación flexible: verificar si los nombres coinciden parcialmente
        if (dbName.includes(normalizedAlumno.split(' ')[0]) || 
            normalizedAlumno.includes(dbName.split(' ')[0])) {
          found = true;
          inDB.push({
            listName: alumno,
            dbName: data.original,
            studentId: data.studentId
          });
          break;
        }
      }
      
      if (!found) {
        notInDB.push(alumno);
      }
    });
    
    console.log("=== ALUMNOS NO REGISTRADOS EN LA BASE DE DATOS ===");
    if (notInDB.length > 0) {
      notInDB.forEach((name, idx) => {
        console.log(`${idx + 1}. ${name}`);
      });
    } else {
      console.log("Todos los alumnos están registrados");
    }
    
    console.log(`\nTotal NO registrados: ${notInDB.length}`);
    console.log(`Total SÍ registrados: ${inDB.length}`);
    
    // 2. Verificar cuántos tienen reportes de Física
    const withReports = await localClient.execute(
      `SELECT DISTINCT u.name, COUNT(pr.id) as reportCount
       FROM User u
       INNER JOIN ProgressReport pr ON u.id = pr.userId
       WHERE u.role = 'STUDENT' 
       AND u.academicYear = '4to Año'
       AND u.division = 'C'
       AND pr.subject = 'Física'
       GROUP BY u.id, u.name
       ORDER BY u.name`
    );
    
    console.log(`\n=== ESTUDIANTES CON REPORTES DE FÍSICA ===`);
    console.log(`Total con reportes: ${withReports.rows.length}\n`);
    withReports.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.name} - ${row.reportCount} reportes`);
    });
    
    // 3. Verificar qué muestra la navegación (simular getHierarchicalNavigation)
    const navigation = await localClient.execute(
      `SELECT DISTINCT 
        pr.subject,
        u.academicYear,
        u.division
      FROM ProgressReport pr
      INNER JOIN User u ON pr.userId = u.id
      WHERE u.role = 'STUDENT' 
        AND pr.subject = 'Física'
        AND u.academicYear = '4to Año'
        AND u.division = 'C'`
    );
    
    console.log(`\n=== NAVEGACIÓN ACTUAL (getHierarchicalNavigation) ===`);
    console.log(`Registros encontrados con INNER JOIN: ${navigation.rows.length}`);
    if (navigation.rows.length > 0) {
      console.log("La navegación SÍ muestra Física -> 4to Año -> C");
    } else {
      console.log("La navegación NO muestra Física -> 4to Año -> C (sin reportes)");
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await localClient.close();
  }
}

verifyStudents();