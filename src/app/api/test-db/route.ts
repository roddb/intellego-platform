import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db-operations"

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Database test endpoint called')
    
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...')
    const testConnection = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Basic connection successful:', testConnection)
    
    // Test 2: Count users
    console.log('Test 2: Counting users...')
    const userCount = await prisma.user.count()
    console.log('✅ User count:', userCount)
    
    // Test 3: Find first user
    console.log('Test 3: Finding first user...')
    const firstUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true }
    })
    console.log('✅ First user:', firstUser)
    
    // Test 4: Test findUnique with non-existent email
    console.log('Test 4: Testing findUnique with non-existent email...')
    const nonExistentUser = await prisma.user.findUnique({
      where: { email: 'test-nonexistent@example.com' }
    })
    console.log('✅ Non-existent user query result:', nonExistentUser)
    
    // Test 5: Test student ID generation logic
    console.log('Test 5: Testing student ID generation...')
    const year = new Date().getFullYear()
    const prefix = `EST-${year}-`
    
    const lastStudent = await prisma.user.findFirst({
      where: {
        studentId: {
          startsWith: prefix
        }
      },
      orderBy: {
        studentId: 'desc'
      }
    })
    console.log('✅ Last student with prefix:', lastStudent?.studentId)
    
    return NextResponse.json({
      status: 'success',
      message: "All database tests passed!",
      results: {
        connection: "OK",
        userCount,
        firstUser: firstUser ? { id: firstUser.id, email: firstUser.email } : null,
        lastStudentId: lastStudent?.studentId || null
      }
    })
    
  } catch (error) {
    console.error("❌ Database test failed:", error)
    
    if (error instanceof Error) {
      console.error("📝 Error name:", error.name)
      console.error("📝 Error message:", error.message)
      console.error("📝 Error stack:", error.stack)
    }
    
    return NextResponse.json({
      status: 'error',
      message: "Database test failed",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}