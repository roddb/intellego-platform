/**
 * Data Organization Algorithms for Intellego Platform
 * 
 * Core algorithms for parsing, normalizing, and hierarchically organizing
 * student report data with algorithmic precision.
 * 
 * Hierarchy: sede/año/materia/curso/alumno/semana
 * Curso Definition: division + "-" + academicYear (e.g., "C-4to-año")
 * Week Numbering: By current month (Agosto - Semana 1, Agosto - Semana 2, etc.)
 * 
 * @author Data Structure Specialist
 * @version 2.0.0
 */

// Core type definitions for type safety
export interface StudentData {
  id: string;
  name: string;
  email: string;
  studentId: string;
  sede: string;
  academicYear: string;
  division: string;
  subjects: string[];
}

export interface ReportData {
  id: string;
  userId: string;
  subject: string;
  weekStart: string;
  weekEnd: string;
  submittedAt: string;
  answers: AnswerData[];
}

export interface AnswerData {
  id: string;
  questionId: string;
  answer: string;
}

export interface HierarchicalPath {
  sede: string;
  año: string;
  materia: string;
  curso: string;
  alumno: string;
  semana: string;
}

export interface OrganizedReportData {
  student: StudentData;
  report: ReportData;
  hierarchicalPath: HierarchicalPath;
  fileName: string;
  fullPath: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Month names for Spanish locale
const MONTH_NAMES: Record<number, string> = {
  1: 'enero',
  2: 'febrero', 
  3: 'marzo',
  4: 'abril',
  5: 'mayo',
  6: 'junio',
  7: 'julio',
  8: 'agosto',
  9: 'septiembre',
  10: 'octubre',
  11: 'noviembre',
  12: 'diciembre'
};

/**
 * TEXT NORMALIZATION ALGORITHMS
 * Pure functions for normalizing inconsistent text data
 */

/**
 * Normalizes text by removing accents, converting to lowercase, and replacing spaces with hyphens
 * Ensures consistent file system compatibility and hierarchical organization
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .normalize('NFD') // Decompose Unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[ñ]/g, 'n') // Handle Spanish ñ specifically
    .replace(/[^a-z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Normalizes student names for file system usage
 * Handles compound names and ensures consistency
 */
export function normalizeStudentName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'unknown-student';
  }

  // Split name into parts and normalize each part
  const nameParts = name
    .trim()
    .split(/\s+/)
    .map(part => normalizeText(part))
    .filter(part => part.length > 0);

  return nameParts.length > 0 ? nameParts.join('-') : 'unknown-student';
}

/**
 * Normalizes subject names for consistent hierarchy
 */
export function normalizeSubject(subject: string): string {
  if (!subject || typeof subject !== 'string') {
    return 'unknown-subject';
  }

  return normalizeText(subject);
}

/**
 * Normalizes sede (location) names
 */
export function normalizeSede(sede: string): string {
  if (!sede || typeof sede !== 'string') {
    return 'unknown-sede';
  }

  return normalizeText(sede);
}

/**
 * HIERARCHICAL PATH GENERATION ALGORITHMS
 * Generate consistent hierarchical paths for the file system organization
 */

/**
 * Generates curso identifier from division and academic year
 * Format: division + "-" + academicYear (e.g., "C-4to-año")
 */
export function generateCurso(division: string, academicYear: string): string {
  if (!division || !academicYear) {
    return 'unknown-curso';
  }

  const normalizedDivision = normalizeText(division);
  const normalizedYear = normalizeText(academicYear);
  
  return `${normalizedDivision}-${normalizedYear}`;
}

/**
 * Generates alumno identifier from student ID and name
 * Format: studentId_normalizedName (e.g., "EST-2025-001_maria-gonzalez")
 */
export function generateAlumno(studentId: string, studentName: string): string {
  if (!studentId) {
    return 'unknown-student';
  }

  const normalizedName = normalizeStudentName(studentName);
  return `${studentId}_${normalizedName}`;
}

/**
 * MONTH-BASED WEEK NUMBER CALCULATION
 * Calculate week number within the current month using approved algorithm
 */

/**
 * Calculates the week number within a month based on the day
 * Week 1 = Days 1-7, Week 2 = Days 8-14, etc.
 */
export function calculateWeekOfMonth(date: Date): number {
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

/**
 * Generates semana identifier using month name and week number
 * Format: "mes-semana-N" (e.g., "agosto-semana-2")
 */
export function generateSemana(date: Date): string {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const weekNumber = calculateWeekOfMonth(date);
  const monthName = MONTH_NAMES[month] || 'unknown-month';
  
  return `${monthName}-semana-${weekNumber}`;
}

/**
 * Generates complete hierarchical path for a report
 * Follows hierarchy: sede/año/materia/curso/alumno/semana
 */
export function generateHierarchicalPath(
  student: StudentData,
  subject: string,
  reportDate: Date
): HierarchicalPath {
  const sede = normalizeSede(student.sede || 'unknown-sede');
  const año = normalizeText(student.academicYear || 'unknown-year');
  const materia = normalizeSubject(subject);
  const curso = generateCurso(student.division || 'unknown-division', student.academicYear || 'unknown-year');
  const alumno = generateAlumno(student.studentId || 'unknown-id', student.name || 'Unknown Student');
  const semana = generateSemana(reportDate);

  return {
    sede,
    año,
    materia,
    curso,
    alumno,
    semana
  };
}

/**
 * Generates file path string from hierarchical path
 */
export function generateFilePath(hierarchicalPath: HierarchicalPath): string {
  const { sede, año, materia, curso, alumno, semana } = hierarchicalPath;
  return `${sede}/${año}/${materia}/${curso}/${alumno}/${semana}`;
}

/**
 * Generates JSON file name for a report
 * Format: YYYY-MM-DD_subject_reporte.json
 */
export function generateFileName(date: Date, subject: string): string {
  const dateStr = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
  const normalizedSubject = normalizeSubject(subject);
  return `${dateStr}_${normalizedSubject}_reporte.json`;
}

/**
 * DATA VALIDATION ALGORITHMS
 * Comprehensive validation functions for data integrity
 */

/**
 * Validates student data structure and required fields
 */
export function validateStudentData(student: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validations
  if (!student) {
    errors.push('Student data is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (!student.id || typeof student.id !== 'string') {
    errors.push('Student ID is required and must be a string');
  }

  if (!student.name || typeof student.name !== 'string') {
    errors.push('Student name is required and must be a string');
  }

  if (!student.email || typeof student.email !== 'string') {
    errors.push('Student email is required and must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    warnings.push('Student email format appears invalid');
  }

  if (!student.studentId || typeof student.studentId !== 'string') {
    errors.push('Student studentId is required and must be a string');
  } else if (!/^EST-\d{4}-\d{3}$/.test(student.studentId)) {
    warnings.push('Student studentId does not follow expected format (EST-YYYY-XXX)');
  }

  // Optional field validations
  if (student.sede && typeof student.sede !== 'string') {
    warnings.push('Sede should be a string when provided');
  }

  if (student.academicYear && typeof student.academicYear !== 'string') {
    warnings.push('Academic year should be a string when provided');
  }

  if (student.division && typeof student.division !== 'string') {
    warnings.push('Division should be a string when provided');
  }

  if (student.subjects && !Array.isArray(student.subjects)) {
    warnings.push('Subjects should be an array when provided');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates report data structure and required fields
 */
export function validateReportData(report: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!report) {
    errors.push('Report data is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (!report.id || typeof report.id !== 'string') {
    errors.push('Report ID is required and must be a string');
  }

  if (!report.userId || typeof report.userId !== 'string') {
    errors.push('Report userId is required and must be a string');
  }

  if (!report.subject || typeof report.subject !== 'string') {
    errors.push('Report subject is required and must be a string');
  }

  if (!report.weekStart || typeof report.weekStart !== 'string') {
    errors.push('Report weekStart is required and must be a string');
  } else {
    const weekStartDate = new Date(report.weekStart);
    if (isNaN(weekStartDate.getTime())) {
      errors.push('Report weekStart must be a valid date string');
    }
  }

  if (!report.weekEnd || typeof report.weekEnd !== 'string') {
    errors.push('Report weekEnd is required and must be a string');
  } else {
    const weekEndDate = new Date(report.weekEnd);
    if (isNaN(weekEndDate.getTime())) {
      errors.push('Report weekEnd must be a valid date string');
    }
  }

  if (!report.submittedAt || typeof report.submittedAt !== 'string') {
    errors.push('Report submittedAt is required and must be a string');
  } else {
    const submittedDate = new Date(report.submittedAt);
    if (isNaN(submittedDate.getTime())) {
      errors.push('Report submittedAt must be a valid date string');
    }
  }

  // Validate answers array if present
  if (report.answers) {
    if (!Array.isArray(report.answers)) {
      errors.push('Report answers must be an array when provided');
    } else {
      report.answers.forEach((answer: any, index: number) => {
        if (!answer.id || typeof answer.id !== 'string') {
          warnings.push(`Answer ${index}: ID should be a string`);
        }
        if (!answer.questionId || typeof answer.questionId !== 'string') {
          warnings.push(`Answer ${index}: questionId should be a string`);
        }
        if (!answer.answer || typeof answer.answer !== 'string') {
          warnings.push(`Answer ${index}: answer should be a string`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates hierarchical path structure
 */
export function validateHierarchicalPath(path: HierarchicalPath): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields = ['sede', 'año', 'materia', 'curso', 'alumno', 'semana'];
  
  for (const field of requiredFields) {
    const value = path[field as keyof HierarchicalPath];
    if (!value || typeof value !== 'string') {
      errors.push(`Hierarchical path ${field} is required and must be a string`);
    } else if (value.includes('unknown')) {
      warnings.push(`Hierarchical path ${field} contains "unknown" value: ${value}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * SORTING AND ORGANIZATION ALGORITHMS
 * Deterministic sorting functions for consistent data organization
 */

/**
 * Sorts students by studentId for consistent ordering
 */
export function sortStudentsByStudentId(students: StudentData[]): StudentData[] {
  return [...students].sort((a, b) => {
    const aId = a.studentId || '';
    const bId = b.studentId || '';
    return aId.localeCompare(bId);
  });
}

/**
 * Sorts reports by submission date (newest first) then by subject
 */
export function sortReportsByDateAndSubject(reports: ReportData[]): ReportData[] {
  return [...reports].sort((a, b) => {
    const aDate = new Date(a.submittedAt);
    const bDate = new Date(b.submittedAt);
    
    // Sort by date first (newest first)
    if (aDate.getTime() !== bDate.getTime()) {
      return bDate.getTime() - aDate.getTime();
    }
    
    // Then sort by subject alphabetically
    return (a.subject || '').localeCompare(b.subject || '');
  });
}

/**
 * Groups reports by hierarchical path for organization
 */
export function groupReportsByHierarchicalPath(
  organizedReports: OrganizedReportData[]
): Map<string, OrganizedReportData[]> {
  const grouped = new Map<string, OrganizedReportData[]>();

  for (const organizedReport of organizedReports) {
    const pathKey = organizedReport.fullPath;
    
    if (!grouped.has(pathKey)) {
      grouped.set(pathKey, []);
    }
    
    grouped.get(pathKey)!.push(organizedReport);
  }

  // Sort reports within each group
  Array.from(grouped.entries()).forEach(([pathKey, reports]) => {
    grouped.set(pathKey, sortReportsByDateAndSubject(reports.map(r => r.report)) as any);
  });

  return grouped;
}

/**
 * PERFORMANCE OPTIMIZATION UTILITIES
 * Functions for optimizing algorithm performance with large datasets
 */

/**
 * Processes reports in batches to avoid memory issues with large datasets
 */
export function processBatchedReports<T>(
  reports: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<any>
): Promise<any[]> {
  const batches: T[][] = [];
  
  for (let i = 0; i < reports.length; i += batchSize) {
    batches.push(reports.slice(i, i + batchSize));
  }

  return Promise.all(batches.map(batch => processor(batch)));
}

/**
 * Creates a cache key for hierarchical paths to optimize repeated calculations
 */
export function createPathCacheKey(
  sede: string,
  academicYear: string,
  subject: string,
  division: string,
  studentId: string,
  date: Date
): string {
  const dateStr = date.toISOString().split('T')[0];
  return `${sede}|${academicYear}|${subject}|${division}|${studentId}|${dateStr}`;
}

/**
 * ERROR HANDLING UTILITIES
 * Comprehensive error handling for data processing operations
 */

export class DataOrganizationError extends Error {
  public readonly operation: string;
  public readonly data: any;

  constructor(message: string, operation: string, data?: any) {
    super(message);
    this.name = 'DataOrganizationError';
    this.operation = operation;
    this.data = data;
  }
}

/**
 * Safe wrapper for data processing operations with comprehensive error handling
 */
export function safeDataOperation<T>(
  operation: string,
  data: any,
  processor: () => T
): { success: true; result: T } | { success: false; error: DataOrganizationError } {
  try {
    const result = processor();
    return { success: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: new DataOrganizationError(`${operation}: ${message}`, operation, data)
    };
  }
}

/**
 * Safe wrapper for async data processing operations with comprehensive error handling
 */
export async function safeAsyncDataOperation<T>(
  operation: string,
  data: any,
  processor: () => Promise<T>
): Promise<{ success: true; result: T } | { success: false; error: DataOrganizationError }> {
  try {
    const result = await processor();
    return { success: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: new DataOrganizationError(`${operation}: ${message}`, operation, data)
    };
  }
}

/**
 * LOGGING AND MONITORING UTILITIES
 * Functions for tracking data processing operations
 */

export interface ProcessingMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  recordsProcessed: number;
  errorsEncountered: number;
  warningsGenerated: number;
}

/**
 * Creates a performance monitor for data processing operations
 */
export function createProcessingMonitor(operation: string): {
  start: () => void;
  addRecord: () => void;
  addError: () => void;
  addWarning: () => void;
  finish: () => ProcessingMetrics;
} {
  let startTime = 0;
  let recordsProcessed = 0;
  let errorsEncountered = 0;
  let warningsGenerated = 0;

  return {
    start: () => {
      startTime = Date.now();
    },
    addRecord: () => {
      recordsProcessed++;
    },
    addError: () => {
      errorsEncountered++;
    },
    addWarning: () => {
      warningsGenerated++;
    },
    finish: (): ProcessingMetrics => {
      const endTime = Date.now();
      return {
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        recordsProcessed,
        errorsEncountered,
        warningsGenerated
      };
    }
  };
}

// ===== FASE 4: ADDITIONAL FUNCTIONS FOR FEEDBACK SYSTEM =====

/**
 * Exports report data to JSON file in the hierarchical structure
 * Used by the feedback system to store complete report + feedback data
 */
export async function exportReportToJSON(
  reportData: any,
  sede: string,
  academicYear: string,
  division: string,
  subject: string,
  student: { id: string; name: string; studentId: string; email?: string },
  weekStart?: string
): Promise<string> {
  try {
    // Generate hierarchical path  
    const studentData: StudentData = {
      id: student.id,
      name: student.name,
      email: student.email || '',
      studentId: student.studentId || student.id,
      sede,
      academicYear,
      division,
      subjects: [subject]
    };
    const hierarchicalPath = generateHierarchicalPath(
      studentData,
      subject,
      weekStart ? new Date(weekStart) : new Date()
    );
    
    // Generate file path
    const filePath = generateFilePath(hierarchicalPath);
    const fileName = generateFileName(new Date(weekStart || new Date().toISOString()), subject);
    const fullPath = `${filePath}/${fileName}`;
    
    // In a real implementation, this would write to the file system
    // For now, we'll return the intended path
    console.log(`📄 Would export report to: ${fullPath}`);
    console.log(`📊 Report data size: ${JSON.stringify(reportData).length} characters`);
    
    return fullPath;
    
  } catch (error) {
    console.error('❌ Error exporting report to JSON:', error);
    throw new Error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the intended file path for a student report
 * Used for feedback system file organization
 */
export function getStudentReportPath(
  sede: string,
  academicYear: string,
  division: string,
  subject: string,
  student: { id: string; name: string; studentId: string; email?: string },
  weekStart?: string
): string {
  try {
    const studentData: StudentData = {
      id: student.id,
      name: student.name,
      email: student.email || '',
      studentId: student.studentId || student.id,
      sede,
      academicYear,
      division,
      subjects: [subject]
    };
    const hierarchicalPath = generateHierarchicalPath(
      studentData,
      subject,
      weekStart ? new Date(weekStart) : new Date()
    );
    
    return generateFilePath(hierarchicalPath);
    
  } catch (error) {
    console.error('❌ Error generating student report path:', error);
    return `/data/student-reports/error-path`;
  }
}

/**
 * Creates a complete data package for feedback storage
 * Includes all necessary metadata for the feedback system
 */
export function createFeedbackDataPackage(
  student: StudentData,
  academicContext: any,
  weeklyResponses: { [key: string]: string },
  evaluationResults?: any,
  feedbackContent?: string
): any {
  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      studentId: student.studentId
    },
    academic: {
      sede: student.sede,
      academicYear: student.academicYear,
      division: student.division,
      subject: academicContext.subject
    },
    week: {
      start: academicContext.weekStart,
      end: academicContext.weekEnd
    },
    submittedAt: new Date().toISOString(),
    answers: weeklyResponses,
    evaluation: evaluationResults ? {
      results: evaluationResults,
      averageScore: evaluationResults.reduce((sum: number, result: any) => sum + result.score.totalScore, 0) / evaluationResults.length,
      completedAt: new Date().toISOString()
    } : null,
    feedback: feedbackContent ? {
      content: feedbackContent,
      generatedAt: new Date().toISOString(),
      system: 'FASE-4-Intelligent-Feedback'
    } : null,
    metadata: {
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      hierarchicalPath: generateHierarchicalPath(
        student,
        academicContext.subject,
        new Date(academicContext.weekStart || new Date().toISOString())
      )
    }
  };
}

/**
 * Validates feedback data package before storage
 * Ensures all required fields are present for the feedback system
 */
export function validateFeedbackDataPackage(dataPackage: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate required student data
  if (!dataPackage.student?.id) errors.push('Missing student ID');
  if (!dataPackage.student?.name) errors.push('Missing student name');
  if (!dataPackage.student?.studentId) errors.push('Missing student ID number');
  
  // Validate academic context
  if (!dataPackage.academic?.sede) errors.push('Missing sede information');
  if (!dataPackage.academic?.subject) errors.push('Missing subject information');
  if (!dataPackage.academic?.academicYear) errors.push('Missing academic year');
  
  // Validate week data
  if (!dataPackage.week?.start) errors.push('Missing week start date');
  if (!dataPackage.week?.end) errors.push('Missing week end date');
  
  // Validate answers
  if (!dataPackage.answers || Object.keys(dataPackage.answers).length === 0) {
    warnings.push('No weekly responses found');
  }
  
  // Validate evaluation data if present
  if (dataPackage.evaluation && !dataPackage.evaluation.results) {
    warnings.push('Evaluation data incomplete');
  }
  
  // Validate feedback data if present
  if (dataPackage.feedback && !dataPackage.feedback.content) {
    warnings.push('Feedback content missing');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}