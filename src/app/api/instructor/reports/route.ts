import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getAllUsers,
  getAllProgressReports,
  findUsersByRole,
  findProgressReportByUserAndWeek,
  getMonthWeeks
} from "@/lib/hybrid-storage"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())

    // Get all students
    const allStudents = await findUsersByRole("STUDENT")
    
    // Get all weekly reports
    const allReports = await getAllProgressReports()
    
    // Get weeks for the specified month
    const monthWeeks = getMonthWeeks(year, month)
    
    // Build student summary with their reports for this month
    const studentSummary = await Promise.all(allStudents.map(async (student) => {
      const studentReports = allReports.filter(report => report.userId === student.id)
      
      // Map each week with submission status
      const weeklyStatus = await Promise.all(monthWeeks.map(async (week, index) => {
        const report = await findProgressReportByUserAndWeek(student.id, week.start)
        
        // Convert temp-storage format to expected format for modal
        let adaptedReport = null
        if (report && report.responses) {
          adaptedReport = {
            ...report,
            user: {
              name: student.name,
              email: student.email,
              studentId: student.studentId
            },
            answers: [
              {
                id: '1',
                question: { text: 'Temas y Dominio' },
                answer: report.responses.temasYDominio || ''
              },
              {
                id: '2',
                question: { text: 'Evidencia de Aprendizaje' },
                answer: report.responses.evidenciaAprendizaje || ''
              },
              {
                id: '3',
                question: { text: 'Dificultades y Estrategias' },
                answer: report.responses.dificultadesEstrategias || ''
              },
              {
                id: '4',
                question: { text: 'Conexiones y Aplicación' },
                answer: report.responses.conexionesAplicacion || ''
              },
              {
                id: '5',
                question: { text: 'Comentarios Adicionales' },
                answer: report.responses.comentariosAdicionales || ''
              }
            ]
          }
        }
        
        return {
          weekNumber: index + 1,
          weekStart: week.start,
          weekEnd: week.end,
          hasSubmitted: !!report,
          report: adaptedReport,
          submittedAt: report?.submittedAt || null
        }
      }))

      const submittedCount = weeklyStatus.filter(w => w.hasSubmitted).length
      const totalWeeks = monthWeeks.length
      
      return {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          status: student.status
        },
        weeklyStatus,
        summary: {
          submittedCount,
          totalWeeks,
          completionRate: totalWeeks > 0 ? Math.round((submittedCount / totalWeeks) * 100) : 0,
          lastSubmission: studentReports.length > 0 ? 
            Math.max(...studentReports.map(r => new Date(r.submittedAt).getTime())) : null
        }
      }
    }))

    // Overall statistics
    const totalStudents = allStudents.length
    const totalReportsThisMonth = allReports.filter(report => {
      const reportDate = new Date(report.weekStart)
      return reportDate.getFullYear() === year && reportDate.getMonth() === month
    }).length
    
    const studentsWithReports = studentSummary.filter(s => s.summary.submittedCount > 0).length
    const avgCompletionRate = studentSummary.length > 0 ? 
      Math.round(studentSummary.reduce((sum, s) => sum + s.summary.completionRate, 0) / studentSummary.length) : 0

    return NextResponse.json({
      year,
      month,
      monthName: new Date(year, month).toLocaleDateString('es-ES', { month: 'long' }),
      students: studentSummary,
      monthWeeks,
      statistics: {
        totalStudents,
        studentsWithReports,
        totalReportsThisMonth,
        avgCompletionRate,
        totalWeeks: monthWeeks.length
      }
    })

  } catch (error) {
    console.error("Error getting instructor reports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}