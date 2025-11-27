import type { ParsedExam, Exercise } from "./types";
import { EvaluationError, ErrorCodes } from "./types";

/**
 * Parser de archivos .md de exámenes e informes
 *
 * Responsabilidades:
 * 1. Extraer apellido del filename
 * 2. Parsear contenido markdown
 * 3. Identificar ejercicios (o tratar como informe completo si no hay ejercicios numerados)
 *
 * Soporta dos tipos de documentos:
 * - Exámenes tradicionales: Con ejercicios numerados (## Ejercicio 1, ## Ejercicio 2, etc.)
 * - Informes/ensayos: Sin estructura de ejercicios (se trata como un documento completo)
 */

/**
 * Extrae el apellido del nombre del archivo
 *
 * Soporta múltiples formatos:
 * - "Rosiello.md" → "Rosiello"
 * - "Rosiello_Ana.md" → "Rosiello"
 * - "Rosiello Ana.md" → "Rosiello"
 * - "Ana Rosiello.md" → "Rosiello" (si el apellido viene al final)
 * - "Di_Bernardo.md" → "Di Bernardo"
 * - "García López.md" → "García López" (apellidos compuestos)
 *
 * Estrategia:
 * 1. Si tiene underscore o espacio, intenta separar apellido de nombre
 * 2. Asume que el apellido viene PRIMERO (formato preferido: Apellido_Nombre)
 * 3. Si es una sola palabra, retorna esa palabra como apellido
 */
export function extractApellido(fileName: string): string {
  // Remover extensión .md
  const withoutExtension = fileName.replace(/\.md$/i, "");

  if (!withoutExtension) {
    throw new EvaluationError(
      ErrorCodes.PARSE_ERROR,
      "El nombre del archivo está vacío"
    );
  }

  // Convertir underscores y guiones a espacios
  const withSpaces = withoutExtension.replace(/[_-]/g, " ");

  // Trim y normalizar espacios múltiples
  const normalized = withSpaces.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new EvaluationError(
      ErrorCodes.PARSE_ERROR,
      `Nombre de archivo inválido: ${fileName}`
    );
  }

  // Si solo es una palabra, retornarla completa
  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return normalized;
  }

  // Si tiene 2 partes, asumir formato "Apellido Nombre" y tomar la primera
  if (parts.length === 2) {
    return parts[0];
  }

  // Si tiene 3+ partes, puede ser:
  // - "Di Bernardo Ana" → tomar "Di Bernardo" (primeras 2 palabras)
  // - "María García López" → tomar "García López" (últimas 2 palabras)
  // Estrategia: tomar las primeras 2 palabras como apellido compuesto
  return `${parts[0]} ${parts[1]}`;
}

/**
 * Normaliza apellido para matching
 * - Remueve tildes
 * - Convierte a minúsculas
 * - Remueve caracteres especiales excepto espacios y guiones
 */
export function normalizeApellido(apellido: string): string {
  return apellido
    .normalize("NFD") // Descomponer caracteres con tildes
    .replace(/[\u0300-\u036f]/g, "") // Remover tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Solo letras, números, espacios y guiones
    .trim();
}

/**
 * Parsea el contenido markdown del examen o informe
 * Identifica ejercicios basándose en headers de nivel 2 (##)
 *
 * Formato esperado para exámenes tradicionales:
 * ```markdown
 * # Examen de Física - Tiro Oblicuo
 * **Alumno**: González, Juan
 *
 * ## Ejercicio 1: Calcular alcance
 * [Desarrollo del alumno...]
 *
 * ## Ejercicio 2: Altura máxima
 * [Desarrollo del alumno...]
 * ```
 *
 * Para informes de laboratorio sin ejercicios numerados, retorna un array vacío.
 * El caller (parseExamFile) se encargará de tratar el documento completo como un único ejercicio.
 */
export function parseExamContent(content: string): Exercise[] {
  const exercises: Exercise[] = [];

  // Split por headers de nivel 2 (##)
  const sections = content.split(/^## /gm).filter(Boolean);

  for (const section of sections) {
    const lines = section.split("\n");
    const firstLine = lines[0]?.trim() || "";

    // Intentar extraer número de ejercicio del título
    const exerciseMatch = firstLine.match(/^Ejercicio\s+(\d+)/i);

    if (exerciseMatch) {
      const number = parseInt(exerciseMatch[1], 10);

      // Extraer título (después del número)
      const titleMatch = firstLine.match(/^Ejercicio\s+\d+\s*:?\s*(.*)$/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;

      // El contenido es el resto (sin la primera línea)
      const exerciseContent = lines.slice(1).join("\n").trim();

      // Verificar si tiene respuesta (contenido no vacío)
      const hasAnswer = exerciseContent.length > 0;

      exercises.push({
        number,
        title,
        content: exerciseContent,
        hasAnswer,
      });
    }
  }

  // Si no se encontraron ejercicios con formato "Ejercicio N"
  // Intentar con números simples (## 1, ## 2, etc.)
  if (exercises.length === 0) {
    for (const section of sections) {
      const lines = section.split("\n");
      const firstLine = lines[0]?.trim() || "";

      const numberMatch = firstLine.match(/^(\d+)/);

      if (numberMatch) {
        const number = parseInt(numberMatch[1], 10);
        const title = firstLine.replace(/^\d+\s*:?\s*/, "").trim() || undefined;
        const exerciseContent = lines.slice(1).join("\n").trim();
        const hasAnswer = exerciseContent.length > 0;

        exercises.push({
          number,
          title,
          content: exerciseContent,
          hasAnswer,
        });
      }
    }
  }

  // Ordenar por número
  exercises.sort((a, b) => a.number - b.number);

  return exercises;
}

/**
 * Parsea un archivo .md de examen completo
 *
 * @param fileName - Nombre del archivo (ej: "Gonzalez.md")
 * @param fileBuffer - Contenido del archivo como Buffer
 * @param fileSize - Tamaño del archivo en bytes
 * @returns ParsedExam con apellido, contenido y ejercicios
 */
export async function parseExamFile(
  fileName: string,
  fileBuffer: Buffer,
  fileSize: number
): Promise<ParsedExam> {
  try {
    // Validar que el archivo sea .md
    if (!fileName.endsWith(".md")) {
      throw new EvaluationError(
        ErrorCodes.INVALID_FILE_FORMAT,
        "El archivo debe tener extensión .md",
        `Archivo recibido: ${fileName}`
      );
    }

    // Extraer apellido del filename
    const apellido = extractApellido(fileName);

    // Convertir Buffer a string
    const rawContent = fileBuffer.toString("utf-8");

    // Validar que el contenido no esté vacío
    if (!rawContent.trim()) {
      throw new EvaluationError(
        ErrorCodes.PARSE_ERROR,
        "El archivo está vacío",
        `Archivo: ${fileName}`
      );
    }

    // Parsear ejercicios del contenido
    const exercises = parseExamContent(rawContent);

    // Si no se encontraron ejercicios numerados, asumir que es un informe de laboratorio
    // o documento completo sin estructura de ejercicios
    if (exercises.length === 0) {
      console.log(`⚠️  No se encontraron ejercicios numerados en ${fileName}. Tratando como informe completo.`);

      // Crear un único "ejercicio" con todo el contenido del documento
      // Esto permite que informes de laboratorio, ensayos, etc. puedan ser evaluados
      exercises.push({
        number: 1,
        title: "Informe Completo",
        content: rawContent.trim(),
        hasAnswer: true,
      });
    }

    return {
      apellido,
      rawContent,
      exercises,
      metadata: {
        fileName,
        fileSize,
        parseDate: new Date(),
      },
    };
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }

    throw new EvaluationError(
      ErrorCodes.PARSE_ERROR,
      "Error al parsear el archivo",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Parsea múltiples archivos en batch
 *
 * @param files - Array de archivos con { name, buffer, size }
 * @returns Array de ParsedExam
 */
export async function parseExamFiles(
  files: Array<{ name: string; buffer: Buffer; size: number }>
): Promise<ParsedExam[]> {
  const results: ParsedExam[] = [];

  for (const file of files) {
    try {
      const parsed = await parseExamFile(file.name, file.buffer, file.size);
      results.push(parsed);
    } catch (error) {
      // Log error pero continuar con el siguiente archivo
      console.error(`Error parseando ${file.name}:`, error);
      // Aquí podrías agregar el error a un array de errores si quieres retornarlos
    }
  }

  return results;
}
