"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataOrganizationError = void 0;
exports.normalizeText = normalizeText;
exports.normalizeStudentName = normalizeStudentName;
exports.normalizeSubject = normalizeSubject;
exports.normalizeSede = normalizeSede;
exports.generateCurso = generateCurso;
exports.generateAlumno = generateAlumno;
exports.calculateWeekOfMonth = calculateWeekOfMonth;
exports.generateSemana = generateSemana;
exports.generateHierarchicalPath = generateHierarchicalPath;
exports.generateFilePath = generateFilePath;
exports.generateFileName = generateFileName;
exports.validateStudentData = validateStudentData;
exports.validateReportData = validateReportData;
exports.validateHierarchicalPath = validateHierarchicalPath;
exports.sortStudentsByStudentId = sortStudentsByStudentId;
exports.sortReportsByDateAndSubject = sortReportsByDateAndSubject;
exports.groupReportsByHierarchicalPath = groupReportsByHierarchicalPath;
exports.processBatchedReports = processBatchedReports;
exports.createPathCacheKey = createPathCacheKey;
exports.safeDataOperation = safeDataOperation;
exports.createProcessingMonitor = createProcessingMonitor;
// Month names for Spanish locale
const MONTH_NAMES = {
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
function normalizeText(text) {
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
function normalizeStudentName(name) {
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
function normalizeSubject(subject) {
    if (!subject || typeof subject !== 'string') {
        return 'unknown-subject';
    }
    return normalizeText(subject);
}
/**
 * Normalizes sede (location) names
 */
function normalizeSede(sede) {
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
function generateCurso(division, academicYear) {
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
function generateAlumno(studentId, studentName) {
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
function calculateWeekOfMonth(date) {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
}
/**
 * Generates semana identifier using month name and week number
 * Format: "mes-semana-N" (e.g., "agosto-semana-2")
 */
function generateSemana(date) {
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const weekNumber = calculateWeekOfMonth(date);
    const monthName = MONTH_NAMES[month] || 'unknown-month';
    return `${monthName}-semana-${weekNumber}`;
}
/**
 * Generates complete hierarchical path for a report
 * Follows hierarchy: sede/año/materia/curso/alumno/semana
 */
function generateHierarchicalPath(student, subject, reportDate) {
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
function generateFilePath(hierarchicalPath) {
    const { sede, año, materia, curso, alumno, semana } = hierarchicalPath;
    return `${sede}/${año}/${materia}/${curso}/${alumno}/${semana}`;
}
/**
 * Generates JSON file name for a report
 * Format: YYYY-MM-DD_subject_reporte.json
 */
function generateFileName(date, subject) {
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
function validateStudentData(student) {
    const errors = [];
    const warnings = [];
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
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
        warnings.push('Student email format appears invalid');
    }
    if (!student.studentId || typeof student.studentId !== 'string') {
        errors.push('Student studentId is required and must be a string');
    }
    else if (!/^EST-\d{4}-\d{3}$/.test(student.studentId)) {
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
function validateReportData(report) {
    const errors = [];
    const warnings = [];
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
    }
    else {
        const weekStartDate = new Date(report.weekStart);
        if (isNaN(weekStartDate.getTime())) {
            errors.push('Report weekStart must be a valid date string');
        }
    }
    if (!report.weekEnd || typeof report.weekEnd !== 'string') {
        errors.push('Report weekEnd is required and must be a string');
    }
    else {
        const weekEndDate = new Date(report.weekEnd);
        if (isNaN(weekEndDate.getTime())) {
            errors.push('Report weekEnd must be a valid date string');
        }
    }
    if (!report.submittedAt || typeof report.submittedAt !== 'string') {
        errors.push('Report submittedAt is required and must be a string');
    }
    else {
        const submittedDate = new Date(report.submittedAt);
        if (isNaN(submittedDate.getTime())) {
            errors.push('Report submittedAt must be a valid date string');
        }
    }
    // Validate answers array if present
    if (report.answers) {
        if (!Array.isArray(report.answers)) {
            errors.push('Report answers must be an array when provided');
        }
        else {
            report.answers.forEach((answer, index) => {
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
function validateHierarchicalPath(path) {
    const errors = [];
    const warnings = [];
    const requiredFields = ['sede', 'año', 'materia', 'curso', 'alumno', 'semana'];
    for (const field of requiredFields) {
        const value = path[field];
        if (!value || typeof value !== 'string') {
            errors.push(`Hierarchical path ${field} is required and must be a string`);
        }
        else if (value.includes('unknown')) {
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
function sortStudentsByStudentId(students) {
    return [...students].sort((a, b) => {
        const aId = a.studentId || '';
        const bId = b.studentId || '';
        return aId.localeCompare(bId);
    });
}
/**
 * Sorts reports by submission date (newest first) then by subject
 */
function sortReportsByDateAndSubject(reports) {
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
function groupReportsByHierarchicalPath(organizedReports) {
    const grouped = new Map();
    for (const organizedReport of organizedReports) {
        const pathKey = organizedReport.fullPath;
        if (!grouped.has(pathKey)) {
            grouped.set(pathKey, []);
        }
        grouped.get(pathKey).push(organizedReport);
    }
    // Sort reports within each group
    for (const [pathKey, reports] of grouped.entries()) {
        grouped.set(pathKey, sortReportsByDateAndSubject(reports.map(r => r.report)));
    }
    return grouped;
}
/**
 * PERFORMANCE OPTIMIZATION UTILITIES
 * Functions for optimizing algorithm performance with large datasets
 */
/**
 * Processes reports in batches to avoid memory issues with large datasets
 */
function processBatchedReports(reports, batchSize, processor) {
    const batches = [];
    for (let i = 0; i < reports.length; i += batchSize) {
        batches.push(reports.slice(i, i + batchSize));
    }
    return Promise.all(batches.map(batch => processor(batch)));
}
/**
 * Creates a cache key for hierarchical paths to optimize repeated calculations
 */
function createPathCacheKey(sede, academicYear, subject, division, studentId, date) {
    const dateStr = date.toISOString().split('T')[0];
    return `${sede}|${academicYear}|${subject}|${division}|${studentId}|${dateStr}`;
}
/**
 * ERROR HANDLING UTILITIES
 * Comprehensive error handling for data processing operations
 */
class DataOrganizationError extends Error {
    constructor(message, operation, data) {
        super(message);
        this.name = 'DataOrganizationError';
        this.operation = operation;
        this.data = data;
    }
}
exports.DataOrganizationError = DataOrganizationError;
/**
 * Safe wrapper for data processing operations with comprehensive error handling
 */
function safeDataOperation(operation, data, processor) {
    try {
        const result = processor();
        return { success: true, result };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: new DataOrganizationError(`${operation}: ${message}`, operation, data)
        };
    }
}
/**
 * Creates a performance monitor for data processing operations
 */
function createProcessingMonitor(operation) {
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
        finish: () => {
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
