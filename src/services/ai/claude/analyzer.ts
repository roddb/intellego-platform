/**
 * Educational Analyzer Service
 *
 * Servicio de análisis educativo usando Claude Haiku 4.5
 * Analiza reportes semanales y genera feedback estructurado
 */

import claudeClient from './client';

// Tipos de datos
export interface Answer {
  id: string;
  questionId: string;
  questionText: string;
  answer: string;
  type: string;
}

export interface SkillsMetrics {
  completeness: number;      // 0-100: Qué tan completas son las respuestas
  clarity: number;            // 0-100: Claridad en la comunicación
  reflection: number;         // 0-100: Profundidad de reflexión
  progress: number;           // 0-100: Evidencia de progreso
  engagement: number;         // 0-100: Nivel de compromiso
}

export interface AnalysisResult {
  score: number;              // Puntaje general 0-100
  generalComments: string;    // Comentarios generales
  strengths: string;          // Fortalezas identificadas
  improvements: string;       // Áreas de mejora
  skillsMetrics: SkillsMetrics;
  rawAnalysis: string;        // Análisis completo de Claude
}

/**
 * Clase principal para análisis educativo
 */
class EducationalAnalyzer {
  /**
   * Analizar un conjunto de respuestas y generar feedback estructurado
   *
   * FASE 3: Ahora usa Prompt Caching para optimizar costos
   * - System prompts se cachean (90% ahorro en tokens)
   * - Rúbricas se cachean (reutilizables entre análisis)
   *
   * @param answers - Respuestas del estudiante
   * @param subject - Materia (ej: "Matemáticas", "Ciencias")
   * @param rubric - Rúbrica opcional para evaluación específica
   * @param format - Formato de respuesta ('structured' | 'narrative')
   */
  async analyzeAnswers(
    answers: Answer[],
    subject: string,
    rubric?: string,
    format: 'structured' | 'narrative' = 'structured'
  ): Promise<AnalysisResult> {
    try {
      // Construir system prompts cacheables
      const systemMessages = this._buildCacheableSystemPrompts(subject, rubric);

      // Construir user message con respuestas (NO se cachea)
      const userMessage = this._buildUserMessage(answers);

      // Llamar a Claude API con Prompt Caching
      const response = await claudeClient.createMessage({
        system: systemMessages,  // ← System messages con cache_control
        messages: [{
          role: 'user',
          content: userMessage
        }],
        max_tokens: 1500,
        temperature: 0.1
      });

      if (!response.success) {
        throw new Error(`Claude API error: ${response.error?.message}`);
      }

      // Parsear respuesta
      const analysis = this._parseAnalysisResponse(response.content || '');

      // Log mejorado para monitoreo de cache
      const cacheHit = (response.usage?.cache_read_input_tokens ?? 0) > 0;
      const cacheSavings = this._calculateCacheSavings(response.usage);

      console.log('✅ Análisis completado', {
        subject,
        score: analysis.score,
        tokensUsed: response.usage,
        latency: response.latency,
        estimatedCost: this._calculateCost(response.usage),
        cache: {
          hit: cacheHit,
          readTokens: response.usage?.cache_read_input_tokens ?? 0,
          createdTokens: response.usage?.cache_creation_input_tokens ?? 0,
          savings: cacheSavings
        }
      });

      return analysis;

    } catch (error: any) {
      console.error('❌ Error en análisis educativo:', error.message);
      throw error;
    }
  }

  /**
   * Evaluar habilidades académicas específicas
   *
   * @param answers - Respuestas del estudiante
   * @param rubric - Criterios de evaluación
   */
  async evaluateSkills(
    answers: Answer[],
    rubric: string
  ): Promise<SkillsMetrics> {
    try {
      const prompt = this._buildSkillsEvaluationPrompt(answers, rubric);

      const response = await claudeClient.createMessage({
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 500,
        temperature: 0.1
      });

      if (!response.success) {
        throw new Error(`Claude API error: ${response.error?.message}`);
      }

      return this._parseSkillsMetrics(response.content || '');

    } catch (error: any) {
      console.error('❌ Error en evaluación de habilidades:', error.message);
      throw error;
    }
  }

  /**
   * Construir prompt para análisis completo
   */
  private _buildAnalysisPrompt(
    answers: Answer[],
    subject: string,
    rubric?: string,
    format: 'structured' | 'narrative' = 'structured'
  ): string {
    const answersFormatted = answers
      .map((a, idx) => `Pregunta ${idx + 1}: ${a.questionText}\nRespuesta: ${a.answer}`)
      .join('\n\n');

    const rubricSection = rubric
      ? `<rubrica>\n${rubric}\n</rubrica>\n\n`
      : '';

    return `<instrucciones>
Eres un profesor experimentado de ${subject}. Analiza las respuestas del estudiante y proporciona:

1. PUNTAJE GENERAL (0-100): Evaluación numérica objetiva
2. FORTALEZAS (2-3 puntos): Aspectos positivos con ejemplos específicos
3. ÁREAS DE MEJORA (2-3 puntos): Aspectos a trabajar con sugerencias accionables
4. PRÓXIMOS PASOS (1-2 recomendaciones): Acciones concretas para mejorar

Criterios de evaluación:
- Completeness: Qué tan completas son las respuestas (0-100)
- Clarity: Claridad en la comunicación (0-100)
- Reflection: Profundidad de reflexión (0-100)
- Progress: Evidencia de progreso y aprendizaje (0-100)
- Engagement: Nivel de compromiso con el material (0-100)

Tono: constructivo, alentador pero honesto.
Límite: 250 palabras totales.
</instrucciones>

${rubricSection}<respuestas_estudiante>
${answersFormatted}
</respuestas_estudiante>

<formato_salida>
PUNTAJE: [número 0-100]

FORTALEZAS:
- [Fortaleza 1 con ejemplo específico de las respuestas]
- [Fortaleza 2 con ejemplo específico de las respuestas]

ÁREAS DE MEJORA:
- [Mejora 1: problema identificado + sugerencia específica]
- [Mejora 2: problema identificado + sugerencia específica]

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
   * Construir prompt para evaluación de habilidades
   */
  private _buildSkillsEvaluationPrompt(
    answers: Answer[],
    rubric: string
  ): string {
    const answersFormatted = answers
      .map((a) => `- ${a.questionText}: ${a.answer}`)
      .join('\n');

    return `<instrucciones>
Evalúa las siguientes 5 habilidades académicas en escala 0-100 basándote en las respuestas del estudiante:

1. Completeness: Qué tan completas y detalladas son las respuestas
2. Clarity: Claridad en la expresión de ideas
3. Reflection: Nivel de pensamiento crítico y reflexión
4. Progress: Evidencia de aprendizaje y crecimiento
5. Engagement: Nivel de interés y compromiso demostrado

Criterios de evaluación:
${rubric}
</instrucciones>

<respuestas>
${answersFormatted}
</respuestas>

<formato_salida>
Completeness: [número 0-100]
Clarity: [número 0-100]
Reflection: [número 0-100]
Progress: [número 0-100]
Engagement: [número 0-100]
</formato_salida>`;
  }

  /**
   * Parsear respuesta de análisis completo
   */
  private _parseAnalysisResponse(text: string): AnalysisResult {
    // Extraer puntaje
    const scoreMatch = text.match(/PUNTAJE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    // Extraer fortalezas
    const strengthsMatch = text.match(/FORTALEZAS:(.*?)(?=ÁREAS DE MEJORA:|PRÓXIMOS PASOS:|MÉTRICAS:|$)/is);
    const strengths = strengthsMatch
      ? strengthsMatch[1].trim()
      : 'No se identificaron fortalezas específicas.';

    // Extraer mejoras
    const improvementsMatch = text.match(/ÁREAS DE MEJORA:(.*?)(?=PRÓXIMOS PASOS:|MÉTRICAS:|$)/is);
    const improvements = improvementsMatch
      ? improvementsMatch[1].trim()
      : 'No se identificaron áreas de mejora específicas.';

    // Extraer próximos pasos
    const nextStepsMatch = text.match(/PRÓXIMOS PASOS:(.*?)(?=MÉTRICAS:|$)/is);
    const nextSteps = nextStepsMatch ? nextStepsMatch[1].trim() : '';

    // Combinar comentarios generales
    const generalComments = nextSteps
      ? `${nextSteps}`
      : 'Continuar con el trabajo actual y buscar retroalimentación adicional.';

    // Extraer métricas
    const skillsMetrics = this._parseSkillsMetrics(text);

    return {
      score,
      generalComments,
      strengths,
      improvements,
      skillsMetrics,
      rawAnalysis: text
    };
  }

  /**
   * Parsear métricas de habilidades
   */
  private _parseSkillsMetrics(text: string): SkillsMetrics {
    const extractMetric = (name: string): number => {
      const regex = new RegExp(`${name}:\\s*(\\d+)`, 'i');
      const match = text.match(regex);
      return match ? Math.min(100, Math.max(0, parseInt(match[1]))) : 50;
    };

    return {
      completeness: extractMetric('Completeness'),
      clarity: extractMetric('Clarity'),
      reflection: extractMetric('Reflection'),
      progress: extractMetric('Progress'),
      engagement: extractMetric('Engagement')
    };
  }

  /**
   * Construir system prompts cacheables (FASE 3)
   *
   * System messages se cachean automáticamente por 5 minutos
   * Ahorro: 90% en tokens repetidos (de $1/MTok a $0.10/MTok)
   */
  private _buildCacheableSystemPrompts(
    subject: string,
    rubric?: string
  ): Array<{ type: string; text: string; cache_control?: { type: string } }> {
    const systemMessages: Array<{ type: string; text: string; cache_control?: { type: string } }> = [];

    // Instrucciones generales (se cachean)
    systemMessages.push({
      type: 'text',
      text: `Eres un profesor experimentado de ${subject} en Intellego Platform.

Tu objetivo es proporcionar feedback constructivo y personalizado que ayude al estudiante a mejorar.

Debes analizar las respuestas del estudiante y proporcionar:
1. PUNTAJE GENERAL (0-100): Evaluación numérica objetiva
2. FORTALEZAS (2-3 puntos): Aspectos positivos con ejemplos específicos
3. ÁREAS DE MEJORA (2-3 puntos): Aspectos a trabajar con sugerencias accionables
4. PRÓXIMOS PASOS (1-2 recomendaciones): Acciones concretas para mejorar

Criterios de evaluación:
- Completeness: Qué tan completas son las respuestas (0-100)
- Clarity: Claridad en la comunicación (0-100)
- Reflection: Profundidad de reflexión (0-100)
- Progress: Evidencia de progreso y aprendizaje (0-100)
- Engagement: Nivel de compromiso con el material (0-100)

Tono: constructivo, alentador pero honesto.
Límite: 250 palabras totales.`,
      cache_control: { type: 'ephemeral' }  // ← Cachear este bloque
    });

    // Rúbrica específica (si existe, se cachea)
    if (rubric) {
      systemMessages.push({
        type: 'text',
        text: `<rubrica>
${rubric}
</rubrica>

Utiliza EXCLUSIVAMENTE esta rúbrica para evaluar las respuestas del estudiante.
Tu evaluación debe ser objetiva, consistente con la rúbrica, y justificada con ejemplos.`,
        cache_control: { type: 'ephemeral' }  // ← Cachear la rúbrica
      });
    }

    return systemMessages;
  }

  /**
   * Construir user message con respuestas del estudiante
   *
   * Este contenido NO se cachea porque cambia en cada análisis
   */
  private _buildUserMessage(answers: Answer[]): string {
    const answersFormatted = answers
      .map((a, idx) => `Pregunta ${idx + 1}: ${a.questionText}\nRespuesta: ${a.answer}`)
      .join('\n\n');

    return `<respuestas_estudiante>
${answersFormatted}
</respuestas_estudiante>

<formato_salida>
PUNTAJE: [número 0-100]

FORTALEZAS:
- [Fortaleza 1 con ejemplo específico de las respuestas]
- [Fortaleza 2 con ejemplo específico de las respuestas]

ÁREAS DE MEJORA:
- [Mejora 1: problema identificado + sugerencia específica]
- [Mejora 2: problema identificado + sugerencia específica]

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
   * Calcular ahorro por uso de caché
   */
  private _calculateCacheSavings(usage?: {
    input_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  }): string {
    if (!usage) return '$0.00';

    const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;

    if (cacheReadTokens === 0) {
      return '$0.00 (sin cache hit)';
    }

    // Precio normal: $1/MTok
    // Precio cache read: $0.10/MTok
    // Ahorro: $0.90/MTok
    const CACHE_SAVINGS_PER_MTOK = 0.90;
    const savings = (cacheReadTokens / 1_000_000) * CACHE_SAVINGS_PER_MTOK;

    return `$${savings.toFixed(6)} (${cacheReadTokens} tokens desde caché)`;
  }

  /**
   * Calcular costo estimado de la llamada (actualizado para Fase 3)
   */
  private _calculateCost(usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }): number {
    if (!usage) return 0;

    // Precios de Claude Haiku 4.5 (por millón de tokens)
    const INPUT_PRICE = 1.00;              // $1.00 / 1M tokens
    const OUTPUT_PRICE = 5.00;             // $5.00 / 1M tokens
    const CACHE_WRITE_PRICE = 1.25;        // $1.25 / 1M tokens (cache creation)
    const CACHE_READ_PRICE = 0.10;         // $0.10 / 1M tokens (cache hit)

    // Tokens normales
    const inputCost = (usage.input_tokens / 1_000_000) * INPUT_PRICE;
    const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_PRICE;

    // Tokens de caché
    const cacheWriteCost = ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * CACHE_WRITE_PRICE;
    const cacheReadCost = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * CACHE_READ_PRICE;

    return inputCost + outputCost + cacheWriteCost + cacheReadCost;
  }
}

// Exportar instancia singleton
export default new EducationalAnalyzer();
