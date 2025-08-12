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

// ===== FASE 4: FEEDBACK SYSTEM DATABASE OPERATIONS =====

// Feedback storage operations for FASE 4 integration
export async function createProgressReport(data: {
  userId: string;
  weekStart: string;
  weekEnd: string;
  subject: string;
  submittedAt: string;
  evaluationResults?: any;
  feedbackContent?: string;
  progressScore?: number;
}) {
  try {
    const reportId = generateId();
    
    // Create the progress report with feedback data
    await query(`
      INSERT INTO ProgressReport (
        id, userId, subject, weekStart, weekEnd, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      reportId, 
      data.userId, 
      data.subject, 
      data.weekStart, 
      data.weekEnd, 
      data.submittedAt
    ]);
    
    // Store additional feedback data if provided
    if (data.evaluationResults || data.feedbackContent) {
      await storeFeedbackData(reportId, {
        evaluationResults: data.evaluationResults,
        feedbackContent: data.feedbackContent,
        progressScore: data.progressScore
      });
    }
    
    return reportId;
  } catch (error) {
    console.error('Error creating progress report:', error)
    throw error
  }
}

export async function updateProgressReport(reportId: string, updateData: {
  evaluationResults?: any;
  feedbackContent?: string;
  progressScore?: number;
  instructorReviewed?: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
}) {
  try {
    // Update feedback data
    await storeFeedbackData(reportId, updateData);
    
    return true;
  } catch (error) {
    console.error('Error updating progress report:', error)
    throw error
  }
}

export async function getProgressReportsByUser(userId: string) {
  try {
    const result = await query(`
      SELECT pr.*, u.name as userName, u.email as userEmail, u.studentId
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.userId = ?
      ORDER BY pr.weekStart DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting progress reports by user:', error)
    throw error
  }
}

export async function getProgressReportWithFeedback(reportId: string) {
  try {
    const reportResult = await query(`
      SELECT pr.*, u.name as userName, u.email as userEmail, u.studentId,
             u.sede, u.academicYear, u.division
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.id = ?
      LIMIT 1
    `, [reportId]);
    
    if (reportResult.rows.length === 0) {
      return null;
    }
    
    const report = reportResult.rows[0];
    
    // Get feedback data
    const feedbackData = await getFeedbackData(reportId);
    
    // Get answers
    const answersResult = await query(`
      SELECT questionId, answer
      FROM Answer
      WHERE progressReportId = ?
    `, [reportId]);
    
    const answers: { [key: string]: string } = {};
    answersResult.rows.forEach((row: any) => {
      answers[row.questionId] = row.answer;
    });
    
    return {
      ...report,
      answers,
      feedback: feedbackData
    };
    
  } catch (error) {
    console.error('Error getting progress report with feedback:', error)
    throw error
  }
}

export async function storeFeedbackData(reportId: string, feedbackData: {
  evaluationResults?: any;
  feedbackContent?: string;
  progressScore?: number;
  instructorReviewed?: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
}) {
  try {
    // Store feedback data as JSON in a flexible way
    // Since we're using libSQL, we can store JSON as TEXT
    const feedbackJson = JSON.stringify(feedbackData);
    
    // Check if feedback data already exists
    const existingResult = await query(`
      SELECT id FROM Answer 
      WHERE progressReportId = ? AND questionId = '__FEEDBACK_DATA__' 
      LIMIT 1
    `, [reportId]);
    
    if (existingResult.rows.length > 0) {
      // Update existing feedback data
      await query(`
        UPDATE Answer 
        SET answer = ? 
        WHERE progressReportId = ? AND questionId = '__FEEDBACK_DATA__'
      `, [feedbackJson, reportId]);
    } else {
      // Create new feedback data record
      const feedbackId = generateId();
      await query(`
        INSERT INTO Answer (id, questionId, progressReportId, answer)
        VALUES (?, '__FEEDBACK_DATA__', ?, ?)
      `, [feedbackId, reportId, feedbackJson]);
    }
    
  } catch (error) {
    console.error('Error storing feedback data:', error)
    throw error
  }
}

export async function getFeedbackData(reportId: string): Promise<any> {
  try {
    const result = await query(`
      SELECT answer 
      FROM Answer 
      WHERE progressReportId = ? AND questionId = '__FEEDBACK_DATA__'
      LIMIT 1
    `, [reportId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return JSON.parse(result.rows[0].answer as string);
    
  } catch (error) {
    console.error('Error getting feedback data:', error)
    return null
  }
}

export async function getReportsRequiringInstructorReview(): Promise<any[]> {
  try {
    // Get reports where feedback indicates instructor review is required
    const result = await query(`
      SELECT pr.*, u.name as userName, u.email as userEmail, u.studentId,
             u.sede, u.academicYear, u.division, a.answer as feedbackData
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      LEFT JOIN Answer a ON a.progressReportId = pr.id AND a.questionId = '__FEEDBACK_DATA__'
      WHERE pr.submittedAt >= datetime('now', '-7 days')
      ORDER BY pr.submittedAt DESC
    `, []);
    
    const reportsNeedingReview = [];
    
    for (const row of result.rows) {
      if (row.feedbackData) {
        try {
          const feedbackData = JSON.parse(row.feedbackData as string);
          if (feedbackData.instructorReviewRequired || 
              (feedbackData.progressScore && feedbackData.progressScore < 50)) {
            reportsNeedingReview.push({
              ...row,
              feedback: feedbackData
            });
          }
        } catch (e) {
          // Skip rows with invalid JSON
          continue;
        }
      }
    }
    
    return reportsNeedingReview;
    
  } catch (error) {
    console.error('Error getting reports requiring instructor review:', error)
    throw error
  }
}

export async function markReportAsReviewed(reportId: string, reviewedBy: string) {
  try {
    const existingFeedback = await getFeedbackData(reportId) || {};
    
    const updatedFeedback = {
      ...existingFeedback,
      instructorReviewed: true,
      reviewedAt: new Date().toISOString(),
      reviewedBy
    };
    
    await storeFeedbackData(reportId, updatedFeedback);
    
    return true;
  } catch (error) {
    console.error('Error marking report as reviewed:', error)
    throw error
  }
}

export async function getStudentProgressSummary(userId: string, subject?: string) {
  try {
    let sql = `
      SELECT pr.*, a.answer as feedbackData
      FROM ProgressReport pr
      LEFT JOIN Answer a ON a.progressReportId = pr.id AND a.questionId = '__FEEDBACK_DATA__'
      WHERE pr.userId = ?
    `;
    const params = [userId];
    
    if (subject) {
      sql += ' AND pr.subject = ?';
      params.push(subject);
    }
    
    sql += ' ORDER BY pr.weekStart DESC LIMIT 10';
    
    const result = await query(sql, params);
    
    const progressData = result.rows.map((row: any) => {
      let feedback = null;
      if (row.feedbackData) {
        try {
          feedback = JSON.parse(row.feedbackData);
        } catch (e) {
          // Skip invalid JSON
        }
      }
      
      return {
        weekStart: row.weekStart,
        weekEnd: row.weekEnd,
        subject: row.subject,
        submittedAt: row.submittedAt,
        progressScore: feedback?.progressScore || 0,
        feedbackGenerated: !!feedback
      };
    });
    
    return progressData;
    
  } catch (error) {
    console.error('Error getting student progress summary:', error)
    throw error
  }
}

// =====================================================
// FASE 6: EMAIL NOTIFICATION SYSTEM
// Database operations for email tracking and delivery
// =====================================================

export interface EmailDeliveryRecord {
  id: string;
  reportId: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  content: string;
  templateVersion: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'bounced';
  priority: 'high' | 'medium' | 'low';
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  gmailMessageId?: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  version: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string; // JSON array of variable names
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Initialize email tracking tables
export async function initializeEmailTables() {
  try {
    // Create EmailDelivery table for tracking email sending
    await query(`
      CREATE TABLE IF NOT EXISTS EmailDelivery (
        id TEXT PRIMARY KEY,
        reportId TEXT NOT NULL,
        userId TEXT NOT NULL,
        recipientEmail TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        templateVersion TEXT DEFAULT 'v1.0',
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        sentAt TEXT,
        deliveredAt TEXT,
        failureReason TEXT,
        retryCount INTEGER DEFAULT 0,
        maxRetries INTEGER DEFAULT 3,
        nextRetryAt TEXT,
        gmailMessageId TEXT,
        instructorId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (reportId) REFERENCES ProgressReport(id),
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (instructorId) REFERENCES User(id)
      )
    `);

    // Create EmailTemplate table for template management
    await query(`
      CREATE TABLE IF NOT EXISTS EmailTemplate (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        version TEXT NOT NULL,
        subject TEXT NOT NULL,
        htmlContent TEXT NOT NULL,
        textContent TEXT NOT NULL,
        variables TEXT NOT NULL DEFAULT '[]',
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Create indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_email_delivery_report_id ON EmailDelivery(reportId)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_email_delivery_user_id ON EmailDelivery(userId)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_email_delivery_status ON EmailDelivery(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_email_delivery_next_retry ON EmailDelivery(nextRetryAt)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_email_template_active ON EmailTemplate(isActive)`);

    console.log('✅ Email tracking tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing email tables:', error);
    throw error;
  }
}

// Create email delivery record
export async function createEmailDeliveryRecord(emailData: {
  reportId: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  content: string;
  templateVersion?: string;
  priority?: 'high' | 'medium' | 'low';
  instructorId: string;
}): Promise<string> {
  try {
    const id = generateId();
    const now = new Date().toISOString();
    
    await query(`
      INSERT INTO EmailDelivery (
        id, reportId, userId, recipientEmail, subject, content,
        templateVersion, priority, status, retryCount, maxRetries,
        instructorId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 3, ?, ?, ?)
    `, [
      id,
      emailData.reportId,
      emailData.userId,
      emailData.recipientEmail,
      emailData.subject,
      emailData.content,
      emailData.templateVersion || 'v1.0',
      emailData.priority || 'medium',
      emailData.instructorId,
      now,
      now
    ]);

    console.log(`📧 Email delivery record created: ${id}`);
    return id;
  } catch (error) {
    console.error('Error creating email delivery record:', error);
    throw error;
  }
}

// Update email delivery status
export async function updateEmailDeliveryStatus(
  deliveryId: string,
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'bounced',
  updates: {
    gmailMessageId?: string;
    sentAt?: string;
    deliveredAt?: string;
    failureReason?: string;
    nextRetryAt?: string;
  } = {}
) {
  try {
    const now = new Date().toISOString();
    const setClause = ['status = ?', 'updatedAt = ?'];
    const params = [status, now];

    if (updates.gmailMessageId) {
      setClause.push('gmailMessageId = ?');
      params.push(updates.gmailMessageId);
    }
    if (updates.sentAt) {
      setClause.push('sentAt = ?');
      params.push(updates.sentAt);
    }
    if (updates.deliveredAt) {
      setClause.push('deliveredAt = ?');
      params.push(updates.deliveredAt);
    }
    if (updates.failureReason) {
      setClause.push('failureReason = ?');
      params.push(updates.failureReason);
    }
    if (updates.nextRetryAt) {
      setClause.push('nextRetryAt = ?');
      params.push(updates.nextRetryAt);
    }

    params.push(deliveryId);

    await query(`
      UPDATE EmailDelivery 
      SET ${setClause.join(', ')}
      WHERE id = ?
    `, params);

    console.log(`📧 Email delivery status updated: ${deliveryId} -> ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating email delivery status:', error);
    throw error;
  }
}

// Get email delivery records for a report
export async function getEmailDeliveryRecords(reportId: string) {
  try {
    const result = await query(`
      SELECT ed.*, u.name as recipientName, u.studentId, i.name as instructorName
      FROM EmailDelivery ed
      JOIN User u ON ed.userId = u.id
      JOIN User i ON ed.instructorId = i.id
      WHERE ed.reportId = ?
      ORDER BY ed.createdAt DESC
    `, [reportId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting email delivery records:', error);
    throw error;
  }
}

// Get pending email deliveries for retry processing
export async function getPendingEmailRetries(limit: number = 10) {
  try {
    const now = new Date().toISOString();
    const result = await query(`
      SELECT ed.*, u.name as recipientName, u.email as recipientEmail, u.studentId
      FROM EmailDelivery ed
      JOIN User u ON ed.userId = u.id
      WHERE ed.status IN ('failed', 'pending')
        AND ed.retryCount < ed.maxRetries
        AND (ed.nextRetryAt IS NULL OR ed.nextRetryAt <= ?)
      ORDER BY ed.priority DESC, ed.nextRetryAt ASC
      LIMIT ?
    `, [now, limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting pending email retries:', error);
    throw error;
  }
}

// Increment retry count
export async function incrementEmailRetryCount(deliveryId: string) {
  try {
    const now = new Date().toISOString();
    // Next retry in exponential backoff: 5 minutes, 15 minutes, 60 minutes
    const nextRetryDelayMinutes = [5, 15, 60];
    
    // Get current retry count
    const result = await query('SELECT retryCount FROM EmailDelivery WHERE id = ?', [deliveryId]);
    if (result.rows.length === 0) throw new Error('Email delivery record not found');
    
    const currentRetryCount = Number(result.rows[0].retryCount) || 0;
    const delayMinutes = nextRetryDelayMinutes[Math.min(currentRetryCount, nextRetryDelayMinutes.length - 1)];
    const nextRetryAt = new Date(Date.now() + delayMinutes * 60000).toISOString();
    
    await query(`
      UPDATE EmailDelivery 
      SET retryCount = retryCount + 1, nextRetryAt = ?, updatedAt = ?
      WHERE id = ?
    `, [nextRetryAt, now, deliveryId]);
    
    console.log(`📧 Email retry count incremented: ${deliveryId} -> ${currentRetryCount + 1}`);
    return true;
  } catch (error) {
    console.error('Error incrementing email retry count:', error);
    throw error;
  }
}

// Get email delivery statistics for instructor dashboard
export async function getEmailDeliveryStats(instructorId?: string) {
  try {
    let whereClause = '';
    const params: any[] = [];
    
    if (instructorId) {
      whereClause = 'WHERE instructorId = ?';
      params.push(instructorId);
    }
    
    const result = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(CASE WHEN sentAt IS NOT NULL AND createdAt IS NOT NULL 
            THEN (julianday(sentAt) - julianday(createdAt)) * 24 * 60 
            ELSE NULL END) as avgDeliveryTimeMinutes
      FROM EmailDelivery 
      ${whereClause}
      GROUP BY status
    `, params);
    
    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      bounced: 0,
      avgDeliveryTimeMinutes: 0
    };
    
    result.rows.forEach((row: any) => {
      stats.total += row.count;
      stats[row.status as keyof typeof stats] = row.count;
      if (row.avgDeliveryTimeMinutes && row.status === 'sent') {
        stats.avgDeliveryTimeMinutes = Math.round(row.avgDeliveryTimeMinutes);
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting email delivery stats:', error);
    throw error;
  }
}

// Create or update email template
export async function upsertEmailTemplate(templateData: {
  name: string;
  version: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}) {
  try {
    const id = generateId();
    const now = new Date().toISOString();
    
    // Deactivate existing templates with the same name
    await query(`UPDATE EmailTemplate SET isActive = 0 WHERE name = ?`, [templateData.name]);
    
    // Insert new template
    await query(`
      INSERT INTO EmailTemplate (
        id, name, version, subject, htmlContent, textContent, 
        variables, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `, [
      id,
      templateData.name,
      templateData.version,
      templateData.subject,
      templateData.htmlContent,
      templateData.textContent,
      JSON.stringify(templateData.variables),
      now,
      now
    ]);
    
    console.log(`📧 Email template created: ${templateData.name} v${templateData.version}`);
    return id;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
}

// Get active email template
export async function getEmailTemplate(name: string) {
  try {
    const result = await query(`
      SELECT * FROM EmailTemplate 
      WHERE name = ? AND isActive = 1 
      ORDER BY createdAt DESC 
      LIMIT 1
    `, [name]);
    
    if (result.rows.length === 0) return null;
    
    const template = result.rows[0];
    return {
      ...template,
      variables: JSON.parse(template.variables as string)
    };
  } catch (error) {
    console.error('Error getting email template:', error);
    throw error;
  }
}