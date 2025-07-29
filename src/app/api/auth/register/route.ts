import { NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, generateStudentId } from "@/lib/hybrid-storage"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, program, phoneNumber, dateOfBirth } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { message: "El usuario ya existe" },
        { status: 400 }
      )
    }

    // Auto-generate student ID for students, null for instructors
    let finalStudentId = undefined
    if (role === "STUDENT") {
      finalStudentId = await generateStudentId()
    }

    // Create user with enhanced fields
    const user = await createUser({
      name,
      email,
      password,
      role: role || "STUDENT",
      studentId: finalStudentId,
      program: program || undefined,
      phoneNumber: phoneNumber || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      enrollmentYear: new Date().getFullYear(),
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: "Usuario creado exitosamente",
        user: userWithoutPassword 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}