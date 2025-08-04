import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing direct Turso configuration...')
    
    // Import required modules
    const { PrismaClient } = require('@prisma/client')
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    
    console.log('📦 Modules imported successfully')
    
    // Check environment variables
    const tursoUrl = process.env.TURSO_DATABASE_URL
    const tursoToken = process.env.TURSO_AUTH_TOKEN
    
    console.log('🔑 Environment check:', {
      hasUrl: !!tursoUrl,
      hasToken: !!tursoToken,
      urlStart: tursoUrl?.substring(0, 30) + '...'
    })
    
    if (!tursoUrl || !tursoToken) {
      throw new Error('Missing TURSO credentials')
    }
    
    // Create adapter using direct configuration from documentation
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    })
    
    console.log('✅ Adapter created successfully')
    
    // Create Prisma client with adapter
    const prisma = new PrismaClient({ 
      adapter,
      log: ['error', 'warn']
    })
    
    console.log('✅ Prisma client created')
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query executed successfully:', result)
    
    // Test user count
    const userCount = await prisma.user.count()
    console.log('✅ User count:', userCount)
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Direct Turso configuration works!',
      data: {
        testQuery: result,
        userCount
      }
    })
    
  } catch (error) {
    console.error('❌ Direct Turso test failed:', error)
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'Direct Turso test failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}