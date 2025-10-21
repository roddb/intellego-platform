import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logDataAccess, logUnauthorizedAccess, logRoleViolation } from '@/lib/security-logger';
import { query } from '@/lib/db-operations';

export const runtime = 'nodejs';

/**
 * GET /api/instructor/costs
 *
 * Obtiene estadísticas de costos de API de Claude (INSTRUCTOR ONLY)
 *
 * Query params:
 * - period?: 'today' | 'week' | 'month' | 'all' (default: 'all')
 * - startDate?: ISO date string (YYYY-MM-DD)
 * - endDate?: ISO date string (YYYY-MM-DD)
 * - subject?: 'Física' | 'Química'
 * - groupBy?: 'day' | 'week' | 'subject' (default: none)
 *
 * Response:
 * {
 *   totalCost: number,
 *   totalFeedbacks: number,
 *   averageCost: number,
 *   breakdown?: Record<string, { cost: number, count: number }>
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/costs');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check INSTRUCTOR role (CRITICAL - Students must not access this)
    if (session.user.role !== 'INSTRUCTOR') {
      logRoleViolation(
        'INSTRUCTOR',
        session.user.role || 'unknown',
        '/api/instructor/costs',
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' },
        { status: 403 }
      );
    }

    // 3. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subject = searchParams.get('subject');
    const groupBy = searchParams.get('groupBy');

    // 4. Log access
    logDataAccess(
      'instructor-costs-query',
      '/api/instructor/costs',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown',
      { period, startDate, endDate, subject, groupBy }
    );

    // 5. Build WHERE clause
    let whereClause = 'WHERE apiCost IS NOT NULL';
    const params: any[] = [];

    // Date filtering
    if (startDate && endDate) {
      whereClause += ' AND DATE(createdAt) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (period === 'today') {
      whereClause += ' AND DATE(createdAt) = DATE("now")';
    } else if (period === 'week') {
      whereClause += ' AND DATE(createdAt) >= DATE("now", "-7 days")';
    } else if (period === 'month') {
      whereClause += ' AND DATE(createdAt) >= DATE("now", "-30 days")';
    }

    // Subject filtering
    if (subject) {
      whereClause += ' AND subject = ?';
      params.push(subject);
    }

    // 6. Get aggregate data
    const aggregateResult = await query(`
      SELECT
        COUNT(*) as totalFeedbacks,
        SUM(apiCost) as totalCost,
        AVG(apiCost) as averageCost,
        MIN(apiCost) as minCost,
        MAX(apiCost) as maxCost
      FROM Feedback
      ${whereClause}
    `, params);

    const stats = aggregateResult.rows[0] as any;

    // 7. Get breakdown if requested
    let breakdown: Record<string, { cost: number; count: number }> | undefined;

    if (groupBy === 'day') {
      const dayResult = await query(`
        SELECT
          DATE(createdAt) as groupKey,
          COUNT(*) as count,
          SUM(apiCost) as cost
        FROM Feedback
        ${whereClause}
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt) DESC
      `, params);

      breakdown = {};
      for (const row of dayResult.rows) {
        const r = row as any;
        breakdown[r.groupKey] = {
          cost: parseFloat(r.cost || 0),
          count: parseInt(r.count || 0)
        };
      }
    } else if (groupBy === 'week') {
      const weekResult = await query(`
        SELECT
          strftime('%Y-W%W', createdAt) as groupKey,
          COUNT(*) as count,
          SUM(apiCost) as cost
        FROM Feedback
        ${whereClause}
        GROUP BY strftime('%Y-W%W', createdAt)
        ORDER BY strftime('%Y-W%W', createdAt) DESC
      `, params);

      breakdown = {};
      for (const row of weekResult.rows) {
        const r = row as any;
        breakdown[r.groupKey] = {
          cost: parseFloat(r.cost || 0),
          count: parseInt(r.count || 0)
        };
      }
    } else if (groupBy === 'subject') {
      const subjectResult = await query(`
        SELECT
          subject as groupKey,
          COUNT(*) as count,
          SUM(apiCost) as cost
        FROM Feedback
        ${whereClause}
        GROUP BY subject
        ORDER BY SUM(apiCost) DESC
      `, params);

      breakdown = {};
      for (const row of subjectResult.rows) {
        const r = row as any;
        breakdown[r.groupKey] = {
          cost: parseFloat(r.cost || 0),
          count: parseInt(r.count || 0)
        };
      }
    }

    // 8. Return response
    return NextResponse.json({
      totalCost: parseFloat(stats.totalCost || 0),
      totalFeedbacks: parseInt(stats.totalFeedbacks || 0),
      averageCost: parseFloat(stats.averageCost || 0),
      minCost: parseFloat(stats.minCost || 0),
      maxCost: parseFloat(stats.maxCost || 0),
      breakdown
    });

  } catch (error: any) {
    console.error('❌ Error getting cost stats:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
