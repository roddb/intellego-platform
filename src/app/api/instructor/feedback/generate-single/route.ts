import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logDataAccess, logUnauthorizedAccess, logRoleViolation } from '@/lib/security-logger';
import queueManager from '@/services/ai/feedback-queue-manager';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute (single report should be fast)

/**
 * POST /api/instructor/feedback/generate-single
 *
 * Genera feedback AI para UN SOLO reporte de forma manual
 * Usado para testing y validación granular de la calidad del feedback
 *
 * Request Body:
 * {
 *   "reportId": "cm3abc123..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "result": {
 *     "reportId": "cm3abc123...",
 *     "cost": 0.005,
 *     "latencyMs": 5234,
 *     "feedbackId": "uuid-...",
 *     "score": 85
 *   }
 * }
 *
 * OR on error:
 * {
 *   "success": false,
 *   "error": "Error message"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/feedback/generate-single');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check instructor role
    if (session.user.role !== 'INSTRUCTOR') {
      logRoleViolation(
        'INSTRUCTOR',
        session.user.role || 'unknown',
        '/api/instructor/feedback/generate-single',
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    let body: { reportId?: string } = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 4. Validate reportId
    if (!body.reportId || typeof body.reportId !== 'string') {
      return NextResponse.json(
        { error: 'reportId is required and must be a string' },
        { status: 400 }
      );
    }

    const { reportId } = body;

    // 5. Log access
    logDataAccess(
      'single-feedback-generate',
      '/api/instructor/feedback/generate-single',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown',
      { reportId }
    );

    console.log('🤖 Manual single feedback generation requested', {
      instructor: session.user.email,
      reportId
    });

    // 6. Process the single report using queue manager
    const result = await queueManager.processReports(
      [reportId],
      {
        maxConcurrent: 1,
        retryAttempts: 3,
        instructorId: session.user.id
      }
    );

    const totalTime = Date.now() - startTime;

    // 7. Check if successful
    if (result.successful === 1) {
      console.log('✅ Single report processed successfully', {
        reportId,
        cost: `$${result.totalCost.toFixed(6)}`,
        time: `${totalTime}ms`,
        instructor: session.user.email
      });

      return NextResponse.json({
        success: true,
        result: {
          reportId,
          cost: result.totalCost,
          latencyMs: totalTime,
          message: 'Feedback generado exitosamente'
        }
      });
    } else {
      // Failed to process
      const error = result.errors[0];
      console.error('❌ Failed to process single report', {
        reportId,
        error: error?.error,
        time: `${totalTime}ms`
      });

      return NextResponse.json({
        success: false,
        error: error?.error || 'Failed to generate feedback'
      }, { status: 500 });
    }

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('❌ Error in single feedback generation:', {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    );
  }
}
