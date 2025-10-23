import claudeClient from "@/services/ai/claude/client";
import type { ParsedExam, AIAnalysis, ExamMetadata, Student, APICostInfo } from "./types";
import { EvaluationError, ErrorCodes } from "./types";
import { RUBRICA_5_FASES } from "./prompts/rubrica-5-fases";

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
 * Analiza un examen usando Claude Haiku 4.5
 *
 * @param parsedExam - Examen parseado (apellido, contenido, ejercicios)
 * @param student - Información del estudiante
 * @param metadata - Metadata del examen (materia, tema, fecha)
 * @returns AIAnalysis con scores, análisis por ejercicio y recomendaciones
 */
export async function analyzeExam(
  parsedExam: ParsedExam,
  student: Student,
  metadata: ExamMetadata
): Promise<AIAnalysis> {
  try {
    // 1. Construir system prompt (CACHEABLE)
    const systemPrompt = [
      {
        type: "text" as const,
        text: RUBRICA_5_FASES,
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

    // 4. Parsear respuesta JSON
    const analysis = parseAIResponse(response.content);

    // 5. Agregar información de costos
    const costInfo: APICostInfo = {
      cost: actualCost,
      model: "claude-haiku-4-5",
      tokensInput: response.usage?.input_tokens ?? 0,
      tokensOutput: response.usage?.output_tokens ?? 0,
      cacheHit,
    };

    return {
      ...analysis,
      costInfo,
    };
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
 * Parsea la respuesta JSON de Claude
 */
function parseAIResponse(content: string): AIAnalysis {
  try {
    // Limpiar respuesta (remover markdown code blocks si existen)
    let cleanedContent = content.trim();

    // Remover ```json o ``` si existe
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, "");
    }
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```\s*/, "");
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.replace(/\s*```$/, "");
    }

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

    return parsed as AIAnalysis;
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
 */
export async function analyzeExams(
  exams: Array<{
    parsed: ParsedExam;
    student: Student;
    metadata: ExamMetadata;
  }>
): Promise<AIAnalysis[]> {
  const results: AIAnalysis[] = [];

  for (const exam of exams) {
    try {
      const analysis = await analyzeExam(
        exam.parsed,
        exam.student,
        exam.metadata
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
