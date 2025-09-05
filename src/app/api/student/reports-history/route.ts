import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db-operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
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
    // Include reports where the week overlaps with the month at all
    // (week starts before month ends AND week ends after month starts)
    const reportsResult = await query(`
      SELECT DISTINCT
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
        AND f.weekStart = substr(pr.weekStart, 1, 10)
        AND f.subject = pr.subject
      )
      WHERE pr.userId = ?
        AND pr.weekStart <= ?
        AND pr.weekEnd >= ?
      ORDER BY pr.weekStart, pr.subject
    `, [userId, endDate, startDate]);
    
    const reports = reportsResult.rows.map((row: any) => ({
      id: row.id,
      weekStart: String(row.weekStart).split('T')[0], // Ensure date format is YYYY-MM-DD
      weekEnd: String(row.weekEnd).split('T')[0],     // Ensure date format is YYYY-MM-DD
      subject: row.subject,
      submittedAt: row.submittedAt,
      hasFeedback: row.hasFeedback === 1 || row.hasFeedback === true // Ensure boolean conversion
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