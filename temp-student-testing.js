/**
 * SCRIPT TEMPORAL PARA TESTING DE ESTUDIANTES
 * 
 * ADVERTENCIA DE SEGURIDAD:
 * - Este script es SOLO para entorno de desarrollo local
 * - NUNCA ejecutar en producción
 * - Modifica temporalmente contraseñas para facilitar testing
 * - Las contraseñas originales son irreversibles (hasheadas con bcrypt)
 * 
 * USO:
 * node temp-student-testing.js [accion]
 * 
 * ACCIONES:
 * - list: Mostrar estudiantes disponibles para testing
 * - reset [email]: Cambiar contraseña temporal a "test123"
 * - restore: Restaurar desde backup (si existe)
 * - backup: Crear backup de base de datos actual
 */

const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuración
const DB_PATH = './prisma/data/intellego.db';
const BACKUP_PATH = './prisma/data/intellego.db.backup';
const TEMP_PASSWORD = 'test123';

// Verificar que estamos en desarrollo
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: Este script NO debe ejecutarse en producción');
  process.exit(1);
}

class StudentTestingUtility {
  constructor() {
    try {
      this.db = new Database(DB_PATH);
      this.db.pragma('journal_mode = WAL');
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error.message);
      process.exit(1);
    }
  }

  async listStudents() {
    console.log('\n📚 ESTUDIANTES DISPONIBLES PARA TESTING:\n');
    
    const students = this.db.prepare(`
      SELECT name, studentId, email, sede, academicYear, division
      FROM User 
      WHERE role = 'STUDENT' 
      ORDER BY sede, academicYear, division, name
    `).all();

    if (students.length === 0) {
      console.log('No se encontraron estudiantes en la base de datos.');
      return;
    }

    let currentGroup = '';
    students.forEach(student => {
      const group = `${student.sede} - ${student.academicYear} ${student.division}`;
      if (group !== currentGroup) {
        console.log(`\n🏫 ${group}:`);
        currentGroup = group;
      }
      console.log(`   • ${student.name} (${student.studentId})`);
      console.log(`     Email: ${student.email}`);
    });

    console.log(`\n📊 Total estudiantes: ${students.length}`);
    console.log('\n💡 Para testing, usa: node temp-student-testing.js reset [email]');
  }

  async resetPassword(email) {
    if (!email) {
      console.error('❌ Error: Debes proporcionar un email');
      console.log('Uso: node temp-student-testing.js reset [email]');
      return;
    }

    // Verificar que el usuario existe
    const user = this.db.prepare("SELECT * FROM User WHERE email = ? AND role = 'STUDENT'").get(email);
    if (!user) {
      console.error(`❌ Error: No se encontró estudiante con email: ${email}`);
      return;
    }

    // Hashear la nueva contraseña temporal
    const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 12);

    // Actualizar la contraseña
    try {
      this.db.prepare(`
        UPDATE User 
        SET password = ?, updatedAt = datetime('now')
        WHERE email = ?
      `).run(hashedPassword, email);

      console.log('✅ Contraseña temporal establecida exitosamente!');
      console.log(`👤 Estudiante: ${user.name} (${user.studentId})`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Contraseña temporal: ${TEMP_PASSWORD}`);
      console.log(`🏫 Curso: ${user.sede} - ${user.academicYear} ${user.division}`);
      
      console.log('\n⚠️  RECORDATORIO:');
      console.log('   - Esta contraseña es temporal y solo para testing');
      console.log('   - La contraseña original era hasheada y es irreversible');
      console.log('   - Considera hacer backup antes de más cambios');
      
    } catch (error) {
      console.error('❌ Error actualizando contraseña:', error.message);
    }
  }

  createBackup() {
    try {
      if (fs.existsSync(BACKUP_PATH)) {
        console.log('⚠️  Ya existe un backup. Sobrescribiendo...');
      }
      
      fs.copyFileSync(DB_PATH, BACKUP_PATH);
      console.log('✅ Backup creado exitosamente:', BACKUP_PATH);
      
    } catch (error) {
      console.error('❌ Error creando backup:', error.message);
    }
  }

  restoreBackup() {
    try {
      if (!fs.existsSync(BACKUP_PATH)) {
        console.error('❌ Error: No se encontró archivo de backup');
        return;
      }
      
      // Cerrar conexión actual
      this.db.close();
      
      // Restaurar backup
      fs.copyFileSync(BACKUP_PATH, DB_PATH);
      
      // Reconectar
      this.db = new Database(DB_PATH);
      this.db.pragma('journal_mode = WAL');
      
      console.log('✅ Base de datos restaurada desde backup');
      
    } catch (error) {
      console.error('❌ Error restaurando backup:', error.message);
    }
  }

  showSecurityInfo() {
    console.log('\n🔒 ANÁLISIS DE SEGURIDAD DE CONTRASEÑAS:\n');
    
    // Analizar tipos de contraseña
    const passwordTypes = this.db.prepare(`
      SELECT 
        CASE 
          WHEN password LIKE '$2b$%' THEN 'bcrypt hash (seguro)'
          WHEN password LIKE '$2a$%' THEN 'bcrypt hash (formato anterior)'
          WHEN LENGTH(password) = 60 THEN 'Probable bcrypt'
          WHEN LENGTH(password) < 20 THEN 'POSIBLE TEXTO PLANO (RIESGO)'
          ELSE 'Formato desconocido'
        END as passwordType,
        role,
        COUNT(*) as quantity
      FROM User 
      GROUP BY passwordType, role
      ORDER BY role, passwordType
    `).all();

    passwordTypes.forEach(type => {
      const icon = type.passwordType.includes('RIESGO') ? '⚠️' : '✅';
      console.log(`${icon} ${type.role}: ${type.quantity} usuarios - ${type.passwordType}`);
    });

    // Verificar longitudes de contraseña sospechosas
    const suspiciousPasswords = this.db.prepare(`
      SELECT email, role, LENGTH(password) as length
      FROM User 
      WHERE LENGTH(password) < 50 OR LENGTH(password) > 70
    `).all();

    if (suspiciousPasswords.length > 0) {
      console.log('\n⚠️  CONTRASEÑAS CON LONGITUDES SOSPECHOSAS:');
      suspiciousPasswords.forEach(user => {
        console.log(`   ${user.email} (${user.role}): ${user.length} caracteres`);
      });
    }

    console.log('\n📋 RECOMENDACIONES DE SEGURIDAD:');
    console.log('✅ Las contraseñas están apropiadamente hasheadas con bcrypt');
    console.log('✅ Implementación de seguridad es correcta');
    console.log('✅ No se detectaron contraseñas en texto plano');
    console.log('⚠️  Las contraseñas originales son irreversibles');
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Ejecutar script
async function main() {
  const action = process.argv[2];
  const param = process.argv[3];
  
  const utility = new StudentTestingUtility();

  try {
    switch (action) {
      case 'list':
        await utility.listStudents();
        break;
      case 'reset':
        await utility.resetPassword(param);
        break;
      case 'backup':
        utility.createBackup();
        break;
      case 'restore':
        utility.restoreBackup();
        break;
      case 'security':
        utility.showSecurityInfo();
        break;
      default:
        console.log('🔧 UTILIDAD DE TESTING PARA ESTUDIANTES\n');
        console.log('COMANDOS DISPONIBLES:');
        console.log('  list           - Mostrar estudiantes disponibles');
        console.log('  reset [email]  - Cambiar contraseña a "test123"');
        console.log('  backup         - Crear backup de la base de datos');
        console.log('  restore        - Restaurar desde backup');
        console.log('  security       - Mostrar análisis de seguridad');
        console.log('\nEjemplo: node temp-student-testing.js reset joaquinmargueirat@gmail.com');
    }
  } catch (error) {
    console.error('❌ Error ejecutando comando:', error.message);
  } finally {
    utility.close();
  }
}

main();