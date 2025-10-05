import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  createWeeklyReport,
  findWeeklyReportsByUserGroupedBySubject,
  canSubmitForSubject,
  getUserSubjects,
  getCurrentWeekStart,
  getCurrentWeekEnd,
  getAllQuestions
} from "@/lib/db-operations"
import { saveStudentReportAsJSON } from "@/lib/simple-file-storage"
import { query } from "@/lib/db"

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Check if instructor is impersonating and get the effective user ID
    const searchParams = request.nextUrl.searchParams
    const impersonatedStudentId = searchParams.get('studentId')

    let effectiveUserId = session.user.id
    let effectiveStudentId = session.user.studentId

    // If instructor is impersonating, use the impersonated student's data
    if (session.user.isImpersonating && impersonatedStudentId) {
      // Get the user ID from studentId (need to query database)
      const result = await query(
        'SELECT id FROM User WHERE studentId = ? LIMIT 1',
        [impersonatedStudentId]
      )
      if (result.rows.length > 0) {
        effectiveUserId = String(result.rows[0].id)
        effectiveStudentId = impersonatedStudentId
      }
    }

    // Get user's subjects and reports grouped by subject
    const userSubjects = await getUserSubjects(effectiveUserId)
    const reportsBySubject = await findWeeklyReportsByUserGroupedBySubject(effectiveUserId)
    
    // Check submission status for each subject
    const subjectStatus: { [subject: string]: boolean } = {}
    for (const subject of userSubjects) {
      subjectStatus[subject] = await canSubmitForSubject(effectiveUserId, subject)
    }
    
    return NextResponse.json({
      subjects: userSubjects,
      reportsBySubject,
      canSubmitBySubject: subjectStatus,
      currentWeek: {
        start: getCurrentWeekStart(),
        end: getCurrentWeekEnd()
      }
    })

  } catch (error) {
    console.error("Error getting weekly reports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Solo estudiantes pueden enviar reportes" }, { status: 403 })
    }

    const body = await request.json()
    const { subject, temasYDominio, evidenciaAprendizaje, dificultadesEstrategias, conexionesAplicacion, comentariosAdicionales } = body

    // Validate subject is provided
    if (!subject) {
      return NextResponse.json(
        { error: "La materia es requerida" },
        { status: 400 }
      )
    }

    // Validate user is registered for this subject
    const userSubjects = await getUserSubjects(session.user.id)
    if (!userSubjects.includes(subject)) {
      return NextResponse.json(
        { error: "No estás registrado para esta materia" },
        { status: 400 }
      )
    }

    // Check if user can submit for this subject this week
    const canSubmit = await canSubmitForSubject(session.user.id, subject)
    if (!canSubmit) {
      return NextResponse.json(
        { error: `Ya enviaste tu reporte de ${subject} para esta semana` },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!temasYDominio || !evidenciaAprendizaje || !dificultadesEstrategias || !conexionesAplicacion) {
      return NextResponse.json(
        { error: "Todas las preguntas principales son requeridas" },
        { status: 400 }
      )
    }

    const weekStart = getCurrentWeekStart()
    const weekEnd = getCurrentWeekEnd()

    // Get questions to create answers
    const questions = await getAllQuestions()
    const answers = [
      { questionId: 'q1', answer: temasYDominio },
      { questionId: 'q2', answer: evidenciaAprendizaje },
      { questionId: 'q3', answer: dificultadesEstrategias },
      { questionId: 'q4', answer: conexionesAplicacion },
      { questionId: 'q5', answer: comentariosAdicionales || '' }
    ]

    const newReport = await createWeeklyReport({
      userId: session.user.id,
      subject: subject,
      weekStart,
      weekEnd,
      answers
    })

    // Also save as JSON file in student's folder
    try {
      await saveStudentReportAsJSON(
        {
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          studentId: session.user.studentId || session.user.id,
          sede: session.user.sede || '',
          academicYear: session.user.academicYear || '',
          division: session.user.division || ''
        },
        {
          subject: subject,
          weekStart,
          weekEnd,
          submittedAt: new Date(),
          answers: {
            temasYDominio,
            evidenciaAprendizaje,
            dificultadesEstrategias,
            conexionesAplicacion,
            comentariosAdicionales
          }
        }
      )
    } catch (fileError) {
      console.error('⚠️ Error saving JSON file (report still saved in DB):', fileError)
      // Don't fail the request if file saving fails
    }

    return NextResponse.json({
      message: "Reporte enviado exitosamente",
      report: newReport
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating weekly report:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}