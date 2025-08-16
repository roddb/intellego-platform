import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Registration debug endpoint called')
    const body = await request.json()
    console.log('📋 DEBUG: Request body:', JSON.stringify(body, null, 2))
    
    // Test basic function imports
    console.log('🔍 DEBUG: Testing imports...')
    
    try {
      const { createUser, findUserByEmail, generateStudentId } = await import("@/lib/db-operations")
      console.log('✅ DEBUG: All functions imported successfully')
      console.log('🔍 DEBUG: createUser type:', typeof createUser)
      console.log('🔍 DEBUG: findUserByEmail type:', typeof findUserByEmail)
      console.log('🔍 DEBUG: generateStudentId type:', typeof generateStudentId)
      
      // Test generateStudentId
      console.log('🔍 DEBUG: Testing generateStudentId...')
      const studentId = await generateStudentId()
      console.log('✅ DEBUG: Student ID generated:', studentId)
      
      // Test findUserByEmail
      console.log('🔍 DEBUG: Testing findUserByEmail...')
      const existingUser = await findUserByEmail(body.email || 'test@test.com')
      console.log('✅ DEBUG: findUserByEmail result:', existingUser ? 'User found' : 'No user found')
      
      return NextResponse.json({
        success: true,
        message: "Debug completed successfully",
        debug: {
          functionsImported: true,
          studentId,
          existingUser: !!existingUser
        }
      })
      
    } catch (importError) {
      console.error('❌ DEBUG: Import error:', importError)
      return NextResponse.json({
        success: false,
        stage: 'import_error',
        error: importError instanceof Error ? importError.message : String(importError),
        stack: importError instanceof Error ? importError.stack : undefined
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('💥 DEBUG: Fatal error:', error)
    return NextResponse.json({
      success: false,
      stage: 'fatal_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}