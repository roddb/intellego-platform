import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';import { getStudentReportsWithAnswers, findUserById } from "@/lib/db-operations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    const { studentId } = await params
    
    // Verify student exists
    const student = await findUserById(studentId)
    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: "ID no corresponde a un estudiante" }, { status: 400 })
    }

    // Get all reports for this student
    const reports = await getStudentReportsWithAnswers(studentId)

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        sede: student.sede,
        academicYear: student.academicYear,
        division: student.division,
        subjects: student.subjects
      },
      reports
    })

  } catch (error) {
    console.error("Error getting student reports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}