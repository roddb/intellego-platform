/**
 * Tipos TypeScript para Sistema de Actividades CONSUDEC
 * Análisis de casos educativos con evaluación IA por pregunta
 * Extendido para soportar casos clínicos con cálculos matemáticos
 */

/**
 * Tipo de actividad
 * - pedagogical: Casos educativos para profesorado (análisis de casos)
 * - clinical: Casos clínicos de Bioelectricidad con cálculos
 * - project: Trabajos prácticos reflexivos (5 preguntas estándar)
 */
export type ActivityType = 'pedagogical' | 'clinical' | 'project';

/**
 * Tipo de pregunta
 * - text: Respuesta abierta textual (original)
 * - calculation: Cálculo matemático con validación numérica
 */
export type QuestionType = 'text' | 'calculation';

/**
 * Rúbrica de evaluación por pregunta
 * Sistema de 4 niveles de desempeño
 */
export interface QuestionRubric {
  excellent: string;      // Nivel 4: 85-100 puntos
  good: string;          // Nivel 3: 70-84 puntos
  satisfactory: string;  // Nivel 2: 50-69 puntos
  insufficient: string;  // Nivel 1: 0-49 puntos
}

/**
 * Definición de una pregunta en la actividad
 */
export interface ActivityQuestion {
  id: string;            // "q1", "q2", etc.
  text: string;          // Texto de la pregunta
  placeholder: string;   // Placeholder del textarea
  wordLimit: number;     // Límite de palabras (200)
  rubric: QuestionRubric;

  // 🆕 Campos para preguntas tipo "calculation" (opcionales)
  questionType?: QuestionType;     // Por defecto 'text'
  expectedFormula?: string;         // Ej: "E_K = 61.5 * log10([K+]ext / [K+]int)"
  expectedUnit?: string;            // Ej: "mV"
  tolerancePercentage?: number;     // Margen de error aceptable (default 5%)
  correctAnswer?: number;           // Valor numérico esperado
  partialCreditRubric?: {           // Rúbrica para crédito parcial
    correctMethodWrongAnswer: number;     // Puntos si método correcto pero respuesta no (50-69)
    correctAnswerNoExplanation: number;   // Puntos si respuesta correcta sin explicar (70-84)
  };
}

/**
 * Actividad completa (caso educativo o clínico)
 */
export interface ConsudecActivity {
  id: string;                    // "act_xxxxx"
  title: string;                 // "Caso 1: Diversidad en el Aula" o "Caso Clínico 1: Hipocalemia"
  description: string;           // Descripción breve
  caseText: string;              // Narrativa del caso (400-600 palabras)
  questions: ActivityQuestion[]; // Preguntas a responder
  subject?: string;              // "Didáctica", "Pedagogía", "Bioelectricidad", null
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime?: number;        // Minutos estimados
  status: 'active' | 'archived' | 'draft';
  availableFrom?: string;        // ISO 8601 (opcional)
  availableUntil?: string;       // ISO 8601 (opcional)
  createdBy: string;             // instructorId
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601

  // 🆕 Nuevo campo para distinguir tipo de actividad
  activityType?: ActivityType;   // Por defecto 'pedagogical'
}

/**
 * Nivel de desempeño por pregunta
 */
export type PerformanceLevel = 'excellent' | 'good' | 'satisfactory' | 'insufficient';

/**
 * Evaluación detallada de una pregunta tipo "calculation"
 * Generada por Claude Haiku al analizar respuesta numérica
 */
export interface CalculationEvaluation {
  isNumericCorrect: boolean;      // ¿Valor numérico dentro de tolerancia?
  numericValue: number | null;    // Valor extraído de la respuesta (null si no detectado)
  hasFormula: boolean;            // ¿Mencionó/usó la fórmula correcta?
  hasExplanation: boolean;        // ¿Incluyó interpretación clínica/física?
  hasCorrectUnits: boolean;       // ¿Usó las unidades correctas?
  partialCreditApplied: boolean;  // ¿Se aplicó crédito parcial?
}

/**
 * Score y evaluación de una pregunta individual
 * Resultado generado por Claude Haiku
 */
export interface QuestionScore {
  score: number;              // 0-100
  level: PerformanceLevel;    // Nivel alcanzado
  feedback: string;           // Retroalimentación específica (2-3 oraciones)
  strengths: string[];        // 2-3 fortalezas identificadas
  improvements: string[];     // 2-3 áreas de mejora

  // 🆕 Evaluación detallada solo para preguntas tipo "calculation"
  calculationEvaluation?: CalculationEvaluation;
}

/**
 * Entrega de un estudiante
 */
export interface ConsudecSubmission {
  id: string;                   // "csub_xxxxx"
  activityId: string;           // FK → ConsudecActivity
  studentId: string;            // FK → User

  // Respuestas del estudiante
  answers: Record<string, string>;  // { "q1": "respuesta...", "q2": "..." }

  // Evaluación IA por pregunta
  questionScores?: Record<string, QuestionScore>; // { "q1": {...}, "q2": {...} }

  // Scores globales
  overallScore?: number;        // 0-100 (promedio de todas las preguntas)
  percentageAchieved?: number;  // 0-100 (para dashboard de progreso)

  // Feedback general
  generalFeedback?: string;     // Resumen generado por IA

  // Costos IA
  apiCost?: number;             // USD total (suma de todas las preguntas)
  apiModel?: string;            // "claude-haiku-4-5"
  apiTokensInput?: number;
  apiTokensOutput?: number;

  // Evaluación manual (instructor puede ajustar)
  manualScore?: number;         // Score ajustado por instructor
  manualFeedback?: string;      // Feedback adicional del instructor
  evaluatedBy?: string;         // instructorId que evaluó manualmente
  evaluatedAt?: string;         // ISO 8601

  // Estado
  status: 'draft' | 'submitted' | 'evaluated';
  submittedAt?: string;         // ISO 8601

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Resultado de entrega con datos poblados (para visualización)
 */
export interface SubmissionResult extends ConsudecSubmission {
  activity: ConsudecActivity;   // Actividad completa
  studentName: string;          // Nombre del estudiante
  studentEmail: string;         // Email del estudiante
}

/**
 * Datos para crear nueva actividad
 */
export interface ActivityCreateData {
  title: string;
  description: string;
  caseText: string;
  questions: ActivityQuestion[];
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number;
  availableFrom?: string;
  availableUntil?: string;
  activityType?: ActivityType; // 🆕 Por defecto 'pedagogical'
}

/**
 * Datos para actualizar actividad existente
 */
export interface ActivityUpdateData {
  title?: string;
  description?: string;
  caseText?: string;
  questions?: ActivityQuestion[];
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number;
  status?: 'active' | 'archived' | 'draft';
  availableFrom?: string;
  availableUntil?: string;
  activityType?: ActivityType; // 🆕
}

/**
 * Datos para entregar/guardar actividad (estudiante)
 */
export interface SubmitActivityData {
  answers: Record<string, string>;
}

/**
 * Datos para edición manual (instructor)
 */
export interface ManualEvaluationData {
  manualScore?: number;
  manualFeedback?: string;
  questionScores?: Record<string, QuestionScore>; // Puede ajustar scores individuales
}

/**
 * Información de costos de API
 */
export interface APICostInfo {
  cost: number;           // Costo en USD
  model: string;          // "claude-haiku-4-5"
  tokensInput: number;
  tokensOutput: number;
  cacheHit: boolean;
}

/**
 * Estadísticas de una actividad (para instructor)
 */
export interface ActivityStats {
  totalSubmissions: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;    // Count de 85-100
    good: number;         // Count de 70-84
    satisfactory: number; // Count de 50-69
    insufficient: number; // Count de 0-49
  };
  completionRate: number; // Porcentaje de estudiantes que entregaron
}

/**
 * Progreso del estudiante en actividades CONSUDEC
 */
export interface StudentActivityProgress {
  totalActivities: number;
  completedActivities: number;
  averageScore: number;
  activitiesHistory: Array<{
    activityId: string;
    activityTitle: string;
    score: number;
    completedAt: string;
  }>;
}
