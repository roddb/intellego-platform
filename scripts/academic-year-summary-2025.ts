/**
 * Academic Year Summary 2025
 *
 * Genera resúmenes estadísticos de cada alumno por materia (Física y Química)
 * desde agosto-noviembre 2025, excluyendo CONSUDEC.
 *
 * Output:
 * - Tabla formateada por consola
 * - Archivos CSV: FISICA_2025_resumen.csv y QUIMICA_2025_resumen.csv
 *
 * Uso: npx tsx scripts/academic-year-summary-2025.ts
 */

import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface SkillsMetrics {
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
}

interface ExamRecord {
  examTopic: string;
  score: number;
  examDate: string;
}

interface StudentSummary {
  studentId: string;
  studentName: string;
  email: string;
  sede: string;
  academicYear: string;
  division: string;
  totalReports: number;
  avgScore: number;
  avgComprehension: number;
  avgCriticalThinking: number;
  avgSelfRegulation: number;
  avgPracticalApplication: number;
  avgMetacognition: number;
  exams: ExamRecord[];
}

interface FeedbackRow {
  studentId: string;
  score: number | null;
  skillsMetrics: string | null;
}

interface UserReportCount {
  id: string;
  name: string;
  email: string;
  sede: string;
  academicYear: string;
  division: string;
  total_reports: number;
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse skillsMetrics JSON string and return typed object
 */
function parseSkillsMetrics(jsonString: string | null): SkillsMetrics | null {
  if (!jsonString) return null;

  try {
    const parsed = JSON.parse(jsonString);
    return {
      comprehension: parsed.comprehension || 0,
      criticalThinking: parsed.criticalThinking || 0,
      selfRegulation: parsed.selfRegulation || 0,
      practicalApplication: parsed.practicalApplication || 0,
      metacognition: parsed.metacognition || 0,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error parsing skillsMetrics:', error.message);
    }
    return null;
  }
}

/**
 * Calculate average of an array of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / numbers.length) * 100) / 100; // 2 decimals
}

/**
 * Format number to 2 decimal places
 */
function formatNumber(num: number): string {
  return num.toFixed(2);
}

/**
 * Pad string to specific length
 */
function padString(str: string, length: number): string {
  return str.padEnd(length, ' ').substring(0, length);
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Get all students with reports for a specific subject
 */
async function getStudentsWithReports(subject: string): Promise<UserReportCount[]> {
  const result = await db.execute({
    sql: `
      SELECT
        u.id,
        u.name,
        u.email,
        u.sede,
        u.academicYear,
        u.division,
        COUNT(pr.id) as total_reports
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE
        u.role = 'STUDENT'
        AND u.sede IN ('Colegiales', 'Congreso')
        AND pr.weekStart >= '2025-08-01'
        AND pr.subject = ?
      GROUP BY u.id, u.name, u.email, u.sede, u.academicYear, u.division
      HAVING total_reports > 0
      ORDER BY u.sede, u.academicYear, u.division, u.name
    `,
    args: [subject],
  });

  return result.rows as unknown as UserReportCount[];
}

/**
 * Get all feedback data for a student in a specific subject
 */
async function getStudentFeedback(studentId: string, subject: string): Promise<FeedbackRow[]> {
  const result = await db.execute({
    sql: `
      SELECT
        f.studentId,
        f.score,
        f.skillsMetrics
      FROM Feedback f
      JOIN ProgressReport pr ON f.progressReportId = pr.id
      WHERE
        f.studentId = ?
        AND pr.subject = ?
        AND pr.weekStart >= '2025-08-01'
    `,
    args: [studentId, subject],
  });

  return result.rows as unknown as FeedbackRow[];
}

/**
 * Get all exams for a student in a specific subject
 */
async function getStudentExams(studentId: string, subject: string): Promise<ExamRecord[]> {
  const result = await db.execute({
    sql: `
      SELECT
        examTopic,
        score,
        examDate
      FROM Evaluation
      WHERE
        studentId = ?
        AND subject LIKE ?
        AND examDate >= '2025-08-01'
      ORDER BY examDate
    `,
    args: [studentId, `%${subject}%`],
  });

  return result.rows as unknown as ExamRecord[];
}

/**
 * Generate complete summary for a subject
 */
async function generateSubjectSummary(subject: string): Promise<StudentSummary[]> {
  console.log(`\n📊 Procesando datos de ${subject}...`);

  const students = await getStudentsWithReports(subject);
  console.log(`   Encontrados ${students.length} estudiantes con reportes`);

  const summaries: StudentSummary[] = [];

  for (const student of students) {
    const feedbacks = await getStudentFeedback(student.id, subject);
    const exams = await getStudentExams(student.id, subject);

    // Extract scores and skills
    const scores: number[] = [];
    const comprehensionScores: number[] = [];
    const criticalThinkingScores: number[] = [];
    const selfRegulationScores: number[] = [];
    const practicalApplicationScores: number[] = [];
    const metacognitionScores: number[] = [];

    for (const feedback of feedbacks) {
      if (feedback.score !== null) {
        scores.push(feedback.score);
      }

      const skills = parseSkillsMetrics(feedback.skillsMetrics);
      if (skills) {
        comprehensionScores.push(skills.comprehension);
        criticalThinkingScores.push(skills.criticalThinking);
        selfRegulationScores.push(skills.selfRegulation);
        practicalApplicationScores.push(skills.practicalApplication);
        metacognitionScores.push(skills.metacognition);
      }
    }

    summaries.push({
      studentId: student.id,
      studentName: student.name,
      email: student.email,
      sede: student.sede,
      academicYear: student.academicYear || 'N/A',
      division: student.division || 'N/A',
      totalReports: student.total_reports,
      avgScore: average(scores),
      avgComprehension: average(comprehensionScores),
      avgCriticalThinking: average(criticalThinkingScores),
      avgSelfRegulation: average(selfRegulationScores),
      avgPracticalApplication: average(practicalApplicationScores),
      avgMetacognition: average(metacognitionScores),
      exams: exams,
    });
  }

  return summaries;
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

/**
 * Print summary table to console
 */
function printSummaryTable(summaries: StudentSummary[], subject: string): void {
  console.log('\n' + '='.repeat(150));
  console.log(`📚 RESUMEN ACADÉMICO 2025 - ${subject.toUpperCase()}`);
  console.log('='.repeat(150));

  // Header
  console.log(
    padString('NOMBRE', 25) +
    padString('SEDE', 12) +
    padString('AÑO', 8) +
    padString('DIV', 5) +
    padString('REPORTES', 10) +
    padString('NOTA', 8) +
    padString('COMP', 8) +
    padString('CRIT', 8) +
    padString('AUTO', 8) +
    padString('APLIC', 8) +
    padString('META', 8)
  );
  console.log('-'.repeat(150));

  // Rows
  for (const s of summaries) {
    // Main row with report data
    console.log(
      padString(s.studentName, 25) +
      padString(s.sede, 12) +
      padString(s.academicYear, 8) +
      padString(s.division, 5) +
      padString(s.totalReports.toString(), 10) +
      padString(formatNumber(s.avgScore), 8) +
      padString(formatNumber(s.avgComprehension), 8) +
      padString(formatNumber(s.avgCriticalThinking), 8) +
      padString(formatNumber(s.avgSelfRegulation), 8) +
      padString(formatNumber(s.avgPracticalApplication), 8) +
      padString(formatNumber(s.avgMetacognition), 8)
    );

    // Show exams if any
    if (s.exams.length > 0) {
      for (const exam of s.exams) {
        console.log(
          padString('  → Examen:', 25) +
          padString(exam.examTopic, 30) +
          padString(`Nota: ${exam.score}`, 15) +
          padString(`Fecha: ${exam.examDate}`, 20)
        );
      }
    }
  }

  console.log('='.repeat(150));

  // Statistics
  const totalReports = summaries.reduce((acc, s) => acc + s.totalReports, 0);
  const avgScore = average(summaries.map((s) => s.avgScore));
  const avgComp = average(summaries.map((s) => s.avgComprehension));
  const avgCrit = average(summaries.map((s) => s.avgCriticalThinking));
  const avgAuto = average(summaries.map((s) => s.avgSelfRegulation));
  const avgAplic = average(summaries.map((s) => s.avgPracticalApplication));
  const avgMeta = average(summaries.map((s) => s.avgMetacognition));

  console.log(`\n📈 ESTADÍSTICAS GENERALES:`);
  console.log(`   Total estudiantes: ${summaries.length}`);
  console.log(`   Total reportes: ${totalReports}`);
  console.log(`   Promedio reportes/estudiante: ${formatNumber(totalReports / summaries.length)}`);
  console.log(`   Promedio nota general: ${formatNumber(avgScore)}`);
  console.log(`   Promedio Comprensión: ${formatNumber(avgComp)}`);
  console.log(`   Promedio Pensamiento Crítico: ${formatNumber(avgCrit)}`);
  console.log(`   Promedio Autorregulación: ${formatNumber(avgAuto)}`);
  console.log(`   Promedio Aplicación Práctica: ${formatNumber(avgAplic)}`);
  console.log(`   Promedio Metacognición: ${formatNumber(avgMeta)}`);
  console.log('');
}

/**
 * Export summary to CSV file
 */
function exportToCSV(summaries: StudentSummary[], subject: string): void {
  const filename = `${subject.toUpperCase()}_2025_resumen.csv`;
  const filepath = path.join(process.cwd(), filename);

  // Find maximum number of exams any student has
  const maxExams = Math.max(...summaries.map((s) => s.exams.length), 0);

  // Build dynamic header with exam columns
  const baseHeader = [
    'Nombre',
    'Email',
    'Sede',
    'Año Académico',
    'División',
    'Total Reportes',
    'Promedio Nota',
    'Promedio Comprensión',
    'Promedio Pensamiento Crítico',
    'Promedio Autorregulación',
    'Promedio Aplicación Práctica',
    'Promedio Metacognición',
  ];

  const examHeaders: string[] = [];
  for (let i = 1; i <= maxExams; i++) {
    examHeaders.push(`Examen ${i} - Tema`);
    examHeaders.push(`Examen ${i} - Nota`);
    examHeaders.push(`Examen ${i} - Fecha`);
  }

  const header = [...baseHeader, ...examHeaders].join(',');

  // CSV Rows
  const rows = summaries.map((s) => {
    const baseRow = [
      `"${s.studentName}"`,
      `"${s.email}"`,
      `"${s.sede}"`,
      `"${s.academicYear}"`,
      `"${s.division}"`,
      s.totalReports,
      formatNumber(s.avgScore),
      formatNumber(s.avgComprehension),
      formatNumber(s.avgCriticalThinking),
      formatNumber(s.avgSelfRegulation),
      formatNumber(s.avgPracticalApplication),
      formatNumber(s.avgMetacognition),
    ];

    // Add exam data
    const examData: string[] = [];
    for (let i = 0; i < maxExams; i++) {
      if (i < s.exams.length) {
        const exam = s.exams[i];
        examData.push(`"${exam.examTopic}"`);
        examData.push(exam.score.toString());
        examData.push(`"${exam.examDate}"`);
      } else {
        // Empty cells if student has fewer exams
        examData.push('""');
        examData.push('');
        examData.push('""');
      }
    }

    return [...baseRow, ...examData].join(',');
  });

  const csv = [header, ...rows].join('\n');

  // Write to file with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  fs.writeFileSync(filepath, BOM + csv, 'utf-8');

  console.log(`✅ Archivo CSV generado: ${filename}`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  console.log('\n🎓 GENERADOR DE RESUMEN ACADÉMICO FIN DE AÑO 2025');
  console.log('================================================\n');
  console.log('Período: Agosto - Noviembre 2025');
  console.log('Sedes: Colegiales y Congreso (excluyendo CONSUDEC)');
  console.log('Materias: Física y Química\n');

  try {
    // Process Física
    const fisicaSummary = await generateSubjectSummary('Física');
    printSummaryTable(fisicaSummary, 'Física');
    exportToCSV(fisicaSummary, 'Fisica');

    // Process Química
    const quimicaSummary = await generateSubjectSummary('Química');
    printSummaryTable(quimicaSummary, 'Química');
    exportToCSV(quimicaSummary, 'Quimica');

    console.log('\n✨ Proceso completado exitosamente!\n');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('\n❌ Error durante la ejecución:', error.message);
      console.error(error.stack);
    } else {
      console.error('\n❌ Error desconocido:', error);
    }
    process.exit(1);
  }
}

main();
