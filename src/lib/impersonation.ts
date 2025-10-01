// Helper functions for instructor impersonation feature

import { query } from './db-operations';

export interface ImpersonationLog {
  id?: string;
  instructorId: string;
  instructorEmail: string;
  studentId: string;
  studentEmail: string;
  action: 'START' | 'END';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log impersonation activity for audit purposes
 */
export async function logImpersonation(log: ImpersonationLog) {
  try {
    await query(`
      INSERT INTO ImpersonationLog (
        instructorId, instructorEmail, studentId, studentEmail,
        action, timestamp, ipAddress, userAgent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      log.instructorId,
      log.instructorEmail,
      log.studentId,
      log.studentEmail,
      log.action,
      log.timestamp,
      log.ipAddress || null,
      log.userAgent || null
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error logging impersonation:', error);
    // Don't throw - logging failure shouldn't prevent impersonation
    return { success: false, error };
  }
}

/**
 * Get student details for impersonation
 */
export async function getStudentForImpersonation(studentId: string) {
  try {
    const result = await query(`
      SELECT
        id, name, email, studentId, sede, academicYear, division, subjects
      FROM User
      WHERE studentId = ? AND role = 'STUDENT'
      LIMIT 1
    `, [studentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const student = result.rows[0];
    return {
      id: String(student.id),
      name: String(student.name),
      email: String(student.email),
      studentId: String(student.studentId),
      sede: student.sede ? String(student.sede) : undefined,
      academicYear: student.academicYear ? String(student.academicYear) : undefined,
      division: student.division ? String(student.division) : undefined,
      subjects: student.subjects ? String(student.subjects) : undefined
    };
  } catch (error) {
    console.error('Error getting student for impersonation:', error);
    throw error;
  }
}

/**
 * Get all students for instructor's dropdown
 */
export async function getAllStudentsForInstructor() {
  try {
    const result = await query(`
      SELECT
        id, name, email, studentId, sede, academicYear, division
      FROM User
      WHERE role = 'STUDENT'
      ORDER BY sede, academicYear, division, name
    `);

    return result.rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      studentId: String(row.studentId),
      sede: row.sede ? String(row.sede) : undefined,
      academicYear: row.academicYear ? String(row.academicYear) : undefined,
      division: row.division ? String(row.division) : undefined,
      label: `${row.name} (${row.studentId}) - ${row.sede || 'N/A'} ${row.academicYear || ''} ${row.division || ''}`
    }));
  } catch (error) {
    console.error('Error getting students for instructor:', error);
    throw error;
  }
}

/**
 * Create impersonation log table if it doesn't exist
 */
export async function createImpersonationLogTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ImpersonationLog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instructorId TEXT NOT NULL,
        instructorEmail TEXT NOT NULL,
        studentId TEXT NOT NULL,
        studentEmail TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('START', 'END')),
        timestamp TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `);

    console.log('✅ ImpersonationLog table created or verified');
    return { success: true };
  } catch (error) {
    console.error('Error creating ImpersonationLog table:', error);
    throw error;
  }
}

/**
 * Check if impersonation timeout has been exceeded (30 minutes)
 */
export function hasImpersonationExpired(startedAt: string): boolean {
  const started = new Date(startedAt).getTime();
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;

  return (now - started) > thirtyMinutes;
}