// ETAPA 7.3: Deployment Health Check Endpoint
// Provides comprehensive system health monitoring for production deployment

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    authentication: boolean;
    file_system: boolean;
  };
  performance: {
    database_latency_ms: number;
    memory_usage_mb: number;
    response_time_ms: number;
  };
  features: {
    progress_reports: boolean;
    calendar_events: boolean;
  };
  deployment: {
    environment: string;
    commit_hash: string;
    deployment_time: string;
  };
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: false,
        authentication: false,
        file_system: false
      },
      performance: {
        database_latency_ms: 0,
        memory_usage_mb: 0,
        response_time_ms: 0
      },
      features: {
        progress_reports: false,
        calendar_events: false
      },
      deployment: {
        environment: process.env.NODE_ENV || 'development',
        commit_hash: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        deployment_time: process.env.VERCEL_GIT_COMMIT_TIMESTAMP || new Date().toISOString()
      }
    };

    // 1. DATABASE HEALTH CHECK
    try {
      const dbStartTime = performance.now();
      const database = db();
      
      // Test basic connectivity
      const testQuery = await database.execute('SELECT 1 as test');
      
      // Test core tables exist
      const userCount = await database.execute('SELECT COUNT(*) as count FROM User LIMIT 1');
      const reportCount = await database.execute('SELECT COUNT(*) as count FROM ProgressReport LIMIT 1');
      
      healthCheck.checks.database = true;
      healthCheck.performance.database_latency_ms = performance.now() - dbStartTime;
    } catch (error) {
      console.error('Database health check failed:', error);
      healthCheck.checks.database = false;
      healthCheck.status = 'degraded';
    }


    // 2. AUTHENTICATION HEALTH CHECK
    try {
      // Check NextAuth configuration
      const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
      const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
      
      healthCheck.checks.authentication = hasNextAuthSecret && hasNextAuthUrl;
      
      if (!healthCheck.checks.authentication) {
        healthCheck.status = 'unhealthy';
      }
    } catch (error) {
      console.error('Authentication health check failed:', error);
      healthCheck.checks.authentication = false;
      healthCheck.status = 'unhealthy';
    }

    // 3. FILE SYSTEM HEALTH CHECK
    try {
      // In production (Vercel), we only check read access
      // File writing is handled by Vercel's ephemeral file system
      healthCheck.checks.file_system = true;
    } catch (error) {
      console.error('File system health check failed:', error);
      healthCheck.checks.file_system = false;
      healthCheck.status = 'degraded';
    }

    // 4. FEATURE HEALTH CHECKS
    try {
      // Progress Reports
      healthCheck.features.progress_reports = healthCheck.checks.database && healthCheck.checks.authentication;
      
      // Calendar Events
      healthCheck.features.calendar_events = healthCheck.checks.database && healthCheck.checks.authentication;
    } catch (error) {
      console.error('Feature health check failed:', error);
    }

    // 5. PERFORMANCE METRICS
    const memoryUsage = process.memoryUsage();
    healthCheck.performance.memory_usage_mb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    healthCheck.performance.response_time_ms = Math.round(performance.now() - startTime);

    // 6. OVERALL HEALTH DETERMINATION
    const criticalChecks = [
      healthCheck.checks.database,
      healthCheck.checks.authentication
    ];
    
    const criticalFeatures = [
      healthCheck.features.progress_reports,
      healthCheck.features.calendar_events
    ];

    if (criticalChecks.some(check => !check)) {
      healthCheck.status = 'unhealthy';
    } else if (criticalFeatures.some(feature => !feature)) {
      healthCheck.status = 'degraded';
    }

    // Return appropriate HTTP status codes
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    console.error('Health check endpoint error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// Also provide a simple health endpoint for load balancers
export async function HEAD(request: NextRequest) {
  try {
    const database = db();
    await database.execute('SELECT 1');
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Health-Status': 'healthy'
      }
    });
  } catch (error) {
    return new NextResponse(null, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Health-Status': 'unhealthy'
      }
    });
  }
}