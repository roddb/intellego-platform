import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db-operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || session.user.email;
    
    // Get user by email
    const userResult = await query(`
      SELECT id, name, email, studentId 
      FROM User 
      WHERE email = ?
    `, [email]);
    
    if (!userResult.rows[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    
    // Get all reports for this user
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
      ORDER BY pr.weekStart, pr.subject
    `, [user.id]);
    
    // Get reports specifically for August 2025
    const augustReports = await query(`
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
        AND pr.weekStart <= '2025-08-31'
        AND pr.weekEnd >= '2025-08-01'
      ORDER BY pr.weekStart, pr.subject
    `, [user.id]);
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId
      },
      allReports: reportsResult.rows.map(r => ({
        ...r,
        hasFeedback: r.hasFeedback === 1
      })),
      augustReports: augustReports.rows.map(r => ({
        ...r,
        hasFeedback: r.hasFeedback === 1
      })),
      totalReports: reportsResult.rows.length,
      augustReportsCount: augustReports.rows.length,
      dateRanges: {
        august2025: {
          startDate: '2025-07-28',  // Monday of first week
          endDate: '2025-08-31'     // Sunday of last week
        }
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}