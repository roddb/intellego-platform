import {
  validateFeedbackData,
  createFeedback,
  updateFeedback,
  feedbackExists,
  findUserByEmail
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

/**
 * Process the feedback JSON file
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
    
    // Process each feedback entry
    for (const entry of jsonData.feedbacks) {
      try {
        // Validate the student and report data
        const validation = await validateFeedbackData(
          entry.student_email,
          entry.student_id,
          entry.week_start,
          entry.subject
        );
        
        if (!validation.valid) {
          result.errors.push({
            studentEmail: entry.student_email,
            studentId: entry.student_id,
            week: entry.week_start,
            subject: entry.subject,
            error: validation.error || 'Validation failed'
          });
          result.summary.failed++;
          continue;
        }
        
        const studentUserId = validation.userId!;
        
        // Check if feedback already exists
        const exists = await feedbackExists(
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
        
        if (exists) {
          // Update existing feedback
          // Note: In a real implementation, you might want to get the existing ID first
          // For now, we'll skip updates to avoid complexity
          result.errors.push({
            studentEmail: entry.student_email,
            studentId: entry.student_id,
            week: entry.week_start,
            subject: entry.subject,
            error: 'Feedback already exists for this week. Updates not implemented yet.'
          });
          result.summary.failed++;
        } else {
          // Create new feedback
          await createFeedback(feedbackData);
          result.summary.created++;
          result.summary.successful++;
        }
        
        result.processed++;
        
      } catch (error) {
        result.errors.push({
          studentEmail: entry.student_email,
          studentId: entry.student_id,
          week: entry.week_start,
          subject: entry.subject,
          error: `Processing error: ${(error as Error).message}`
        });
        result.summary.failed++;
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
          ai_analysis: "El estudiante muestra un progreso consistente en la comprensión de conceptos físicos. Se recomienda reforzar el análisis dimensional y la interpretación gráfica de resultados."
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
          ai_analysis: "Rendimiento sobresaliente en química inorgánica. El estudiante está listo para avanzar a temas más complejos."
        }
      }
    ]
  };
}