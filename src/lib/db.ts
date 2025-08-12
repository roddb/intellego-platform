import { createClient, Client } from '@libsql/client'

let _db: Client
let connectionHealth = {
  isHealthy: true,
  lastCheck: new Date(),
  consecutiveFailures: 0,
  totalQueries: 0,
  avgResponseTime: 0
}

declare global {
  var __db: Client | undefined
}

// Enhanced Turso libSQL configuration with monitoring
console.log('🔧 Enhanced Turso libSQL Database configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  has_TURSO_URL: !!process.env.TURSO_DATABASE_URL,
  has_TURSO_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
  TURSO_URL_start: process.env.TURSO_DATABASE_URL?.substring(0, 30) + '...',
  sync_interval: process.env.TURSO_SYNC_INTERVAL || '10s',
  read_your_writes: process.env.TURSO_READ_YOUR_WRITES || 'true'
})

// Advanced Turso libSQL client configuration
function createOptimizedTursoClient(): Client {
  try {
    console.log('🚀 Creating optimized Turso libSQL client...')
    
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      // Turso-specific optimizations
      syncInterval: parseInt(process.env.TURSO_SYNC_INTERVAL || '10000'), // 10s default
      encryptionKey: process.env.TURSO_ENCRYPTION_KEY, // Optional encryption
      // Connection pool settings for edge functions
      intMode: "number" as const, // Better performance with numbers
    })
    
    console.log('✅ Optimized Turso libSQL client created successfully')
    return client
    
  } catch (error) {
    console.error('❌ Failed to create optimized Turso client:', error)
    throw error
  }
}

// Fallback local SQLite client
function createLocalSQLiteClient(): Client {
  try {
    console.log('🛠️ Creating local SQLite client for development...')
    
    const client = createClient({
      url: 'file:./prisma/data/intellego.db',
      intMode: "number" as const
    })
    
    console.log('✅ Local SQLite client created successfully')
    return client
    
  } catch (error) {
    console.error('❌ Failed to create local SQLite client:', error)
    throw error
  }
}

// Enhanced lazy initialization with health monitoring
function getClient(): Client {
  if (!_db) {
    if (process.env.NODE_ENV === 'production') {
      // Production: Use optimized Turso client
      if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        _db = createOptimizedTursoClient()
        console.log('🚀 Production: Optimized Turso libSQL client initialized')
      } else {
        console.error('❌ Missing Turso credentials in production')
        throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production')
      }
    } else {
      // Development: Use local SQLite with global caching
      if (!global.__db) {
        global.__db = createLocalSQLiteClient()
      }
      _db = global.__db
      console.log('🛠️ Development: Local SQLite client initialized')
    }
  }
  return _db
}

// Health check function for connection monitoring
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  consecutiveFailures: number;
  totalQueries: number;
  avgResponseTime: number;
}> {
  const startTime = Date.now()
  
  try {
    const client = getClient()
    await client.execute('SELECT 1 as healthcheck')
    
    const responseTime = Date.now() - startTime
    connectionHealth.isHealthy = true
    connectionHealth.lastCheck = new Date()
    connectionHealth.consecutiveFailures = 0
    connectionHealth.totalQueries++
    connectionHealth.avgResponseTime = 
      (connectionHealth.avgResponseTime + responseTime) / 2
    
    console.log('✅ Database health check passed:', { responseTime })
    
    return {
      isHealthy: true,
      lastCheck: connectionHealth.lastCheck,
      responseTime,
      consecutiveFailures: 0,
      totalQueries: connectionHealth.totalQueries,
      avgResponseTime: connectionHealth.avgResponseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    connectionHealth.isHealthy = false
    connectionHealth.lastCheck = new Date()
    connectionHealth.consecutiveFailures++
    
    console.error('❌ Database health check failed:', error, { responseTime })
    
    return {
      isHealthy: false,
      lastCheck: connectionHealth.lastCheck,
      responseTime,
      consecutiveFailures: connectionHealth.consecutiveFailures,
      totalQueries: connectionHealth.totalQueries,
      avgResponseTime: connectionHealth.avgResponseTime
    }
  }
}

// Retry mechanism for critical operations
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`)
      }
      
      const result = await operation()
      
      if (attempt > 0) {
        console.log('✅ Operation succeeded after retry')
      }
      
      return result
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        console.error(`❌ Operation failed after ${maxRetries + 1} attempts:`, error)
        break
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Exportar getter del cliente
export const db = getClient

// Enhanced query function with performance monitoring and retry mechanism
export const query = async (sql: string, params?: any[], retryOnFailure: boolean = true) => {
  const startTime = Date.now()
  const operation = async () => {
    try {
      const client = getClient()
      const result = params ? await client.execute({ sql, args: params }) : await client.execute(sql)
      
      // Update connection health metrics
      const responseTime = Date.now() - startTime
      connectionHealth.totalQueries++
      connectionHealth.avgResponseTime = 
        (connectionHealth.avgResponseTime + responseTime) / 2
      
      // Log slow queries for optimization
      if (responseTime > 1000) {
        console.warn('🐌 Slow query detected:', {
          sql: sql.substring(0, 100) + '...',
          responseTime,
          paramsCount: params?.length || 0
        })
      }
      
      return result
    } catch (error) {
      connectionHealth.consecutiveFailures++
      console.error('❌ Query error:', {
        sql: sql.substring(0, 100) + '...',
        error: error instanceof Error ? error.message : String(error),
        responseTime: Date.now() - startTime
      })
      throw error
    }
  }
  
  return retryOnFailure ? await executeWithRetry(operation) : await operation()
}

// Batch query execution for better performance
export const batchQuery = async (queries: Array<{ sql: string; params?: any[] }>) => {
  const startTime = Date.now()
  
  try {
    const client = getClient()
    const results = await Promise.all(
      queries.map(({ sql, params }) => 
        params ? client.execute({ sql, args: params }) : client.execute(sql)
      )
    )
    
    const totalTime = Date.now() - startTime
    console.log(`✅ Batch query completed: ${queries.length} queries in ${totalTime}ms`)
    
    return results
  } catch (error) {
    console.error('❌ Batch query error:', error)
    throw error
  }
}

// Transaction support for data consistency
export const transaction = async <T>(
  operations: (client: Client) => Promise<T>
): Promise<T> => {
  const startTime = Date.now()
  const client = getClient()
  
  try {
    await client.execute('BEGIN TRANSACTION')
    console.log('🔄 Transaction started')
    
    const result = await operations(client)
    
    await client.execute('COMMIT')
    const totalTime = Date.now() - startTime
    console.log(`✅ Transaction completed in ${totalTime}ms`)
    
    return result
  } catch (error) {
    console.error('❌ Transaction error, rolling back:', error)
    try {
      await client.execute('ROLLBACK')
      console.log('🔄 Transaction rolled back')
    } catch (rollbackError) {
      console.error('❌ Rollback error:', rollbackError)
    }
    throw error
  }
}

// Connection pool management for Vercel edge functions
export const warmUpConnection = async (): Promise<void> => {
  try {
    console.log('🔥 Warming up database connection...')
    await query('SELECT 1 as warmup', [], false)
    console.log('✅ Database connection warmed up')
  } catch (error) {
    console.error('❌ Connection warmup failed:', error)
  }
}

// Additional exports (health monitoring functions already exported above)
export { executeWithRetry }