import type { PhaseScores, Grading } from "./types";
import { PESOS_FASES } from "./prompts/rubrica-5-fases";

/**
 * Calculator - Calcula la nota final ponderada
 *
 * Responsabilidad:
 * - Calcular promedio ponderado: F1×15% + F2×20% + F3×25% + F4×30% + F5×10%
 */

/**
 * Calcula la nota final como promedio ponderado de las 5 fases
 *
 * @param scores - Scores por fase (del AI Analyzer)
 * @returns Grading con score final (0-100)
 */
export function calculateScore(scores: PhaseScores): Grading {
  // Calcular promedio ponderado
  const weightedSum =
    scores.F1.puntaje * PESOS_FASES.F1 +
    scores.F2.puntaje * PESOS_FASES.F2 +
    scores.F3.puntaje * PESOS_FASES.F3 +
    scores.F4.puntaje * PESOS_FASES.F4 +
    scores.F5.puntaje * PESOS_FASES.F5;

  // Redondear a entero
  const score = Math.round(weightedSum);

  // Limitar al rango [0, 100]
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
  };
}

/**
 * Valida que los scores estén en el rango correcto
 */
export function validateScores(scores: PhaseScores): boolean {
  const fases = ["F1", "F2", "F3", "F4", "F5"] as const;

  for (const fase of fases) {
    const phaseScore = scores[fase];

    // Validar que nivel esté en [1, 4]
    if (phaseScore.nivel < 1 || phaseScore.nivel > 4) {
      console.error(`Nivel inválido en ${fase}: ${phaseScore.nivel}`);
      return false;
    }

    // Validar que puntaje esté en [0, 100]
    if (phaseScore.puntaje < 0 || phaseScore.puntaje > 100) {
      console.error(`Puntaje inválido en ${fase}: ${phaseScore.puntaje}`);
      return false;
    }
  }

  return true;
}

/**
 * Obtiene un mensaje descriptivo según el score
 */
export function getScoreMessage(score: number): string {
  if (score >= 85) {
    return "¡Excelente trabajo! Tu desempeño demuestra un sólido dominio de los conceptos. Continúa con este nivel de dedicación.";
  } else if (score >= 70) {
    return "Buen trabajo. Has mostrado comprensión de los conceptos. Enfócate en las áreas de mejora identificadas para alcanzar la excelencia.";
  } else if (score >= 55) {
    return "Has demostrado esfuerzo y comprensión básica. Con práctica enfocada en las áreas identificadas, podrás mejorar significativamente.";
  } else {
    return "Este examen muestra que necesitas apoyo adicional. No te desanimes - identifica las áreas clave y busca ayuda de tu instructor.";
  }
}

/**
 * Obtiene ícono de prioridad según el nivel
 */
export function getPriorityIcon(nivel: 1 | 2 | 3 | 4): string {
  switch (nivel) {
    case 1:
      return "🔴"; // Alta prioridad
    case 2:
      return "🟡"; // Media prioridad
    case 3:
      return "🟢"; // Baja prioridad
    case 4:
      return ""; // Sin recomendación (excelente)
  }
}

/**
 * Calcula estadísticas adicionales
 */
export function calculateStatistics(scores: PhaseScores): {
  promedio: number;
  faseMasAlta: string;
  faseMasBaja: string;
  nivelPromedio: number;
} {
  const fases: Array<{ nombre: string; score: PhaseScore }> = [
    { nombre: "F1", score: scores.F1 },
    { nombre: "F2", score: scores.F2 },
    { nombre: "F3", score: scores.F3 },
    { nombre: "F4", score: scores.F4 },
    { nombre: "F5", score: scores.F5 },
  ];

  // Fase más alta (por puntaje)
  const faseMasAlta = fases.reduce((max, fase) =>
    fase.score.puntaje > max.score.puntaje ? fase : max
  );

  // Fase más baja (por puntaje)
  const faseMasBaja = fases.reduce((min, fase) =>
    fase.score.puntaje < min.score.puntaje ? fase : min
  );

  // Promedio de puntajes
  const sumaPuntajes = fases.reduce((sum, fase) => sum + fase.score.puntaje, 0);
  const promedio = sumaPuntajes / fases.length;

  // Nivel promedio
  const sumaNiveles = fases.reduce((sum, fase) => sum + fase.score.nivel, 0);
  const nivelPromedio = sumaNiveles / fases.length;

  return {
    promedio: Math.round(promedio),
    faseMasAlta: faseMasAlta.nombre,
    faseMasBaja: faseMasBaja.nombre,
    nivelPromedio: Math.round(nivelPromedio * 10) / 10, // 1 decimal
  };
}

// Type helper para PhaseScore
type PhaseScore = {
  nivel: 1 | 2 | 3 | 4;
  puntaje: number;
};
