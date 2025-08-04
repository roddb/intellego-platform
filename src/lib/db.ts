import { createClient, Client } from '@libsql/client'

let db: Client

declare global {
  var __db: Client | undefined
}

// Configuración libSQL directo
console.log('🔧 libSQL Database configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  has_TURSO_URL: !!process.env.TURSO_DATABASE_URL,
  has_TURSO_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
  TURSO_URL_start: process.env.TURSO_DATABASE_URL?.substring(0, 30) + '...'
})

// Función para crear cliente libSQL directo
function createLibSQLClient(): Client {
  try {
    console.log('🚀 Creating libSQL client direct connection...')
    
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
    
    console.log('✅ libSQL direct client created successfully')
    return client
    
  } catch (error) {
    console.error('❌ Failed to create libSQL client:', error)
    throw error
  }
}

// Inicialización del cliente libSQL
if (process.env.NODE_ENV === 'production') {
  // En producción, usar Turso directo
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    db = createLibSQLClient()
    console.log('🚀 Production: libSQL client initialized')
  } else {
    console.error('❌ Missing Turso credentials in production')
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production')
  }
} else {
  // En desarrollo, usar SQLite local
  if (!global.__db) {
    global.__db = createClient({
      url: 'file:./prisma/data/intellego.db'
    })
  }
  db = global.__db
  console.log('🛠️ Development: Local SQLite client initialized')
}

// Exportar cliente
export { db }

// Función helper para queries
export const query = async (sql: string, params?: any[]) => {
  try {
    const result = await db.execute(sql, params)
    return result
  } catch (error) {
    console.error('❌ Query error:', error)
    throw error
  }
}