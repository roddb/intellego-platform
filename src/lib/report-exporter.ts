/**
 * Report Exporter for Intellego Platform
 * 
 * Implements database to JSON export functionality with the new hierarchical structure.
 * Handles bulk export operations with data integrity validation and error handling.
 * 
 * Hierarchy: sede/año/materia/curso/alumno/semana
 * Export Format: Organized JSON files in hierarchical directory structure
 * 
 * @author Data Structure Specialist
 * @version 2.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { query } from './db';
import {
  StudentData,
  ReportData,
  AnswerData,
  OrganizedReportData,
  ValidationResult,
  ProcessingMetrics,
  DataOrganizationError,
  generateHierarchicalPath,
  generateFilePath,
  generateFileName,
  validateStudentData,
  validateReportData,
  validateHierarchicalPath,
  sortStudentsByStudentId,
  sortReportsByDateAndSubject,
  groupReportsByHierarchicalPath,
  processBatchedReports,
  createPathCacheKey,
  safeDataOperation,
  safeAsyncDataOperation,
  createProcessingMonitor
} from './data-organization';

// Configuration constants
const EXPORT_BASE_PATH = 'data/student-reports';
const BATCH_SIZE = 100; // Process reports in batches of 100
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Export configuration interface
export interface ExportConfig {
  basePath?: string;
  batchSize?: number;
  validateData?: boolean;
  createBackup?: boolean;
  overwriteExisting?: boolean;
  includeAnswers?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filterBySede?: string[];
  filterBySubject?: string[];
}

// Export result interface
export interface ExportResult {
  success: boolean;
  metrics: ProcessingMetrics;
  exportedFiles: string[];
  errors: DataOrganizationError[];
  warnings: string[];
  totalReportsProcessed: number;
  totalFilesCreated: number;
  skippedReports: number;
}

// JSON export format for individual reports
export interface ExportedReportJSON {
  metadata: {
    exportDate: string;
    version: string;
    hierarchicalPath: string;
    student: {
      id: string;
      name: string;
      email: string;
      studentId: string;
      sede: string;
      academicYear: string;
      division: string;
      curso: string;
    };
    report: {
      id: string;
      subject: string;
      weekStart: string;
      weekEnd: string;
      submittedAt: string;
      semana: string;
    };
  };
  data: {
    answers: Array<{
      questionId: string;
      answer: string;
    }>;
  };
}

/**
 * DATABASE QUERY OPERATIONS
 * Optimized queries for bulk data export
 */

/**
 * Fetches all students with complete data for export
 */
async function fetchAllStudents(): Promise<StudentData[]> {
  const monitor = createProcessingMonitor('fetch-all-students');
  monitor.start();

  try {
    const result = await query(`
      SELECT 
        id, name, email, studentId, sede, academicYear, division, subjects, status
      FROM User 
      WHERE role = 'STUDENT' AND status = 'ACTIVE'
      ORDER BY studentId ASC
    `);

    const students: StudentData[] = result.rows.map((row: any) => {
      monitor.addRecord();
      
      // Parse subjects JSON string
      let subjects: string[] = [];
      if (row.subjects) {
        try {
          subjects = typeof row.subjects === 'string' 
            ? row.subjects.split(',').map((s: string) => s.trim()).filter((s: string) => s)
            : [];
        } catch (error) {
          monitor.addWarning();
          console.warn(`Failed to parse subjects for student ${row.studentId}:`, error);
        }
      }

      return {
        id: String(row.id),
        name: String(row.name || ''),
        email: String(row.email || ''),
        studentId: String(row.studentId || ''),
        sede: String(row.sede || ''),
        academicYear: String(row.academicYear || ''),
        division: String(row.division || ''),
        subjects
      };
    });

    console.log(`✅ Fetched ${students.length} students`, monitor.finish());
    return students;

  } catch (error) {
    monitor.addError();
    const metrics = monitor.finish();
    console.error('❌ Failed to fetch students:', error, metrics);
    throw new DataOrganizationError('Failed to fetch students from database', 'fetch-all-students', error);
  }
}

/**
 * Fetches all progress reports with answers for export
 */
async function fetchAllReportsWithAnswers(config: ExportConfig = {}): Promise<ReportData[]> {
  const monitor = createProcessingMonitor('fetch-all-reports');
  monitor.start();

  try {
    // Build WHERE clause based on config filters
    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    if (config.dateRange) {
      whereConditions.push('pr.submittedAt >= ? AND pr.submittedAt <= ?');
      queryParams.push(config.dateRange.start.toISOString(), config.dateRange.end.toISOString());
    }

    if (config.filterBySubject && config.filterBySubject.length > 0) {
      const placeholders = config.filterBySubject.map(() => '?').join(',');
      whereConditions.push(`pr.subject IN (${placeholders})`);
      queryParams.push(...config.filterBySubject);
    }

    if (config.filterBySede && config.filterBySede.length > 0) {
      const placeholders = config.filterBySede.map(() => '?').join(',');
      whereConditions.push(`u.sede IN (${placeholders})`);
      queryParams.push(...config.filterBySede);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Fetch reports with user data
    const reportsQuery = `
      SELECT 
        pr.id, pr.userId, pr.subject, pr.weekStart, pr.weekEnd, pr.submittedAt,
        u.studentId, u.sede
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      ${whereClause}
      ORDER BY pr.submittedAt DESC, pr.subject ASC
    `;

    const reportsResult = await query(reportsQuery, queryParams);
    
    if (reportsResult.rows.length === 0) {
      console.log('ℹ️ No reports found matching criteria', monitor.finish());
      return [];
    }

    // Fetch answers for all reports if needed
    const reports: ReportData[] = [];
    
    if (config.includeAnswers !== false) { // Include answers by default
      for (const reportRow of reportsResult.rows) {
        monitor.addRecord();

        const answersResult = await query(`
          SELECT id, questionId, answer
          FROM Answer
          WHERE progressReportId = ?
          ORDER BY questionId ASC
        `, [reportRow.id]);

        const answers: AnswerData[] = answersResult.rows.map((answerRow: any) => ({
          id: String(answerRow.id),
          questionId: String(answerRow.questionId),
          answer: String(answerRow.answer || '')
        }));

        reports.push({
          id: String(reportRow.id),
          userId: String(reportRow.userId),
          subject: String(reportRow.subject || ''),
          weekStart: String(reportRow.weekStart),
          weekEnd: String(reportRow.weekEnd),
          submittedAt: String(reportRow.submittedAt),
          answers
        });
      }
    } else {
      // Just reports without answers
      for (const reportRow of reportsResult.rows) {
        monitor.addRecord();

        reports.push({
          id: String(reportRow.id),
          userId: String(reportRow.userId),
          subject: String(reportRow.subject || ''),
          weekStart: String(reportRow.weekStart),
          weekEnd: String(reportRow.weekEnd),
          submittedAt: String(reportRow.submittedAt),
          answers: []
        });
      }
    }

    console.log(`✅ Fetched ${reports.length} reports with answers`, monitor.finish());
    return reports;

  } catch (error) {
    monitor.addError();
    const metrics = monitor.finish();
    console.error('❌ Failed to fetch reports:', error, metrics);
    throw new DataOrganizationError('Failed to fetch reports from database', 'fetch-all-reports', error);
  }
}

/**
 * DATA ORGANIZATION OPERATIONS
 * Transform database records into organized report data
 */

/**
 * Organizes raw database data into hierarchical structure
 */
async function organizeReportData(
  students: StudentData[],
  reports: ReportData[],
  config: ExportConfig
): Promise<OrganizedReportData[]> {
  const monitor = createProcessingMonitor('organize-report-data');
  monitor.start();

  const organizedReports: OrganizedReportData[] = [];
  const studentMap = new Map<string, StudentData>();
  const pathCache = new Map<string, any>();

  // Create student lookup map
  for (const student of students) {
    studentMap.set(student.id, student);
  }

  // Process reports in batches
  await processBatchedReports(
    reports,
    config.batchSize || BATCH_SIZE,
    async (batch: ReportData[]) => {
      for (const report of batch) {
        monitor.addRecord();

        const student = studentMap.get(report.userId);
        if (!student) {
          monitor.addError();
          console.warn(`⚠️ Student not found for report ${report.id}, userId: ${report.userId}`);
          continue;
        }

        // Validate data if required
        if (config.validateData !== false) { // Validate by default
          const studentValidation = validateStudentData(student);
          const reportValidation = validateReportData(report);

          if (!studentValidation.isValid || !reportValidation.isValid) {
            monitor.addError();
            console.warn(`⚠️ Invalid data for report ${report.id}:`, {
              studentErrors: studentValidation.errors,
              reportErrors: reportValidation.errors
            });
            continue;
          }

          // Log warnings
          if (studentValidation.warnings.length > 0) {
            monitor.addWarning();
            console.warn(`⚠️ Student data warnings for ${student.studentId}:`, studentValidation.warnings);
          }
          if (reportValidation.warnings.length > 0) {
            monitor.addWarning();
            console.warn(`⚠️ Report data warnings for ${report.id}:`, reportValidation.warnings);
          }
        }

        const reportDate = new Date(report.submittedAt);
        
        // Use cache for path generation to optimize performance
        const cacheKey = createPathCacheKey(
          student.sede,
          student.academicYear,
          report.subject,
          student.division,
          student.studentId,
          reportDate
        );

        let hierarchicalPath;
        if (pathCache.has(cacheKey)) {
          hierarchicalPath = pathCache.get(cacheKey);
        } else {
          hierarchicalPath = generateHierarchicalPath(student, report.subject, reportDate);
          pathCache.set(cacheKey, hierarchicalPath);
        }

        // Validate hierarchical path
        const pathValidation = validateHierarchicalPath(hierarchicalPath);
        if (!pathValidation.isValid) {
          monitor.addError();
          console.warn(`⚠️ Invalid hierarchical path for report ${report.id}:`, pathValidation.errors);
          continue;
        }

        const filePath = generateFilePath(hierarchicalPath);
        const fileName = generateFileName(reportDate, report.subject);
        const fullPath = path.join(filePath, fileName);

        organizedReports.push({
          student,
          report,
          hierarchicalPath,
          fileName,
          fullPath
        });
      }
    }
  );

  console.log(`✅ Organized ${organizedReports.length} reports`, monitor.finish());
  return organizedReports;
}

/**
 * FILE SYSTEM OPERATIONS
 * Handle directory creation and file writing with error handling
 */

/**
 * Ensures directory exists, creating it if necessary
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    } catch (mkdirError) {
      throw new DataOrganizationError(
        `Failed to create directory: ${dirPath}`,
        'ensure-directory-exists',
        { dirPath, error: mkdirError }
      );
    }
  }
}

/**
 * Creates backup of existing file if it exists
 */
async function backupExistingFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    // File exists, create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup-${timestamp}`;
    await fs.copyFile(filePath, backupPath);
    console.log(`💾 Backed up existing file: ${filePath} -> ${backupPath}`);
  } catch (error) {
    // File doesn't exist, no backup needed
  }
}

/**
 * Writes JSON data to file with proper formatting
 */
async function writeJSONFile(filePath: string, data: any): Promise<void> {
  const jsonData = JSON.stringify(data, null, 2);
  
  try {
    await fs.writeFile(filePath, jsonData, 'utf8');
  } catch (error) {
    throw new DataOrganizationError(
      `Failed to write JSON file: ${filePath}`,
      'write-json-file',
      { filePath, error }
    );
  }
}

/**
 * EXPORT OPERATIONS
 * Main export functions that orchestrate the entire process
 */

/**
 * Creates exportable JSON structure from organized report data
 */
function createExportableJSON(organizedReport: OrganizedReportData): ExportedReportJSON {
  const { student, report, hierarchicalPath } = organizedReport;
  const reportDate = new Date(report.submittedAt);

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      hierarchicalPath: generateFilePath(hierarchicalPath),
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        sede: student.sede,
        academicYear: student.academicYear,
        division: student.division,
        curso: hierarchicalPath.curso
      },
      report: {
        id: report.id,
        subject: report.subject,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        submittedAt: report.submittedAt,
        semana: hierarchicalPath.semana
      }
    },
    data: {
      answers: report.answers.map(answer => ({
        questionId: answer.questionId,
        answer: answer.answer
      }))
    }
  };
}

/**
 * Exports organized reports to file system
 */
async function exportOrganizedReports(
  organizedReports: OrganizedReportData[],
  config: ExportConfig
): Promise<{ exportedFiles: string[]; errors: DataOrganizationError[] }> {
  const monitor = createProcessingMonitor('export-organized-reports');
  monitor.start();

  const basePath = config.basePath || EXPORT_BASE_PATH;
  const exportedFiles: string[] = [];
  const errors: DataOrganizationError[] = [];

  await processBatchedReports(
    organizedReports,
    config.batchSize || BATCH_SIZE,
    async (batch: OrganizedReportData[]) => {
      for (const organizedReport of batch) {
        monitor.addRecord();

        const operation = await safeAsyncDataOperation(
          'export-single-report',
          organizedReport,
          async () => {
            const fullDirPath = path.join(basePath, path.dirname(organizedReport.fullPath));
            const fullFilePath = path.join(basePath, organizedReport.fullPath);

            // Ensure directory exists
            await ensureDirectoryExists(fullDirPath);

            // Check if file already exists
            if (!config.overwriteExisting) {
              try {
                await fs.access(fullFilePath);
                console.log(`⏭️ Skipping existing file: ${organizedReport.fullPath}`);
                return null; // Skip this file
              } catch (error) {
                // File doesn't exist, proceed with export
              }
            }

            // Create backup if requested and file exists
            if (config.createBackup) {
              await backupExistingFile(fullFilePath);
            }

            // Create exportable JSON structure
            const exportableData = createExportableJSON(organizedReport);

            // Write JSON file
            await writeJSONFile(fullFilePath, exportableData);

            return fullFilePath;
          }
        );

        if (operation.success) {
          if (operation.result) {
            exportedFiles.push(operation.result);
            console.log(`✅ Exported: ${organizedReport.fullPath}`);
          }
        } else {
          monitor.addError();
          errors.push(operation.error);
          console.error(`❌ Export failed for ${organizedReport.fullPath}:`, operation.error);
        }
      }
    }
  );

  console.log(`📊 Export completed: ${exportedFiles.length} files exported, ${errors.length} errors`, monitor.finish());
  return { exportedFiles, errors };
}

/**
 * MAIN EXPORT FUNCTION
 * Public API for exporting all reports to hierarchical JSON structure
 */

/**
 * Exports all student progress reports to hierarchical JSON file structure
 */
export async function exportAllReportsToJSON(config: ExportConfig = {}): Promise<ExportResult> {
  const overallMonitor = createProcessingMonitor('export-all-reports');
  overallMonitor.start();

  console.log('🚀 Starting report export process...');
  console.log('📋 Configuration:', config);

  let totalReportsProcessed = 0;
  let totalFilesCreated = 0;
  let skippedReports = 0;
  const allErrors: DataOrganizationError[] = [];
  const allWarnings: string[] = [];
  let exportedFiles: string[] = [];

  try {
    // Step 1: Fetch all students
    console.log('👥 Fetching students...');
    const students = await fetchAllStudents();
    if (students.length === 0) {
      throw new DataOrganizationError('No students found in database', 'export-all-reports');
    }
    overallMonitor.addRecord();

    // Step 2: Fetch all reports with answers
    console.log('📄 Fetching reports...');
    const reports = await fetchAllReportsWithAnswers(config);
    if (reports.length === 0) {
      console.log('ℹ️ No reports found matching criteria');
      return {
        success: true,
        metrics: overallMonitor.finish(),
        exportedFiles: [],
        errors: [],
        warnings: ['No reports found matching the specified criteria'],
        totalReportsProcessed: 0,
        totalFilesCreated: 0,
        skippedReports: 0
      };
    }
    totalReportsProcessed = reports.length;
    overallMonitor.addRecord();

    // Step 3: Organize report data into hierarchical structure
    console.log('🗂️ Organizing data...');
    const organizedReports = await organizeReportData(students, reports, config);
    skippedReports = totalReportsProcessed - organizedReports.length;
    overallMonitor.addRecord();

    if (organizedReports.length === 0) {
      throw new DataOrganizationError('No valid reports found after data organization', 'export-all-reports');
    }

    // Step 4: Export to file system
    console.log('💾 Exporting to files...');
    const exportResult = await exportOrganizedReports(organizedReports, config);
    exportedFiles = exportResult.exportedFiles;
    allErrors.push(...exportResult.errors);
    totalFilesCreated = exportedFiles.length;
    overallMonitor.addRecord();

    // Step 5: Generate summary
    const metrics = overallMonitor.finish();
    
    console.log('✅ Export process completed successfully!');
    console.log(`📊 Summary:
      - Reports processed: ${totalReportsProcessed}
      - Files created: ${totalFilesCreated}
      - Skipped reports: ${skippedReports}
      - Errors encountered: ${allErrors.length}
      - Processing time: ${metrics.duration}ms
    `);

    return {
      success: true,
      metrics,
      exportedFiles,
      errors: allErrors,
      warnings: allWarnings,
      totalReportsProcessed,
      totalFilesCreated,
      skippedReports
    };

  } catch (error) {
    overallMonitor.addError();
    const metrics = overallMonitor.finish();
    
    const exportError = error instanceof DataOrganizationError 
      ? error 
      : new DataOrganizationError(
          `Export process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'export-all-reports',
          error
        );

    console.error('❌ Export process failed:', exportError);

    return {
      success: false,
      metrics,
      exportedFiles,
      errors: [...allErrors, exportError],
      warnings: allWarnings,
      totalReportsProcessed,
      totalFilesCreated,
      skippedReports
    };
  }
}

/**
 * UTILITY FUNCTIONS
 * Helper functions for export operations
 */

/**
 * Exports a single report by ID (useful for testing or selective exports)
 */
export async function exportSingleReport(
  reportId: string, 
  config: ExportConfig = {}
): Promise<ExportResult> {
  console.log(`🎯 Exporting single report: ${reportId}`);
  
  try {
    // Fetch specific report
    const reportResult = await query(`
      SELECT pr.*, u.id as userId, u.name, u.email, u.studentId, 
             u.sede, u.academicYear, u.division, u.subjects
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.id = ?
      LIMIT 1
    `, [reportId]);

    if (reportResult.rows.length === 0) {
      throw new DataOrganizationError(`Report not found: ${reportId}`, 'export-single-report');
    }

    const reportRow = reportResult.rows[0];
    
    // Build student and report objects
    const student: StudentData = {
      id: String(reportRow.userId),
      name: String(reportRow.name),
      email: String(reportRow.email),
      studentId: String(reportRow.studentId),
      sede: String(reportRow.sede || ''),
      academicYear: String(reportRow.academicYear || ''),
      division: String(reportRow.division || ''),
      subjects: reportRow.subjects ? String(reportRow.subjects).split(',').map(s => s.trim()) : []
    };

    // Fetch answers
    const answersResult = await query(`
      SELECT id, questionId, answer
      FROM Answer
      WHERE progressReportId = ?
      ORDER BY questionId ASC
    `, [reportId]);

    const answers: AnswerData[] = answersResult.rows.map(row => ({
      id: String(row.id),
      questionId: String(row.questionId),
      answer: String(row.answer)
    }));

    const report: ReportData = {
      id: String(reportRow.id),
      userId: String(reportRow.userId),
      subject: String(reportRow.subject),
      weekStart: String(reportRow.weekStart),
      weekEnd: String(reportRow.weekEnd),
      submittedAt: String(reportRow.submittedAt),
      answers
    };

    // Use main export function with single report
    const filteredConfig: ExportConfig = {
      ...config,
      dateRange: undefined, // Don't filter by date for single report
      filterBySubject: undefined,
      filterBySede: undefined
    };

    // Simulate the export process for single report
    const organizedReports = await organizeReportData([student], [report], filteredConfig);
    
    if (organizedReports.length === 0) {
      throw new DataOrganizationError(`Failed to organize report: ${reportId}`, 'export-single-report');
    }

    const exportResult = await exportOrganizedReports(organizedReports, filteredConfig);

    return {
      success: true,
      metrics: {
        operation: 'export-single-report',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        recordsProcessed: 1,
        errorsEncountered: exportResult.errors.length,
        warningsGenerated: 0
      },
      exportedFiles: exportResult.exportedFiles,
      errors: exportResult.errors,
      warnings: [],
      totalReportsProcessed: 1,
      totalFilesCreated: exportResult.exportedFiles.length,
      skippedReports: 0
    };

  } catch (error) {
    const exportError = error instanceof DataOrganizationError 
      ? error 
      : new DataOrganizationError(
          `Single report export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'export-single-report',
          error
        );

    return {
      success: false,
      metrics: {
        operation: 'export-single-report',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        recordsProcessed: 0,
        errorsEncountered: 1,
        warningsGenerated: 0
      },
      exportedFiles: [],
      errors: [exportError],
      warnings: [],
      totalReportsProcessed: 0,
      totalFilesCreated: 0,
      skippedReports: 0
    };
  }
}

/**
 * Gets export statistics without actually exporting files
 */
export async function getExportStatistics(config: ExportConfig = {}): Promise<{
  totalStudents: number;
  totalReports: number;
  reportsBySubject: Record<string, number>;
  reportsBySede: Record<string, number>;
  estimatedFiles: number;
}> {
  console.log('📊 Calculating export statistics...');

  try {
    const students = await fetchAllStudents();
    const reports = await fetchAllReportsWithAnswers(config);

    const reportsBySubject: Record<string, number> = {};
    const reportsBySede: Record<string, number> = {};

    const studentMap = new Map<string, StudentData>();
    for (const student of students) {
      studentMap.set(student.id, student);
    }

    for (const report of reports) {
      // Count by subject
      const subject = report.subject || 'unknown';
      reportsBySubject[subject] = (reportsBySubject[subject] || 0) + 1;

      // Count by sede
      const student = studentMap.get(report.userId);
      const sede = student?.sede || 'unknown';
      reportsBySede[sede] = (reportsBySede[sede] || 0) + 1;
    }

    return {
      totalStudents: students.length,
      totalReports: reports.length,
      reportsBySubject,
      reportsBySede,
      estimatedFiles: reports.length // One file per report
    };

  } catch (error) {
    console.error('❌ Failed to calculate export statistics:', error);
    throw new DataOrganizationError(
      `Failed to calculate export statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'get-export-statistics',
      error
    );
  }
}