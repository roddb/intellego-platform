import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

// Configuración según documentación oficial de Prisma + Turso
console.log('🔧 Database configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  has_TURSO_URL: !!process.env.TURSO_DATABASE_URL,
  has_TURSO_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
  TURSO_URL_start: process.env.TURSO_DATABASE_URL?.substring(0, 30) + '...'
})

// Función para crear cliente Turso con embedded replicas
function createTursoClient() {
  try {
    console.log('🚀 Creating Turso client with embedded replicas...')
    
    // Importar módulos necesarios
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    const { createClient } = require('@libsql/client')
    
    // Crear cliente libSQL con embedded replica
    const libsql = createClient({
      url: "file:./local-replica.db", // Local embedded replica
      authToken: process.env.TURSO_AUTH_TOKEN!,
      syncUrl: process.env.TURSO_DATABASE_URL!, // Remote primary database
      syncInterval: 60, // Auto-sync every 60 seconds
    })
    
    console.log('✅ libSQL client with embedded replica created')
    
    // Crear adaptador Prisma con el cliente libSQL
    const adapter = new PrismaLibSQL(libsql)
    
    console.log('✅ Turso adapter created successfully')
    
    // Crear cliente Prisma con adaptador
    const client = new PrismaClient({ 
      adapter,
      log: ['error']
    })
    
    console.log('✅ Turso Prisma client with embedded replicas initialized')
    return client
    
  } catch (error) {
    console.error('❌ Failed to create Turso client with embedded replicas:', error)
    throw error
  }
}

// Inicialización según documentación oficial
if (process.env.NODE_ENV === 'production') {
  // En producción, usar Turso con adaptador oficial
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    prisma = createTursoClient()
  } else {
    console.error('❌ Missing Turso credentials in production')
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production')
  }
} else {
  // En desarrollo, usar SQLite local
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn']
    })
  }
  prisma = global.__prisma
  console.log('🛠️ Development: Local SQLite client initialized')
}

// Función async para crear cliente (para compatibilidad)
async function createPrismaClient() {
  return prisma
}

export { prisma, createPrismaClient }