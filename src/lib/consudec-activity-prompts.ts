/**
 * Prompts de IA para evaluación de actividades CONSUDEC
 * Sistema de análisis de casos educativos con Claude Haiku
 */

import type { ActivityQuestion, QuestionRubric, QuestionScore } from '@/types/consudec-activity';

/**
 * System Prompt para Claude Haiku (CACHEABLE)
 * Este prompt se cachea para reducir costos en evaluaciones masivas
 */
export const CONSUDEC_SYSTEM_PROMPT = `Eres un evaluador experto en formación docente del CONSUDEC (Consejo Superior de Educación Católica).

Tu tarea es evaluar respuestas de estudiantes del profesorado a preguntas sobre casos pedagógicos reales.

# CRITERIOS DE EVALUACIÓN

Evalúa cada respuesta considerando:

1. **Fundamentación Pedagógica**: Uso apropiado de conceptos teóricos, marcos pedagógicos y terminología profesional
2. **Pertinencia**: Las propuestas/análisis son apropiados para el contexto descrito
3. **Capacidad de Análisis Crítico**: Profundidad de reflexión, identificación de causas, no solo descripción
4. **Claridad Comunicativa**: Expresión clara, organizada y profesional

# NIVELES DE DESEMPEÑO

**EXCELENTE (85-100 puntos)**
- Fundamentación teórica sólida y explícita
- Análisis profundo y crítico
- Propuestas concretas, viables y bien justificadas
- Redacción clara, organizada y profesional
- Demuestra comprensión profunda de la pedagogía

**BUENO (70-84 puntos)**
- Fundamentación adecuada con referencias conceptuales
- Análisis correcto con profundidad moderada
- Propuestas pertinentes con justificación razonable
- Redacción clara con pequeños errores
- Demuestra buena comprensión de la pedagogía

**SATISFACTORIO (50-69 puntos)**
- Fundamentación básica o limitada
- Análisis superficial, más descriptivo que crítico
- Propuestas genéricas con poca justificación
- Redacción aceptable pero desorganizada
- Comprensión básica de conceptos pedagógicos

**INSUFICIENTE (0-49 puntos)**
- Sin fundamentación teórica o incorrecta
- Sin análisis o análisis erróneo
- Propuestas no pertinentes o ausentes
- Redacción confusa o incomprensible
- Comprensión limitada o nula de la pedagogía

# INSTRUCCIONES

1. Lee cuidadosamente el contexto del caso y la pregunta específica
2. Analiza la respuesta del estudiante según la rúbrica provista
3. Asigna un puntaje de 0 a 100 según el nivel alcanzado
4. Identifica 2-3 fortalezas específicas de la respuesta
5. Identifica 2-3 áreas de mejora concretas
6. Genera retroalimentación constructiva y específica (2-3 oraciones)

# IMPORTANTE

- Sé constructivo: Destaca fortalezas antes de señalar mejoras
- Sé específico: Menciona elementos concretos de la respuesta
- Sé profesional: Usa lenguaje académico pero cercano
- Sé justo: Evalúa solo lo que el estudiante escribió, no lo que falta
- Responde SOLO con el JSON solicitado, sin texto adicional`;

/**
 * Genera el user prompt para evaluar una pregunta específica
 */
export function generateQuestionEvaluationPrompt(
  caseContext: string,
  question: string,
  studentAnswer: string,
  rubric: QuestionRubric
): string {
  return `# CONTEXTO DEL CASO EDUCATIVO

${caseContext}

# PREGUNTA A EVALUAR

${question}

# RESPUESTA DEL ESTUDIANTE

${studentAnswer}

# RÚBRICA ESPECÍFICA PARA ESTA PREGUNTA

- **Excelente (85-100)**: ${rubric.excellent}
- **Bueno (70-84)**: ${rubric.good}
- **Satisfactorio (50-69)**: ${rubric.satisfactory}
- **Insuficiente (0-49)**: ${rubric.insufficient}

# FORMATO DE RESPUESTA

Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:

\`\`\`json
{
  "score": <número entre 0 y 100>,
  "level": "<excellent | good | satisfactory | insufficient>",
  "feedback": "<retroalimentación específica en 2-3 oraciones>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>"],
  "improvements": ["<área de mejora 1>", "<área de mejora 2>"]
}
\`\`\`

IMPORTANTE: Devuelve SOLO el JSON, sin texto antes o después.`;
}

/**
 * Genera el prompt para feedback general de toda la actividad
 */
export function generateGeneralFeedbackPrompt(
  activityTitle: string,
  questionResults: Array<{
    questionNumber: number;
    questionText: string;
    score: number;
    level: string;
    strengths: string[];
    improvements: string[];
  }>
): string {
  const averageScore = Math.round(
    questionResults.reduce((sum, q) => sum + q.score, 0) / questionResults.length
  );

  const questionsDetails = questionResults
    .map(
      (q, i) => `
**Pregunta ${q.questionNumber}**: ${q.questionText}
- Puntaje: ${q.score}/100 (${q.level})
- Fortalezas: ${q.strengths.join(', ')}
- Mejoras: ${q.improvements.join(', ')}
`
    )
    .join('\n');

  return `Has evaluado individualmente todas las preguntas de un estudiante para la actividad "${activityTitle}".

# RESULTADOS POR PREGUNTA

${questionsDetails}

# PUNTAJE GLOBAL: ${averageScore}/100

# TAREA

Genera un feedback general (máximo 200 palabras) que:

1. Resuma el desempeño global del estudiante en esta actividad
2. Destaque los patrones de fortalezas observados
3. Identifique las áreas de mejora prioritarias
4. Ofrezca 1-2 recomendaciones concretas para seguir mejorando

El feedback debe ser:
- Constructivo y motivador
- Específico (mencionar aspectos concretos de las respuestas)
- Profesional pero cercano
- Orientado a la acción (qué hacer para mejorar)

Devuelve SOLO el texto del feedback, sin formato JSON ni encabezados adicionales.`;
}

/**
 * Parsea la respuesta JSON de Claude Haiku
 */
export function parseQuestionEvaluationResponse(aiResponse: string): QuestionScore {
  try {
    // Intentar parsear directamente
    const parsed = JSON.parse(aiResponse);

    // Validar campos requeridos
    if (
      typeof parsed.score !== 'number' ||
      typeof parsed.level !== 'string' ||
      typeof parsed.feedback !== 'string' ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.improvements)
    ) {
      throw new Error('Respuesta de IA con formato incorrecto');
    }

    return parsed;
  } catch (error) {
    // Si falla, intentar extraer JSON del texto
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      } catch (e) {
        console.error('Error parsing AI response:', e);
        throw new Error('No se pudo parsear la respuesta de IA');
      }
    }
    throw new Error('No se encontró JSON en la respuesta de IA');
  }
}

/**
 * Validar que el score esté en el rango correcto según el nivel
 */
export function validateScoreLevel(
  score: number,
  level: 'excellent' | 'good' | 'satisfactory' | 'insufficient'
): boolean {
  switch (level) {
    case 'excellent':
      return score >= 85 && score <= 100;
    case 'good':
      return score >= 70 && score < 85;
    case 'satisfactory':
      return score >= 50 && score < 70;
    case 'insufficient':
      return score >= 0 && score < 50;
    default:
      return false;
  }
}

/**
 * Determinar el nivel automáticamente basado en el score
 */
export function determineLevelFromScore(
  score: number
): 'excellent' | 'good' | 'satisfactory' | 'insufficient' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'satisfactory';
  return 'insufficient';
}
