import { NextRequest, NextResponse } from "next/server"
import { db, query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing libSQL direct connection...')
    
    // Test 1: Basic connection
    console.log('Test 1: Testing basic SELECT...')
    const testResult = await query('SELECT 1 as test')
    console.log('✅ Basic query successful:', testResult.rows)
    
    // Test 2: Check User table structure
    console.log('Test 2: Checking User table...')
    const userTableInfo = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='User'
    `)
    console.log('✅ User table exists:', userTableInfo.rows)
    
    // Test 3: Count users
    console.log('Test 3: Counting users...')
    const userCount = await query('SELECT COUNT(*) as count FROM User')
    console.log('✅ User count:', userCount.rows)
    
    // Test 4: Test user operations
    console.log('Test 4: Testing findUserByEmail...')
    const { findUserByEmail } = await import('@/lib/db-operations')
    const testUser = await findUserByEmail('nonexistent@test.com')
    console.log('✅ findUserByEmail works:', testUser === null ? 'No user found (expected)' : 'User found')
    
    return NextResponse.json({
      status: 'SUCCESS',
      message: 'libSQL direct connection works perfectly!',
      data: {
        basicQuery: testResult.rows,
        userTableExists: userTableInfo.rows.length > 0,
        userCount: userCount.rows[0]?.count || 0,
        testUserQuery: testUser === null ? 'Working correctly' : 'Unexpected result'
      }
    })
    
  } catch (error) {
    console.error('❌ libSQL test failed:', error)
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'libSQL test failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}