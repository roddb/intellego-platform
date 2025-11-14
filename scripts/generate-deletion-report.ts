/**
 * Generate comprehensive reports for:
 * 1. Deleted duplicate users (full information)
 * 2. Students with exams where name couldn't be extracted
 * 3. Students missing exams by course and subject
 */

import { createClient } from '@libsql/client';
import * as fs from 'fs';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

// Deleted duplicate user IDs
const DELETED_USER_IDS = [
  // catalina cresci duplicates
  '271939b0-23ab-4ee4-9b2a-1ac4fc117d94',  // EST-2025-1019
  'bf75d4ac-5f88-4043-a227-4a512846cafe',  // EST-2025-1743
  '7cfecfff-7374-43c3-94b0-3bd182f7345e',  // EST-2025-1747
  // Lucio Fernández duplicate
  'u_qjugmxdtzme5ry9mk',                   // EST-2025-102
  // Charo Reig duplicate
  '0dc9641c-192c-4b0f-9d9c-a900dc161495',  // EST-2025-1023
  // Salvador Veltri duplicate
  'u_zsmjtajb0me1fut40',                   // EST-2025-077
  // Isabel Ortiz Güemes duplicate
  '75188ebe-9c16-467d-8353-7313d6d65b7a',  // EST-2025-1744
  // Agustin Gonzalez Castro Feijoo duplicate
  'f5c6ca4e-cd98-4729-bbc6-51c26cd7c505'   // EST-2025-1010
];

// Course requirements
const COURSE_REQUIREMENTS: Record<string, string[]> = {
  '4to Año_C': ['Gases Ideales', 'Tiro Oblicuo'],
  '4to Año_D': ['Gases Ideales', 'Tiro Oblicuo'],
  '4to Año_E': ['Gases Ideales', 'Tiro Oblicuo'],
  '5to Año_A': ['Equilibrio Químico', 'Termodinámica'],
  '5to Año_B': ['Equilibrio Químico']
};

interface DeletedUserInfo {
  id: string;
  studentId: string;
  name: string;
  email: string;
  academicYear: string;
  division: string;
  course: string;
  createdAt: string;
  primaryUserId?: string;
  primaryUserCode?: string;
  reason: string;
}

interface ExamWithoutName {
  evaluationId: string;
  studentName: string;
  studentId: string;
  course: string;
  subject: string;
  examTopic: string;
  examDate: string;
  score: number;
  feedbackPreview: string;
}

interface MissingExam {
  studentName: string;
  studentId: string;
  course: string;
  missingExams: string[];
}

/**
 * Extract student name from feedback
 */
function extractStudentFromFeedback(feedback: string): string | null {
  const patterns = [
    /RETROALIMENTA[CÇ][IÍ][OÓ]N\s*-\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+?)(?:\n|##|$)/i,
    /Estudiante:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+?)(?:\n|##|$)/i,
  ];

  for (const pattern of patterns) {
    const match = feedback.match(pattern);
    if (match) {
      const extracted = match[1].trim();
      if (extracted.length > 5 && !extracted.match(/^(Gases|Tiro|Equilibrio|Termodin)/i)) {
        return extracted;
      }
    }
  }
  return null;
}

/**
 * Report 1: Get information about deleted duplicate users
 */
async function getDeletedUsersInfo(): Promise<DeletedUserInfo[]> {
  console.log('📋 Report 1: Deleted Duplicate Users');
  console.log('='.repeat(80));

  const deletedUsers: DeletedUserInfo[] = [
    {
      id: '271939b0-23ab-4ee4-9b2a-1ac4fc117d94',
      studentId: 'EST-2025-1019',
      name: 'catalina cresci',
      email: 'catalina.cresci.dup1@gmail.com',
      academicYear: '5to Año',
      division: 'B',
      course: '5to Año B',
      createdAt: '2025-08-15',
      primaryUserId: 'u_yjrnyfsg2me6bmfeg',
      primaryUserCode: 'EST-2025-117',
      reason: 'Duplicate account - no data'
    },
    {
      id: 'bf75d4ac-5f88-4043-a227-4a512846cafe',
      studentId: 'EST-2025-1743',
      name: 'catalina cresci',
      email: 'catalina.cresci.dup2@gmail.com',
      academicYear: '5to Año',
      division: 'B',
      course: '5to Año B',
      createdAt: '2025-10-20',
      primaryUserId: 'u_yjrnyfsg2me6bmfeg',
      primaryUserCode: 'EST-2025-117',
      reason: 'Duplicate account - no data'
    },
    {
      id: '7cfecfff-7374-43c3-94b0-3bd182f7345e',
      studentId: 'EST-2025-1747',
      name: 'catalina cresci',
      email: 'catalina.cresci.dup3@gmail.com',
      academicYear: '5to Año',
      division: 'B',
      course: '5to Año B',
      createdAt: '2025-10-22',
      primaryUserId: 'u_yjrnyfsg2me6bmfeg',
      primaryUserCode: 'EST-2025-117',
      reason: 'Duplicate account - no data'
    },
    {
      id: 'u_qjugmxdtzme5ry9mk',
      studentId: 'EST-2025-102',
      name: 'Lucio Fernández rico',
      email: 'fernandezlucio4@gmail.com',
      academicYear: '5to Año',
      division: 'A',
      course: '5to Año A',
      createdAt: '2025-08-09',
      primaryUserId: 'u_0ewscw8ksmdyn9paz',
      primaryUserCode: 'EST-2025-003',
      reason: 'Duplicate account - no data (correct email migrated to primary)'
    },
    {
      id: '0dc9641c-192c-4b0f-9d9c-a900dc161495',
      studentId: 'EST-2025-1023',
      name: 'Charo Reig',
      email: 'charoreigg.dup@gmail.com',
      academicYear: '4to Año',
      division: 'E',
      course: '4to Año E',
      createdAt: '2025-08-20',
      primaryUserId: '7c833c54-face-42df-8ba9-758c9e0a838e',
      primaryUserCode: 'EST-2025-1020',
      reason: 'Duplicate account - no data'
    },
    {
      id: 'u_zsmjtajb0me1fut40',
      studentId: 'EST-2025-077',
      name: 'Salvador Veltri',
      email: 'salveltri21.dup@gmail.com',
      academicYear: '4to Año',
      division: 'D',
      course: '4to Año D',
      createdAt: '2025-08-08',
      primaryUserId: 'u_t7fxqb0y0me1fm6ec',
      primaryUserCode: 'EST-2025-072',
      reason: 'Duplicate account - no data'
    },
    {
      id: '75188ebe-9c16-467d-8353-7313d6d65b7a',
      studentId: 'EST-2025-1744',
      name: 'Isabel Ortiz Güemes',
      email: 'ortizguemesisabel.dup@gmail.com',
      academicYear: '5to Año',
      division: 'B',
      course: '5to Año B',
      createdAt: '2025-10-20',
      primaryUserId: 'u_bap6b4k2rme73bmwt',
      primaryUserCode: 'EST-2025-134',
      reason: 'Duplicate account - no data'
    },
    {
      id: 'f5c6ca4e-cd98-4729-bbc6-51c26cd7c505',
      studentId: 'EST-2025-1010',
      name: 'Agustin Gonzalez Castro Feijoo',
      email: 'agustingcf.dup@gmail.com',
      academicYear: '5to Año',
      division: 'D',
      course: '5to Año D',
      createdAt: '2025-08-18',
      primaryUserId: 'd5aec9ad-a91c-4304-87e1-01fa6f8d399b',
      primaryUserCode: 'EST-2025-1008',
      reason: 'Duplicate account - no data'
    }
  ];

  console.log(`Found ${deletedUsers.length} deleted duplicate users\n`);
  return deletedUsers;
}

/**
 * Report 2: Get exams where student name couldn't be extracted
 */
async function getExamsWithoutExtractableName(): Promise<ExamWithoutName[]> {
  console.log('\n📋 Report 2: Exams Without Extractable Student Name');
  console.log('='.repeat(80));

  const result = await db.execute(`
    SELECT
      e.id,
      e.studentId,
      u.name as studentName,
      u.studentId as studentCode,
      u.academicYear || ' ' || u.division as course,
      e.subject,
      e.examTopic,
      e.examDate,
      e.score,
      e.feedback
    FROM Evaluation e
    JOIN User u ON e.studentId = u.id
    WHERE u.role = 'STUDENT'
    ORDER BY e.examDate DESC
  `);

  const examsWithoutName: ExamWithoutName[] = [];

  for (const row of result.rows) {
    const feedback = String(row.feedback || '');
    const extractedName = extractStudentFromFeedback(feedback);

    if (!extractedName) {
      examsWithoutName.push({
        evaluationId: String(row.id),
        studentName: String(row.studentName),
        studentId: String(row.studentCode),
        course: String(row.course),
        subject: String(row.subject),
        examTopic: String(row.examTopic),
        examDate: String(row.examDate),
        score: Number(row.score),
        feedbackPreview: feedback.substring(0, 200) + '...'
      });
    }
  }

  console.log(`Found ${examsWithoutName.length} exams without extractable name\n`);
  return examsWithoutName;
}

/**
 * Report 3: Get students missing required exams by course and subject
 */
async function getStudentsMissingExams(): Promise<Record<string, MissingExam[]>> {
  console.log('\n📋 Report 3: Students Missing Required Exams');
  console.log('='.repeat(80));

  const missingBySubject: Record<string, MissingExam[]> = {};

  for (const [courseKey, requiredExams] of Object.entries(COURSE_REQUIREMENTS)) {
    const [academicYear, division] = courseKey.split('_');

    // Get all students in this course
    const studentsResult = await db.execute({
      sql: `SELECT id, name, studentId, academicYear, division
            FROM User
            WHERE role = 'STUDENT'
              AND academicYear = ?
              AND division = ?
            ORDER BY name`,
      args: [academicYear, division]
    });

    for (const student of studentsResult.rows) {
      const studentId = String(student.id);
      const studentName = String(student.name);
      const studentCode = String(student.studentId);
      const course = `${academicYear} ${division}`;

      // Get student's exams
      const examsResult = await db.execute({
        sql: `SELECT DISTINCT examTopic
              FROM Evaluation
              WHERE studentId = ?`,
        args: [studentId]
      });

      const studentExams = examsResult.rows.map(r => String(r.examTopic));
      const missingExams = requiredExams.filter(exam => !studentExams.includes(exam));

      if (missingExams.length > 0) {
        for (const missingExam of missingExams) {
          const subjectKey = `${course} - ${missingExam}`;

          if (!missingBySubject[subjectKey]) {
            missingBySubject[subjectKey] = [];
          }

          missingBySubject[subjectKey].push({
            studentName,
            studentId: studentCode,
            course,
            missingExams: [missingExam]
          });
        }
      }
    }
  }

  const totalMissing = Object.values(missingBySubject).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`Found ${totalMissing} student-exam combinations missing\n`);

  return missingBySubject;
}

/**
 * Main execution
 */
async function main() {
  console.log('📊 COMPREHENSIVE DELETION AND MISSING DATA REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date().toISOString()}\n`);

  try {
    // Report 1: Deleted users
    const deletedUsers = await getDeletedUsersInfo();

    // Report 2: Exams without extractable name
    const examsWithoutName = await getExamsWithoutExtractableName();

    // Report 3: Missing exams by subject
    const missingBySubject = await getStudentsMissingExams();

    // Generate comprehensive report
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        deletedDuplicates: deletedUsers.length,
        examsWithoutExtractableName: examsWithoutName.length,
        studentsMissingExams: Object.values(missingBySubject).reduce((sum, arr) => sum + arr.length, 0),
        subjectsWithMissingStudents: Object.keys(missingBySubject).length
      },
      deletedDuplicateUsers: deletedUsers,
      examsWithoutExtractableName: examsWithoutName,
      studentsMissingExamsBySubject: missingBySubject
    };

    // Save to file
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `scripts/comprehensive_report_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));

    // Console output
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Deleted duplicate users: ${deletedUsers.length}`);
    console.log(`⚠️  Exams without extractable name: ${examsWithoutName.length}`);
    console.log(`❌ Students missing exams: ${report.summary.studentsMissingExams}`);
    console.log(`📚 Subjects with missing students: ${report.summary.subjectsWithMissingStudents}`);

    console.log(`\n📄 Full report saved to: ${filename}\n`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

main();
