import { NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, generateStudentId } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    console.log('📥 DEBUG: Full registration flow debug')
    const body = await request.json()
    console.log('📋 DEBUG: Request body parsed:', { ...body, password: '[HIDDEN]' })
    
    const { name, email, password, sede, academicYear, division, subjects } = body

    console.log('🔍 DEBUG: Step 1 - Field validation')
    // Validate required fields
    if (!name || !email || !password || !sede || !academicYear || !division || !subjects) {
      console.log('❌ DEBUG: Validation failed - missing required fields')
      return NextResponse.json({
        success: false,
        stage: 'field_validation',
        error: 'Missing required fields',
        fields: { name: !!name, email: !!email, password: !!password, sede: !!sede, academicYear: !!academicYear, division: !!division, subjects: !!subjects }
      }, { status: 400 })
    }
    console.log('✅ DEBUG: All required fields present')

    console.log('🔍 DEBUG: Step 2 - Division validation')
    // Validate division matches academic year
    const validDivisions = {
      "4to Año": ["C", "D", "E"],
      "5to Año": ["A", "B", "C", "D"]
    }
    
    if (!validDivisions[academicYear as keyof typeof validDivisions]?.includes(division)) {
      console.log('❌ DEBUG: Invalid division for academic year')
      return NextResponse.json({
        success: false,
        stage: 'division_validation',
        error: 'Invalid division for academic year',
        academicYear,
        division,
        validDivisions: validDivisions[academicYear as keyof typeof validDivisions]
      }, { status: 400 })
    }
    console.log('✅ DEBUG: Division validation passed')

    console.log('🔍 DEBUG: Step 3 - Sede validation')
    // Validate sede
    if (!["Congreso", "Colegiales"].includes(sede)) {
      console.log('❌ DEBUG: Invalid sede')
      return NextResponse.json({
        success: false,
        stage: 'sede_validation',
        error: 'Invalid sede',
        sede,
        validSedes: ["Congreso", "Colegiales"]
      }, { status: 400 })
    }
    console.log('✅ DEBUG: Sede validation passed')

    console.log('🔍 DEBUG: Step 4 - Subjects validation')
    // Validate subjects
    const validSubjects = ["Física", "Química"]
    const subjectList = subjects.split(',').filter((s: string) => s.trim())
    if (!subjectList.every((s: string) => validSubjects.includes(s.trim())) || subjectList.length === 0) {
      console.log('❌ DEBUG: Invalid subjects')
      return NextResponse.json({
        success: false,
        stage: 'subjects_validation',
        error: 'Invalid subjects',
        subjects,
        subjectList,
        validSubjects
      }, { status: 400 })
    }
    console.log('✅ DEBUG: Subjects validation passed')

    console.log('🔍 DEBUG: Step 5 - Check existing user')
    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      console.log('❌ DEBUG: User already exists')
      return NextResponse.json({
        success: false,
        stage: 'duplicate_check',
        error: 'User already exists',
        email
      }, { status: 400 })
    }
    console.log('✅ DEBUG: No existing user found')

    console.log('🔍 DEBUG: Step 6 - Generate student ID')
    // Generate student ID
    const studentId = await generateStudentId()
    console.log('✅ DEBUG: Student ID generated:', studentId)

    console.log('🔍 DEBUG: Step 7 - Create user')
    console.log('🔍 DEBUG: Calling createUser with:', {
      name,
      email,
      password: '[HIDDEN]',
      role: 'STUDENT',
      studentId,
      sede,
      academicYear,
      division,
      subjects
    })
    
    // Create user with academic fields
    const newUser = await createUser({
      name,
      email,
      password,
      role: 'STUDENT',
      studentId,
      sede,
      academicYear,
      division,
      subjects
    })
    console.log('✅ DEBUG: User created successfully:', newUser?.id)

    if (!newUser) {
      throw new Error('Failed to create user - createUser returned null')
    }

    const { password: _, ...userWithoutPassword } = newUser
    
    return NextResponse.json({
      success: true,
      message: "Debug registration completed successfully",
      user: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error("❌ DEBUG: Error in full registration flow:", error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("📝 DEBUG: Error name:", error.name)
      console.error("📝 DEBUG: Error message:", error.message)
      console.error("📝 DEBUG: Error stack:", error.stack)
      
      if ('code' in error) {
        console.error("📝 DEBUG: Error code:", error.code)
      }
      if ('cause' in error) {
        console.error("📝 DEBUG: Error cause:", error.cause)
      }
    }
    
    return NextResponse.json({
      success: false,
      stage: 'fatal_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}