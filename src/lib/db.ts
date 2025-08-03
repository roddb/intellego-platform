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

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // En producción con Turso, usamos el adaptador
  try {
    const { createClient } = require('@libsql/client')
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    
    console.log('Connecting to Turso database...')
    
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    const adapter = new PrismaLibSQL(libsql)
    prisma = new PrismaClient({ adapter })
    console.log('Turso connection established successfully')
  } catch (error) {
    console.error('Error setting up Turso connection:', error)
    throw error
  }
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