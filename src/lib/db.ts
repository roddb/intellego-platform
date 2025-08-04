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

// Función para crear Prisma client con manejo robusto de errores
async function createPrismaClient() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN && process.env.NODE_ENV === 'production') {
    // Solo intentar usar Turso adapter en producción real (runtime)
    try {
      console.log('Attempting to initialize Turso connection...')
      // Dynamic import to avoid webpack build issues
      const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
      
      const adapter = new PrismaLibSQL({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      })

      const client = new PrismaClient({ adapter })
      console.log('✅ Turso connection established successfully')
      return client
    } catch (error) {
      console.warn('⚠️  Turso adapter failed, falling back to basic client:', error)
      // Fallback para producción sin adapter
      return new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || "file:./prisma/data/intellego.db"
          }
        }
      })
    }
  } else {
    // Desarrollo - usar SQLite local
    console.log('Using local SQLite database...')
    return new PrismaClient()
  }
}

// Inicialización síncrona para compatibilidad
if (process.env.NODE_ENV === 'production') {
  // En producción, usar PrismaClient básico para evitar webpack issues durante build
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "file:./prisma/data/intellego.db"
      }
    }
  })
  console.log('Production: Basic PrismaClient initialized for build compatibility')
} else {
  // En desarrollo
  if (!global.__prisma) {
    global.__prisma = new PrismaClient()
  }
  prisma = global.__prisma
  console.log('Development: Local SQLite client initialized')
}

export { prisma, createPrismaClient }