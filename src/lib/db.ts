import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

// Configuración de la base de datos
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  has_TURSO_URL: !!process.env.TURSO_DATABASE_URL,
  has_TURSO_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
  TURSO_URL_start: process.env.TURSO_DATABASE_URL?.substring(0, 20) + '...'
})

// Función para crear Prisma client con Turso adapter
function createTursoClient() {
  try {
    console.log('🔧 Starting Turso client creation...')
    console.log('📍 TURSO_DATABASE_URL length:', process.env.TURSO_DATABASE_URL?.length)
    console.log('📍 TURSO_AUTH_TOKEN length:', process.env.TURSO_AUTH_TOKEN?.length)
    
    // Import Turso adapter synchronously for production
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    const { createClient } = require('@libsql/client')
    console.log('✅ Turso modules imported successfully')
    
    // Create libSQL client first
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
    console.log('✅ libSQL client created')
    
    // Create Prisma adapter with libSQL client
    const adapter = new PrismaLibSQL(libsql)
    console.log('✅ Prisma adapter created')

    const client = new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    })
    console.log('✅ Turso connection established successfully')
    return client
  } catch (error) {
    console.error('❌ Turso adapter failed at step:', error)
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Inicialización del cliente
if (process.env.NODE_ENV === 'production') {
  // En producción, siempre usar Turso
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    try {
      prisma = createTursoClient()
    } catch (error) {
      console.error('❌ Failed to initialize Turso client in production:', error)
      throw new Error('Database connection failed in production')
    }
  } else {
    console.error('❌ Missing Turso credentials in production')
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production')
  }
} else {
  // En desarrollo
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn']
    })
  }
  prisma = global.__prisma
  console.log('Development: Local SQLite client initialized')
}

// Función async para crear cliente (para compatibilidad)
async function createPrismaClient() {
  return prisma
}

export { prisma, createPrismaClient }