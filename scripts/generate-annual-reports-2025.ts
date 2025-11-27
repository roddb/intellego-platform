/**
 * Annual Progress Report Generator 2025
 *
 * Generates comprehensive annual progress reports for students based on their
 * weekly feedback data from the feedbacks_2025_export directory.
 *
 * Features:
 * - Checkpoint system to track progress and resume interrupted batches
 * - Processes students in alphabetical order
 * - Generates detailed reports with trends, achievements, and recommendations
 * - Outputs reports as JSON and formatted markdown files
 *
 * Usage: npx tsx scripts/generate-annual-reports-2025.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface FeedbackMetadata {
  studentId: string;
  studentName: string;
  subject: string;
  academicYear: number;
  generatedAt: string;
  statistics: {
    totalFeedbacks: number;
    feedbacksWithScore: number;
    averageScore: number;
    minScore: number;
    maxScore: number;
    weeksCovered: number;
    dateRange: {
      firstWeek: string;
      lastWeek: string;
    };
  };
}

interface FeedbackEntry {
  feedbackId: string;
  weekStart: string;
  score: number;
  generalComments: string;
  strengths: string | string[];
  improvements: string | string[];
  createdAt: string;
}

interface StudentFeedbackData {
  metadata: FeedbackMetadata;
  feedbacks: FeedbackEntry[];
}

interface ProgressTrend {
  type: 'improving' | 'stable' | 'declining' | 'fluctuating';
  description: string;
  evidence: string[];
}

interface SkillAnalysis {
  skill: string;
  level: 'strong' | 'developing' | 'needs_attention';
  frequency: number;
  examples: string[];
}

interface AnnualReport {
  studentId: string;
  studentName: string;
  subject: string;
  academicYear: number;
  generatedAt: string;

  summary: {
    totalWeeks: number;
    averageScore: number;
    scoreRange: { min: number; max: number };
    overallTrend: ProgressTrend;
  };

  performanceAnalysis: {
    scoreTrend: number[];
    weekLabels: string[];
    phaseProgression: string;
  };

  strengthsAnalysis: {
    topStrengths: SkillAnalysis[];
    consistentStrengths: string[];
  };

  areasForGrowth: {
    commonChallenges: SkillAnalysis[];
    recommendedActions: string[];
  };

  achievements: string[];
  recommendations: string[];

  detailedTimeline: {
    week: string;
    score: number;
    phase: string;
    keyInsights: string[];
  }[];
}

interface Checkpoint {
  lastProcessedStudent: string;
  processedCount: number;
  totalStudents: number;
  timestamp: string;
  completedStudents: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPORT_DIR = path.join(process.cwd(), 'feedbacks_2025_export');
const OUTPUT_DIR = path.join(process.cwd(), 'annual_reports_2025');
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, '.checkpoint.json');

// ============================================================================
// CHECKPOINT MANAGEMENT
// ============================================================================

function loadCheckpoint(): Checkpoint | null {
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(CHECKPOINT_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn('⚠️  Failed to load checkpoint:', error.message);
    }
    return null;
  }
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), 'utf-8');
    console.log('✅ Checkpoint saved');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Failed to save checkpoint:', error.message);
    }
  }
}

function initializeCheckpoint(totalStudents: number): Checkpoint {
  return {
    lastProcessedStudent: '',
    processedCount: 0,
    totalStudents: totalStudents,
    timestamp: new Date().toISOString(),
    completedStudents: [],
  };
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

function getAllStudentFiles(): string[] {
  const files = fs.readdirSync(EXPORT_DIR);
  return files
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function loadStudentData(filename: string): StudentFeedbackData | null {
  try {
    const filepath = path.join(EXPORT_DIR, filename);
    const data = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Failed to load ${filename}:`, error.message);
    }
    return null;
  }
}

function ensureOutputDirectory(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function calculateTrend(scores: number[]): ProgressTrend {
  if (scores.length < 3) {
    return {
      type: 'stable',
      description: 'Insufficient data for trend analysis',
      evidence: ['Less than 3 data points available'],
    };
  }

  // Calculate linear regression slope
  const n = scores.length;
  const indices = scores.map((_, i) => i);
  const meanX = indices.reduce((a, b) => a + b, 0) / n;
  const meanY = scores.reduce((a, b) => a + b, 0) / n;

  const numerator = indices.reduce((sum, x, i) => sum + (x - meanX) * (scores[i] - meanY), 0);
  const denominator = indices.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
  const slope = numerator / denominator;

  // Calculate variance to detect fluctuation
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - meanY, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Determine trend type
  let type: ProgressTrend['type'];
  let description: string;
  const evidence: string[] = [];

  if (stdDev > 15) {
    type = 'fluctuating';
    description = 'Performance shows significant variation across weeks';
    evidence.push(`High variability detected (σ=${stdDev.toFixed(1)})`);
  } else if (slope > 2) {
    type = 'improving';
    description = 'Consistent upward trajectory in performance';
    evidence.push(`Positive trend: +${slope.toFixed(1)} points per week`);
  } else if (slope < -2) {
    type = 'declining';
    description = 'Performance showing downward trend';
    evidence.push(`Negative trend: ${slope.toFixed(1)} points per week`);
  } else {
    type = 'stable';
    description = 'Maintaining consistent performance level';
    evidence.push(`Stable performance around ${meanY.toFixed(0)} points`);
  }

  // Add range evidence
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  evidence.push(`Score range: ${min}-${max} points`);

  return { type, description, evidence };
}

function analyzeStrengths(feedbacks: FeedbackEntry[]): SkillAnalysis[] {
  const strengthMap = new Map<string, { count: number; examples: string[] }>();

  for (const feedback of feedbacks) {
    const strengths = Array.isArray(feedback.strengths)
      ? feedback.strengths
      : (typeof feedback.strengths === 'string' ? [feedback.strengths] : []);

    for (const strength of strengths) {
      if (!strength || strength.trim() === '' || strength === 'No se identificaron fortalezas específicas.') {
        continue;
      }

      const key = extractSkillCategory(strength);
      const existing = strengthMap.get(key) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(strength);
      }
      strengthMap.set(key, existing);
    }
  }

  const analyses: SkillAnalysis[] = [];

  for (const [skill, data] of strengthMap.entries()) {
    const frequency = data.count;
    let level: SkillAnalysis['level'];

    if (frequency >= feedbacks.length * 0.6) {
      level = 'strong';
    } else if (frequency >= feedbacks.length * 0.3) {
      level = 'developing';
    } else {
      level = 'needs_attention';
    }

    analyses.push({
      skill,
      level,
      frequency,
      examples: data.examples.slice(0, 2),
    });
  }

  return analyses.sort((a, b) => b.frequency - a.frequency);
}

function analyzeChallenges(feedbacks: FeedbackEntry[]): SkillAnalysis[] {
  const challengeMap = new Map<string, { count: number; examples: string[] }>();

  for (const feedback of feedbacks) {
    const improvements = Array.isArray(feedback.improvements)
      ? feedback.improvements
      : (typeof feedback.improvements === 'string' ? [feedback.improvements] : []);

    for (const improvement of improvements) {
      if (!improvement || improvement.trim() === '' || improvement === 'No se identificaron áreas de mejora específicas.') {
        continue;
      }

      const key = extractSkillCategory(improvement);
      const existing = challengeMap.get(key) || { count: 0, examples: [] };
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(improvement);
      }
      challengeMap.set(key, existing);
    }
  }

  const analyses: SkillAnalysis[] = [];

  for (const [skill, data] of challengeMap.entries()) {
    const frequency = data.count;
    let level: SkillAnalysis['level'];

    if (frequency >= feedbacks.length * 0.6) {
      level = 'needs_attention';
    } else if (frequency >= feedbacks.length * 0.3) {
      level = 'developing';
    } else {
      level = 'strong';
    }

    analyses.push({
      skill,
      level,
      frequency,
      examples: data.examples.slice(0, 2),
    });
  }

  return analyses.sort((a, b) => b.frequency - a.frequency);
}

function extractSkillCategory(text: string): string {
  const lowerText = text.toLowerCase();

  // Map keywords to skill categories
  if (lowerText.includes('variable') || lowerText.includes('identificar') || lowerText.includes('clasificar')) {
    return 'Identificación de Variables';
  }
  if (lowerText.includes('herramienta') || lowerText.includes('fórmula') || lowerText.includes('ecuación')) {
    return 'Selección de Herramientas';
  }
  if (lowerText.includes('estrategia') || lowerText.includes('ejecución') || lowerText.includes('resolución')) {
    return 'Estrategia y Ejecución';
  }
  if (lowerText.includes('reflexión') || lowerText.includes('metacognición') || lowerText.includes('autoevaluación')) {
    return 'Reflexión Metacognitiva';
  }
  if (lowerText.includes('evidencia') || lowerText.includes('justificación') || lowerText.includes('fundamentación')) {
    return 'Fundamentación';
  }
  if (lowerText.includes('cálculo') || lowerText.includes('numérico') || lowerText.includes('operación')) {
    return 'Ejecución Matemática';
  }
  if (lowerText.includes('comprensión') || lowerText.includes('concepto') || lowerText.includes('teoría')) {
    return 'Comprensión Conceptual';
  }
  if (lowerText.includes('aplicación') || lowerText.includes('contexto') || lowerText.includes('situación real')) {
    return 'Aplicación Práctica';
  }

  // Default category
  return 'Habilidad General';
}

function identifyPhase(score: number): string {
  if (score >= 80) return 'Fase 4: Excelencia';
  if (score >= 65) return 'Fase 3: Competencia';
  if (score >= 50) return 'Fase 2: Desarrollo';
  return 'Fase 1: Inicial';
}

function generateAchievements(data: StudentFeedbackData, trend: ProgressTrend): string[] {
  const achievements: string[] = [];
  const { statistics } = data.metadata;

  // Consistency achievement
  if (statistics.totalFeedbacks >= 8) {
    achievements.push(`Completó ${statistics.totalFeedbacks} semanas de reportes, demostrando compromiso sostenido`);
  }

  // Score achievements
  if (statistics.maxScore >= 80) {
    achievements.push(`Alcanzó puntuaciones superiores a 80 puntos, demostrando dominio avanzado`);
  }

  // Improvement achievement
  if (trend.type === 'improving') {
    achievements.push('Mostró mejora constante a lo largo del período académico');
  }

  // Stability achievement
  if (trend.type === 'stable' && statistics.averageScore >= 65) {
    achievements.push('Mantuvo rendimiento consistente en nivel competente');
  }

  return achievements;
}

function generateRecommendations(
  challenges: SkillAnalysis[],
  trend: ProgressTrend,
  avgScore: number
): string[] {
  const recommendations: string[] = [];

  // Based on trend
  if (trend.type === 'declining') {
    recommendations.push('Programar sesión de tutoría para identificar obstáculos y ajustar estrategias de estudio');
  }

  if (trend.type === 'fluctuating') {
    recommendations.push('Establecer rutina de estudio más estructurada para mantener consistencia en el desempeño');
  }

  // Based on top challenges
  const topChallenges = challenges.slice(0, 3);
  for (const challenge of topChallenges) {
    if (challenge.skill === 'Reflexión Metacognitiva') {
      recommendations.push('Dedicar tiempo semanal a reflexionar explícitamente sobre el proceso de aprendizaje');
    }
    if (challenge.skill === 'Fundamentación') {
      recommendations.push('Practicar justificar cada paso del razonamiento con evidencias específicas');
    }
    if (challenge.skill === 'Ejecución Matemática') {
      recommendations.push('Reforzar práctica de cálculos con ejercicios adicionales supervisados');
    }
  }

  // Based on average score
  if (avgScore < 50) {
    recommendations.push('Considerar apoyo adicional con tutorías individualizadas');
  } else if (avgScore >= 65 && avgScore < 80) {
    recommendations.push('Explorar desafíos más complejos para alcanzar nivel de excelencia');
  }

  return recommendations;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateAnnualReport(data: StudentFeedbackData): AnnualReport {
  const { metadata, feedbacks } = data;

  // Extract scores and weeks
  const scores = feedbacks.filter((f) => f.score > 0).map((f) => f.score);
  const weekLabels = feedbacks.map((f) => {
    const date = new Date(f.weekStart);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // Analyze trends and skills
  const overallTrend = calculateTrend(scores);
  const strengthsAnalysis = analyzeStrengths(feedbacks);
  const challengesAnalysis = analyzeChallenges(feedbacks);

  // Generate achievements and recommendations
  const achievements = generateAchievements(data, overallTrend);
  const recommendations = generateRecommendations(challengesAnalysis, overallTrend, metadata.statistics.averageScore);

  // Build detailed timeline
  const detailedTimeline = feedbacks.map((f) => {
    const keyInsights: string[] = [];

    if (Array.isArray(f.strengths)) {
      keyInsights.push(...f.strengths.slice(0, 2));
    }
    if (Array.isArray(f.improvements)) {
      keyInsights.push(...f.improvements.slice(0, 1));
    }

    return {
      week: f.weekStart,
      score: f.score,
      phase: identifyPhase(f.score),
      keyInsights,
    };
  });

  // Identify consistent strengths (appear in >50% of weeks)
  const consistentStrengths = strengthsAnalysis
    .filter((s) => s.frequency >= feedbacks.length * 0.5)
    .map((s) => s.skill);

  return {
    studentId: metadata.studentId,
    studentName: metadata.studentName,
    subject: metadata.subject,
    academicYear: metadata.academicYear,
    generatedAt: new Date().toISOString(),

    summary: {
      totalWeeks: metadata.statistics.totalFeedbacks,
      averageScore: metadata.statistics.averageScore,
      scoreRange: {
        min: metadata.statistics.minScore,
        max: metadata.statistics.maxScore,
      },
      overallTrend,
    },

    performanceAnalysis: {
      scoreTrend: scores,
      weekLabels,
      phaseProgression: `Rango: ${identifyPhase(metadata.statistics.minScore)} → ${identifyPhase(metadata.statistics.maxScore)}`,
    },

    strengthsAnalysis: {
      topStrengths: strengthsAnalysis.slice(0, 5),
      consistentStrengths,
    },

    areasForGrowth: {
      commonChallenges: challengesAnalysis.slice(0, 5),
      recommendedActions: recommendations,
    },

    achievements,
    recommendations,
    detailedTimeline,
  };
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

function saveReportJSON(report: AnnualReport): void {
  const filename = `${report.studentName.replace(/\s/g, '_')}_${report.subject}_Annual_Report.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`   📄 JSON: ${filename}`);
}

function saveReportMarkdown(report: AnnualReport): void {
  const filename = `${report.studentName.replace(/\s/g, '_')}_${report.subject}_Annual_Report.md`;
  const filepath = path.join(OUTPUT_DIR, filename);

  let markdown = '';

  // Header
  markdown += `# Reporte Anual de Progreso 2025\n\n`;
  markdown += `**Estudiante:** ${report.studentName}\n`;
  markdown += `**Materia:** ${report.subject}\n`;
  markdown += `**Año Académico:** ${report.academicYear}\n`;
  markdown += `**Generado:** ${new Date(report.generatedAt).toLocaleDateString('es-AR')}\n\n`;
  markdown += `---\n\n`;

  // Summary
  markdown += `## 📊 Resumen Ejecutivo\n\n`;
  markdown += `- **Semanas Completadas:** ${report.summary.totalWeeks}\n`;
  markdown += `- **Promedio General:** ${report.summary.averageScore.toFixed(1)} puntos\n`;
  markdown += `- **Rango de Puntuación:** ${report.summary.scoreRange.min} - ${report.summary.scoreRange.max}\n`;
  markdown += `- **Tendencia:** ${report.summary.overallTrend.description}\n\n`;

  // Achievements
  if (report.achievements.length > 0) {
    markdown += `## 🏆 Logros Destacados\n\n`;
    for (const achievement of report.achievements) {
      markdown += `- ${achievement}\n`;
    }
    markdown += `\n`;
  }

  // Strengths
  markdown += `## 💪 Fortalezas Identificadas\n\n`;
  if (report.strengthsAnalysis.consistentStrengths.length > 0) {
    markdown += `### Fortalezas Consistentes\n`;
    for (const strength of report.strengthsAnalysis.consistentStrengths) {
      markdown += `- **${strength}** (demostrado de manera sostenida)\n`;
    }
    markdown += `\n`;
  }

  markdown += `### Top 5 Habilidades\n`;
  for (const strength of report.strengthsAnalysis.topStrengths) {
    markdown += `\n**${strength.skill}** (${strength.frequency} menciones)\n`;
    for (const example of strength.examples) {
      markdown += `- ${example}\n`;
    }
  }
  markdown += `\n`;

  // Areas for Growth
  markdown += `## 🎯 Áreas de Crecimiento\n\n`;
  for (const challenge of report.areasForGrowth.commonChallenges) {
    markdown += `\n**${challenge.skill}** (${challenge.frequency} menciones)\n`;
    for (const example of challenge.examples) {
      markdown += `- ${example}\n`;
    }
  }
  markdown += `\n`;

  // Recommendations
  markdown += `## 💡 Recomendaciones\n\n`;
  for (const rec of report.recommendations) {
    markdown += `- ${rec}\n`;
  }
  markdown += `\n`;

  // Timeline
  markdown += `## 📅 Línea de Tiempo Detallada\n\n`;
  markdown += `| Semana | Puntuación | Fase | Observaciones Clave |\n`;
  markdown += `|--------|------------|------|---------------------|\n`;

  for (const entry of report.detailedTimeline) {
    const weekDate = new Date(entry.week).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    const insights = entry.keyInsights.slice(0, 2).join('; ');
    markdown += `| ${weekDate} | ${entry.score} | ${entry.phase} | ${insights} |\n`;
  }

  markdown += `\n---\n\n`;
  markdown += `*Reporte generado automáticamente por el sistema Intellego Platform*\n`;

  fs.writeFileSync(filepath, markdown, 'utf-8');
  console.log(`   📝 Markdown: ${filename}`);
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

async function processStudent(filename: string, index: number, total: number): Promise<boolean> {
  console.log(`\n[${index + 1}/${total}] Procesando: ${filename}`);
  console.log('─'.repeat(60));

  const data = loadStudentData(filename);
  if (!data) {
    console.log('   ⚠️  Skipping due to load error');
    return false;
  }

  console.log(`   Estudiante: ${data.metadata.studentName}`);
  console.log(`   Materia: ${data.metadata.subject}`);
  console.log(`   Feedbacks: ${data.metadata.statistics.totalFeedbacks}`);
  console.log(`   Promedio: ${data.metadata.statistics.averageScore.toFixed(1)}`);

  try {
    const report = generateAnnualReport(data);
    saveReportJSON(report);
    saveReportMarkdown(report);

    console.log('   ✅ Reporte generado exitosamente');
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('   ❌ Error generando reporte:', error.message);
    }
    return false;
  }
}

async function processBatch(files: string[], startIndex: number, batchSize: number): Promise<void> {
  const endIndex = Math.min(startIndex + batchSize, files.length);
  const batch = files.slice(startIndex, endIndex);

  console.log(`\n🎯 Procesando lote: estudiantes ${startIndex + 1}-${endIndex} de ${files.length}`);
  console.log('='.repeat(60));

  const checkpoint = loadCheckpoint() || initializeCheckpoint(files.length);

  for (let i = 0; i < batch.length; i++) {
    const filename = batch[i];
    const globalIndex = startIndex + i;

    // Skip if already processed
    if (checkpoint.completedStudents.includes(filename)) {
      console.log(`\n[${globalIndex + 1}/${files.length}] ⏭️  Ya procesado: ${filename}`);
      continue;
    }

    const success = await processStudent(filename, globalIndex, files.length);

    if (success) {
      checkpoint.completedStudents.push(filename);
      checkpoint.processedCount++;
      checkpoint.lastProcessedStudent = filename;
      checkpoint.timestamp = new Date().toISOString();
      saveCheckpoint(checkpoint);
    }

    // Small delay to avoid overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Lote completado: ${checkpoint.processedCount}/${files.length} estudiantes procesados`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  console.log('\n📚 GENERADOR DE REPORTES ANUALES 2025');
  console.log('=====================================\n');

  // Setup
  ensureOutputDirectory();

  // Get all student files
  const allFiles = getAllStudentFiles();
  console.log(`📂 Archivos encontrados: ${allFiles.length}`);

  if (allFiles.length === 0) {
    console.log('❌ No se encontraron archivos de estudiantes en feedbacks_2025_export/');
    process.exit(1);
  }

  // Check for existing checkpoint
  const existingCheckpoint = loadCheckpoint();
  if (existingCheckpoint) {
    console.log(`\n🔄 Checkpoint encontrado:`);
    console.log(`   Último procesado: ${existingCheckpoint.lastProcessedStudent}`);
    console.log(`   Progreso: ${existingCheckpoint.processedCount}/${existingCheckpoint.totalStudents}`);
    console.log(`   Completados: ${existingCheckpoint.completedStudents.length} estudiantes\n`);
  }

  // Process first 3 students alphabetically (as requested)
  const BATCH_SIZE = 3;

  console.log(`\n🎯 Procesando primeros ${BATCH_SIZE} estudiantes (orden alfabético):`);
  for (let i = 0; i < Math.min(BATCH_SIZE, allFiles.length); i++) {
    console.log(`   ${i + 1}. ${allFiles[i]}`);
  }

  await processBatch(allFiles, 0, BATCH_SIZE);

  console.log('\n✨ Proceso completado!\n');
  console.log(`📁 Reportes guardados en: ${OUTPUT_DIR}`);
  console.log(`🔖 Checkpoint guardado en: ${CHECKPOINT_FILE}\n`);
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
  }
  process.exit(1);
});
