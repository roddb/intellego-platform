import { NextResponse } from "next/server"
import { 
  getAllUsers,
  getAllProgressReports,
  findUsersByRole,
  findProgressReportByUserAndWeek,
  getMonthWeeks
} from "@/lib/hybrid-storage"

export async function GET() {
  try {
    const year = 2025
    const month = 5 // June (0-indexed)

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

    // Find a report with data to show as example
    const reportWithData = studentSummary
      .flatMap(s => s.weeklyStatus)
      .find(w => w.hasSubmitted && w.report)?.report

    return NextResponse.json({
      studentCount: allStudents.length,
      reportsCount: allReports.length,
      monthWeeksCount: monthWeeks.length,
      sampleAdaptedReport: reportWithData,
      firstStudentWeeklyStatus: studentSummary[0]?.weeklyStatus || []
    })
  } catch (error) {
    console.error('Error formatting instructor data:', error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}