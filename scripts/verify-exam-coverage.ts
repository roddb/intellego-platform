/**
 * Script to verify exam coverage for all students
 *
 * Requirements by course:
 * - 4to C, D, E: Gases Ideales + Tiro Oblicuo
 * - 5to A: Equilibrio Químico + Termodinámica
 * - 5to B: Equilibrio Químico
 *
 * Usage: npx tsx scripts/verify-exam-coverage.ts [--export-json]
 */

import { createClient } from '@libsql/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

interface Student {
  id: string;
  name: string;
  studentId: string;
  academicYear: string;
  division: string;
}

interface ExamCoverage {
  student: Student;
  requiredExams: string[];
  hasExams: string[];
  missingExams: string[];
  isComplete: boolean;
}

interface CourseReport {
  course: string;
  totalStudents: number;
  studentsComplete: number;
  studentsMissing: number;
  completionPercentage: number;
  coverage: ExamCoverage[];
}

// Course requirements
const COURSE_REQUIREMENTS: Record<string, string[]> = {
  '4to Año_C': ['Gases Ideales', 'Tiro Oblicuo'],
  '4to Año_D': ['Gases Ideales', 'Tiro Oblicuo'],
  '4to Año_E': ['Gases Ideales', 'Tiro Oblicuo'],
  '5to Año_A': ['Equilibrio Químico', 'Termodinámica'],
  '5to Año_B': ['Equilibrio Químico']
};

/**
 * Get all students for a specific course
 */
async function getStudentsForCourse(academicYear: string, division: string): Promise<Student[]> {
  const result = await db.execute({
    sql: `SELECT id, name, studentId, academicYear, division
          FROM User
          WHERE role = 'STUDENT'
            AND academicYear = ?
            AND division = ?
          ORDER BY name`,
    args: [academicYear, division]
  });

  return result.rows.map(row => ({
    id: String(row.id),
    name: String(row.name),
    studentId: String(row.studentId),
    academicYear: String(row.academicYear),
    division: String(row.division)
  }));
}

/**
 * Get exams for a specific student
 */
async function getStudentExams(studentId: string, courseCode: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT DISTINCT examTopic
          FROM Evaluation
          WHERE studentId = ?
            AND subject LIKE ?`,
    args: [studentId, `%${courseCode}%`]
  });

  return result.rows
    .map(row => String(row.examTopic))
    .filter(topic => topic !== 'null' && topic !== '');
}

/**
 * Verify coverage for a single course
 */
async function verifyCourse(
  academicYear: string,
  division: string
): Promise<CourseReport> {
  const courseKey = `${academicYear}_${division}`;
  const requiredExams = COURSE_REQUIREMENTS[courseKey];

  if (!requiredExams) {
    throw new Error(`No requirements defined for course: ${courseKey}`);
  }

  // Get course code for subject filtering
  const courseCode = academicYear.includes('3er') ? '3ro' :
                     academicYear.includes('4to') ? '4to' :
                     academicYear.includes('5to') ? '5to' : '';

  const fullCourseCode = `${courseCode} ${division}`;

  // Get all students in this course
  const students = await getStudentsForCourse(academicYear, division);

  // Check each student's exams
  const coverage: ExamCoverage[] = [];

  for (const student of students) {
    const hasExams = await getStudentExams(student.id, fullCourseCode);
    const missingExams = requiredExams.filter(req => !hasExams.includes(req));

    coverage.push({
      student,
      requiredExams,
      hasExams,
      missingExams,
      isComplete: missingExams.length === 0
    });
  }

  // Calculate stats
  const studentsComplete = coverage.filter(c => c.isComplete).length;
  const studentsMissing = coverage.filter(c => !c.isComplete).length;
  const completionPercentage = (studentsComplete / students.length) * 100;

  return {
    course: `${academicYear} ${division}`,
    totalStudents: students.length,
    studentsComplete,
    studentsMissing,
    completionPercentage,
    coverage
  };
}

/**
 * Print course report
 */
function printCourseReport(report: CourseReport): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📚 ${report.course}`);
  console.log('='.repeat(80));

  console.log(`\n📊 Summary:`);
  console.log(`   Total students: ${report.totalStudents}`);
  console.log(`   ✅ Complete: ${report.studentsComplete} (${report.completionPercentage.toFixed(1)}%)`);
  console.log(`   ❌ Missing exams: ${report.studentsMissing}`);

  console.log(`\n📋 Required exams:`);
  report.coverage[0].requiredExams.forEach(exam => {
    console.log(`   - ${exam}`);
  });

  // Show incomplete students
  const incomplete = report.coverage.filter(c => !c.isComplete);

  if (incomplete.length > 0) {
    console.log(`\n❌ Students missing exams:`);
    incomplete.forEach(student => {
      console.log(`\n   ${student.student.name} (${student.student.studentId})`);
      console.log(`      Has: ${student.hasExams.length > 0 ? student.hasExams.join(', ') : 'none'}`);
      console.log(`      Missing: ${student.missingExams.join(', ')}`);
    });
  } else {
    console.log(`\n✅ All students have all required exams!`);
  }
}

/**
 * Print global summary
 */
function printGlobalSummary(reports: CourseReport[]): void {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 GLOBAL SUMMARY');
  console.log('='.repeat(80));

  let totalStudents = 0;
  let totalComplete = 0;
  let totalMissing = 0;

  console.log(`\nCourse Coverage:`);
  reports.forEach(report => {
    totalStudents += report.totalStudents;
    totalComplete += report.studentsComplete;
    totalMissing += report.studentsMissing;

    const status = report.studentsMissing === 0 ? '✅' : '⚠️ ';
    console.log(`   ${status} ${report.course.padEnd(15)} ${report.studentsComplete}/${report.totalStudents} (${report.completionPercentage.toFixed(1)}%)`);
  });

  const globalPercentage = (totalComplete / totalStudents) * 100;

  console.log(`\n📈 Overall:`);
  console.log(`   Total students: ${totalStudents}`);
  console.log(`   ✅ Complete: ${totalComplete} (${globalPercentage.toFixed(1)}%)`);
  console.log(`   ❌ Missing: ${totalMissing}`);

  console.log(`\n${'='.repeat(80)}`);
}

/**
 * Export results to JSON
 */
function exportToJSON(reports: CourseReport[], filename: string = 'exam_coverage_report.json'): void {
  const data = {
    generatedAt: new Date().toISOString(),
    reports: reports.map(r => ({
      course: r.course,
      stats: {
        totalStudents: r.totalStudents,
        studentsComplete: r.studentsComplete,
        studentsMissing: r.studentsMissing,
        completionPercentage: Math.round(r.completionPercentage * 10) / 10
      },
      incompleteStudents: r.coverage
        .filter(c => !c.isComplete)
        .map(c => ({
          name: c.student.name,
          studentId: c.student.studentId,
          id: c.student.id,
          hasExams: c.hasExams,
          missingExams: c.missingExams
        }))
    }))
  };

  const filepath = join('scripts', filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`\n📄 Report exported to: ${filepath}`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const exportJSON = args.includes('--export-json');

  console.log('🔍 Exam Coverage Verification');
  console.log('='.repeat(80));

  try {
    const reports: CourseReport[] = [];

    // Verify each course
    console.log('\nAnalyzing courses...\n');

    // 4to Año
    for (const division of ['C', 'D', 'E']) {
      const report = await verifyCourse('4to Año', division);
      reports.push(report);
      printCourseReport(report);
    }

    // 5to Año
    for (const division of ['A', 'B']) {
      const report = await verifyCourse('5to Año', division);
      reports.push(report);
      printCourseReport(report);
    }

    // Print global summary
    printGlobalSummary(reports);

    // Export if requested
    if (exportJSON) {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      exportToJSON(reports, `exam_coverage_${timestamp}.json`);
    }

    console.log(`\n✅ Analysis completed successfully!\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Execute
main();
