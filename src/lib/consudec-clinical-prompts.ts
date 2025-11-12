/**
 * Sistema de Prompts para Evaluación de Casos Clínicos de Bioelectricidad
 *
 * Evalúa respuestas que combinan:
 * 1. Cálculos matemáticos (potenciales, corrientes, resistencias)
 * 2. Fundamentación teórica (leyes físicas, ecuaciones)
 * 3. Análisis clínico (interpretación fisiopatológica)
 */

import type { ActivityQuestion, QuestionRubric } from '@/types/consudec-activity';

/**
 * System Prompt para Evaluación de Casos Clínicos
 * CACHEABLE - Se envía con cache_control: ephemeral para reducir costos
 */
export const CLINICAL_SYSTEM_PROMPT = `Eres un evaluador experto en bioelectricidad y casos clínicos médicos para estudiantes de medicina.

Tu tarea es evaluar respuestas de estudiantes que analizan casos clínicos reales, combinando:
1. **Cálculos matemáticos**: Aplicación de ecuaciones de bioelectricidad (Nernst, Ohm, Goldman-Hodgkin-Katz)
2. **Fundamentación teórica**: Comprensión de conceptos de electrofisiología
3. **Análisis clínico**: Interpretación fisiopatológica y conexión con manifestaciones clínicas

# CRITERIOS DE EVALUACIÓN

## Para preguntas de CÁLCULO:

### 1. Precisión Numérica (30%)
- Resultado dentro del margen de tolerancia especificado
- Valor numérico claramente identificable en la respuesta
- Redondeo apropiado según las cifras significativas

### 2. Método y Fórmula (25%)
- Uso correcto de la ecuación física correspondiente
- Identificación explícita de variables y constantes
- Sustitución correcta de valores numéricos
- Desarrollo paso a paso del cálculo

### 3. Unidades (15%)
- Uso correcto de unidades SI o unidades médicas estándar
- Conversiones de unidades correctas cuando sea necesario
- Consistencia dimensional en la ecuación

### 4. Interpretación (20%)
- Explicación del significado del resultado calculado
- Conexión con el contexto clínico del caso
- Identificación de si el valor es normal o patológico

### 5. Análisis de Riesgo (10%)
- Identificación de umbrales de peligro cuando corresponda
- Implicaciones clínicas del valor calculado
- Recomendaciones o precauciones basadas en el resultado

## Para preguntas CONCEPTUALES:

### 1. Fundamentación Teórica (30%)
- Cita de principios físicos o leyes relevantes
- Uso correcto de terminología científica
- Conexión con conceptos del curso (clases específicas)

### 2. Análisis Fisiopatológico (30%)
- Explicación del mecanismo patológico
- Conexión causa-efecto correcta
- Identificación de alteraciones en procesos normales

### 3. Integración Clínica (20%)
- Conexión con signos y síntomas del paciente
- Explicación de manifestaciones clínicas observadas
- Correlación con datos de laboratorio o estudios

### 4. Claridad Comunicativa (20%)
- Estructura lógica y coherente
- Lenguaje preciso y técnicamente correcto
- Síntesis apropiada (no excesivamente extenso ni superficial)

# SISTEMA DE CRÉDITO PARCIAL (para preguntas de cálculo)

Aplica estos niveles cuando corresponda:

**100 puntos (Excelente):**
- Respuesta numérica correcta (dentro de tolerancia)
- Fórmula explícita y correcta
- Unidades correctas
- Interpretación clínica adecuada
- Todos los pasos mostrados

**70-85 puntos (Bueno):**
- Respuesta numérica correcta O método correcto con error menor
- Fórmula presente
- Unidades correctas
- Interpretación básica presente

**50-69 puntos (Satisfactorio - Crédito Parcial):**
- Método correcto pero respuesta incorrecta (error de cálculo)
- Fórmula identificada correctamente pero mal aplicada
- Sin unidades o unidades incorrectas pero proceso correcto
- Respuesta correcta sin mostrar procedimiento

**30-49 puntos (Insuficiente bajo):**
- Identificó la fórmula relevante pero no la aplicó
- Intento de cálculo con enfoque incorrecto
- Respuesta numérica sin fundamentación

**0-29 puntos (Insuficiente):**
- Respuesta incorrecta sin método válido
- No identificó la fórmula relevante
- Confusión conceptual grave
- Respuesta irrelevante o vacía

# UMBRALES DE SEGURIDAD ELÉCTRICA (Referencia)

**Corriente eléctrica en el cuerpo humano:**
- Umbral de percepción: 1 mA (50/60 Hz)
- Corriente dolorosa: 5-10 mA
- "Let-go current" (pérdida de control muscular): 10-20 mA
- Fibrilación ventricular: >100 mA (puede ser fatal)
- Quemaduras y daño tisular: >200 mA

**Voltajes:**
- Extra bajo voltaje (ELV): <50 V AC / <120 V DC (seguro)
- Bajo voltaje: 50-1000 V AC / 120-1500 V DC
- Alto voltaje: >1000 V AC / >1500 V DC

**Resistencia corporal:**
- Piel seca: 100,000 Ω (100 kΩ)
- Piel húmeda: 1,000 Ω (1 kΩ)
- Interno (mano a mano): 500-1000 Ω

# UMBRALES ELECTROFISIOLÓGICOS (Referencia)

**Potenciales de membrana:**
- Potencial de reposo neuronal: -70 mV
- Potencial de reposo muscular: -85 mV
- Umbral de disparo: -55 mV
- Pico del potencial de acción: +30 mV

**Concentraciones iónicas típicas:**
- K⁺ extracelular: 3.5-5.0 mEq/L
- K⁺ intracelular: ~140 mEq/L
- Na⁺ extracelular: 135-145 mEq/L
- Na⁺ intracelular: ~10 mEq/L
- Ca²⁺ extracelular: 2.2-2.6 mM
- Ca²⁺ intracelular: ~100 nM

# FORMATO DE RESPUESTA

Debes devolver JSON válido con esta estructura exacta:

\`\`\`json
{
  "score": <número 0-100>,
  "level": "<excellent|good|satisfactory|insufficient>",
  "feedback": "<2-3 oraciones de retroalimentación específica>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "improvements": ["<mejora 1>", "<mejora 2>", "<mejora 3>"],
  "calculationEvaluation": {
    "isNumericCorrect": <true|false>,
    "numericValue": <número extraído o null>,
    "hasFormula": <true|false>,
    "hasExplanation": <true|false>,
    "hasCorrectUnits": <true|false>,
    "partialCreditApplied": <true|false>
  }
}
\`\`\`

**IMPORTANTE:**
- El campo "calculationEvaluation" es OBLIGATORIO para preguntas de cálculo
- El campo "calculationEvaluation" es OPCIONAL (omitir) para preguntas conceptuales
- "strengths" e "improvements" deben tener EXACTAMENTE 2-3 elementos cada uno
- "feedback" debe ser específico y constructivo, no genérico
- Asegúrate de que el JSON sea válido (comillas correctas, sin trailing commas)
`;

/**
 * Genera prompt para evaluar pregunta tipo CÁLCULO
 */
export function generateClinicalCalculationPrompt(
  caseContext: string,
  question: ActivityQuestion,
  studentAnswer: string,
  correctAnswer: number,
  tolerance: number,
  expectedFormula: string,
  expectedUnit: string
): string {
  const toleranceRange = correctAnswer * (tolerance / 100);
  const minAcceptable = correctAnswer - toleranceRange;
  const maxAcceptable = correctAnswer + toleranceRange;

  return `# CONTEXTO DEL CASO CLÍNICO

${caseContext}

---

# PREGUNTA DE CÁLCULO A EVALUAR

**Pregunta:**
${question.text}

**Parámetros de validación:**
- Respuesta correcta esperada: ${correctAnswer} ${expectedUnit}
- Tolerancia: ±${tolerance}% (rango aceptable: ${minAcceptable.toFixed(2)} a ${maxAcceptable.toFixed(2)} ${expectedUnit})
- Fórmula esperada: ${expectedFormula}
- Unidad esperada: ${expectedUnit}

---

# RESPUESTA DEL ESTUDIANTE

${studentAnswer}

---

# RÚBRICA ESPECÍFICA PARA ESTA PREGUNTA

**Excelente (85-100 puntos):**
${question.rubric.excellent}

**Bueno (70-84 puntos):**
${question.rubric.good}

**Satisfactorio (50-69 puntos):**
${question.rubric.satisfactory}

**Insuficiente (0-49 puntos):**
${question.rubric.insufficient}

---

# TAREAS DE EVALUACIÓN

Analiza la respuesta del estudiante siguiendo estos pasos:

1. **Extracción numérica:**
   - Identifica el valor numérico que el estudiante calculó
   - Verifica si está dentro del rango aceptable (${minAcceptable.toFixed(2)} - ${maxAcceptable.toFixed(2)} ${expectedUnit})

2. **Verificación de fórmula:**
   - ¿Mencionó o usó la fórmula correcta? (${expectedFormula})
   - ¿Identificó correctamente las variables?
   - ¿Sustituyó los valores correctamente?

3. **Verificación de unidades:**
   - ¿Incluyó la unidad correcta? (${expectedUnit})
   - ¿Realizó conversiones de unidades si fueron necesarias?

4. **Evaluación de interpretación:**
   - ¿Explicó el significado del resultado calculado?
   - ¿Conectó el resultado con el contexto clínico del caso?
   - ¿Identificó si el valor es normal o patológico?

5. **Asignación de puntaje:**
   - Usa la rúbrica específica proporcionada arriba
   - Aplica crédito parcial según el sistema de crédito parcial del system prompt
   - Justifica el puntaje en el campo "feedback"

6. **Generación de retroalimentación:**
   - Identifica 2-3 fortalezas específicas
   - Identifica 2-3 áreas de mejora concretas
   - Redacta feedback constructivo y específico (no genérico)

Devuelve el resultado en el formato JSON especificado en el system prompt, asegurándote de incluir el campo "calculationEvaluation" con todos sus subcampos.`;
}

/**
 * Genera prompt para evaluar pregunta tipo CONCEPTUAL
 */
export function generateClinicalConceptualPrompt(
  caseContext: string,
  question: ActivityQuestion,
  studentAnswer: string
): string {
  return `# CONTEXTO DEL CASO CLÍNICO

${caseContext}

---

# PREGUNTA CONCEPTUAL A EVALUAR

**Pregunta:**
${question.text}

---

# RESPUESTA DEL ESTUDIANTE

${studentAnswer}

---

# RÚBRICA ESPECÍFICA PARA ESTA PREGUNTA

**Excelente (85-100 puntos):**
${question.rubric.excellent}

**Bueno (70-84 puntos):**
${question.rubric.good}

**Satisfactorio (50-69 puntos):**
${question.rubric.satisfactory}

**Insuficiente (0-49 puntos):**
${question.rubric.insufficient}

---

# TAREAS DE EVALUACIÓN

Analiza la respuesta del estudiante considerando:

1. **Fundamentación teórica:**
   - ¿Cita principios físicos o leyes relevantes?
   - ¿Usa terminología científica correctamente?
   - ¿Conecta con conceptos del curso mencionados en la rúbrica?

2. **Análisis fisiopatológico:**
   - ¿Explica el mecanismo patológico correctamente?
   - ¿Establece relaciones causa-efecto válidas?
   - ¿Identifica alteraciones en procesos normales?

3. **Integración clínica:**
   - ¿Conecta con signos/síntomas del paciente?
   - ¿Explica las manifestaciones clínicas observadas?
   - ¿Correlaciona con datos de laboratorio o estudios?

4. **Claridad comunicativa:**
   - ¿Tiene estructura lógica y coherente?
   - ¿Usa lenguaje preciso y técnicamente correcto?
   - ¿Logra síntesis apropiada (ni excesivo ni superficial)?

5. **Asignación de puntaje:**
   - Usa la rúbrica específica proporcionada arriba
   - Considera todos los criterios de evaluación
   - Justifica el puntaje en el campo "feedback"

6. **Generación de retroalimentación:**
   - Identifica 2-3 fortalezas específicas
   - Identifica 2-3 áreas de mejora concretas
   - Redacta feedback constructivo y específico (no genérico)

Devuelve el resultado en el formato JSON especificado en el system prompt. IMPORTANTE: NO incluyas el campo "calculationEvaluation" para preguntas conceptuales (solo para cálculos).`;
}

/**
 * Genera prompt para feedback general post-evaluación
 * Resume el desempeño global del estudiante en todas las preguntas
 */
export function generateClinicalGeneralFeedbackPrompt(
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
  const overallScore = questionResults.reduce((sum, q) => sum + q.score, 0) / questionResults.length;

  const resultsSummary = questionResults
    .map(
      (q, i) =>
        `**Pregunta ${q.questionNumber}:** ${q.score}/100 (${q.level})
- Fortalezas: ${q.strengths.join(', ')}
- Mejoras: ${q.improvements.join(', ')}`
    )
    .join('\n\n');

  return `Genera un feedback general breve (máximo 150 palabras) que resuma el desempeño del estudiante en la actividad "${activityTitle}".

# RESULTADOS POR PREGUNTA

${resultsSummary}

# SCORE GLOBAL

${overallScore.toFixed(1)}/100

# INSTRUCCIONES

Redacta un párrafo que:
1. Resuma el nivel de desempeño general (excelente/bueno/satisfactorio/insuficiente)
2. Destaque las principales fortalezas observadas across todas las preguntas
3. Identifique las áreas de mejora más importantes
4. Ofrezca una recomendación constructiva para seguir desarrollándose

Tono: Profesional, constructivo, específico (evita generalidades).

Devuelve solo el texto del feedback, sin formato JSON.`;
}
