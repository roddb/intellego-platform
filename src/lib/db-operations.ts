import bcrypt from 'bcryptjs';
import { db, query } from './db'; // Use the libSQL client

// Export db getter for compatibility
export { db };

// User operations
export async function findUserByEmail(email: string) {
  try {
    const result = await query(
      'SELECT * FROM User WHERE email = ? LIMIT 1',
      [email]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error finding user by email:', error)
    throw error
  }
}

export async function findUserById(id: string) {
  try {
    const result = await query(
      'SELECT * FROM User WHERE id = ? LIMIT 1',
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error finding user by id:', error)
    throw error
  }
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  studentId?: string;
  sede?: string;
  academicYear?: string;
  division?: string;
  subjects?: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Generate a unique ID (cuid-like)
    const id = generateId();
    const now = new Date().toISOString();
    
    await query(`
      INSERT INTO User (
        id, name, email, password, role, studentId, 
        sede, academicYear, division, subjects, 
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `, [
      id, userData.name, userData.email, hashedPassword, userData.role,
      userData.studentId, userData.sede, userData.academicYear, 
      userData.division, userData.subjects, now, now
    ]);
    
    // Return the created user
    return await findUserById(id);
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function validateUserPassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.password) return null;
  
  const isValid = await bcrypt.compare(password, String(user.password));
  return isValid ? user : null;
}

// Generate unique student ID
export async function generateStudentId(): Promise<string> {
  try {
    const year = new Date().getFullYear();
    const prefix = `EST-${year}-`;
    
    // Find the highest existing student ID for this year
    const result = await query(`
      SELECT studentId FROM User 
      WHERE studentId LIKE ? 
      ORDER BY studentId DESC 
      LIMIT 1
    `, [`${prefix}%`]);
    
    let nextNumber = 1;
    if (result.rows.length > 0 && result.rows[0].studentId) {
      const lastNumber = parseInt(String(result.rows[0].studentId).split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating student ID:', error)
    throw error
  }
}

// Helper function to generate unique IDs
function generateId(): string {
  return 'u_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Weekly Reports operations  
export async function createWeeklyReport(data: {
  userId: string;
  subject: string;
  weekStart: Date;
  weekEnd: Date;
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
}) {
  try {
    const reportId = generateId();
    const now = new Date().toISOString();
    
    // Create the progress report
    await query(`
      INSERT INTO ProgressReport (
        id, userId, subject, weekStart, weekEnd, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      reportId, data.userId, data.subject, 
      data.weekStart.toISOString(), data.weekEnd.toISOString(), now
    ]);
    
    // Create the answers
    for (const answer of data.answers) {
      const answerId = generateId();
      await query(`
        INSERT INTO Answer (
          id, questionId, progressReportId, answer
        ) VALUES (?, ?, ?, ?)
      `, [answerId, answer.questionId, reportId, answer.answer]);
    }
    
    // Return the created report (simplified for now)
    return {
      id: reportId,
      userId: data.userId,
      subject: data.subject,
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      submittedAt: new Date(now),
      answers: data.answers
    };
  } catch (error) {
    console.error('Error creating weekly report:', error)
    throw error
  }
}

export async function findWeeklyReportsByUser(userId: string) {
  try {
    const result = await query(`
      SELECT pr.*, u.name as userName, u.email as userEmail
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.userId = ?
      ORDER BY pr.weekStart DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error finding weekly reports by user:', error)
    throw error
  }
}

export async function findWeeklyReportByUserAndWeek(userId: string, weekStart: Date, subject?: string) {
  try {
    let sql = `
      SELECT * FROM ProgressReport 
      WHERE userId = ? AND weekStart = ?
    `;
    const params = [userId, weekStart.toISOString()];
    
    if (subject) {
      sql += ' AND subject = ?';
      params.push(subject);
    }
    
    sql += ' LIMIT 1';
    
    const result = await query(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error finding weekly report by user and week:', error)
    throw error
  }
}

export async function getAllWeeklyReports() {
  try {
    const result = await query(`
      SELECT pr.*, u.id as userId, u.name as userName, u.email as userEmail, u.studentId
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      ORDER BY pr.submittedAt DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting all weekly reports:', error)
    throw error
  }
}

// Questions operations
export async function getAllQuestions() {
  try {
    const result = await query(`
      SELECT * FROM Question 
      WHERE isActive = 1 
      ORDER BY "order" ASC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting all questions:', error)
    throw error
  }
}

// Date utility functions
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getCurrentWeekEnd(): Date {
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

export async function canSubmitThisWeek(userId: string): Promise<boolean> {
  // This function is kept for backward compatibility but deprecated
  // Use canSubmitForSubject instead
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();
  const currentDate = new Date();
  
  const isCurrentWeek = currentDate >= weekStart && currentDate <= weekEnd;
  return isCurrentWeek;
}

// New function to check if user can submit for specific subject
export async function canSubmitForSubject(userId: string, subject: string): Promise<boolean> {
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();
  const currentDate = new Date();
  
  const existingReport = await findWeeklyReportByUserAndWeek(userId, weekStart, subject);
  const isCurrentWeek = currentDate >= weekStart && currentDate <= weekEnd;
  
  return isCurrentWeek && !existingReport;
}

// Get user's registered subjects
export async function getUserSubjects(userId: string): Promise<string[]> {
  const user = await findUserById(userId);
  if (!user?.subjects) return [];
  
  return String(user.subjects).split(',').map(s => s.trim()).filter(s => s);
}

// Get reports grouped by subject for a user
export async function findWeeklyReportsByUserGroupedBySubject(userId: string) {
  try {
    const result = await query(`
      SELECT * FROM ProgressReport 
      WHERE userId = ? 
      ORDER BY weekStart DESC
    `, [userId]);
    
    const reports = result.rows;
    
    // Group by subject
    const groupedReports: { [subject: string]: any[] } = {};
    reports.forEach(report => {
      const subject = String(report.subject);
      if (!groupedReports[subject]) {
        groupedReports[subject] = [];
      }
      groupedReports[subject].push(report);
    });

    return groupedReports;
  } catch (error) {
    console.error('Error finding weekly reports by user grouped by subject:', error)
    throw error
  }
}

// Export data functions
export async function exportReportsAsCSV() {
  const reports = await getAllWeeklyReports();
  
  const csvHeaders = [
    'Estudiante',
    'Email',
    'ID Estudiante', 
    'Materia',
    'Semana Inicio',
    'Semana Fin',
    'Fecha Envío'
  ];
  
  const csvRows = [csvHeaders.join(',')];
  
  for (const report of reports) {
    const row = [
      `"${report.userName || ''}"`,
      `"${report.userEmail}"`,
      `"${report.studentId || ''}"`,
      `"${report.subject || ''}"`,
      `"${new Date(String(report.weekStart)).toISOString().split('T')[0]}"`,
      `"${new Date(String(report.weekEnd)).toISOString().split('T')[0]}"`,
      `"${new Date(String(report.submittedAt)).toISOString().split('T')[0]}"`
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

export async function exportReportsAsMarkdown() {
  const reports = await getAllWeeklyReports();
  
  let markdown = '# Reportes de Progreso Semanal\n\n';
  
  for (const report of reports) {
    markdown += `## ${report.userName} (${report.userEmail})\n`;
    markdown += `**ID Estudiante:** ${report.studentId || 'N/A'}\n`;
    markdown += `**Materia:** ${report.subject || 'N/A'}\n`;
    markdown += `**Semana:** ${new Date(String(report.weekStart)).toISOString().split('T')[0]} - ${new Date(String(report.weekEnd)).toISOString().split('T')[0]}\n`;
    markdown += `**Fecha de Envío:** ${new Date(String(report.submittedAt)).toISOString().split('T')[0]}\n\n`;
    markdown += '---\n\n';
  }
  
  return markdown;
}