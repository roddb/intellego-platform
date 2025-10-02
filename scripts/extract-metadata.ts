import fs from 'fs';
import path from 'path';

interface EvaluationMetadata {
  fileName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  examTopic: string;
  examDate: string; // ISO 8601
  score: number;
  feedbackContent: string;
}

interface MetadataResult {
  processDate: string;
  totalFiles: number;
  subject: string;
  evaluations: EvaluationMetadata[];
}

function convertDateToISO(dateStr: string): string {
  // Handle formats: 2/9/2025, 29/09/2025, etc.
  const parts = dateStr.trim().split('/');

  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0]; // fallback to today
}

function extractMetadataFromContent(content: string): {
  studentName: string | null;
  examDate: string | null;
  score: number | null;
  examTopic: string | null;
  subject: string | null;
} {
  let studentName: string | null = null;
  let examDate: string | null = null;
  let score: number | null = null;
  let examTopic: string | null = null;
  let subject: string | null = null;

  // Pattern 1: # RETROALIMENTACIÓN - MARTIN BAUTISTA ABELLA
  const pattern1 = content.match(/# RETROALIMENTACIÓN - (.+?)$/m);
  if (pattern1) {
    studentName = pattern1[1].trim();
  }

  // Pattern 2: **Estudiante:** Barrera, Mateo
  const pattern2 = content.match(/\*\*Estudiante:\*\*\s*(.+?)$/m);
  if (pattern2) {
    studentName = pattern2[1].trim();
  }

  // Extract date
  const dateMatch = content.match(/\*\*Fecha.*?:\*\*\s*(\d{1,2}\/\d{1,2}\/\d{4})|Fecha:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (dateMatch) {
    examDate = convertDateToISO(dateMatch[1] || dateMatch[2]);
  }

  // Extract score - try multiple patterns
  // Pattern 1: **Nota:** 58/100 or Nota: 58/100
  const scoreMatch1 = content.match(/\*\*Nota.*?:\*\*\s*(\d+\.?\d*)\s*\/\s*100|Nota:\s*(\d+\.?\d*)\s*\/\s*100/i);
  if (scoreMatch1) {
    score = Math.round(parseFloat(scoreMatch1[1] || scoreMatch1[2]));
  }

  // Pattern 2: ### **CALIFICACIÓN FINAL: 56.8/100**
  if (score === null) {
    const scoreMatch2 = content.match(/CALIFICACIÓN FINAL:\s*(\d+\.?\d*)\s*\/\s*100/i);
    if (scoreMatch2) {
      score = Math.round(parseFloat(scoreMatch2[1]));
    }
  }

  // Pattern 3: ## 🎯 NOTA FINAL: **68.0/100**
  if (score === null) {
    const scoreMatch3 = content.match(/NOTA FINAL:\s*\*\*(\d+\.?\d*)\s*\/\s*100\*\*/i);
    if (scoreMatch3) {
      score = Math.round(parseFloat(scoreMatch3[1]));
    }
  }

  // Pattern 4: ## NOTA FINAL: 92/100 (no asterisks)
  if (score === null) {
    const scoreMatch4 = content.match(/NOTA FINAL:\s*(\d+\.?\d*)\s*\/\s*100/i);
    if (scoreMatch4) {
      score = Math.round(parseFloat(scoreMatch4[1]));
    }
  }

  // Extract subject and topic
  const subjectMatch = content.match(/\*\*Examen:\*\*\s*(.+?)\s*-\s*(.+?)$|Examen:\s*(.+?)\s*-\s*(.+?)$/m);
  if (subjectMatch) {
    subject = (subjectMatch[1] || subjectMatch[3] || '').trim();
    examTopic = (subjectMatch[2] || subjectMatch[4] || '').trim();
  }

  return { studentName, examDate, score, examTopic, subject };
}

async function extractMetadata(feedbackDir: string, mappingPath: string, manualMappingPath: string): Promise<MetadataResult> {
  // Load mappings
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  const manualMapping = fs.existsSync(manualMappingPath)
    ? JSON.parse(fs.readFileSync(manualMappingPath, 'utf-8'))
    : {};

  const evaluations: EvaluationMetadata[] = [];

  // Get all .md files
  const files = fs.readdirSync(feedbackDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  console.log(`\n📂 Processing ${files.length} feedback files\n`);

  for (const file of files) {
    // Skip non-v2 version of Gaeta
    if (file === 'Gaeta_Isabel_retroalimentacion_29092025.md') {
      console.log(`⏭️  Skipping ${file} (using v2 instead)`);
      continue;
    }

    console.log(`\n📄 ${file}`);

    // Find studentId from mapping or manual mapping
    let studentId: string | null = null;
    let studentName: string | null = null;
    let studentEmail: string | null = null;

    // Check manual mapping first
    if (manualMapping[file]) {
      studentId = manualMapping[file].studentId;
      studentName = manualMapping[file].studentName;
      studentEmail = manualMapping[file].email;
      console.log(`   ✅ Manual mapping: ${studentName}`);
    } else {
      // Check automatic mapping
      const match = mapping.matches.find((m: any) => m.fileName === file);
      if (match) {
        studentId = match.studentId;
        studentName = match.studentName;
        studentEmail = match.email;
        console.log(`   ✅ Auto mapping: ${studentName}`);
      }
    }

    if (!studentId) {
      console.log(`   ❌ No mapping found - skipping`);
      continue;
    }

    // Read file content
    const filePath = path.join(feedbackDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract metadata
    const metadata = extractMetadataFromContent(content);

    console.log(`   📊 Score: ${metadata.score}/100`);
    console.log(`   📅 Date: ${metadata.examDate}`);
    console.log(`   📚 Topic: ${metadata.examTopic}`);

    if (!metadata.score || !metadata.examDate) {
      console.log(`   ⚠️  Missing critical data - attempting to continue`);
    }

    evaluations.push({
      fileName: file,
      studentId,
      studentName: studentName || 'Unknown',
      studentEmail: studentEmail || 'Unknown',
      subject: metadata.subject || 'Física',
      examTopic: metadata.examTopic || 'Tiro Oblicuo',
      examDate: metadata.examDate || '2025-09-29',
      score: metadata.score || 0,
      feedbackContent: content
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Processed: ${evaluations.length} evaluations`);
  console.log(`⏭️  Skipped: ${files.length - evaluations.length} files`);
  console.log(`📈 Success rate: ${((evaluations.length / files.length) * 100).toFixed(1)}%`);

  return {
    processDate: new Date().toISOString(),
    totalFiles: evaluations.length,
    subject: 'Física',
    evaluations
  };
}

async function main() {
  const feedbackDir = path.join(process.cwd(), 'Retroalimentaciones 4to C');
  const mappingPath = path.join(process.cwd(), 'student-mapping.json');
  const manualMappingPath = path.join(process.cwd(), 'manual-mappings.json');

  if (!fs.existsSync(feedbackDir)) {
    console.error(`❌ Directory not found: ${feedbackDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(mappingPath)) {
    console.error(`❌ Mapping file not found: ${mappingPath}`);
    console.error('Run map-students.ts first');
    process.exit(1);
  }

  const result = await extractMetadata(feedbackDir, mappingPath, manualMappingPath);

  // Save to JSON
  const outputPath = path.join(process.cwd(), 'evaluations-metadata.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved metadata to: ${outputPath}`);

  // Statistics
  const scores = result.evaluations.map(e => e.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  console.log('\n📈 SCORE STATISTICS:');
  console.log(`   Average: ${avgScore.toFixed(1)}/100`);
  console.log(`   Min: ${minScore}/100`);
  console.log(`   Max: ${maxScore}/100`);
}

main().catch(console.error);
