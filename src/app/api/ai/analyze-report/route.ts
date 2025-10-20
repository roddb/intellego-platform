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

    console.log('📚 Retrieved report data', {
      studentId: progressReport.studentId,
      studentName: progressReport.studentName,
      subject: progressReport.subject,
      answersCount: answers.length
    });

    // 8. Call Claude API for analysis
    const analysisResult = await analyzer.analyzeAnswers(
      answers,
      progressReport.subject,
      body.rubric,
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
      description: 'Analiza reportes semanales usando Claude Haiku 4.5',
      version: '1.0',
      endpoints: {
        POST: {
          description: 'Analizar un reporte semanal',
          path: '/api/ai/analyze-report',
          method: 'POST',
          authentication: 'Required (INSTRUCTOR role)',
          requestBody: {
            progressReportId: {
              type: 'string',
              required: true,
              description: 'ID del reporte a analizar'
            },
            rubric: {
              type: 'string',
              required: false,
              description: 'Rúbrica específica para evaluación (opcional)'
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
                completeness: 'number (0-100)',
                clarity: 'number (0-100)',
                reflection: 'number (0-100)',
                progress: 'number (0-100)',
                engagement: 'number (0-100)'
              }
            },
            metadata: 'object'
          },
          example: {
            request: {
              progressReportId: 'cm4abc123...',
              rubric: 'Evaluar: 1) Claridad, 2) Reflexión, 3) Progreso',
              options: {
                format: 'structured'
              }
            },
            response: {
              success: true,
              feedbackId: 'cm4xyz789...',
              analysis: {
                score: 85,
                generalComments: 'Excelente progreso esta semana...',
                strengths: '- Respuestas claras y detalladas\n- Buena reflexión...',
                improvements: '- Trabajar en la profundidad...',
                skillsMetrics: {
                  completeness: 90,
                  clarity: 85,
                  reflection: 80,
                  progress: 85,
                  engagement: 90
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
