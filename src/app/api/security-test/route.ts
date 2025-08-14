import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {  } from '@/lib/auth';
import { securityLogger } from '@/lib/security-logger';

/**
 * Security Testing Endpoint
 * This endpoint is for testing security configurations and access controls
 * Should only be accessible in development or to admin users
 */
export async function GET(request: Request) {
  // Only allow in development environment or for admin users
  if (process.env.NODE_ENV === 'production') {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COORDINATOR')) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required in production.' },
        { status: 403 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('test');

  try {
    switch (testType) {
      case 'auth-session':
        const session = await auth();
        return NextResponse.json({
          test: 'auth-session',
          success: true,
          data: {
            authenticated: !!session,
            user: session?.user ? {
              id: session.user.id,
              email: session.user.email,
              role: session.user.role,
              studentId: session.user.studentId,
              sede: session.user.sede,
              academicYear: session.user.academicYear,
              division: session.user.division
            } : null
          }
        });

      case 'role-check':
        const userSession = await auth();
        const requiredRole = searchParams.get('role');
        
        if (!userSession?.user) {
          return NextResponse.json({
            test: 'role-check',
            success: false,
            message: 'Not authenticated',
            data: { authenticated: false }
          });
        }

        const hasRole = requiredRole ? userSession.user.role === requiredRole : true;
        
        return NextResponse.json({
          test: 'role-check',
          success: hasRole,
          message: hasRole ? 'Role check passed' : `Role check failed: required ${requiredRole}, got ${userSession.user.role}`,
          data: {
            userRole: userSession.user.role,
            requiredRole,
            passed: hasRole
          }
        });

      case 'security-logs':
        // Get recent security logs
        const recentLogs = securityLogger.getRecentLogs(20);
        const suspiciousActivities = securityLogger.getSuspiciousActivities();
        
        return NextResponse.json({
          test: 'security-logs',
          success: true,
          data: {
            totalLogs: recentLogs.length,
            recentLogs: recentLogs.slice(-5), // Last 5 logs
            suspiciousActivities: suspiciousActivities.slice(-5), // Last 5 suspicious
            logsSummary: {
              total: recentLogs.length,
              suspicious: suspiciousActivities.length
            }
          }
        });

      case 'user-logs':
        const logSession = await auth();
        if (!logSession?.user?.id) {
          return NextResponse.json({
            test: 'user-logs',
            success: false,
            message: 'Authentication required'
          });
        }

        const userLogs = securityLogger.getLogsByUser(logSession.user.id, 10);
        
        return NextResponse.json({
          test: 'user-logs',
          success: true,
          data: {
            userId: logSession.user.id,
            userEmail: logSession.user.email,
            logs: userLogs
          }
        });

      case 'environment':
        return NextResponse.json({
          test: 'environment',
          success: true,
          data: {
            nodeEnv: process.env.NODE_ENV,
            nextAuthUrl: process.env.NEXTAUTH_URL ? 'configured' : 'missing',
            nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
            tursoUrl: process.env.TURSO_DATABASE_URL ? 'configured' : 'missing',
            tursoToken: process.env.TURSO_AUTH_TOKEN ? 'configured' : 'missing',
            timestamp: new Date().toISOString()
          }
        });

      case 'middleware-test':
        // This tests if the request made it past middleware
        const middlewareSession = await auth();
        return NextResponse.json({
          test: 'middleware-test',
          success: true,
          message: 'Request passed middleware validation',
          data: {
            authenticated: !!middlewareSession,
            userRole: middlewareSession?.user?.role,
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({
          error: 'Invalid test type',
          availableTests: [
            'auth-session',
            'role-check',
            'security-logs',
            'user-logs',
            'environment',
            'middleware-test'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Security test error:', error);
    return NextResponse.json({
      test: testType || 'unknown',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Test POST endpoint to verify authentication in write operations
 */
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required for POST operations' },
      { status: 401 }
    );
  }

  const { action } = await request.json();

  return NextResponse.json({
    test: 'post-auth-test',
    success: true,
    message: 'POST request authenticated successfully',
    data: {
      action,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      timestamp: new Date().toISOString()
    }
  });
}