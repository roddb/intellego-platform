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

// Función para inicializar Prisma con Turso (solo en runtime)
function initializeTursoClient() {
  try {
    // Solo importar dinámicamente en tiempo de ejecución
    const { PrismaLibSQL } = eval('require')('@prisma/adapter-libsql')
    
    console.log('Connecting to Turso database...')
    
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })

    return new PrismaClient({ adapter })
  } catch (error) {
    console.error('Turso setup failed, falling back to basic client:', error)
    return new PrismaClient()
  }
}

// Inicializar Prisma Client
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // En producción con Turso, usar inicialización dinámica
  prisma = initializeTursoClient()
  console.log('Turso connection established successfully')
} else {
  // En desarrollo, usar SQLite local
  console.log('Using local SQLite database...')
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient()
  } else {
    if (!global.__prisma) {
      global.__prisma = new PrismaClient()
    }
    prisma = global.__prisma
  }
}

export { prisma }