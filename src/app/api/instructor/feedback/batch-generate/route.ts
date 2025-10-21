import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logDataAccess, logUnauthorizedAccess, logRoleViolation } from '@/lib/security-logger';
import queueManager from '@/services/ai/feedback-queue-manager';
import { getPendingReportsForFeedback, countPendingReportsBySubject, getPendingReportsWithDetails } from '@/lib/db-operations';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes (for large batches)

/**
 * POST /api/instructor/feedback/batch-generate
 *
 * Genera feedback AI para múltiples reportes de forma manual
 * Usado como backup cuando el cron falla o para procesamiento urgente
 *
 * Request Body:
 * {
 *   "filters": {
 *     "subject"?: "Física" | "Química",
 *     "weekStart"?: "2025-10-14",
 *     "limit"?: 50
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "result": {
 *     "total": 47,
 *     "successful": 45,
 *     "failed": 2,
 *     "failedReports": [
 *       { "reportId": "...", "error": "..." }
 *     ],
 *     "totalCost": 0.235,
 *     "totalTimeMs": 127340
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/feedback/batch-generate');
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
        '/api/instructor/feedback/batch-generate',
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
      filters?: {
        subject?: 'Física' | 'Química';
        weekStart?: string;
        limit?: number;
      };
    } = {};

    try {
      body = await request.json();
    } catch {
      // Empty body is OK - process all pending reports
    }

    // 4. Validate filters
    if (body.filters?.subject && !['Física', 'Química'].includes(body.filters.subject)) {
      return NextResponse.json(
        { error: 'Invalid subject. Must be "Física" or "Química"' },
        { status: 400 }
      );
    }

    if (body.filters?.limit && (body.filters.limit < 1 || body.filters.limit > 100)) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be between 1 and 100' },
        { status: 400 }
      );
    }

    // 5. Log access
    logDataAccess(
      'batch-feedback-generate',
      '/api/instructor/feedback/batch-generate',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown'
    );

    console.log('🤖 Manual batch feedback generation requested', {
      instructor: session.user.email,
      filters: body.filters
    });

    // 6. Get pending reports
    const pendingReports = await getPendingReportsForFeedback(body.filters);

    if (pendingReports.length === 0) {
      console.log('ℹ️ No pending reports to process');
      return NextResponse.json({
        success: true,
        message: 'No pending reports to process',
        result: {
          total: 0,
          successful: 0,
          failed: 0,
          failedReports: [],
          totalCost: 0,
          totalTimeMs: 0
        }
      });
    }

    console.log(`📊 Found ${pendingReports.length} pending reports to process`);

    // 7. Process reports with queue manager
    const result = await queueManager.processReports(
      pendingReports.map(r => r.id),
      {
        maxConcurrent: 5,
        retryAttempts: 3,
        instructorId: session.user.id,
        onProgress: (current, total) => {
          console.log(`⏳ Processing ${current}/${total}...`);
        }
      }
    );

    const totalTime = Date.now() - startTime;

    console.log('✅ Batch feedback generation completed', {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      totalCost: `$${result.totalCost.toFixed(4)}`,
      totalTime: `${totalTime}ms`,
      instructor: session.user.email
    });

    // 8. Return results
    return NextResponse.json({
      success: true,
      result: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        failedReports: result.errors.map(e => ({
          reportId: e.reportId,
          error: e.error
        })),
        totalCost: result.totalCost,
        totalTimeMs: totalTime
      }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('❌ Error in batch feedback generation:', {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instructor/feedback/batch-generate
 *
 * Obtiene información sobre reportes pendientes sin generar feedback
 * Si se proporciona el parámetro "subject", devuelve la lista detallada de reportes
 *
 * Query Parameters:
 * - subject?: "Física" | "Química" - Obtener detalles de reportes por materia
 *
 * Response (sin parámetros):
 * {
 *   "pendingReports": {
 *     "Física": 23,
 *     "Química": 24,
 *     "total": 47
 *   }
 * }
 *
 * Response (con subject=Física):
 * {
 *   "pendingReports": {
 *     "Física": 23,
 *     "Química": 24,
 *     "total": 47
 *   },
 *   "details": [
 *     {
 *       "id": "...",
 *       "studentName": "Juan Pérez",
 *       "division": "5to A",
 *       "academicYear": "2025",
 *       "weekStart": "2025-10-14",
 *       "submittedAt": "2025-10-18T..."
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    // 3. Validate subject if provided
    if (subject && !['Física', 'Química'].includes(subject)) {
      return NextResponse.json(
        { error: 'Invalid subject. Must be "Física" or "Química"' },
        { status: 400 }
      );
    }

    // 4. Get pending reports count
    const counts = await countPendingReportsBySubject();

    // 5. If subject specified, get detailed list
    if (subject) {
      const details = await getPendingReportsWithDetails(subject);

      return NextResponse.json({
        pendingReports: counts,
        details: details.map(d => ({
          id: d.id,
          studentName: d.studentName,
          studentId: d.studentId,
          division: d.division,
          academicYear: d.academicYear,
          sede: d.sede,
          weekStart: d.weekStart,
          weekEnd: d.weekEnd,
          submittedAt: d.submittedAt
        }))
      });
    }

    // 6. Return info (without details)
    return NextResponse.json({
      pendingReports: counts,
      endpoint: '/api/instructor/feedback/batch-generate',
      method: 'POST',
      description: 'Generate AI feedback for pending reports',
      filters: {
        subject: {
          type: 'string',
          enum: ['Física', 'Química'],
          description: 'Filter by subject'
        },
        weekStart: {
          type: 'string',
          description: 'Filter by week start date (e.g., "2025-10-14")'
        },
        limit: {
          type: 'number',
          min: 1,
          max: 100,
          description: 'Maximum number of reports to process'
        }
      },
      costEstimate: {
        perReport: '$0.005',
        example: `${counts.total} reports × $0.005 = $${(counts.total * 0.005).toFixed(2)}`
      }
    });

  } catch (error: any) {
    console.error('Error getting pending reports info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
