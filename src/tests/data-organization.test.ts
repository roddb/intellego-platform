/**
 * Comprehensive Test Suite for Data Organization Algorithms
 * 
 * Tests all algorithms with real data scenarios, edge cases, and performance
 * requirements. Ensures data integrity and algorithm correctness.
 * 
 * @author Data Structure Specialist
 * @version 2.0.0
 */

import {
  // Core type definitions
  StudentData,
  ReportData,
  AnswerData,
  HierarchicalPath,
  OrganizedReportData,
  ValidationResult,
  ProcessingMetrics,
  DataOrganizationError,
  
  // Text normalization functions
  normalizeText,
  normalizeStudentName,
  normalizeSubject,
  normalizeSede,
  
  // Hierarchical path generation
  generateCurso,
  generateAlumno,
  calculateWeekOfMonth,
  generateSemana,
  generateHierarchicalPath,
  generateFilePath,
  generateFileName,
  
  // Validation functions
  validateStudentData,
  validateReportData,
  validateHierarchicalPath,
  
  // Sorting and organization
  sortStudentsByStudentId,
  sortReportsByDateAndSubject,
  groupReportsByHierarchicalPath,
  
  // Utility functions
  processBatchedReports,
  createPathCacheKey,
  safeDataOperation,
  createProcessingMonitor
} from '../lib/data-organization';

/**
 * TEST DATA FIXTURES
 * Real-world data scenarios for comprehensive testing
 */

// Sample student data with various edge cases
const SAMPLE_STUDENTS: StudentData[] = [
  {
    id: 'u_abc123def456',
    name: 'María José González Fernández',
    email: 'maria.gonzalez@estudiante.com',
    studentId: 'EST-2025-001',
    sede: 'Congreso',
    academicYear: '4to-año',
    division: 'C',
    subjects: ['física', 'química', 'matemática']
  },
  {
    id: 'u_def456ghi789',
    name: 'Juan Carlos Rodríguez',
    email: 'juan.rodriguez@test.edu',
    studentId: 'EST-2025-002',
    sede: 'Colegiales',
    academicYear: '5to-año',
    division: 'D',
    subjects: ['física', 'biología']
  },
  {
    id: 'u_ghi789jkl012',
    name: 'Ana Sofía Martínez',
    email: 'ana.martinez@example.org',
    studentId: 'EST-2025-003',
    sede: 'Belgrano Norte',
    academicYear: '3er-año',
    division: 'A',
    subjects: ['química', 'matemática', 'literatura']
  },
  // Edge case: Student with missing optional data
  {
    id: 'u_missing123',
    name: 'Test Student',
    email: 'test@example.com',
    studentId: 'EST-2025-004',
    sede: '',
    academicYear: '',
    division: '',
    subjects: []
  }
];

// Sample report data with answers
const SAMPLE_REPORTS: ReportData[] = [
  {
    id: 'r_report123',
    userId: 'u_abc123def456',
    subject: 'física',
    weekStart: '2025-08-04T00:00:00.000Z', // Week 1 of August
    weekEnd: '2025-08-10T23:59:59.999Z',
    submittedAt: '2025-08-09T15:30:00.000Z',
    answers: [
      {
        id: 'a_answer1',
        questionId: 'q_understanding',
        answer: 'Comprendí completamente los conceptos de física cuántica'
      },
      {
        id: 'a_answer2',
        questionId: 'q_difficulties',
        answer: 'Tuve algunas dificultades con las ecuaciones de Schrödinger'
      }
    ]
  },
  {
    id: 'r_report456',
    userId: 'u_def456ghi789',
    subject: 'biología',
    weekStart: '2025-08-11T00:00:00.000Z', // Week 2 of August
    weekEnd: '2025-08-17T23:59:59.999Z',
    submittedAt: '2025-08-15T10:45:00.000Z',
    answers: [
      {
        id: 'a_answer3',
        questionId: 'q_understanding',
        answer: 'Los temas de genética fueron muy claros'
      }
    ]
  },
  // Edge case: Report with special characters in subject
  {
    id: 'r_special_chars',
    userId: 'u_ghi789jkl012',
    subject: 'Educación Física & Deportes',
    weekStart: '2025-08-18T00:00:00.000Z', // Week 3 of August
    weekEnd: '2025-08-24T23:59:59.999Z',
    submittedAt: '2025-08-22T14:20:00.000Z',
    answers: []
  }
];

/**
 * TEXT NORMALIZATION TESTS
 * Test all text normalization algorithms
 */

describe('Text Normalization Algorithms', () => {
  
  describe('normalizeText()', () => {
    test('should handle Spanish characters and accents', () => {
      expect(normalizeText('Educación Física')).toBe('educacion-fisica');
      expect(normalizeText('Matemática Avanzada')).toBe('matematica-avanzada');
      expect(normalizeText('Químico-Biológico')).toBe('quimico-biologico');
    });

    test('should handle special characters and symbols', () => {
      expect(normalizeText('Física & Química')).toBe('fisica-quimica');
      expect(normalizeText('C++ Programming')).toBe('c-programming');
      expect(normalizeText('100% Testing!')).toBe('100-testing');
    });

    test('should handle multiple spaces and hyphens', () => {
      expect(normalizeText('Multi   Space    Text')).toBe('multi-space-text');
      expect(normalizeText('Already--Hyphenated--Text')).toBe('already-hyphenated-text');
    });

    test('should handle edge cases', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText('   ')).toBe('');
      expect(normalizeText('123')).toBe('123');
      expect(normalizeText('ñoño')).toBe('nono');
    });

    test('should handle invalid input', () => {
      expect(normalizeText(null as any)).toBe('');
      expect(normalizeText(undefined as any)).toBe('');
      expect(normalizeText(123 as any)).toBe('');
    });
  });

  describe('normalizeStudentName()', () => {
    test('should normalize compound Spanish names', () => {
      expect(normalizeStudentName('María José González Fernández')).toBe('maria-jose-gonzalez-fernandez');
      expect(normalizeStudentName('Juan Carlos de la Cruz')).toBe('juan-carlos-de-la-cruz');
    });

    test('should handle single names', () => {
      expect(normalizeStudentName('Ana')).toBe('ana');
      expect(normalizeStudentName('José')).toBe('jose');
    });

    test('should handle edge cases', () => {
      expect(normalizeStudentName('')).toBe('unknown-student');
      expect(normalizeStudentName('   ')).toBe('unknown-student');
      expect(normalizeStudentName('123 Test')).toBe('123-test');
    });
  });

  describe('normalizeSubject()', () => {
    test('should normalize standard subjects', () => {
      expect(normalizeSubject('Física')).toBe('fisica');
      expect(normalizeSubject('Matemática')).toBe('matematica');
      expect(normalizeSubject('Educación Física')).toBe('educacion-fisica');
    });

    test('should handle invalid subjects', () => {
      expect(normalizeSubject('')).toBe('unknown-subject');
      expect(normalizeSubject(null as any)).toBe('unknown-subject');
    });
  });

  describe('normalizeSede()', () => {
    test('should normalize sede names', () => {
      expect(normalizeSede('Belgrano Norte')).toBe('belgrano-norte');
      expect(normalizeSede('Congreso')).toBe('congreso');
      expect(normalizeSede('COLEGIALES')).toBe('colegiales');
    });

    test('should handle edge cases', () => {
      expect(normalizeSede('')).toBe('unknown-sede');
      expect(normalizeSede('  ')).toBe('unknown-sede');
    });
  });
});

/**
 * HIERARCHICAL PATH GENERATION TESTS
 * Test hierarchical path generation algorithms
 */

describe('Hierarchical Path Generation', () => {
  
  describe('generateCurso()', () => {
    test('should generate correct curso format', () => {
      expect(generateCurso('C', '4to-año')).toBe('c-4to-ano');
      expect(generateCurso('D', '5to-año')).toBe('d-5to-ano');
      expect(generateCurso('A', '3er-año')).toBe('a-3er-ano');
    });

    test('should handle edge cases', () => {
      expect(generateCurso('', '')).toBe('unknown-curso');
      expect(generateCurso('C', '')).toBe('unknown-curso');
      expect(generateCurso('', '4to-año')).toBe('unknown-curso');
    });
  });

  describe('generateAlumno()', () => {
    test('should generate correct alumno format', () => {
      expect(generateAlumno('EST-2025-001', 'María José González'))
        .toBe('EST-2025-001_maria-jose-gonzalez');
      expect(generateAlumno('EST-2025-002', 'Juan Carlos'))
        .toBe('EST-2025-002_juan-carlos');
    });

    test('should handle edge cases', () => {
      expect(generateAlumno('', 'Test Student')).toBe('unknown-student');
      expect(generateAlumno('EST-2025-001', '')).toBe('EST-2025-001_unknown-student');
    });
  });

  describe('calculateWeekOfMonth()', () => {
    test('should calculate correct week numbers', () => {
      // Week 1: Days 1-7
      expect(calculateWeekOfMonth(new Date('2025-08-01'))).toBe(1);
      expect(calculateWeekOfMonth(new Date('2025-08-07'))).toBe(1);
      
      // Week 2: Days 8-14
      expect(calculateWeekOfMonth(new Date('2025-08-08'))).toBe(2);
      expect(calculateWeekOfMonth(new Date('2025-08-14'))).toBe(2);
      
      // Week 3: Days 15-21
      expect(calculateWeekOfMonth(new Date('2025-08-15'))).toBe(3);
      expect(calculateWeekOfMonth(new Date('2025-08-21'))).toBe(3);
      
      // Week 4: Days 22-28
      expect(calculateWeekOfMonth(new Date('2025-08-22'))).toBe(4);
      expect(calculateWeekOfMonth(new Date('2025-08-28'))).toBe(4);
      
      // Week 5: Days 29+
      expect(calculateWeekOfMonth(new Date('2025-08-29'))).toBe(5);
      expect(calculateWeekOfMonth(new Date('2025-08-31'))).toBe(5);
    });

    test('should handle different months', () => {
      expect(calculateWeekOfMonth(new Date('2025-02-28'))).toBe(4); // Feb 28
      expect(calculateWeekOfMonth(new Date('2025-12-31'))).toBe(5); // Dec 31
      expect(calculateWeekOfMonth(new Date('2025-01-01'))).toBe(1); // Jan 1
    });
  });

  describe('generateSemana()', () => {
    test('should generate correct semana format', () => {
      expect(generateSemana(new Date('2025-08-05'))).toBe('agosto-semana-1');
      expect(generateSemana(new Date('2025-08-15'))).toBe('agosto-semana-3');
      expect(generateSemana(new Date('2025-12-31'))).toBe('diciembre-semana-5');
    });

    test('should handle all months', () => {
      expect(generateSemana(new Date('2025-01-15'))).toBe('enero-semana-3');
      expect(generateSemana(new Date('2025-06-10'))).toBe('junio-semana-2');
      expect(generateSemana(new Date('2025-11-25'))).toBe('noviembre-semana-4');
    });
  });

  describe('generateHierarchicalPath()', () => {
    test('should generate complete hierarchical path', () => {
      const student = SAMPLE_STUDENTS[0]; // María José González Fernández
      const reportDate = new Date('2025-08-09'); // Week 2 of August
      
      const path = generateHierarchicalPath(student, 'física', reportDate);
      
      expect(path).toEqual({
        sede: 'congreso',
        año: '4to-ano',
        materia: 'fisica',
        curso: 'c-4to-ano',
        alumno: 'EST-2025-001_maria-jose-gonzalez-fernandez',
        semana: 'agosto-semana-2'
      });
    });

    test('should handle missing data gracefully', () => {
      const incompleteStudent = SAMPLE_STUDENTS[3]; // Student with missing data
      const reportDate = new Date('2025-08-09');
      
      const path = generateHierarchicalPath(incompleteStudent, 'test-subject', reportDate);
      
      expect(path.sede).toBe('unknown-sede');
      expect(path.año).toBe('unknown-year');
      expect(path.curso).toBe('unknown-division-unknown-year');
    });
  });

  describe('generateFilePath()', () => {
    test('should generate correct file path', () => {
      const hierarchicalPath: HierarchicalPath = {
        sede: 'congreso',
        año: '4to-ano',
        materia: 'fisica',
        curso: 'c-4to-ano',
        alumno: 'EST-2025-001_maria-jose-gonzalez-fernandez',
        semana: 'agosto-semana-2'
      };
      
      const expected = 'congreso/4to-ano/fisica/c-4to-ano/EST-2025-001_maria-jose-gonzalez-fernandez/agosto-semana-2';
      expect(generateFilePath(hierarchicalPath)).toBe(expected);
    });
  });

  describe('generateFileName()', () => {
    test('should generate correct file names', () => {
      const date = new Date('2025-08-09');
      expect(generateFileName(date, 'física')).toBe('2025-08-09_fisica_reporte.json');
      expect(generateFileName(date, 'Educación Física')).toBe('2025-08-09_educacion-fisica_reporte.json');
    });
  });
});

/**
 * DATA VALIDATION TESTS
 * Test all validation algorithms
 */

describe('Data Validation', () => {
  
  describe('validateStudentData()', () => {
    test('should validate correct student data', () => {
      const result = validateStudentData(SAMPLE_STUDENTS[0]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidStudent = {
        // Missing id, name, email, studentId
        sede: 'Test',
        academicYear: '4to-año'
      };
      
      const result = validateStudentData(invalidStudent);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Student ID is required and must be a string');
      expect(result.errors).toContain('Student name is required and must be a string');
    });

    test('should detect invalid email format', () => {
      const invalidStudent = {
        ...SAMPLE_STUDENTS[0],
        email: 'invalid-email'
      };
      
      const result = validateStudentData(invalidStudent);
      expect(result.warnings).toContain('Student email format appears invalid');
    });

    test('should detect invalid studentId format', () => {
      const invalidStudent = {
        ...SAMPLE_STUDENTS[0],
        studentId: 'INVALID-ID'
      };
      
      const result = validateStudentData(invalidStudent);
      expect(result.warnings).toContain('Student studentId does not follow expected format (EST-YYYY-XXX)');
    });

    test('should handle null/undefined input', () => {
      const result = validateStudentData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Student data is null or undefined');
    });
  });

  describe('validateReportData()', () => {
    test('should validate correct report data', () => {
      const result = validateReportData(SAMPLE_REPORTS[0]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidReport = {
        // Missing required fields
        subject: 'test'
      };
      
      const result = validateReportData(invalidReport);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should detect invalid date formats', () => {
      const invalidReport = {
        ...SAMPLE_REPORTS[0],
        weekStart: 'not-a-date',
        weekEnd: 'also-not-a-date'
      };
      
      const result = validateReportData(invalidReport);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Report weekStart must be a valid date string');
      expect(result.errors).toContain('Report weekEnd must be a valid date string');
    });

    test('should validate answers array', () => {
      const reportWithInvalidAnswers = {
        ...SAMPLE_REPORTS[0],
        answers: [
          { questionId: 'q1' }, // Missing answer and id
          { answer: 'test' } // Missing questionId and id
        ]
      };
      
      const result = validateReportData(reportWithInvalidAnswers);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateHierarchicalPath()', () => {
    test('should validate correct hierarchical path', () => {
      const validPath: HierarchicalPath = {
        sede: 'congreso',
        año: '4to-ano',
        materia: 'fisica',
        curso: 'c-4to-ano',
        alumno: 'EST-2025-001_maria-gonzalez',
        semana: 'agosto-semana-2'
      };
      
      const result = validateHierarchicalPath(validPath);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing path components', () => {
      const invalidPath = {
        sede: 'congreso',
        año: '',
        materia: 'fisica'
        // Missing curso, alumno, semana
      } as HierarchicalPath;
      
      const result = validateHierarchicalPath(invalidPath);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should warn about unknown values', () => {
      const pathWithUnknowns: HierarchicalPath = {
        sede: 'unknown-sede',
        año: 'unknown-year',
        materia: 'fisica',
        curso: 'unknown-curso',
        alumno: 'unknown-student',
        semana: 'agosto-semana-1'
      };
      
      const result = validateHierarchicalPath(pathWithUnknowns);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

/**
 * SORTING AND ORGANIZATION TESTS
 * Test sorting and grouping algorithms
 */

describe('Sorting and Organization', () => {
  
  describe('sortStudentsByStudentId()', () => {
    test('should sort students by studentId', () => {
      const unsortedStudents = [
        SAMPLE_STUDENTS[2], // EST-2025-003
        SAMPLE_STUDENTS[0], // EST-2025-001
        SAMPLE_STUDENTS[1]  // EST-2025-002
      ];
      
      const sorted = sortStudentsByStudentId(unsortedStudents);
      
      expect(sorted[0].studentId).toBe('EST-2025-001');
      expect(sorted[1].studentId).toBe('EST-2025-002');
      expect(sorted[2].studentId).toBe('EST-2025-003');
    });

    test('should not mutate original array', () => {
      const original = [...SAMPLE_STUDENTS];
      const sorted = sortStudentsByStudentId(SAMPLE_STUDENTS);
      
      expect(SAMPLE_STUDENTS).toEqual(original);
      expect(sorted).not.toBe(SAMPLE_STUDENTS);
    });

    test('should handle empty array', () => {
      const result = sortStudentsByStudentId([]);
      expect(result).toEqual([]);
    });
  });

  describe('sortReportsByDateAndSubject()', () => {
    test('should sort reports by date (newest first) then by subject', () => {
      // Create reports with different dates
      const reportsToSort = [
        { ...SAMPLE_REPORTS[0], submittedAt: '2025-08-01T10:00:00.000Z', subject: 'z-subject' },
        { ...SAMPLE_REPORTS[1], submittedAt: '2025-08-03T10:00:00.000Z', subject: 'a-subject' },
        { ...SAMPLE_REPORTS[2], submittedAt: '2025-08-01T10:00:00.000Z', subject: 'a-subject' }
      ];
      
      const sorted = sortReportsByDateAndSubject(reportsToSort);
      
      // First should be newest (2025-08-03)
      expect(sorted[0].submittedAt).toBe('2025-08-03T10:00:00.000Z');
      
      // Then by subject alphabetically for same date
      expect(sorted[1].subject).toBe('a-subject');
      expect(sorted[2].subject).toBe('z-subject');
    });

    test('should not mutate original array', () => {
      const original = [...SAMPLE_REPORTS];
      const sorted = sortReportsByDateAndSubject(SAMPLE_REPORTS);
      
      expect(SAMPLE_REPORTS).toEqual(original);
      expect(sorted).not.toBe(SAMPLE_REPORTS);
    });
  });
});

/**
 * PERFORMANCE AND UTILITY TESTS
 * Test performance optimization utilities
 */

describe('Performance and Utilities', () => {
  
  describe('processBatchedReports()', () => {
    test('should process reports in batches', async () => {
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const batchSize = 3;
      const processedBatches: number[][] = [];
      
      const processor = async (batch: number[]) => {
        processedBatches.push(batch);
        return batch.length;
      };
      
      await processBatchedReports(testData, batchSize, processor);
      
      expect(processedBatches).toHaveLength(4); // 10 items / 3 batch size = 4 batches
      expect(processedBatches[0]).toEqual([1, 2, 3]);
      expect(processedBatches[1]).toEqual([4, 5, 6]);
      expect(processedBatches[2]).toEqual([7, 8, 9]);
      expect(processedBatches[3]).toEqual([10]);
    });

    test('should handle empty array', async () => {
      const result = await processBatchedReports([], 5, async (batch) => batch.length);
      expect(result).toEqual([]);
    });

    test('should handle batch size larger than array', async () => {
      const testData = [1, 2, 3];
      const processedBatches: number[][] = [];
      
      await processBatchedReports(testData, 10, async (batch) => {
        processedBatches.push(batch);
        return batch.length;
      });
      
      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0]).toEqual([1, 2, 3]);
    });
  });

  describe('createPathCacheKey()', () => {
    test('should create consistent cache keys', () => {
      const date = new Date('2025-08-09');
      const key1 = createPathCacheKey('congreso', '4to-año', 'física', 'C', 'EST-2025-001', date);
      const key2 = createPathCacheKey('congreso', '4to-año', 'física', 'C', 'EST-2025-001', date);
      
      expect(key1).toBe(key2);
      expect(key1).toContain('congreso');
      expect(key1).toContain('2025-08-09');
    });

    test('should create different keys for different inputs', () => {
      const date = new Date('2025-08-09');
      const key1 = createPathCacheKey('congreso', '4to-año', 'física', 'C', 'EST-2025-001', date);
      const key2 = createPathCacheKey('colegiales', '4to-año', 'física', 'C', 'EST-2025-001', date);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('safeDataOperation()', () => {
    test('should handle successful operations', () => {
      const result = safeDataOperation('test-operation', { test: 'data' }, () => {
        return 'success';
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result).toBe('success');
      }
    });

    test('should handle failing operations', () => {
      const result = safeDataOperation('test-operation', { test: 'data' }, () => {
        throw new Error('Test error');
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DataOrganizationError);
        expect(result.error.message).toContain('Test error');
        expect(result.error.operation).toBe('test-operation');
      }
    });

    test('should handle non-Error exceptions', () => {
      const result = safeDataOperation('test-operation', { test: 'data' }, () => {
        throw 'String error';
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Unknown error occurred');
      }
    });
  });

  describe('createProcessingMonitor()', () => {
    test('should track processing metrics', () => {
      const monitor = createProcessingMonitor('test-operation');
      
      monitor.start();
      monitor.addRecord();
      monitor.addRecord();
      monitor.addError();
      monitor.addWarning();
      
      const metrics = monitor.finish();
      
      expect(metrics.operation).toBe('test-operation');
      expect(metrics.recordsProcessed).toBe(2);
      expect(metrics.errorsEncountered).toBe(1);
      expect(metrics.warningsGenerated).toBe(1);
      expect(metrics.duration).toBeGreaterThanOrEqual(0);
      expect(metrics.endTime).toBeGreaterThan(metrics.startTime);
    });
  });
});

/**
 * ERROR HANDLING TESTS
 * Test comprehensive error handling
 */

describe('Error Handling', () => {
  
  describe('DataOrganizationError', () => {
    test('should create error with proper information', () => {
      const error = new DataOrganizationError('Test error', 'test-operation', { test: 'data' });
      
      expect(error.name).toBe('DataOrganizationError');
      expect(error.message).toBe('Test error');
      expect(error.operation).toBe('test-operation');
      expect(error.data).toEqual({ test: 'data' });
    });

    test('should inherit from Error', () => {
      const error = new DataOrganizationError('Test error', 'test-operation');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DataOrganizationError);
    });
  });
});

/**
 * INTEGRATION TESTS
 * Test complete workflows with real data scenarios
 */

describe('Integration Tests', () => {
  
  test('should process complete student-report workflow', () => {
    const student = SAMPLE_STUDENTS[0];
    const report = SAMPLE_REPORTS[0];
    const reportDate = new Date(report.submittedAt);
    
    // Step 1: Validate data
    const studentValidation = validateStudentData(student);
    const reportValidation = validateReportData(report);
    
    expect(studentValidation.isValid).toBe(true);
    expect(reportValidation.isValid).toBe(true);
    
    // Step 2: Generate hierarchical path
    const hierarchicalPath = generateHierarchicalPath(student, report.subject, reportDate);
    const pathValidation = validateHierarchicalPath(hierarchicalPath);
    
    expect(pathValidation.isValid).toBe(true);
    expect(hierarchicalPath.sede).toBe('congreso');
    expect(hierarchicalPath.materia).toBe('fisica');
    expect(hierarchicalPath.curso).toBe('c-4to-ano');
    
    // Step 3: Generate file paths
    const filePath = generateFilePath(hierarchicalPath);
    const fileName = generateFileName(reportDate, report.subject);
    
    expect(filePath).toContain('congreso/4to-ano/fisica/c-4to-ano');
    expect(fileName).toMatch(/^\d{4}-\d{2}-\d{2}_fisica_reporte\.json$/);
    
    // Step 4: Create organized report data
    const organizedReport: OrganizedReportData = {
      student,
      report,
      hierarchicalPath,
      fileName,
      fullPath: `${filePath}/${fileName}`
    };
    
    expect(organizedReport.fullPath).toMatch(/^congreso\/4to-ano\/fisica\/c-4to-ano\/EST-2025-001_maria-jose-gonzalez-fernandez\/agosto-semana-\d\/\d{4}-\d{2}-\d{2}_fisica_reporte\.json$/);
  });

  test('should handle edge cases in complete workflow', () => {
    const incompleteStudent = SAMPLE_STUDENTS[3]; // Student with missing data
    const reportWithSpecialChars = SAMPLE_REPORTS[2]; // Report with special characters
    const reportDate = new Date(reportWithSpecialChars.submittedAt);
    
    // Validation should pass but with warnings
    const studentValidation = validateStudentData(incompleteStudent);
    const reportValidation = validateReportData(reportWithSpecialChars);
    
    expect(studentValidation.isValid).toBe(true);
    expect(reportValidation.isValid).toBe(true);
    
    // Hierarchical path should use fallback values
    const hierarchicalPath = generateHierarchicalPath(
      incompleteStudent, 
      reportWithSpecialChars.subject, 
      reportDate
    );
    
    expect(hierarchicalPath.sede).toBe('unknown-sede');
    expect(hierarchicalPath.año).toBe('unknown-year');
    expect(hierarchicalPath.materia).toBe('educacion-fisica-deportes');
    
    // Should still generate valid file paths
    const filePath = generateFilePath(hierarchicalPath);
    const fileName = generateFileName(reportDate, reportWithSpecialChars.subject);
    
    expect(filePath).toBeTruthy();
    expect(fileName).toBeTruthy();
    expect(fileName).toContain('educacion-fisica-deportes');
  });

  test('should maintain data consistency across multiple operations', async () => {
    const testReports = SAMPLE_REPORTS.slice();
    
    // Test batch processing maintains order and completeness
    const processedBatches: ReportData[][] = [];
    await processBatchedReports(testReports, 2, async (batch) => {
      processedBatches.push(batch);
      return batch.length;
    });
    
    // Verify all reports were processed
    const allProcessed = processedBatches.flat();
    expect(allProcessed).toHaveLength(testReports.length);
    
    // Verify no data was lost or corrupted
    expect(allProcessed).toEqual(expect.arrayContaining(testReports));
  });
});

/**
 * PERFORMANCE TESTS
 * Test algorithm performance with larger datasets
 */

describe('Performance Tests', () => {
  
  test('should handle large student datasets efficiently', () => {
    // Create 1000 mock students
    const largeStudentDataset: StudentData[] = Array.from({ length: 1000 }, (_, index) => ({
      id: `u_test_${index}`,
      name: `Test Student ${index}`,
      email: `test${index}@example.com`,
      studentId: `EST-2025-${(index + 1).toString().padStart(3, '0')}`,
      sede: ['congreso', 'colegiales', 'belgrano-norte'][index % 3],
      academicYear: ['3er-ano', '4to-ano', '5to-ano'][index % 3],
      division: ['A', 'B', 'C', 'D'][index % 4],
      subjects: ['fisica', 'quimica', 'matematica']
    }));
    
    const startTime = Date.now();
    const sorted = sortStudentsByStudentId(largeStudentDataset);
    const endTime = Date.now();
    
    expect(sorted).toHaveLength(1000);
    expect(sorted[0].studentId).toBe('EST-2025-001');
    expect(sorted[999].studentId).toBe('EST-2025-1000');
    
    // Should complete within reasonable time (less than 100ms)
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100);
    
    console.log(`✅ Sorted 1000 students in ${duration}ms`);
  });

  test('should handle text normalization efficiently', () => {
    const testTexts = Array.from({ length: 10000 }, (_, index) => 
      `Test Text with Accénts and Special Ch@rs ${index} - Educación Física & Química`
    );
    
    const startTime = Date.now();
    const normalized = testTexts.map(normalizeText);
    const endTime = Date.now();
    
    expect(normalized).toHaveLength(10000);
    expect(normalized[0]).toBe('test-text-with-accents-and-special-chrs-0-educacion-fisica-quimica');
    
    // Should complete within reasonable time (less than 500ms)
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(500);
    
    console.log(`✅ Normalized 10,000 texts in ${duration}ms`);
  });
});

/**
 * RUN ALL TESTS
 */

// Jest configuration mock for running outside Jest environment
if (typeof describe === 'undefined') {
  console.log('⚠️ Running tests outside Jest environment - implementing basic test runner');
  
  // Simple test runner implementation
  let testsPassed = 0;
  let testsFailed = 0;
  const failedTests: string[] = [];
  
  global.describe = (name: string, fn: () => void) => {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      fn();
    } catch (error) {
      console.error(`❌ Test suite failed: ${name}`, error);
      testsFailed++;
      failedTests.push(name);
    }
  };
  
  global.test = (name: string, fn: () => void | Promise<void>) => {
    try {
      const result = fn();
      if (result instanceof Promise) {
        result.catch(error => {
          console.error(`❌ Async test failed: ${name}`, error);
          testsFailed++;
          failedTests.push(name);
        });
      }
      console.log(`  ✅ ${name}`);
      testsPassed++;
    } catch (error) {
      console.error(`  ❌ ${name}`, error);
      testsFailed++;
      failedTests.push(name);
    }
  };
  
  global.expect = (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toHaveLength: (expected: number) => {
      if (!actual || actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual?.length}`);
      }
    },
    toContain: (expected: any) => {
      if (!actual || !actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toBeInstanceOf: (expected: any) => {
      if (!(actual instanceof expected)) {
        throw new Error(`Expected ${actual} to be instance of ${expected.name}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual: (expected: number) => {
      if (actual < expected) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan: (expected: number) => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toMatch: (expected: RegExp) => {
      if (!expected.test(actual)) {
        throw new Error(`Expected ${actual} to match ${expected}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    not: {
      toBe: (expected: any) => {
        if (actual === expected) {
          throw new Error(`Expected ${actual} not to be ${expected}`);
        }
      }
    },
    arrayContaining: (expected: any[]) => expected
  });
  
  // Run tests at the end
  setTimeout(() => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => console.log(`  - ${test}`));
    }
    
    console.log('='.repeat(80) + '\n');
  }, 100);
}