#!/usr/bin/env node

/**
 * Check Production Database Schema
 */

const { createClient } = require('@libsql/client');

const TURSO_URL = 'libsql://intellego-production-roddb.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw';

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

async function main() {
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===');
    
    // Get all tables
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.rows.map(row => row.name));
    
    // Check all divisions
    const divisions = await client.execute(`
      SELECT DISTINCT division, COUNT(*) as count
      FROM User 
      WHERE division IS NOT NULL 
      GROUP BY division
      ORDER BY division
    `);
    console.log('\nDivisions found:');
    divisions.rows.forEach(row => {
      console.log(`  ${row.division}: ${row.count} students`);
    });
    
    // Check C division (4to C students)
    const cDivision = await client.execute(`
      SELECT division, COUNT(*) as count, academicYear, sede
      FROM User 
      WHERE division = 'C'
      GROUP BY division, academicYear, sede
    `);
    console.log('\nC Division breakdown:');
    cDivision.rows.forEach(row => {
      console.log(`  Division ${row.division} - ${row.academicYear} - ${row.sede}: ${row.count} students`);
    });
    
    // Check test user specifically
    const testUser = await client.execute(`
      SELECT id, name, email, studentId, division, subjects
      FROM User 
      WHERE id = 'cmdxovtsx0000le04793gasa2'
    `);
    console.log('\nTest user details:');
    if (testUser.rows.length > 0) {
      console.log(JSON.stringify(testUser.rows[0], null, 2));
    } else {
      console.log('Test user not found');
    }
    
    // Check students with incomplete subjects
    const incompleteSubjects = await client.execute(`
      SELECT name, division, subjects, studentId
      FROM User 
      WHERE name IN ('Juliana Ceriani Cernadas', 'Miranda Lazaro', 'lola perri', 'zoe poggi')
      ORDER BY name
    `);
    console.log('\nStudents with potentially incomplete subjects:');
    incompleteSubjects.rows.forEach(row => {
      console.log(`  ${row.name} (${row.division}): "${row.subjects}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.close();
  }
}

if (require.main === module) {
  main();
}