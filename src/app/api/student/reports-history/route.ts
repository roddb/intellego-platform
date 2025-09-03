import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { query } from '@/lib/db-operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // If student, verify they can only access their own data
    if (session.user.role === 'STUDENT' && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get reports for the specified date range
    const reportsResult = await query(`
      SELECT 
        pr.id, 
        pr.weekStart, 
        pr.weekEnd, 
        pr.subject, 
        pr.submittedAt,
        CASE 
          WHEN f.id IS NOT NULL THEN 1
          ELSE 0
        END as hasFeedback
      FROM ProgressReport pr
      LEFT JOIN Feedback f ON (
        f.studentId = pr.userId 
        AND f.weekStart = pr.weekStart 
        AND f.subject = pr.subject
      )
      WHERE pr.userId = ?
        AND pr.weekStart >= ?
        AND pr.weekStart <= ?
      ORDER BY pr.weekStart, pr.subject
    `, [userId, startDate, endDate]);
    
    const reports = reportsResult.rows.map((row: any) => ({
      id: row.id,
      weekStart: row.weekStart,
      weekEnd: row.weekEnd,
      subject: row.subject,
      submittedAt: row.submittedAt,
      hasFeedback: row.hasFeedback === 1
    }));
    
    return NextResponse.json({ reports });
    
  } catch (error) {
    console.error('Error fetching reports history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}