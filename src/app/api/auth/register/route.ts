import { NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, generateStudentId } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, sede, academicYear, division, subjects } = body

    // Validate required fields
    if (!name || !email || !password || !sede || !academicYear || !division || !subjects) {
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
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { message: "Ya existe un usuario con este email" },
        { status: 400 }
      )
    }

    // Generate student ID
    const studentId = await generateStudentId()

    // Create user with academic fields
    const newUser = await createUser({
      name,
      email,
      password,
      role: 'STUDENT', // Always student
      studentId,
      sede,
      academicYear,
      division,
      subjects: subjects // Store as comma-separated string
    })

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser
    
    return NextResponse.json({
      message: "Usuario creado exitosamente",
      user: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating user:", error)
    
    // Better error handling for debugging
    let errorMessage = "Error interno del servidor"
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack)
      // In development, show more details
      if (process.env.NODE_ENV === 'development') {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { message: errorMessage, error: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    )
  }
}