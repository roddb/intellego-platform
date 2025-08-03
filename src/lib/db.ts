import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

// Configuración de la base de datos
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // En producción con Turso, usamos el adaptador
  const { createClient } = require('@libsql/client')
  const { PrismaLibSQL } = require('@prisma/adapter-libsql')
  
  console.log('Connecting to Turso database...')
  
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const adapter = new PrismaLibSQL(libsql)
  prisma = new PrismaClient({ adapter })
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