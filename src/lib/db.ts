import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

// En producción con Turso, usamos el adaptador
if (process.env.NODE_ENV === 'production' && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  const { createClient } = require('@libsql/client')
  const { PrismaLibSQL } = require('@prisma/adapter-libsql')
  
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const adapter = new PrismaLibSQL(libsql)
  prisma = new PrismaClient({ adapter })
} else {
  // En desarrollo, usar SQLite local
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