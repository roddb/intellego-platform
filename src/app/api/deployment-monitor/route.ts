// ETAPA 7.3: Deployment Monitoring Endpoint
// Monitors deployment health and triggers alerts/rollbacks if needed

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface DeploymentMetrics {
  deployment_id: string;
  status: 'deploying' | 'healthy' | 'degraded' | 'failed';
  timestamp: string;
  metrics: {
    error_rate: number;
    response_time_p95: number;
    success_rate: number;
    active_users: number;
    database_health: number;
  };
  thresholds: {
    max_error_rate: number;
    max_response_time: number;
    min_success_rate: number;
  };
  actions: {
    alert_triggered: boolean;
    rollback_recommended: boolean;
    auto_scaling_active: boolean;
  };
  deployment_info: {
    version: string;
    commit_hash: string;
    deployment_time: string;
    environment: string;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    // GET CURRENT DEPLOYMENT METRICS
    const metrics = await getDeploymentMetrics();
    
    // CHECK IF ACTION IS REQUESTED
    if (action === 'check_rollback') {
      const rollbackNeeded = shouldTriggerRollback(metrics);
      return NextResponse.json({
        rollback_needed: rollbackNeeded,
        reason: getRollbackReason(metrics),
        metrics: metrics
      });
    }
    
    if (action === 'trigger_alert') {
      await triggerDeploymentAlert(metrics);
      return NextResponse.json({
        alert_sent: true,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Deployment monitoring error:', error);
    
    return NextResponse.json({
      status: 'failed',
      error: 'Monitoring system failure',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { action, data } = await request.json();
  
  try {
    switch (action) {
      case 'report_error':
        await logDeploymentError(data);
        return NextResponse.json({ logged: true });
        
      case 'update_metrics':
        await updateDeploymentMetrics(data);
        return NextResponse.json({ updated: true });
        
      case 'trigger_rollback':
        const rollbackResult = await triggerRollback(data.reason);
        return NextResponse.json(rollbackResult);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Deployment monitoring POST error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}

async function getDeploymentMetrics(): Promise<DeploymentMetrics> {
  const database = db();
  
  // Get basic deployment info
  const deploymentId = process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev';
  const deploymentTime = process.env.VERCEL_GIT_COMMIT_TIMESTAMP || new Date().toISOString();
  
  // Calculate metrics
  const errorRate = await calculateErrorRate();
  const responseTime = await calculateResponseTime();
  const successRate = await calculateSuccessRate();
  const activeUsers = await getActiveUsersCount();
  const databaseHealth = await getDatabaseHealth();
  
  // Define thresholds
  const thresholds = {
    max_error_rate: parseFloat(process.env.ROLLBACK_ERROR_THRESHOLD || '10'), // 10%
    max_response_time: parseFloat(process.env.ROLLBACK_RESPONSE_TIME_MAX || '5000'), // 5 seconds
    min_success_rate: parseFloat(process.env.ROLLBACK_SUCCESS_RATE_MIN || '95') // 95%
  };
  
  // Determine status
  let status: 'deploying' | 'healthy' | 'degraded' | 'failed' = 'healthy';
  
  if (errorRate > thresholds.max_error_rate || successRate < thresholds.min_success_rate) {
    status = 'failed';
  } else if (responseTime > thresholds.max_response_time || databaseHealth < 80) {
    status = 'degraded';
  }
  
  // Determine actions
  const actions = {
    alert_triggered: errorRate > 5 || responseTime > 3000,
    rollback_recommended: status === 'failed',
    auto_scaling_active: activeUsers > 100 // Scale up if more than 100 active users
  };
  
  return {
    deployment_id: deploymentId,
    status,
    timestamp: new Date().toISOString(),
    metrics: {
      error_rate: errorRate,
      response_time_p95: responseTime,
      success_rate: successRate,
      active_users: activeUsers,
      database_health: databaseHealth
    },
    thresholds,
    actions,
    deployment_info: {
      version: '1.0.0',
      commit_hash: deploymentId.substring(0, 8),
      deployment_time: deploymentTime,
      environment: process.env.NODE_ENV || 'development'
    }
  };
}

async function calculateErrorRate(): Promise<number> {
  // In a real implementation, this would query logs or metrics
  // For now, simulate based on system health
  try {
    const database = db();
    await database.execute('SELECT 1');
    return 0.1; // 0.1% error rate when healthy
  } catch {
    return 15; // 15% error rate when database is down
  }
}

async function calculateResponseTime(): Promise<number> {
  const startTime = performance.now();
  try {
    const database = db();
    await database.execute('SELECT COUNT(*) FROM User LIMIT 1');
    return performance.now() - startTime;
  } catch {
    return 8000; // High response time when database issues
  }
}

async function calculateSuccessRate(): Promise<number> {
  // Simulate success rate based on system health
  try {
    const database = db();
    await database.execute('SELECT 1');
    return 99.5; // 99.5% success rate when healthy
  } catch {
    return 85; // 85% success rate when database issues
  }
}

async function getActiveUsersCount(): Promise<number> {
  try {
    const database = db();
    // Get users who have been active in the last hour
    const result = await database.execute(`
      SELECT COUNT(DISTINCT userId) as count 
      FROM ProgressReport 
      WHERE submittedAt > datetime('now', '-1 hour')
    `);
    return result.rows[0]?.count as number || 0;
  } catch {
    return 0;
  }
}

async function getDatabaseHealth(): Promise<number> {
  try {
    const startTime = performance.now();
    const database = db();
    
    // Test multiple operations
    await database.execute('SELECT 1');
    await database.execute('SELECT COUNT(*) FROM User LIMIT 1');
    await database.execute('SELECT COUNT(*) FROM ProgressReport LIMIT 1');
    
    const responseTime = performance.now() - startTime;
    
    // Health score based on response time
    if (responseTime < 100) return 100; // Excellent
    if (responseTime < 500) return 90;  // Good
    if (responseTime < 1000) return 80; // Fair
    if (responseTime < 2000) return 60; // Poor
    return 40; // Critical
  } catch (error) {
    console.error('Database health check failed:', error);
    return 0; // Failed
  }
}

function shouldTriggerRollback(metrics: DeploymentMetrics): boolean {
  const { error_rate, success_rate, response_time_p95 } = metrics.metrics;
  const { max_error_rate, min_success_rate, max_response_time } = metrics.thresholds;
  
  return (
    error_rate > max_error_rate ||
    success_rate < min_success_rate ||
    response_time_p95 > max_response_time
  );
}

function getRollbackReason(metrics: DeploymentMetrics): string {
  const { error_rate, success_rate, response_time_p95 } = metrics.metrics;
  const { max_error_rate, min_success_rate, max_response_time } = metrics.thresholds;
  
  const reasons = [];
  
  if (error_rate > max_error_rate) {
    reasons.push(`High error rate: ${error_rate}% (threshold: ${max_error_rate}%)`);
  }
  
  if (success_rate < min_success_rate) {
    reasons.push(`Low success rate: ${success_rate}% (threshold: ${min_success_rate}%)`);
  }
  
  if (response_time_p95 > max_response_time) {
    reasons.push(`High response time: ${response_time_p95}ms (threshold: ${max_response_time}ms)`);
  }
  
  return reasons.join(', ') || 'Manual rollback requested';
}

async function triggerDeploymentAlert(metrics: DeploymentMetrics): Promise<void> {
  const webhookUrl = process.env.ERROR_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('No webhook configured for alerts');
    return;
  }
  
  const alertPayload = {
    text: `🚨 Deployment Health Alert`,
    attachments: [{
      color: metrics.status === 'failed' ? 'danger' : 'warning',
      fields: [
        {
          title: 'Status',
          value: metrics.status.toUpperCase(),
          short: true
        },
        {
          title: 'Error Rate',
          value: `${metrics.metrics.error_rate}%`,
          short: true
        },
        {
          title: 'Success Rate',
          value: `${metrics.metrics.success_rate}%`,
          short: true
        },
        {
          title: 'Response Time',
          value: `${metrics.metrics.response_time_p95}ms`,
          short: true
        },
        {
          title: 'Deployment',
          value: metrics.deployment_info.commit_hash,
          short: true
        },
        {
          title: 'Environment',
          value: metrics.deployment_info.environment,
          short: true
        }
      ]
    }]
  };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertPayload)
    });
  } catch (error) {
    console.error('Failed to send alert webhook:', error);
  }
}

async function logDeploymentError(errorData: any): Promise<void> {
  console.error('Deployment Error:', {
    timestamp: new Date().toISOString(),
    deployment_id: process.env.VERCEL_GIT_COMMIT_SHA,
    error: errorData
  });
  
  // In a real implementation, you might store this in a monitoring service
  // or send to an error tracking service like Sentry
}

async function updateDeploymentMetrics(metricsData: any): Promise<void> {
  // Store metrics for trend analysis
  console.log('Deployment Metrics Update:', {
    timestamp: new Date().toISOString(),
    deployment_id: process.env.VERCEL_GIT_COMMIT_SHA,
    metrics: metricsData
  });
}

async function triggerRollback(reason: string): Promise<any> {
  // This would trigger an automated rollback in a real implementation
  // For now, we log the rollback recommendation
  
  const rollbackInfo = {
    triggered: false,
    reason,
    timestamp: new Date().toISOString(),
    deployment_id: process.env.VERCEL_GIT_COMMIT_SHA,
    message: 'Automatic rollback would be triggered here in production'
  };
  
  console.error('ROLLBACK TRIGGER:', rollbackInfo);
  
  // Send critical alert
  await triggerDeploymentAlert({
    deployment_id: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    status: 'failed',
    timestamp: new Date().toISOString(),
    metrics: {
      error_rate: 100,
      response_time_p95: 0,
      success_rate: 0,
      active_users: 0,
      database_health: 0
    },
    thresholds: { max_error_rate: 10, max_response_time: 5000, min_success_rate: 95 },
    actions: { alert_triggered: true, rollback_recommended: true, auto_scaling_active: false },
    deployment_info: {
      version: '1.0.0',
      commit_hash: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      deployment_time: process.env.VERCEL_GIT_COMMIT_TIMESTAMP || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
  
  return rollbackInfo;
}