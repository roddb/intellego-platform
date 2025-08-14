import bcrypt from 'bcryptjs';
import { db, query } from './db'; // Use the libSQL client

// Export db getter and query function for compatibility
export { db, query };

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
  console.log('🔍 validateUserPassword called for:', email);
  
  const user = await findUserByEmail(email);
  
  if (!user) {
    console.log('❌ User not found:', email);
    return null;
  }
  
  if (!user.password) {
    console.log('❌ User has no password:', email);
    return null;
  }
  
  console.log('🔍 Found user, testing password...');
  console.log('   User ID:', user.id);
  console.log('   User name:', user.name);
  console.log('   Password hash length:', String(user.password).length);
  
  const isValid = await bcrypt.compare(password, String(user.password));
  
  console.log('🔍 Password validation result:', isValid);
  
  if (isValid) {
    console.log('✅ Password valid, returning user');
    return user;
  } else {
    console.log('❌ Password invalid');
    return null;
  }
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
  // Use crypto.randomUUID if available, fallback to time-based ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: time-based + random string
  return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
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
    // Use date comparison instead of exact timestamp matching
    // This is more robust as it accounts for potential small differences in milliseconds
    const weekStartDateOnly = weekStart.toISOString().split('T')[0]; // Get YYYY-MM-DD only
    
    let sql = `
      SELECT * FROM ProgressReport 
      WHERE userId = ? AND DATE(weekStart) = ?
    `;
    const params = [userId, weekStartDateOnly];
    
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

// Date utility functions - FIXED to use Argentina timezone
export function getCurrentWeekStart(): Date {
  // Get current UTC time
  const nowUTC = new Date();
  
  // Convert to Argentina timezone (UTC-3)
  // Create a date object representing the current time in Argentina
  const argentinaOffset = -3 * 60; // Argentina is UTC-3 (in minutes)
  const argentinaTime = new Date(nowUTC.getTime() + (argentinaOffset * 60 * 1000));
  
  // Calculate Monday of current week in Argentina timezone
  const day = argentinaTime.getUTCDay(); // Use UTC methods since we manually adjusted for timezone
  const diff = argentinaTime.getUTCDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(argentinaTime);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC for storage, but maintain the Argentina-based week calculation
  const mondayUTC = new Date(monday.getTime() - (argentinaOffset * 60 * 1000));
  
  return mondayUTC;
}

export function getCurrentWeekEnd(): Date {
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  
  // Ensure we're still in Argentina timezone for the end boundary
  const argentinaOffset = -3 * 60; // Argentina is UTC-3 (in minutes) 
  const adjustedEnd = new Date(weekEnd.getTime() + (argentinaOffset * 60 * 1000));
  
  return adjustedEnd;
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

// Helper function to safely format dates
function formatDateSafely(dateValue: any): string {
  try {
    if (!dateValue) return 'N/A';
    const date = new Date(String(dateValue));
    if (isNaN(date.getTime())) return 'N/A';
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', dateValue, error);
    return 'N/A';
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
      `"${formatDateSafely(report.weekStart)}"`,
      `"${formatDateSafely(report.weekEnd)}"`,
      `"${formatDateSafely(report.submittedAt)}"`
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
    markdown += `**Semana:** ${formatDateSafely(report.weekStart)} - ${formatDateSafely(report.weekEnd)}\n`;
    markdown += `**Fecha de Envío:** ${formatDateSafely(report.submittedAt)}\n\n`;
    markdown += '---\n\n';
  }
  
  return markdown;
}

// Hierarchical instructor dashboard operations
export async function getInstructorHierarchicalData() {
  try {
    // Get all unique subjects from users and reports
    const subjectsResult = await query(`
      SELECT DISTINCT 
        CASE 
          WHEN u.subjects IS NOT NULL AND u.subjects != '' 
          THEN TRIM(value) 
          ELSE pr.subject 
        END as subject
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      LEFT JOIN (
        SELECT DISTINCT userId, subject FROM ProgressReport
      ) pr2 ON u.id = pr2.userId
      CROSS JOIN (
        SELECT TRIM(SUBSTR(u.subjects, 
          CASE WHEN INSTR(u.subjects, ',') = 0 THEN 1 ELSE 0 END, 
          CASE WHEN INSTR(u.subjects, ',') = 0 THEN LENGTH(u.subjects) ELSE INSTR(u.subjects, ',') - 1 END
        )) as value
        FROM User u
        WHERE u.subjects IS NOT NULL AND u.subjects != ''
        UNION ALL
        SELECT TRIM(SUBSTR(u.subjects, INSTR(u.subjects, ',') + 1)) as value
        FROM User u
        WHERE u.subjects IS NOT NULL AND u.subjects != '' AND INSTR(u.subjects, ',') > 0
      ) subject_split
      WHERE u.role = 'STUDENT' AND subject IS NOT NULL AND subject != ''
      
      UNION
      
      SELECT DISTINCT subject 
      FROM ProgressReport pr
      WHERE subject IS NOT NULL AND subject != ''
      
      ORDER BY subject
    `);
    
    return {
      subjects: subjectsResult.rows.map(row => String((row as any).subject)).filter(s => s && s.trim())
    };
  } catch (error) {
    console.error('Error getting hierarchical data:', error);
    throw error;
  }
}

export async function getStudentsBySubject(subject: string) {
  try {
    // Get students who have this subject in their subjects list OR have submitted reports for this subject
    const result = await query(`
      SELECT DISTINCT 
        u.id, u.name, u.email, u.studentId, u.sede, u.academicYear, u.division, u.subjects
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT' 
      AND (
        (u.subjects IS NOT NULL AND u.subjects LIKE ?)
        OR pr.subject = ?
      )
      ORDER BY u.academicYear DESC, u.division, u.name
    `, [`%${subject}%`, subject]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting students by subject:', error);
    throw error;
  }
}

export async function getStudentsBySubjectAndYear(subject: string, year: string) {
  try {
    const result = await query(`
      SELECT DISTINCT 
        u.id, u.name, u.email, u.studentId, u.sede, u.academicYear, u.division, u.subjects
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT' 
      AND u.academicYear = ?
      AND (
        (u.subjects IS NOT NULL AND u.subjects LIKE ?)
        OR pr.subject = ?
      )
      ORDER BY u.division, u.name
    `, [year, `%${subject}%`, subject]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting students by subject and year:', error);
    throw error;
  }
}

export async function getStudentsBySubjectYearAndCourse(subject: string, year: string, course: string) {
  try {
    const result = await query(`
      SELECT DISTINCT 
        u.id, u.name, u.email, u.studentId, u.sede, u.academicYear, u.division, u.subjects
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT' 
      AND u.academicYear = ?
      AND u.division = ?
      AND (
        (u.subjects IS NOT NULL AND u.subjects LIKE ?)
        OR pr.subject = ?
      )
      ORDER BY u.name
    `, [year, course, `%${subject}%`, subject]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting students by subject, year and course:', error);
    throw error;
  }
}


export async function getStudentReportsWithAnswers(userId: string) {
  try {
    const result = await query(`
      SELECT 
        pr.id, pr.userId, pr.weekStart, pr.weekEnd, pr.subject, pr.submittedAt,
        u.name as userName, u.email as userEmail, u.studentId, u.sede, u.academicYear, u.division
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.userId = ?
      ORDER BY pr.weekStart DESC
    `, [userId]);
    
    const reports = result.rows;
    
    // Get answers for each report
    for (const report of reports) {
      const answersResult = await query(`
        SELECT questionId, answer
        FROM Answer
        WHERE progressReportId = ?
      `, [report.id]);
      
      (report as any).answers = {};
      answersResult.rows.forEach(answerRow => {
        (report as any).answers[String((answerRow as any).questionId)] = String((answerRow as any).answer);
      });
    }
    
    return reports;
  } catch (error) {
    console.error('Error getting student reports with answers:', error);
    throw error;
  }
}

export async function getStudentReportById(reportId: string) {
  try {
    const result = await query(`
      SELECT 
        pr.id, pr.userId, pr.weekStart, pr.weekEnd, pr.subject, pr.submittedAt,
        u.name as userName, u.email as userEmail, u.studentId, u.sede, u.academicYear, u.division
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.id = ?
      LIMIT 1
    `, [reportId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const report = result.rows[0];
    
    // Get answers for the report
    const answersResult = await query(`
      SELECT questionId, answer
      FROM Answer
      WHERE progressReportId = ?
    `, [reportId]);
    
    (report as any).answers = {};
    answersResult.rows.forEach(answerRow => {
      (report as any).answers[String((answerRow as any).questionId)] = String((answerRow as any).answer);
    });
    
    return report;
  } catch (error) {
    console.error('Error getting student report by ID:', error);
    throw error;
  }
}

// =====================================================================================
// HIERARCHICAL DATA STRUCTURE TYPES - Updated for Instructor Dashboard
// Structure: materias/año/curso/listado de alumno correspondiente/alumno/semanas
// =====================================================================================

export interface HierarchicalStudent {
  id: string;
  name: string;
  email: string;
  studentId: string;
  sede: string;
  academicYear: string;
  division: string;
  subjects: string[];
  reportCount: number;
}

export interface HierarchicalWeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  submittedAt: string;
  answers: { [questionId: string]: string };
  questionIds: string[];
  subject: string;
}

export interface HierarchicalStudentWithReports extends HierarchicalStudent {
  weeklyReports: HierarchicalWeeklyReport[];
  completedWeeks: number;
}

export interface HierarchicalCourse {
  division: string;
  studentCount: number;
  students: HierarchicalStudentWithReports[];
  totalReports: number;
}

export interface HierarchicalYear {
  academicYear: string;
  courses: { [division: string]: HierarchicalCourse };
  studentCount: number;
  totalReports: number;
}

export interface HierarchicalSubject {
  subject: string;
  years: { [academicYear: string]: HierarchicalYear };
  totalStudents: number;
  totalReports: number;
}

export interface HierarchicalInstructorData {
  subjects: { [subject: string]: HierarchicalSubject };
  summary: {
    totalSubjects: number;
    totalStudents: number;
    totalReports: number;
    totalYears: number;
    totalCourses: number;
  };
}

export interface ReportDownloadData {
  reportMetadata: {
    id: string;
    student: HierarchicalStudent;
    weekStart: string;
    weekEnd: string;
    subject: string;
    submittedAt: string;
  };
  answers: { [questionId: string]: string };
  questions: { [questionId: string]: string }; // Question text for context
}

// =====================================================================================
// HIERARCHICAL QUERY FUNCTIONS - Optimized for libSQL/Turso
// Structure: materias/año/curso/listado de alumno correspondiente/alumno/semanas
// =====================================================================================

/**
 * Gets all subjects that have students enrolled or reports submitted
 * Optimized single query to get unique subjects
 */
export async function getSubjectsByInstructor(): Promise<string[]> {
  try {
    const result = await query(`
      SELECT DISTINCT subject
      FROM (
        -- Get subjects from user profiles (comma-separated)
        SELECT TRIM(SUBSTR(subjects, 1, CASE 
          WHEN INSTR(subjects, ',') = 0 THEN LENGTH(subjects)
          ELSE INSTR(subjects, ',') - 1 
        END)) as subject
        FROM User 
        WHERE role = 'STUDENT' 
        AND subjects IS NOT NULL 
        AND subjects != ''
        
        UNION ALL
        
        SELECT TRIM(SUBSTR(subjects, INSTR(subjects, ',') + 1)) as subject
        FROM User 
        WHERE role = 'STUDENT' 
        AND subjects IS NOT NULL 
        AND subjects != '' 
        AND INSTR(subjects, ',') > 0
        
        UNION ALL
        
        -- Get subjects from submitted reports
        SELECT DISTINCT subject
        FROM ProgressReport 
        WHERE subject IS NOT NULL 
        AND subject != ''
      ) combined_subjects
      WHERE subject IS NOT NULL 
      AND subject != ''
      ORDER BY subject
    `);
    
    return result.rows.map(row => String((row as any).subject));
  } catch (error) {
    console.error('Error getting subjects by instructor:', error);
    throw error;
  }
}

/**
 * Gets all academic years for a specific subject
 */
export async function getYearsBySubject(subject: string): Promise<string[]> {
  try {
    const result = await query(`
      SELECT DISTINCT u.academicYear
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT' 
      AND u.academicYear IS NOT NULL
      AND u.academicYear != ''
      AND (
        (u.subjects IS NOT NULL AND (
          u.subjects LIKE ? OR 
          u.subjects LIKE ? OR 
          u.subjects LIKE ? OR
          u.subjects = ?
        ))
        OR pr.subject = ?
      )
      ORDER BY u.academicYear DESC
    `, [
      `${subject},%`, 
      `%,${subject},%`, 
      `%,${subject}`, 
      subject, 
      subject
    ]);
    
    return result.rows.map(row => String((row as any).academicYear));
  } catch (error) {
    console.error('Error getting years by subject:', error);
    throw error;
  }
}

/**
 * Gets all courses (divisions) for a specific subject and year
 */
export async function getCoursesBySubjectAndYear(subject: string, year: string): Promise<string[]> {
  try {
    const result = await query(`
      SELECT DISTINCT u.division
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT' 
      AND u.academicYear = ?
      AND u.division IS NOT NULL
      AND u.division != ''
      AND (
        (u.subjects IS NOT NULL AND (
          u.subjects LIKE ? OR 
          u.subjects LIKE ? OR 
          u.subjects LIKE ? OR
          u.subjects = ?
        ))
        OR pr.subject = ?
      )
      ORDER BY u.division
    `, [
      year,
      `${subject},%`, 
      `%,${subject},%`, 
      `%,${subject}`, 
      subject, 
      subject
    ]);
    
    return result.rows.map(row => String((row as any).division));
  } catch (error) {
    console.error('Error getting courses by subject and year:', error);
    throw error;
  }
}

/**
 * Gets all students for a specific subject, year, and course with their report counts
 */
export async function getStudentsByCourse(subject: string, year: string, course: string): Promise<HierarchicalStudent[]> {
  try {
    // Get ALL students registered for this subject, year, and course
    // Uses LEFT JOIN to include students even if they haven't submitted reports yet
    const result = await query(`
      SELECT DISTINCT 
        u.id, u.name, u.email, u.studentId, u.sede, u.academicYear, u.division, u.subjects,
        COUNT(pr.id) as reportCount
      FROM User u
      LEFT JOIN ProgressReport pr ON (u.id = pr.userId AND pr.subject = ?)
      WHERE u.role = 'STUDENT' 
        AND u.academicYear = ?
        AND u.division = ?
        AND u.subjects LIKE ?
      GROUP BY u.id, u.name, u.email, u.studentId, u.sede, u.academicYear, u.division, u.subjects
      ORDER BY u.name
    `, [subject, year, course, `%${subject}%`]);
    
    return result.rows.map(row => ({
      id: String((row as any).id),
      name: String((row as any).name),
      email: String((row as any).email),
      studentId: String((row as any).studentId || ''),
      sede: String((row as any).sede || ''),
      academicYear: String((row as any).academicYear),
      division: String((row as any).division),
      subjects: String((row as any).subjects || '').split(',').map(s => s.trim()).filter(s => s),
      reportCount: Number((row as any).reportCount || 0)
    }));
  } catch (error) {
    console.error('Error getting students by course:', error);
    throw error;
  }
}

/**
 * Gets all weekly reports for a specific student and subject, ordered by week
 */
export async function getWeeklyReportsByStudent(userId: string, subject: string): Promise<HierarchicalWeeklyReport[]> {
  try {
    const result = await query(`
      SELECT 
        pr.id, pr.weekStart, pr.weekEnd, pr.submittedAt, pr.subject
      FROM ProgressReport pr
      WHERE pr.userId = ? AND pr.subject = ?
      ORDER BY pr.weekStart DESC
    `, [userId, subject]);
    
    const reports: HierarchicalWeeklyReport[] = [];
    
    // Get answers for each report
    for (const reportRow of result.rows) {
      const answersResult = await query(`
        SELECT questionId, answer
        FROM Answer
        WHERE progressReportId = ?
        ORDER BY questionId
      `, [reportRow.id]);
      
      const answers: { [questionId: string]: string } = {};
      const questionIds: string[] = [];
      
      answersResult.rows.forEach(answerRow => {
        const questionId = String((answerRow as any).questionId);
        answers[questionId] = String((answerRow as any).answer);
        questionIds.push(questionId);
      });
      
      reports.push({
        id: String((reportRow as any).id),
        weekStart: String((reportRow as any).weekStart),
        weekEnd: String((reportRow as any).weekEnd),
        submittedAt: String((reportRow as any).submittedAt),
        subject: String((reportRow as any).subject),
        answers,
        questionIds
      });
    }
    
    return reports;
  } catch (error) {
    console.error('Error getting weekly reports by student:', error);
    throw error;
  }
}

/**
 * Gets a single report with full details including student info and answers
 */
export async function getReportWithAnswers(reportId: string): Promise<ReportDownloadData | null> {
  try {
    const reportResult = await query(`
      SELECT 
        pr.id, pr.userId, pr.weekStart, pr.weekEnd, pr.subject, pr.submittedAt,
        u.id as studentId, u.name, u.email, u.studentId as studentNumber, 
        u.sede, u.academicYear, u.division, u.subjects
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.id = ?
      LIMIT 1
    `, [reportId]);
    
    if (reportResult.rows.length === 0) {
      return null;
    }
    
    const report = reportResult.rows[0];
    
    // Get answers
    const answersResult = await query(`
      SELECT questionId, answer
      FROM Answer
      WHERE progressReportId = ?
      ORDER BY questionId
    `, [reportId]);
    
    const answers: { [questionId: string]: string } = {};
    const questionIds = new Set<string>();
    
    answersResult.rows.forEach(answerRow => {
      const questionId = String((answerRow as any).questionId);
      answers[questionId] = String((answerRow as any).answer);
      questionIds.add(questionId);
    });
    
    // For now, we'll use placeholder question text since we don't have a Question table
    const questions: { [questionId: string]: string } = {};
    Array.from(questionIds).forEach(qId => {
      questions[qId] = `Pregunta ${qId}`;
    });
    
    const student: HierarchicalStudent = {
      id: String((report as any).studentId),
      name: String((report as any).name),
      email: String((report as any).email),
      studentId: String((report as any).studentNumber || ''),
      sede: String((report as any).sede || ''),
      academicYear: String((report as any).academicYear),
      division: String((report as any).division),
      subjects: String((report as any).subjects || '').split(',').map(s => s.trim()).filter(s => s),
      reportCount: 0 // Not needed for download data
    };
    
    return {
      reportMetadata: {
        id: String((report as any).id),
        student,
        weekStart: String((report as any).weekStart),
        weekEnd: String((report as any).weekEnd),
        subject: String((report as any).subject),
        submittedAt: String((report as any).submittedAt)
      },
      answers,
      questions
    };
  } catch (error) {
    console.error('Error getting report with answers:', error);
    throw error;
  }
}

// =====================================================================================
// HIERARCHICAL DATA AGGREGATION FUNCTIONS
// Structure: materias/año/curso/listado de alumno correspondiente/alumno/semanas
// =====================================================================================

/**
 * Builds the complete hierarchical structure for instructor dashboard
 * Returns fully structured data according to: materias/año/curso/estudiantes/semanas
 */
export async function buildCompleteHierarchicalData(): Promise<HierarchicalInstructorData> {
  try {
    console.log('🔄 Building complete hierarchical data structure...');
    
    const hierarchicalData: HierarchicalInstructorData = {
      subjects: {},
      summary: {
        totalSubjects: 0,
        totalStudents: 0,
        totalReports: 0,
        totalYears: 0,
        totalCourses: 0
      }
    };

    // Get all subjects
    const subjects = await getSubjectsByInstructor();
    hierarchicalData.summary.totalSubjects = subjects.length;
    
    for (const subject of subjects) {
      console.log(`📚 Processing subject: ${subject}`);
      
      // Initialize subject structure
      hierarchicalData.subjects[subject] = {
        subject,
        years: {},
        totalStudents: 0,
        totalReports: 0
      };
      
      // Get years for this subject
      const years = await getYearsBySubject(subject);
      
      for (const year of years) {
        console.log(`📅 Processing year: ${year} for subject: ${subject}`);
        
        // Initialize year structure
        hierarchicalData.subjects[subject].years[year] = {
          academicYear: year,
          courses: {},
          studentCount: 0,
          totalReports: 0
        };
        
        // Get courses for this subject and year
        const courses = await getCoursesBySubjectAndYear(subject, year);
        
        for (const course of courses) {
          console.log(`🎓 Processing course: ${course} for ${subject} - ${year}`);
          
          // Get students for this subject, year, and course
          const students = await getStudentsByCourse(subject, year, course);
          
          // Get detailed reports for each student
          const studentsWithReports: HierarchicalStudentWithReports[] = [];
          let courseReportCount = 0;
          
          for (const student of students) {
            const weeklyReports = await getWeeklyReportsByStudent(student.id, subject);
            const completedWeeks = weeklyReports.length;
            courseReportCount += completedWeeks;
            
            studentsWithReports.push({
              ...student,
              weeklyReports,
              completedWeeks
            });
          }
          
          // Initialize course structure
          hierarchicalData.subjects[subject].years[year].courses[course] = {
            division: course,
            studentCount: students.length,
            students: studentsWithReports,
            totalReports: courseReportCount
          };
          
          // Update year totals
          hierarchicalData.subjects[subject].years[year].studentCount += students.length;
          hierarchicalData.subjects[subject].years[year].totalReports += courseReportCount;
        }
        
        // Update subject totals
        hierarchicalData.subjects[subject].totalStudents += hierarchicalData.subjects[subject].years[year].studentCount;
        hierarchicalData.subjects[subject].totalReports += hierarchicalData.subjects[subject].years[year].totalReports;
      }
      
      // Update summary totals
      hierarchicalData.summary.totalStudents += hierarchicalData.subjects[subject].totalStudents;
      hierarchicalData.summary.totalReports += hierarchicalData.subjects[subject].totalReports;
      hierarchicalData.summary.totalYears += Object.keys(hierarchicalData.subjects[subject].years).length;
      hierarchicalData.summary.totalCourses += Object.values(hierarchicalData.subjects[subject].years)
        .reduce((acc, year) => acc + Object.keys(year.courses).length, 0);
    }
    
    console.log('✅ Hierarchical data structure completed:', {
      subjects: hierarchicalData.summary.totalSubjects,
      students: hierarchicalData.summary.totalStudents,
      reports: hierarchicalData.summary.totalReports,
      years: hierarchicalData.summary.totalYears,
      courses: hierarchicalData.summary.totalCourses
    });
    
    return hierarchicalData;
  } catch (error) {
    console.error('Error building complete hierarchical data:', error);
    throw error;
  }
}

/**
 * Gets aggregated statistics for a specific subject
 */
export async function getSubjectStatistics(subject: string): Promise<{
  totalStudents: number;
  totalReports: number;
  years: string[];
  courses: string[];
  avgReportsPerStudent: number;
}> {
  try {
    // Get all students for this subject
    const studentsResult = await query(`
      SELECT DISTINCT u.id, u.academicYear, u.division
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT' 
      AND (
        (u.subjects IS NOT NULL AND (
          u.subjects LIKE ? OR 
          u.subjects LIKE ? OR 
          u.subjects LIKE ? OR
          u.subjects = ?
        ))
        OR pr.subject = ?
      )
    `, [
      `${subject},%`, 
      `%,${subject},%`, 
      `%,${subject}`, 
      subject, 
      subject
    ]);
    
    // Get total reports for this subject
    const reportsResult = await query(`
      SELECT COUNT(*) as totalReports
      FROM ProgressReport pr
      WHERE pr.subject = ?
    `, [subject]);
    
    const totalStudents = studentsResult.rows.length;
    const totalReports = Number((reportsResult.rows[0] as any)?.totalReports || 0);
    const avgReportsPerStudent = totalStudents > 0 ? totalReports / totalStudents : 0;
    
    const yearsSet = new Set(studentsResult.rows.map(row => String((row as any).academicYear)).filter(y => y && y !== 'null'));
    const coursesSet = new Set(studentsResult.rows.map(row => String((row as any).division)).filter(d => d && d !== 'null'));
    const years = Array.from(yearsSet);
    const courses = Array.from(coursesSet);
    
    return {
      totalStudents,
      totalReports,
      years: years.sort((a, b) => b.localeCompare(a)), // Most recent first
      courses: courses.sort(),
      avgReportsPerStudent: Math.round(avgReportsPerStudent * 100) / 100
    };
  } catch (error) {
    console.error('Error getting subject statistics:', error);
    throw error;
  }
}

/**
 * Gets quick navigation structure (subjects -> years -> courses) without full student data
 * This is optimized for building navigation menus quickly
 */
export async function getHierarchicalNavigation(): Promise<{
  [subject: string]: {
    [year: string]: string[] // array of courses
  }
}> {
  try {
    // Get subjects from actual progress reports to ensure we only show subjects with data
    const result = await query(`
      SELECT DISTINCT 
        pr.subject,
        u.academicYear,
        u.division
      FROM ProgressReport pr
      INNER JOIN User u ON pr.userId = u.id
      WHERE u.role = 'STUDENT' 
        AND pr.subject IS NOT NULL
        AND pr.subject != ''
        AND u.academicYear IS NOT NULL 
        AND u.academicYear != ''
        AND u.division IS NOT NULL 
        AND u.division != ''
      ORDER BY pr.subject, u.academicYear DESC, u.division
    `);
    
    const navigation: { [subject: string]: { [year: string]: string[] } } = {};
    
    result.rows.forEach(row => {
      const subject = String((row as any).subject || '').trim();
      const year = String((row as any).academicYear || '').trim();
      const course = String((row as any).division || '').trim();
      
      if (!subject || !year || !course) return;
      
      if (!navigation[subject]) {
        navigation[subject] = {};
      }
      
      if (!navigation[subject][year]) {
        navigation[subject][year] = [];
      }
      
      if (!navigation[subject][year].includes(course)) {
        navigation[subject][year].push(course);
      }
    });
    
    // Sort courses within each year
    Object.keys(navigation).forEach(subject => {
      Object.keys(navigation[subject]).forEach(year => {
        navigation[subject][year].sort();
      });
    });
    
    return navigation;
  } catch (error) {
    console.error('Error getting hierarchical navigation:', error);
    throw error;
  }
}

// =====================================================================================
// JSON DOWNLOAD FUNCTIONS - Individual Report Export
// =====================================================================================

/**
 * Generates JSON export data for a single report with complete context
 */
export async function generateReportJSON(reportId: string): Promise<string> {
  try {
    const reportData = await getReportWithAnswers(reportId);
    
    if (!reportData) {
      throw new Error(`Report with ID ${reportId} not found`);
    }
    
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Intellego Platform Instructor Dashboard',
        dataVersion: '1.0.0',
        reportId: reportData.reportMetadata.id
      },
      studentInfo: {
        name: reportData.reportMetadata.student.name,
        email: reportData.reportMetadata.student.email,
        studentId: reportData.reportMetadata.student.studentId,
        academicInfo: {
          sede: reportData.reportMetadata.student.sede,
          year: reportData.reportMetadata.student.academicYear,
          division: reportData.reportMetadata.student.division,
          subjects: reportData.reportMetadata.student.subjects
        }
      },
      reportInfo: {
        subject: reportData.reportMetadata.subject,
        academicPeriod: {
          weekStart: reportData.reportMetadata.weekStart,
          weekEnd: reportData.reportMetadata.weekEnd,
          weekNumber: getWeekNumber(reportData.reportMetadata.weekStart)
        },
        submissionInfo: {
          submittedAt: reportData.reportMetadata.submittedAt,
          submittedDate: new Date(reportData.reportMetadata.submittedAt).toLocaleDateString('es-ES'),
          submittedTime: new Date(reportData.reportMetadata.submittedAt).toLocaleTimeString('es-ES')
        }
      },
      responses: Object.entries(reportData.answers).map(([questionId, answer]) => ({
        questionId,
        questionText: reportData.questions[questionId],
        studentAnswer: answer,
        answerLength: answer.length,
        answerWordCount: answer.split(/\s+/).filter(word => word.length > 0).length
      })),
      analytics: {
        totalQuestions: Object.keys(reportData.answers).length,
        totalAnswers: Object.keys(reportData.answers).length,
        averageAnswerLength: calculateAverageAnswerLength(Object.values(reportData.answers)),
        totalWords: Object.values(reportData.answers)
          .reduce((total, answer) => total + answer.split(/\s+/).filter(word => word.length > 0).length, 0)
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error generating report JSON:', error);
    throw error;
  }
}

/**
 * Generates bulk JSON export for all reports of a specific student in a subject
 */
export async function generateStudentSubjectJSON(userId: string, subject: string): Promise<string> {
  try {
    const student = await findUserById(userId);
    if (!student) {
      throw new Error(`Student with ID ${userId} not found`);
    }
    
    const reports = await getWeeklyReportsByStudent(userId, subject);
    
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Intellego Platform Instructor Dashboard',
        dataVersion: '1.0.0',
        exportType: 'student_subject_bulk'
      },
      studentInfo: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId || '',
        academicInfo: {
          sede: student.sede || '',
          year: student.academicYear || '',
          division: student.division || '',
          subjects: String(student.subjects || '').split(',').map(s => s.trim()).filter(s => s)
        }
      },
      subjectInfo: {
        subject,
        totalReports: reports.length,
        reportPeriod: {
          firstReport: reports.length > 0 ? reports[reports.length - 1].weekStart : null,
          lastReport: reports.length > 0 ? reports[0].weekStart : null
        }
      },
      weeklyReports: reports.map(report => ({
        reportId: report.id,
        week: {
          start: report.weekStart,
          end: report.weekEnd,
          weekNumber: getWeekNumber(report.weekStart)
        },
        submission: {
          submittedAt: report.submittedAt,
          submittedDate: new Date(report.submittedAt).toLocaleDateString('es-ES')
        },
        responses: Object.entries(report.answers).map(([questionId, answer]) => ({
          questionId,
          answer,
          answerLength: answer.length,
          answerWordCount: answer.split(/\s+/).filter(word => word.length > 0).length
        })),
        analytics: {
          questionsAnswered: Object.keys(report.answers).length,
          totalWords: Object.values(report.answers)
            .reduce((total, answer) => total + answer.split(/\s+/).filter(word => word.length > 0).length, 0)
        }
      })),
      overallAnalytics: {
        totalSubmissions: reports.length,
        totalQuestionsAnswered: reports.reduce((total, report) => total + Object.keys(report.answers).length, 0),
        totalWordsWritten: reports.reduce((total, report) => 
          total + Object.values(report.answers)
            .reduce((answerTotal, answer) => answerTotal + answer.split(/\s+/).filter(word => word.length > 0).length, 0), 0),
        averageWordsPerReport: 0 // Will be calculated below
      }
    };
    
    // Calculate average words per report
    if (exportData.overallAnalytics.totalSubmissions > 0) {
      exportData.overallAnalytics.averageWordsPerReport = Math.round(
        exportData.overallAnalytics.totalWordsWritten / exportData.overallAnalytics.totalSubmissions
      );
    }
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error generating student subject JSON:', error);
    throw error;
  }
}

/**
 * Generates complete hierarchical JSON export for instructor dashboard
 */
export async function generateCompleteHierarchicalJSON(): Promise<string> {
  try {
    const hierarchicalData = await buildCompleteHierarchicalData();
    
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Intellego Platform Instructor Dashboard',
        dataVersion: '1.0.0',
        exportType: 'complete_hierarchical',
        structure: 'materias/año/curso/estudiantes/semanas'
      },
      summary: hierarchicalData.summary,
      hierarchicalData: hierarchicalData.subjects
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error generating complete hierarchical JSON:', error);
    throw error;
  }
}

// =====================================================================================
// UTILITY FUNCTIONS FOR JSON EXPORT
// =====================================================================================

/**
 * Calculates the week number for a given date
 */
function getWeekNumber(dateString: string): number {
  const date = new Date(dateString);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

/**
 * Calculates average answer length
 */
function calculateAverageAnswerLength(answers: string[]): number {
  if (answers.length === 0) return 0;
  const totalLength = answers.reduce((sum, answer) => sum + answer.length, 0);
  return Math.round((totalLength / answers.length) * 100) / 100;
}

/**
 * Generates filename for report downloads
 */
export function generateReportFilename(student: HierarchicalStudent, subject: string, weekStart: string, type: 'json' | 'csv' = 'json'): string {
  const date = new Date(weekStart).toISOString().split('T')[0]; // YYYY-MM-DD
  const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
  const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${student.studentId}_${safeName}_${safeSubject}_${date}_reporte.${type}`;
}