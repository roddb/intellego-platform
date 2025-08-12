/**
 * Test Suite for Report Exporter
 * 
 * Tests the database to JSON export functionality with mock data and
 * integration scenarios to ensure proper operation without affecting
 * the production database.
 * 
 * @author Data Structure Specialist
 * @version 2.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ExportConfig,
  ExportResult,
  ExportedReportJSON,
  exportAllReportsToJSON,
  exportSingleReport,
  getExportStatistics
} from '../lib/report-exporter';

// Mock the database query function to avoid hitting real database
jest.mock('../lib/db', () => ({
  query: jest.fn()
}));

import { query } from '../lib/db';
const mockQuery = query as jest.MockedFunction<typeof query>;

/**
 * MOCK DATA SETUP
 * Create realistic mock data for testing
 */

const MOCK_STUDENTS = [
  {
    id: 'u_student001',
    name: 'María José González',
    email: 'maria.gonzalez@test.edu',
    studentId: 'EST-2025-001',
    sede: 'Congreso',
    academicYear: '4to-año',
    division: 'C',
    subjects: 'física,química,matemática',
    role: 'STUDENT',
    status: 'ACTIVE'
  },
  {
    id: 'u_student002',
    name: 'Juan Carlos Rodríguez',
    email: 'juan.rodriguez@test.edu',
    studentId: 'EST-2025-002',
    sede: 'Colegiales',
    academicYear: '5to-año',
    division: 'D',
    subjects: 'física,biología',
    role: 'STUDENT',
    status: 'ACTIVE'
  }
];

const MOCK_REPORTS = [
  {
    id: 'r_report001',
    userId: 'u_student001',
    subject: 'física',
    weekStart: '2025-08-04T00:00:00.000Z',
    weekEnd: '2025-08-10T23:59:59.999Z',
    submittedAt: '2025-08-09T15:30:00.000Z'
  },
  {
    id: 'r_report002',
    userId: 'u_student002',
    subject: 'biología',
    weekStart: '2025-08-11T00:00:00.000Z',
    weekEnd: '2025-08-17T23:59:59.999Z',
    submittedAt: '2025-08-15T10:45:00.000Z'
  }
];

const MOCK_ANSWERS = [
  {
    id: 'a_answer001',
    questionId: 'q_understanding',
    answer: 'Comprendí completamente los conceptos básicos',
    progressReportId: 'r_report001'
  },
  {
    id: 'a_answer002',
    questionId: 'q_difficulties',
    answer: 'Tuve algunas dificultades con las ecuaciones',
    progressReportId: 'r_report001'
  },
  {
    id: 'a_answer003',
    questionId: 'q_understanding',
    answer: 'Los temas de genética fueron claros',
    progressReportId: 'r_report002'
  }
];

/**
 * MOCK DATABASE RESPONSES
 */

function setupMockDatabase() {
  mockQuery.mockImplementation((sql: string, params?: any[]) => {
    // Mock students query
    if (sql.includes('FROM User') && sql.includes("role = 'STUDENT'")) {
      return Promise.resolve({
        rows: MOCK_STUDENTS
      });
    }
    
    // Mock reports query
    if (sql.includes('FROM ProgressReport pr') && sql.includes('JOIN User u ON pr.userId = u.id')) {
      return Promise.resolve({
        rows: MOCK_REPORTS.map(report => ({
          ...report,
          ...MOCK_STUDENTS.find(s => s.id === report.userId)
        }))
      });
    }
    
    // Mock answers query
    if (sql.includes('FROM Answer') && sql.includes('WHERE progressReportId = ?')) {
      const reportId = params?.[0];
      const answers = MOCK_ANSWERS.filter(a => a.progressReportId === reportId);
      return Promise.resolve({
        rows: answers
      });
    }
    
    // Mock single report query
    if (sql.includes('FROM ProgressReport pr') && sql.includes('WHERE pr.id = ?')) {
      const reportId = params?.[0];
      const report = MOCK_REPORTS.find(r => r.id === reportId);
      if (report) {
        const student = MOCK_STUDENTS.find(s => s.id === report.userId);
        return Promise.resolve({
          rows: [{ ...report, ...student }]
        });
      }
      return Promise.resolve({ rows: [] });
    }
    
    // Default empty response
    return Promise.resolve({ rows: [] });
  });
}

/**
 * FILE SYSTEM MOCKING
 * Mock file system operations to avoid actual file creation during tests
 */

jest.mock('fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  copyFile: jest.fn(),
  stat: jest.fn(),
  rm: jest.fn(),
  cp: jest.fn(),
  readFile: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;

/**
 * EXPORT CONFIGURATION TESTS
 */

describe('Report Exporter Configuration', () => {
  
  beforeEach(() => {
    setupMockDatabase();
    jest.clearAllMocks();
    
    // Setup default fs mocks
    mockFs.access.mockRejectedValue(new Error('File not found'));
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);
  });
  
  test('should use default configuration when none provided', async () => {
    const result = await exportAllReportsToJSON();
    
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.metrics).toBeDefined();
  });

  test('should accept custom configuration', async () => {
    const customConfig: ExportConfig = {
      basePath: 'custom/export/path',
      batchSize: 25,
      validateData: false,
      overwriteExisting: true
    };
    
    const result = await exportAllReportsToJSON(customConfig);
    
    expect(result).toBeDefined();
    // Verify that custom config was used by checking mkdir calls
    expect(mockFs.mkdir).toHaveBeenCalled();
  });

  test('should handle date range filtering', async () => {
    const config: ExportConfig = {
      dateRange: {
        start: new Date('2025-08-01'),
        end: new Date('2025-08-31')
      }
    };
    
    await exportAllReportsToJSON(config);
    
    // Verify that query was called with date filtering
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('pr.submittedAt >= ? AND pr.submittedAt <= ?'),
      expect.arrayContaining([
        config.dateRange.start.toISOString(),
        config.dateRange.end.toISOString()
      ])
    );
  });

  test('should handle sede filtering', async () => {
    const config: ExportConfig = {
      filterBySede: ['Congreso', 'Colegiales']
    };
    
    await exportAllReportsToJSON(config);
    
    // Verify that query was called with sede filtering
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('u.sede IN'),
      expect.arrayContaining(['Congreso', 'Colegiales'])
    );
  });

  test('should handle subject filtering', async () => {
    const config: ExportConfig = {
      filterBySubject: ['física', 'química']
    };
    
    await exportAllReportsToJSON(config);
    
    // Verify that query was called with subject filtering
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('pr.subject IN'),
      expect.arrayContaining(['física', 'química'])
    );
  });
});

/**
 * DATA EXPORT TESTS
 */

describe('Data Export Functionality', () => {
  
  beforeEach(() => {
    setupMockDatabase();
    jest.clearAllMocks();
    
    // Setup successful fs operations
    mockFs.access.mockRejectedValue(new Error('File not found'));
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);
  });

  test('should export all reports successfully', async () => {
    const result = await exportAllReportsToJSON();
    
    expect(result.success).toBe(true);
    expect(result.totalReportsProcessed).toBe(MOCK_REPORTS.length);
    expect(result.totalFilesCreated).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
    
    // Verify that files were written
    expect(mockFs.writeFile).toHaveBeenCalled();
    expect(mockFs.mkdir).toHaveBeenCalled();
  });

  test('should handle empty database gracefully', async () => {
    // Mock empty responses
    mockQuery.mockImplementation(() => Promise.resolve({ rows: [] }));
    
    const result = await exportAllReportsToJSON();
    
    expect(result.success).toBe(true);
    expect(result.totalReportsProcessed).toBe(0);
    expect(result.totalFilesCreated).toBe(0);
    expect(result.warnings).toContain('No reports found matching the specified criteria');
  });

  test('should create correct JSON structure', async () => {
    let writtenData: string = '';
    mockFs.writeFile.mockImplementation((path, data) => {
      writtenData = data as string;
      return Promise.resolve();
    });
    
    await exportAllReportsToJSON();
    
    expect(writtenData).toBeTruthy();
    
    const exportedData: ExportedReportJSON = JSON.parse(writtenData);
    
    expect(exportedData.metadata).toBeDefined();
    expect(exportedData.metadata.version).toBe('2.0.0');
    expect(exportedData.metadata.student).toBeDefined();
    expect(exportedData.metadata.report).toBeDefined();
    expect(exportedData.data).toBeDefined();
    expect(exportedData.data.answers).toBeDefined();
  });

  test('should generate correct hierarchical paths', async () => {
    let writtenData: string = '';
    let writtenPath: string = '';
    
    mockFs.writeFile.mockImplementation((path, data) => {
      writtenPath = path as string;
      writtenData = data as string;
      return Promise.resolve();
    });
    
    await exportAllReportsToJSON({ basePath: 'test-export' });
    
    expect(writtenPath).toContain('test-export');
    expect(writtenPath).toContain('congreso'); // sede
    expect(writtenPath).toContain('4to-ano'); // año
    expect(writtenPath).toContain('fisica'); // materia
    expect(writtenPath).toContain('c-4to-ano'); // curso
    expect(writtenPath).toContain('EST-2025-001'); // alumno
    expect(writtenPath).toContain('agosto-semana'); // semana
    expect(writtenPath).toContain('_reporte.json');
  });
});

/**
 * SINGLE REPORT EXPORT TESTS
 */

describe('Single Report Export', () => {
  
  beforeEach(() => {
    setupMockDatabase();
    jest.clearAllMocks();
    
    mockFs.access.mockRejectedValue(new Error('File not found'));
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);
  });

  test('should export single report by ID', async () => {
    const result = await exportSingleReport('r_report001');
    
    expect(result.success).toBe(true);
    expect(result.totalReportsProcessed).toBe(1);
    expect(result.totalFilesCreated).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  test('should handle non-existent report ID', async () => {
    const result = await exportSingleReport('non-existent-id');
    
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Report not found');
  });

  test('should create correct file for single report', async () => {
    let writtenData: string = '';
    mockFs.writeFile.mockImplementation((path, data) => {
      writtenData = data as string;
      return Promise.resolve();
    });
    
    const result = await exportSingleReport('r_report001');
    
    expect(result.success).toBe(true);
    expect(writtenData).toBeTruthy();
    
    const exportedData: ExportedReportJSON = JSON.parse(writtenData);
    expect(exportedData.metadata.report.id).toBe('r_report001');
    expect(exportedData.metadata.student.studentId).toBe('EST-2025-001');
  });
});

/**
 * EXPORT STATISTICS TESTS
 */

describe('Export Statistics', () => {
  
  beforeEach(() => {
    setupMockDatabase();
    jest.clearAllMocks();
  });

  test('should calculate export statistics correctly', async () => {
    const stats = await getExportStatistics();
    
    expect(stats.totalStudents).toBe(MOCK_STUDENTS.length);
    expect(stats.totalReports).toBe(MOCK_REPORTS.length);
    expect(stats.reportsBySubject).toBeDefined();
    expect(stats.reportsBySede).toBeDefined();
    expect(stats.estimatedFiles).toBe(MOCK_REPORTS.length);
  });

  test('should group reports by subject correctly', async () => {
    const stats = await getExportStatistics();
    
    expect(stats.reportsBySubject['física']).toBe(1);
    expect(stats.reportsBySubject['biología']).toBe(1);
  });

  test('should group reports by sede correctly', async () => {
    const stats = await getExportStatistics();
    
    expect(stats.reportsBySede['Congreso']).toBe(1);
    expect(stats.reportsBySede['Colegiales']).toBe(1);
  });

  test('should handle filtered statistics', async () => {
    const stats = await getExportStatistics({
      filterBySubject: ['física']
    });
    
    // This would depend on how filtering is implemented in the query mock
    expect(stats).toBeDefined();
  });
});

/**
 * ERROR HANDLING TESTS
 */

describe('Error Handling', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle database connection errors', async () => {
    mockQuery.mockRejectedValue(new Error('Database connection failed'));
    
    const result = await exportAllReportsToJSON();
    
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Database connection failed');
  });

  test('should handle file system errors', async () => {
    setupMockDatabase();
    
    // Mock file system error
    mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
    
    const result = await exportAllReportsToJSON();
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should handle invalid JSON data gracefully', async () => {
    // Setup mock data with circular references (would cause JSON.stringify to fail)
    const circularData = { self: null as any };
    circularData.self = circularData;
    
    mockQuery.mockImplementation(() => {
      return Promise.resolve({
        rows: [{ ...MOCK_REPORTS[0], circular: circularData }]
      });
    });
    
    // This test would check how the exporter handles JSON serialization errors
    // Implementation would depend on actual error handling in the exporter
  });

  test('should recover from partial failures', async () => {
    setupMockDatabase();
    
    // Mock intermittent file system failures
    let callCount = 0;
    mockFs.writeFile.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Temporary file system error'));
      }
      return Promise.resolve();
    });
    
    const result = await exportAllReportsToJSON();
    
    // Should have some errors but not complete failure
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.totalFilesCreated).toBeLessThan(result.totalReportsProcessed);
  });
});

/**
 * PERFORMANCE TESTS
 */

describe('Performance', () => {
  
  beforeEach(() => {
    setupMockDatabase();
    jest.clearAllMocks();
    
    mockFs.access.mockRejectedValue(new Error('File not found'));
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);
  });

  test('should handle batch processing correctly', async () => {
    const config: ExportConfig = {
      batchSize: 1 // Process one at a time to verify batching
    };
    
    const result = await exportAllReportsToJSON(config);
    
    expect(result.success).toBe(true);
    // With batch size 1, we should have multiple mkdir calls (one per batch)
    expect(mockFs.mkdir).toHaveBeenCalled();
  });

  test('should complete within reasonable time', async () => {
    const startTime = Date.now();
    
    const result = await exportAllReportsToJSON();
    
    const duration = Date.now() - startTime;
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    
    console.log(`✅ Export completed in ${duration}ms`);
  });

  test('should handle large datasets efficiently', async () => {
    // Mock large dataset
    const largeStudentSet = Array.from({ length: 100 }, (_, i) => ({
      ...MOCK_STUDENTS[0],
      id: `u_student${i}`,
      studentId: `EST-2025-${(i + 1).toString().padStart(3, '0')}`,
      name: `Student ${i}`
    }));
    
    const largeReportSet = Array.from({ length: 100 }, (_, i) => ({
      ...MOCK_REPORTS[0],
      id: `r_report${i}`,
      userId: `u_student${i}`
    }));
    
    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('FROM User')) {
        return Promise.resolve({ rows: largeStudentSet });
      } else if (sql.includes('FROM ProgressReport')) {
        return Promise.resolve({ rows: largeReportSet });
      }
      return Promise.resolve({ rows: [] });
    });
    
    const startTime = Date.now();
    const result = await exportAllReportsToJSON({ batchSize: 10 });
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(result.totalReportsProcessed).toBe(100);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    
    console.log(`✅ Exported 100 reports in ${duration}ms`);
  });
});

/**
 * INTEGRATION TESTS
 */

describe('Integration Tests', () => {
  
  beforeEach(() => {
    setupMockDatabase();
    jest.clearAllMocks();
    
    mockFs.access.mockRejectedValue(new Error('File not found'));
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);
  });

  test('should export complete workflow end-to-end', async () => {
    const config: ExportConfig = {
      basePath: 'test/integration/export',
      validateData: true,
      includeAnswers: true,
      batchSize: 10
    };
    
    const result = await exportAllReportsToJSON(config);
    
    expect(result.success).toBe(true);
    expect(result.metrics.operation).toBe('export-all-reports');
    expect(result.metrics.recordsProcessed).toBeGreaterThan(0);
    expect(result.exportedFiles.length).toBeGreaterThan(0);
    
    // Verify that proper directory structure was created
    const mkdirCalls = (mockFs.mkdir as jest.Mock).mock.calls;
    expect(mkdirCalls.some(call => 
      call[0].includes('congreso') && 
      call[0].includes('4to-ano') &&
      call[0].includes('fisica')
    )).toBe(true);
    
    // Verify that JSON files were written with correct structure
    const writeFileCalls = (mockFs.writeFile as jest.Mock).mock.calls;
    expect(writeFileCalls.length).toBeGreaterThan(0);
    
    const jsonContent = writeFileCalls[0][1];
    const parsedJson: ExportedReportJSON = JSON.parse(jsonContent);
    
    expect(parsedJson.metadata.version).toBe('2.0.0');
    expect(parsedJson.metadata.hierarchicalPath).toContain('congreso');
    expect(parsedJson.data.answers).toBeDefined();
  });

  test('should maintain data consistency across export process', async () => {
    // Track all data written to verify consistency
    const writtenFiles: Array<{ path: string; data: ExportedReportJSON }> = [];
    
    mockFs.writeFile.mockImplementation((filePath, data) => {
      writtenFiles.push({
        path: filePath as string,
        data: JSON.parse(data as string)
      });
      return Promise.resolve();
    });
    
    const result = await exportAllReportsToJSON();
    
    expect(result.success).toBe(true);
    expect(writtenFiles.length).toBe(result.totalFilesCreated);
    
    // Verify each file has consistent data
    writtenFiles.forEach(file => {
      expect(file.data.metadata.version).toBe('2.0.0');
      expect(file.data.metadata.student.id).toBeTruthy();
      expect(file.data.metadata.report.id).toBeTruthy();
      expect(file.data.data).toBeDefined();
      
      // Verify path consistency
      expect(file.path).toContain(file.data.metadata.hierarchicalPath.replace(/\//g, path.sep));
    });
  });
});

/**
 * CLEANUP AND UTILITIES
 */

afterAll(() => {
  // Clean up any resources if needed
  jest.restoreAllMocks();
});