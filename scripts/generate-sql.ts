import fs from 'fs';
import path from 'path';

interface EvaluationMetadata {
  fileName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  examTopic: string;
  examDate: string;
  score: number;
  feedbackContent: string;
}

interface MetadataResult {
  processDate: string;
  totalFiles: number;
  subject: string;
  evaluations: EvaluationMetadata[];
}

function escapeSQLString(str: string): string {
  // Escape single quotes for SQL
  return str.replace(/'/g, "''");
}

function generateSQLInsert(evaluation: EvaluationMetadata, createdBy: string): string {
  const feedback = escapeSQLString(evaluation.feedbackContent);

  return `-- ${evaluation.fileName}
INSERT INTO Evaluation (
  id,
  studentId,
  subject,
  examDate,
  examTopic,
  score,
  feedback,
  createdBy,
  createdAt,
  updatedAt
) VALUES (
  'eval_' || lower(hex(randomblob(16))),
  '${evaluation.studentId}',
  '${evaluation.subject}',
  '${evaluation.examDate}',
  '${escapeSQLString(evaluation.examTopic)}',
  ${evaluation.score},
  '${feedback}',
  '${createdBy}',
  datetime('now'),
  datetime('now')
);`;
}

async function main() {
  const metadataPath = path.join(process.cwd(), 'evaluations-metadata.json');

  if (!fs.existsSync(metadataPath)) {
    console.error('❌ evaluations-metadata.json not found');
    console.error('Run extract-metadata.ts first');
    process.exit(1);
  }

  const metadata: MetadataResult = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  // Instructor ID for RDB
  const createdBy = '3d47c07d-3785-493a-b07b-ee34da1113b4';

  console.log('\n🔨 Generating SQL script...\n');

  let sql = `-- BATCH INSERT: ${metadata.totalFiles} Evaluations
-- Subject: ${metadata.subject}
-- Generated: ${new Date().toISOString()}
-- Created by: RDB (${createdBy})

BEGIN TRANSACTION;

`;

  // Generate INSERT for each evaluation
  for (const evaluation of metadata.evaluations) {
    sql += generateSQLInsert(evaluation, createdBy) + '\n\n';
  }

  sql += `COMMIT;

-- Verification query
SELECT
  COUNT(*) as total_inserted,
  subject,
  AVG(score) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score
FROM Evaluation
WHERE createdBy = '${createdBy}'
  AND createdAt >= date('now', '-1 hour')
GROUP BY subject;
`;

  // Save to file
  const outputPath = path.join(process.cwd(), 'insert-evaluations.sql');
  fs.writeFileSync(outputPath, sql);

  console.log(`✅ SQL script generated: ${outputPath}`);
  console.log(`📊 Total statements: ${metadata.totalFiles} INSERTs`);
  console.log(`📏 File size: ${(sql.length / 1024).toFixed(1)} KB`);
  console.log(`\n💡 Execute with:`);
  console.log(`   cat insert-evaluations.sql | turso db shell intellego-production`);
}

main().catch(console.error);
