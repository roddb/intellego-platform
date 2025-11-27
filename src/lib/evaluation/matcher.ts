import { query } from "@/lib/db";
import type { MatchResult } from "./types";
import { EvaluationError, ErrorCodes } from "./types";
import { normalizeApellido } from "./parser";

/**
 * Matcher de estudiantes por apellido
 *
 * Responsabilidades:
 * 1. Buscar estudiantes en DB por apellido
 * 2. Fuzzy matching para tolerar variaciones
 * 3. Threshold de similitud (90%)
 */

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * (número mínimo de operaciones para transformar s1 en s2)
 *
 * @param s1 - Primer string
 * @param s2 - Segundo string
 * @returns Distancia de Levenshtein
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  // Crear matriz de distancias
  const matrix: number[][] = [];

  // Inicializar primera fila y columna
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calcular distancias
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Eliminación
        matrix[i][j - 1] + 1, // Inserción
        matrix[i - 1][j - 1] + cost // Sustitución
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcula el porcentaje de similitud entre dos strings
 *
 * @param s1 - Primer string
 * @param s2 - Segundo string
 * @returns Porcentaje de similitud (0-100)
 */
function calculateSimilarity(s1: string, s2: string): number {
  const normalized1 = normalizeApellido(s1);
  const normalized2 = normalizeApellido(s2);

  if (normalized1 === normalized2) {
    return 100;
  }

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  if (maxLength === 0) {
    return 0;
  }

  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, Math.min(100, similarity));
}

/**
 * Busca un estudiante en la DB por apellido
 *
 * Proceso:
 * 1. Query DB para estudiantes activos (role=STUDENT, status=ACTIVE)
 * 2. Filtrar por apellido usando LIKE (búsqueda flexible)
 * 3. Calcular similitud con fuzzy matching
 * 4. Seleccionar el match con mayor similitud
 * 5. Validar que cumpla threshold (90%)
 *
 * @param apellido - Apellido del estudiante (del filename)
 * @param threshold - Umbral de similitud mínimo (default: 90)
 * @returns MatchResult con estudiante y confianza
 */
/**
 * Contexto de búsqueda para filtrar estudiantes
 */
export interface MatchContext {
  materia: string;
  division: string;
  anioAcademico: string;
  sede: string;
}

/**
 * Busca un estudiante por apellido con filtro de contexto
 *
 * @param apellido - Apellido del estudiante
 * @param context - Contexto opcional para filtrar estudiantes
 * @param threshold - Umbral de similitud mínimo (default: 90)
 * @returns MatchResult con estudiante y confianza
 */
export async function matchStudent(
  apellido: string,
  threshold: number = 90,
  context?: MatchContext
): Promise<MatchResult> {
  try {
    // Normalizar apellido para búsqueda
    const normalizedApellido = normalizeApellido(apellido);

    // Construir query con o sin contexto
    let queryStr = `SELECT id, name, academicYear, division
                    FROM User
                    WHERE role = ? AND status = ?`;
    const params: any[] = ["STUDENT", "ACTIVE"];

    // Agregar filtros de contexto si están presentes
    if (context) {
      if (context.division) {
        queryStr += ` AND division = ?`;
        params.push(context.division);
      }
      if (context.anioAcademico) {
        queryStr += ` AND academicYear = ?`;
        params.push(context.anioAcademico);
      }
      if (context.sede) {
        queryStr += ` AND sede = ?`;
        params.push(context.sede);
      }
      // Special case: Biofísica uses CONSUDEC students (sede-based, not subject-based)
      // COSUDEC students may have empty subjects field, so we skip subject filter for Biofísica
      if (context.materia && context.materia !== 'Biofísica') {
        queryStr += ` AND subjects LIKE ?`;
        params.push(`%${context.materia}%`);
      }
    }

    // Query DB: buscar estudiantes activos (con contexto)
    const result = await query(queryStr, params);

    if (!result.rows || result.rows.length === 0) {
      throw new EvaluationError(
        ErrorCodes.STUDENT_NOT_FOUND,
        context
          ? `No hay estudiantes activos en ${context.division} - ${context.materia}`
          : "No hay estudiantes activos en la base de datos"
      );
    }

    // Calcular similitud para cada estudiante
    const matches = result.rows.map((student: any) => {
      const studentName = student.name || "";
      const similarities: number[] = [];

      // Estrategia 1: Si tiene coma, formato "Apellido, Nombre"
      if (studentName.includes(",")) {
        const studentApellido = studentName.split(",")[0]?.trim();
        if (studentApellido) {
          similarities.push(calculateSimilarity(apellido, studentApellido));
        }
      } else {
        // Estrategia 2: Sin coma, puede ser "Nombre Apellido" o "Apellido Nombre"
        const parts = studentName.split(/\s+/);

        // Comparar con cada parte individual
        parts.forEach((part: string) => {
          similarities.push(calculateSimilarity(apellido, part));
        });

        // Comparar con últimas 1-2 palabras (probables apellidos)
        if (parts.length >= 2) {
          const lastWord = parts[parts.length - 1];
          const lastTwoWords = parts.slice(-2).join(" ");
          similarities.push(calculateSimilarity(apellido, lastWord));
          similarities.push(calculateSimilarity(apellido, lastTwoWords));
        }

        // Comparar con primeras 1-2 palabras (por si acaso)
        if (parts.length >= 2) {
          const firstWord = parts[0];
          const firstTwoWords = parts.slice(0, 2).join(" ");
          similarities.push(calculateSimilarity(apellido, firstWord));
          similarities.push(calculateSimilarity(apellido, firstTwoWords));
        }
      }

      // Estrategia 3: Comparar con nombre completo (sin coma)
      const studentFullName = studentName.replace(/,\s*/g, " ").trim();
      similarities.push(calculateSimilarity(apellido, studentFullName));

      // Usar la MEJOR similitud encontrada
      const similarity = Math.max(...similarities);

      return {
        student: {
          id: student.id,
          name: studentName,
          academicYear: student.academicYear || "",
          division: student.division || "",
        },
        matchConfidence: similarity,
      };
    });

    // Ordenar por similitud (mayor a menor)
    matches.sort((a, b) => b.matchConfidence - a.matchConfidence);

    // Seleccionar el mejor match
    const bestMatch = matches[0];

    if (!bestMatch) {
      throw new EvaluationError(
        ErrorCodes.STUDENT_NOT_FOUND,
        "No se pudo calcular similitud con ningún estudiante"
      );
    }

    // Validar threshold
    if (bestMatch.matchConfidence < threshold) {
      throw new EvaluationError(
        ErrorCodes.STUDENT_NOT_FOUND,
        `No se encontró estudiante con apellido similar a "${apellido}"`,
        `Mejor match: "${bestMatch.student.name}" con ${bestMatch.matchConfidence.toFixed(1)}% de similitud (threshold: ${threshold}%)`
      );
    }

    return bestMatch;
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }

    throw new EvaluationError(
      ErrorCodes.STUDENT_NOT_FOUND,
      "Error al buscar estudiante en la base de datos",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Busca múltiples estudiantes en batch
 *
 * @param apellidos - Array de apellidos
 * @param threshold - Umbral de similitud mínimo (default: 90)
 * @returns Array de MatchResult (solo matches exitosos)
 */
export async function matchStudents(
  apellidos: string[],
  threshold: number = 90
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  for (const apellido of apellidos) {
    try {
      const match = await matchStudent(apellido, threshold);
      results.push(match);
    } catch (error) {
      // Log error pero continuar con el siguiente
      console.error(`Error matching apellido "${apellido}":`, error);
      // Aquí podrías agregar el error a un array de errores si quieres retornarlos
    }
  }

  return results;
}

/**
 * Valida que un studentId existe y está activo
 *
 * @param studentId - ID del estudiante
 * @returns Student si existe y está activo
 */
export async function validateStudent(studentId: string): Promise<MatchResult> {
  try {
    const result = await query(
      `SELECT id, name, academicYear, division
       FROM User
       WHERE id = ? AND role = ? AND status = ?
       LIMIT 1`,
      [studentId, "STUDENT", "ACTIVE"]
    );

    const student = result.rows.length > 0 ? result.rows[0] : null;

    if (!student) {
      throw new EvaluationError(
        ErrorCodes.STUDENT_NOT_FOUND,
        `Estudiante no encontrado o inactivo: ${studentId}`
      );
    }

    return {
      student: {
        id: student.id as string,
        name: (student.name as string) || "",
        academicYear: (student.academicYear as string) || "",
        division: (student.division as string) || "",
      },
      matchConfidence: 100, // 100% porque es match exacto por ID
    };
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }

    throw new EvaluationError(
      ErrorCodes.STUDENT_NOT_FOUND,
      "Error al validar estudiante",
      error instanceof Error ? error.message : String(error)
    );
  }
}
