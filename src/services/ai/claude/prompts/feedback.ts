/**
 * Sistema de Prompts para Feedback Educativo
 *
 * Colección de funciones para construir prompts optimizados
 * para diferentes tipos de análisis educativo
 */

import type { Answer } from '../analyzer';

/**
 * Construir prompt para feedback general de reporte semanal
 *
 * @param answers - Respuestas del estudiante
 * @param subject - Materia
 * @param studentName - Nombre del estudiante (opcional)
 * @param weekNumber - Número de semana (opcional)
 */
export function buildWeeklyReportPrompt(
  answers: Answer[],
  subject: string,
  studentName?: string,
  weekNumber?: number
): string {
  const studentInfo = studentName ? `del estudiante ${studentName}` : '';
  const weekInfo = weekNumber ? `de la semana ${weekNumber}` : '';

  const answersText = answers
    .map((a, idx) => `**Pregunta ${idx + 1}**: ${a.questionText}\n**Respuesta**: ${a.answer}`)
    .join('\n\n');

  return `<contexto>
Eres un instructor experimentado de ${subject} en Intellego Platform. Tu objetivo es proporcionar feedback constructivo y personalizado que ayude al estudiante a mejorar.
</contexto>

<tarea>
Analiza el reporte semanal ${studentInfo} ${weekInfo} y proporciona:

1. **Puntaje General** (0-100): Evaluación objetiva del desempeño
2. **Fortalezas** (2-3 puntos): Aspectos destacables con ejemplos concretos
3. **Áreas de Mejora** (2-3 puntos): Aspectos a trabajar con sugerencias específicas
4. **Recomendaciones** (1-2 acciones): Pasos concretos para la próxima semana

**Tono**: Constructivo, alentador pero honesto
**Límite**: Máximo 250 palabras
</tarea>

<respuestas_estudiante>
${answersText}
</respuestas_estudiante>

<formato_salida>
PUNTAJE: [número entre 0-100]

FORTALEZAS:
- [Punto 1 con ejemplo específico]
- [Punto 2 con ejemplo específico]

ÁREAS DE MEJORA:
- [Punto 1: problema + sugerencia]
- [Punto 2: problema + sugerencia]

PRÓXIMOS PASOS:
- [Acción concreta 1]
- [Acción concreta 2]

MÉTRICAS:
Completeness: [0-100]
Clarity: [0-100]
Reflection: [0-100]
Progress: [0-100]
Engagement: [0-100]
</formato_salida>`;
}

/**
 * Construir prompt para evaluación con rúbrica específica
 *
 * @param answers - Respuestas del estudiante
 * @param rubric - Texto de la rúbrica
 * @param subject - Materia
 */
export function buildRubricBasedPrompt(
  answers: Answer[],
  rubric: string,
  subject: string
): string {
  const answersText = answers
    .map((a) => `Q: ${a.questionText}\nA: ${a.answer}`)
    .join('\n\n');

  return `<instrucciones>
Eres un evaluador de ${subject} en Intellego Platform. Utiliza EXCLUSIVAMENTE la rúbrica proporcionada para evaluar las respuestas del estudiante.

Tu evaluación debe ser:
- Objetiva y basada en criterios medibles
- Consistente con la rúbrica
- Justificada con ejemplos de las respuestas
</instrucciones>

<rubrica>
${rubric}
</rubrica>

<respuestas_estudiante>
${answersText}
</respuestas_estudiante>

<formato_salida>
PUNTAJE TOTAL: [suma según rúbrica]/100

EVALUACIÓN POR CRITERIO:
[Para cada criterio de la rúbrica:]
- Criterio: [nombre]
- Puntaje: [X]/[máximo]
- Justificación: [1-2 oraciones con ejemplos]

FEEDBACK GENERAL:
[2-3 oraciones sobre el desempeño general]

RECOMENDACIONES:
- [Acción específica 1]
- [Acción específica 2]
</formato_salida>`;
}

/**
 * Construir prompt para comparación de progreso
 *
 * @param currentAnswers - Respuestas actuales
 * @param previousAnswers - Respuestas de semana anterior
 * @param subject - Materia
 */
export function buildProgressComparisonPrompt(
  currentAnswers: Answer[],
  previousAnswers: Answer[],
  subject: string
): string {
  const currentText = currentAnswers
    .map((a) => `${a.questionText}: ${a.answer}`)
    .join('\n');

  const previousText = previousAnswers
    .map((a) => `${a.questionText}: ${a.answer}`)
    .join('\n');

  return `<instrucciones>
Eres un instructor de ${subject}. Compara las respuestas de dos semanas consecutivas e identifica:

1. **Áreas de mejora**: Aspectos que mejoraron significativamente
2. **Áreas estancadas**: Aspectos sin cambios notables
3. **Áreas regresivas**: Aspectos que empeoraron
4. **Tendencia general**: Progreso positivo, estable o negativo
</instrucciones>

<semana_anterior>
${previousText}
</semana_anterior>

<semana_actual>
${currentText}
</semana_actual>

<formato_salida>
TENDENCIA GENERAL: [Mejora/Estable/Regresión]

MEJORAS OBSERVADAS:
- [Aspecto 1 con evidencia]
- [Aspecto 2 con evidencia]

ÁREAS SIN CAMBIOS:
- [Aspecto 1]
- [Aspecto 2]

REGRESIONES (si aplica):
- [Aspecto 1 con evidencia]

RECOMENDACIÓN:
[1-2 oraciones sobre cómo mantener el progreso o revertir regresiones]
</formato_salida>`;
}

/**
 * Construir prompt para identificación de fortalezas y debilidades
 *
 * @param answers - Respuestas del estudiante
 * @param focusArea - Área de enfoque específica (opcional)
 */
export function buildStrengthsWeaknessesPrompt(
  answers: Answer[],
  focusArea?: string
): string {
  const answersText = answers
    .map((a) => `${a.questionText}\n→ ${a.answer}`)
    .join('\n\n');

  const focusSection = focusArea
    ? `\n\nENFOQUE ESPECÍFICO: Presta especial atención a ${focusArea}`
    : '';

  return `<instrucciones>
Analiza las respuestas del estudiante e identifica:

1. **3 Fortalezas principales**: Aspectos sobresalientes con ejemplos concretos
2. **3 Debilidades principales**: Aspectos a mejorar con sugerencias específicas
3. **Patrón predominante**: ¿Qué caracteriza el estilo de respuesta del estudiante?${focusSection}
</instrucciones>

<respuestas>
${answersText}
</respuestas>

<formato_salida>
FORTALEZAS:
1. [Fortaleza 1]: [ejemplo de las respuestas]
2. [Fortaleza 2]: [ejemplo de las respuestas]
3. [Fortaleza 3]: [ejemplo de las respuestas]

DEBILIDADES:
1. [Debilidad 1]: [evidencia] → Sugerencia: [acción concreta]
2. [Debilidad 2]: [evidencia] → Sugerencia: [acción concreta]
3. [Debilidad 3]: [evidencia] → Sugerencia: [acción concreta]

PATRÓN PREDOMINANTE:
[1-2 oraciones describiendo el estilo general del estudiante]
</formato_salida>`;
}

/**
 * Construir prompt minimalista para evaluación rápida
 * (Útil para reducir costos en análisis masivos)
 *
 * @param answers - Respuestas del estudiante
 */
export function buildQuickEvaluationPrompt(answers: Answer[]): string {
  const answersText = answers
    .map((a) => `${a.questionText}: ${a.answer}`)
    .join('\n');

  return `Evalúa brevemente (máx 100 palabras):

${answersText}

Responde:
Puntaje: [0-100]
Fortaleza principal: [1 oración]
Mejora principal: [1 oración]
Próximo paso: [1 acción]`;
}

/**
 * Formatear respuestas para inclusión en prompts
 * (Función auxiliar)
 */
export function formatAnswersForPrompt(
  answers: Answer[],
  style: 'detailed' | 'compact' = 'detailed'
): string {
  if (style === 'compact') {
    return answers
      .map((a) => `Q: ${a.questionText}\nA: ${a.answer}`)
      .join('\n\n');
  }

  return answers
    .map((a, idx) => {
      return `━━━ Pregunta ${idx + 1} ━━━
Tipo: ${a.type}
Pregunta: ${a.questionText}
Respuesta del estudiante:
${a.answer}`;
    })
    .join('\n\n');
}

/**
 * Validar longitud de prompt antes de enviar a Claude
 * (Prevenir exceso de tokens)
 */
export function validatePromptLength(prompt: string): {
  isValid: boolean;
  estimatedTokens: number;
  warning?: string;
} {
  // Estimación aproximada: 1 token ≈ 4 caracteres en español
  const estimatedTokens = Math.ceil(prompt.length / 4);

  // Claude Haiku 4.5 tiene contexto de 200K tokens
  // Pero queremos mantener prompts cortos para optimizar costos
  const MAX_RECOMMENDED_TOKENS = 4000;  // ~16K caracteres

  if (estimatedTokens > MAX_RECOMMENDED_TOKENS) {
    return {
      isValid: false,
      estimatedTokens,
      warning: `Prompt muy largo (${estimatedTokens} tokens). Considera usar menos respuestas o formato compacto.`
    };
  }

  if (estimatedTokens > MAX_RECOMMENDED_TOKENS * 0.8) {
    return {
      isValid: true,
      estimatedTokens,
      warning: `Prompt cercano al límite recomendado (${estimatedTokens} tokens). Monitorea costos.`
    };
  }

  return {
    isValid: true,
    estimatedTokens
  };
}
