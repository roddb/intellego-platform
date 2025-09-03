import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get first student user with reports
    const userResult = await query(`
      SELECT DISTINCT u.id, u.name, u.email, u.studentId 
      FROM User u
      INNER JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT'
      LIMIT 1
    `);
    
    if (!userResult.rows[0]) {
      // If no user with reports, get any student
      const anyStudent = await query(`
        SELECT id, name, email, studentId 
        FROM User 
        WHERE role = 'STUDENT'
        LIMIT 1
      `);
      
      if (!anyStudent.rows[0]) {
        return NextResponse.json({ error: 'No students found' }, { status: 404 });
      }
      
      const user = anyStudent.rows[0];
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        totalReports: 0,
        allReports: [],
        message: "Student found but has no reports"
      });
    }
    
    const user = userResult.rows[0];
    
    // Get all reports for demo user
    const allReports = await query(`
      SELECT 
        pr.weekStart, 
        pr.weekEnd, 
        pr.subject,
        pr.submittedAt
      FROM ProgressReport pr
      WHERE pr.userId = ?
      ORDER BY pr.weekStart DESC, pr.subject
    `, [user.id]);
    
    // Calculate August 2025 weeks
    const augustWeeks = [
      { num: 1, start: '2025-07-28', end: '2025-08-03' },
      { num: 2, start: '2025-08-04', end: '2025-08-10' },
      { num: 3, start: '2025-08-11', end: '2025-08-17' },
      { num: 4, start: '2025-08-18', end: '2025-08-24' },
      { num: 5, start: '2025-08-25', end: '2025-08-31' },
    ];
    
    // Check which weeks have reports
    const weekStatus = augustWeeks.map(week => {
      const reportsInWeek = allReports.rows.filter(r => {
        // Normalize date comparison
        const reportWeekStart = String(r.weekStart).split('T')[0];
        return reportWeekStart === week.start;
      });
      return {
        ...week,
        reports: reportsInWeek
      };
    });
    
    // Check feedback status
    const feedbackCheck = await query(`
      SELECT 
        f.weekStart,
        f.subject,
        f.id
      FROM Feedback f
      WHERE f.studentId = ?
      ORDER BY f.weekStart, f.subject
    `, [user.id]);
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      totalReports: allReports.rows.length,
      allReports: allReports.rows,
      feedbackData: feedbackCheck.rows,
      augustWeeksAnalysis: weekStatus,
      summary: {
        message: `Usuario tiene ${allReports.rows.length} reportes en total`,
        augustWeeksWithReports: weekStatus.filter(w => w.reports.length > 0).map(w => `Semana ${w.num}: ${w.reports.length} reportes`),
        feedbackCount: feedbackCheck.rows.length
      },
      debugInfo: {
        rawReportDates: allReports.rows.map(r => ({
          subject: r.subject,
          weekStart_raw: r.weekStart,
          weekStart_normalized: String(r.weekStart).split('T')[0]
        }))
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}