import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllStudentsForInstructor } from '@/lib/impersonation';

/**
 * GET /api/instructor/students
 * Get list of all students for instructor dropdown
 */
export async function GET() {
  try {
    const session = await auth();

    // Verify instructor role
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized. Only instructors can access this endpoint.' },
        { status: 403 }
      );
    }

    const students = await getAllStudentsForInstructor();

    return NextResponse.json({
      success: true,
      students
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}