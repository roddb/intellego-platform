import { query } from "@/lib/db";
import { createHash } from "crypto";
import type { Student, ExamMetadata, Grading, EvaluationRecord, APICostInfo } from "./types";
import { EvaluationError, ErrorCodes } from "./types";

/**
 * Uploader - Guarda evaluaciones en la tabla Evaluation
 *
 * Responsabilidades:
 * 1. Generar evaluationId único
 * 2. Normalizar datos
 * 3. INSERT en tabla Evaluation
 * 4. Logging
 */

/**
 * Genera un evaluationId único usando SHA256
 *
 * @param studentId - ID del estudiante
 * @param examDate - Fecha del examen
 * @param examTopic - Tema del examen
 * @returns evaluationId en formato "eval_xxxxxxxxxxxxxxxx"
 */
export function generateEvaluationId(
  studentId: string,
  examDate: string,
  examTopic: string
): string {
  const timestamp = Date.now().toString();
  const data = `${studentId}${examDate}${examTopic}${timestamp}`;

  const hash = createHash("sha256").update(data).digest("hex");

  // Tomar los primeros 16 caracteres del hash
  return `eval_${hash.substring(0, 16)}`;
}

/**
 * Guarda una evaluación en la tabla Evaluation
 *
 * @param student - Información del estudiante
 * @param metadata - Metadata del examen
 * @param grading - Nota final
 * @param feedbackMarkdown - Feedback completo en Markdown
 * @param costInfo - Información de costos de la API
 * @returns EvaluationRecord guardado
 */
export async function uploadEvaluation(
  student: Student,
  metadata: ExamMetadata,
  grading: Grading,
  feedbackMarkdown: string,
  costInfo: APICostInfo
): Promise<EvaluationRecord> {
  try {
    // 1. Generar evaluationId único
    const evaluationId = generateEvaluationId(
      student.id,
      metadata.examDate,
      metadata.examTopic
    );

    // 2. Normalizar datos
    const subject = metadata.subject.trim();
    const examDate = normalizeDate(metadata.examDate);
    const examTopic = metadata.examTopic.trim();
    const score = grading.score;
    const feedback = feedbackMarkdown.trim();
    const createdBy = metadata.instructorId;
    const rubricId = metadata.rubricId;
    const now = new Date().toISOString();

    // 3. Construir record
    const record: EvaluationRecord = {
      id: evaluationId,
      studentId: student.id,
      subject,
      examDate,
      examTopic,
      score,
      feedback,
      createdBy,
      createdAt: now,
      updatedAt: now,
      rubricId,
      apiCost: costInfo.cost,
      apiModel: costInfo.model,
      apiTokensInput: costInfo.tokensInput,
      apiTokensOutput: costInfo.tokensOutput,
    };

    // 4. INSERT en DB
    await query(
      `INSERT INTO Evaluation (
        id, studentId, subject, examDate, examTopic,
        score, feedback, createdBy, createdAt, updatedAt,
        rubricId, apiCost, apiModel, apiTokensInput, apiTokensOutput
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.studentId,
        record.subject,
        record.examDate,
        record.examTopic,
        record.score,
        record.feedback,
        record.createdBy,
        record.createdAt,
        record.updatedAt,
        record.rubricId,
        record.apiCost,
        record.apiModel,
        record.apiTokensInput,
        record.apiTokensOutput,
      ]
    );

    // 5. Logging
    console.log("✅ Evaluación guardada en DB", {
      evaluationId: record.id,
      studentId: student.id,
      studentName: student.name,
      subject: record.subject,
      examTopic: record.examTopic,
      score: record.score,
      timestamp: now,
    });

    return record;
  } catch (error) {
    console.error("❌ Error guardando evaluación en DB:", error);

    throw new EvaluationError(
      ErrorCodes.DB_INSERT_FAILED,
      "No se pudo guardar la evaluación en la base de datos",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Guarda múltiples evaluaciones en batch
 *
 * @param evaluations - Array de evaluaciones a guardar
 * @returns Array de EvaluationRecord guardados
 */
export async function uploadEvaluations(
  evaluations: Array<{
    student: Student;
    metadata: ExamMetadata;
    grading: Grading;
    feedbackMarkdown: string;
    costInfo: APICostInfo;
  }>
): Promise<EvaluationRecord[]> {
  const results: EvaluationRecord[] = [];

  for (const evaluation of evaluations) {
    try {
      const record = await uploadEvaluation(
        evaluation.student,
        evaluation.metadata,
        evaluation.grading,
        evaluation.feedbackMarkdown,
        evaluation.costInfo
      );
      results.push(record);
    } catch (error) {
      console.error(
        `Error guardando evaluación de ${evaluation.student.name}:`,
        error
      );
      // Continuar con el siguiente
    }
  }

  return results;
}

/**
 * Verifica si ya existe una evaluación para un estudiante + examen
 *
 * @param studentId - ID del estudiante
 * @param examDate - Fecha del examen
 * @param examTopic - Tema del examen
 * @returns true si existe, false si no
 */
export async function evaluationExists(
  studentId: string,
  examDate: string,
  examTopic: string
): Promise<boolean> {
  try {
    const normalizedDate = normalizeDate(examDate);

    const result = await query(
      `SELECT id FROM Evaluation
       WHERE studentId = ? AND examDate = ? AND examTopic = ?
       LIMIT 1`,
      [studentId, normalizedDate, examTopic.trim()]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error("Error verificando existencia de evaluación:", error);
    return false;
  }
}

/**
 * Actualiza una evaluación existente
 *
 * @param evaluationId - ID de la evaluación a actualizar
 * @param grading - Nueva nota
 * @param feedbackMarkdown - Nuevo feedback
 * @returns EvaluationRecord actualizado
 */
export async function updateEvaluation(
  evaluationId: string,
  grading: Grading,
  feedbackMarkdown: string
): Promise<EvaluationRecord> {
  try {
    const now = new Date().toISOString();

    await query(
      `UPDATE Evaluation
       SET score = ?, feedback = ?, updatedAt = ?
       WHERE id = ?`,
      [grading.score, feedbackMarkdown.trim(), now, evaluationId]
    );

    // Obtener el record actualizado
    const result = await query(
      `SELECT * FROM Evaluation WHERE id = ? LIMIT 1`,
      [evaluationId]
    );

    const updated = result.rows.length > 0 ? result.rows[0] : null;

    if (!updated) {
      throw new EvaluationError(
        ErrorCodes.DB_INSERT_FAILED,
        `Evaluación no encontrada: ${evaluationId}`
      );
    }

    console.log("✅ Evaluación actualizada", {
      evaluationId,
      score: updated.score,
      timestamp: now,
    });

    return updated as unknown as EvaluationRecord;
  } catch (error) {
    console.error("❌ Error actualizando evaluación:", error);

    throw new EvaluationError(
      ErrorCodes.DB_INSERT_FAILED,
      "No se pudo actualizar la evaluación",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Normaliza una fecha al formato ISO 8601
 *
 * @param date - Fecha en string (varios formatos aceptados)
 * @returns Fecha en formato YYYY-MM-DD
 */
function normalizeDate(date: string): string {
  try {
    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      throw new Error("Fecha inválida");
    }

    // Formato YYYY-MM-DD
    return parsed.toISOString().split("T")[0];
  } catch (error) {
    console.warn(`Fecha inválida: ${date}, usando fecha actual`);
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Obtiene las evaluaciones de un estudiante
 *
 * @param studentId - ID del estudiante
 * @param limit - Número máximo de evaluaciones a retornar
 * @returns Array de EvaluationRecord
 */
export async function getStudentEvaluations(
  studentId: string,
  limit: number = 10
): Promise<EvaluationRecord[]> {
  try {
    const result = await query(
      `SELECT * FROM Evaluation
       WHERE studentId = ?
       ORDER BY examDate DESC
       LIMIT ?`,
      [studentId, limit]
    );

    return result.rows as unknown as EvaluationRecord[];
  } catch (error) {
    console.error("Error obteniendo evaluaciones del estudiante:", error);
    return [];
  }
}

/**
 * Obtiene estadísticas de evaluaciones por materia
 *
 * @param studentId - ID del estudiante
 * @param subject - Materia
 * @returns Estadísticas (promedio, total, última fecha)
 */
export async function getEvaluationStats(
  studentId: string,
  subject: string
): Promise<{
  average: number;
  total: number;
  lastExamDate: string | null;
}> {
  try {
    const result = await query(
      `SELECT score, examDate FROM Evaluation
       WHERE studentId = ? AND subject = ?`,
      [studentId, subject]
    );

    if (result.rows.length === 0) {
      return { average: 0, total: 0, lastExamDate: null };
    }

    const total = result.rows.length;
    const sum = result.rows.reduce((acc: number, ev: any) => acc + (ev.score as number), 0);
    const average = Math.round(sum / total);

    // Ordenar por fecha y tomar la última
    const sorted = result.rows.sort((a: any, b: any) =>
      (b.examDate as string).localeCompare(a.examDate as string)
    );
    const lastExamDate = sorted[0].examDate as string;

    return { average, total, lastExamDate };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { average: 0, total: 0, lastExamDate: null };
  }
}
