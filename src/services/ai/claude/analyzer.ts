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
      // Construir prompt para Claude
      const prompt = this._buildAnalysisPrompt(answers, subject, rubric, format);

      // Llamar a Claude API
      const response = await claudeClient.createMessage({
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 1500,
        temperature: 0.1  // Determinístico para evaluación justa
      });

      if (!response.success) {
        throw new Error(`Claude API error: ${response.error?.message}`);
      }

      // Parsear respuesta
      const analysis = this._parseAnalysisResponse(response.content || '');

      // Log para monitoreo
      console.log('✅ Análisis completado', {
        subject,
        score: analysis.score,
        tokensUsed: response.usage,
        latency: response.latency,
        estimatedCost: this._calculateCost(response.usage)
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
   * Calcular costo estimado de la llamada
   */
  private _calculateCost(usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }): number {
    if (!usage) return 0;

    // Precios de Claude Haiku 4.5 (por millón de tokens)
    const INPUT_PRICE = 1.00;   // $1.00 / 1M tokens
    const OUTPUT_PRICE = 5.00;  // $5.00 / 1M tokens

    const inputCost = (usage.input_tokens / 1_000_000) * INPUT_PRICE;
    const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_PRICE;

    return inputCost + outputCost;
  }
}

// Exportar instancia singleton
export default new EducationalAnalyzer();
