import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  createProgressReport, 
  findProgressReportsByUser, 
  canSubmitThisWeek, 
  getCurrentWeekStart, 
  getCurrentWeekEnd,
  findUsersByRole 
} from "@/lib/hybrid-storage"
import { emailService, formatDateForEmail } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const reports = await findProgressReportsByUser(session.user.id)
    
    return NextResponse.json({
      reports,
      canSubmitThisWeek: await canSubmitThisWeek(session.user.id),
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Solo estudiantes pueden enviar reportes" }, { status: 403 })
    }

    // Check if user can submit this week
    if (!(await canSubmitThisWeek(session.user.id))) {
      return NextResponse.json(
        { error: "Ya enviaste tu reporte de esta semana" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { temasYDominio, evidenciaAprendizaje, dificultadesEstrategias, conexionesAplicacion, comentariosAdicionales, attachments } = body

    // Validate required fields
    if (!temasYDominio || !evidenciaAprendizaje || !dificultadesEstrategias || !conexionesAplicacion) {
      return NextResponse.json(
        { error: "Todas las preguntas principales son requeridas" },
        { status: 400 }
      )
    }

    const weekStart = getCurrentWeekStart()
    const weekEnd = getCurrentWeekEnd()

    const newReport = await createProgressReport({
      userId: session.user.id,
      weekStart,
      weekEnd,
      responses: {
        temasYDominio,
        evidenciaAprendizaje,
        dificultadesEstrategias,
        conexionesAplicacion,
        comentariosAdicionales: comentariosAdicionales || ""
      },
      attachments: attachments || []
    })

    // Send email notification to instructors
    try {
      const instructors = await findUsersByRole('INSTRUCTOR')
      
      // Send notification to all instructors
      await Promise.allSettled(
        instructors.map(instructor =>
          emailService.notifyInstructorOfSubmission(
            {
              name: session.user.name || 'Estudiante',
              email: session.user.email || '',
              id: session.user.id
            },
            {
              name: instructor.name,
              email: instructor.email,
              id: instructor.id
            },
            {
              weekStart: formatDateForEmail(new Date(weekStart)),
              weekEnd: formatDateForEmail(new Date(weekEnd)),
              submittedAt: formatDateForEmail(new Date()),
              id: newReport.id
            }
          )
        )
      )
      
      console.log('✅ Email notifications sent to instructors')
    } catch (emailError) {
      // Don't fail the report submission if email fails
      console.warn('⚠️ Failed to send email notifications:', emailError)
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