import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Rubric } from '@/lib/evaluation/types';

export const runtime = 'nodejs';

/**
 * GET /api/instructor/rubric
 * List all active rubrics
 */
export async function GET() {
  try {
    // Authentication check
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Role check - only instructors can access rubrics
    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Forbidden - instructor access only' },
        { status: 403 }
      );
    }

    // Fetch all active rubrics
    const client = db();
    const result = await client.execute({
      sql: `
        SELECT
          id,
          name,
          description,
          rubricText,
          subject,
          examType,
          isActive,
          createdBy,
          createdAt,
          updatedAt
        FROM Rubric
        WHERE isActive = 1
        ORDER BY name ASC
      `,
      args: [],
    });

    const rubrics = result.rows as unknown as Rubric[];

    return NextResponse.json({
      success: true,
      rubrics,
      count: rubrics.length,
    });

  } catch (error: unknown) {
    console.error('[API] Error fetching rubrics:', error);

    if (error instanceof Error) {
      // Log detailed error for debugging
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
