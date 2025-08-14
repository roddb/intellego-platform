#!/usr/bin/env node

/**
 * Script para crear usuario instructor en Turso producción
 * Usuario: rdb@intellego.com
 * Contraseña: 02R07d91!
 * Role: INSTRUCTOR
 * StudentId: INST-2025-001
 */

const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Configuración de Turso (producción)
const TURSO_DATABASE_URL = "libsql://intellego-production-roddb.aws-us-east-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQyNDUyNjUsImlkIjoiMzZlNDhmZTQtMGE3ZC00Yjk5LWIyZmEtMWFiOTBiZTVkMzUzIiwicmlkIjoiNmY2ODFjNWUtNDdiOS00ZjYwLWFkYjctNjA3NWNhMmZjMzUyIn0.X6NQ5rLuainoba0mZlOKx3O7LGB1AdUR3X3aQlqqiLHLUh9lJ2JIx1JdYEeSorAIciUL4PhVwK3cVi8pf7fUAw";

// Datos del usuario instructor
const instructorData = {
  email: "rdb@intellego.com",
  password: "02R07d91!",
  name: "Rodrigo Di Bernardo",
  role: "INSTRUCTOR",
  studentId: "INST-2025-001",
  sede: "Central",
  academicYear: "2025",
  division: "INSTRUCTOR",
  subjects: JSON.stringify([
    "Matemáticas",
    "Física", 
    "Química",
    "Biología",
    "Historia",
    "Geografía",
    "Literatura",
    "Inglés"
  ]),
  status: "ACTIVE"
};

async function main() {
  let client;
  
  try {
    console.log('🚀 Conectando a Turso producción...');
    
    // Crear cliente Turso
    client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
      intMode: "number"
    });
    
    console.log('✅ Conexión establecida a Turso');
    
    // Verificar conexión con health check
    console.log('🔍 Verificando conexión...');
    const healthCheck = await client.execute('SELECT 1 as test');
    console.log('✅ Health check exitoso:', healthCheck.rows[0]);
    
    // Verificar estructura de tabla User
    console.log('🔍 Verificando estructura de tabla User...');
    const tableInfo = await client.execute("PRAGMA table_info(User)");
    console.log('📋 Columnas de tabla User:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario ya existe...');
    const existingUser = await client.execute({
      sql: 'SELECT id, email, role FROM User WHERE email = ?',
      args: [instructorData.email]
    });
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Usuario ya existe:', existingUser.rows[0]);
      console.log('❌ Abortando creación para evitar duplicados');
      return;
    }
    
    console.log('✅ Usuario no existe, procediendo con la creación...');
    
    // Generar hash de contraseña
    console.log('🔐 Generando hash de contraseña...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(instructorData.password, saltRounds);
    console.log('✅ Hash generado exitosamente');
    
    // Generar UUID y timestamps
    const userId = uuidv4();
    const timestamp = new Date().toISOString();
    
    console.log('📝 Datos del usuario a insertar:');
    console.log(`  - ID: ${userId}`);
    console.log(`  - Email: ${instructorData.email}`);
    console.log(`  - Nombre: ${instructorData.name}`);
    console.log(`  - Role: ${instructorData.role}`);
    console.log(`  - StudentId: ${instructorData.studentId}`);
    console.log(`  - Sede: ${instructorData.sede}`);
    console.log(`  - Año académico: ${instructorData.academicYear}`);
    console.log(`  - División: ${instructorData.division}`);
    console.log(`  - Status: ${instructorData.status}`);
    
    // Insertar usuario instructor
    console.log('📥 Insertando usuario instructor...');
    
    const insertResult = await client.execute({
      sql: `
        INSERT INTO User (
          id, name, email, password, role, studentId, 
          sede, academicYear, division, subjects, status,
          emailVerified, image, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        userId,
        instructorData.name,
        instructorData.email,
        hashedPassword,
        instructorData.role,
        instructorData.studentId,
        instructorData.sede,
        instructorData.academicYear,
        instructorData.division,
        instructorData.subjects,
        instructorData.status,
        null, // emailVerified
        null, // image
        timestamp, // createdAt
        timestamp  // updatedAt
      ]
    });
    
    console.log('✅ Usuario instructor insertado exitosamente');
    console.log('📊 Resultado de inserción:', {
      rowsAffected: insertResult.rowsAffected,
      lastInsertRowid: insertResult.lastInsertRowid
    });
    
    // Verificar inserción
    console.log('🔍 Verificando inserción...');
    const verificationResult = await client.execute({
      sql: 'SELECT id, name, email, role, studentId, sede, academicYear, division, status, createdAt FROM User WHERE email = ?',
      args: [instructorData.email]
    });
    
    if (verificationResult.rows.length > 0) {
      console.log('✅ Verificación exitosa - Usuario encontrado:');
      const user = verificationResult.rows[0];
      console.log('📋 Datos del usuario creado:');
      Object.keys(user).forEach(key => {
        console.log(`  - ${key}: ${user[key]}`);
      });
    } else {
      console.log('❌ Error: Usuario no encontrado después de la inserción');
    }
    
    // Verificar que la contraseña se puede validar
    console.log('🔐 Probando validación de contraseña...');
    const passwordValid = await bcrypt.compare(instructorData.password, hashedPassword);
    console.log('✅ Validación de contraseña:', passwordValid ? 'EXITOSA' : 'FALLIDA');
    
    console.log('');
    console.log('🎉 ¡TAREA COMPLETADA EXITOSAMENTE!');
    console.log('📋 Resumen:');
    console.log(`   ✅ Usuario instructor creado: ${instructorData.email}`);
    console.log(`   ✅ Role asignado: ${instructorData.role}`);
    console.log(`   ✅ StudentId: ${instructorData.studentId}`);
    console.log(`   ✅ Contraseña hasheada y verificada`);
    console.log(`   ✅ Datos insertados en Turso producción`);
    console.log('');
    console.log('🚀 El usuario puede ahora autenticarse en el sistema');
    
  } catch (error) {
    console.error('❌ Error durante la operación:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('⚠️  Error: El usuario ya existe (violación de constraint UNIQUE)');
    } else if (error.message.includes('no such table')) {
      console.log('⚠️  Error: La tabla User no existe en la base de datos');
    } else if (error.message.includes('no such column')) {
      console.log('⚠️  Error: Alguna columna especificada no existe en la tabla');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('🔌 Conexión a Turso cerrada');
      } catch (closeError) {
        console.error('⚠️  Error al cerrar conexión:', closeError);
      }
    }
  }
}

// Ejecutar script
console.log('🚀 Iniciando creación de usuario instructor en Turso producción...');
console.log('=' * 60);
main().catch(console.error);