import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db-operations';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  try {
    // Authentication check
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Authorization check - only INSTRUCTOR and ADMIN can delete users
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - instructor or admin access only' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user to delete
    const userToDelete = await findUserById(userId);

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Additional authorization: INSTRUCTOR cannot delete ADMIN users
    if (session.user.role === 'INSTRUCTOR' && userToDelete.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - instructors cannot delete admin users' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (userToDelete.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get counts of related data before deletion
    const reportCountResult = await db().execute({
      sql: 'SELECT COUNT(*) as count FROM ProgressReport WHERE userId = ?',
      args: [userId]
    });
    const reportCount = reportCountResult.rows[0]?.count || 0;

    const evaluationCountResult = await db().execute({
      sql: 'SELECT COUNT(*) as count FROM Evaluation WHERE studentId = ?',
      args: [userId]
    });
    const evaluationCount = evaluationCountResult.rows[0]?.count || 0;

    // Hard delete user (cascading deletes will handle related data)
    await db().execute({
      sql: 'DELETE FROM User WHERE id = ?',
      args: [userId]
    });

    // Log deletion action for audit trail
    console.log(`User deleted by ${session.user.email}:`, {
      deletedUserId: userToDelete.id,
      deletedUserEmail: userToDelete.email,
      deletedUserRole: userToDelete.role,
      deletedBy: session.user.id,
      relatedReports: reportCount,
      relatedEvaluations: evaluationCount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: userToDelete.id,
        name: userToDelete.name,
        email: userToDelete.email,
      },
      relatedDataDeleted: {
        reports: reportCount,
        evaluations: evaluationCount,
      }
    });

  } catch (error: unknown) {
    console.error('Error deleting user:', error);

    if (error instanceof Error) {
      // Handle foreign key constraint errors
      if (error.message.includes('FOREIGN KEY constraint')) {
        return NextResponse.json(
          { error: 'Cannot delete user due to data dependencies' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
