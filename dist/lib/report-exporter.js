"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAllReportsToJSON = exportAllReportsToJSON;
exports.exportSingleReport = exportSingleReport;
exports.getExportStatistics = getExportStatistics;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const db_1 = require("./db");
const data_organization_1 = require("./data-organization");
// Configuration constants
const EXPORT_BASE_PATH = 'data/student-reports';
const BATCH_SIZE = 100; // Process reports in batches of 100
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
/**
 * DATABASE QUERY OPERATIONS
 * Optimized queries for bulk data export
 */
/**
 * Fetches all students with complete data for export
 */
async function fetchAllStudents() {
    const monitor = (0, data_organization_1.createProcessingMonitor)('fetch-all-students');
    monitor.start();
    try {
        const result = await (0, db_1.query)(`
      SELECT 
        id, name, email, studentId, sede, academicYear, division, subjects, status
      FROM User 
      WHERE role = 'STUDENT' AND status = 'ACTIVE'
      ORDER BY studentId ASC
    `);
        const students = result.rows.map((row) => {
            monitor.addRecord();
            // Parse subjects JSON string
            let subjects = [];
            if (row.subjects) {
                try {
                    subjects = typeof row.subjects === 'string'
                        ? row.subjects.split(',').map((s) => s.trim()).filter((s) => s)
                        : [];
                }
                catch (error) {
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
    }
    catch (error) {
        monitor.addError();
        const metrics = monitor.finish();
        console.error('❌ Failed to fetch students:', error, metrics);
        throw new data_organization_1.DataOrganizationError('Failed to fetch students from database', 'fetch-all-students', error);
    }
}
/**
 * Fetches all progress reports with answers for export
 */
async function fetchAllReportsWithAnswers(config = {}) {
    const monitor = (0, data_organization_1.createProcessingMonitor)('fetch-all-reports');
    monitor.start();
    try {
        // Build WHERE clause based on config filters
        let whereConditions = [];
        let queryParams = [];
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
        const reportsResult = await (0, db_1.query)(reportsQuery, queryParams);
        if (reportsResult.rows.length === 0) {
            console.log('ℹ️ No reports found matching criteria', monitor.finish());
            return [];
        }
        // Fetch answers for all reports if needed
        const reports = [];
        if (config.includeAnswers !== false) { // Include answers by default
            for (const reportRow of reportsResult.rows) {
                monitor.addRecord();
                const answersResult = await (0, db_1.query)(`
          SELECT id, questionId, answer
          FROM Answer
          WHERE progressReportId = ?
          ORDER BY questionId ASC
        `, [reportRow.id]);
                const answers = answersResult.rows.map((answerRow) => ({
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
        }
        else {
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
    }
    catch (error) {
        monitor.addError();
        const metrics = monitor.finish();
        console.error('❌ Failed to fetch reports:', error, metrics);
        throw new data_organization_1.DataOrganizationError('Failed to fetch reports from database', 'fetch-all-reports', error);
    }
}
/**
 * DATA ORGANIZATION OPERATIONS
 * Transform database records into organized report data
 */
/**
 * Organizes raw database data into hierarchical structure
 */
async function organizeReportData(students, reports, config) {
    const monitor = (0, data_organization_1.createProcessingMonitor)('organize-report-data');
    monitor.start();
    const organizedReports = [];
    const studentMap = new Map();
    const pathCache = new Map();
    // Create student lookup map
    for (const student of students) {
        studentMap.set(student.id, student);
    }
    // Process reports in batches
    await (0, data_organization_1.processBatchedReports)(reports, config.batchSize || BATCH_SIZE, async (batch) => {
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
                const studentValidation = (0, data_organization_1.validateStudentData)(student);
                const reportValidation = (0, data_organization_1.validateReportData)(report);
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
            const cacheKey = (0, data_organization_1.createPathCacheKey)(student.sede, student.academicYear, report.subject, student.division, student.studentId, reportDate);
            let hierarchicalPath;
            if (pathCache.has(cacheKey)) {
                hierarchicalPath = pathCache.get(cacheKey);
            }
            else {
                hierarchicalPath = (0, data_organization_1.generateHierarchicalPath)(student, report.subject, reportDate);
                pathCache.set(cacheKey, hierarchicalPath);
            }
            // Validate hierarchical path
            const pathValidation = (0, data_organization_1.validateHierarchicalPath)(hierarchicalPath);
            if (!pathValidation.isValid) {
                monitor.addError();
                console.warn(`⚠️ Invalid hierarchical path for report ${report.id}:`, pathValidation.errors);
                continue;
            }
            const filePath = (0, data_organization_1.generateFilePath)(hierarchicalPath);
            const fileName = (0, data_organization_1.generateFileName)(reportDate, report.subject);
            const fullPath = path.join(filePath, fileName);
            organizedReports.push({
                student,
                report,
                hierarchicalPath,
                fileName,
                fullPath
            });
        }
    });
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
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    }
    catch (error) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`📁 Created directory: ${dirPath}`);
        }
        catch (mkdirError) {
            throw new data_organization_1.DataOrganizationError(`Failed to create directory: ${dirPath}`, 'ensure-directory-exists', { dirPath, error: mkdirError });
        }
    }
}
/**
 * Creates backup of existing file if it exists
 */
async function backupExistingFile(filePath) {
    try {
        await fs.access(filePath);
        // File exists, create backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${filePath}.backup-${timestamp}`;
        await fs.copyFile(filePath, backupPath);
        console.log(`💾 Backed up existing file: ${filePath} -> ${backupPath}`);
    }
    catch (error) {
        // File doesn't exist, no backup needed
    }
}
/**
 * Writes JSON data to file with proper formatting
 */
async function writeJSONFile(filePath, data) {
    const jsonData = JSON.stringify(data, null, 2);
    try {
        await fs.writeFile(filePath, jsonData, 'utf8');
    }
    catch (error) {
        throw new data_organization_1.DataOrganizationError(`Failed to write JSON file: ${filePath}`, 'write-json-file', { filePath, error });
    }
}
/**
 * EXPORT OPERATIONS
 * Main export functions that orchestrate the entire process
 */
/**
 * Creates exportable JSON structure from organized report data
 */
function createExportableJSON(organizedReport) {
    const { student, report, hierarchicalPath } = organizedReport;
    const reportDate = new Date(report.submittedAt);
    return {
        metadata: {
            exportDate: new Date().toISOString(),
            version: '2.0.0',
            hierarchicalPath: (0, data_organization_1.generateFilePath)(hierarchicalPath),
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
async function exportOrganizedReports(organizedReports, config) {
    const monitor = (0, data_organization_1.createProcessingMonitor)('export-organized-reports');
    monitor.start();
    const basePath = config.basePath || EXPORT_BASE_PATH;
    const exportedFiles = [];
    const errors = [];
    await (0, data_organization_1.processBatchedReports)(organizedReports, config.batchSize || BATCH_SIZE, async (batch) => {
        for (const organizedReport of batch) {
            monitor.addRecord();
            const operation = (0, data_organization_1.safeDataOperation)('export-single-report', organizedReport, async () => {
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
                    }
                    catch (error) {
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
            });
            if (operation.success) {
                if (operation.result) {
                    exportedFiles.push(operation.result);
                    console.log(`✅ Exported: ${organizedReport.fullPath}`);
                }
            }
            else {
                monitor.addError();
                errors.push(operation.error);
                console.error(`❌ Export failed for ${organizedReport.fullPath}:`, operation.error);
            }
        }
    });
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
async function exportAllReportsToJSON(config = {}) {
    const overallMonitor = (0, data_organization_1.createProcessingMonitor)('export-all-reports');
    overallMonitor.start();
    console.log('🚀 Starting report export process...');
    console.log('📋 Configuration:', config);
    let totalReportsProcessed = 0;
    let totalFilesCreated = 0;
    let skippedReports = 0;
    const allErrors = [];
    const allWarnings = [];
    let exportedFiles = [];
    try {
        // Step 1: Fetch all students
        console.log('👥 Fetching students...');
        const students = await fetchAllStudents();
        if (students.length === 0) {
            throw new data_organization_1.DataOrganizationError('No students found in database', 'export-all-reports');
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
            throw new data_organization_1.DataOrganizationError('No valid reports found after data organization', 'export-all-reports');
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
    }
    catch (error) {
        overallMonitor.addError();
        const metrics = overallMonitor.finish();
        const exportError = error instanceof data_organization_1.DataOrganizationError
            ? error
            : new data_organization_1.DataOrganizationError(`Export process failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'export-all-reports', error);
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
async function exportSingleReport(reportId, config = {}) {
    console.log(`🎯 Exporting single report: ${reportId}`);
    try {
        // Fetch specific report
        const reportResult = await (0, db_1.query)(`
      SELECT pr.*, u.id as userId, u.name, u.email, u.studentId, 
             u.sede, u.academicYear, u.division, u.subjects
      FROM ProgressReport pr
      JOIN User u ON pr.userId = u.id
      WHERE pr.id = ?
      LIMIT 1
    `, [reportId]);
        if (reportResult.rows.length === 0) {
            throw new data_organization_1.DataOrganizationError(`Report not found: ${reportId}`, 'export-single-report');
        }
        const reportRow = reportResult.rows[0];
        // Build student and report objects
        const student = {
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
        const answersResult = await (0, db_1.query)(`
      SELECT id, questionId, answer
      FROM Answer
      WHERE progressReportId = ?
      ORDER BY questionId ASC
    `, [reportId]);
        const answers = answersResult.rows.map(row => ({
            id: String(row.id),
            questionId: String(row.questionId),
            answer: String(row.answer)
        }));
        const report = {
            id: String(reportRow.id),
            userId: String(reportRow.userId),
            subject: String(reportRow.subject),
            weekStart: String(reportRow.weekStart),
            weekEnd: String(reportRow.weekEnd),
            submittedAt: String(reportRow.submittedAt),
            answers
        };
        // Use main export function with single report
        const filteredConfig = {
            ...config,
            dateRange: undefined, // Don't filter by date for single report
            filterBySubject: undefined,
            filterBySede: undefined
        };
        // Simulate the export process for single report
        const organizedReports = await organizeReportData([student], [report], filteredConfig);
        if (organizedReports.length === 0) {
            throw new data_organization_1.DataOrganizationError(`Failed to organize report: ${reportId}`, 'export-single-report');
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
    }
    catch (error) {
        const exportError = error instanceof data_organization_1.DataOrganizationError
            ? error
            : new data_organization_1.DataOrganizationError(`Single report export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'export-single-report', error);
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
async function getExportStatistics(config = {}) {
    console.log('📊 Calculating export statistics...');
    try {
        const students = await fetchAllStudents();
        const reports = await fetchAllReportsWithAnswers(config);
        const reportsBySubject = {};
        const reportsBySede = {};
        const studentMap = new Map();
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
    }
    catch (error) {
        console.error('❌ Failed to calculate export statistics:', error);
        throw new data_organization_1.DataOrganizationError(`Failed to calculate export statistics: ${error instanceof Error ? error.message : 'Unknown error'}`, 'get-export-statistics', error);
    }
}
