import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logDataAccess, logUnauthorizedAccess, logRoleViolation } from '@/lib/security-logger';
import queueManager from '@/services/ai/feedback-queue-manager';
import { countPendingReportsBySubject, getPendingReportsWithDetails } from '@/lib/db-operations';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes (Vercel free tier limit)

/**
 * POST /api/instructor/feedback/batch-generate-async
 *
 * Inicia generación de feedback AI en background (sin esperar)
 * Retorna inmediatamente con información del job iniciado
 *
 * Request Body:
 * {
 *   "subject"?: "Física" | "Química"
 * }
 *
 * Response:
 * {
 *   "jobStarted": true,
 *   "totalReports": 290,
 *   "subject": "Física" | undefined,
 *   "startedAt": "2025-10-21T05:30:00.000Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/feedback/batch-generate-async');
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
        '/api/instructor/feedback/batch-generate-async',
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' },
        { status: 403 }
      );
    }

    // 3. Parse request body (optional filters)
    let body: { subject?: 'Física' | 'Química' } = {};

    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is OK
    }

    const { subject } = body;

    // 4. Log access
    logDataAccess(
      'batch-feedback-async-start',
      '/api/instructor/feedback/batch-generate-async',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown'
    );

    console.log('🚀 Async batch feedback generation requested', {
      instructor: session.user.email,
      subject: subject || 'all'
    });

    // 5. Get list of pending reports
    const pendingReports = await getPendingReportsWithDetails(subject);
    const totalReports = pendingReports.length;

    if (totalReports === 0) {
      return NextResponse.json({
        jobStarted: false,
        message: 'No hay reportes pendientes',
        totalReports: 0
      });
    }

    const reportIds = pendingReports.map(r => r.id);

    // 6. Start processing in background (NO AWAIT - fire and forget)
    const startedAt = new Date().toISOString();

    // Launch async processing without waiting
    processInBackground(reportIds, session.user.id, session.user.email || 'unknown', subject, startedAt);

    // 7. Return immediately
    console.log(`✅ Background job started: ${totalReports} reports`, {
      subject: subject || 'all',
      instructor: session.user.email,
      startedAt
    });

    return NextResponse.json({
      jobStarted: true,
      totalReports,
      subject: subject || undefined,
      startedAt
    });

  } catch (error: any) {
    console.error('❌ Error starting async batch generation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instructor/feedback/batch-generate-async?subject=Física
 *
 * Obtiene el progreso actual del procesamiento
 *
 * Response:
 * {
 *   "pendingReports": 150,
 *   "subject": "Física" | undefined
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get query params
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject') as 'Física' | 'Química' | null;

    // 3. Count pending reports
    if (subject) {
      const pendingReports = await getPendingReportsWithDetails(subject);
      return NextResponse.json({
        pendingReports: pendingReports.length,
        subject
      });
    } else {
      const counts = await countPendingReportsBySubject();
      return NextResponse.json({
        pendingReports: counts.total,
        subject: undefined,
        breakdown: {
          Física: counts.Física,
          Química: counts.Química
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Error getting progress:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Background processing function (fire and forget)
 */
async function processInBackground(
  reportIds: string[],
  instructorId: string,
  instructorEmail: string,
  subject: string | undefined,
  startedAt: string
) {
  try {
    console.log(`🔄 Background processing started: ${reportIds.length} reports`, {
      subject: subject || 'all',
      startedAt
    });

    const result = await queueManager.processReports(
      reportIds,
      {
        maxConcurrent: 5,
        retryAttempts: 3,
        instructorId
      }
    );

    console.log(`✅ Background processing completed`, {
      total: reportIds.length,
      successful: result.successful,
      failed: result.failed,
      totalCost: `$${result.totalCost.toFixed(4)}`,
      instructor: instructorEmail,
      subject: subject || 'all',
      startedAt,
      completedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Background processing failed:', {
      error: error.message,
      stack: error.stack,
      reportCount: reportIds.length,
      instructor: instructorEmail
    });
  }
}
