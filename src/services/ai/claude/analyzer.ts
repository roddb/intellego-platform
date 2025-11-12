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
import {
  applyContextualAdjustmentToReport,
  type ReportContextualAdjustment
} from '../contextual-adjuster-reports';
import Anthropic from '@anthropic-ai/sdk';

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
  actualCost: number;         // Costo real de la llamada a Claude API (en USD)
  contextualAdjustment?: ReportContextualAdjustment; // Ajuste contextual opcional
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
   * FASE 5: Ajuste Contextual (NUEVO)
   * - Aplica "sentido común pedagógico" a evaluaciones estrictas
   * - Ajusta score y métricas considerando reflexión genuina
   * - Diferencia errores de forma vs falta de comprensión
   *
   * @param answers - Respuestas del estudiante (Q1-Q5)
   * @param subject - Materia (ej: "Física", "Química")
   * @param fase - Fase metodológica del reporte (1-4)
   * @param format - Formato de respuesta ('structured' | 'narrative')
   * @param options - Opciones adicionales (applyContextualAdjustment, weekStart)
   */
  async analyzeAnswers(
    answers: Answer[],
    subject: string,
    fase: 1 | 2 | 3 | 4,
    format: 'structured' | 'narrative' = 'structured',
    options?: {
      applyContextualAdjustment?: boolean;
      weekStart?: string;
    }
  ): Promise<AnalysisResult> {
    try {
      // Obtener rúbrica apropiada (normal o caso especial) - FASE 3
      const rubricaOficial = this._seleccionarRubrica(fase, answers);

      // Construir system prompts cacheables con rúbrica seleccionada
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

      // Calcular costo real de la llamada
      const actualCost = this._calculateCost(response.usage);

      // Log mejorado para monitoreo de cache
      const cacheHit = (response.usage?.cache_read_input_tokens ?? 0) > 0;
      const cacheSavings = this._calculateCacheSavings(response.usage);

      console.log('✅ Análisis completado (con rúbricas)', {
        subject,
        fase,
        score: analysis.score,
        tokensUsed: response.usage,
        latency: response.latency,
        estimatedCost: actualCost,
        cache: {
          hit: cacheHit,
          readTokens: response.usage?.cache_read_input_tokens ?? 0,
          createdTokens: response.usage?.cache_creation_input_tokens ?? 0,
          savings: cacheSavings
        }
      });

      // FASE 5: Aplicar ajuste contextual si está habilitado
      let contextualAdjustment: ReportContextualAdjustment | undefined;
      let finalAnalysis = { ...analysis, actualCost };

      if (options?.applyContextualAdjustment) {
        console.log('🔄 Aplicando ajuste contextual...');

        // Inicializar cliente de Anthropic
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY || '',
        });

        // Extraer solo las respuestas de texto
        const studentAnswers = answers.map(a => a.answer);

        try {
          contextualAdjustment = await applyContextualAdjustmentToReport(
            {
              score: analysis.score,
              generalComments: analysis.generalComments,
              strengths: analysis.strengths,
              improvements: analysis.improvements,
              skillsMetrics: analysis.skillsMetrics,
              rawAnalysis: analysis.rawAnalysis,
            },
            studentAnswers,
            subject,
            options.weekStart || new Date().toISOString().split('T')[0],
            anthropic
          );

          // Actualizar score y métricas con valores ajustados
          finalAnalysis = {
            ...analysis,
            score: contextualAdjustment.adjustedScore,
            skillsMetrics: contextualAdjustment.adjustedMetrics,
            actualCost: actualCost + contextualAdjustment.costInfo.cost,
            contextualAdjustment,
          };

          console.log('✅ Ajuste contextual aplicado:', {
            scoreAdjustment: contextualAdjustment.adjustment,
            metricsAdjusted: contextualAdjustment.metricsAdjusted,
            additionalCost: contextualAdjustment.costInfo.cost,
          });
        } catch (adjustmentError: unknown) {
          if (adjustmentError instanceof Error) {
            console.error('⚠️ Error en ajuste contextual:', adjustmentError.message);
          }
          console.log('ℹ️ Continuando con análisis estricto (sin ajuste)');
        }
      }

      // Retornar análisis (con o sin ajuste)
      return finalAnalysis;

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
    const strengthsMatch = text.match(/FORTALEZAS:([\s\S]*?)(?=ÁREAS DE MEJORA:|PRÓXIMOS PASOS:|MÉTRICAS:|$)/i);
    const strengths = strengthsMatch
      ? strengthsMatch[1].trim()
      : 'No se identificaron fortalezas específicas.';

    // Extraer mejoras
    const improvementsMatch = text.match(/ÁREAS DE MEJORA:([\s\S]*?)(?=PRÓXIMOS PASOS:|MÉTRICAS:|$)/i);
    const improvements = improvementsMatch
      ? improvementsMatch[1].trim()
      : 'No se identificaron áreas de mejora específicas.';

    // Extraer próximos pasos
    const nextStepsMatch = text.match(/PRÓXIMOS PASOS:([\s\S]*?)(?=MÉTRICAS:|$)/i);
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
      rawAnalysis: text,
      actualCost: 0  // Legacy parsing method - no API call made
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

  /**
   * Extraer lista de items tipo bullet y limitar a máximo N items
   *
   * @param text - Texto con bullets (-, •, 1., 2., etc.)
   * @param maxItems - Máximo número de items a retornar (default: 3)
   * @returns String con máximo N items en formato bullet
   */
  private _extractBulletPoints(text: string, maxItems: number = 3): string {
    if (!text || text.trim().length === 0) {
      return '';
    }

    // Dividir por líneas
    const lines = text.split('\n').map(line => line.trim());

    // Identificar líneas que son bullets
    const bulletLines: string[] = [];
    let currentItem = '';

    for (const line of lines) {
      // Detectar si la línea empieza con bullet (-, •, 1., 2., etc.)
      const isBullet = /^[-•\d]+\.?\s/.test(line);

      if (isBullet) {
        // Si ya teníamos un item acumulado, guardarlo
        if (currentItem) {
          bulletLines.push(currentItem.trim());
        }
        // Iniciar nuevo item
        currentItem = line;
      } else if (line.length > 0 && currentItem) {
        // Línea de continuación del item actual
        currentItem += ' ' + line;
      }
    }

    // Agregar último item
    if (currentItem) {
      bulletLines.push(currentItem.trim());
    }

    // Limitar a maxItems
    const limitedItems = bulletLines.slice(0, maxItems);

    // Retornar con saltos de línea
    return limitedItems.join('\n');
  }

  private _parseAnalysisResponseWithRubricas(text: string): AnalysisResult {
    // Extraer niveles asignados a cada pregunta (Q1-Q5)
    const extractNivel = (pregunta: string): number => {
      // Intentar múltiples formatos para ser más robusto:
      // 1. Con markdown bold: **Q1_NIVEL:** 4
      // 2. Sin markdown: Q1_NIVEL: 4
      // 3. Con espacios variables

      const patterns = [
        new RegExp(`\\*\\*${pregunta}_NIVEL:\\*\\*\\s*([1-4])`, 'i'),  // Con bold
        new RegExp(`${pregunta}_NIVEL:\\s*([1-4])`, 'i'),              // Sin bold
        new RegExp(`\\*\\*${pregunta}\\s*NIVEL:\\*\\*\\s*([1-4])`, 'i'), // Con espacio
        new RegExp(`${pregunta}\\s*NIVEL:\\s*([1-4])`, 'i')            // Variante con espacio
      ];

      for (const regex of patterns) {
        const match = text.match(regex);
        if (match) {
          return parseInt(match[1]) as 1 | 2 | 3 | 4;
        }
      }

      // Si no se encuentra ningún patrón, usar Nivel 2 por defecto
      console.warn(`⚠️ No se encontró nivel para ${pregunta}, usando Nivel 2 por defecto`);
      return 2;
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

    // Extraer fortalezas (REGEX MEJORADO - Flexible con o sin ":")
    // Acepta: "FORTALEZAS:" o "FORTALEZAS" con saltos de línea
    const strengthsMatch = text.match(/FORTALEZAS:?[\s\n]*([\s\S]*?)(?=MEJORAS:?|COMENTARIOS_GENERALES:?|ANÁLISIS_AI:?|$)/i);
    let strengths = 'No se identificaron fortalezas específicas.';

    if (strengthsMatch && strengthsMatch[1].trim().length > 0) {
      const rawStrengths = strengthsMatch[1].trim();
      // Limpiar markdown primero
      const cleanedStrengths = this._cleanMarkdown(rawStrengths);
      // Extraer y limitar a 3 items
      strengths = this._extractBulletPoints(cleanedStrengths, 3);

      // Si no se extrajo nada (no había bullets), usar el texto limpio completo
      if (!strengths || strengths.length === 0) {
        strengths = cleanedStrengths;
      }
    }

    // Extraer mejoras (REGEX MEJORADO - Flexible con o sin ":")
    const improvementsMatch = text.match(/MEJORAS:?[\s\n]*([\s\S]*?)(?=COMENTARIOS_GENERALES:?|ANÁLISIS_AI:?|$)/i);
    let improvements = 'No se identificaron áreas de mejora específicas.';

    if (improvementsMatch && improvementsMatch[1].trim().length > 0) {
      const rawImprovements = improvementsMatch[1].trim();
      // Limpiar markdown primero
      const cleanedImprovements = this._cleanMarkdown(rawImprovements);
      // Extraer y limitar a 3 items
      improvements = this._extractBulletPoints(cleanedImprovements, 3);

      // Si no se extrajo nada (no había bullets), usar el texto limpio completo
      if (!improvements || improvements.length === 0) {
        improvements = cleanedImprovements;
      }
    }

    // Extraer comentarios generales (REGEX MEJORADO - Flexible con o sin ":")
    const generalCommentsMatch = text.match(/COMENTARIOS_GENERALES:?[\s\n]*([\s\S]*?)(?=ANÁLISIS_AI:?|$)/i);
    const generalComments = generalCommentsMatch && generalCommentsMatch[1].trim().length > 0
      ? this._cleanMarkdown(generalCommentsMatch[1])
      : 'Continuar con el trabajo actual y buscar retroalimentación adicional.';

    // Log de debugging mejorado
    console.log('📊 Evaluación parseada:', {
      niveles,
      scores,
      scoreFinal,
      skillsMetrics,
      sectionsParsed: {
        strengthsFound: !!strengthsMatch && strengthsMatch[1].trim().length > 0,
        improvementsFound: !!improvementsMatch && improvementsMatch[1].trim().length > 0,
        generalCommentsFound: !!generalCommentsMatch && generalCommentsMatch[1].trim().length > 0,
        strengthsLength: strengths.length,
        improvementsLength: improvements.length,
        generalCommentsLength: generalComments.length
      }
    });

    return {
      score: scoreFinal,
      generalComments,
      strengths,
      improvements,
      skillsMetrics,
      rawAnalysis: this._cleanMarkdown(text),
      actualCost: 0  // Legacy parsing method - no API call made
    };
  }

  /**
   * Detectar si es un caso especial (ausencia, sin clases, etc.)
   * FASE 3: Casos especiales
   *
   * @param answers - Respuestas del estudiante
   * @returns true si es un caso especial, false si es normal
   */
  private _detectarCasoEspecial(answers: Answer[]): boolean {
    // Caso 1: Respuestas muy cortas o vacías (4 de 5 preguntas)
    const respuestasVacias = answers.filter(a =>
      !a.answer || a.answer.trim().length < 10
    ).length;

    if (respuestasVacias >= 4) {
      console.log('🔍 Caso especial detectado: 4+ respuestas vacías');
      return true;
    }

    // Caso 2: Palabras clave de ausencia/sin clases
    const keywordsAusencia = [
      'ausente', 'viaje', 'enfermo', 'enferma', 'no asistí', 'no asisti',
      'sin clases', 'feriado', 'no tuve clase', 'no hubo clase',
      'receso', 'vacaciones', 'emergencia', 'problema personal',
      'no pude venir', 'no pude asistir'
    ];

    const totalText = answers.map(a => a.answer.toLowerCase()).join(' ');
    const contieneKeyword = keywordsAusencia.some(k =>
      totalText.includes(k.toLowerCase())
    );

    if (contieneKeyword) {
      console.log('🔍 Caso especial detectado: keyword encontrada');
      return true;
    }

    // Caso 3: Todas las respuestas son muy similares (copy-paste o "no aplica")
    const respuestasUnicas = new Set(answers.map(a => a.answer.trim().toLowerCase()));
    if (respuestasUnicas.size === 1 && answers.length > 1) {
      const textoUnico = Array.from(respuestasUnicas)[0];
      // Si todas las respuestas son la misma y contienen "no", "nada", "."
      if (textoUnico.length < 20 && (
        textoUnico.includes('no') ||
        textoUnico === '.' ||
        textoUnico === '-'
      )) {
        console.log('🔍 Caso especial detectado: respuestas idénticas muy cortas');
        return true;
      }
    }

    return false;
  }

  /**
   * Seleccionar rúbrica apropiada según el caso
   * FASE 3: Casos especiales
   *
   * @param fase - Fase metodológica (1-4)
   * @param answers - Respuestas del estudiante
   * @returns Rúbrica apropiada (normal o caso especial)
   */
  private _seleccionarRubrica(
    fase: 1 | 2 | 3 | 4,
    answers: Answer[]
  ): string {
    const esCasoEspecial = this._detectarCasoEspecial(answers);

    if (esCasoEspecial) {
      console.log('📋 Usando RUBRICA_CASO_ESPECIAL');
      // Importar dinámicamente la rúbrica de casos especiales
      const { RUBRICA_CASO_ESPECIAL } = require('./prompts/rubricas');
      return RUBRICA_CASO_ESPECIAL;
    }

    // Caso normal: usar rúbrica de la fase correspondiente
    console.log(`📋 Usando rúbrica normal de Fase ${fase}`);
    return getRubricaByFase(fase);
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
  ): Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> {
    const systemMessages: Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> = [];

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
- FORTALEZAS (MÁXIMO 3): Aspectos positivos destacables. Cada uno en 1-2 líneas, con ejemplos específicos de lo que el estudiante escribió.
- MEJORAS (MÁXIMO 3): Áreas de mejora. Cada una con problema identificado + sugerencia práctica (máximo 3 líneas cada una).
- COMENTARIOS_GENERALES: Devolución general del reporte semanal (4-6 líneas). Incluye:
  • Reconocimiento del esfuerzo y lo que hizo bien
  • Observación sobre su desempeño general en la semana
  • Orientación constructiva para la próxima semana
- ANÁLISIS_AI: Recomendaciones técnicas y metodológicas para la siguiente fase (4-6 líneas). Debe ser:
  • Conexión con la próxima fase del pensamiento crítico
  • Sugerencias concretas y accionables
  • Recursos o estrategias específicas para mejorar

REGLAS DE FORMATO ESTRICTAS:
- FORTALEZAS: Usar bullets (- o •). NUNCA más de 3 items.
- MEJORAS: Usar bullets (- o •). NUNCA más de 3 items.
- Párrafos cortos (máximo 4 líneas cada uno)
- Lenguaje directo en 2da persona: "Tu respuesta muestra..." NO "El estudiante demostró..."
- Separar ideas con punto y aparte para facilitar lectura
- Evitar bloques de texto gigantes

IMPORTANTE: Sé justo, objetivo y consistente. La calidad del feedback impacta directamente en el aprendizaje del estudiante.`,
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
- [Fortaleza 1: Aspecto positivo específico con ejemplo de lo que escribió. Máximo 2 líneas.]
- [Fortaleza 2: Segundo aspecto positivo con ejemplo concreto. Máximo 2 líneas.]
- [Fortaleza 3: Tercer aspecto positivo con ejemplo. Máximo 2 líneas.]

IMPORTANTE: MÁXIMO 3 fortalezas. Si identificas más, elige las 3 más relevantes.

MEJORAS:
- [Mejora 1: Problema identificado + sugerencia práctica específica. Máximo 3 líneas.]
- [Mejora 2: Segundo problema + cómo mejorarlo de forma concreta. Máximo 3 líneas.]
- [Mejora 3: Tercer problema + acción clara para resolverlo. Máximo 3 líneas.]

IMPORTANTE: MÁXIMO 3 mejoras. Si identificas más, prioriza las 3 más críticas para el aprendizaje.

COMENTARIOS_GENERALES:
[Devolución general del reporte semanal en 4-6 líneas. Este es el feedback principal que el estudiante leerá.
Párrafo 1: Reconoce el esfuerzo y los logros específicos de esta semana.
Párrafo 2: Observación sobre su desempeño y evolución.
Párrafo 3: Orientación constructiva para la próxima semana.]

ANÁLISIS_AI:
[Recomendaciones técnicas y metodológicas para la siguiente fase en 4-6 líneas.
Párrafo 1: Conexión explícita con la siguiente fase del pensamiento crítico.
Párrafo 2: Sugerencias concretas de qué practicar o estudiar.
Párrafo 3: Estrategias o recursos específicos para mejorar.]
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
