/**
 * Educational Analyzer Service
 *
 * Servicio de análisis educativo usando Claude Haiku 4.5
 * Analiza reportes semanales y genera feedback estructurado
 *
 * INTEGRACIÓN DE RÚBRICAS (Fase 4):
 * - Sistema de evaluación por fases (1-4) con descriptores detallados
 * - Evaluación por pregunta (Q1-Q5) con niveles 1-4
 * - Cálculo automático de score ponderado según algoritmo oficial
 * - Cálculo de 5 métricas de habilidades transversales según fórmulas oficiales
 */

import claudeClient from './client';
import {
  getRubricaByFase,
  calcularScoreFinal,
  calcularSkillsMetrics,
  nivelAPuntaje,
  PONDERACIONES
} from './prompts/rubricas';

// Tipos de datos
export interface Answer {
  id: string;
  questionId: string;
  questionText: string;
  answer: string;
  type: string;
}

/**
 * Métricas de habilidades transversales (Sistema Intellego v1.1)
 * Basadas en algoritmo oficial de RUBRICAS_DE_CORRECCION.md
 */
export interface SkillsMetrics {
  comprehension: number;         // 0-100: Capacidad de entender conceptos, problemas y contextos
  criticalThinking: number;      // 0-100: Análisis sistemático y evaluación
  selfRegulation: number;        // 0-100: Gestión del proceso de aprendizaje
  practicalApplication: number;  // 0-100: Uso efectivo de herramientas
  metacognition: number;         // 0-100: Reflexión sobre el propio pensamiento
}

export interface AnalysisResult {
  score: number;              // Puntaje general 0-100 (calculado con algoritmo oficial)
  generalComments: string;    // Comentarios generales
  strengths: string;          // Fortalezas identificadas
  improvements: string;       // Áreas de mejora
  skillsMetrics: SkillsMetrics; // 5 métricas de habilidades transversales
  rawAnalysis: string;        // Análisis completo de Claude
}

/**
 * Clase principal para análisis educativo
 */
class EducationalAnalyzer {
  /**
   * Analizar un conjunto de respuestas y generar feedback estructurado
   *
   * FASE 4: Integración completa con sistema de rúbricas
   * - Usa rúbrica específica según fase del reporte (1-4)
   * - Prompt Caching para optimizar costos (90% ahorro)
   * - Evaluación por pregunta con niveles 1-4 según descriptores
   * - Cálculo automático de score ponderado y métricas
   *
   * @param answers - Respuestas del estudiante (Q1-Q5)
   * @param subject - Materia (ej: "Física", "Química")
   * @param fase - Fase metodológica del reporte (1-4)
   * @param format - Formato de respuesta ('structured' | 'narrative')
   */
  async analyzeAnswers(
    answers: Answer[],
    subject: string,
    fase: 1 | 2 | 3 | 4,
    format: 'structured' | 'narrative' = 'structured'
  ): Promise<AnalysisResult> {
    try {
      // Obtener rúbrica oficial según la fase
      const rubricaOficial = getRubricaByFase(fase);

      // Construir system prompts cacheables con rúbrica de la fase
      const systemMessages = this._buildCacheableSystemPrompts(subject, fase, rubricaOficial);

      // Construir user message con respuestas (NO se cachea)
      const userMessage = this._buildUserMessage(answers, fase);

      // Llamar a Claude API con Prompt Caching
      // IMPORTANTE: NO usar stop_sequences con rúbricas (interfieren con el formato)
      const response = await claudeClient.createMessage({
        system: systemMessages,  // ← System messages con cache_control
        messages: [{
          role: 'user',
          content: userMessage
        }],
        max_tokens: 2000,  // Aumentado para análisis detallado con rúbricas
        temperature: 0.1,  // Muy determinístico para consistencia en evaluación
        stop_sequences: []  // Sin stop sequences para no interferir con el formato
      });

      if (!response.success) {
        throw new Error(`Claude API error: ${response.error?.message}`);
      }

      // Parsear respuesta según nuevo formato con niveles por pregunta
      const analysis = this._parseAnalysisResponseWithRubricas(response.content || '');

      // Log mejorado para monitoreo de cache
      const cacheHit = (response.usage?.cache_read_input_tokens ?? 0) > 0;
      const cacheSavings = this._calculateCacheSavings(response.usage);

      console.log('✅ Análisis completado (con rúbricas)', {
        subject,
        fase,
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
   * Parsear métricas de habilidades (LEGACY - mantener para compatibilidad)
   */
  private _parseSkillsMetrics(text: string): SkillsMetrics {
    const extractMetric = (name: string): number => {
      const regex = new RegExp(`${name}:\\s*(\\d+)`, 'i');
      const match = text.match(regex);
      return match ? Math.min(100, Math.max(0, parseInt(match[1]))) : 50;
    };

    // Mapear métricas antiguas a nuevas para compatibilidad
    return {
      comprehension: extractMetric('Completeness'),
      criticalThinking: extractMetric('Clarity'),
      selfRegulation: extractMetric('Reflection'),
      practicalApplication: extractMetric('Progress'),
      metacognition: extractMetric('Engagement')
    };
  }

  /**
   * Parsear respuesta de análisis CON RÚBRICAS (FASE 4)
   *
   * Extrae niveles asignados a cada pregunta (Q1-Q5) y calcula:
   * - Score ponderado final usando algoritmo oficial
   * - 5 métricas de habilidades usando fórmulas oficiales
   */
  /**
   * Limpiar markdown para hacer el texto más legible para estudiantes
   * Quita símbolos de formato pero mantiene estructura de párrafos
   */
  private _cleanMarkdown(text: string): string {
    return text
      .replace(/\*\*/g, '')           // Quita **negritas**
      .replace(/###?\s*/g, '')        // Quita # y ## encabezados
      .replace(/---+/g, '')           // Quita ---
      .replace(/^\s*[-•]\s*/gm, '• ') // Convierte bullets markdown a • simple
      .replace(/\n{3,}/g, '\n\n')     // Max 2 saltos de línea (preserva párrafos)
      .trim();
  }

  private _parseAnalysisResponseWithRubricas(text: string): AnalysisResult {
    // Extraer niveles asignados a cada pregunta (Q1-Q5)
    const extractNivel = (pregunta: string): number => {
      // Formato esperado de Claude con Markdown bold: **Q1_NIVEL:** 4
      const regex = new RegExp(`\\*\\*${pregunta}_NIVEL:\\*\\*\\s*([1-4])`, 'i');
      const match = text.match(regex);

      if (!match) {
        console.warn(`⚠️ No se encontró nivel para ${pregunta}, usando Nivel 2 por defecto`);
        return 2; // Nivel 2 por defecto si no se encuentra
      }

      return parseInt(match[1]) as 1 | 2 | 3 | 4;
    };

    const niveles = {
      q1: extractNivel('Q1'),
      q2: extractNivel('Q2'),
      q3: extractNivel('Q3'),
      q4: extractNivel('Q4'),
      q5: extractNivel('Q5')
    };

    // Convertir niveles (1-4) a puntajes (27, 62, 77, 92.5)
    const scores = {
      q1: nivelAPuntaje(niveles.q1 as 1 | 2 | 3 | 4),
      q2: nivelAPuntaje(niveles.q2 as 1 | 2 | 3 | 4),
      q3: nivelAPuntaje(niveles.q3 as 1 | 2 | 3 | 4),
      q4: nivelAPuntaje(niveles.q4 as 1 | 2 | 3 | 4),
      q5: nivelAPuntaje(niveles.q5 as 1 | 2 | 3 | 4)
    };

    // Calcular score final ponderado usando algoritmo oficial
    const scoreFinal = calcularScoreFinal(scores);

    // Calcular 5 métricas de habilidades usando fórmulas oficiales
    const skillsMetrics = calcularSkillsMetrics(scores);

    // Extraer fortalezas
    const strengthsMatch = text.match(/FORTALEZAS:(.*?)(?=MEJORAS:|COMENTARIOS_GENERALES:|$)/is);
    const strengths = strengthsMatch
      ? this._cleanMarkdown(strengthsMatch[1])
      : 'No se identificaron fortalezas específicas.';

    // Extraer mejoras
    const improvementsMatch = text.match(/MEJORAS:(.*?)(?=COMENTARIOS_GENERALES:|ANÁLISIS_AI:|$)/is);
    const improvements = improvementsMatch
      ? this._cleanMarkdown(improvementsMatch[1])
      : 'No se identificaron áreas de mejora específicas.';

    // Extraer comentarios generales
    const generalCommentsMatch = text.match(/COMENTARIOS_GENERALES:(.*?)(?=ANÁLISIS_AI:|$)/is);
    const generalComments = generalCommentsMatch
      ? this._cleanMarkdown(generalCommentsMatch[1])
      : 'Continuar con el trabajo actual y buscar retroalimentación adicional.';

    // Log de debugging
    console.log('📊 Evaluación parseada:', {
      niveles,
      scores,
      scoreFinal,
      skillsMetrics
    });

    return {
      score: scoreFinal,
      generalComments,
      strengths,
      improvements,
      skillsMetrics,
      rawAnalysis: this._cleanMarkdown(text)
    };
  }

  /**
   * Construir system prompts cacheables (FASE 4 - Integración de Rúbricas)
   *
   * System messages se cachean automáticamente por 5 minutos
   * Ahorro: 90% en tokens repetidos (de $1/MTok a $0.10/MTok)
   *
   * Las rúbricas largas (>2048 tokens) se cachearán automáticamente
   */
  private _buildCacheableSystemPrompts(
    subject: string,
    fase: 1 | 2 | 3 | 4,
    rubricaOficial: string
  ): Array<{ type: string; text: string; cache_control?: { type: string } }> {
    const systemMessages: Array<{ type: string; text: string; cache_control?: { type: string } }> = [];

    // Instrucciones generales del rol (se cachean)
    systemMessages.push({
      type: 'text',
      text: `Eres un profesor experimentado de ${subject} en el Colegio Santo Tomás de Aquino, usando la plataforma Intellego.

Tu objetivo es evaluar reportes semanales de pensamiento crítico según el sistema de rúbricas oficial.

IMPORTANTE: Debes evaluar CADA UNA de las 5 preguntas (Q1-Q5) asignando un NIVEL (1, 2, 3 o 4) según los descriptores de la rúbrica.

Sistema de Niveles:
- Nivel 4 (85-100 puntos) → 92.5 puntos: Excelente - Supera expectativas
- Nivel 3 (70-84 puntos) → 77 puntos: Bueno - Cumple expectativas
- Nivel 2 (55-69 puntos) → 62 puntos: En desarrollo - Requiere refuerzo
- Nivel 1 (0-54 puntos) → 27 puntos: Inicial - Necesita apoyo significativo

ESTILO DE REDACCIÓN (MUY IMPORTANTE):
- Tono: Formal pero amigable, como hablarías con un estudiante de 16 años
- Lenguaje: Claro, concreto, fácil de entender - evita jerga técnica excesiva
- Estructura: Párrafos cortos (máximo 3-4 líneas), separados por punto y aparte
- Objetivo: Que el estudiante entienda claramente QUÉ hizo bien, QUÉ debe mejorar y CÓMO hacerlo
- Longitud: Conciso pero completo - cada justificación debe ser de 2-3 líneas máximo`,
      cache_control: { type: 'ephemeral' }
    });

    // Rúbrica oficial de la fase (se cachea - >2048 tokens)
    systemMessages.push({
      type: 'text',
      text: `${rubricaOficial}

INSTRUCCIONES DE EVALUACIÓN:

Para cada pregunta (Q1-Q5):
1. Lee la respuesta del estudiante
2. Compara con los descriptores de la rúbrica
3. Asigna el nivel (1-4) que mejor describe la respuesta
4. Justifica en 2-3 líneas máximo, con ejemplos concretos de lo que escribió el estudiante

Además proporciona:
- FORTALEZAS: 2-3 puntos concretos. Cada uno en 1-2 líneas, con ejemplos específicos.
- MEJORAS: 2-3 áreas de mejora. Cada una con problema identificado + sugerencia práctica (1-2 líneas cada una).
- COMENTARIOS GENERALES: Síntesis en 3-4 líneas. Reconoce lo positivo y orienta hacia la mejora.
- ANÁLISIS AI: Recomendaciones para la siguiente fase en 4-5 líneas. Concreto y accionable.

REGLAS DE FORMATO:
- Usa párrafos cortos (máximo 4 líneas)
- Separa ideas con punto y aparte
- Lenguaje directo: "Tu respuesta muestra..." en vez de "El estudiante demostró..."
- Evita bloques de texto gigantes - debe ser fácil de leer

IMPORTANTE: Sé justo, objetivo y consistente.`,
      cache_control: { type: 'ephemeral' }  // ← Cachear la rúbrica (ahorro 90%)
    });

    return systemMessages;
  }

  /**
   * Construir user message con respuestas del estudiante
   *
   * Este contenido NO se cachea porque cambia en cada análisis
   * Formato actualizado para evaluación con rúbricas (niveles 1-4 por pregunta)
   */
  private _buildUserMessage(answers: Answer[], fase: number): string {
    // Validar que tengamos exactamente 5 respuestas (Q1-Q5)
    if (answers.length !== 5) {
      console.warn(`⚠️ Se esperaban 5 respuestas, se recibieron ${answers.length}`);
    }

    const answersFormatted = answers
      .map((a, idx) => `
=== PREGUNTA ${idx + 1} ===
${a.questionText}

RESPUESTA DEL ESTUDIANTE:
${a.answer}
`)
      .join('\n');

    return `<reporte_semanal>
FASE: ${fase}
MATERIA: Ciencias (Física/Química)

${answersFormatted}
</reporte_semanal>

<formato_salida_requerido>
EVALUACIÓN POR PREGUNTA:
Q1_NIVEL: [1, 2, 3 o 4]
Q1_JUSTIFICACIÓN: [Explicación en 2-3 líneas con ejemplo concreto de lo que escribió]

Q2_NIVEL: [1, 2, 3 o 4]
Q2_JUSTIFICACIÓN: [Explicación en 2-3 líneas con ejemplo concreto]

Q3_NIVEL: [1, 2, 3 o 4]
Q3_JUSTIFICACIÓN: [Explicación en 2-3 líneas con ejemplo concreto]

Q4_NIVEL: [1, 2, 3 o 4]
Q4_JUSTIFICACIÓN: [Explicación en 2-3 líneas con ejemplo concreto]

Q5_NIVEL: [1, 2, 3 o 4]
Q5_JUSTIFICACIÓN: [Explicación en 2-3 líneas con ejemplo concreto]

FORTALEZAS:
[Párrafo corto 1: Fortaleza específica con ejemplo. Máximo 2 líneas.]

[Párrafo corto 2: Segunda fortaleza con ejemplo. Máximo 2 líneas.]

MEJORAS:
[Párrafo 1: Problema identificado + sugerencia práctica. Máximo 3 líneas.]

[Párrafo 2: Segundo problema + sugerencia práctica. Máximo 3 líneas.]

COMENTARIOS_GENERALES:
[Párrafo 1: Reconocimiento de aspectos positivos. 2-3 líneas.]

[Párrafo 2: Orientación hacia la mejora y próximos pasos. 2-3 líneas.]

ANÁLISIS_AI:
[Párrafo 1: Recomendaciones para la siguiente fase. 2-3 líneas.]

[Párrafo 2: Sugerencias concretas y accionables. 2-3 líneas.]
</formato_salida_requerido>`;
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
