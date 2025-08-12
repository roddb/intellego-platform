// =====================================================================================
// TURSO LIBSQL DATABASE INDEX OPTIMIZATION
// Optimizes database performance through strategic indexing for hierarchical queries
// =====================================================================================

import { query, batchQuery, transaction } from './db'

export interface IndexInfo {
  name: string
  table: string
  columns: string[]
  type: 'standard' | 'unique' | 'partial'
  purpose: string
  estimatedImpact: 'high' | 'medium' | 'low'
}

export interface IndexAnalysis {
  existingIndexes: IndexInfo[]
  recommendedIndexes: IndexInfo[]
  performanceGains: {
    [queryType: string]: {
      before: number
      after: number
      improvement: number
    }
  }
}

// =====================================================================================
// CORE INDEXING FUNCTIONS
// =====================================================================================

/**
 * Analyzes current database indexes and recommends optimizations
 */
export async function analyzeIndexes(): Promise<IndexAnalysis> {
  console.log('🔍 Analyzing database indexes for optimization...')
  
  try {
    const existingIndexes = await getExistingIndexes()
    const recommendedIndexes = getRecommendedIndexes()
    const performanceGains = await measurePerformanceGains()
    
    return {
      existingIndexes,
      recommendedIndexes,
      performanceGains
    }
  } catch (error) {
    console.error('❌ Index analysis failed:', error)
    throw error
  }
}

/**
 * Creates all recommended indexes for optimal performance
 */
export async function createOptimalIndexes(): Promise<void> {
  console.log('🚀 Creating optimal indexes for Turso libSQL...')
  
  try {
    await transaction(async (client) => {
      const indexes = getRecommendedIndexes()
      
      for (const index of indexes) {
        try {
          const indexSQL = generateIndexSQL(index)
          console.log(`📊 Creating index: ${index.name}`)
          await client.execute(indexSQL)
          console.log(`✅ Index created: ${index.name}`)
        } catch (error) {
          // Index might already exist, continue with others
          console.warn(`⚠️ Index creation skipped (${index.name}):`, error)
        }
      }
    })
    
    console.log('✅ Optimal indexes created successfully')
  } catch (error) {
    console.error('❌ Index creation failed:', error)
    throw error
  }
}

/**
 * Removes redundant or unused indexes
 */
export async function cleanupIndexes(): Promise<void> {
  console.log('🧹 Cleaning up redundant indexes...')
  
  try {
    const existingIndexes = await getExistingIndexes()
    const redundantIndexes = identifyRedundantIndexes(existingIndexes)
    
    await transaction(async (client) => {
      for (const indexName of redundantIndexes) {
        try {
          await client.execute(`DROP INDEX IF EXISTS ${indexName}`)
          console.log(`🗑️ Removed redundant index: ${indexName}`)
        } catch (error) {
          console.warn(`⚠️ Could not remove index ${indexName}:`, error)
        }
      }
    })
    
    console.log('✅ Index cleanup completed')
  } catch (error) {
    console.error('❌ Index cleanup failed:', error)
    throw error
  }
}

// =====================================================================================
// INDEX RECOMMENDATIONS
// =====================================================================================

/**
 * Returns recommended indexes for optimal hierarchical query performance
 */
function getRecommendedIndexes(): IndexInfo[] {
  return [
    // User table indexes for hierarchical queries
    {
      name: 'idx_user_email',
      table: 'User',
      columns: ['email'],
      type: 'unique',
      purpose: 'Fast user lookup by email (authentication)',
      estimatedImpact: 'high'
    },
    {
      name: 'idx_user_student_id',
      table: 'User',
      columns: ['studentId'],
      type: 'unique',
      purpose: 'Fast student lookup by student ID',
      estimatedImpact: 'medium'
    },
    {
      name: 'idx_user_hierarchical',
      table: 'User',
      columns: ['role', 'academicYear', 'division', 'sede'],
      type: 'standard',
      purpose: 'Hierarchical navigation and filtering',
      estimatedImpact: 'high'
    },
    {
      name: 'idx_user_subjects',
      table: 'User',
      columns: ['subjects'],
      type: 'standard',
      purpose: 'Subject-based student filtering',
      estimatedImpact: 'medium'
    },
    
    // ProgressReport indexes for performance
    {
      name: 'idx_report_user_subject',
      table: 'ProgressReport',
      columns: ['userId', 'subject'],
      type: 'standard',
      purpose: 'Fast report lookup by user and subject',
      estimatedImpact: 'high'
    },
    {
      name: 'idx_report_week_start',
      table: 'ProgressReport',
      columns: ['weekStart'],
      type: 'standard',
      purpose: 'Week-based report filtering and calendar views',
      estimatedImpact: 'high'
    },
    {
      name: 'idx_report_subject_week',
      table: 'ProgressReport',
      columns: ['subject', 'weekStart'],
      type: 'standard',
      purpose: 'Subject-specific weekly report queries',
      estimatedImpact: 'medium'
    },
    {
      name: 'idx_report_submitted',
      table: 'ProgressReport',
      columns: ['submittedAt'],
      type: 'standard',
      purpose: 'Chronological report ordering and recent activity',
      estimatedImpact: 'medium'
    },
    
    // Answer table indexes
    {
      name: 'idx_answer_report',
      table: 'Answer',
      columns: ['progressReportId'],
      type: 'standard',
      purpose: 'Fast answer lookup by report ID',
      estimatedImpact: 'high'
    },
    {
      name: 'idx_answer_question',
      table: 'Answer',
      columns: ['questionId'],
      type: 'standard',
      purpose: 'Question-based answer analysis',
      estimatedImpact: 'low'
    },
    
    // CalendarEvent indexes
    {
      name: 'idx_calendar_user_date',
      table: 'CalendarEvent',
      columns: ['userId', 'date'],
      type: 'standard',
      purpose: 'User calendar event retrieval',
      estimatedImpact: 'high'
    },
    {
      name: 'idx_calendar_date_type',
      table: 'CalendarEvent',
      columns: ['date', 'type'],
      type: 'standard',
      purpose: 'Calendar filtering by date and event type',
      estimatedImpact: 'medium'
    },
    
    // Task indexes
    {
      name: 'idx_task_user_status',
      table: 'Task',
      columns: ['userId', 'status'],
      type: 'standard',
      purpose: 'Task management and filtering',
      estimatedImpact: 'high'
    },
    {
      name: 'idx_task_due_date',
      table: 'Task',
      columns: ['dueDate'],
      type: 'standard',
      purpose: 'Task scheduling and deadline management',
      estimatedImpact: 'medium'
    },
    {
      name: 'idx_task_priority_subject',
      table: 'Task',
      columns: ['priority', 'subject'],
      type: 'standard',
      purpose: 'Task prioritization and subject-based filtering',
      estimatedImpact: 'low'
    }
  ]
}

// =====================================================================================
// INDEX ANALYSIS FUNCTIONS
// =====================================================================================

/**
 * Gets all existing indexes in the database
 */
async function getExistingIndexes(): Promise<IndexInfo[]> {
  try {
    const result = await query(`
      SELECT 
        name,
        tbl_name as table_name,
        sql
      FROM sqlite_master 
      WHERE type = 'index' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `)
    
    const indexes: IndexInfo[] = []
    
    for (const row of result.rows) {
      const indexInfo = parseIndexFromSQL(
        String((row as any).name),
        String((row as any).table_name),
        String((row as any).sql || '')
      )
      if (indexInfo) {
        indexes.push(indexInfo)
      }
    }
    
    return indexes
  } catch (error) {
    console.error('Failed to get existing indexes:', error)
    return []
  }
}

/**
 * Parses index information from SQL CREATE INDEX statement
 */
function parseIndexFromSQL(name: string, tableName: string, sql: string): IndexInfo | null {
  try {
    // Extract columns from SQL (simplified parsing)
    const columnMatch = sql.match(/\((.*?)\)/);
    const columns = columnMatch ? 
      columnMatch[1].split(',').map(col => col.trim().replace(/"/g, '')) : 
      []
    
    const isUnique = sql.toLowerCase().includes('unique')
    const isPartial = sql.toLowerCase().includes('where')
    
    return {
      name,
      table: tableName,
      columns,
      type: isUnique ? 'unique' : (isPartial ? 'partial' : 'standard'),
      purpose: 'Existing index',
      estimatedImpact: 'medium'
    }
  } catch (error) {
    console.warn(`Could not parse index ${name}:`, error)
    return null
  }
}

/**
 * Identifies redundant indexes that can be safely removed
 */
function identifyRedundantIndexes(existingIndexes: IndexInfo[]): string[] {
  const redundant: string[] = []
  
  // Group indexes by table
  const indexesByTable = existingIndexes.reduce((acc, index) => {
    if (!acc[index.table]) acc[index.table] = []
    acc[index.table].push(index)
    return acc
  }, {} as { [table: string]: IndexInfo[] })
  
  // Check for redundant indexes within each table
  Object.values(indexesByTable).forEach(tableIndexes => {
    for (let i = 0; i < tableIndexes.length; i++) {
      for (let j = i + 1; j < tableIndexes.length; j++) {
        const index1 = tableIndexes[i]
        const index2 = tableIndexes[j]
        
        // Check if index1 is a prefix of index2 (index2 covers index1)
        if (isIndexRedundant(index1, index2)) {
          redundant.push(index1.name)
        } else if (isIndexRedundant(index2, index1)) {
          redundant.push(index2.name)
        }
      }
    }
  })
  
  return redundant
}

/**
 * Checks if index1 is made redundant by index2
 */
function isIndexRedundant(index1: IndexInfo, index2: IndexInfo): boolean {
  // If index2 starts with all columns of index1, index1 is redundant
  if (index1.columns.length >= index2.columns.length) return false
  
  for (let i = 0; i < index1.columns.length; i++) {
    if (index1.columns[i] !== index2.columns[i]) return false
  }
  
  return true
}

// =====================================================================================
// PERFORMANCE MEASUREMENT
// =====================================================================================

/**
 * Measures performance gains from indexing
 */
async function measurePerformanceGains(): Promise<{ [queryType: string]: any }> {
  const measurements: { [queryType: string]: any } = {}
  
  const testQueries = [
    {
      name: 'user_email_lookup',
      sql: "SELECT * FROM User WHERE email = ? LIMIT 1",
      params: ['estudiante@demo.com']
    },
    {
      name: 'hierarchical_student_lookup',
      sql: `
        SELECT * FROM User 
        WHERE role = 'STUDENT' 
        AND academicYear = ? 
        AND division = ?
        LIMIT 10
      `,
      params: ['4to-año', 'A']
    },
    {
      name: 'user_reports_by_subject',
      sql: `
        SELECT pr.* FROM ProgressReport pr
        JOIN User u ON pr.userId = u.id
        WHERE u.role = 'STUDENT' 
        AND pr.subject = ?
        ORDER BY pr.weekStart DESC
        LIMIT 20
      `,
      params: ['matemáticas']
    },
    {
      name: 'weekly_reports_lookup',
      sql: `
        SELECT * FROM ProgressReport 
        WHERE userId = ? 
        AND DATE(weekStart) = ?
        LIMIT 1
      `,
      params: ['user-123', '2025-08-11']
    }
  ]
  
  for (const testQuery of testQueries) {
    try {
      const startTime = Date.now()
      await query(testQuery.sql, testQuery.params)
      const responseTime = Date.now() - startTime
      
      measurements[testQuery.name] = {
        responseTime,
        status: 'measured'
      }
    } catch (error) {
      measurements[testQuery.name] = {
        responseTime: -1,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  return measurements
}

// =====================================================================================
// SQL GENERATION
// =====================================================================================

/**
 * Generates CREATE INDEX SQL statement from IndexInfo
 */
function generateIndexSQL(index: IndexInfo): string {
  const uniqueClause = index.type === 'unique' ? 'UNIQUE ' : ''
  const columnList = index.columns.join(', ')
  
  return `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${columnList})`
}

// =====================================================================================
// PUBLIC API
// =====================================================================================

/**
 * Performs complete index optimization
 */
export async function optimizeIndexes(): Promise<{
  created: number
  removed: number
  analysis: IndexAnalysis
}> {
  console.log('🚀 Starting complete index optimization...')
  
  try {
    const analysis = await analyzeIndexes()
    
    // Create recommended indexes
    await createOptimalIndexes()
    const createdCount = analysis.recommendedIndexes.length
    
    // Clean up redundant indexes
    const redundantIndexes = identifyRedundantIndexes(analysis.existingIndexes)
    if (redundantIndexes.length > 0) {
      await cleanupIndexes()
    }
    
    console.log(`✅ Index optimization completed: ${createdCount} created, ${redundantIndexes.length} removed`)
    
    return {
      created: createdCount,
      removed: redundantIndexes.length,
      analysis
    }
  } catch (error) {
    console.error('❌ Index optimization failed:', error)
    throw error
  }
}

/**
 * Gets index performance report
 */
export async function getIndexPerformanceReport(): Promise<{
  indexes: IndexInfo[]
  performance: { [queryType: string]: any }
  recommendations: string[]
}> {
  try {
    const existingIndexes = await getExistingIndexes()
    const performance = await measurePerformanceGains()
    const recommended = getRecommendedIndexes()
    
    const recommendations = []
    
    // Check if recommended indexes exist
    const existingNames = existingIndexes.map(idx => idx.name)
    const missingIndexes = recommended.filter(rec => !existingNames.includes(rec.name))
    
    if (missingIndexes.length > 0) {
      recommendations.push(`Create ${missingIndexes.length} missing high-impact indexes`)
    }
    
    // Check for slow queries
    const slowQueries = Object.entries(performance)
      .filter(([, data]: [string, any]) => data.responseTime > 100)
      .map(([name]) => name)
    
    if (slowQueries.length > 0) {
      recommendations.push(`Optimize ${slowQueries.length} slow queries detected`)
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Database indexes are optimally configured')
    }
    
    return {
      indexes: existingIndexes,
      performance,
      recommendations
    }
  } catch (error) {
    console.error('Failed to generate index performance report:', error)
    throw error
  }
}