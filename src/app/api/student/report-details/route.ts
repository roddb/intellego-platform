import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';
import { query } from '@/lib/db';
import { logDataAccess, logUnauthorizedAccess } from '@/lib/security-logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/student/report-details');
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    // Students can access their own reports
    // Instructors in impersonation mode can also access
    const isStudent = session.user.role === 'STUDENT';
    const isInstructorImpersonating = session.user.role === 'INSTRUCTOR' && session.user.isImpersonating;

    if (!isStudent && !isInstructorImpersonating) {
      return NextResponse.json(
        { error: 'This endpoint is for students only' },
        { status: 403 }
      );
    }

    // Log data access
    logDataAccess(
      'report-details-retrieval',
      '/api/student/report-details',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown'
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Get student ID (when impersonating, session.user.id is already set to impersonated student's ID)
    const studentId = session.user.id;

    console.log('[REPORT DETAILS API] Request received:', {
      studentId,
      reportId,
      role: session.user.role,
      isImpersonating: session.user.isImpersonating
    });

    // Fetch the report with all answers
    const result = await query(`
      SELECT
        pr.id as reportId,
        pr.userId,
        pr.subject,
        pr.weekStart,
        pr.weekEnd,
        pr.submittedAt,
        a.id as answerId,
        a.questionId,
        a.answer,
        q.text as questionText,
        q."order" as questionOrder
      FROM ProgressReport pr
      LEFT JOIN Answer a ON a.progressReportId = pr.id
      LEFT JOIN Question q ON q.id = a.questionId
      WHERE pr.id = ? AND pr.userId = ?
      ORDER BY q."order" ASC
    `, [reportId, studentId]);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Group answers
    const reportData = {
      id: result.rows[0].reportId,
      userId: result.rows[0].userId,
      subject: result.rows[0].subject,
      weekStart: result.rows[0].weekStart,
      weekEnd: result.rows[0].weekEnd,
      submittedAt: result.rows[0].submittedAt,
      answers: result.rows
        .filter((row: any) => row.answerId) // Only include rows with answers
        .map((row: any) => ({
          id: row.answerId,
          questionId: row.questionId,
          questionText: row.questionText,
          answer: row.answer,
          order: row.questionOrder
        }))
    };

    console.log('[REPORT DETAILS API] Returning report with', reportData.answers.length, 'answers');

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Error in student report-details API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
