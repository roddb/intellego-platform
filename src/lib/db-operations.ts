import bcrypt from 'bcryptjs';
import { db, query } from './db'; // Use the libSQL client
import { toArgentinaDate, toArgentinaTimeOnly, getWeekStartInArgentina, getWeekEndInArgentina, getCurrentArgentinaDate } from './timezone-utils';

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
    
    // Find all existing student IDs for this year and get the highest number
    const result = await query(`
      SELECT studentId FROM User 
      WHERE studentId LIKE ?
    `, [`${prefix}%`]);
    
    let maxNumber = 0;
    
    // Parse all student IDs to find the highest number
    if (result.rows.length > 0) {
      for (const row of result.rows) {
        if (row.studentId) {
          const parts = String(row.studentId).split('-');
          if (parts.length === 3 && parts[0] === 'EST' && parts[1] === String(year)) {
            const number = parseInt(parts[2]);
            if (!isNaN(number) && number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      }
    }
    
    const nextNumber = maxNumber + 1;
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
  // Use the same logic as timezone-utils.ts for consistency
  return getWeekStartInArgentina(new Date());
}

export function getCurrentWeekEnd(): Date {
  // Use the same logic as timezone-utils.ts for consistency
  return getWeekEndInArgentina(new Date());
}

export async function canSubmitThisWeek(userId: string): Promise<boolean> {
  // This function is kept for backward compatibility but deprecated
  // Use canSubmitForSubject instead
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();
  const currentDate = getCurrentArgentinaDate();
  
  const isCurrentWeek = currentDate >= weekStart && currentDate <= weekEnd;
  return isCurrentWeek;
}

// New function to check if user can submit for specific subject
export async function canSubmitForSubject(userId: string, subject: string): Promise<boolean> {
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();
  const currentDate = getCurrentArgentinaDate();
  
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
      SELECT DISTINCT
        pr.id,
        pr.userId,
        pr.subject,
        pr.weekStart,
        pr.weekEnd,
        pr.submittedAt,
        CASE
          WHEN f.id IS NOT NULL THEN 1
          ELSE 0
        END as hasFeedback
      FROM ProgressReport pr
      LEFT JOIN Feedback f ON (
        f.studentId = pr.userId
        AND f.weekStart = substr(pr.weekStart, 1, 10)
        AND f.subject = pr.subject
      )
      WHERE pr.userId = ?
      ORDER BY pr.weekStart DESC
    `, [userId]);

    const reports = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      subject: row.subject,
      weekStart: row.weekStart,
      weekEnd: row.weekEnd,
      submittedAt: row.submittedAt,
      hasFeedback: row.hasFeedback === 1 || row.hasFeedback === true
    }));

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
          submittedDate: toArgentinaDate(reportData.reportMetadata.submittedAt),
          submittedTime: toArgentinaTimeOnly(reportData.reportMetadata.submittedAt)
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
          submittedDate: toArgentinaDate(report.submittedAt)
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

// =====================================================================================
// WEEKLY RANGE REPORTING OPERATIONS
// Functions for querying and organizing reports by week ranges
// =====================================================================================

/**
 * Interface for basic report information with user details
 */
export interface WeekRangeReport {
  id: string;
  userId: string;
  subject: string;
  weekStart: string;
  weekEnd: string;
  submittedAt: string;
  userName: string;
  userEmail: string;
  studentId: string;
  academicYear: string;
  division: string;
  sede: string;
}

/**
 * Interface for weekly download JSON structure
 */
export interface WeeklyDownloadData {
  metadata: {
    weekStart: string;
    weekEnd: string;
    generatedAt: string;
    totalReports: number;
    totalStudents: number;
    completionRate: number;
  };
  summary: {
    bySubject: { [subject: string]: number };
    byYear: { [year: string]: number };
    bySede: { [sede: string]: number };
  };
  hierarchicalData: {
    [year: string]: {
      [subject: string]: {
        [course: string]: {
          students: {
            id: string;
            name: string;
            email: string;
            studentId: string;
            sede: string;
            academicYear: string;
            division: string;
            report?: {
              id: string;
              submittedAt: string;
              answers: { [questionId: string]: string };
            };
          }[];
          reportCount: number;
          studentCount: number;
        };
      };
    };
  };
}

/**
 * Get all progress reports within a specific week range with user information
 * @param weekStart Start date of the week range
 * @param weekEnd End date of the week range
 * @param filters Optional filters for subject, academicYear, division, sede
 * @returns Array of reports with basic info and user details
 */
export async function getReportsByWeekRange(
  weekStart: Date, 
  weekEnd: Date,
  filters?: {
    subject?: string;
    academicYear?: string;
    division?: string;
    sede?: string;
  }
): Promise<WeekRangeReport[]> {
  try {
    const startStr = weekStart.toISOString();
    const endStr = weekEnd.toISOString();
    
    // Build WHERE clause with optional filters
    const whereConditions = [
      '(pr.weekStart <= ? AND pr.weekEnd >= ?)'
    ];
    const queryParams = [endStr, startStr];
    
    if (filters?.subject) {
      whereConditions.push('pr.subject = ?');
      queryParams.push(filters.subject);
    }
    
    if (filters?.academicYear) {
      whereConditions.push('u.academicYear = ?');
      queryParams.push(filters.academicYear);
    }
    
    if (filters?.division) {
      whereConditions.push('u.division = ?');
      queryParams.push(filters.division);
    }
    
    if (filters?.sede) {
      whereConditions.push('u.sede = ?');
      queryParams.push(filters.sede);
    }

    console.log('🔍 Querying reports for week range with filters:', { 
      weekStart: startStr, 
      weekEnd: endStr,
      filters: filters || 'none'
    });

    const result = await query(`
      SELECT 
        pr.id,
        pr.userId,
        pr.subject,
        pr.weekStart,
        pr.weekEnd,
        pr.submittedAt,
        u.name as userName,
        u.email as userEmail,
        u.studentId,
        u.academicYear,
        u.division,
        u.sede
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY pr.weekStart DESC, u.academicYear, pr.subject, u.division, u.name
    `, queryParams);
    
    console.log('✅ Found', result.rows.length, 'reports in week range');
    
    return result.rows.map(row => ({
      id: String(row.id),
      userId: String(row.userId),
      subject: String(row.subject),
      weekStart: String(row.weekStart),
      weekEnd: String(row.weekEnd),
      submittedAt: String(row.submittedAt),
      userName: String(row.userName),
      userEmail: String(row.userEmail),
      studentId: String(row.studentId || ''),
      academicYear: String(row.academicYear || ''),
      division: String(row.division || ''),
      sede: String(row.sede || '')
    }));
  } catch (error) {
    console.error('Error getting reports by week range:', error);
    throw error;
  }
}

/**
 * Get all reports for a week organized hierarchically by Year → Subject → Course → Students
 * @param weekStart Start date of the week
 * @param weekEnd End date of the week
 * @param filters Optional filters for subject, academicYear, division, sede
 * @returns Hierarchical organization with aggregated statistics
 */
export async function getHierarchicalReportsByWeek(
  weekStart: Date, 
  weekEnd: Date,
  filters?: {
    subject?: string;
    academicYear?: string;
    division?: string;
    sede?: string;
  }
): Promise<{
  data: HierarchicalInstructorData;
  weekMetadata: {
    weekStart: string;
    weekEnd: string;
    totalReports: number;
    totalStudents: number;
    completionRate: number;
  };
}> {
  try {
    console.log('🔍 Building hierarchical reports for week:', { weekStart, weekEnd, filters: filters || 'none' });
    
    // Get all reports for the week with filters
    const reports = await getReportsByWeekRange(weekStart, weekEnd, filters);
    
    // Get all unique students who could have submitted in this week (with filters)
    // This helps calculate completion rate accurately
    const studentWhereConditions = [
      "u.role = 'STUDENT'",
      "u.status = 'ACTIVE'"
    ];
    const studentQueryParams: string[] = [];
    
    if (filters?.academicYear) {
      studentWhereConditions.push('u.academicYear = ?');
      studentQueryParams.push(filters.academicYear);
    }
    
    if (filters?.division) {
      studentWhereConditions.push('u.division = ?');
      studentQueryParams.push(filters.division);
    }
    
    if (filters?.sede) {
      studentWhereConditions.push('u.sede = ?');
      studentQueryParams.push(filters.sede);
    }
    
    // For subject filtering, we need to check if the subject is in the student's subjects JSON
    if (filters?.subject) {
      studentWhereConditions.push("(u.subjects LIKE ? OR u.subjects IS NULL)");
      studentQueryParams.push(`%"${filters.subject}"%`);
    }

    const allStudentsResult = await query(`
      SELECT DISTINCT u.id, u.academicYear, u.division, u.sede, u.subjects
      FROM User u
      WHERE ${studentWhereConditions.join(' AND ')}
    `, studentQueryParams);
    
    const hierarchicalData: HierarchicalInstructorData = {
      subjects: {},
      summary: {
        totalSubjects: 0,
        totalStudents: 0,
        totalReports: reports.length,
        totalYears: 0,
        totalCourses: 0
      }
    };
    
    // Build hierarchical structure
    const processedStudents = new Set<string>();
    
    for (const report of reports) {
      const { subject, academicYear, division } = report;
      
      // Initialize subject if not exists
      if (!hierarchicalData.subjects[subject]) {
        hierarchicalData.subjects[subject] = {
          subject,
          years: {},
          totalStudents: 0,
          totalReports: 0
        };
      }
      
      // Initialize year if not exists
      if (!hierarchicalData.subjects[subject].years[academicYear]) {
        hierarchicalData.subjects[subject].years[academicYear] = {
          academicYear,
          courses: {},
          studentCount: 0,
          totalReports: 0
        };
      }
      
      // Initialize course if not exists
      if (!hierarchicalData.subjects[subject].years[academicYear].courses[division]) {
        hierarchicalData.subjects[subject].years[academicYear].courses[division] = {
          division,
          studentCount: 0,
          students: [],
          totalReports: 0
        };
      }
      
      const course = hierarchicalData.subjects[subject].years[academicYear].courses[division];
      
      // Check if student already exists in this course
      let student = course.students.find(s => s.id === report.userId);
      if (!student) {
        const newStudent: HierarchicalStudentWithReports = {
          id: report.userId,
          name: report.userName,
          email: report.userEmail,
          studentId: report.studentId,
          sede: report.sede,
          academicYear: report.academicYear,
          division: report.division,
          subjects: [], // Will be populated if needed
          reportCount: 0,
          weeklyReports: [], // Initialize empty reports array
          completedWeeks: 0   // Initialize completed weeks
        };
        course.students.push(newStudent);
        course.studentCount++;
        processedStudents.add(report.userId);
        student = newStudent;
      }
      
      student.reportCount++;
      student.completedWeeks++; // Update completed weeks for consistency
      course.totalReports++;
      hierarchicalData.subjects[subject].years[academicYear].totalReports++;
      hierarchicalData.subjects[subject].totalReports++;
    }
    
    // Calculate summary statistics
    hierarchicalData.summary.totalSubjects = Object.keys(hierarchicalData.subjects).length;
    hierarchicalData.summary.totalStudents = processedStudents.size;
    
    let totalYears = 0;
    let totalCourses = 0;
    
    for (const subject of Object.values(hierarchicalData.subjects)) {
      const yearsCount = Object.keys(subject.years).length;
      totalYears += yearsCount;
      
      for (const year of Object.values(subject.years)) {
        totalCourses += Object.keys(year.courses).length;
        subject.totalStudents += year.studentCount;
      }
    }
    
    hierarchicalData.summary.totalYears = totalYears;
    hierarchicalData.summary.totalCourses = totalCourses;
    
    // Calculate completion rate (reports vs potential reports)
    const totalPotentialReports = allStudentsResult.rows.length; // Simplified - could be more complex
    const completionRate = totalPotentialReports > 0 
      ? Math.round((reports.length / totalPotentialReports) * 100) 
      : 0;
    
    const weekMetadata = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalReports: reports.length,
      totalStudents: processedStudents.size,
      completionRate
    };
    
    console.log('✅ Built hierarchical data:', {
      subjects: hierarchicalData.summary.totalSubjects,
      students: hierarchicalData.summary.totalStudents,
      reports: hierarchicalData.summary.totalReports,
      completionRate
    });
    
    return {
      data: hierarchicalData,
      weekMetadata
    };
  } catch (error) {
    console.error('Error getting hierarchical reports by week:', error);
    throw error;
  }
}

/**
 * Generate a complete JSON export for a specific week with full hierarchical organization
 * @param weekStart Start date of the week
 * @param weekEnd End date of the week
 * @param filters Optional filters for subject, academicYear, division, sede
 * @returns Complete JSON export string
 */
export async function generateWeeklyDownloadJSON(
  weekStart: Date, 
  weekEnd: Date,
  filters?: {
    subject?: string;
    academicYear?: string;
    division?: string;
    sede?: string;
  }
): Promise<string> {
  try {
    console.log('🔍 Generating weekly download JSON for:', { weekStart, weekEnd });
    
    // Get hierarchical data
    const { data: hierarchicalData, weekMetadata } = await getHierarchicalReportsByWeek(weekStart, weekEnd, filters);
    
    // Get all reports with answers for detailed export
    const reports = await getReportsByWeekRange(weekStart, weekEnd, filters);
    
    // Build the download structure
    const downloadData: WeeklyDownloadData = {
      metadata: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        generatedAt: new Date().toISOString(),
        totalReports: weekMetadata.totalReports,
        totalStudents: weekMetadata.totalStudents,
        completionRate: weekMetadata.completionRate
      },
      summary: {
        bySubject: {},
        byYear: {},
        bySede: {}
      },
      hierarchicalData: {}
    };
    
    // Calculate summary statistics
    for (const report of reports) {
      // By subject
      downloadData.summary.bySubject[report.subject] = 
        (downloadData.summary.bySubject[report.subject] || 0) + 1;
      
      // By year
      downloadData.summary.byYear[report.academicYear] = 
        (downloadData.summary.byYear[report.academicYear] || 0) + 1;
      
      // By sede
      downloadData.summary.bySede[report.sede] = 
        (downloadData.summary.bySede[report.sede] || 0) + 1;
    }
    
    // Build hierarchical data with answers
    for (const [subjectName, subject] of Object.entries(hierarchicalData.subjects)) {
      for (const [yearName, year] of Object.entries(subject.years)) {
        if (!downloadData.hierarchicalData[yearName]) {
          downloadData.hierarchicalData[yearName] = {};
        }
        
        if (!downloadData.hierarchicalData[yearName][subjectName]) {
          downloadData.hierarchicalData[yearName][subjectName] = {};
        }
        
        for (const [courseName, course] of Object.entries(year.courses)) {
          downloadData.hierarchicalData[yearName][subjectName][courseName] = {
            students: [],
            reportCount: course.totalReports,
            studentCount: course.studentCount
          };
          
          // Add student data with their reports and answers
          for (const student of course.students) {
            // Find the student's report for this week and subject
            const studentReport = reports.find(r => 
              r.userId === student.id && r.subject === subjectName
            );
            
            const studentData: any = {
              id: student.id,
              name: student.name,
              email: student.email,
              studentId: student.studentId,
              sede: student.sede,
              academicYear: student.academicYear,
              division: student.division
            };
            
            if (studentReport) {
              // Get answers for this report
              const answersResult = await query(`
                SELECT questionId, answer
                FROM Answer
                WHERE progressReportId = ?
                ORDER BY questionId
              `, [studentReport.id]);
              
              const answers: { [questionId: string]: string } = {};
              for (const answerRow of answersResult.rows) {
                answers[String(answerRow.questionId)] = String(answerRow.answer);
              }
              
              studentData.report = {
                id: studentReport.id,
                submittedAt: studentReport.submittedAt,
                answers
              };
            }
            
            downloadData.hierarchicalData[yearName][subjectName][courseName].students.push(studentData);
          }
        }
      }
    }
    
    console.log('✅ Generated weekly download JSON with', Object.keys(downloadData.hierarchicalData).length, 'years');
    
    return JSON.stringify(downloadData, null, 2);
  } catch (error) {
    console.error('Error generating weekly download JSON:', error);
    throw error;
  }
}

// Database Export Function for Structured Folder Export
export async function generateDatabaseExportStructure(): Promise<{ files: Array<{ path: string; content: string }>, metadata: any }> {
  try {
    console.log('📊 Starting structured database export...');
    
    // Get all users with their academic information
    const usersResult = await query(`
      SELECT id, name, email, role, studentId, sede, academicYear, division, subjects, status, createdAt
      FROM User
      WHERE role = 'STUDENT' AND status = 'ACTIVE'
      ORDER BY sede, academicYear, division, name
    `);
    
    // Get all progress reports
    const reportsResult = await query(`
      SELECT id, userId, subject, weekStart, weekEnd, submittedAt
      FROM ProgressReport
      ORDER BY weekStart ASC
    `);
    
    // Get all answers
    const answersResult = await query(`
      SELECT progressReportId, questionId, answer
      FROM Answer
      ORDER BY progressReportId, questionId
    `);
    
    // Create answer lookup map
    const answersByReport: { [reportId: string]: { [questionId: string]: string } } = {};
    for (const answer of answersResult.rows) {
      const reportId = String(answer.progressReportId);
      const questionId = String(answer.questionId);
      
      if (!answersByReport[reportId]) {
        answersByReport[reportId] = {};
      }
      answersByReport[reportId][questionId] = String(answer.answer);
    }
    
    // Files array for the export structure
    const files: Array<{ path: string; content: string }> = [];
    let totalStudents = 0;
    let totalReports = 0;
    let totalFiles = 0;
    
    // Academic cycle start date (Monday, July 28, 2025, 00:00 Argentina time = 03:00 UTC)
    const CYCLE_START_DATE = new Date('2025-07-28T03:00:00.000Z');
    
    // Create a map to track week numbers based on academic calendar
    const weekNumberMap = new Map<string, number>();
    
    // Calculate week numbers based on cycle start date
    for (const report of reportsResult.rows) {
      const weekKey = `${report.weekStart}_${report.weekEnd}`;
      
      if (!weekNumberMap.has(weekKey)) {
        const weekStart = new Date(String(report.weekStart));
        const diffInMs = weekStart.getTime() - CYCLE_START_DATE.getTime();
        const diffInWeeks = Math.floor(diffInMs / (7 * 24 * 60 * 60 * 1000));
        // Ensure minimum week number is 1
        const weekNumber = Math.max(1, diffInWeeks + 1);
        weekNumberMap.set(weekKey, weekNumber);
      }
    }
    
    // Process each student
    for (const user of usersResult.rows) {
      const userName = String(user.name);
      const userId = String(user.id);
      const sede = String(user.sede || 'Sin_Sede').replace(/\s+/g, '_');
      const academicYear = String(user.academicYear || 'Sin_Año').replace(/\s+/g, '_');
      const division = String(user.division || 'Sin_División').replace(/\s+/g, '_');
      const subjects = String(user.subjects || '').split(',').map(s => s.trim()).filter(s => s);
      
      totalStudents++;
      
      // Process each subject for this student
      for (const subject of subjects) {
        const subjectFolder = subject.replace(/\s+/g, '_');
        const studentFolder = userName.replace(/\s+/g, '_');
        
        // Get all reports for this student and subject
        const studentReports = reportsResult.rows.filter(r => 
          String(r.userId) === userId && String(r.subject) === subject
        );
        
        // Create a JSON file for each week's report
        for (const report of studentReports) {
          const weekKey = `${report.weekStart}_${report.weekEnd}`;
          const weekNumber = weekNumberMap.get(weekKey) || 0;
          
          // Build the file path
          const filePath = `${sede}/${academicYear}/${subjectFolder}/${studentFolder}/semana_${weekNumber}.json`;
          
          // Create the content for this week
          const fileContent = {
            studentInfo: {
              name: userName,
              studentId: String(user.studentId),
              email: String(user.email),
              sede: String(user.sede),
              año: String(user.academicYear),
              materia: subject,
              division: String(user.division)
            },
            weekInfo: {
              semana: weekNumber,
              weekStart: toArgentinaDate(String(report.weekStart)),
              weekEnd: toArgentinaDate(String(report.weekEnd)),
              submittedAt: toArgentinaDate(String(report.submittedAt)) + ' ' + toArgentinaTimeOnly(String(report.submittedAt))
            },
            answers: answersByReport[String(report.id)] || {}
          };
          
          files.push({
            path: filePath,
            content: JSON.stringify(fileContent, null, 2)
          });
          
          totalReports++;
          totalFiles++;
        }
      }
    }
    
    // Create metadata
    const metadata = {
      exportDate: toArgentinaDate(new Date().toISOString()),
      exportTime: toArgentinaTimeOnly(new Date().toISOString()),
      version: '2.0',
      platform: 'Intellego Platform',
      exportType: 'structured_folder',
      totalStudents,
      totalReports,
      totalFiles,
      structure: 'sede/año/materia/alumno/semana_X.json'
    };
    
    console.log('✅ Structured export completed:', {
      students: totalStudents,
      reports: totalReports,
      files: totalFiles
    });
    
    return { files, metadata };
  } catch (error) {
    console.error('❌ Error generating structured export:', error);
    throw new Error('Failed to generate structured export');
  }
}

// Helper function to count students in a sede structure
function countStudentsInSede(sedeData: any): number {
  let count = 0;
  for (const subject of Object.values(sedeData)) {
    for (const year of Object.values(subject as any)) {
      for (const division of Object.values(year as any)) {
        count += Object.keys(division as any).length;
      }
    }
  }
  return count;
}

// =====================================================================================
// PASSWORD MANAGEMENT & AUDIT OPERATIONS
// Comprehensive password change tracking and security audit functions
// =====================================================================================

/**
 * Password audit action types
 */
export type PasswordActionType = 'CHANGE' | 'RESET' | 'ADMIN_RESET' | 'FORCE_CHANGE';

/**
 * Who initiated the password action
 */
export type ActionInitiator = 'USER' | 'ADMIN' | 'SYSTEM';

/**
 * Password audit entry interface
 */
export interface PasswordAuditEntry {
  id: string;
  userId: string;
  actionType: PasswordActionType;
  actionInitiatedBy: ActionInitiator;
  adminUserId?: string;
  previousPasswordHash?: string;
  newPasswordHash: string;
  changeReason?: string;
  securityContext: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    location?: string;
    deviceInfo?: string;
  };
  isSuccessful: boolean;
  errorMessage?: string;
  passwordStrengthScore?: number;
  complianceFlags: {
    meetsMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    notRecentlyUsed: boolean;
    entropyScore: number;
  };
  notificationSent: boolean;
  createdAt: string;
}

/**
 * Password policy configuration
 */
export interface PasswordPolicy {
  id: string;
  policyName: string;
  description?: string;
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  allowedSpecialChars: string;
  preventReuse: number;
  expirationDays?: number;
  lockoutAttempts: number;
  lockoutDuration: number;
  isActive: boolean;
  appliesTo: string;
}

/**
 * Logs a password audit entry with comprehensive security context
 */
export async function logPasswordAudit(auditData: {
  userId: string;
  actionType: PasswordActionType;
  actionInitiatedBy: ActionInitiator;
  adminUserId?: string;
  previousPasswordHash?: string;
  newPasswordHash: string;
  changeReason?: string;
  securityContext: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    location?: string;
    deviceInfo?: string;
  };
  isSuccessful?: boolean;
  errorMessage?: string;
  passwordStrengthScore?: number;
  complianceFlags?: {
    meetsMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    notRecentlyUsed: boolean;
    entropyScore: number;
  };
  notificationSent?: boolean;
}): Promise<string> {
  try {
    const auditId = generateId();
    const now = new Date().toISOString();
    
    // Set defaults
    const isSuccessful = auditData.isSuccessful ?? true;
    const notificationSent = auditData.notificationSent ?? false;
    const passwordStrengthScore = auditData.passwordStrengthScore ?? calculatePasswordStrength(auditData.newPasswordHash);
    
    // Default compliance flags if not provided
    const defaultComplianceFlags = {
      meetsMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumbers: true,
      hasSpecialChars: true,
      notRecentlyUsed: true,
      entropyScore: passwordStrengthScore
    };
    const complianceFlags = auditData.complianceFlags ?? defaultComplianceFlags;
    
    await query(`
      INSERT INTO PasswordAudit (
        id, userId, actionType, actionInitiatedBy, adminUserId,
        previousPasswordHash, newPasswordHash, changeReason,
        securityContext, ipAddress, userAgent, sessionId,
        isSuccessful, errorMessage, passwordStrengthScore,
        complianceFlags, notificationSent, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      auditId,
      auditData.userId,
      auditData.actionType,
      auditData.actionInitiatedBy,
      auditData.adminUserId || null,
      auditData.previousPasswordHash || null,
      auditData.newPasswordHash,
      auditData.changeReason || null,
      JSON.stringify(auditData.securityContext),
      auditData.securityContext.ipAddress || null,
      auditData.securityContext.userAgent || null,
      auditData.securityContext.sessionId || null,
      isSuccessful ? 1 : 0,
      auditData.errorMessage || null,
      passwordStrengthScore,
      JSON.stringify(complianceFlags),
      notificationSent ? 1 : 0,
      now
    ]);
    
    console.log(`🔐 Password audit logged: ${auditData.actionType} for user ${auditData.userId}`);
    return auditId;
  } catch (error) {
    console.error('Error logging password audit:', error);
    throw error;
  }
}

/**
 * Updates user password with comprehensive audit logging
 */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  securityContext: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  },
  changeReason?: string
): Promise<{ success: boolean; message: string; auditId?: string }> {
  try {
    // Verify current password
    const user = await findUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, String(user.password));
    if (!isCurrentPasswordValid) {
      // Log failed attempt
      const auditId = await logPasswordAudit({
        userId,
        actionType: 'CHANGE',
        actionInitiatedBy: 'USER',
        previousPasswordHash: String(user.password),
        newPasswordHash: '', // Empty for failed attempts
        changeReason: changeReason || 'User-initiated password change',
        securityContext,
        isSuccessful: false,
        errorMessage: 'Invalid current password provided'
      });
      
      return { 
        success: false, 
        message: 'Current password is incorrect', 
        auditId 
      };
    }
    
    // Validate new password against policy
    const policy = await getActivePasswordPolicy();
    const validationResult = validatePasswordAgainstPolicy(newPassword, policy);
    
    if (!validationResult.isValid) {
      // Log validation failure
      const auditId = await logPasswordAudit({
        userId,
        actionType: 'CHANGE',
        actionInitiatedBy: 'USER',
        previousPasswordHash: String(user.password),
        newPasswordHash: '', // Empty for failed attempts
        changeReason: changeReason || 'User-initiated password change',
        securityContext,
        isSuccessful: false,
        errorMessage: `Password validation failed: ${validationResult.errors.join(', ')}`,
        complianceFlags: validationResult.complianceFlags
      });
      
      return { 
        success: false, 
        message: `Password does not meet requirements: ${validationResult.errors.join(', ')}`,
        auditId 
      };
    }
    
    // Check for password reuse
    const isReused = await checkPasswordReuse(userId, newPassword, policy.preventReuse);
    if (isReused) {
      const auditId = await logPasswordAudit({
        userId,
        actionType: 'CHANGE',
        actionInitiatedBy: 'USER',
        previousPasswordHash: String(user.password),
        newPasswordHash: '', // Empty for failed attempts
        changeReason: changeReason || 'User-initiated password change',
        securityContext,
        isSuccessful: false,
        errorMessage: `Password was recently used. Cannot reuse last ${policy.preventReuse} passwords.`,
        complianceFlags: { ...validationResult.complianceFlags, notRecentlyUsed: false }
      });
      
      return { 
        success: false, 
        message: `Password was recently used. Please choose a different password.`,
        auditId 
      };
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const now = new Date().toISOString();
    
    // Update user password
    await query(`
      UPDATE User 
      SET password = ?, updatedAt = ?
      WHERE id = ?
    `, [hashedPassword, now, userId]);
    
    // Log successful password change
    const auditId = await logPasswordAudit({
      userId,
      actionType: 'CHANGE',
      actionInitiatedBy: 'USER',
      previousPasswordHash: String(user.password),
      newPasswordHash: hashedPassword,
      changeReason: changeReason || 'User-initiated password change',
      securityContext,
      isSuccessful: true,
      passwordStrengthScore: validationResult.strengthScore,
      complianceFlags: validationResult.complianceFlags
    });
    
    return { 
      success: true, 
      message: 'Password changed successfully', 
      auditId 
    };
    
  } catch (error) {
    console.error('Error changing user password:', error);
    
    // Log system error
    try {
      const auditId = await logPasswordAudit({
        userId,
        actionType: 'CHANGE',
        actionInitiatedBy: 'USER',
        previousPasswordHash: '',
        newPasswordHash: '',
        changeReason: changeReason || 'User-initiated password change',
        securityContext,
        isSuccessful: false,
        errorMessage: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      return { 
        success: false, 
        message: 'An error occurred while changing password', 
        auditId 
      };
    } catch (auditError) {
      console.error('Error logging password audit:', auditError);
      return { 
        success: false, 
        message: 'An error occurred while changing password' 
      };
    }
  }
}

/**
 * Admin-initiated password reset with comprehensive audit logging
 */
export async function adminResetPassword(
  adminUserId: string,
  targetUserId: string,
  newPassword: string,
  securityContext: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  },
  resetReason: string
): Promise<{ success: boolean; message: string; auditId?: string }> {
  try {
    // Verify admin permissions
    const admin = await findUserById(adminUserId);
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'INSTRUCTOR')) {
      return { success: false, message: 'Insufficient permissions for password reset' };
    }
    
    // Get target user
    const targetUser = await findUserById(targetUserId);
    if (!targetUser) {
      return { success: false, message: 'Target user not found' };
    }
    
    // Validate new password against policy
    const policy = await getActivePasswordPolicy();
    const validationResult = validatePasswordAgainstPolicy(newPassword, policy);
    
    if (!validationResult.isValid) {
      const auditId = await logPasswordAudit({
        userId: targetUserId,
        actionType: 'ADMIN_RESET',
        actionInitiatedBy: 'ADMIN',
        adminUserId,
        previousPasswordHash: String(targetUser.password),
        newPasswordHash: '',
        changeReason: resetReason,
        securityContext,
        isSuccessful: false,
        errorMessage: `Password validation failed: ${validationResult.errors.join(', ')}`,
        complianceFlags: validationResult.complianceFlags
      });
      
      return { 
        success: false, 
        message: `Password does not meet requirements: ${validationResult.errors.join(', ')}`,
        auditId 
      };
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const now = new Date().toISOString();
    
    // Update target user password
    await query(`
      UPDATE User 
      SET password = ?, updatedAt = ?
      WHERE id = ?
    `, [hashedPassword, now, targetUserId]);
    
    // Log successful admin password reset
    const auditId = await logPasswordAudit({
      userId: targetUserId,
      actionType: 'ADMIN_RESET',
      actionInitiatedBy: 'ADMIN',
      adminUserId,
      previousPasswordHash: String(targetUser.password),
      newPasswordHash: hashedPassword,
      changeReason: resetReason,
      securityContext,
      isSuccessful: true,
      passwordStrengthScore: validationResult.strengthScore,
      complianceFlags: validationResult.complianceFlags
    });
    
    return { 
      success: true, 
      message: 'Password reset successfully', 
      auditId 
    };
    
  } catch (error) {
    console.error('Error resetting password:', error);
    
    // Log system error
    try {
      const auditId = await logPasswordAudit({
        userId: targetUserId,
        actionType: 'ADMIN_RESET',
        actionInitiatedBy: 'ADMIN',
        adminUserId,
        previousPasswordHash: '',
        newPasswordHash: '',
        changeReason: resetReason,
        securityContext,
        isSuccessful: false,
        errorMessage: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      return { 
        success: false, 
        message: 'An error occurred while resetting password', 
        auditId 
      };
    } catch (auditError) {
      console.error('Error logging password audit:', auditError);
      return { 
        success: false, 
        message: 'An error occurred while resetting password' 
      };
    }
  }
}

/**
 * Gets password audit history for a user
 */
export async function getUserPasswordAuditHistory(
  userId: string, 
  limit: number = 50,
  offset: number = 0
): Promise<PasswordAuditEntry[]> {
  try {
    const result = await query(`
      SELECT 
        pa.*,
        u.name as adminName
      FROM PasswordAudit pa
      LEFT JOIN User u ON pa.adminUserId = u.id
      WHERE pa.userId = ?
      ORDER BY pa.createdAt DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    return result.rows.map(row => ({
      id: String(row.id),
      userId: String(row.userId),
      actionType: String(row.actionType) as PasswordActionType,
      actionInitiatedBy: String(row.actionInitiatedBy) as ActionInitiator,
      adminUserId: row.adminUserId ? String(row.adminUserId) : undefined,
      previousPasswordHash: row.previousPasswordHash ? String(row.previousPasswordHash) : undefined,
      newPasswordHash: String(row.newPasswordHash),
      changeReason: row.changeReason ? String(row.changeReason) : undefined,
      securityContext: JSON.parse(String(row.securityContext || '{}')),
      isSuccessful: Boolean(row.isSuccessful),
      errorMessage: row.errorMessage ? String(row.errorMessage) : undefined,
      passwordStrengthScore: row.passwordStrengthScore ? Number(row.passwordStrengthScore) : undefined,
      complianceFlags: JSON.parse(String(row.complianceFlags || '{}')),
      notificationSent: Boolean(row.notificationSent),
      createdAt: String(row.createdAt)
    }));
  } catch (error) {
    console.error('Error getting user password audit history:', error);
    throw error;
  }
}

/**
 * Gets system-wide password audit statistics
 */
export async function getPasswordAuditStatistics(
  startDate?: string,
  endDate?: string
): Promise<{
  totalPasswordChanges: number;
  successfulChanges: number;
  failedChanges: number;
  userInitiated: number;
  adminInitiated: number;
  systemInitiated: number;
  averagePasswordStrength: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
}> {
  try {
    let whereClause = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      whereClause = 'WHERE pa.createdAt BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      whereClause = 'WHERE pa.createdAt >= ?';
      params.push(startDate);
    } else if (endDate) {
      whereClause = 'WHERE pa.createdAt <= ?';
      params.push(endDate);
    }
    
    // Get overall statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as totalPasswordChanges,
        SUM(CASE WHEN isSuccessful = 1 THEN 1 ELSE 0 END) as successfulChanges,
        SUM(CASE WHEN isSuccessful = 0 THEN 1 ELSE 0 END) as failedChanges,
        SUM(CASE WHEN actionInitiatedBy = 'USER' THEN 1 ELSE 0 END) as userInitiated,
        SUM(CASE WHEN actionInitiatedBy = 'ADMIN' THEN 1 ELSE 0 END) as adminInitiated,
        SUM(CASE WHEN actionInitiatedBy = 'SYSTEM' THEN 1 ELSE 0 END) as systemInitiated,
        AVG(CASE WHEN passwordStrengthScore IS NOT NULL THEN passwordStrengthScore ELSE 0 END) as averagePasswordStrength
      FROM PasswordAudit pa
      ${whereClause}
    `, params);
    
    // Get top failure reasons
    const failureReasonsResult = await query(`
      SELECT 
        errorMessage as reason,
        COUNT(*) as count
      FROM PasswordAudit pa
      ${whereClause ? whereClause + ' AND' : 'WHERE'} isSuccessful = 0 
      AND errorMessage IS NOT NULL
      GROUP BY errorMessage
      ORDER BY count DESC
      LIMIT 10
    `, params);
    
    const stats = statsResult.rows[0];
    
    return {
      totalPasswordChanges: Number(stats.totalPasswordChanges || 0),
      successfulChanges: Number(stats.successfulChanges || 0),
      failedChanges: Number(stats.failedChanges || 0),
      userInitiated: Number(stats.userInitiated || 0),
      adminInitiated: Number(stats.adminInitiated || 0),
      systemInitiated: Number(stats.systemInitiated || 0),
      averagePasswordStrength: Math.round(Number(stats.averagePasswordStrength || 0) * 100) / 100,
      topFailureReasons: failureReasonsResult.rows.map(row => ({
        reason: String(row.reason),
        count: Number(row.count)
      }))
    };
  } catch (error) {
    console.error('Error getting password audit statistics:', error);
    throw error;
  }
}

/**
 * Gets active password policy
 */
export async function getActivePasswordPolicy(): Promise<PasswordPolicy> {
  try {
    const result = await query(`
      SELECT * FROM PasswordPolicy
      WHERE isActive = 1
      ORDER BY createdAt DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      // Return default policy if none found
      return {
        id: 'default',
        policyName: 'default_policy',
        description: 'Default password policy',
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        preventReuse: 5,
        expirationDays: undefined,
        lockoutAttempts: 5,
        lockoutDuration: 1800,
        isActive: true,
        appliesTo: 'ALL'
      };
    }
    
    const row = result.rows[0];
    return {
      id: String(row.id),
      policyName: String(row.policyName),
      description: row.description ? String(row.description) : undefined,
      minLength: Number(row.minLength),
      maxLength: Number(row.maxLength),
      requireUppercase: Boolean(row.requireUppercase),
      requireLowercase: Boolean(row.requireLowercase),
      requireNumbers: Boolean(row.requireNumbers),
      requireSpecialChars: Boolean(row.requireSpecialChars),
      allowedSpecialChars: String(row.allowedSpecialChars),
      preventReuse: Number(row.preventReuse),
      expirationDays: row.expirationDays ? Number(row.expirationDays) : undefined,
      lockoutAttempts: Number(row.lockoutAttempts),
      lockoutDuration: Number(row.lockoutDuration),
      isActive: Boolean(row.isActive),
      appliesTo: String(row.appliesTo)
    };
  } catch (error) {
    console.error('Error getting active password policy:', error);
    throw error;
  }
}

/**
 * Validates password against policy requirements
 */
export function validatePasswordAgainstPolicy(
  password: string, 
  policy: PasswordPolicy
): {
  isValid: boolean;
  errors: string[];
  strengthScore: number;
  complianceFlags: {
    meetsMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    notRecentlyUsed: boolean;
    entropyScore: number;
  };
} {
  const errors: string[] = [];
  const complianceFlags = {
    meetsMinLength: password.length >= policy.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: new RegExp(`[${policy.allowedSpecialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password),
    notRecentlyUsed: true, // This will be checked separately
    entropyScore: calculatePasswordEntropy(password)
  };
  
  // Check length
  if (!complianceFlags.meetsMinLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  if (password.length > policy.maxLength) {
    errors.push(`Password must be no more than ${policy.maxLength} characters long`);
  }
  
  // Check character requirements
  if (policy.requireUppercase && !complianceFlags.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (policy.requireLowercase && !complianceFlags.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (policy.requireNumbers && !complianceFlags.hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (policy.requireSpecialChars && !complianceFlags.hasSpecialChars) {
    errors.push(`Password must contain at least one special character (${policy.allowedSpecialChars})`);
  }
  
  const strengthScore = calculatePasswordStrength(password);
  
  return {
    isValid: errors.length === 0,
    errors,
    strengthScore,
    complianceFlags
  };
}

/**
 * Checks if password was recently used
 */
export async function checkPasswordReuse(
  userId: string,
  newPassword: string,
  preventReuseCount: number
): Promise<boolean> {
  try {
    if (preventReuseCount <= 0) return false;
    
    const result = await query(`
      SELECT newPasswordHash
      FROM PasswordAudit
      WHERE userId = ? AND isSuccessful = 1
      ORDER BY createdAt DESC
      LIMIT ?
    `, [userId, preventReuseCount]);
    
    for (const row of result.rows) {
      const isReused = await bcrypt.compare(newPassword, String(row.newPasswordHash));
      if (isReused) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking password reuse:', error);
    // In case of error, allow the password to be safe
    return false;
  }
}

/**
 * Calculates password strength score (1-5)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  // Length score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety score
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/\d/.test(password)) score += 0.5;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 0.5;
  
  // Entropy bonus
  const entropy = calculatePasswordEntropy(password);
  if (entropy >= 30) score += 0.5;
  if (entropy >= 50) score += 0.5;
  
  return Math.min(5, Math.max(1, Math.round(score)));
}

/**
 * Calculates password entropy
 */
export function calculatePasswordEntropy(password: string): number {
  const charset = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
  };
  
  let possibleChars = 0;
  if (charset.lowercase) possibleChars += 26;
  if (charset.uppercase) possibleChars += 26;
  if (charset.numbers) possibleChars += 10;
  if (charset.special) possibleChars += 32;
  
  return Math.log2(Math.pow(possibleChars, password.length));
}

// ============================================
// FEEDBACK OPERATIONS
// ============================================

interface FeedbackData {
  id?: string;
  studentId: string;
  progressReportId?: string;
  weekStart: string;
  subject: string;
  score?: number;
  generalComments?: string;
  strengths?: string[];
  improvements?: string[];
  aiAnalysis?: string;
  createdBy: string;
}

/**
 * Create a new feedback entry
 */
export async function createFeedback(data: FeedbackData): Promise<string> {
  try {
    const id = generateId();
    const now = new Date().toISOString();
    
    await query(`
      INSERT INTO Feedback (
        id, studentId, progressReportId, weekStart, subject,
        score, generalComments, strengths, improvements, aiAnalysis,
        createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.studentId,
      data.progressReportId || null,
      data.weekStart,
      data.subject,
      data.score || null,
      data.generalComments || null,
      JSON.stringify(data.strengths || []),
      JSON.stringify(data.improvements || []),
      data.aiAnalysis || null,
      data.createdBy,
      now,
      now
    ]);
    
    return id;
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }
}

/**
 * Get feedback for a specific student, week, and subject
 */
export async function getFeedbackByWeek(
  studentId: string, 
  weekStart: string, 
  subject: string
): Promise<any | null> {
  try {
    // First try with the provided studentId
    // Match feedback within the same week (Monday to Sunday)
    let result = await query(`
      SELECT 
        f.*,
        u.name as instructorName,
        u.email as instructorEmail
      FROM Feedback f
      JOIN User u ON f.createdBy = u.id
      WHERE f.studentId = ? 
        AND date(f.weekStart) >= date(?) 
        AND date(f.weekStart) < date(?, '+7 days')
        AND f.subject = ?
      LIMIT 1
    `, [studentId, weekStart, weekStart, subject]);
    
    // If no feedback found and this looks like a studentId, try with userId
    if (result.rows.length === 0 && studentId.startsWith('EST-')) {
      // Try to find the user ID for this student
      const userResult = await query(`
        SELECT id FROM User WHERE studentId = ?
      `, [studentId]);
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        result = await query(`
          SELECT 
            f.*,
            u.name as instructorName,
            u.email as instructorEmail
          FROM Feedback f
          JOIN User u ON f.createdBy = u.id
          WHERE f.studentId = ? 
            AND date(f.weekStart) >= date(?) 
            AND date(f.weekStart) < date(?, '+7 days')
            AND f.subject = ?
          LIMIT 1
        `, [userId, weekStart, weekStart, subject]);
      }
    }
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const feedback = result.rows[0] as any;
    
    // Parse JSON fields
    return {
      ...feedback,
      strengths: feedback.strengths ? JSON.parse(feedback.strengths) : [],
      improvements: feedback.improvements ? JSON.parse(feedback.improvements) : [],
      skillsMetrics: feedback.skillsMetrics ? JSON.parse(feedback.skillsMetrics) : null
    };
  } catch (error) {
    console.error('Error getting feedback by week:', error);
    throw error;
  }
}

/**
 * Get all feedbacks for a student
 */
export async function getFeedbacksByStudent(studentId: string): Promise<any[]> {
  try {
    const result = await query(`
      SELECT 
        f.*,
        u.name as instructorName,
        u.email as instructorEmail
      FROM Feedback f
      JOIN User u ON f.createdBy = u.id
      WHERE f.studentId = ?
      ORDER BY f.weekStart DESC, f.subject
    `, [studentId]);
    
    return result.rows.map((feedback: any) => ({
      ...feedback,
      strengths: feedback.strengths ? feedback.strengths.split('||').filter((s: string) => s.trim()) : [],
      improvements: feedback.improvements ? feedback.improvements.split('||').filter((s: string) => s.trim()) : [],
      skillsMetrics: feedback.skillsMetrics ? JSON.parse(feedback.skillsMetrics) : null
    }));
  } catch (error) {
    console.error('Error getting feedbacks by student:', error);
    throw error;
  }
}

/**
 * Check if feedback exists for a student/week/subject combination
 */
export async function feedbackExists(
  studentId: string, 
  weekStart: string, 
  subject: string
): Promise<boolean> {
  try {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM Feedback
      WHERE studentId = ? 
        AND DATE(weekStart) = DATE(?) 
        AND subject = ?
    `, [studentId, weekStart, subject]);
    
    return (result.rows[0] as any).count > 0;
  } catch (error) {
    console.error('Error checking feedback existence:', error);
    throw error;
  }
}

/**
 * Get feedback by student, week, and subject
 */
export async function getFeedbackByStudentWeekSubject(
  studentId: string, 
  weekStart: string, 
  subject: string
): Promise<any | null> {
  try {
    const result = await query(`
      SELECT id, studentId, weekStart, subject, score, 
             generalComments, strengths, improvements, aiAnalysis,
             createdBy, createdAt, updatedAt
      FROM Feedback
      WHERE studentId = ? 
        AND DATE(weekStart) = DATE(?) 
        AND subject = ?
      LIMIT 1
    `, [studentId, weekStart, subject]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting feedback by student/week/subject:', error);
    throw error;
  }
}

/**
 * Update existing feedback
 */
export async function updateFeedback(
  id: string,
  data: Partial<FeedbackData>
): Promise<void> {
  try {
    const updateFields = [];
    const values = [];
    
    if (data.score !== undefined) {
      updateFields.push('score = ?');
      values.push(data.score);
    }
    if (data.generalComments !== undefined) {
      updateFields.push('generalComments = ?');
      values.push(data.generalComments);
    }
    if (data.strengths !== undefined) {
      updateFields.push('strengths = ?');
      values.push(JSON.stringify(data.strengths));
    }
    if (data.improvements !== undefined) {
      updateFields.push('improvements = ?');
      values.push(JSON.stringify(data.improvements));
    }
    if (data.aiAnalysis !== undefined) {
      updateFields.push('aiAnalysis = ?');
      values.push(data.aiAnalysis);
    }
    
    if (updateFields.length === 0) {
      return; // Nothing to update
    }
    
    updateFields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await query(`
      UPDATE Feedback 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, values);
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
}

/**
 * Delete feedback
 */
export async function deleteFeedback(id: string): Promise<void> {
  try {
    await query('DELETE FROM Feedback WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
}

/**
 * Validate feedback data for bulk upload
 */
export async function validateFeedbackData(
  studentEmail: string,
  studentId: string,
  weekStart: string,
  subject: string
): Promise<{ valid: boolean; error?: string; userId?: string }> {
  try {
    // Check if student exists with matching email and studentId
    const studentResult = await query(`
      SELECT id, email, studentId, subjects
      FROM User
      WHERE email = ? AND studentId = ? AND role = 'STUDENT'
      LIMIT 1
    `, [studentEmail, studentId]);
    
    if (studentResult.rows.length === 0) {
      return { 
        valid: false, 
        error: `Student not found with email ${studentEmail} and ID ${studentId}` 
      };
    }
    
    const student = studentResult.rows[0] as any;
    
    // Check if student has this subject
    const studentSubjects = student.subjects ? student.subjects.split(',').map((s: string) => s.trim()) : [];
    if (!studentSubjects.includes(subject)) {
      return { 
        valid: false, 
        error: `Student ${studentEmail} is not enrolled in ${subject}` 
      };
    }
    
    // Check if there's a progress report for this week
    // Accept both simple date format (YYYY-MM-DD) and full timestamp
    const reportResult = await query(`
      SELECT id
      FROM ProgressReport
      WHERE userId = ? 
        AND DATE(weekStart) = DATE(?) 
        AND subject = ?
      LIMIT 1
    `, [student.id, weekStart, subject]);
    
    if (reportResult.rows.length === 0) {
      return { 
        valid: false, 
        error: `No progress report found for ${studentEmail} in ${subject} for week ${weekStart}` 
      };
    }
    
    return { 
      valid: true, 
      userId: student.id 
    };
  } catch (error) {
    console.error('Error validating feedback data:', error);
    return { 
      valid: false, 
      error: 'Database error during validation' 
    };
  }
}

// =====================================================================================
// SKILLS METRICS FUNCTIONS - For Progress Radar Chart
// =====================================================================================

/**
 * Updates or creates skills progress for a student based on new feedback
 */
export async function updateSkillsProgress(
  studentId: string, 
  subject: string, 
  skillsMetrics: {
    comprehension: number;
    criticalThinking: number;
    selfRegulation: number;
    practicalApplication: number;
    metacognition: number;
  }
) {
  try {
    // Check if progress record exists
    const existingResult = await query(`
      SELECT * FROM SkillsProgress
      WHERE studentId = ? AND subject = ?
      LIMIT 1
    `, [studentId, subject]);
    
    const now = new Date().toISOString();
    
    if (existingResult.rows.length > 0) {
      // Update existing record with new average
      const existing = existingResult.rows[0] as any;
      const totalFeedbacks = existing.totalFeedbacks + 1;
      
      // Calculate new running averages
      const newComprehension = ((existing.comprehension * existing.totalFeedbacks) + skillsMetrics.comprehension) / totalFeedbacks;
      const newCriticalThinking = ((existing.criticalThinking * existing.totalFeedbacks) + skillsMetrics.criticalThinking) / totalFeedbacks;
      const newSelfRegulation = ((existing.selfRegulation * existing.totalFeedbacks) + skillsMetrics.selfRegulation) / totalFeedbacks;
      const newPracticalApplication = ((existing.practicalApplication * existing.totalFeedbacks) + skillsMetrics.practicalApplication) / totalFeedbacks;
      const newMetacognition = ((existing.metacognition * existing.totalFeedbacks) + skillsMetrics.metacognition) / totalFeedbacks;
      
      await query(`
        UPDATE SkillsProgress
        SET comprehension = ?,
            criticalThinking = ?,
            selfRegulation = ?,
            practicalApplication = ?,
            metacognition = ?,
            totalFeedbacks = ?,
            lastCalculated = ?,
            updatedAt = ?
        WHERE studentId = ? AND subject = ?
      `, [
        newComprehension,
        newCriticalThinking,
        newSelfRegulation,
        newPracticalApplication,
        newMetacognition,
        totalFeedbacks,
        now,
        now,
        studentId,
        subject
      ]);
    } else {
      // Create new record
      const id = generateId();
      await query(`
        INSERT INTO SkillsProgress (
          id, studentId, subject, 
          comprehension, criticalThinking, selfRegulation, 
          practicalApplication, metacognition,
          totalFeedbacks, lastCalculated, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        studentId,
        subject,
        skillsMetrics.comprehension,
        skillsMetrics.criticalThinking,
        skillsMetrics.selfRegulation,
        skillsMetrics.practicalApplication,
        skillsMetrics.metacognition,
        1,
        now,
        now,
        now
      ]);
    }
  } catch (error) {
    console.error('Error updating skills progress:', error);
    throw error;
  }
}

/**
 * Gets the skills progress for a student (all subjects or specific subject)
 */
export async function getStudentSkillsProgress(studentId: string, subject?: string) {
  try {
    let queryStr = `
      SELECT
        subject,
        COALESCE(
          AVG(JSON_EXTRACT(skillsMetrics, '$.comprehension')),
          AVG(JSON_EXTRACT(skillsMetrics, '$.communication'))
        ) as comprehension,
        AVG(JSON_EXTRACT(skillsMetrics, '$.criticalThinking')) as criticalThinking,
        AVG(JSON_EXTRACT(skillsMetrics, '$.selfRegulation')) as selfRegulation,
        AVG(JSON_EXTRACT(skillsMetrics, '$.practicalApplication')) as practicalApplication,
        COALESCE(
          AVG(JSON_EXTRACT(skillsMetrics, '$.metacognition')),
          AVG(JSON_EXTRACT(skillsMetrics, '$.reflection'))
        ) as metacognition,
        COUNT(*) as totalFeedbacks
      FROM Feedback
      WHERE studentId = ?
        AND skillsMetrics IS NOT NULL
    `;
    const params: any[] = [studentId];
    
    if (subject) {
      queryStr += ` AND subject = ?`;
      params.push(subject);
    }
    
    queryStr += ` GROUP BY subject ORDER BY subject`;
    
    const result = await query(queryStr, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting student skills progress:', error);
    throw error;
  }
}

/**
 * Gets overall skills average across all subjects for a student
 */
export async function getStudentOverallSkills(studentId: string) {
  try {
    const result = await query(`
      SELECT
        COALESCE(
          AVG(JSON_EXTRACT(skillsMetrics, '$.comprehension')),
          AVG(JSON_EXTRACT(skillsMetrics, '$.communication'))
        ) as avgComprehension,
        AVG(JSON_EXTRACT(skillsMetrics, '$.criticalThinking')) as avgCriticalThinking,
        AVG(JSON_EXTRACT(skillsMetrics, '$.selfRegulation')) as avgSelfRegulation,
        AVG(JSON_EXTRACT(skillsMetrics, '$.practicalApplication')) as avgPracticalApplication,
        COALESCE(
          AVG(JSON_EXTRACT(skillsMetrics, '$.metacognition')),
          AVG(JSON_EXTRACT(skillsMetrics, '$.reflection'))
        ) as avgMetacognition,
        COUNT(*) as totalFeedbacks
      FROM Feedback
      WHERE studentId = ?
        AND skillsMetrics IS NOT NULL
    `, [studentId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0] as any;
    return {
      comprehension: row.avgComprehension || 0,
      criticalThinking: row.avgCriticalThinking || 0,
      selfRegulation: row.avgSelfRegulation || 0,
      practicalApplication: row.avgPracticalApplication || 0,
      metacognition: row.avgMetacognition || 0,
      totalFeedbacks: row.totalFeedbacks || 0
    };
  } catch (error) {
    console.error('Error getting student overall skills:', error);
    throw error;
  }
}

/**
 * Stores feedback with skills metrics
 */
export async function createFeedbackWithMetrics(feedbackData: {
  studentId: string;
  progressReportId?: string;
  weekStart: string;
  subject: string;
  score?: number;
  generalComments?: string;
  strengths?: string[];
  improvements?: string[];
  aiAnalysis?: string;
  skillsMetrics?: {
    comprehension: number;
    criticalThinking: number;
    selfRegulation: number;
    practicalApplication: number;
    metacognition: number;
  };
  createdBy: string;
}) {
  try {
    const id = generateId();
    const now = new Date().toISOString();

    // Convert arrays to JSON strings
    const strengthsJson = feedbackData.strengths ? JSON.stringify(feedbackData.strengths) : null;
    const improvementsJson = feedbackData.improvements ? JSON.stringify(feedbackData.improvements) : null;
    const skillsMetricsJson = feedbackData.skillsMetrics ? JSON.stringify(feedbackData.skillsMetrics) : null;

    await query(`
      INSERT INTO Feedback (
        id, studentId, progressReportId, weekStart, subject,
        score, generalComments, strengths, improvements,
        aiAnalysis, skillsMetrics, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      feedbackData.studentId,
      feedbackData.progressReportId || null,
      feedbackData.weekStart,
      feedbackData.subject,
      feedbackData.score || null,
      feedbackData.generalComments || null,
      strengthsJson,
      improvementsJson,
      feedbackData.aiAnalysis || null,
      skillsMetricsJson,
      feedbackData.createdBy,
      now,
      now
    ]);

    // Update skills progress if metrics are provided
    if (feedbackData.skillsMetrics) {
      await updateSkillsProgress(
        feedbackData.studentId,
        feedbackData.subject,
        feedbackData.skillsMetrics
      );
    }

    return { id, createdAt: now };
  } catch (error) {
    console.error('Error creating feedback with metrics:', error);
    throw error;
  }
}

// ============================================================================
// EVALUATION OPERATIONS
// ============================================================================

/**
 * Gets all evaluations for a student, optionally filtered by subject
 */
export async function getStudentEvaluations(studentId: string, subject?: string) {
  try {
    let queryStr = `
      SELECT
        e.id, e.studentId, e.subject, e.examDate, e.examTopic,
        e.score, e.feedback, e.createdBy, e.createdAt, e.updatedAt,
        u.name as instructorName, u.email as instructorEmail
      FROM Evaluation e
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.studentId = ?
    `;

    const params: any[] = [studentId];

    if (subject) {
      queryStr += ' AND e.subject = ?';
      params.push(subject);
    }

    queryStr += ' ORDER BY e.examDate DESC, e.createdAt DESC';

    const result = await query(queryStr, params);

    return result.rows.map(row => ({
      id: String((row as any).id),
      studentId: String((row as any).studentId),
      subject: String((row as any).subject),
      examDate: String((row as any).examDate),
      examTopic: String((row as any).examTopic),
      score: Number((row as any).score),
      feedback: String((row as any).feedback),
      createdBy: String((row as any).createdBy),
      createdAt: String((row as any).createdAt),
      updatedAt: String((row as any).updatedAt),
      instructorName: (row as any).instructorName ? String((row as any).instructorName) : undefined,
      instructorEmail: (row as any).instructorEmail ? String((row as any).instructorEmail) : undefined
    }));
  } catch (error) {
    console.error('Error getting student evaluations:', error);
    throw error;
  }
}

/**
 * Gets a specific evaluation by ID
 */
export async function getEvaluationById(evaluationId: string) {
  try {
    const result = await query(`
      SELECT
        e.id, e.studentId, e.subject, e.examDate, e.examTopic,
        e.score, e.feedback, e.createdBy, e.createdAt, e.updatedAt,
        u.name as instructorName, u.email as instructorEmail
      FROM Evaluation e
      LEFT JOIN User u ON e.createdBy = u.id
      WHERE e.id = ?
      LIMIT 1
    `, [evaluationId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    return {
      id: String(row.id),
      studentId: String(row.studentId),
      subject: String(row.subject),
      examDate: String(row.examDate),
      examTopic: String(row.examTopic),
      score: Number(row.score),
      feedback: String(row.feedback),
      createdBy: String(row.createdBy),
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
      instructorName: row.instructorName ? String(row.instructorName) : undefined,
      instructorEmail: row.instructorEmail ? String(row.instructorEmail) : undefined
    };
  } catch (error) {
    console.error('Error getting evaluation by ID:', error);
    throw error;
  }
}

/**
 * Creates a new evaluation
 */
export async function createEvaluation(evaluationData: {
  studentId: string;
  subject: string;
  examDate: string;
  examTopic: string;
  score: number;
  feedback: string;
  createdBy: string;
}) {
  try {
    const id = generateId();
    const now = new Date().toISOString();

    await query(`
      INSERT INTO Evaluation (
        id, studentId, subject, examDate, examTopic,
        score, feedback, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      evaluationData.studentId,
      evaluationData.subject,
      evaluationData.examDate,
      evaluationData.examTopic,
      evaluationData.score,
      evaluationData.feedback,
      evaluationData.createdBy,
      now,
      now
    ]);

    return { id, createdAt: now };
  } catch (error) {
    console.error('Error creating evaluation:', error);
    throw error;
  }
}

// ============================================================================
// AI ANALYSIS FUNCTIONS - Claude Haiku Integration
// ============================================================================

/**
 * Get all answers for a progress report with question details
 * Used by AI analyzer to get context for analysis
 */
export async function getProgressReportAnswers(progressReportId: string) {
  try {
    const result = await query(`
      SELECT
        a.id,
        a.questionId,
        a.answer,
        q.text as questionText,
        q.type as questionType,
        q."order" as questionOrder
      FROM Answer a
      JOIN Question q ON a.questionId = q.id
      WHERE a.progressReportId = ?
      ORDER BY q."order" ASC
    `, [progressReportId]);

    return result.rows.map((row: any) => ({
      id: String(row.id),
      questionId: String(row.questionId),
      questionText: String(row.questionText),
      answer: String(row.answer),
      type: String(row.questionType)
    }));
  } catch (error) {
    console.error('Error getting progress report answers:', error);
    throw error;
  }
}

/**
 * Create AI-generated feedback and save to Feedback table
 * Used after Claude API analysis is complete
 */
export async function createAIFeedback(feedbackData: {
  studentId: string;
  progressReportId: string;
  weekStart: string;
  subject: string;
  score: number;
  generalComments: string;
  strengths: string;
  improvements: string;
  aiAnalysis: string;
  skillsMetrics: {
    completeness: number;
    clarity: number;
    reflection: number;
    progress: number;
    engagement: number;
  };
  createdBy: string;
}) {
  try {
    const id = generateId();
    const now = new Date().toISOString();

    await query(`
      INSERT INTO Feedback (
        id, studentId, progressReportId, weekStart, subject,
        score, generalComments, strengths, improvements,
        aiAnalysis, skillsMetrics, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      feedbackData.studentId,
      feedbackData.progressReportId,
      feedbackData.weekStart,
      feedbackData.subject,
      feedbackData.score,
      feedbackData.generalComments,
      feedbackData.strengths,
      feedbackData.improvements,
      feedbackData.aiAnalysis,
      JSON.stringify(feedbackData.skillsMetrics),
      feedbackData.createdBy,
      now,
      now
    ]);

    return { id, createdAt: now };
  } catch (error) {
    console.error('Error creating AI feedback:', error);
    throw error;
  }
}

/**
 * Get progress report details with student info
 * Used to gather context for AI analysis
 */
export async function getProgressReportWithStudent(progressReportId: string) {
  try {
    const result = await query(`
      SELECT
        pr.id,
        pr.userId,
        pr.weekStart,
        pr.weekEnd,
        pr.subject,
        u.name as studentName,
        u.email as studentEmail,
        u.academicYear,
        u.division,
        u.sede
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.id = ?
      LIMIT 1
    `, [progressReportId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    return {
      id: String(row.id),
      studentId: String(row.userId),
      weekStart: String(row.weekStart),
      weekEnd: String(row.weekEnd),
      subject: String(row.subject),
      status: 'SUBMITTED',  // ProgressReport no tiene campo status en el schema real
      studentName: String(row.studentName),
      studentEmail: row.studentEmail ? String(row.studentEmail) : undefined,
      academicYear: row.academicYear ? String(row.academicYear) : undefined,
      division: row.division ? String(row.division) : undefined,
      sede: row.sede ? String(row.sede) : undefined
    };
  } catch (error) {
    console.error('Error getting progress report with student:', error);
    throw error;
  }
}