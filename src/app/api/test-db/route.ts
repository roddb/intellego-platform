import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Database query result:', result)
    
    // Test questions table
    const questions = await prisma.question.findMany({
      take: 1
    })
    console.log('Questions found:', questions.length)
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      testResult: result,
      questionsCount: questions.length
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}