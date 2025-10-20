import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logDataAccess, logUnauthorizedAccess, logRoleViolation } from '@/lib/security-logger';
import analyzer from '@/services/ai/claude/analyzer';
import {
  getProgressReportAnswers,
  getProgressReportWithStudent,
  createAIFeedback
} from '@/lib/db-operations';

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';

/**
 * POST /api/ai/analyze-report
 *
 * Analiza un reporte semanal usando Claude Haiku 4.5 y genera feedback estructurado
 *
 * Request Body:
 * {
 *   "progressReportId": "string",
 *   "rubric": "string (optional)",
 *   "options": {
 *     "maxTokens": number,
 *     "temperature": number,
 *     "format": "structured" | "narrative"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/ai/analyze-report');
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    // 2. Check instructor role
    if (session.user.role !== 'INSTRUCTOR') {
      logRoleViolation(
        'INSTRUCTOR',
        session.user.role || 'unknown',
        '/api/ai/analyze-report',
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    let body: {
      progressReportId: string;
      fase?: 1 | 2 | 3 | 4;  // Fase metodológica (1-4) - NUEVO
      rubric?: string;
      options?: {
        maxTokens?: number;
        temperature?: number;
        format?: 'structured' | 'narrative';
      };
    };

    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }

    // 4. Validate required fields
    if (!body.progressReportId) {
      return NextResponse.json(
        { error: 'Missing required field: progressReportId' },
        { status: 400 }
      );
    }

    // Validate fase if provided
    if (body.fase && ![1, 2, 3, 4].includes(body.fase)) {
      return NextResponse.json(
        { error: 'Invalid fase. Must be 1, 2, 3, or 4' },
        { status: 400 }
      );
    }

    // 5. Log data access
    logDataAccess(
      'ai-analyze-report',
      '/api/ai/analyze-report',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown',
      { progressReportId: body.progressReportId }
    );

    console.log('🤖 AI analysis requested', {
      progressReportId: body.progressReportId,
      instructor: session.user.email,
      hasRubric: !!body.rubric
    });

    // 6. Get progress report details
    const progressReport = await getProgressReportWithStudent(body.progressReportId);

    if (!progressReport) {
      return NextResponse.json(
        { error: 'Progress report not found' },
        { status: 404 }
      );
    }

    // 7. Get answers for the progress report
    const answers = await getProgressReportAnswers(body.progressReportId);

    if (answers.length === 0) {
      return NextResponse.json(
        { error: 'No answers found for this progress report' },
        { status: 404 }
      );
    }

    // TODO: Implementar detección automática de fase desde DB
    // Por ahora, se usa fase del request o Fase 2 como default
    const fase = (body.fase || 2) as 1 | 2 | 3 | 4;

    console.log('📚 Retrieved report data', {
      studentId: progressReport.studentId,
      studentName: progressReport.studentName,
      subject: progressReport.subject,
      answersCount: answers.length,
      fase: fase
    });

    // 8. Call Claude API for analysis (INTEGRACIÓN DE RÚBRICAS)
    const analysisResult = await analyzer.analyzeAnswers(
      answers,
      progressReport.subject,
      fase,  // ← Ahora usa fase en vez de rubric
      body.options?.format || 'structured'
    );

    // 9. Save feedback to database
    const feedbackId = await createAIFeedback({
      studentId: progressReport.studentId,
      progressReportId: body.progressReportId,
      weekStart: progressReport.weekStart,
      subject: progressReport.subject,
      score: analysisResult.score,
      generalComments: analysisResult.generalComments,
      strengths: analysisResult.strengths,
      improvements: analysisResult.improvements,
      aiAnalysis: analysisResult.rawAnalysis,
      skillsMetrics: analysisResult.skillsMetrics,
      createdBy: session.user.id
    });

    const totalTime = Date.now() - startTime;

    console.log('✅ AI analysis completed successfully', {
      feedbackId: feedbackId.id,
      score: analysisResult.score,
      totalTime: `${totalTime}ms`,
      instructor: session.user.email
    });

    // 10. Return results
    return NextResponse.json({
      success: true,
      feedbackId: feedbackId.id,
      analysis: {
        score: analysisResult.score,
        generalComments: analysisResult.generalComments,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        skillsMetrics: analysisResult.skillsMetrics
      },
      metadata: {
        progressReportId: body.progressReportId,
        studentId: progressReport.studentId,
        studentName: progressReport.studentName,
        subject: progressReport.subject,
        weekStart: progressReport.weekStart,
        createdAt: feedbackId.createdAt,
        totalProcessingTime: totalTime
      }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('❌ Error in AI analysis API:', {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });

    // Handle specific error types
    if (error.message?.includes('Claude API error')) {
      return NextResponse.json(
        {
          error: 'AI service error',
          message: 'Failed to analyze report using AI. Please try again.',
          details: error.message
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/analyze-report
 *
 * Get API documentation and usage examples
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' },
        { status: 403 }
      );
    }

    // Return API documentation
    return NextResponse.json({
      name: 'AI Report Analysis API',
      description: 'Analiza reportes semanales usando Claude Haiku 4.5 con Sistema de Rúbricas Oficial',
      version: '2.0',  // Actualizado con integración de rúbricas
      endpoints: {
        POST: {
          description: 'Analizar un reporte semanal con rúbricas metodológicas (4 fases)',
          path: '/api/ai/analyze-report',
          method: 'POST',
          authentication: 'Required (INSTRUCTOR role)',
          requestBody: {
            progressReportId: {
              type: 'string',
              required: true,
              description: 'ID del reporte a analizar'
            },
            fase: {
              type: 'number',
              enum: [1, 2, 3, 4],
              required: false,
              default: 2,
              description: 'Fase metodológica de pensamiento crítico (1: Identificación, 2: Variables, 3: Herramientas, 4: Ejecución)'
            },
            rubric: {
              type: 'string',
              required: false,
              description: 'DEPRECATED - Se usa rúbrica oficial según fase'
            },
            options: {
              type: 'object',
              required: false,
              properties: {
                maxTokens: {
                  type: 'number',
                  default: 1500,
                  description: 'Máximo de tokens para la respuesta'
                },
                temperature: {
                  type: 'number',
                  default: 0.1,
                  description: 'Temperature de Claude (0-1)'
                },
                format: {
                  type: 'string',
                  enum: ['structured', 'narrative'],
                  default: 'structured',
                  description: 'Formato del feedback'
                }
              }
            }
          },
          response: {
            success: 'boolean',
            feedbackId: 'string',
            analysis: {
              score: 'number (0-100)',
              generalComments: 'string',
              strengths: 'string',
              improvements: 'string',
              skillsMetrics: {
                comprehension: 'number (0-100) - Capacidad de entender conceptos',
                criticalThinking: 'number (0-100) - Análisis sistemático',
                selfRegulation: 'number (0-100) - Gestión del aprendizaje',
                practicalApplication: 'number (0-100) - Uso efectivo de herramientas',
                metacognition: 'number (0-100) - Reflexión sobre pensamiento'
              }
            },
            metadata: 'object'
          },
          example: {
            request: {
              progressReportId: 'cm4abc123...',
              fase: 2,
              options: {
                format: 'structured'
              }
            },
            response: {
              success: true,
              feedbackId: 'cm4xyz789...',
              analysis: {
                score: 79,
                generalComments: 'Excelente progreso en identificación de variables...',
                strengths: '- Identifica mayoría de variables importantes\n- Clasificación correcta\n- Buena integración F1+F2...',
                improvements: '- Mejorar clasificación de variables controlables\n- Profundizar en relaciones entre variables...',
                skillsMetrics: {
                  comprehension: 84,
                  criticalThinking: 77,
                  selfRegulation: 70,
                  practicalApplication: 86,
                  metacognition: 69
                }
              }
            }
          }
        }
      },
      costEstimate: {
        perAnalysis: '$0.005 - $0.015',
        monthlyProjection: '$10 - $30 (200-600 reportes)',
        notes: 'Costos dependen de la longitud de respuestas'
      },
      technicalDetails: {
        model: 'claude-haiku-4-5',
        temperature: 0.1,
        maxTokens: 1500,
        timeout: '60 seconds',
        retries: 3
      }
    });

  } catch (error) {
    console.error('Error in AI analysis API documentation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
