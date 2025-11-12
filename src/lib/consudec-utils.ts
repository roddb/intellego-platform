/**
 * Utilidades para sistema de actividades CONSUDEC
 * Funciones helper para validaciones, cálculos y generación de IDs
 */

import type { QuestionScore, PerformanceLevel } from '@/types/consudec-activity';

/**
 * Calcular porcentaje de acierto basado en scores de preguntas
 */
export function calculatePercentageAchieved(
  questionScores: Record<string, QuestionScore>
): number {
  const scores = Object.values(questionScores);
  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, qs) => sum + qs.score, 0);
  return Math.round(total / scores.length);
}

/**
 * Determinar color Tailwind según nivel de desempeño
 */
export function getLevelColor(level: PerformanceLevel): string {
  switch (level) {
    case 'excellent':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'good':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'satisfactory':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'insufficient':
      return 'bg-red-100 text-red-700 border-red-200';
  }
}

/**
 * Obtener texto descriptivo del nivel en español
 */
export function getLevelText(level: PerformanceLevel): string {
  switch (level) {
    case 'excellent':
      return 'Excelente';
    case 'good':
      return 'Bueno';
    case 'satisfactory':
      return 'Satisfactorio';
    case 'insufficient':
      return 'Insuficiente';
  }
}

/**
 * Obtener ícono según nivel de desempeño
 */
export function getLevelIcon(level: PerformanceLevel): string {
  switch (level) {
    case 'excellent':
      return '🌟'; // Estrella
    case 'good':
      return '✅'; // Check
    case 'satisfactory':
      return '📝'; // Nota
    case 'insufficient':
      return '⚠️'; // Advertencia
  }
}

/**
 * Validar límite de palabras de una respuesta
 */
export function validateWordLimit(text: string, limit: number): boolean {
  const words = countWords(text);
  return words <= limit;
}

/**
 * Contar palabras en un texto
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length;
}

/**
 * Generar ID único para actividad
 */
export function generateActivityId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `act_${timestamp}_${random}`;
}

/**
 * Generar ID único para submission
 */
export function generateSubmissionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `csub_${timestamp}_${random}`;
}

/**
 * Validar formato de respuestas (que todas las preguntas tengan respuesta)
 */
export function validateAnswers(
  answers: Record<string, string>,
  questionIds: string[]
): { valid: boolean; missingQuestions: string[] } {
  const missingQuestions: string[] = [];

  for (const qId of questionIds) {
    if (!answers[qId] || answers[qId].trim().length === 0) {
      missingQuestions.push(qId);
    }
  }

  return {
    valid: missingQuestions.length === 0,
    missingQuestions,
  };
}

/**
 * Validar límite de palabras para todas las respuestas
 */
export function validateAllWordLimits(
  answers: Record<string, string>,
  questions: Array<{ id: string; wordLimit: number }>
): { valid: boolean; violations: Array<{ questionId: string; wordCount: number; limit: number }> } {
  const violations: Array<{ questionId: string; wordCount: number; limit: number }> = [];

  for (const question of questions) {
    const answer = answers[question.id] || '';
    const wordCount = countWords(answer);

    if (wordCount > question.wordLimit) {
      violations.push({
        questionId: question.id,
        wordCount,
        limit: question.wordLimit,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Formatear fecha ISO a formato legible en español
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatear fecha y hora ISO a formato legible en español
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcular tiempo restante hasta una fecha límite
 */
export function getTimeRemaining(dueDate: string): {
  expired: boolean;
  days: number;
  hours: number;
  label: string;
} {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      label: 'Vencido',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let label = '';
  if (days > 1) {
    label = `${days} días`;
  } else if (days === 1) {
    label = '1 día';
  } else if (hours > 1) {
    label = `${hours} horas`;
  } else if (hours === 1) {
    label = '1 hora';
  } else {
    label = 'Menos de 1 hora';
  }

  return {
    expired: false,
    days,
    hours,
    label,
  };
}

/**
 * Obtener color de badge según estado de submission
 */
export function getSubmissionStatusColor(status: 'draft' | 'submitted' | 'evaluated'): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'submitted':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'evaluated':
      return 'bg-green-100 text-green-700 border-green-200';
  }
}

/**
 * Obtener texto descriptivo del estado de submission
 */
export function getSubmissionStatusText(status: 'draft' | 'submitted' | 'evaluated'): string {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'submitted':
      return 'Entregado';
    case 'evaluated':
      return 'Evaluado';
  }
}

/**
 * Calcular estadísticas de distribución de scores
 */
export function calculateScoreDistribution(scores: number[]): {
  excellent: number;
  good: number;
  satisfactory: number;
  insufficient: number;
} {
  return {
    excellent: scores.filter((s) => s >= 85).length,
    good: scores.filter((s) => s >= 70 && s < 85).length,
    satisfactory: scores.filter((s) => s >= 50 && s < 70).length,
    insufficient: scores.filter((s) => s < 50).length,
  };
}

/**
 * Obtener fecha ISO del momento actual
 */
export function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * Sanitizar texto para evitar XSS (básico)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Truncar texto con ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Validar que un score esté en el rango válido (0-100)
 */
export function isValidScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 100 && !isNaN(score);
}

/**
 * Obtener label de dificultad
 */
export function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'Fácil';
    case 'medium':
      return 'Intermedia';
    case 'hard':
      return 'Difícil';
    default:
      return difficulty;
  }
}

/**
 * Obtener color de dificultad
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'hard':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

/**
 * Formatear porcentaje
 */
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

/**
 * Generar ID de pregunta
 */
export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtener label según nivel de desempeño
 */
export function getLevelLabel(level: PerformanceLevel): string {
  switch (level) {
    case 'excellent':
      return 'Excelente';
    case 'good':
      return 'Bueno';
    case 'satisfactory':
      return 'Satisfactorio';
    case 'insufficient':
      return 'Insuficiente';
  }
}
