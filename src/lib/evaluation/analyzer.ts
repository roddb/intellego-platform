import claudeClient from "@/services/ai/claude/client";
import type { ParsedExam, AIAnalysis, AIAnalysis5Phases, AIAnalysisCustom, ExamMetadata, Student, APICostInfo, Rubric } from "./types";
import { EvaluationError, ErrorCodes } from "./types";
import { RUBRICA_5_FASES } from "./prompts/rubrica-5-fases";
import { OUTPUT_FORMAT_TEMPLATE } from "./prompts/output-format-template";
import { CUSTOM_RUBRIC_OUTPUT_TEMPLATE } from "./prompts/custom-rubric-prompt";

/**
 * ExamAnalyzer - Analiza exámenes usando Claude Haiku con rúbrica 5-FASE
 *
 * Responsabilidades:
 * 1. Construir system prompt (cacheable) con rúbrica
 * 2. Construir user prompt con transcripción del examen
 * 3. Llamar a Claude Haiku API
 * 4. Parsear respuesta JSON
 */

/**
 * Limpia y normaliza una respuesta JSON de la IA para hacerla parseable
 *
 * Maneja errores comunes que comete Claude cuando genera JSON largo:
 * - Comentarios JavaScript (// y /* *\/)
 * - Trailing commas antes de } o ]
 * - Comillas simples en lugar de dobles
 * - Markdown code blocks (```json)
 * - Newlines dentro de strings
 * - Comillas no escapadas dentro de strings
 *
 * @param rawContent - Respuesta cruda de la IA
 * @returns JSON limpio y parseable
 */
function cleanAIJsonResponse(rawContent: string): string {
  let cleaned = rawContent.trim();

  // 1. Remover markdown code blocks
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  // 2. Remover comentarios de JavaScript
  // Comentarios de una línea: // ...
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "");

  // Comentarios de múltiples líneas: /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

  // 3. Remover trailing commas antes de } o ]
  // Esto es común cuando la IA genera JSON con comas finales
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // 4. Reemplazar comillas simples por dobles (solo para property names)
  // Patrón: 'propertyName': -> "propertyName":
  cleaned = cleaned.replace(/'([^']+)'(\s*:)/g, '"$1"$2');

  // 5. Intentar parsear y si falla, aplicar limpieza más agresiva
  try {
    JSON.parse(cleaned);
    return cleaned; // Si ya es válido, retornar
  } catch (error) {
    console.log("⚠️  Primera pasada de limpieza falló, aplicando limpieza agresiva...");

    // 6. Limpieza agresiva: remover todos los saltos de línea y espacios extra
    cleaned = cleaned.replace(/\n/g, " ").replace(/\r/g, "");
    cleaned = cleaned.replace(/\s+/g, " ");

    // 7. Intentar arreglar comillas no escapadas dentro de strings
    // Esto es complicado, pero intentamos un enfoque heurístico
    // Escapar comillas dobles que están seguidas de : o , sin estar al final de una propiedad
    cleaned = cleaned.replace(/"([^"]*?)"(\s*[^:,}\]])/g, (match, content, after) => {
      // Si el contenido tiene comillas internas, escaparlas
      const escapedContent = content.replace(/"/g, '\\"');
      return `"${escapedContent}"${after}`;
    });

    // 8. Intentar cerrar JSON incompleto
    // Contar llaves y corchetes
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;

    // 9. Cerrar strings truncados antes de cerrar estructuras
    // Si hay una comilla doble abierta sin cerrar, cerrarla
    const quoteCount = (cleaned.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      // Número impar de comillas = hay una abierta sin cerrar
      console.log("⚠️  String truncado detectado, cerrando comilla...");
      cleaned += '"';
    }

    // 10. Cerrar arrays truncados (buscar última coma y reemplazar por ]})
    // Si el JSON termina con una coma seguida de espacios, es probable que esté truncado
    if (cleaned.trim().endsWith(',')) {
      console.log("⚠️  JSON truncado detectado (termina en coma), removiendo trailing comma...");
      cleaned = cleaned.trim().slice(0, -1); // Remover última coma
    }

    // 11. Agregar llaves/corchetes faltantes al final (BUG FIX: era "" en vez de "}")
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      console.log(`⚠️  Agregando ${missing} llave(s) de cierre faltante(s)...`);
      cleaned += "}".repeat(missing);
    }
    if (openBrackets > closeBrackets) {
      const missing = openBrackets - closeBrackets;
      console.log(`⚠️  Agregando ${missing} corchete(s) de cierre faltante(s)...`);
      cleaned += "]".repeat(missing);
    }

    // 12. Último intento: si aún hay error, intentar truncar en el último objeto completo
    try {
      JSON.parse(cleaned);
      return cleaned.trim();
    } catch (finalError) {
      console.log("⚠️  JSON aún inválido después de todas las reparaciones.");
      console.log("⚠️  Intentando truncar en el último objeto válido...");

      // Buscar el último } válido y truncar ahí
      let lastValidIndex = cleaned.lastIndexOf('}');
      if (lastValidIndex !== -1) {
        // Intentar truncar en ese punto
        const truncated = cleaned.substring(0, lastValidIndex + 1);

        // Verificar balance de llaves en el truncado
        const truncOpenBraces = (truncated.match(/\{/g) || []).length;
        const truncCloseBraces = (truncated.match(/\}/g) || []).length;

        if (truncOpenBraces === truncCloseBraces) {
          console.log("✅ JSON truncado en último objeto válido");
          return truncated.trim();
        }
      }

      // Si nada funciona, retornar lo mejor que tenemos
      console.log("⚠️  No se pudo reparar completamente, retornando mejor intento...");
      return cleaned.trim();
    }
  }
}

/**
 * Analiza un examen usando Claude Haiku 4.5
 *
 * @param parsedExam - Examen parseado (apellido, contenido, ejercicios)
 * @param student - Información del estudiante
 * @param metadata - Metadata del examen (materia, tema, fecha)
 * @param rubric - Objeto Rubric completo con rubricType
 * @returns AIAnalysis (5-phases o custom según el tipo de rúbrica)
 */
export async function analyzeExam(
  parsedExam: ParsedExam,
  student: Student,
  metadata: ExamMetadata,
  rubric: Rubric
): Promise<AIAnalysis> {
  try {
    // Determinar el tipo de rúbrica y construir prompt apropiado
    const rubricType = rubric.rubricType || '5-phases'; // Fallback para compatibilidad
    const rubricText = rubric.rubricText;

    let fullSystemPrompt: string;

    if (rubricType === '5-phases') {
      // Sistema tradicional: F1-F5 con OUTPUT_FORMAT_TEMPLATE
      fullSystemPrompt = rubricText + OUTPUT_FORMAT_TEMPLATE;
    } else {
      // Sistema custom: estructura libre con CUSTOM_RUBRIC_OUTPUT_TEMPLATE
      fullSystemPrompt = rubricText + CUSTOM_RUBRIC_OUTPUT_TEMPLATE;
    }

    // 1. Construir system prompt (CACHEABLE)
    const systemPrompt = [
      {
        type: "text" as const,
        text: fullSystemPrompt,
        cache_control: { type: "ephemeral" as const }, // Cache por 5 minutos
      },
    ];

    // 2. Construir user prompt
    const userPrompt = buildUserPrompt(parsedExam, student, metadata);

    // 3. Llamar a Claude API
    console.log("📝 Analizando examen con Claude Haiku...", {
      student: student.name,
      subject: metadata.subject,
      topic: metadata.examTopic,
      exercises: parsedExam.exercises.length,
    });

    const response = await claudeClient.createMessage({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 8000, // Tokens suficientes para análisis completo (JSON largo)
      temperature: 0.1, // Determinístico
      stop_sequences: [], // Permitir que complete el JSON
    });

    if (!response.success || !response.content) {
      throw new EvaluationError(
        ErrorCodes.AI_ANALYSIS_FAILED,
        "Claude API no retornó contenido",
        response.error?.message
      );
    }

    // Log de uso de tokens
    const cacheHit = (response.usage?.cache_read_input_tokens ?? 0) > 0;
    const actualCost = calculateCost(response.usage);

    if (response.usage) {
      console.log("✅ Análisis completado", {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheHit,
        latencyMs: response.latency,
        cost: actualCost,
      });
    }

    // 4. Parsear respuesta JSON según tipo de rúbrica
    const costInfo: APICostInfo = {
      cost: actualCost,
      model: "claude-haiku-4-5",
      tokensInput: response.usage?.input_tokens ?? 0,
      tokensOutput: response.usage?.output_tokens ?? 0,
      cacheHit,
    };

    const analysis = rubricType === '5-phases'
      ? parseAIResponse5Phases(response.content, costInfo)
      : parseAIResponseCustom(response.content, costInfo);

    return analysis;
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }

    throw new EvaluationError(
      ErrorCodes.AI_ANALYSIS_FAILED,
      "Error al analizar examen con IA",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Construye el user prompt con la transcripción del examen
 */
function buildUserPrompt(
  parsedExam: ParsedExam,
  student: Student,
  metadata: ExamMetadata
): string {
  return `
Estudiante: ${student.name}
Curso: ${student.academicYear} - División ${student.division}
Examen: ${metadata.subject} - ${metadata.examTopic}
Fecha: ${metadata.examDate}

---

TRANSCRIPCIÓN DEL EXAMEN:

${parsedExam.rawContent}

---

Evalúa este examen usando la rúbrica 5-FASE proporcionada en el system prompt.

Analiza cada ejercicio individualmente y genera el JSON con:
1. Scores por fase (F1-F5) con nivel y puntaje
2. Análisis detallado por ejercicio
3. Recomendaciones priorizadas

Devuelve SOLO el JSON, sin texto adicional.
`.trim();
}

/**
 * Parsea la respuesta JSON de Claude para rúbricas 5-phases
 */
function parseAIResponse5Phases(content: string, costInfo: APICostInfo): AIAnalysis5Phases {
  try {
    // Usar la función de limpieza robusta
    const cleanedContent = cleanAIJsonResponse(content);

    console.log("🧹 JSON limpiado (5-phases), intentando parsear...");

    // Parsear JSON
    const parsed = JSON.parse(cleanedContent);

    // Transform: Claude a veces usa "overallScores" en lugar de "scores"
    if (parsed.overallScores && !parsed.scores) {
      console.log("⚠️  Claude usó 'overallScores', transformando a 'scores'...");
      parsed.scores = parsed.overallScores;
      delete parsed.overallScores;
    }

    // Transform: Claude a veces agrega sufijos a las keys (F1_Comprension → F1)
    if (parsed.scores) {
      const normalizedScores: any = {};
      let needsNormalization = false;

      for (const key of Object.keys(parsed.scores)) {
        // Si la key tiene formato F1_Algo, F2_Algo, etc., normalizarla
        const match = key.match(/^(F[1-5])_/);
        if (match) {
          const normalizedKey = match[1]; // F1, F2, F3, F4 o F5
          normalizedScores[normalizedKey] = parsed.scores[key];
          needsNormalization = true;
        } else {
          // Si ya está normalizada (F1, F2, etc.), mantenerla
          normalizedScores[key] = parsed.scores[key];
        }
      }

      if (needsNormalization) {
        console.log("⚠️  Claude usó keys con sufijos (F1_Comprension), normalizando...");
        parsed.scores = normalizedScores;
      }
    }

    // Debug: Log estructura recibida
    console.log("📊 Estructura recibida:", {
      hasScores: !!parsed.scores,
      hasExerciseAnalysis: !!parsed.exerciseAnalysis,
      hasRecommendations: !!parsed.recommendations,
      scoresKeys: parsed.scores ? Object.keys(parsed.scores) : [],
    });

    // Validar estructura
    if (!parsed.scores || !parsed.exerciseAnalysis || !parsed.recommendations) {
      console.error("❌ Estructura JSON inválida:", {
        hasScores: !!parsed.scores,
        hasExerciseAnalysis: !!parsed.exerciseAnalysis,
        hasRecommendations: !!parsed.recommendations,
      });
      throw new Error("JSON no tiene la estructura esperada");
    }

    // Validar que scores tenga F1-F5
    const requiredFases = ["F1", "F2", "F3", "F4", "F5"];
    for (const fase of requiredFases) {
      if (!parsed.scores[fase]) {
        console.error(`❌ Falta score para ${fase}:`, {
          fase,
          scoreValue: parsed.scores[fase],
          allScoresKeys: Object.keys(parsed.scores),
        });
        throw new Error(`Falta score para ${fase}`);
      }
      if (
        typeof parsed.scores[fase].nivel !== "number" ||
        typeof parsed.scores[fase].puntaje !== "number"
      ) {
        console.error(`❌ Score de ${fase} tiene formato inválido:`, {
          fase,
          scoreValue: parsed.scores[fase],
          nivelType: typeof parsed.scores[fase].nivel,
          puntajeType: typeof parsed.scores[fase].puntaje,
        });
        throw new Error(`Score de ${fase} tiene formato inválido`);
      }
    }

    console.log("✅ Validación de scores completada exitosamente");

    // Validar exerciseAnalysis es array
    if (!Array.isArray(parsed.exerciseAnalysis)) {
      throw new Error("exerciseAnalysis debe ser un array");
    }

    // Validar recommendations es array
    if (!Array.isArray(parsed.recommendations)) {
      throw new Error("recommendations debe ser un array");
    }

    return {
      type: '5-phases',
      scores: parsed.scores,
      exerciseAnalysis: parsed.exerciseAnalysis,
      recommendations: parsed.recommendations,
      costInfo,
    } as AIAnalysis5Phases;
  } catch (error) {
    console.error("❌ Error parseando respuesta de Claude:", error);
    console.error("Contenido recibido:", content);

    throw new EvaluationError(
      ErrorCodes.AI_ANALYSIS_FAILED,
      "No se pudo parsear la respuesta de la IA",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Parsea la respuesta JSON de Claude para rúbricas custom
 */
function parseAIResponseCustom(content: string, costInfo: APICostInfo): AIAnalysisCustom {
  try {
    // Usar la función de limpieza robusta
    const cleanedContent = cleanAIJsonResponse(content);

    console.log("🧹 JSON limpiado, intentando parsear...");

    // Parsear JSON
    const parsed = JSON.parse(cleanedContent);

    // Debug: Log estructura recibida
    console.log("📊 Estructura recibida (custom):", {
      hasTotalScore: !!parsed.totalScore,
      hasExerciseAnalysis: !!parsed.exerciseAnalysis,
      hasRecommendations: !!parsed.recommendations,
    });

    // Validar estructura básica
    if (!parsed.totalScore || !parsed.exerciseAnalysis || !parsed.recommendations) {
      console.error("❌ Estructura JSON inválida (custom):", {
        hasTotalScore: !!parsed.totalScore,
        hasExerciseAnalysis: !!parsed.exerciseAnalysis,
        hasRecommendations: !!parsed.recommendations,
      });
      throw new Error("JSON no tiene la estructura esperada para rúbrica custom");
    }

    // Validar que totalScore sea número
    if (typeof parsed.totalScore !== "number") {
      throw new Error("totalScore debe ser un número");
    }

    // Validar que totalScore esté en rango [0, 100]
    if (parsed.totalScore < 0 || parsed.totalScore > 100) {
      console.warn(`⚠️  totalScore fuera de rango: ${parsed.totalScore}. Limitando a [0, 100].`);
      parsed.totalScore = Math.max(0, Math.min(100, parsed.totalScore));
    }

    // Validar exerciseAnalysis es array
    if (!Array.isArray(parsed.exerciseAnalysis)) {
      throw new Error("exerciseAnalysis debe ser un array");
    }

    // Validar recommendations es array
    if (!Array.isArray(parsed.recommendations)) {
      throw new Error("recommendations debe ser un array");
    }

    console.log("✅ Validación de estructura custom completada exitosamente");

    return {
      type: 'custom',
      totalScore: parsed.totalScore,
      exerciseAnalysis: parsed.exerciseAnalysis,
      recommendations: parsed.recommendations,
      costInfo,
    } as AIAnalysisCustom;
  } catch (error) {
    console.error("❌ Error parseando respuesta de Claude (custom):", error);
    console.error("Contenido recibido:", content);

    throw new EvaluationError(
      ErrorCodes.AI_ANALYSIS_FAILED,
      "No se pudo parsear la respuesta de la IA (rúbrica custom)",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Calcula el costo de la llamada a Claude API
 */
function calculateCost(usage?: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}): number {
  if (!usage) return 0;

  // Precios de Claude Haiku 4.5 (por millón de tokens)
  const INPUT_PRICE = 1.0; // $1.00 / 1M tokens
  const OUTPUT_PRICE = 5.0; // $5.00 / 1M tokens
  const CACHE_WRITE_PRICE = 1.25; // $1.25 / 1M tokens (cache creation)
  const CACHE_READ_PRICE = 0.1; // $0.10 / 1M tokens (cache hit)

  // Tokens normales
  const inputCost = (usage.input_tokens / 1_000_000) * INPUT_PRICE;
  const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_PRICE;

  // Tokens de caché
  const cacheWriteCost =
    ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * CACHE_WRITE_PRICE;
  const cacheReadCost =
    ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * CACHE_READ_PRICE;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * Analiza múltiples exámenes en batch
 * DEPRECATED: Esta función requiere que cada examen incluya el objeto Rubric
 */
export async function analyzeExams(
  exams: Array<{
    parsed: ParsedExam;
    student: Student;
    metadata: ExamMetadata;
    rubric: Rubric;
  }>
): Promise<AIAnalysis[]> {
  const results: AIAnalysis[] = [];

  for (const exam of exams) {
    try {
      const analysis = await analyzeExam(
        exam.parsed,
        exam.student,
        exam.metadata,
        exam.rubric
      );
      results.push(analysis);
    } catch (error) {
      console.error(
        `Error analizando examen de ${exam.student.name}:`,
        error
      );
      // Continuar con el siguiente examen
    }
  }

  return results;
}
