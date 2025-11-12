/**
 * Servicio de evaluación con IA para actividades CONSUDEC
 * Utiliza Claude Haiku para evaluar respuestas de estudiantes
 * Extendido para soportar evaluación de casos clínicos con cálculos
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ConsudecActivity,
  ActivityQuestion,
  QuestionScore,
  APICostInfo,
  ActivityType,
} from '@/types/consudec-activity';
import {
  CONSUDEC_SYSTEM_PROMPT,
  generateQuestionEvaluationPrompt,
  generateGeneralFeedbackPrompt,
  parseQuestionEvaluationResponse,
  validateScoreLevel,
  determineLevelFromScore,
} from '@/lib/consudec-activity-prompts';
import {
  CLINICAL_SYSTEM_PROMPT,
  generateClinicalCalculationPrompt,
  generateClinicalConceptualPrompt,
  generateClinicalGeneralFeedbackPrompt,
} from '@/lib/consudec-clinical-prompts';

/**
 * Cliente de Anthropic (singleton)
 */
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

/**
 * Evalúa una pregunta individual con Claude Haiku
 */
export async function evaluateQuestionWithAI(
  caseContext: string,
  question: ActivityQuestion,
  studentAnswer: string
): Promise<{
  questionScore: QuestionScore;
  tokensInput: number;
  tokensOutput: number;
  cacheHit: boolean;
}> {
  const anthropic = getAnthropicClient();

  // Generar prompt
  const userPrompt = generateQuestionEvaluationPrompt(
    caseContext,
    question.text,
    studentAnswer,
    question.rubric
  );

  try {
    // Llamar a Claude Haiku con system prompt cacheado
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: CONSUDEC_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }, // Cache para reducir costos
        },
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extraer contenido de la respuesta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta de Claude no es texto');
    }

    // Parsear JSON de la respuesta
    const parsedResponse = parseQuestionEvaluationResponse(content.text);

    // Validar consistencia score-level
    if (!validateScoreLevel(parsedResponse.score, parsedResponse.level)) {
      console.warn(
        `Score ${parsedResponse.score} inconsistente con nivel ${parsedResponse.level}, corrigiendo...`
      );
      parsedResponse.level = determineLevelFromScore(parsedResponse.score);
    }

    // Extraer información de uso
    const tokensInput = response.usage.input_tokens;
    const tokensOutput = response.usage.output_tokens;
    const cacheHit = response.usage.cache_read_input_tokens
      ? response.usage.cache_read_input_tokens > 0
      : false;

    return {
      questionScore: parsedResponse,
      tokensInput,
      tokensOutput,
      cacheHit,
    };
  } catch (error: unknown) {
    console.error('Error evaluando pregunta con IA:', error);
    if (error instanceof Error) {
      throw new Error(`Error en evaluación IA: ${error.message}`);
    }
    throw new Error('Error desconocido en evaluación IA');
  }
}

/**
 * Evalúa una pregunta tipo CÁLCULO con Claude Haiku
 * Incluye validación numérica y crédito parcial
 */
export async function evaluateCalculationQuestionWithAI(
  caseContext: string,
  question: ActivityQuestion,
  studentAnswer: string
): Promise<{
  questionScore: QuestionScore;
  tokensInput: number;
  tokensOutput: number;
  cacheHit: boolean;
}> {
  // Validar que tenga los campos necesarios para cálculo
  if (!question.correctAnswer || !question.expectedFormula) {
    throw new Error('Pregunta de cálculo sin parámetros requeridos (correctAnswer, expectedFormula)');
  }

  const anthropic = getAnthropicClient();

  // Generar prompt específico para cálculo
  const userPrompt = generateClinicalCalculationPrompt(
    caseContext,
    question,
    studentAnswer,
    question.correctAnswer,
    question.tolerancePercentage ?? 5, // Default 5%
    question.expectedFormula,
    question.expectedUnit ?? ''
  );

  try {
    // Llamar a Claude Haiku con system prompt clínico cacheado
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: CLINICAL_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }, // Cache para reducir costos
        },
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extraer contenido de la respuesta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta de Claude no es texto');
    }

    // Parsear JSON de la respuesta (incluye calculationEvaluation)
    const parsedResponse = parseQuestionEvaluationResponse(content.text);

    // Validar consistencia score-level
    if (!validateScoreLevel(parsedResponse.score, parsedResponse.level)) {
      console.warn(
        `Score ${parsedResponse.score} inconsistente con nivel ${parsedResponse.level}, corrigiendo...`
      );
      parsedResponse.level = determineLevelFromScore(parsedResponse.score);
    }

    // Validar que tenga calculationEvaluation
    if (!parsedResponse.calculationEvaluation) {
      console.warn('Respuesta de cálculo sin calculationEvaluation, creando estructura básica');
      parsedResponse.calculationEvaluation = {
        isNumericCorrect: parsedResponse.score >= 85,
        numericValue: null,
        hasFormula: false,
        hasExplanation: false,
        hasCorrectUnits: false,
        partialCreditApplied: parsedResponse.score >= 50 && parsedResponse.score < 70,
      };
    }

    // Extraer información de uso
    const tokensInput = response.usage.input_tokens;
    const tokensOutput = response.usage.output_tokens;
    const cacheHit = response.usage.cache_read_input_tokens
      ? response.usage.cache_read_input_tokens > 0
      : false;

    return {
      questionScore: parsedResponse,
      tokensInput,
      tokensOutput,
      cacheHit,
    };
  } catch (error: unknown) {
    console.error('Error evaluando pregunta de cálculo con IA:', error);
    if (error instanceof Error) {
      throw new Error(`Error en evaluación IA de cálculo: ${error.message}`);
    }
    throw new Error('Error desconocido en evaluación IA de cálculo');
  }
}

/**
 * Evalúa una pregunta tipo CONCEPTUAL de casos clínicos con Claude Haiku
 */
export async function evaluateConceptualQuestionWithAI(
  caseContext: string,
  question: ActivityQuestion,
  studentAnswer: string
): Promise<{
  questionScore: QuestionScore;
  tokensInput: number;
  tokensOutput: number;
  cacheHit: boolean;
}> {
  const anthropic = getAnthropicClient();

  // Generar prompt específico para pregunta conceptual clínica
  const userPrompt = generateClinicalConceptualPrompt(caseContext, question, studentAnswer);

  try {
    // Llamar a Claude Haiku con system prompt clínico cacheado
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: CLINICAL_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extraer contenido de la respuesta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta de Claude no es texto');
    }

    // Parsear JSON de la respuesta
    const parsedResponse = parseQuestionEvaluationResponse(content.text);

    // Validar consistencia score-level
    if (!validateScoreLevel(parsedResponse.score, parsedResponse.level)) {
      console.warn(
        `Score ${parsedResponse.score} inconsistente con nivel ${parsedResponse.level}, corrigiendo...`
      );
      parsedResponse.level = determineLevelFromScore(parsedResponse.score);
    }

    // Extraer información de uso
    const tokensInput = response.usage.input_tokens;
    const tokensOutput = response.usage.output_tokens;
    const cacheHit = response.usage.cache_read_input_tokens
      ? response.usage.cache_read_input_tokens > 0
      : false;

    return {
      questionScore: parsedResponse,
      tokensInput,
      tokensOutput,
      cacheHit,
    };
  } catch (error: unknown) {
    console.error('Error evaluando pregunta conceptual con IA:', error);
    if (error instanceof Error) {
      throw new Error(`Error en evaluación IA conceptual: ${error.message}`);
    }
    throw new Error('Error desconocido en evaluación IA conceptual');
  }
}

/**
 * Evalúa todas las preguntas de una actividad en paralelo
 */
export async function evaluateAllQuestions(
  activity: ConsudecActivity,
  answers: Record<string, string>
): Promise<{
  questionScores: Record<string, QuestionScore>;
  overallScore: number;
  percentageAchieved: number;
  costInfo: APICostInfo;
}> {
  // Validar que haya respuestas
  if (Object.keys(answers).length === 0) {
    throw new Error('No hay respuestas para evaluar');
  }

  // Validar que todas las preguntas tengan respuesta
  const missingAnswers = activity.questions.filter(
    (q) => !answers[q.id] || answers[q.id].trim().length === 0
  );
  if (missingAnswers.length > 0) {
    throw new Error(
      `Faltan respuestas para las preguntas: ${missingAnswers.map((q) => q.id).join(', ')}`
    );
  }

  // Evaluar todas las preguntas en paralelo
  // Detectar tipo de actividad y pregunta para elegir evaluador correcto
  const evaluationPromises = activity.questions.map(async (question) => {
    const answer = answers[question.id];

    // 🆕 DECISIÓN: Tipo de evaluador según activityType y questionType
    let result;

    if (activity.activityType === 'clinical') {
      // Casos clínicos de Bioelectricidad
      if (question.questionType === 'calculation') {
        // Pregunta de cálculo: usar evaluador clínico con validación numérica
        result = await evaluateCalculationQuestionWithAI(activity.caseText, question, answer);
      } else {
        // Pregunta conceptual clínica: usar evaluador clínico conceptual
        result = await evaluateConceptualQuestionWithAI(activity.caseText, question, answer);
      }
    } else {
      // Casos pedagógicos (original): usar evaluador pedagógico
      result = await evaluateQuestionWithAI(activity.caseText, question, answer);
    }

    return {
      questionId: question.id,
      ...result,
    };
  });

  const results = await Promise.all(evaluationPromises);

  // Convertir a objeto de scores
  const questionScores: Record<string, QuestionScore> = {};
  results.forEach(({ questionId, questionScore }) => {
    questionScores[questionId] = questionScore;
  });

  // Calcular score promedio
  const totalScore = results.reduce((sum, { questionScore }) => sum + questionScore.score, 0);
  const overallScore = Math.round(totalScore / results.length);
  const percentageAchieved = overallScore; // En escala 0-100 ya

  // Calcular costos totales
  const totalTokensInput = results.reduce((sum, r) => sum + r.tokensInput, 0);
  const totalTokensOutput = results.reduce((sum, r) => sum + r.tokensOutput, 0);
  const anyCacheHit = results.some((r) => r.cacheHit);

  // Precios Claude Haiku (actualizar según pricing de Anthropic)
  // Input: $0.25 / 1M tokens
  // Output: $1.25 / 1M tokens
  // Cache read: $0.025 / 1M tokens (90% descuento)
  const inputCost = anyCacheHit
    ? (totalTokensInput * 0.025) / 1000000 // Con cache
    : (totalTokensInput * 0.25) / 1000000; // Sin cache
  const outputCost = (totalTokensOutput * 1.25) / 1000000;
  const totalCost = inputCost + outputCost;

  const costInfo: APICostInfo = {
    cost: totalCost,
    model: 'claude-haiku-4',
    tokensInput: totalTokensInput,
    tokensOutput: totalTokensOutput,
    cacheHit: anyCacheHit,
  };

  return {
    questionScores,
    overallScore,
    percentageAchieved,
    costInfo,
  };
}

/**
 * Genera feedback general basado en los scores individuales
 */
export async function generateGeneralFeedback(
  activityTitle: string,
  questionScores: Record<string, QuestionScore>,
  questions: ActivityQuestion[],
  activityType: ActivityType = 'pedagogical'
): Promise<string> {
  const anthropic = getAnthropicClient();

  // Preparar datos para el prompt
  const questionResults = questions.map((q, index) => ({
    questionNumber: index + 1,
    questionText: q.text,
    score: questionScores[q.id].score,
    level: questionScores[q.id].level,
    strengths: questionScores[q.id].strengths,
    improvements: questionScores[q.id].improvements,
  }));

  // 🆕 Seleccionar generador de prompt según tipo de actividad
  const prompt =
    activityType === 'clinical'
      ? generateClinicalGeneralFeedbackPrompt(activityTitle, questionResults)
      : generateGeneralFeedbackPrompt(activityTitle, questionResults);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta de Claude no es texto');
    }

    return content.text.trim();
  } catch (error: unknown) {
    console.error('Error generando feedback general:', error);
    // Fallback: generar feedback simple basado en scores
    return generateFallbackGeneralFeedback(questionResults, activityType);
  }
}

/**
 * Genera feedback general simple sin IA (fallback)
 */
function generateFallbackGeneralFeedback(
  questionResults: Array<{
    questionNumber: number;
    score: number;
    level: string;
  }>,
  activityType: ActivityType = 'pedagogical'
): string {
  const avgScore = Math.round(
    questionResults.reduce((sum, q) => sum + q.score, 0) / questionResults.length
  );

  const excellentCount = questionResults.filter((q) => q.level === 'excellent').length;
  const goodCount = questionResults.filter((q) => q.level === 'good').length;
  const satisfactoryCount = questionResults.filter((q) => q.level === 'satisfactory').length;

  let feedback = `Has obtenido un puntaje promedio de ${avgScore}/100 en esta actividad. `;

  if (activityType === 'clinical') {
    // Feedback para casos clínicos de Bioelectricidad
    if (avgScore >= 85) {
      feedback +=
        'Excelente trabajo. Demuestras dominio de los conceptos de bioelectricidad, aplicación correcta de ecuaciones y capacidad de análisis clínico.';
    } else if (avgScore >= 70) {
      feedback +=
        'Buen desempeño general. Muestras comprensión sólida de los principios físicos y su aplicación clínica.';
    } else if (avgScore >= 50) {
      feedback +=
        'Desempeño satisfactorio. Es importante reforzar el manejo de ecuaciones y profundizar en la interpretación fisiopatológica.';
    } else {
      feedback +=
        'Necesitas reforzar tu comprensión de los conceptos de bioelectricidad y mejorar la precisión en cálculos y análisis clínico.';
    }
  } else {
    // Feedback para casos pedagógicos (original)
    if (avgScore >= 85) {
      feedback +=
        'Excelente trabajo. Demuestras una comprensión profunda de los conceptos pedagógicos y capacidad de análisis crítico.';
    } else if (avgScore >= 70) {
      feedback += 'Buen desempeño general. Tus respuestas muestran comprensión sólida de los temas abordados.';
    } else if (avgScore >= 50) {
      feedback +=
        'Desempeño satisfactorio. Es importante profundizar más en el análisis y la fundamentación teórica.';
    } else {
      feedback +=
        'Necesitas reforzar tu comprensión de los conceptos pedagógicos y mejorar la fundamentación de tus respuestas.';
    }
  }

  return feedback;
}
