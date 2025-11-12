import type {
  AIAnalysis,
  Student,
  ExamMetadata,
  Grading,
  FeedbackVariables,
} from "./types";
import { getScoreMessage, getPriorityIcon } from "./calculator";

/**
 * Generator - Genera feedback en Markdown
 *
 * Responsabilidades:
 * 1. Cargar template de feedback
 * 2. Reemplazar variables dinámicas
 * 3. Generar Markdown final (2000-3000 palabras)
 */

/**
 * Genera feedback en formato Markdown
 *
 * @param student - Información del estudiante
 * @param metadata - Metadata del examen
 * @param analysis - Análisis de Claude Haiku
 * @param grading - Nota final calculada
 * @param instructorName - Nombre del instructor
 * @returns Feedback completo en Markdown
 */
export function generateFeedback(
  student: Student,
  metadata: ExamMetadata,
  analysis: AIAnalysis,
  grading: Grading,
  instructorName: string
): string {
  // Construir variables para el template
  const variables = buildVariables(
    student,
    metadata,
    analysis,
    grading,
    instructorName
  );

  // Generar Markdown desde template
  const markdown = renderTemplate(variables);

  return markdown;
}

/**
 * Construye las variables para el template
 */
function buildVariables(
  student: Student,
  metadata: ExamMetadata,
  analysis: AIAnalysis,
  grading: Grading,
  instructorName: string
): FeedbackVariables {
  // Información básica
  const STUDENT_NAME = student.name;
  const SUBJECT = metadata.subject;
  const EXAM_TOPIC = metadata.examTopic;
  const EXAM_DATE = formatDate(metadata.examDate);
  const SCORE = grading.score;

  // Ajuste contextual (si existe)
  const HAS_ADJUSTMENT = analysis.contextualAdjustment !== undefined;
  const STRICT_SCORE = HAS_ADJUSTMENT
    ? analysis.contextualAdjustment!.originalScore
    : undefined;
  const ADJUSTED_SCORE = HAS_ADJUSTMENT
    ? analysis.contextualAdjustment!.adjustedScore
    : undefined;
  const ADJUSTMENT_VALUE = HAS_ADJUSTMENT
    ? analysis.contextualAdjustment!.adjustment
    : undefined;
  const ADJUSTMENT_JUSTIFICATION = HAS_ADJUSTMENT
    ? analysis.contextualAdjustment!.justification
    : undefined;
  const ADJUSTMENT_EVIDENCE = HAS_ADJUSTMENT
    ? analysis.contextualAdjustment!.evidenceForAdjustment
    : undefined;

  // Scores por fase
  const F1_LEVEL = analysis.scores.F1.nivel;
  const F1_SCORE = analysis.scores.F1.puntaje;
  const F2_LEVEL = analysis.scores.F2.nivel;
  const F2_SCORE = analysis.scores.F2.puntaje;
  const F3_LEVEL = analysis.scores.F3.nivel;
  const F3_SCORE = analysis.scores.F3.puntaje;
  const F4_LEVEL = analysis.scores.F4.nivel;
  const F4_SCORE = analysis.scores.F4.puntaje;
  const F5_LEVEL = analysis.scores.F5.nivel;
  const F5_SCORE = analysis.scores.F5.puntaje;

  // Ejercicios
  const EXERCISES = analysis.exerciseAnalysis.map((ex) => ({
    number: ex.exerciseNumber,
    title: `Ejercicio ${ex.exerciseNumber}`,
    strengths: ex.strengths,
    weaknesses: ex.weaknesses,
    specificFeedback: ex.specificFeedback,
    F1_level: ex.phaseEvaluations.F1.nivel,
    F1_comment: ex.phaseEvaluations.F1.comment,
    F2_level: ex.phaseEvaluations.F2.nivel,
    F2_comment: ex.phaseEvaluations.F2.comment,
    F3_level: ex.phaseEvaluations.F3.nivel,
    F3_comment: ex.phaseEvaluations.F3.comment,
    F4_level: ex.phaseEvaluations.F4.nivel,
    F4_comment: ex.phaseEvaluations.F4.comment,
    F5_level: ex.phaseEvaluations.F5.nivel,
    F5_comment: ex.phaseEvaluations.F5.comment,
  }));

  // Recomendaciones
  const RECOMMENDATIONS = analysis.recommendations.map((rec) => ({
    priority_icon: getPriorityIcon(
      rec.priority === "alta" ? 1 : rec.priority === "media" ? 2 : 3
    ),
    title: rec.title,
    reason: rec.reason,
    steps: rec.steps,
    suggestedResources: rec.suggestedResources,
  }));

  // Mensajes
  const FINAL_MESSAGE = getScoreMessage(SCORE);
  const INSTRUCTOR_NAME = instructorName;
  const CORRECTION_DATE = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  return {
    STUDENT_NAME,
    SUBJECT,
    EXAM_TOPIC,
    EXAM_DATE,
    SCORE,
    HAS_ADJUSTMENT,
    STRICT_SCORE,
    ADJUSTED_SCORE,
    ADJUSTMENT_VALUE,
    ADJUSTMENT_JUSTIFICATION,
    ADJUSTMENT_EVIDENCE,
    F1_LEVEL,
    F1_SCORE,
    F2_LEVEL,
    F2_SCORE,
    F3_LEVEL,
    F3_SCORE,
    F4_LEVEL,
    F4_SCORE,
    F5_LEVEL,
    F5_SCORE,
    EXERCISES,
    RECOMMENDATIONS,
    FINAL_MESSAGE,
    INSTRUCTOR_NAME,
    CORRECTION_DATE,
  };
}

/**
 * Renderiza el template con las variables
 */
function renderTemplate(variables: FeedbackVariables): string {
  const {
    STUDENT_NAME,
    SUBJECT,
    EXAM_TOPIC,
    EXAM_DATE,
    SCORE,
    F1_LEVEL,
    F1_SCORE,
    F2_LEVEL,
    F2_SCORE,
    F3_LEVEL,
    F3_SCORE,
    F4_LEVEL,
    F4_SCORE,
    F5_LEVEL,
    F5_SCORE,
    EXERCISES,
    RECOMMENDATIONS,
    FINAL_MESSAGE,
    INSTRUCTOR_NAME,
    CORRECTION_DATE,
  } = variables;

  const {
    HAS_ADJUSTMENT,
    STRICT_SCORE,
    ADJUSTED_SCORE,
    ADJUSTMENT_VALUE,
    ADJUSTMENT_JUSTIFICATION,
    ADJUSTMENT_EVIDENCE,
  } = variables;

  // Template principal
  let markdown = `# RETROALIMENTACIÓN - ${STUDENT_NAME}

## Examen: ${SUBJECT} - ${EXAM_TOPIC}
### Fecha: ${EXAM_DATE}
### Nota Final: ${SCORE}/100

---

## 📊 Resumen de tu Desempeño

Has obtenido **${SCORE}/100** en este examen.
${
  HAS_ADJUSTMENT
    ? `
### ⚖️ Ajuste Contextual Aplicado

Tu evaluación ha sido revisada con criterio pedagógico:

| Concepto | Puntaje |
|----------|---------|
| **Evaluación Estricta (Rúbrica)** | ${STRICT_SCORE?.toFixed(1)}/100 |
| **Ajuste Contextual** | ${ADJUSTMENT_VALUE! >= 0 ? '+' : ''}${ADJUSTMENT_VALUE?.toFixed(1)} puntos |
| **Nota Final** | **${ADJUSTED_SCORE?.toFixed(1)}/100** |

#### ¿Por qué recibiste ${ADJUSTMENT_VALUE! >= 0 ? 'puntos adicionales' : 'un ajuste'}?

${ADJUSTMENT_JUSTIFICATION}

${ADJUSTMENT_EVIDENCE ? `**Evidencia en tu respuesta:** "${ADJUSTMENT_EVIDENCE}"` : ''}

> 💡 **Nota:** El sistema aplica "sentido común pedagógico" para reconocer comprensión conceptual, métodos alternativos válidos, y diferenciar errores menores de fundamentales. Esto asegura que tu evaluación sea justa y constructiva.

---
`
    : ''
}

### Distribución por Fases

| Fase | Descripción | Nivel | Puntaje | Peso |
|------|-------------|-------|---------|------|
| F1 | Comprensión del Problema | ${F1_LEVEL} | ${F1_SCORE}/100 | 15% |
| F2 | Identificación de Variables | ${F2_LEVEL} | ${F2_SCORE}/100 | 20% |
| F3 | Selección de Herramientas | ${F3_LEVEL} | ${F3_SCORE}/100 | 25% |
| F4 | Ejecución y Cálculos | ${F4_LEVEL} | ${F4_SCORE}/100 | 30% |
| F5 | Verificación y Análisis | ${F5_LEVEL} | ${F5_SCORE}/100 | 10% |

### Niveles de Desempeño
- **Nivel 4 (85-100):** Excelente - Dominio completo de la fase
- **Nivel 3 (70-84):** Bueno - Comprensión sólida con detalles menores
- **Nivel 2 (55-69):** En Desarrollo - Comprensión básica, necesita práctica
- **Nivel 1 (0-54):** Inicial - Requiere apoyo significativo

---

## 🎯 Análisis Ejercicio por Ejercicio

`;

  // Agregar análisis de cada ejercicio
  for (const exercise of EXERCISES) {
    markdown += `### ${exercise.title}

**Fortalezas:**
${exercise.strengths.map((s) => `- ${s}`).join("\n")}

**Áreas de Mejora:**
${exercise.weaknesses.map((w) => `- ${w}`).join("\n")}

**Retroalimentación Específica:**
${exercise.specificFeedback}

**Evaluación por Fase:**
- **F1 - Comprensión:** Nivel ${exercise.F1_level} - ${exercise.F1_comment}
- **F2 - Variables:** Nivel ${exercise.F2_level} - ${exercise.F2_comment}
- **F3 - Herramientas:** Nivel ${exercise.F3_level} - ${exercise.F3_comment}
- **F4 - Ejecución:** Nivel ${exercise.F4_level} - ${exercise.F4_comment}
- **F5 - Verificación:** Nivel ${exercise.F5_level} - ${exercise.F5_comment}

---

`;
  }

  // Agregar recomendaciones
  markdown += `## 💡 Recomendaciones para Mejorar

`;

  for (const rec of RECOMMENDATIONS) {
    markdown += `### ${rec.priority_icon} ${rec.title}

**Por qué es importante:**
${rec.reason}

**Cómo implementarlo:**
${rec.steps.map((s) => `- ${s}`).join("\n")}

${rec.suggestedResources ? `**Recursos sugeridos:** ${rec.suggestedResources}` : ""}

---

`;
  }

  // Próximos pasos (basados en nivel más bajo)
  const lowestPhase = getLowestPhase({
    F1: F1_LEVEL,
    F2: F2_LEVEL,
    F3: F3_LEVEL,
    F4: F4_LEVEL,
    F5: F5_LEVEL,
  });

  markdown += `## 📈 Próximos Pasos

### Plan de Acción Inmediato:
${generateActionPlan(lowestPhase, SCORE).map((a) => `- [ ] ${a}`).join("\n")}

### Enfócate en:
${getFocusAreas(lowestPhase)}

### Seguimiento:
Tu instructor revisará tu progreso en las próximas actividades. Si tienes dudas, no dudes en consultar durante las clases o tutorías.

---

## 📌 Mensaje Final

${FINAL_MESSAGE}

---

**Corrección realizada por:** ${INSTRUCTOR_NAME}
**Sistema:** Intellego Platform - Corrección Automática v2.0
**Método:** Evaluación con Rúbrica 5-FASE
**Fecha de corrección:** ${CORRECTION_DATE}

**Nota:** Este feedback fue generado automáticamente usando IA (Claude Haiku 4.5) con supervisión del instructor. Si tienes preguntas sobre la evaluación, consulta con tu profesor.
`;

  return markdown;
}

/**
 * Obtiene la fase con menor nivel
 */
function getLowestPhase(phases: {
  F1: number;
  F2: number;
  F3: number;
  F4: number;
  F5: number;
}): string {
  const entries = Object.entries(phases);
  const lowest = entries.reduce((min, [fase, nivel]) =>
    nivel < min[1] ? [fase, nivel] : min
  );

  const phaseNames: Record<string, string> = {
    F1: "Comprensión del Problema",
    F2: "Identificación de Variables",
    F3: "Selección de Herramientas",
    F4: "Ejecución y Cálculos",
    F5: "Verificación y Análisis",
  };

  return phaseNames[lowest[0]] || "General";
}

/**
 * Genera plan de acción basado en la fase más débil
 */
function generateActionPlan(lowestPhase: string, score: number): string[] {
  const plans: Record<string, string[]> = {
    "Comprensión del Problema": [
      "Leer el enunciado al menos dos veces antes de comenzar",
      "Subrayar los datos conocidos y las incógnitas",
      "Reformular el problema con tus propias palabras",
    ],
    "Identificación de Variables": [
      "Crear una tabla con todas las variables del problema",
      "Asignar símbolos claros y consistentes",
      "Verificar las unidades de cada variable",
    ],
    "Selección de Herramientas": [
      "Repasar las fórmulas y leyes relevantes del tema",
      "Justificar por qué elegiste cada fórmula",
      "Practicar ejercicios similares del libro",
    ],
    "Ejecución y Cálculos": [
      "Desarrollar paso a paso sin saltear etapas",
      "Verificar cada cálculo aritmético",
      "Mantener un orden claro en la presentación",
    ],
    "Verificación y Análisis": [
      "Siempre verificar dimensionalmente el resultado",
      "Evaluar si el resultado tiene sentido físicamente",
      "Comparar con casos conocidos o ejemplos del libro",
    ],
  };

  return (
    plans[lowestPhase] || [
      "Repasar los conceptos fundamentales del tema",
      "Practicar con ejercicios adicionales",
      "Consultar dudas con el instructor",
    ]
  );
}

/**
 * Obtiene áreas de enfoque basadas en la fase más débil
 */
function getFocusAreas(lowestPhase: string): string {
  const areas: Record<string, string> = {
    "Comprensión del Problema":
      "Mejorar la lectura analítica de enunciados y la identificación de datos e incógnitas.",
    "Identificación de Variables":
      "Fortalecer la organización de información y el manejo de notación científica.",
    "Selección de Herramientas":
      "Repasar las fórmulas y leyes del tema, y practicar su aplicación.",
    "Ejecución y Cálculos":
      "Desarrollar mayor precisión en los cálculos y presentación ordenada.",
    "Verificación y Análisis":
      "Incorporar el hábito de verificar resultados y analizar su coherencia.",
  };

  return (
    areas[lowestPhase] || "Fortalecer las bases conceptuales del tema."
  );
}

/**
 * Formatea una fecha ISO a formato legible
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-AR", options);
  } catch {
    return isoDate; // Fallback si el formato es inválido
  }
}
