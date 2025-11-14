/**
 * Migration Script: Fix Formatting Issues in Clinical Cases
 *
 * Issues fixed:
 * 1. Remove markdown bold asterisks (**text** → text)
 * 2. Convert markdown tables to HTML tables
 * 3. Simplify question placeholders (remove examples)
 * 4. Format sub-questions vertically with line breaks
 *
 * Applies to all 3 clinical cases:
 * - Caso 1: Hipocalemia
 * - Caso 2: Esclerosis Múltiple
 * - Caso 3: Lambert-Eaton
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

/**
 * Remove markdown bold asterisks from text
 */
function removeBoldAsterisks(text: string): string {
  // Remove **text** and replace with text
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}

/**
 * Convert markdown table to HTML table
 */
function convertMarkdownTableToHTML(text: string): string {
  // Match markdown tables
  const tableRegex = /(\|[^\n]+\|\n)+/g;

  return text.replace(tableRegex, (match) => {
    const lines = match.trim().split('\n').filter(line => line.trim());

    if (lines.length < 2) return match;

    // First line is header
    const headerLine = lines[0];
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0)
      .map(h => removeBoldAsterisks(h));

    // Second line is separator (skip it)
    // Remaining lines are data rows
    const dataLines = lines.slice(2);

    let html = '<table class="border-collapse w-full my-4">\n';

    // Header
    html += '  <thead>\n    <tr class="bg-slate-100 border-b-2 border-slate-300">\n';
    headers.forEach(header => {
      html += `      <th class="px-4 py-2 text-left font-semibold text-slate-700">${header}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';

    // Body
    html += '  <tbody>\n';
    dataLines.forEach(line => {
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map(c => removeBoldAsterisks(c));

      html += '    <tr class="border-b border-slate-200">\n';
      cells.forEach(cell => {
        html += `      <td class="px-4 py-2 text-slate-600">${cell}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n';
    html += '</table>\n';

    return html;
  });
}

/**
 * Process case text: remove bold asterisks and convert tables
 */
function processCaseText(text: string): string {
  // First convert tables (before removing asterisks from table content)
  let processed = convertMarkdownTableToHTML(text);

  // Then remove remaining bold asterisks
  processed = removeBoldAsterisks(processed);

  return processed;
}

/**
 * Fix question text to format sub-questions vertically
 */
function formatSubQuestionsVertically(text: string): string {
  // Pattern: "(A) text, (B) text, (C) text" or "(A) text. (B) text. (C) text"
  // Replace with vertical formatting

  // Match patterns like: (A) ... (B) ... (C) ...
  // But only if they're part of the same sentence/question
  const subQuestionPattern = /\(([A-Z])\)\s*([^(]+?)(?=\s*\([A-Z]\)|$)/g;

  const matches = text.match(subQuestionPattern);

  if (matches && matches.length > 1) {
    // Has multiple sub-questions - format vertically
    let formatted = text.replace(subQuestionPattern, (match, letter, content) => {
      const trimmedContent = content.trim().replace(/[,.:;]$/, '');
      return `\n\n(${letter}) ${trimmedContent}`;
    });

    // Clean up leading newlines
    formatted = formatted.replace(/^\n+/, '');

    return formatted;
  }

  return text;
}

/**
 * Simplify placeholder text (remove examples)
 * Returns generic, short prompts for all questions
 */
function simplifyPlaceholder(placeholder: string | undefined, questionType?: string): string {
  if (!placeholder) return 'Desarrolle su respuesta aquí...';

  // For calculation questions, use calculation-specific placeholder
  if (questionType === 'calculation' || placeholder.includes('=') || placeholder.includes('×') || placeholder.includes('log')) {
    return 'Desarrolle el cálculo completo con unidades...';
  }

  // For conceptual/text questions, use generic placeholder
  return 'Desarrolle su respuesta aquí...';
}

/**
 * Main migration function
 */
async function fixClinicalCasesFormatting(): Promise<void> {
  console.log('🔧 Iniciando corrección de formato de casos clínicos...\n');

  try {
    // Fetch all active clinical cases
    const result = await db.execute(
      `SELECT id, title, caseText, questions
       FROM ConsudecActivity
       WHERE activityType = 'clinical' AND status = 'active'
       ORDER BY title`
    );

    console.log(`📋 Encontrados ${result.rows.length} casos clínicos activos:\n`);

    for (const row of result.rows) {
      const activityId = row.id as string;
      const title = row.title as string;
      const caseText = row.caseText as string;
      const questionsJson = row.questions as string;

      console.log(`\n🔧 Procesando: ${title}`);
      console.log(`   ID: ${activityId}`);

      // Process case text
      const updatedCaseText = processCaseText(caseText);

      // Process questions
      const questions = JSON.parse(questionsJson);
      let questionsModified = false;

      questions.forEach((q: any, index: number) => {
        // Fix question text (format sub-questions vertically)
        const originalText = q.text;
        q.text = formatSubQuestionsVertically(q.text);

        if (q.text !== originalText) {
          console.log(`   ✓ Formateada pregunta ${index + 1} (incisos verticales)`);
          questionsModified = true;
        }

        // Simplify placeholder (pass question type for better placeholder selection)
        if (q.placeholder) {
          const originalPlaceholder = q.placeholder;
          q.placeholder = simplifyPlaceholder(q.placeholder, q.questionType);

          if (q.placeholder !== originalPlaceholder) {
            console.log(`   ✓ Simplificado placeholder de pregunta ${index + 1}: "${q.placeholder}"`);
            questionsModified = true;
          }
        }
      });

      // Update database
      const updatedQuestionsJson = JSON.stringify(questions);

      await db.execute({
        sql: `UPDATE ConsudecActivity
              SET caseText = ?, questions = ?, updatedAt = ?
              WHERE id = ?`,
        args: [updatedCaseText, updatedQuestionsJson, new Date().toISOString(), activityId],
      });

      console.log(`   ✅ Actualizado en base de datos`);
      console.log(`      - Texto del caso: ${caseText.length} → ${updatedCaseText.length} caracteres`);
      console.log(`      - Preguntas modificadas: ${questionsModified ? 'Sí' : 'No'}`);
    }

    console.log('\n\n✅ ¡Migración completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Casos procesados: ${result.rows.length}`);
    console.log(`   - Correcciones aplicadas:`);
    console.log(`     • Asteriscos de negrita eliminados`);
    console.log(`     • Tablas convertidas a HTML`);
    console.log(`     • Placeholders simplificados`);
    console.log(`     • Incisos formateados verticalmente`);

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error durante la migración:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('❌ Error desconocido:', error);
    }
    throw error;
  }
}

// Execute migration
fixClinicalCasesFormatting()
  .then(() => {
    console.log('\n🎉 Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script falló:', error);
    process.exit(1);
  });
