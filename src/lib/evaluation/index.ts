/**
 * Módulo de Evaluación de Exámenes - Sistema Simplificado
 * Version: 2.0-simple
 *
 * Exports principales del sistema de corrección automática
 */

// Types
export type {
  Exercise,
  ParsedExam,
  Student,
  MatchResult,
  PhaseScore,
  PhaseScores,
  ExerciseAnalysis,
  Recommendation,
  AIAnalysis,
  Grading,
  FeedbackVariables,
  EvaluationRecord,
  ExamMetadata,
  ProcessingResult,
  BatchSummary,
} from "./types";

export { EvaluationError, ErrorCodes } from "./types";

// Parser
export {
  extractApellido,
  normalizeApellido,
  parseExamContent,
  parseExamFile,
  parseExamFiles,
} from "./parser";

// Matcher
export {
  matchStudent,
  matchStudents,
  validateStudent,
  type MatchContext
} from "./matcher";

// Analyzer
export { analyzeExam, analyzeExams } from "./analyzer";

// Calculator
export {
  calculateScore,
  validateScores,
  getScoreMessage,
  getPriorityIcon,
  calculateStatistics,
} from "./calculator";

// Generator
export { generateFeedback } from "./generator";

// Uploader
export {
  generateEvaluationId,
  uploadEvaluation,
  uploadEvaluations,
  evaluationExists,
  updateEvaluation,
  getStudentEvaluations,
  getEvaluationStats,
} from "./uploader";

// Orchestrator
export {
  processExam,
  processExamBatch,
  getInstructorName,
  getEvaluationById,
} from "./orchestrator";

// Prompts & Constants
export { RUBRICA_5_FASES, NIVEL_TO_PUNTAJE, PESOS_FASES } from "./prompts/rubrica-5-fases";

// Progress Tracker
export type { BatchProgress } from "./progress-tracker";
export {
  initBatchProgress,
  updateCurrentFile,
  markFileProcessed,
  markBatchFailed,
  getBatchProgress,
  getAllActiveProgresses,
  cleanupBatchProgress,
} from "./progress-tracker";
