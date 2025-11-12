/**
 * Orchestrator - Flujo completo end-to-end
 *
 * Integra todos los componentes del sistema de evaluación:
 * 1. Parser → 2. Matcher → 3. Analyzer → 4. Calculator → 5. Generator → 6. Uploader
 */

import { parseExamFile } from "./parser";
import { matchStudent } from "./matcher";
import { analyzeExam } from "./analyzer";
import { calculateScore } from "./calculator";
import { generateFeedback } from "./generator";
import { uploadEvaluation } from "./uploader";
import { applyContextualAdjustment } from "./contextual-adjuster";
import type { ExamMetadata, ProcessingResult, EvaluationRecord } from "./types";
import { EvaluationError } from "./types";
import { query } from "@/lib/db";
import {
  initBatchProgress,
  updateCurrentFile,
  markFileProcessed,
  markBatchFailed,
} from "./progress-tracker";
import Anthropic from '@anthropic-ai/sdk';

// Inicializar cliente de Anthropic (singleton)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Procesa un examen completo de principio a fin
 *
 * Flujo:
 * 1. Parser: Archivo .md → ParsedExam
 * 2. Matcher: Apellido → Student
 * 3. Analyzer: Claude Haiku evalúa con rúbrica 5-FASE
 * 4. Calculator: Calcula nota ponderada (score estricto)
 * 4.5. Contextual Adjuster: Aplica ajuste contextual con "sentido común pedagógico" (NUEVO)
 * 5. Generator: Genera feedback en Markdown
 * 6. Uploader: Guarda en tabla Evaluation
 *
 * @param file - Archivo del examen { name, buffer, size }
 * @param metadata - Metadata del examen
 * @param instructorName - Nombre del instructor (para feedback)
 * @returns ProcessingResult con evaluationId y score
 */
export async function processExam(
  file: { name: string; buffer: Buffer; size: number },
  metadata: ExamMetadata,
  instructorName: string,
  batchId?: string
): Promise<ProcessingResult> {
  const startTime = Date.now();

  try {
    console.log(`🔄 Procesando examen: ${file.name}...`);

    // 1. Parser
    console.log("  [1/6] Parseando archivo...");
    if (batchId) updateCurrentFile(batchId, file.name, "Parseando archivo");
    const parsedExam = await parseExamFile(file.name, file.buffer, file.size);

    // 2. Matcher
    console.log(`  [2/6] Buscando estudiante: ${parsedExam.apellido}...`);
    if (batchId) updateCurrentFile(batchId, file.name, "Buscando estudiante");
    const matchResult = await matchStudent(parsedExam.apellido);
    const student = matchResult.student;

    console.log(
      `  ✓ Match encontrado: ${student.name} (${matchResult.matchConfidence.toFixed(1)}% confianza)`
    );

    // 3. Analyzer
    console.log("  [3/6] Analizando con Claude Haiku...");
    if (batchId) updateCurrentFile(batchId, file.name, "Analizando con IA");
    const analysis = await analyzeExam(parsedExam, student, metadata);

    // 4. Calculator
    console.log("  [4/7] Calculando nota ponderada (score estricto)...");
    if (batchId) updateCurrentFile(batchId, file.name, "Calculando nota");
    const grading = calculateScore(analysis.scores);

    console.log(`  ✓ Nota estricta calculada: ${grading.score}/100`);

    // 4.5. Contextual Adjuster (NUEVO)
    console.log("  [5/7] Aplicando ajuste contextual...");
    if (batchId) updateCurrentFile(batchId, file.name, "Aplicando ajuste contextual");
    const contextualAdjustment = await applyContextualAdjustment(
      grading.score,
      analysis.scores,
      analysis.exerciseAnalysis,
      parsedExam.rawContent,
      anthropic
    );

    // Agregar ajuste al análisis
    analysis.contextualAdjustment = contextualAdjustment;

    console.log(
      `  ✓ Ajuste aplicado: ${grading.score.toFixed(1)} → ${contextualAdjustment.adjustedScore.toFixed(1)} (${contextualAdjustment.adjustment >= 0 ? '+' : ''}${contextualAdjustment.adjustment.toFixed(1)})`
    );

    // Actualizar grading con el score ajustado
    const finalGrading = {
      score: contextualAdjustment.adjustedScore,
    };

    // 5. Generator
    console.log("  [6/7] Generando feedback en Markdown...");
    if (batchId) updateCurrentFile(batchId, file.name, "Generando feedback");
    const feedbackMarkdown = generateFeedback(
      student,
      metadata,
      analysis,
      finalGrading,
      instructorName
    );

    console.log(
      `  ✓ Feedback generado (${feedbackMarkdown.length} caracteres)`
    );

    // 6. Uploader
    console.log("  [7/7] Guardando en base de datos...");
    if (batchId) updateCurrentFile(batchId, file.name, "Guardando en DB");

    // Combinar costos de análisis + ajuste contextual
    const totalCostInfo = {
      ...analysis.costInfo,
      cost: analysis.costInfo.cost + contextualAdjustment.costInfo.cost,
      tokensInput: analysis.costInfo.tokensInput + contextualAdjustment.costInfo.tokensInput,
      tokensOutput: analysis.costInfo.tokensOutput + contextualAdjustment.costInfo.tokensOutput,
    };

    const evaluationRecord = await uploadEvaluation(
      student,
      metadata,
      finalGrading,
      feedbackMarkdown,
      totalCostInfo
    );

    const duration = Date.now() - startTime;

    console.log(
      `✅ Examen procesado exitosamente en ${(duration / 1000).toFixed(1)}s`
    );

    // Mark file as processed with success
    if (batchId) {
      markFileProcessed(batchId, file.name, {
        status: "success",
        studentName: student.name,
        score: contextualAdjustment.adjustedScore,
      });
    }

    return {
      fileName: file.name,
      studentName: student.name,
      evaluationId: evaluationRecord.id,
      score: contextualAdjustment.adjustedScore,
      status: "success",
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`❌ Error procesando ${file.name}:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Mark file as processed with error
    if (batchId) {
      markFileProcessed(batchId, file.name, {
        status: "error",
        error: errorMessage,
      });
    }

    if (error instanceof EvaluationError) {
      return {
        fileName: file.name,
        studentName: "Desconocido",
        evaluationId: "",
        score: 0,
        status: "error",
        duration,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return {
      fileName: file.name,
      studentName: "Desconocido",
      evaluationId: "",
      score: 0,
      status: "error",
      duration,
      error: {
        code: "UNKNOWN_ERROR",
        message: errorMessage,
      },
    };
  }
}

/**
 * Procesa múltiples exámenes en batch (secuencial)
 *
 * @param files - Array de archivos
 * @param metadata - Metadata común para todos los exámenes
 * @param instructorName - Nombre del instructor
 * @returns BatchSummary con resultados y estadísticas
 */
export async function processExamBatch(
  files: Array<{ name: string; buffer: Buffer; size: number }>,
  metadata: ExamMetadata,
  instructorName: string
): Promise<{
  batchId: string;
  results: ProcessingResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    avgScore: number;
    totalDuration: number;
  };
}> {
  const batchId = `batch_${Date.now()}`;
  const batchStartTime = Date.now();

  console.log(`\n🚀 Iniciando batch: ${batchId}`);
  console.log(`   Total de archivos: ${files.length}`);
  console.log(`   Materia: ${metadata.subject} - ${metadata.examTopic}\n`);

  // Initialize progress tracking
  initBatchProgress(batchId, files.length);

  const results: ProcessingResult[] = [];

  // Procesar cada archivo secuencialmente
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] Procesando ${file.name}...`);

    const result = await processExam(file, metadata, instructorName, batchId);
    results.push(result);

    console.log(""); // Línea en blanco para separar
  }

  // Calcular estadísticas
  const successful = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "error").length;

  const successfulScores = results
    .filter((r) => r.status === "success")
    .map((r) => r.score);

  const avgScore =
    successfulScores.length > 0
      ? Math.round(
          successfulScores.reduce((sum, score) => sum + score, 0) /
            successfulScores.length
        )
      : 0;

  const totalDuration = Date.now() - batchStartTime;

  console.log(`\n✅ Batch completado: ${batchId}`);
  console.log(`   Total: ${files.length}`);
  console.log(`   Exitosos: ${successful}`);
  console.log(`   Fallidos: ${failed}`);
  console.log(`   Promedio: ${avgScore}/100`);
  console.log(`   Duración total: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(
    `   Duración promedio: ${(totalDuration / files.length / 1000).toFixed(1)}s por examen\n`
  );

  return {
    batchId,
    results,
    summary: {
      total: files.length,
      successful,
      failed,
      avgScore,
      totalDuration,
    },
  };
}

/**
 * Obtiene el nombre del instructor desde la DB
 *
 * @param instructorId - ID del instructor
 * @returns Nombre del instructor
 */
export async function getInstructorName(
  instructorId: string
): Promise<string> {
  try {
    const result = await query(
      `SELECT name FROM User
       WHERE id = ? AND role = ?
       LIMIT 1`,
      [instructorId, "INSTRUCTOR"]
    );

    const instructor = result.rows.length > 0 ? result.rows[0] : null;

    return (instructor?.name as string) || "Instructor";
  } catch (error) {
    console.error("Error obteniendo nombre de instructor:", error);
    return "Instructor";
  }
}

/**
 * Obtiene una evaluación completa por ID
 *
 * @param evaluationId - ID de la evaluación
 * @returns EvaluationRecord o null si no existe
 */
export async function getEvaluationById(
  evaluationId: string
): Promise<EvaluationRecord | null> {
  try {
    const result = await query(
      `SELECT * FROM Evaluation WHERE id = ? LIMIT 1`,
      [evaluationId]
    );

    return result.rows.length > 0 ? (result.rows[0] as unknown as EvaluationRecord) : null;
  } catch (error) {
    console.error("Error obteniendo evaluación:", error);
    return null;
  }
}
