// Tipos TypeScript para el Sistema de Corrección de Exámenes
// Versión: 2.0-simple (sin análisis comparativo)

/**
 * Ejercicio parseado del examen
 */
export interface Exercise {
  number: number;
  title?: string;
  content: string;
  hasAnswer: boolean;
}

/**
 * Resultado del Parser
 * Input: archivo .md
 * Output: apellido extraído + contenido parseado
 */
export interface ParsedExam {
  apellido: string;
  rawContent: string;
  exercises: Exercise[];
  metadata: {
    fileName: string;
    fileSize: number;
    parseDate: Date;
  };
}

/**
 * Información del estudiante
 */
export interface Student {
  id: string;
  name: string;
  academicYear: string;
  division: string;
}

/**
 * Resultado del Matcher
 * Input: apellido
 * Output: estudiante encontrado en DB
 */
export interface MatchResult {
  student: Student;
  matchConfidence: number; // 0-100
}

/**
 * Scores por fase (del AI Analyzer)
 */
export interface PhaseScore {
  nivel: 1 | 2 | 3 | 4;
  puntaje: number; // 0-100
}

export interface PhaseScores {
  F1: PhaseScore; // Comprensión
  F2: PhaseScore; // Variables
  F3: PhaseScore; // Herramientas
  F4: PhaseScore; // Ejecución
  F5: PhaseScore; // Verificación
}

/**
 * Análisis por ejercicio (del AI Analyzer)
 */
export interface ExerciseAnalysis {
  exerciseNumber: number;
  strengths: string[];
  weaknesses: string[];
  specificFeedback: string;
  phaseEvaluations: {
    F1: { nivel: 1 | 2 | 3 | 4; comment: string };
    F2: { nivel: 1 | 2 | 3 | 4; comment: string };
    F3: { nivel: 1 | 2 | 3 | 4; comment: string };
    F4: { nivel: 1 | 2 | 3 | 4; comment: string };
    F5: { nivel: 1 | 2 | 3 | 4; comment: string };
  };
}

/**
 * Recomendación (del AI Analyzer)
 */
export interface Recommendation {
  priority: "alta" | "media" | "baja";
  title: string;
  reason: string;
  steps: string[];
  suggestedResources?: string;
}

/**
 * Información de costo de API
 */
export interface APICostInfo {
  cost: number; // Costo en USD
  model: string; // "claude-haiku-4-5"
  tokensInput: number;
  tokensOutput: number;
  cacheHit: boolean;
}

/**
 * Ajuste contextual (sistema de "sentido común pedagógico")
 */
export interface ContextualAdjustment {
  originalScore: number; // Score estricto de la rúbrica
  adjustedScore: number; // Score final ajustado
  adjustment: number; // Diferencia (-10 a +10)
  justification: string; // Explicación del ajuste
  evidenceForAdjustment: string; // Cita específica de la respuesta
  appliedAt: Date; // Timestamp del ajuste
  costInfo: APICostInfo; // Costo de la llamada de ajuste
}

/**
 * Análisis por ejercicio para rúbricas custom (estructura libre)
 */
export interface CustomExerciseAnalysis {
  exerciseNumber: number;
  strengths: string[];
  weaknesses: string[];
  specificFeedback: string;
  // Criterios específicos de la rúbrica (dinámico)
  criteriaEvaluation?: Record<string, { level: string; comment: string; score?: number }>;
}

/**
 * Resultado del AI Analyzer para rúbricas 5-phases
 */
export interface AIAnalysis5Phases {
  type: '5-phases';
  scores: PhaseScores;
  exerciseAnalysis: ExerciseAnalysis[];
  recommendations: Recommendation[];
  costInfo: APICostInfo;
  contextualAdjustment?: ContextualAdjustment;
}

/**
 * Resultado del AI Analyzer para rúbricas custom
 */
export interface AIAnalysisCustom {
  type: 'custom';
  totalScore: number; // Puntaje total calculado según la rúbrica
  exerciseAnalysis: CustomExerciseAnalysis[];
  recommendations: Recommendation[];
  costInfo: APICostInfo;
  contextualAdjustment?: ContextualAdjustment;
}

/**
 * Resultado del AI Analyzer (union type para soportar ambos tipos de rúbrica)
 */
export type AIAnalysis = AIAnalysis5Phases | AIAnalysisCustom;

/**
 * Legacy: Mantener para backward compatibility
 * @deprecated Use AIAnalysis5Phases instead
 */
export interface AIAnalysisLegacy {
  scores: PhaseScores;
  exerciseAnalysis: ExerciseAnalysis[];
  recommendations: Recommendation[];
  costInfo: APICostInfo;
  contextualAdjustment?: ContextualAdjustment;
}

/**
 * Resultado del Grade Calculator
 */
export interface Grading {
  score: number; // 0-100 (promedio ponderado)
}

/**
 * Variables para el template de feedback
 */
export interface FeedbackVariables {
  // Información del estudiante
  STUDENT_NAME: string;
  SUBJECT: string;
  EXAM_TOPIC: string;
  EXAM_DATE: string;
  SCORE: number;

  // Ajuste contextual (opcional)
  HAS_ADJUSTMENT: boolean;
  STRICT_SCORE?: number;
  ADJUSTED_SCORE?: number;
  ADJUSTMENT_VALUE?: number;
  ADJUSTMENT_JUSTIFICATION?: string;
  ADJUSTMENT_EVIDENCE?: string;

  // Scores por fase
  F1_LEVEL: 1 | 2 | 3 | 4;
  F1_SCORE: number;
  F2_LEVEL: 1 | 2 | 3 | 4;
  F2_SCORE: number;
  F3_LEVEL: 1 | 2 | 3 | 4;
  F3_SCORE: number;
  F4_LEVEL: 1 | 2 | 3 | 4;
  F4_SCORE: number;
  F5_LEVEL: 1 | 2 | 3 | 4;
  F5_SCORE: number;

  // Análisis por ejercicio (array)
  EXERCISES: Array<{
    number: number;
    title?: string;
    strengths: string[];
    weaknesses: string[];
    specificFeedback: string;
    F1_level: 1 | 2 | 3 | 4;
    F1_comment: string;
    F2_level: 1 | 2 | 3 | 4;
    F2_comment: string;
    F3_level: 1 | 2 | 3 | 4;
    F3_comment: string;
    F4_level: 1 | 2 | 3 | 4;
    F4_comment: string;
    F5_level: 1 | 2 | 3 | 4;
    F5_comment: string;
  }>;

  // Recomendaciones (array)
  RECOMMENDATIONS: Array<{
    priority_icon: string; // 🔴 / 🟡 / 🟢
    title: string;
    reason: string;
    steps: string[];
    suggestedResources?: string;
  }>;

  // Mensajes
  FINAL_MESSAGE: string;
  INSTRUCTOR_NAME: string;
  CORRECTION_DATE: string;
}

/**
 * Record para guardar en DB (tabla Evaluation)
 */
export interface EvaluationRecord {
  id: string; // "eval_xxxxx"
  studentId: string;
  subject: string;
  examDate: string; // ISO 8601
  examTopic: string;
  score: number; // 0-100
  feedback: string; // Markdown completo
  createdBy: string; // instructorId
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  rubricId: string; // ID de la rúbrica usada
  // Campos de costo de API
  apiCost: number; // Costo en USD
  apiModel: string; // "claude-haiku-4-5"
  apiTokensInput: number;
  apiTokensOutput: number;
}

/**
 * Tipo de rúbrica
 * - '5-phases': Rúbrica que usa el sistema de 5 fases (F1-F5)
 * - 'custom': Rúbrica personalizada con estructura libre
 */
export type RubricType = '5-phases' | 'custom';

/**
 * Rúbrica de evaluación
 */
export interface Rubric {
  id: string;
  name: string;
  description?: string;
  rubricText: string;
  subject?: string;
  examType?: string;
  rubricType: RubricType; // Tipo de rúbrica (5-phases o custom)
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Metadata del examen (input del usuario)
 */
export interface ExamMetadata {
  subject: string; // "Física", "Química", etc.
  examTopic: string; // "Tiro Oblicuo", "Termodinámica", etc.
  examDate: string; // "2025-10-15"
  instructorId: string;
  rubricId: string; // ID de la rúbrica a usar (obligatorio)
  // Contexto de curso para filtrado de estudiantes
  materia: string; // "Física", "Química"
  division: string; // "4to E", "5to A"
  anioAcademico: string; // "4to Año", "5to Año"
  sede: string; // "San Miguel", "Pacheco"
}

/**
 * Resultado final del procesamiento
 */
export interface ProcessingResult {
  fileName: string;
  studentName: string;
  evaluationId: string;
  score: number;
  status: "success" | "error";
  duration: number; // milliseconds
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Resumen del batch de procesamiento
 */
export interface BatchSummary {
  batchId: string;
  results: ProcessingResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    avgScore: number;
    totalDuration: number; // milliseconds
  };
}

/**
 * Errores específicos del sistema
 */
export class EvaluationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

/**
 * Códigos de error del sistema
 */
export const ErrorCodes = {
  PARSE_ERROR: "PARSE_ERROR",
  STUDENT_NOT_FOUND: "STUDENT_NOT_FOUND",
  AI_ANALYSIS_FAILED: "AI_ANALYSIS_FAILED",
  DB_INSERT_FAILED: "DB_INSERT_FAILED",
  INVALID_FILE_FORMAT: "INVALID_FILE_FORMAT",
  INVALID_METADATA: "INVALID_METADATA",
} as const;
