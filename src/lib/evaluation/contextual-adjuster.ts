// Sistema de Ajuste Contextual para Evaluaciones
// Aplica "sentido común pedagógico" a evaluaciones estrictas

import Anthropic from '@anthropic-ai/sdk';
import {
  PhaseScores,
  ExerciseAnalysis,
  ContextualAdjustment,
  APICostInfo,
} from './types';

/**
 * Prompt del sistema para ajuste contextual
 * Este prompt se cachea para reducir costos en evaluaciones batch
 */
const CONTEXTUAL_ADJUSTMENT_SYSTEM_PROMPT = `Eres un evaluador pedagógico experimentado con años de experiencia en educación secundaria y universitaria. Tu tarea es revisar una evaluación automática basada en rúbricas y determinar si el puntaje es justo considerando el contexto educativo real.

## PRINCIPIOS DE AJUSTE

### 1. ERRORES MENORES vs FUNDAMENTALES
- **Error menor**: Notación no estándar pero matemáticamente correcta, typos, orden diferente de pasos
- **Error fundamental**: Concepto mal entendido, fórmula incorrecta, razonamiento erróneo
- **Regla**: Penalizar SOLO errores fundamentales. Los errores menores no deben bajar el puntaje significativamente.

### 2. MÉTODOS ALTERNATIVOS VÁLIDOS
- Si el estudiante resuelve el problema de forma creativa pero correcta, NO penalizar
- Valorar el razonamiento independiente y la originalidad
- Ejemplos válidos:
  * Usar trigonometría inversa en vez de componentes cartesianas
  * Resolver ecuaciones por despeje en vez de sustitución
  * Aplicar conservación de energía en vez de cinemática
- **Regla**: Si el método es matemática/físicamente correcto, dar crédito completo

### 3. COMPRENSIÓN DEMOSTRADA SIN FORMALISMO PERFECTO
- Si el estudiante explica correctamente el concepto en palabras pero falta rigor matemático, dar crédito parcial
- Si muestra comprensión del "por qué" aunque el "cómo" tenga errores menores, reconocerlo
- **Regla**: El proceso y comprensión importan tanto como el resultado final

### 4. NIVEL APROPIADO DE EXIGENCIA
- Recordar que son estudiantes en formación, no profesionales
- No exigir perfección en detalles secundarios (decimales, notación científica exacta)
- Considerar el nivel del curso (secundaria vs universitario)
- **Regla**: Aplicar estándares realistas para el nivel educativo

### 5. COMUNICACIÓN vs CONOCIMIENTO
- Diferenciar claramente entre:
  * "No sabe" (concepto no comprendido)
  * "No se expresó claramente" (sabe pero comunicó mal)
- Si hay evidencia de que el conocimiento está presente, dar beneficio de la duda
- **Regla**: No penalizar duramente por deficiencias en expresión escrita si el conocimiento es evidente

### 6. RESPUESTAS PARCIALES CON RAZONAMIENTO CORRECTO
- Si el estudiante inició correctamente pero no completó, dar crédito parcial generoso
- Si todos los pasos mostrados son correctos, reconocer el trabajo realizado
- **Regla**: Crédito parcial por trabajo correcto, incluso si incompleto

## REGLAS ESTRICTAS DE AJUSTE

1. **Rango de ajuste**: El ajuste DEBE estar entre -10 y +10 puntos del score original
2. **Justificación obligatoria**: SIEMPRE explicar el ajuste con evidencia específica de la respuesta
3. **Consistencia**: No ajustar por lástima o simpatía, solo por evidencia objetiva
4. **Conservadurismo**: En caso de duda, hacer un ajuste menor o ninguno
5. **Transparencia**: La justificación debe ser clara para que el estudiante la entienda

## SITUACIONES COMUNES PARA AJUSTE POSITIVO (+)

- Método correcto pero error aritmético menor → +2 a +4 puntos
- Notación no estándar pero correcta → +1 a +3 puntos
- Respuesta parcial con pasos correctos → +2 a +5 puntos
- Explicación verbal correcta sin formalismo → +3 a +6 puntos
- Método alternativo válido no reconocido → +3 a +8 puntos
- Comprensión conceptual demostrada pese a errores menores → +4 a +7 puntos

## SITUACIONES COMUNES PARA AJUSTE NEGATIVO (-)

- Sobrevaloración por respuesta que parece correcta pero tiene error conceptual → -2 a -5 puntos
- Falta de verificación cuando el resultado es claramente absurdo → -1 a -3 puntos
- Plagio o copia evidente no detectada → -5 a -10 puntos

## SITUACIONES DONDE NO AJUSTAR

- Evaluación estricta es justa y precisa
- No hay evidencia clara de circunstancias atenuantes
- El error es genuinamente fundamental y grave
- El estudiante no demostró comprensión suficiente

## OUTPUT REQUERIDO

Debes responder ÚNICAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`json):

{
  "adjustedScore": number,           // Score final (original ± ajuste), DEBE estar entre 0-100
  "adjustment": number,              // Diferencia aplicada, DEBE estar entre -10 y +10
  "justification": string,           // Explicación clara y concisa (50-150 palabras)
  "evidenceForAdjustment": string    // Cita específica o paráfrasis de la respuesta del estudiante
}

IMPORTANTE:
- adjustedScore = originalScore + adjustment
- adjustment DEBE estar en el rango [-10, +10]
- Si adjustment = 0, significa que el score original es justo
- La justificación debe ser pedagógica y constructiva, no punitiva`;

/**
 * Convierte PhaseScores a texto legible para Claude
 */
function formatPhaseScoresForPrompt(scores: PhaseScores): string {
  const phases = [
    {
      name: 'F1: Comprensión del Problema',
      nivel: scores.F1.nivel,
      puntaje: scores.F1.puntaje,
    },
    {
      name: 'F2: Identificación de Variables',
      nivel: scores.F2.nivel,
      puntaje: scores.F2.puntaje,
    },
    {
      name: 'F3: Selección de Herramientas',
      nivel: scores.F3.nivel,
      puntaje: scores.F3.puntaje,
    },
    {
      name: 'F4: Ejecución y Cálculos',
      nivel: scores.F4.nivel,
      puntaje: scores.F4.puntaje,
    },
    {
      name: 'F5: Verificación y Análisis',
      nivel: scores.F5.nivel,
      puntaje: scores.F5.puntaje,
    },
  ];

  return phases
    .map(
      (p) =>
        `${p.name}: Nivel ${p.nivel}/4 (${p.puntaje.toFixed(1)} puntos)`
    )
    .join('\n');
}

/**
 * Convierte ExerciseAnalysis a texto legible para Claude
 */
function formatExerciseAnalysisForPrompt(
  analyses: ExerciseAnalysis[]
): string {
  return analyses
    .map((ex) => {
      const phaseComments = [
        `F1: ${ex.phaseEvaluations.F1.comment}`,
        `F2: ${ex.phaseEvaluations.F2.comment}`,
        `F3: ${ex.phaseEvaluations.F3.comment}`,
        `F4: ${ex.phaseEvaluations.F4.comment}`,
        `F5: ${ex.phaseEvaluations.F5.comment}`,
      ].join('\n  ');

      return `
Ejercicio ${ex.exerciseNumber}:

Fortalezas detectadas:
${ex.strengths.map((s) => `- ${s}`).join('\n')}

Debilidades detectadas:
${ex.weaknesses.map((w) => `- ${w}`).join('\n')}

Comentarios por fase:
  ${phaseComments}

Feedback específico:
${ex.specificFeedback}
`;
    })
    .join('\n---\n');
}

/**
 * Aplica ajuste contextual a una evaluación de examen
 *
 * @param originalScore - Score calculado por la rúbrica estricta (0-100)
 * @param phaseScores - Scores detallados por fase
 * @param exerciseAnalysis - Análisis detallado de cada ejercicio
 * @param rawExamContent - Contenido original del examen (respuestas del estudiante)
 * @param anthropic - Cliente de Anthropic
 * @returns Ajuste contextual con score ajustado y justificación
 */
export async function applyContextualAdjustment(
  originalScore: number,
  phaseScores: PhaseScores,
  exerciseAnalysis: ExerciseAnalysis[],
  rawExamContent: string,
  anthropic: Anthropic
): Promise<ContextualAdjustment> {
  const startTime = Date.now();

  // Construir prompt con contexto completo
  const userPrompt = `
EVALUACIÓN ORIGINAL (basada en rúbrica estricta):
Score Total: ${originalScore.toFixed(1)}/100

Desglose por fases:
${formatPhaseScoresForPrompt(phaseScores)}

---

ANÁLISIS DETALLADO DE EJERCICIOS:
${formatExerciseAnalysisForPrompt(exerciseAnalysis)}

---

RESPUESTAS ORIGINALES DEL ESTUDIANTE:
${rawExamContent}

---

TAREA:
Revisa si el score de ${originalScore.toFixed(1)}/100 es justo considerando:
1. ¿Hay errores menores que fueron penalizados como si fueran fundamentales?
2. ¿Se usó un método alternativo válido que no fue reconocido?
3. ¿Hay evidencia de comprensión conceptual pese a errores de forma?
4. ¿El nivel de exigencia es apropiado para estudiantes en formación?
5. ¿Se diferenció entre falta de conocimiento vs mala comunicación?

Responde con el JSON de ajuste.
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1000,
      temperature: 0.2, // Baja temperatura para consistencia
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: CONTEXTUAL_ADJUSTMENT_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' }, // Cache del system prompt
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    // Parsear respuesta JSON de Claude
    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Respuesta inesperada de Claude (no es texto)');
    }

    const adjustmentData = JSON.parse(textContent.text);

    // Validar que el ajuste esté en rango [-10, +10]
    if (
      adjustmentData.adjustment < -10 ||
      adjustmentData.adjustment > 10
    ) {
      console.warn(
        `Ajuste fuera de rango: ${adjustmentData.adjustment}. Limitando a ±10.`
      );
      adjustmentData.adjustment = Math.max(
        -10,
        Math.min(10, adjustmentData.adjustment)
      );
    }

    // Validar que adjustedScore esté en rango [0, 100]
    if (
      adjustmentData.adjustedScore < 0 ||
      adjustmentData.adjustedScore > 100
    ) {
      console.warn(
        `Score ajustado fuera de rango: ${adjustmentData.adjustedScore}. Limitando a [0, 100].`
      );
      adjustmentData.adjustedScore = Math.max(
        0,
        Math.min(100, adjustmentData.adjustedScore)
      );
    }

    // Calcular costo de la llamada
    const usage = response.usage;
    const costInfo: APICostInfo = {
      cost: calculateCost(usage),
      model: 'claude-haiku-4-20250514',
      tokensInput: usage.input_tokens,
      tokensOutput: usage.output_tokens,
      cacheHit:
        usage.cache_read_input_tokens !== undefined &&
        usage.cache_read_input_tokens !== null &&
        usage.cache_read_input_tokens > 0,
    };

    const result: ContextualAdjustment = {
      originalScore,
      adjustedScore: adjustmentData.adjustedScore,
      adjustment: adjustmentData.adjustment,
      justification: adjustmentData.justification,
      evidenceForAdjustment: adjustmentData.evidenceForAdjustment,
      appliedAt: new Date(),
      costInfo,
    };

    console.log(
      `[Contextual Adjustment] Score: ${originalScore.toFixed(1)} → ${result.adjustedScore.toFixed(1)} (${result.adjustment >= 0 ? '+' : ''}${result.adjustment.toFixed(1)})`
    );
    console.log(
      `[Contextual Adjustment] Cost: $${costInfo.cost.toFixed(6)} (cache ${costInfo.cacheHit ? 'HIT' : 'MISS'})`
    );

    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        '[Contextual Adjustment] Error al aplicar ajuste:',
        error.message
      );
    }

    // En caso de error, devolver ajuste neutro (sin cambios)
    return {
      originalScore,
      adjustedScore: originalScore,
      adjustment: 0,
      justification:
        'No se pudo aplicar ajuste contextual debido a un error técnico. Se mantiene el score de la evaluación estricta.',
      evidenceForAdjustment: 'N/A',
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
 * Precios actualizados al 2025-01-12
 */
function calculateCost(usage: Anthropic.Messages.Usage): number {
  const INPUT_COST_PER_MILLION = 1.0; // $1.00 / 1M tokens
  const OUTPUT_COST_PER_MILLION = 5.0; // $5.00 / 1M tokens
  const CACHE_WRITE_COST_PER_MILLION = 1.25; // $1.25 / 1M tokens
  const CACHE_READ_COST_PER_MILLION = 0.1; // $0.10 / 1M tokens

  let totalCost = 0;

  // Input tokens (no cacheados)
  const regularInputTokens =
    usage.input_tokens -
    (usage.cache_creation_input_tokens || 0) -
    (usage.cache_read_input_tokens || 0);
  totalCost +=
    (regularInputTokens / 1_000_000) * INPUT_COST_PER_MILLION;

  // Cache creation (escribir al cache)
  if (usage.cache_creation_input_tokens) {
    totalCost +=
      (usage.cache_creation_input_tokens / 1_000_000) *
      CACHE_WRITE_COST_PER_MILLION;
  }

  // Cache read (leer del cache - 90% descuento)
  if (usage.cache_read_input_tokens) {
    totalCost +=
      (usage.cache_read_input_tokens / 1_000_000) *
      CACHE_READ_COST_PER_MILLION;
  }

  // Output tokens
  totalCost +=
    (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return totalCost;
}
