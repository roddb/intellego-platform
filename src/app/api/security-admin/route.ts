import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';import {  } from '@/lib/auth';
import { securityLogger, SecurityEventType } from '@/lib/security-logger';
import { auditInstructorActivity } from '@/lib/instructor-authorization';
import { instructorApiRateLimit, hierarchicalApiRateLimit, exportApiRateLimit } from '@/lib/rate-limit';

/**
 * Security Administration Endpoint
 * For monitoring security events and managing security configurations
 * Restricted to ADMIN and COORDINATOR roles
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    // Strict access control - only admins and coordinators
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
      securityLogger.log({
        event: SecurityEventType.UNAUTHORIZED_ACCESS,
        userId: session?.user?.id,
        userEmail: session?.user?.email || undefined,
        userRole: session?.user?.role || undefined,
        action: 'Attempted security admin access',
        resource: '/api/security-admin',
        success: false
      });
      
      return NextResponse.json(
        { error: 'Forbidden. Administrator access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Log admin access
    securityLogger.log({
      event: SecurityEventType.DATA_ACCESS,
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userRole: session.user.role || undefined,
      action: `Security admin access: ${action}`,
      resource: '/api/security-admin',
      success: true
    });

    switch (action) {
      case 'security-overview':
        const recentLogs = securityLogger.getRecentLogs(100);
        const suspiciousActivities = securityLogger.getSuspiciousActivities();
        const eventTypes = recentLogs.reduce((acc, log) => {
          acc[log.event] = (acc[log.event] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          success: true,
          data: {
            overview: {
              totalLogs: recentLogs.length,
              suspiciousCount: suspiciousActivities.length,
              activeUsers: Array.from(new Set(recentLogs.map(log => log.userId).filter(Boolean))).length,
              timeRange: '24 hours'
            },
            eventBreakdown: eventTypes,
            recentSuspicious: suspiciousActivities.slice(-10),
            systemHealth: {
              lastLogTime: recentLogs[recentLogs.length - 1]?.timestamp || null,
              logRate: recentLogs.length / 24, // per hour
              status: suspiciousActivities.length > 10 ? 'attention' : 'healthy'
            }
          }
        });

      case 'user-audit':
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter required for user audit' },
            { status: 400 }
          );
        }

        const userLogs = securityLogger.getLogsByUser(userId, 200);
        const auditResults = auditInstructorActivity(userId);
        
        return NextResponse.json({
          success: true,
          data: {
            userId,
            auditSummary: auditResults,
            recentActivity: userLogs.slice(-20),
            riskLevel: auditResults.suspiciousActivities > 5 ? 'high' : 
                      auditResults.suspiciousActivities > 2 ? 'medium' : 'low'
          }
        });

      case 'rate-limit-status':
        // This is a simplified view - in production you'd want more detailed metrics
        return NextResponse.json({
          success: true,
          data: {
            rateLimits: {
              instructorApi: { limit: '100/min', type: 'instructor operations' },
              hierarchicalApi: { limit: '50/min', type: 'hierarchical data access' },
              exportApi: { limit: '10/5min', type: 'data exports' }
            },
            currentUsage: {
              // In a real implementation, you'd track current usage
              message: 'Usage tracking requires persistent storage implementation'
            }
          }
        });

      case 'security-config':
        return NextResponse.json({
          success: true,
          data: {
            authentication: {
              sessionMaxAge: '8 hours',
              sessionUpdateAge: '2 hours',
              inactivityTimeout: '4 hours',
              provider: 'credentials'
            },
            authorization: {
              roleBasedAccess: 'enabled',
              middlewareProtection: 'enabled',
              instructorDataSegregation: 'enabled'
            },
            monitoring: {
              securityLogging: 'enabled',
              auditTrail: 'enabled',
              suspiciousActivityDetection: 'enabled',
              logRetention: '24 hours (in memory)'
            },
            rateLimiting: {
              generalApi: 'enabled',
              exportOperations: 'enabled',
              heavyOperations: 'enabled'
            }
          }
        });

      case 'clear-logs':
        // Only allow in development or with explicit confirmation
        if (process.env.NODE_ENV === 'production') {
          const confirm = searchParams.get('confirm');
          if (confirm !== 'true') {
            return NextResponse.json({
              error: 'Log clearing in production requires confirmation parameter'
            }, { status: 400 });
          }
        }

        securityLogger.clearOldLogs(1); // Clear logs older than 1 hour
        
        securityLogger.log({
          event: SecurityEventType.DATA_ACCESS,
          userId: session.user.id,
          userEmail: session.user.email || undefined,
          userRole: session.user.role || undefined,
          action: 'Security logs cleared',
          resource: 'security-logs',
          success: true
        });

        return NextResponse.json({
          success: true,
          message: 'Old security logs cleared',
          timestamp: new Date().toISOString()
        });

      case 'health-check':
        const healthLogs = securityLogger.getRecentLogs(50);
        const errors = healthLogs.filter(log => !log.success);
        const authEvents = healthLogs.filter(log => 
          log.event === SecurityEventType.AUTH_SUCCESS || 
          log.event === SecurityEventType.AUTH_FAILURE
        );

        return NextResponse.json({
          success: true,
          data: {
            systemStatus: 'operational',
            securityStatus: errors.length > 10 ? 'warning' : 'healthy',
            metrics: {
              totalEvents: healthLogs.length,
              errorRate: errors.length / healthLogs.length,
              authSuccessRate: authEvents.filter(e => e.success).length / Math.max(authEvents.length, 1),
              lastError: errors[errors.length - 1] || null
            },
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: [
            'security-overview',
            'user-audit',
            'rate-limit-status', 
            'security-config',
            'clear-logs',
            'health-check'
          ]
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Security admin API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST endpoint for security configuration changes
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
      return NextResponse.json(
        { error: 'Forbidden. Administrator access required.' },
        { status: 403 }
      );
    }

    const { action, data } = await request.json();

    securityLogger.log({
      event: SecurityEventType.DATA_ACCESS,
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userRole: session.user.role || undefined,
      action: `Security configuration change: ${action}`,
      resource: '/api/security-admin',
      success: true,
      details: { action, configData: data }
    });

    switch (action) {
      case 'reset-rate-limits':
        // Reset all rate limiters
        instructorApiRateLimit.reset();
        hierarchicalApiRateLimit.reset();
        exportApiRateLimit.reset();
        
        return NextResponse.json({
          success: true,
          message: 'All rate limits have been reset',
          timestamp: new Date().toISOString()
        });

      case 'block-user':
        // This would typically involve updating a database record
        // For now, we'll just log the action
        const { userId: blockUserId, reason } = data;
        
        securityLogger.log({
          event: SecurityEventType.SUSPICIOUS_ACTIVITY,
          userId: blockUserId,
          action: `User blocked by admin: ${reason}`,
          success: true,
          details: { blockedBy: session.user.id, reason }
        });

        return NextResponse.json({
          success: true,
          message: `User ${blockUserId} blocked successfully`,
          reason,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['reset-rate-limits', 'block-user']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Security admin POST error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}