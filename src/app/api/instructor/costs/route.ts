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
 * - operationType?: 'feedback' | 'evaluation' | 'all' (default: 'all')
 *
 * Response:
 * {
 *   totalCost: number,
 *   totalOperations: number,
 *   averageCost: number,
 *   feedbackCosts?: { totalCost: number, count: number, avgCost: number },
 *   evaluationCosts?: { totalCost: number, count: number, avgCost: number },
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
    const operationType = searchParams.get('operationType') || 'all'; // 'feedback', 'evaluation', or 'all'

    // 4. Log access
    logDataAccess(
      'instructor-costs-query',
      '/api/instructor/costs',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown'
    );

    // 5. Build WHERE clause helper
    const buildDateFilter = (baseWhere: string, params: any[]) => {
      let where = baseWhere;
      if (startDate && endDate) {
        where += ' AND DATE(createdAt) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (period === 'today') {
        where += ' AND DATE(createdAt) = DATE("now")';
      } else if (period === 'week') {
        where += ' AND DATE(createdAt) >= DATE("now", "-7 days")';
      } else if (period === 'month') {
        where += ' AND DATE(createdAt) >= DATE("now", "-30 days")';
      }
      return where;
    };

    // 6. Get aggregate data based on operationType
    let stats: any = {};
    let feedbackStats: any = null;
    let evaluationStats: any = null;

    if (operationType === 'feedback' || operationType === 'all') {
      const whereClause = 'WHERE apiCost > 0'; // Only count real costs
      const params: any[] = [];
      let finalWhere = buildDateFilter(whereClause, params);

      if (subject) {
        finalWhere += ' AND subject = ?';
        params.push(subject);
      }

      const feedbackResult = await query(`
        SELECT
          COUNT(*) as count,
          SUM(apiCost) as totalCost,
          AVG(apiCost) as averageCost,
          MIN(apiCost) as minCost,
          MAX(apiCost) as maxCost
        FROM Feedback
        ${finalWhere}
      `, params);

      feedbackStats = feedbackResult.rows[0] as any;
    }

    if (operationType === 'evaluation' || operationType === 'all') {
      const whereClause = 'WHERE apiCost > 0'; // Only count real costs
      const params: any[] = [];
      let finalWhere = buildDateFilter(whereClause, params);

      if (subject) {
        finalWhere += ' AND subject LIKE ?';
        params.push(`${subject}%`); // Match "Física 4to C" format
      }

      const evaluationResult = await query(`
        SELECT
          COUNT(*) as count,
          SUM(apiCost) as totalCost,
          AVG(apiCost) as averageCost,
          MIN(apiCost) as minCost,
          MAX(apiCost) as maxCost
        FROM Evaluation
        ${finalWhere}
      `, params);

      evaluationStats = evaluationResult.rows[0] as any;
    }

    // Combine stats if operationType is 'all'
    if (operationType === 'all') {
      const feedbackCount = parseInt(feedbackStats?.count || 0);
      const evaluationCount = parseInt(evaluationStats?.count || 0);
      const feedbackCost = parseFloat(feedbackStats?.totalCost || 0);
      const evaluationCost = parseFloat(evaluationStats?.totalCost || 0);

      stats = {
        totalOperations: feedbackCount + evaluationCount,
        totalCost: feedbackCost + evaluationCost,
        averageCost: feedbackCount + evaluationCount > 0
          ? (feedbackCost + evaluationCost) / (feedbackCount + evaluationCount)
          : 0,
        minCost: Math.min(
          parseFloat(feedbackStats?.minCost || Infinity),
          parseFloat(evaluationStats?.minCost || Infinity)
        ),
        maxCost: Math.max(
          parseFloat(feedbackStats?.maxCost || 0),
          parseFloat(evaluationStats?.maxCost || 0)
        )
      };
    } else if (operationType === 'feedback') {
      stats = {
        totalOperations: parseInt(feedbackStats?.count || 0),
        totalCost: parseFloat(feedbackStats?.totalCost || 0),
        averageCost: parseFloat(feedbackStats?.averageCost || 0),
        minCost: parseFloat(feedbackStats?.minCost || 0),
        maxCost: parseFloat(feedbackStats?.maxCost || 0)
      };
    } else if (operationType === 'evaluation') {
      stats = {
        totalOperations: parseInt(evaluationStats?.count || 0),
        totalCost: parseFloat(evaluationStats?.totalCost || 0),
        averageCost: parseFloat(evaluationStats?.averageCost || 0),
        minCost: parseFloat(evaluationStats?.minCost || 0),
        maxCost: parseFloat(evaluationStats?.maxCost || 0)
      };
    }

    // 7. Prepare detailed breakdown if operationType is 'all'
    const response: any = {
      totalCost: stats.totalCost,
      totalOperations: stats.totalOperations,
      averageCost: stats.averageCost,
      minCost: stats.minCost === Infinity ? 0 : stats.minCost,
      maxCost: stats.maxCost
    };

    if (operationType === 'all' && feedbackStats && evaluationStats) {
      response.feedbackCosts = {
        totalCost: parseFloat(feedbackStats.totalCost || 0),
        count: parseInt(feedbackStats.count || 0),
        avgCost: parseFloat(feedbackStats.averageCost || 0)
      };
      response.evaluationCosts = {
        totalCost: parseFloat(evaluationStats.totalCost || 0),
        count: parseInt(evaluationStats.count || 0),
        avgCost: parseFloat(evaluationStats.averageCost || 0)
      };
    }

    // 8. Return response
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error getting cost stats:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
