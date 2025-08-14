const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://intellego-production-roddb.aws-us-east-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw"
});

async function checkStudents() {
  try {
    console.log("=== CHECKING 4TO C STUDENTS WITH FÍSICA ===\n");
    
    // 1. Check students with exact values
    const exactMatch = await client.execute(
      `SELECT COUNT(*) as count FROM User 
       WHERE role = 'STUDENT' 
       AND academicYear = '4to Año'
       AND division = 'C'
       AND subjects LIKE '%Física%'`
    );
    console.log("1. Students with academicYear='4to Año', division='C', subjects contains 'Física':");
    console.log("   Count:", exactMatch.rows[0].count, "\n");
    
    // 2. Check all students in division C with Física
    const divisionC = await client.execute(
      `SELECT id, name, academicYear, division, subjects 
       FROM User 
       WHERE role = 'STUDENT' 
       AND division = 'C'
       AND subjects LIKE '%Física%'
       ORDER BY name
       LIMIT 10`
    );
    console.log("2. Sample of division C students with Física:");
    divisionC.rows.forEach(row => {
      console.log(`   - ${row.name}: academicYear='${row.academicYear}', division='${row.division}'`);
    });
    console.log("");
    
    // 3. Check distinct academicYear values for students with Física
    const years = await client.execute(
      `SELECT DISTINCT academicYear, COUNT(*) as count 
       FROM User 
       WHERE role = 'STUDENT' 
       AND subjects LIKE '%Física%'
       GROUP BY academicYear
       ORDER BY academicYear`
    );
    console.log("3. All distinct academicYear values for students with Física:");
    years.rows.forEach(row => {
      console.log(`   - '${row.academicYear}': ${row.count} students`);
    });
    console.log("");
    
    // 4. Check 4° related variations
    const fourthYear = await client.execute(
      `SELECT COUNT(*) as count, academicYear 
       FROM User 
       WHERE role = 'STUDENT' 
       AND (academicYear LIKE '%4%' OR academicYear LIKE '%cuarto%' OR academicYear LIKE '%IV%')
       AND division = 'C'
       AND subjects LIKE '%Física%'
       GROUP BY academicYear`
    );
    console.log("4. Students in division C with Física and 4th year variations:");
    fourthYear.rows.forEach(row => {
      console.log(`   - academicYear='${row.academicYear}': ${row.count} students`);
    });
    console.log("");
    
    // 5. Check exact matches for the common format
    const commonFormat = await client.execute(
      `SELECT COUNT(*) as count FROM User 
       WHERE role = 'STUDENT' 
       AND academicYear = '4° Año'
       AND division = 'C'
       AND subjects LIKE '%Física%'`
    );
    console.log("5. Students with academicYear='4° Año' (with degree symbol):");
    console.log("   Count:", commonFormat.rows[0].count, "\n");
    
    // 6. List first 5 students to see exact format
    const sample = await client.execute(
      `SELECT id, name, academicYear, division 
       FROM User 
       WHERE role = 'STUDENT' 
       AND academicYear = '4° Año'
       AND division = 'C'
       AND subjects LIKE '%Física%'
       LIMIT 5`
    );
    console.log("6. First 5 students with '4° Año' and division 'C' with Física:");
    sample.rows.forEach(row => {
      console.log(`   - ${row.name} (ID: ${row.id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkStudents();