// =====================================================================================
// TURSO HEALTH MONITORING ENDPOINT
// Comprehensive health check and performance monitoring for Turso libSQL
// =====================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  checkDatabaseHealth, 
  query, 
  batchQuery, 
  warmUpConnection 
} from '@/lib/db'
import { 
  performFullSync, 
  getSyncStatus, 
  getSyncConflicts 
} from '@/lib/turso-sync'
import { 
  analyzeIndexes, 
  optimizeIndexes, 
  getIndexPerformanceReport 
} from '@/lib/turso-indexes'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🏥 Starting comprehensive Turso health check...')
    
    // Warm up connection first
    await warmUpConnection()
    
    // Basic health check
    const healthCheck = await checkDatabaseHealth()
    
    // Performance tests
    const performanceResults = await runPerformanceTests()
    
    // Database structure validation
    const structureValidation = await validateDatabaseStructure()
    
    // Sync system status
    const syncStatus = getSyncStatus()
    const syncConflicts = await getSyncConflicts()
    
    // Usage statistics
    const usageStats = await getUsageStatistics()
    
    // Connection pool status
    const connectionInfo = await getConnectionInfo()
    
    // Index performance analysis
    const indexReport = await getIndexPerformanceReport()
    
    const totalTime = Date.now() - startTime
    
    const healthReport = {
      status: healthCheck.isHealthy ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      totalCheckTime: totalTime,
      
      connection: {
        health: healthCheck,
        info: connectionInfo,
        performance: performanceResults
      },
      
      database: {
        structure: structureValidation,
        usage: usageStats
      },
      
      synchronization: {
        status: syncStatus,
        conflicts: syncConflicts.length,
        lastConflict: syncConflicts.length > 0 ? syncConflicts[syncConflicts.length - 1] : null
      },
      
      indexing: {
        totalIndexes: indexReport.indexes.length,
        performance: indexReport.performance,
        recommendations: indexReport.recommendations
      },
      
      recommendations: generateRecommendations(healthCheck, performanceResults, syncStatus, indexReport)
    }
    
    console.log(`✅ Health check completed in ${totalTime}ms`)
    
    return NextResponse.json(healthReport, {
      status: healthCheck.isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Check': healthCheck.isHealthy ? 'PASS' : 'FAIL'
      }
    })
    
  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    const errorReport = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalCheckTime: Date.now() - startTime
    }
    
    return NextResponse.json(errorReport, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    switch (action) {
      case 'force-sync':
        console.log('🚀 Force sync requested via API...')
        const syncResult = await performFullSync()
        return NextResponse.json({ 
          action: 'force-sync',
          result: syncResult,
          message: 'Sync completed successfully'
        })
        
      case 'warm-connection':
        console.log('🔥 Connection warmup requested...')
        await warmUpConnection()
        return NextResponse.json({ 
          action: 'warm-connection',
          message: 'Connection warmed up successfully'
        })
        
      case 'clear-conflicts':
        console.log('🧹 Clear conflicts requested...')
        const { clearResolvedConflicts } = await import('@/lib/turso-sync')
        await clearResolvedConflicts()
        return NextResponse.json({ 
          action: 'clear-conflicts',
          message: 'Conflicts cleared successfully'
        })
        
      case 'optimize-indexes':
        console.log('📊 Index optimization requested...')
        const optimizationResult = await optimizeIndexes()
        return NextResponse.json({ 
          action: 'optimize-indexes',
          result: optimizationResult,
          message: `Indexes optimized: ${optimizationResult.created} created, ${optimizationResult.removed} removed`
        })
        
      default:
        return NextResponse.json({ 
          error: `Unknown action: ${action}` 
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Health action failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

// =====================================================================================
// PERFORMANCE TESTING FUNCTIONS
// =====================================================================================

async function runPerformanceTests() {
  console.log('⚡ Running performance tests...')
  
  const tests = []
  
  // Test 1: Simple SELECT query
  const simpleSelectStart = Date.now()
  try {
    await query('SELECT 1 as test')
    tests.push({
      test: 'simple_select',
      status: 'PASS',
      responseTime: Date.now() - simpleSelectStart
    })
  } catch (error) {
    tests.push({
      test: 'simple_select',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - simpleSelectStart
    })
  }
  
  // Test 2: User table query
  const userQueryStart = Date.now()
  try {
    await query('SELECT COUNT(*) as count FROM User LIMIT 1')
    tests.push({
      test: 'user_count_query',
      status: 'PASS',
      responseTime: Date.now() - userQueryStart
    })
  } catch (error) {
    tests.push({
      test: 'user_count_query',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - userQueryStart
    })
  }
  
  // Test 3: Complex hierarchical query
  const complexQueryStart = Date.now()
  try {
    await query(`
      SELECT u.academicYear, u.division, COUNT(pr.id) as reportCount
      FROM User u
      LEFT JOIN ProgressReport pr ON u.id = pr.userId
      WHERE u.role = 'STUDENT'
      GROUP BY u.academicYear, u.division
      LIMIT 10
    `)
    tests.push({
      test: 'complex_hierarchical_query',
      status: 'PASS',
      responseTime: Date.now() - complexQueryStart
    })
  } catch (error) {
    tests.push({
      test: 'complex_hierarchical_query',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - complexQueryStart
    })
  }
  
  // Test 4: Batch query performance
  const batchQueryStart = Date.now()
  try {
    await batchQuery([
      { sql: 'SELECT COUNT(*) as userCount FROM User' },
      { sql: 'SELECT COUNT(*) as reportCount FROM ProgressReport' },
      { sql: 'SELECT COUNT(*) as answerCount FROM Answer' }
    ])
    tests.push({
      test: 'batch_query_performance',
      status: 'PASS',
      responseTime: Date.now() - batchQueryStart
    })
  } catch (error) {
    tests.push({
      test: 'batch_query_performance',
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - batchQueryStart
    })
  }
  
  const avgResponseTime = tests
    .filter(t => t.status === 'PASS')
    .reduce((sum, t) => sum + t.responseTime, 0) / 
    tests.filter(t => t.status === 'PASS').length
  
  return {
    tests,
    summary: {
      totalTests: tests.length,
      passed: tests.filter(t => t.status === 'PASS').length,
      failed: tests.filter(t => t.status === 'FAIL').length,
      avgResponseTime: Math.round(avgResponseTime || 0)
    }
  }
}

// =====================================================================================
// DATABASE VALIDATION FUNCTIONS
// =====================================================================================

async function validateDatabaseStructure() {
  console.log('🔍 Validating database structure...')
  
  const validations = []
  
  // Check all required tables exist
  const requiredTables = ['User', 'ProgressReport', 'Answer', 'CalendarEvent', 'Task']
  
  for (const table of requiredTables) {
    try {
      const result = await query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [table]
      )
      
      validations.push({
        check: `table_${table}_exists`,
        status: result.rows.length > 0 ? 'PASS' : 'FAIL',
        details: result.rows.length > 0 ? 'Table exists' : 'Table missing'
      })
    } catch (error) {
      validations.push({
        check: `table_${table}_exists`,
        status: 'FAIL',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  // Check table relationships
  try {
    const relationshipCheck = await query(`
      SELECT COUNT(*) as orphaned_reports
      FROM ProgressReport pr
      LEFT JOIN User u ON pr.userId = u.id
      WHERE u.id IS NULL
    `)
    
    const orphanedCount = Number((relationshipCheck.rows[0] as any)?.orphaned_reports || 0)
    validations.push({
      check: 'foreign_key_integrity',
      status: orphanedCount === 0 ? 'PASS' : 'WARN',
      details: `${orphanedCount} orphaned progress reports found`
    })
  } catch (error) {
    validations.push({
      check: 'foreign_key_integrity',
      status: 'FAIL',
      details: error instanceof Error ? error.message : String(error)
    })
  }
  
  return {
    validations,
    summary: {
      totalChecks: validations.length,
      passed: validations.filter(v => v.status === 'PASS').length,
      warned: validations.filter(v => v.status === 'WARN').length,
      failed: validations.filter(v => v.status === 'FAIL').length
    }
  }
}

// =====================================================================================
// USAGE STATISTICS
// =====================================================================================

async function getUsageStatistics() {
  console.log('📊 Collecting usage statistics...')
  
  try {
    const stats = await batchQuery([
      { sql: 'SELECT COUNT(*) as totalUsers FROM User' },
      { sql: 'SELECT COUNT(*) as totalReports FROM ProgressReport' },
      { sql: 'SELECT COUNT(*) as totalAnswers FROM Answer' },
      { sql: 'SELECT COUNT(*) as activeStudents FROM User WHERE role = "STUDENT" AND status = "ACTIVE"' },
      { sql: 'SELECT COUNT(*) as thisWeekReports FROM ProgressReport WHERE DATE(submittedAt) >= DATE("now", "-7 days")' }
    ])
    
    return {
      totalUsers: Number((stats[0].rows[0] as any)?.totalUsers || 0),
      totalReports: Number((stats[1].rows[0] as any)?.totalReports || 0),
      totalAnswers: Number((stats[2].rows[0] as any)?.totalAnswers || 0),
      activeStudents: Number((stats[3].rows[0] as any)?.activeStudents || 0),
      thisWeekReports: Number((stats[4].rows[0] as any)?.thisWeekReports || 0),
      calculatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to get usage statistics:', error)
    return {
      error: error instanceof Error ? error.message : String(error),
      calculatedAt: new Date().toISOString()
    }
  }
}

// =====================================================================================
// CONNECTION INFO
// =====================================================================================

async function getConnectionInfo() {
  const env = process.env.NODE_ENV
  
  return {
    environment: env,
    isTursoConfigured: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
    databaseType: env === 'production' && process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite',
    syncInterval: process.env.TURSO_SYNC_INTERVAL || '10000',
    readYourWrites: process.env.TURSO_READ_YOUR_WRITES !== 'false',
    hasEncryption: !!process.env.TURSO_ENCRYPTION_KEY
  }
}

// =====================================================================================
// RECOMMENDATIONS ENGINE
// =====================================================================================

function generateRecommendations(healthCheck: any, performanceResults: any, syncStatus: any, indexReport?: any) {
  const recommendations = []
  
  // Health-based recommendations
  if (!healthCheck.isHealthy) {
    recommendations.push({
      priority: 'HIGH',
      category: 'CONNECTION',
      message: 'Database connection is unhealthy - check Turso credentials and network connectivity',
      action: 'Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables'
    })
  }
  
  if (healthCheck.consecutiveFailures > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'RELIABILITY',
      message: `${healthCheck.consecutiveFailures} consecutive connection failures detected`,
      action: 'Monitor connection stability and consider implementing circuit breaker pattern'
    })
  }
  
  // Performance-based recommendations
  if (performanceResults.summary.avgResponseTime > 1000) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'PERFORMANCE',
      message: `Average query response time is ${performanceResults.summary.avgResponseTime}ms (>1000ms)`,
      action: 'Consider query optimization, indexing, or connection pooling improvements'
    })
  }
  
  if (performanceResults.summary.failed > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'PERFORMANCE',
      message: `${performanceResults.summary.failed} performance tests failed`,
      action: 'Review failed test details and optimize problematic queries'
    })
  }
  
  // Sync-based recommendations
  if (syncStatus.conflicts > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'SYNCHRONIZATION',
      message: `${syncStatus.conflicts} sync conflicts detected`,
      action: 'Review and resolve data synchronization conflicts'
    })
  }
  
  if (!syncStatus.isHealthy) {
    recommendations.push({
      priority: 'HIGH',
      category: 'SYNCHRONIZATION',
      message: 'Data synchronization system is unhealthy',
      action: 'Check sync logs and perform manual sync if necessary'
    })
  }
  
  // Index-based recommendations
  if (indexReport) {
    const slowQueries = Object.entries(indexReport.performance)
      .filter(([, data]: [string, any]) => data.responseTime > 100)
    
    if (slowQueries.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'INDEXING',
        message: `${slowQueries.length} slow queries detected (>100ms)`,
        action: 'Run index optimization to improve query performance'
      })
    }
    
    if (indexReport.recommendations.length > 1) {
      recommendations.push({
        priority: 'LOW',
        category: 'INDEXING',
        message: 'Database indexing can be optimized',
        action: 'Review and implement recommended indexes'
      })
    }
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'INFO',
      category: 'SYSTEM',
      message: 'All systems are running optimally',
      action: 'Continue monitoring for sustained performance'
    })
  }
  
  return recommendations
}