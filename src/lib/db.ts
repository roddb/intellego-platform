import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

// Configuración simplificada
console.log('🔧 Database configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL_set: !!process.env.DATABASE_URL,
  DATABASE_URL_type: process.env.DATABASE_URL?.startsWith('libsql://') ? 'turso' : 'local'
})

// Inicialización simplificada
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production: Initializing Prisma client')
  prisma = new PrismaClient({
    log: ['error']
  })
  console.log('✅ Production Prisma client initialized')
} else {
  // En desarrollo
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