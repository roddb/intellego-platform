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
    // Import Turso adapter synchronously for production
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })

    const client = new PrismaClient({ adapter })
    console.log('✅ Turso connection established successfully')
    return client
  } catch (error) {
    console.warn('⚠️  Turso adapter failed, using local SQLite:', error)
    return new PrismaClient()
  }
}

// Inicialización del cliente
if (process.env.NODE_ENV === 'production') {
  // En producción, intentar usar Turso, fallback a SQLite local
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    prisma = createTursoClient()
  } else {
    console.log('Production: Using local SQLite database')
    prisma = new PrismaClient()
  }
} else {
  // En desarrollo
  if (!global.__prisma) {
    global.__prisma = new PrismaClient()
  }
  prisma = global.__prisma
  console.log('Development: Local SQLite client initialized')
}

// Función async para crear cliente (para compatibilidad)
async function createPrismaClient() {
  return prisma
}

export { prisma, createPrismaClient }