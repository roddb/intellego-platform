/**
 * Script to import evaluations from markdown files
 * Usage: npx tsx scripts/import-evaluations.ts <directory-path> <subject> <exam-topic>
 *
 * Example: npx tsx scripts/import-evaluations.ts "../Retroalimentaciones 4to C" "Física" "Tiro Oblicuo"
 */

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { createClient } from '@libsql/client';

// Database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

// Types
interface EvaluationFile {
  filepath: string;
  filename: string;
  lastName: string;
  firstName: string;
  date: string; // Format: DDMMYYYY
}

interface Student {
  id: string;
  name: string;
  email: string;
}

// Generate unique ID (simple version)
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `eval_${timestamp}${randomStr}`;
}

// Parse filename to extract student info
// Format: Apellido_Nombre_retroalimentacion_DDMMYYYY.md
function parseFilename(filename: string): EvaluationFile | null {
  const match = filename.match(/^([^_]+)_([^_]+)_retroalimentacion_(\d{8})\.md$/);

  if (!match) {
    console.warn(`⚠️  Filename doesn't match expected format: ${filename}`);
    return null;
  }

  const [_, lastName, firstName, date] = match;

  return {
    filepath: '',
    filename,
    lastName: lastName.trim(),
    firstName: firstName.trim(),
    date
  };
}

// Parse date from DDMMYYYY to ISO format
function parseDateFromFilename(dateStr: string): string {
  // dateStr format: DDMMYYYY (e.g., 17092025)
  const day = dateStr.substring(0, 2);
  const month = dateStr.substring(2, 4);
  const year = dateStr.substring(4, 8);

  return `${year}-${month}-${day}`;
}

// Parse subject to extract academic year and division
// Examples: "Física 5to A" -> { academicYear: "5to Año", division: "A" }
//           "Química 4to C" -> { academicYear: "4to Año", division: "C" }
//           "Matemática" -> null
function parseSubjectCourse(subject: string): { academicYear: string; division: string } | null {
  // Pattern: Subject Name + Year + Division
  // Examples: "Física 5to A", "Química 4to C", "Biología 3ro B"
  const match = subject.match(/(\d)(?:to|ro)\s*([A-Z])/);

  if (!match) {
    return null;
  }

  const yearNum = match[1];
  const division = match[2];

  // Convert to academic year format
  // 3ro -> 3er Año, 4to -> 4to Año, 5to -> 5to Año
  const academicYear = yearNum === '3' ? '3er Año' : `${yearNum}to Año`;

  return { academicYear, division };
}

// Extract score from markdown content
function extractScore(markdown: string): number {
  // Look for patterns like "Nota: 58/100" or "### Nota: 68.0/100"
  const scoreMatch = markdown.match(/Nota:\s*(\d+(?:\.\d+)?)\s*\/\s*100/i);

  if (scoreMatch) {
    return Math.round(parseFloat(scoreMatch[1]));
  }

  console.warn('⚠️  Could not extract score from markdown, defaulting to 0');
  return 0;
}

// Find student by name in database with optional course filters
async function findStudent(
  firstName: string,
  lastName: string,
  academicYear?: string,
  division?: string
): Promise<Student | null> {
  try {
    // Build query with optional filters
    let sql = `SELECT id, name, email, academicYear, division FROM User
               WHERE role = 'STUDENT'
               AND (name LIKE ? OR name LIKE ? OR name LIKE ?)`;

    const args: (string | number)[] = [
      `%${firstName}%${lastName}%`,
      `%${lastName}%${firstName}%`,
      `%${firstName.toUpperCase()}%${lastName.toUpperCase()}%`
    ];

    // Add academic year filter if provided
    if (academicYear) {
      sql += ` AND academicYear = ?`;
      args.push(academicYear);
    }

    // Add division filter if provided
    if (division) {
      sql += ` AND division = ?`;
      args.push(division);
    }

    sql += ` LIMIT 1`;

    const result = await db.execute({ sql, args });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email)
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding student:', error);
    return null;
  }
}

// Insert evaluation into database
async function insertEvaluation(
  studentId: string,
  subject: string,
  examDate: string,
  examTopic: string,
  score: number,
  feedback: string,
  createdBy: string
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO Evaluation (
      id, studentId, subject, examDate, examTopic,
      score, feedback, createdBy, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, studentId, subject, examDate, examTopic, score, feedback, createdBy, now, now]
  });

  return id;
}

// Main import function
async function importEvaluations(
  directoryPath: string,
  subject: string,
  examTopic: string,
  instructorEmail: string = 'rodrigodibernardo33@gmail.com'
) {
  console.log('🚀 Starting evaluation import...\n');
  console.log(`📁 Directory: ${directoryPath}`);
  console.log(`📚 Subject: ${subject}`);
  console.log(`📝 Exam Topic: ${examTopic}\n`);

  // Get instructor ID
  const instructorResult = await db.execute({
    sql: 'SELECT id FROM User WHERE email = ? AND role = "INSTRUCTOR" LIMIT 1',
    args: [instructorEmail]
  });

  if (instructorResult.rows.length === 0) {
    throw new Error(`Instructor not found: ${instructorEmail}`);
  }

  const instructorId = String(instructorResult.rows[0].id);
  console.log(`✅ Found instructor: ${instructorId}\n`);

  // Read directory
  const files = await readdir(directoryPath);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`📄 Found ${mdFiles.length} markdown files\n`);

  // Parse subject to get academic year and division
  const courseInfo = parseSubjectCourse(subject);
  if (courseInfo) {
    console.log(`📚 Extracted course info: ${courseInfo.academicYear} ${courseInfo.division}\n`);
  } else {
    console.log(`⚠️  Could not extract course info from subject: ${subject}`);
    console.log(`   Script will search students without year/division filters\n`);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each file
  for (const filename of mdFiles) {
    console.log(`\n🔄 Processing: ${filename}`);

    // Parse filename
    const parsedFile = parseFilename(filename);
    if (!parsedFile) {
      console.log(`   ⏭️  Skipped (invalid format)`);
      skipCount++;
      continue;
    }

    // Find student with course filters if available
    const student = await findStudent(
      parsedFile.firstName,
      parsedFile.lastName,
      courseInfo?.academicYear,
      courseInfo?.division
    );

    if (!student) {
      const courseFilter = courseInfo
        ? ` (${courseInfo.academicYear} ${courseInfo.division})`
        : '';
      console.log(`   ❌ Student not found: ${parsedFile.firstName} ${parsedFile.lastName}${courseFilter}`);
      errorCount++;
      continue;
    }

    console.log(`   ✅ Found student: ${student.name} (${student.id})`);

    // Read markdown content
    const filepath = join(directoryPath, filename);
    const content = await readFile(filepath, 'utf-8');

    // Extract score
    const score = extractScore(content);
    console.log(`   📊 Score: ${score}/100`);

    // Parse date
    const examDate = parseDateFromFilename(parsedFile.date);
    console.log(`   📅 Exam Date: ${examDate}`);

    // Insert evaluation
    try {
      const evaluationId = await insertEvaluation(
        student.id,
        subject,
        examDate,
        examTopic,
        score,
        content,
        instructorId
      );

      console.log(`   ✅ Inserted evaluation: ${evaluationId}`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ Error inserting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;
    }
  }

  // Summary
  console.log('\n\n📊 IMPORT SUMMARY');
  console.log('═══════════════════');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📄 Total files: ${mdFiles.length}`);
}

// CLI execution
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: npx tsx scripts/import-evaluations.ts <directory> <subject> <examTopic> [instructorEmail]');
  console.error('\nExample: npx tsx scripts/import-evaluations.ts "../Retroalimentaciones 4to C" "Física" "Tiro Oblicuo"');
  process.exit(1);
}

const [directory, subject, examTopic, instructorEmail] = args;

importEvaluations(directory, subject, examTopic, instructorEmail)
  .then(() => {
    console.log('\n\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n\n❌ Import failed:', error);
    process.exit(1);
  });
