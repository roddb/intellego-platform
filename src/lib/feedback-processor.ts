import {
  validateFeedbackData,
  createFeedback,
  updateFeedback,
  feedbackExists,
  getFeedbackByStudentWeekSubject,
  findUserByEmail,
  createFeedbackWithMetrics
} from './db-operations';

// Type definitions for the feedback JSON structure
export interface FeedbackJSON {
  metadata: {
    instructor: string;
    generated_at: string;
    version?: string;
    academic_year?: string;
  };
  feedbacks: FeedbackEntry[];
}

export interface FeedbackEntry {
  student_email: string;
  student_id: string;
  week_start: string;
  subject: string;
  feedback: {
    score?: number;
    general_comments?: string;
    strengths?: string[];
    improvements?: string[];
    ai_analysis?: string;
    skills_metrics?: {
      comprehension: number;        // Comprensión Conceptual (0-100)
      critical_thinking: number;     // Pensamiento Crítico (0-100)
      self_regulation: number;       // Autorregulación (0-100)
      practical_application: number; // Aplicación Práctica (0-100)
      metacognition: number;         // Reflexión Metacognitiva (0-100)
    };
  };
}

export interface ProcessingResult {
  success: boolean;
  processed: number;
  errors: ProcessingError[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    updated: number;
    created: number;
  };
}

export interface ProcessingError {
  studentEmail: string;
  studentId: string;
  week: string;
  subject: string;
  error: string;
}

/**
 * Validate the JSON structure
 */
export function validateJSONStructure(data: any): { valid: boolean; error?: string } {
  try {
    // Check basic structure
    if (!data.metadata || typeof data.metadata !== 'object') {
      return { valid: false, error: 'Missing or invalid metadata object' };
    }
    
    if (!data.metadata.instructor || typeof data.metadata.instructor !== 'string') {
      return { valid: false, error: 'Missing or invalid instructor email in metadata' };
    }
    
    if (!data.feedbacks || !Array.isArray(data.feedbacks)) {
      return { valid: false, error: 'Missing or invalid feedbacks array' };
    }
    
    if (data.feedbacks.length === 0) {
      return { valid: false, error: 'Feedbacks array is empty' };
    }
    
    // Validate each feedback entry
    for (let i = 0; i < data.feedbacks.length; i++) {
      const entry = data.feedbacks[i];
      
      if (!entry.student_email || typeof entry.student_email !== 'string') {
        return { valid: false, error: `Invalid student_email in feedback entry ${i + 1}` };
      }
      
      if (!entry.student_id || typeof entry.student_id !== 'string') {
        return { valid: false, error: `Invalid student_id in feedback entry ${i + 1}` };
      }
      
      if (!entry.week_start || typeof entry.week_start !== 'string') {
        return { valid: false, error: `Invalid week_start in feedback entry ${i + 1}` };
      }
      
      if (!entry.subject || typeof entry.subject !== 'string') {
        return { valid: false, error: `Invalid subject in feedback entry ${i + 1}` };
      }
      
      if (!entry.feedback || typeof entry.feedback !== 'object') {
        return { valid: false, error: `Invalid feedback object in entry ${i + 1}` };
      }
      
      // Validate feedback content types
      const fb = entry.feedback;
      if (fb.score !== undefined && fb.score !== null && (typeof fb.score !== 'number' || fb.score < 0 || fb.score > 100)) {
        return { valid: false, error: `Invalid score in feedback entry ${i + 1}. Must be between 0-100 or null for absent students` };
      }
      
      if (fb.strengths && !Array.isArray(fb.strengths)) {
        return { valid: false, error: `Invalid strengths array in feedback entry ${i + 1}` };
      }
      
      if (fb.improvements && !Array.isArray(fb.improvements)) {
        return { valid: false, error: `Invalid improvements array in feedback entry ${i + 1}` };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON structure: ' + (error as Error).message };
  }
}

// Batch size for processing
const BATCH_SIZE = 50;

/**
 * Process the feedback JSON file with batch processing
 */
export async function processFeedbackJSON(
  jsonData: FeedbackJSON,
  instructorId: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: false,
    processed: 0,
    errors: [],
    summary: {
      total: jsonData.feedbacks.length,
      successful: 0,
      failed: 0,
      updated: 0,
      created: 0
    }
  };
  
  try {
    // Verify instructor exists and matches
    const instructor = await findUserByEmail(jsonData.metadata.instructor);
    if (!instructor || instructor.id !== instructorId) {
      result.errors.push({
        studentEmail: '',
        studentId: '',
        week: '',
        subject: '',
        error: 'Instructor email in JSON does not match logged-in instructor'
      });
      return result;
    }
    
    // Process feedbacks in batches for better performance
    const batches = [];
    for (let i = 0; i < jsonData.feedbacks.length; i += BATCH_SIZE) {
      batches.push(jsonData.feedbacks.slice(i, i + BATCH_SIZE));
    }
    
    // Process each batch
    for (const batch of batches) {
      const batchPromises = batch.map(async (entry) => {
        try {
          // Validate the student and report data
          const validation = await validateFeedbackData(
            entry.student_email,
            entry.student_id,
            entry.week_start,
            entry.subject
          );
          
          if (!validation.valid) {
            return {
              success: false,
              entry,
              error: validation.error || 'Validation failed'
            };
          }
          
          const studentUserId = validation.userId!;
          
          // Check if feedback already exists
          const existingFeedback = await getFeedbackByStudentWeekSubject(
            studentUserId,
            entry.week_start,
            entry.subject
          );
          
          // Prepare feedback data
          const feedbackData = {
            studentId: studentUserId,
            weekStart: entry.week_start,
            subject: entry.subject,
            score: entry.feedback.score,
            generalComments: entry.feedback.general_comments,
            strengths: entry.feedback.strengths,
            improvements: entry.feedback.improvements,
            aiAnalysis: entry.feedback.ai_analysis,
            createdBy: instructorId
          };
          
          // Prepare skills metrics if provided
          const skillsMetrics = entry.feedback.skills_metrics ? {
            comprehension: entry.feedback.skills_metrics.comprehension,
            criticalThinking: entry.feedback.skills_metrics.critical_thinking,
            selfRegulation: entry.feedback.skills_metrics.self_regulation,
            practicalApplication: entry.feedback.skills_metrics.practical_application,
            metacognition: entry.feedback.skills_metrics.metacognition
          } : undefined;
          
          if (existingFeedback) {
            // For now, update with new data (overwrite)
            // In future, could merge or version control
            await updateFeedback(existingFeedback.id, feedbackData);
            return {
              success: true,
              entry,
              action: 'updated'
            };
          } else {
            // Create new feedback with metrics if available
            if (skillsMetrics) {
              await createFeedbackWithMetrics({
                ...feedbackData,
                skillsMetrics
              });
            } else {
              await createFeedback(feedbackData);
            }
            return {
              success: true,
              entry,
              action: 'created'
            };
          }
        } catch (error) {
          return {
            success: false,
            entry,
            error: `Processing error: ${(error as Error).message}`
          };
        }
      });
      
      // Wait for all promises in this batch to settle
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          const res = promiseResult.value;
          if (res.success) {
            result.processed++;
            result.summary.successful++;
            if (res.action === 'created') {
              result.summary.created++;
            } else if (res.action === 'updated') {
              result.summary.updated++;
            }
          } else {
            result.errors.push({
              studentEmail: res.entry.student_email,
              studentId: res.entry.student_id,
              week: res.entry.week_start,
              subject: res.entry.subject,
              error: res.error || 'Unknown error'
            });
            result.summary.failed++;
          }
        } else {
          // Promise rejected
          result.summary.failed++;
        }
      }
    }
    
    result.success = result.summary.successful > 0;
    return result;
    
  } catch (error) {
    result.errors.push({
      studentEmail: '',
      studentId: '',
      week: '',
      subject: '',
      error: `Fatal error: ${(error as Error).message}`
    });
    return result;
  }
}

/**
 * Generate a sample feedback JSON for testing
 */
export function generateSampleFeedbackJSON(): FeedbackJSON {
  return {
    metadata: {
      instructor: "instructor@demo.com",
      generated_at: new Date().toISOString(),
      version: "1.0",
      academic_year: "2025"
    },
    feedbacks: [
      {
        student_email: "estudiante@demo.com",
        student_id: "EST-2025-001",
        week_start: "2025-01-06",
        subject: "Física",
        feedback: {
          score: 85,
          general_comments: "Excelente comprensión de los conceptos fundamentales de cinemática. El estudiante demuestra un buen manejo de las ecuaciones de movimiento.",
          strengths: [
            "Análisis detallado de problemas",
            "Correcta aplicación de fórmulas",
            "Buena comprensión conceptual"
          ],
          improvements: [
            "Revisar unidades de medida",
            "Mejorar la presentación de resultados",
            "Incluir más diagramas explicativos"
          ],
          ai_analysis: "El estudiante muestra un progreso consistente en la comprensión de conceptos físicos. Se recomienda reforzar el análisis dimensional y la interpretación gráfica de resultados.",
          skills_metrics: {
            comprehension: 85,        // Comprensión Conceptual
            critical_thinking: 75,     // Pensamiento Crítico  
            self_regulation: 80,       // Autorregulación
            practical_application: 70, // Aplicación Práctica
            metacognition: 82         // Reflexión Metacognitiva
          }
        }
      },
      {
        student_email: "estudiante@demo.com",
        student_id: "EST-2025-001",
        week_start: "2025-01-06",
        subject: "Química",
        feedback: {
          score: 92,
          general_comments: "Excelente trabajo en estequiometría y balanceo de ecuaciones químicas.",
          strengths: [
            "Dominio de nomenclatura química",
            "Cálculos precisos",
            "Buena interpretación de reacciones"
          ],
          improvements: [
            "Profundizar en química orgánica",
            "Practicar más problemas de pH"
          ],
          ai_analysis: "Rendimiento sobresaliente en química inorgánica. El estudiante está listo para avanzar a temas más complejos.",
          skills_metrics: {
            comprehension: 92,        // Comprensión Conceptual
            critical_thinking: 88,     // Pensamiento Crítico  
            self_regulation: 90,       // Autorregulación
            practical_application: 85, // Aplicación Práctica
            metacognition: 91         // Reflexión Metacognitiva
          }
        }
      }
    ]
  };
}