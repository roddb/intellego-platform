import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Configure to use Node.js runtime
export const runtime = 'nodejs';

import { getStudentEvaluations, getEvaluationById } from '@/lib/db-operations';
import { logDataAccess, logUnauthorizedAccess } from '@/lib/security-logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/student/evaluations');
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }

    // Students can access their own evaluations
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
      'evaluation-retrieval',
      '/api/student/evaluations',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown'
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const evaluationId = searchParams.get('id');
    const subject = searchParams.get('subject');

    // Get student ID (when impersonating, session.user.id is already set to impersonated student's ID)
    const studentId = session.user.id;

    // If specific evaluation ID requested
    if (evaluationId) {
      const evaluation = await getEvaluationById(evaluationId);

      if (!evaluation) {
        return NextResponse.json(
          { error: 'Evaluation not found' },
          { status: 404 }
        );
      }

      // Verify the evaluation belongs to this student
      if (evaluation.studentId !== studentId) {
        return NextResponse.json(
          { error: 'Access denied to this evaluation' },
          { status: 403 }
        );
      }

      return NextResponse.json({ evaluation });
    }

    // Get all evaluations for student (with optional subject filter)
    const evaluations = await getStudentEvaluations(studentId, subject || undefined);

    return NextResponse.json({
      evaluations,
      total: evaluations.length
    });

  } catch (error) {
    console.error('Error in student evaluations API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
