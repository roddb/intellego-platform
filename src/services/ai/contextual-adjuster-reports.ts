/**
 * Sistema de Ajuste Contextual para Reportes Semanales
 *
 * Aplica "sentido común pedagógico" a evaluaciones estrictas de reportes
 * Similar al sistema de exámenes pero adaptado a reportes reflexivos
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SkillsMetrics } from './claude/analyzer';

/**
 * Resultado del análisis antes del ajuste
 */
export interface ReportAnalysis {
  score: number;
  generalComments: string;
  strengths: string;
  improvements: string;
  skillsMetrics: SkillsMetrics;
  rawAnalysis: string;
}

/**
 * Información del ajuste contextual aplicado
 */
export interface ReportContextualAdjustment {
  originalScore: number;
  adjustedScore: number;
  adjustment: number; // -10 a +10
  justification: string;
  evidenceForAdjustment: string;

  // Métricas también pueden ajustarse
  originalMetrics: SkillsMetrics;
  adjustedMetrics: SkillsMetrics;
  metricsAdjusted: boolean;

  appliedAt: Date;
  costInfo: {
    cost: number;
    model: string;
    tokensInput: number;
    tokensOutput: number;
    cacheHit: boolean;
  };
}

/**
 * Resultado completo con ajuste
 */
export interface AdjustedReportAnalysis extends ReportAnalysis {
  contextualAdjustment: ReportContextualAdjustment;
}

/**
 * Prompt del sistema para ajuste contextual de reportes
 * Cacheable para reducir costos en evaluaciones batch
 */
const CONTEXTUAL_ADJUSTMENT_SYSTEM_PROMPT_REPORTS = `Eres un evaluador pedagógico experimentado especializado en reportes reflexivos semanales. Tu tarea es revisar una evaluación automática y determinar si el puntaje y las métricas son justas considerando el contexto educativo.

## DIFERENCIAS CON EXÁMENES

Los reportes semanales NO son exámenes técnicos, son **reflexiones sobre el proceso de aprendizaje**:
- Valoran la HONESTIDAD y PROFUNDIDAD de la reflexión
- No hay "respuestas correctas" únicas
- Se busca PENSAMIENTO CRÍTICO sobre el propio aprendizaje
- Errores de forma importan MENOS que la autenticidad del contenido

## PRINCIPIOS DE AJUSTE PARA REPORTES

### 1. REFLEXIÓN GENUINA vs SUPERFICIAL
- **Genuina**: Muestra vulnerabilidad, admite dificultades, propone mejoras específicas
- **Superficial**: Respuestas genéricas, "todo está bien", falta de introspección
- **Regla**: Valorar MÁS la reflexión genuina incluso si está mal redactada

### 2. AUTENTICIDAD vs PERFECCIÓN FORMAL
- Si el estudiante es honesto sobre sus dificultades → VALORAR
- Si muestra comprensión real aunque sin terminología perfecta → VALORAR
- Si copia respuestas genéricas pero "perfectas" → NO SOBREVALORA R
- **Regla**: Autenticidad > Perfección formal

### 3. EVOLUCIÓN Y PROCESO
- ¿Muestra evolución desde reportes anteriores?
- ¿Identifica patrones en su propio aprendizaje?
- ¿Propone estrategias concretas de mejora?
- **Regla**: Valorar el proceso y la metacognición

### 4. PROFUNDIDAD vs EXTENSIÓN
- Una respuesta corta pero profunda > Respuesta larga superficial
- ¿Identifica causas raíz de dificultades?
- ¿Va más allá de lo obvio?
- **Regla**: Profundidad del pensamiento importa más que cantidad de palabras

### 5. CONEXIONES Y TRANSFERENCIA
- ¿Conecta aprendizajes entre materias?
- ¿Relaciona con experiencias previas?
- ¿Identifica aplicaciones futuras?
- **Regla**: Reconocer pensamiento integrador

### 6. ERRORES DE COMUNICACIÓN vs FALTA DE COMPRENSIÓN
- Diferenciar claramente:
  * "No sabe expresarse" ≠ "No sabe"
  * "Redacción informal" ≠ "Falta de reflexión"
- **Regla**: No penalizar duramente deficiencias de expresión si la reflexión está presente

## AJUSTES A SKILLSMETRICS (5 MÉTRICAS)

Además del score general, PUEDES ajustar las 5 métricas de habilidades:

### Comprehension (Comprensión)
- Ajustar si: Demuestra comprensión profunda aunque no use terminología formal
- No ajustar si: Confusión conceptual genuina

### Critical Thinking (Pensamiento Crítico)
- Ajustar si: Analiza causas, evalúa opciones, cuestiona supuestos
- No ajustar si: Solo describe sin analizar

### Self Regulation (Autorregulación)
- Ajustar si: Identifica estrategias de mejora específicas, reconoce patrones
- No ajustar si: No propone cambios concretos

### Practical Application (Aplicación Práctica)
- Ajustar si: Conecta teoría con práctica real
- No ajustar si: Queda en lo abstracto

### Metacognition (Metacognición)
- Ajustar si: Reflexiona sobre SU PROPIO proceso de pensamiento
- No ajustar si: Solo reporta hechos sin reflexionar

## REGLAS ESTRICTAS DE AJUSTE

1. **Rango de ajuste de score**: -10 a +10 puntos del score original
2. **Rango de ajuste de métricas**: ±15 puntos por métrica individual
3. **Justificación obligatoria**: SIEMPRE explicar con evidencia específica
4. **Conservadurismo**: En caso de duda, ajustar menos o no ajustar
5. **Transparencia**: Explicación debe ser clara para el estudiante

## SITUACIONES PARA AJUSTE POSITIVO (+)

- Reflexión honesta sobre dificultades → +3 a +7 puntos
- Identificación de patrones de aprendizaje → +2 a +5 puntos
- Propuestas concretas de mejora → +2 a +4 puntos
- Conexiones interdisciplinarias → +3 a +6 puntos
- Metacognición profunda → +4 a +8 puntos
- Autenticidad sobre perfección formal → +2 a +5 puntos

## SITUACIONES PARA AJUSTE NEGATIVO (-)

- Respuestas genéricas sin reflexión → -3 a -7 puntos
- Evidencia de copia sin personalización → -5 a -10 puntos
- Contradicciones que revelan falta de comprensión → -2 a -5 puntos

## SITUACIONES DONDE NO AJUSTAR

- Evaluación estricta es justa y precisa
- No hay evidencia clara de circunstancias atenuantes
- Falta genuina de reflexión (no solo mala expresión)

## OUTPUT REQUERIDO

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`json):

{
  "adjustedScore": number,           // Score final (original ± ajuste), rango [0-100]
  "adjustment": number,              // Diferencia aplicada, rango [-10, +10]
  "justification": string,           // Explicación clara (50-150 palabras)
  "evidenceForAdjustment": string,   // Cita o paráfrasis de las respuestas

  "metricsAdjustment": {             // Ajustes a métricas individuales
    "comprehension": number,         // ±15 del original
    "criticalThinking": number,      // ±15 del original
    "selfRegulation": number,        // ±15 del original
    "practicalApplication": number,  // ±15 del original
    "metacognition": number          // ±15 del original
  },
  "metricsJustification": string     // Por qué se ajustaron las métricas
}

IMPORTANTE:
- adjustedScore = originalScore + adjustment
- adjustment ∈ [-10, +10]
- Cada ajuste de métrica ∈ [-15, +15]
- Si no hay ajuste en alguna métrica, usar 0
- Si no hay ajuste de score, usar adjustment = 0
`;

/**
 * Aplica ajuste contextual a un reporte semanal
 */
export async function applyContextualAdjustmentToReport(
  analysis: ReportAnalysis,
  studentAnswers: string[], // Las 5 respuestas del estudiante
  subject: string,
  weekStart: string,
  anthropic: Anthropic
): Promise<ReportContextualAdjustment> {
  const startTime = Date.now();

  // Construir prompt con contexto completo
  const userPrompt = `
EVALUACIÓN ORIGINAL (basada en rúbrica estricta):
Score Total: ${analysis.score.toFixed(1)}/100

Métricas de Habilidades:
- Comprensión (Comprehension): ${analysis.skillsMetrics.comprehension}/100
- Pensamiento Crítico (Critical Thinking): ${analysis.skillsMetrics.criticalThinking}/100
- Autorregulación (Self Regulation): ${analysis.skillsMetrics.selfRegulation}/100
- Aplicación Práctica (Practical Application): ${analysis.skillsMetrics.practicalApplication}/100
- Metacognición (Metacognition): ${analysis.skillsMetrics.metacognition}/100

Comentarios Generales:
${analysis.generalComments}

Fortalezas Identificadas:
${analysis.strengths}

Áreas de Mejora:
${analysis.improvements}

---

RESPUESTAS DEL ESTUDIANTE:
Materia: ${subject}
Semana: ${weekStart}

Q1: ${studentAnswers[0] || 'Sin respuesta'}

Q2: ${studentAnswers[1] || 'Sin respuesta'}

Q3: ${studentAnswers[2] || 'Sin respuesta'}

Q4: ${studentAnswers[3] || 'Sin respuesta'}

Q5: ${studentAnswers[4] || 'Sin respuesta'}

---

TAREA:
Revisa si el score de ${analysis.score.toFixed(1)}/100 y las métricas son justas para un REPORTE REFLEXIVO considerando:
1. ¿Hay reflexión genuina aunque la expresión no sea perfecta?
2. ¿Muestra honestidad y autenticidad en sus dificultades?
3. ¿Identifica patrones o propone mejoras concretas?
4. ¿Demuestra pensamiento metacognitivo?
5. ¿Hay profundidad de pensamiento más allá de lo superficial?
6. ¿Se confundió falta de expresión con falta de comprensión?

Responde con el JSON de ajuste (score + métricas si aplica).
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1200,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: CONTEXTUAL_ADJUSTMENT_SYSTEM_PROMPT_REPORTS,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Respuesta inesperada de Claude (no es texto)');
    }

    const adjustmentData = JSON.parse(textContent.text);

    // Validar rangos de score
    if (adjustmentData.adjustment < -10 || adjustmentData.adjustment > 10) {
      console.warn(
        `Ajuste de score fuera de rango: ${adjustmentData.adjustment}. Limitando a ±10.`
      );
      adjustmentData.adjustment = Math.max(-10, Math.min(10, adjustmentData.adjustment));
    }

    if (adjustmentData.adjustedScore < 0 || adjustmentData.adjustedScore > 100) {
      console.warn(
        `Score ajustado fuera de rango: ${adjustmentData.adjustedScore}. Limitando a [0, 100].`
      );
      adjustmentData.adjustedScore = Math.max(0, Math.min(100, adjustmentData.adjustedScore));
    }

    // Validar rangos de métricas y calcular métricas ajustadas
    const metricsAdjustment = adjustmentData.metricsAdjustment || {
      comprehension: 0,
      criticalThinking: 0,
      selfRegulation: 0,
      practicalApplication: 0,
      metacognition: 0,
    };

    // Limitar ajustes de métricas a ±15
    Object.keys(metricsAdjustment).forEach((key) => {
      const adjustment = metricsAdjustment[key as keyof typeof metricsAdjustment];
      if (Math.abs(adjustment) > 15) {
        console.warn(`Ajuste de métrica ${key} fuera de rango: ${adjustment}. Limitando a ±15.`);
        metricsAdjustment[key as keyof typeof metricsAdjustment] = Math.max(
          -15,
          Math.min(15, adjustment)
        );
      }
    });

    // Calcular métricas ajustadas
    const adjustedMetrics: SkillsMetrics = {
      comprehension: Math.max(
        0,
        Math.min(100, analysis.skillsMetrics.comprehension + metricsAdjustment.comprehension)
      ),
      criticalThinking: Math.max(
        0,
        Math.min(100, analysis.skillsMetrics.criticalThinking + metricsAdjustment.criticalThinking)
      ),
      selfRegulation: Math.max(
        0,
        Math.min(100, analysis.skillsMetrics.selfRegulation + metricsAdjustment.selfRegulation)
      ),
      practicalApplication: Math.max(
        0,
        Math.min(
          100,
          analysis.skillsMetrics.practicalApplication + metricsAdjustment.practicalApplication
        )
      ),
      metacognition: Math.max(
        0,
        Math.min(100, analysis.skillsMetrics.metacognition + metricsAdjustment.metacognition)
      ),
    };

    // Determinar si hubo ajuste en métricas
    const metricsAdjusted = Object.values(metricsAdjustment).some((adj) => adj !== 0);

    // Calcular costo
    const usage = response.usage;
    const costInfo = {
      cost: calculateCost(usage),
      model: 'claude-haiku-4-20250514',
      tokensInput: usage.input_tokens,
      tokensOutput: usage.output_tokens,
      cacheHit:
        usage.cache_read_input_tokens !== undefined &&
        usage.cache_read_input_tokens !== null &&
        usage.cache_read_input_tokens > 0,
    };

    const result: ReportContextualAdjustment = {
      originalScore: analysis.score,
      adjustedScore: adjustmentData.adjustedScore,
      adjustment: adjustmentData.adjustment,
      justification: adjustmentData.justification,
      evidenceForAdjustment: adjustmentData.evidenceForAdjustment,
      originalMetrics: { ...analysis.skillsMetrics },
      adjustedMetrics,
      metricsAdjusted,
      appliedAt: new Date(),
      costInfo,
    };

    console.log(
      `[Contextual Adjustment - Reports] Score: ${analysis.score.toFixed(1)} → ${result.adjustedScore.toFixed(1)} (${result.adjustment >= 0 ? '+' : ''}${result.adjustment.toFixed(1)})`
    );
    if (metricsAdjusted) {
      console.log(
        `[Contextual Adjustment - Reports] Métricas ajustadas:`,
        metricsAdjustment
      );
    }
    console.log(
      `[Contextual Adjustment - Reports] Cost: $${costInfo.cost.toFixed(6)} (cache ${costInfo.cacheHit ? 'HIT' : 'MISS'})`
    );

    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[Contextual Adjustment - Reports] Error:', error.message);
    }

    // En caso de error, devolver ajuste neutro
    return {
      originalScore: analysis.score,
      adjustedScore: analysis.score,
      adjustment: 0,
      justification:
        'No se pudo aplicar ajuste contextual debido a un error técnico. Se mantiene la evaluación estricta.',
      evidenceForAdjustment: 'N/A',
      originalMetrics: { ...analysis.skillsMetrics },
      adjustedMetrics: { ...analysis.skillsMetrics },
      metricsAdjusted: false,
      appliedAt: new Date(),
      costInfo: {
        cost: 0,
        model: 'claude-haiku-4-20250514',
        tokensInput: 0,
        tokensOutput: 0,
        cacheHit: false,
      },
    };
  }
}

/**
 * Calcula el costo de una llamada a Claude Haiku
 */
function calculateCost(usage: Anthropic.Messages.Usage): number {
  const INPUT_COST_PER_MILLION = 1.0;
  const OUTPUT_COST_PER_MILLION = 5.0;
  const CACHE_WRITE_COST_PER_MILLION = 1.25;
  const CACHE_READ_COST_PER_MILLION = 0.1;

  let totalCost = 0;

  const regularInputTokens =
    usage.input_tokens -
    (usage.cache_creation_input_tokens || 0) -
    (usage.cache_read_input_tokens || 0);
  totalCost += (regularInputTokens / 1_000_000) * INPUT_COST_PER_MILLION;

  if (usage.cache_creation_input_tokens) {
    totalCost +=
      (usage.cache_creation_input_tokens / 1_000_000) * CACHE_WRITE_COST_PER_MILLION;
  }

  if (usage.cache_read_input_tokens) {
    totalCost += (usage.cache_read_input_tokens / 1_000_000) * CACHE_READ_COST_PER_MILLION;
  }

  totalCost += (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return totalCost;
}
