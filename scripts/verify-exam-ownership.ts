/**
 * Script to verify exam ownership
 *
 * Checks that each exam's feedback actually belongs to the assigned student
 * by comparing the student name in the database with the name in the feedback text
 *
 * Usage: npx tsx scripts/verify-exam-ownership.ts [--show-all]
 */

import { createClient } from '@libsql/client';

// Database client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

interface ExamOwnershipIssue {
  evaluationId: string;
  assignedStudent: string;
  assignedStudentId: string;
  feedbackStudent: string;
  subject: string;
  examTopic: string;
  examDate: string;
  similarity: number;
}

/**
 * Extract student name from feedback
 * Feedback format: "# RETROALIMENTACIÓN - APELLIDO, NOMBRE"
 */
function extractStudentFromFeedback(feedback: string): string | null {
  // Look for patterns in order of specificity
  const patterns = [
    // "RETROALIMENTACIÓN - Apellido, Nombre" or "RETROALIMENTACION - Nombre Apellido"
    /RETROALIMENTA[CÇ][IÍ][OÓ]N\s*-\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+?)(?:\n|##|$)/i,
    // "Estudiante: Nombre Apellido"
    /Estudiante:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+?)(?:\n|##|$)/i,
  ];

  for (const pattern of patterns) {
    const match = feedback.match(pattern);
    if (match) {
      const extracted = match[1].trim();
      // Filter out if it's just the exam topic or too short
      if (extracted.length > 5 && !extracted.match(/^(Gases|Tiro|Equilibrio|Termodin)/i)) {
        return extracted;
      }
    }
  }

  return null;
}

/**
 * Normalize name for comparison
 * Converts "APELLIDO, NOMBRE" to "nombre apellido"
 */
function normalizeName(name: string): string {
  // Remove extra spaces and convert to lowercase
  let normalized = name.toLowerCase().trim();

  // Remove accents
  normalized = normalized
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n');

  // If format is "APELLIDO, NOMBRE", reverse it
  if (normalized.includes(',')) {
    const parts = normalized.split(',').map(p => p.trim());
    normalized = `${parts[1]} ${parts[0]}`;
  }

  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Calculate string similarity (simple word matching)
 */
function calculateSimilarity(name1: string, name2: string): number {
  const words1 = normalizeName(name1).split(' ');
  const words2 = normalizeName(name2).split(' ');

  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 && word1.length > 2) {
        matches++;
      }
    }
  }

  const totalWords = Math.max(words1.length, words2.length);
  return (matches / totalWords) * 100;
}

/**
 * Get all evaluations with feedback
 */
async function getAllEvaluations() {
  const result = await db.execute(`
    SELECT
      e.id,
      e.studentId,
      u.name as studentName,
      u.studentId as studentCode,
      e.subject,
      e.examTopic,
      e.examDate,
      e.feedback
    FROM Evaluation e
    JOIN User u ON e.studentId = u.id
    WHERE u.role = 'STUDENT'
    ORDER BY e.examDate DESC
  `);

  return result.rows;
}

/**
 * Verify exam ownership
 */
async function verifyOwnership(showAll: boolean = false) {
  console.log('🔍 Exam Ownership Verification');
  console.log('='.repeat(80));
  console.log('\nChecking that each exam belongs to the assigned student...\n');

  const evaluations = await getAllEvaluations();
  console.log(`📊 Total evaluations to check: ${evaluations.length}\n`);

  const issues: ExamOwnershipIssue[] = [];
  let checked = 0;
  let couldNotExtract = 0;

  for (const row of evaluations) {
    const evaluationId = String(row.id);
    const assignedStudent = String(row.studentName);
    const studentCode = String(row.studentCode);
    const feedback = String(row.feedback || '');
    const subject = String(row.subject);
    const examTopic = String(row.examTopic);
    const examDate = String(row.examDate);

    checked++;

    // Extract student name from feedback
    const feedbackStudent = extractStudentFromFeedback(feedback);

    if (!feedbackStudent) {
      couldNotExtract++;
      if (showAll) {
        console.log(`⚠️  Could not extract student from feedback: ${evaluationId}`);
        console.log(`   Assigned: ${assignedStudent}`);
        console.log(`   Subject: ${subject} - ${examTopic}\n`);
      }
      continue;
    }

    // Calculate similarity
    const similarity = calculateSimilarity(assignedStudent, feedbackStudent);

    // If similarity is very low, it's likely a mismatch
    // Using threshold of 30% to avoid false positives from partial names like "Pasarin, Matilde" vs "Matilde Pasarin de la Torre"
    if (similarity < 30) {
      issues.push({
        evaluationId,
        assignedStudent,
        assignedStudentId: studentCode,
        feedbackStudent,
        subject,
        examTopic,
        examDate,
        similarity
      });
    } else if (showAll && similarity < 100) {
      console.log(`ℹ️  Partial match (${similarity.toFixed(0)}%): ${evaluationId}`);
      console.log(`   Assigned: ${assignedStudent}`);
      console.log(`   Feedback: ${feedbackStudent}`);
      console.log(`   Subject: ${subject} - ${examTopic}\n`);
    }
  }

  // Results
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(80));

  console.log(`\nTotal evaluations checked: ${checked}`);
  console.log(`✅ Could extract name: ${checked - couldNotExtract}`);
  console.log(`⚠️  Could not extract name: ${couldNotExtract}`);
  console.log(`\n🔍 Ownership Issues Found: ${issues.length}`);

  if (issues.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ MISMATCHED EXAMS (Student name doesn\'t match feedback)');
    console.log('='.repeat(80));

    for (const issue of issues) {
      console.log(`\n📝 Evaluation ID: ${issue.evaluationId}`);
      console.log(`   📚 Subject: ${issue.subject} - ${issue.examTopic}`);
      console.log(`   📅 Date: ${issue.examDate}`);
      console.log(`   👤 Assigned to: ${issue.assignedStudent} (${issue.assignedStudentId})`);
      console.log(`   📄 Feedback says: ${issue.feedbackStudent}`);
      console.log(`   📊 Similarity: ${issue.similarity.toFixed(0)}%`);
      console.log(`   ⚠️  LIKELY WRONG STUDENT!`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 RECOMMENDATION');
    console.log('='.repeat(80));
    console.log(`\nFound ${issues.length} exam(s) that may be assigned to the wrong student.`);
    console.log('These exams should be reviewed and reassigned to the correct students.\n');

  } else {
    console.log('\n✅ All exams appear to be correctly assigned!\n');
  }

  // Export issues
  if (issues.length > 0) {
    const fs = await import('fs');
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `scripts/exam_ownership_issues_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalChecked: checked,
      issuesFound: issues.length,
      issues: issues
    }, null, 2));

    console.log(`📄 Issues exported to: ${filename}\n`);
  }

  console.log('='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const showAll = args.includes('--show-all');

  try {
    await verifyOwnership(showAll);
    console.log('\n✅ Verification completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    process.exit(1);
  }
}

// Execute
main();
