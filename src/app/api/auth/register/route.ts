import { NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, generateStudentId } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Registration request received')
    const body = await request.json()
    console.log('📋 Request body parsed:', { ...body, password: '[HIDDEN]' })
    
    const { name, email, password, sede, academicYear, division, subjects } = body

    // Validate required fields
    if (!name || !email || !password || !sede || !academicYear || !division || !subjects) {
      console.log('❌ Validation failed - missing required fields')
      return NextResponse.json(
        { message: "Todos los campos académicos son requeridos" },
        { status: 400 }
      )
    }

    // Validate division matches academic year
    const validDivisions = {
      "4to Año": ["C", "D", "E"],
      "5to Año": ["A", "B", "C", "D"]
    }
    
    if (!validDivisions[academicYear as keyof typeof validDivisions]?.includes(division)) {
      return NextResponse.json(
        { message: "División no válida para el año seleccionado" },
        { status: 400 }
      )
    }

    // Validate sede
    if (!["Congreso", "Colegiales"].includes(sede)) {
      return NextResponse.json(
        { message: "Sede no válida" },
        { status: 400 }
      )
    }

    // Validate subjects
    const validSubjects = ["Física", "Química"]
    const subjectList = subjects.split(',').filter((s: string) => s.trim())
    if (!subjectList.every((s: string) => validSubjects.includes(s.trim())) || subjectList.length === 0) {
      return NextResponse.json(
        { message: "Debes seleccionar al menos una materia válida" },
        { status: 400 }
      )
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists:', email)
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      console.log('❌ User already exists')
      return NextResponse.json(
        { message: "Ya existe un usuario con este email" },
        { status: 400 }
      )
    }
    console.log('✅ User does not exist, proceeding')

    // Generate student ID
    console.log('🆔 Generating student ID')
    const studentId = await generateStudentId()
    console.log('✅ Student ID generated:', studentId)

    // Create user with academic fields
    console.log('👤 Creating user')
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
    console.log('✅ User created successfully:', newUser?.id)

    // Return success without password
    if (!newUser) {
      throw new Error('Failed to create user')
    }
    const { password: _, ...userWithoutPassword } = newUser
    
    return NextResponse.json({
      message: "Usuario creado exitosamente",
      user: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating user:", error)
    
    // Enhanced error logging for production debugging
    if (error instanceof Error) {
      console.error("📝 Error name:", error.name)
      console.error("📝 Error message:", error.message)
      console.error("📝 Error stack:", error.stack)
      
      // Log additional error properties if they exist
      if ('code' in error) {
        console.error("📝 Error code:", error.code)
      }
      if ('cause' in error) {
        console.error("📝 Error cause:", error.cause)
      }
    }
    
    // In production, still hide sensitive details from client
    let errorMessage = "Error interno del servidor"
    let errorDetails = undefined
    
    if (process.env.NODE_ENV === 'development') {
      errorMessage = error instanceof Error ? error.message : String(error)
      errorDetails = String(error)
    }
    
    return NextResponse.json(
      { message: errorMessage, error: errorDetails },
      { status: 500 }
    )
  }
}