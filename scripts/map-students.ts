import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/db';

interface StudentMapping {
  fileName: string;
  extractedName: string;
  studentId: string | null;
  studentName: string | null;
  email: string | null;
  confidence: 'exact' | 'partial' | 'none';
}

interface MappingResult {
  matches: StudentMapping[];
  unresolved: Array<{
    fileName: string;
    extractedName: string;
    reason: string;
  }>;
  ambiguous: Array<{
    fileName: string;
    extractedName: string;
    candidates: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  }>;
}

async function findStudentByName(searchName: string): Promise<{
  id: string;
  name: string;
  email: string;
}[]> {
  // Normalize search name
  const normalized = searchName.toLowerCase().trim();

  // Try exact match first
  let result = await db().execute({
    sql: `SELECT id, name, email FROM User WHERE role = 'STUDENT' AND LOWER(name) = ?`,
    args: [normalized]
  });

  if (result.rows.length > 0) {
    return result.rows as any[];
  }

  // Try partial match with all words
  const words = normalized.split(/[\s_]+/);
  const likeConditions = words.map(() => `LOWER(name) LIKE ?`).join(' AND ');
  const likeArgs = words.map(w => `%${w}%`);

  result = await db().execute({
    sql: `SELECT id, name, email FROM User WHERE role = 'STUDENT' AND ${likeConditions}`,
    args: likeArgs
  });

  if (result.rows.length > 0) {
    return result.rows as any[];
  }

  // Try with last name only (first word in filename)
  const lastName = words[0];
  result = await db().execute({
    sql: `SELECT id, name, email FROM User WHERE role = 'STUDENT' AND LOWER(name) LIKE ?`,
    args: [`%${lastName}%`]
  });

  return result.rows as any[];
}

function extractNameFromFilename(filename: string): string {
  // Remove .md extension and retroalimentacion part
  // Example: Abella_Martin_retroalimentacion_17092025.md → Abella Martin
  const base = path.basename(filename, '.md');
  const parts = base.split('_');

  // Find index of "retroalimentacion"
  const retroIndex = parts.findIndex(p => p.toLowerCase() === 'retroalimentacion');

  if (retroIndex > 0) {
    // Take all parts before "retroalimentacion"
    return parts.slice(0, retroIndex).join(' ');
  }

  return base.replace(/_/g, ' ');
}

async function mapStudents(feedbackDir: string): Promise<MappingResult> {
  const result: MappingResult = {
    matches: [],
    unresolved: [],
    ambiguous: []
  };

  // Get all .md files
  const files = fs.readdirSync(feedbackDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  console.log(`\n📂 Found ${files.length} feedback files\n`);

  for (const file of files) {
    const extractedName = extractNameFromFilename(file);
    console.log(`\n📄 ${file}`);
    console.log(`   Extracted name: ${extractedName}`);

    const candidates = await findStudentByName(extractedName);

    if (candidates.length === 0) {
      console.log(`   ❌ No match found`);
      result.unresolved.push({
        fileName: file,
        extractedName,
        reason: 'not_found_in_db'
      });
    } else if (candidates.length === 1) {
      console.log(`   ✅ Match: ${candidates[0].name} (${candidates[0].email})`);
      result.matches.push({
        fileName: file,
        extractedName,
        studentId: candidates[0].id,
        studentName: candidates[0].name,
        email: candidates[0].email,
        confidence: 'exact'
      });
    } else {
      console.log(`   ⚠️  Multiple matches (${candidates.length}):`);
      candidates.forEach(c => console.log(`      - ${c.name} (${c.email})`));
      result.ambiguous.push({
        fileName: file,
        extractedName,
        candidates: candidates.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email
        }))
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MAPPING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Matched: ${result.matches.length}`);
  console.log(`❌ Unresolved: ${result.unresolved.length}`);
  console.log(`⚠️  Ambiguous: ${result.ambiguous.length}`);
  console.log(`📈 Success rate: ${((result.matches.length / files.length) * 100).toFixed(1)}%`);

  return result;
}

async function main() {
  const feedbackDir = path.join(process.cwd(), 'Retroalimentaciones 4to C');

  if (!fs.existsSync(feedbackDir)) {
    console.error(`❌ Directory not found: ${feedbackDir}`);
    process.exit(1);
  }

  const result = await mapStudents(feedbackDir);

  // Save to JSON
  const outputPath = path.join(process.cwd(), 'student-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved mapping to: ${outputPath}`);

  // Print unresolved if any
  if (result.unresolved.length > 0) {
    console.log('\n⚠️  UNRESOLVED STUDENTS:');
    result.unresolved.forEach(u => {
      console.log(`   - ${u.fileName}: ${u.extractedName}`);
    });
    console.log('\n💡 Create manual-mappings.json to resolve these');
  }

  // Print ambiguous if any
  if (result.ambiguous.length > 0) {
    console.log('\n⚠️  AMBIGUOUS MATCHES:');
    result.ambiguous.forEach(a => {
      console.log(`   - ${a.fileName}: ${a.extractedName}`);
      a.candidates.forEach(c => console.log(`     └─ ${c.name} (ID: ${c.id})`));
    });
    console.log('\n💡 Add correct ID to manual-mappings.json');
  }
}

main().catch(console.error);
