import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getStudentForImpersonation,
  logImpersonation,
  createImpersonationLogTable
} from '@/lib/impersonation';

// Ensure impersonation log table exists
createImpersonationLogTable().catch(console.error);

/**
 * POST /api/instructor/impersonate
 * Start impersonating a student
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Verify instructor role
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized. Only instructors can impersonate students.' },
        { status: 403 }
      );
    }

    // Prevent nested impersonation
    if (session.user.isImpersonating) {
      return NextResponse.json(
        { error: 'Already impersonating a student. End current session first.' },
        { status: 400 }
      );
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get student details
    const student = await getStudentForImpersonation(studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Log the impersonation start
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logImpersonation({
      instructorId: session.user.id,
      instructorEmail: session.user.email || '',
      studentId: student.studentId || '',
      studentEmail: student.email,
      action: 'START',
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent
    });

    // Return impersonation data to be stored in session
    return NextResponse.json({
      success: true,
      impersonationData: {
        id: student.id,  // IMPORTANT: Database ID for queries
        studentId: student.studentId,  // Student code for display
        studentName: student.name,
        studentEmail: student.email,
        sede: student.sede,
        academicYear: student.academicYear,
        division: student.division,
        subjects: student.subjects,
        originalUserId: session.user.id,
        originalRole: session.user.role,
        startedAt: new Date().toISOString()
      },
      studentData: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        sede: student.sede,
        academicYear: student.academicYear,
        division: student.division,
        subjects: student.subjects
      }
    });

  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instructor/impersonate
 * End impersonation session
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !session.user.isImpersonating) {
      return NextResponse.json(
        { error: 'Not currently impersonating' },
        { status: 400 }
      );
    }

    // Log the impersonation end
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (session.user.impersonating) {
      await logImpersonation({
        instructorId: session.user.impersonating.originalUserId,
        instructorEmail: session.user.email || '',
        studentId: session.user.impersonating.studentId,
        studentEmail: session.user.impersonating.studentEmail,
        action: 'END',
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Impersonation ended successfully'
    });

  } catch (error) {
    console.error('Error ending impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instructor/impersonate
 * Get current impersonation status
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isImpersonating: session.user.isImpersonating || false,
      impersonating: session.user.impersonating || null
    });

  } catch (error) {
    console.error('Error getting impersonation status:', error);
    return NextResponse.json(
      { error: 'Failed to get impersonation status' },
      { status: 500 }
    );
  }
}