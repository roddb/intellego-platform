import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getAllUsers,
  getAllWeeklyReports,
  findUsersByRole,
  getMonthWeeks,
  findWeeklyReportByUserAndWeek
} from "@/lib/temp-storage"

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
    const format = searchParams.get('format') || 'markdown'
    const studentIds = searchParams.get('students')?.split(',') || []

    // Get all students or filtered ones
    let students = findUsersByRole("STUDENT")
    if (studentIds.length > 0) {
      students = students.filter(student => studentIds.includes(student.id))
    }
    
    // Get all weekly reports
    const allReports = getAllWeeklyReports()
    
    // Get weeks for the specified month
    const monthWeeks = getMonthWeeks(year, month)
    const monthName = new Date(year, month).toLocaleDateString('es-ES', { month: 'long' })

    if (format === 'markdown') {
      let markdown = `# Reporte de Progreso - ${monthName} ${year}\n\n`
      markdown += `**Generado el:** ${new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n\n`
      
      markdown += `## Resumen General\n\n`
      markdown += `- **Total de estudiantes:** ${students.length}\n`
      markdown += `- **Semanas del mes:** ${monthWeeks.length}\n`
      
      // Add statistics
      const totalReportsThisMonth = allReports.filter(report => {
        const reportDate = new Date(report.weekStart)
        return reportDate.getFullYear() === year && reportDate.getMonth() === month
      }).length
      
      markdown += `- **Total reportes enviados:** ${totalReportsThisMonth}\n\n`

      // Add detailed student reports
      markdown += `## Reportes por Estudiante\n\n`
      
      for (const student of students) {
        markdown += `### ${student.name} (${student.studentId})\n\n`
        markdown += `**Email:** ${student.email}\n\n`
        
        const studentReports = allReports.filter(report => 
          report.userId === student.id &&
          monthWeeks.some(week => 
            new Date(report.weekStart).getTime() === week.start.getTime()
          )
        )

        if (studentReports.length === 0) {
          markdown += `*No hay reportes enviados para este mes.*\n\n`
          continue
        }

        // Sort reports by week
        studentReports.sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())

        for (const report of studentReports) {
          const weekStart = new Date(report.weekStart).toLocaleDateString('es-ES')
          const weekEnd = new Date(report.weekEnd).toLocaleDateString('es-ES')
          const submittedAt = new Date(report.submittedAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })

          markdown += `#### Semana del ${weekStart} al ${weekEnd}\n`
          markdown += `**Enviado el:** ${submittedAt}\n\n`

          // Add each response
          if (report.responses.temasYDominio) {
            markdown += `**Temas trabajados y nivel de dominio:**\n`
            markdown += `${report.responses.temasYDominio}\n\n`
          }

          if (report.responses.evidenciaAprendizaje) {
            markdown += `**Evidencia de aprendizaje:**\n`
            markdown += `${report.responses.evidenciaAprendizaje}\n\n`
          }

          if (report.responses.dificultadesEstrategias) {
            markdown += `**Dificultades y estrategias:**\n`
            markdown += `${report.responses.dificultadesEstrategias}\n\n`
          }

          if (report.responses.conexionesAplicacion) {
            markdown += `**Conexiones y aplicación:**\n`
            markdown += `${report.responses.conexionesAplicacion}\n\n`
          }

          if (report.responses.comentariosAdicionales) {
            markdown += `**Comentarios adicionales:**\n`
            markdown += `${report.responses.comentariosAdicionales}\n\n`
          }

          markdown += `---\n\n`
        }
      }

      // Add summary table
      markdown += `## Tabla de Participación\n\n`
      markdown += `| Estudiante | Student ID | Reportes Enviados | Porcentaje |\n`
      markdown += `|------------|------------|-------------------|------------|\n`
      
      for (const student of students) {
        const studentReports = allReports.filter(report => 
          report.userId === student.id &&
          monthWeeks.some(week => 
            new Date(report.weekStart).getTime() === week.start.getTime()
          )
        )
        const percentage = Math.round((studentReports.length / monthWeeks.length) * 100)
        markdown += `| ${student.name} | ${student.studentId} | ${studentReports.length}/${monthWeeks.length} | ${percentage}% |\n`
      }

      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="reporte-progreso-${monthName}-${year}.md"`
        }
      })
    }

    // CSV format
    if (format === 'csv') {
      let csv = 'Estudiante,Student ID,Email,Semana,Fecha Inicio,Fecha Fin,Enviado,Fecha Envio,Temas,Evidencia,Dificultades,Conexiones,Comentarios\n'
      
      for (const student of students) {
        for (const week of monthWeeks) {
          const report = findWeeklyReportByUserAndWeek(student.id, week.start)
          const weekStart = week.start.toISOString().split('T')[0]
          const weekEnd = week.end.toISOString().split('T')[0]
          
          if (report) {
            const submittedAt = new Date(report.submittedAt).toISOString().split('T')[0]
            const responses = report.responses
            
            csv += `"${student.name}","${student.studentId}","${student.email}","${weekStart}","${weekEnd}","Si","${submittedAt}",`
            csv += `"${responses.temasYDominio || ''}","${responses.evidenciaAprendizaje || ''}",`
            csv += `"${responses.dificultadesEstrategias || ''}","${responses.conexionesAplicacion || ''}",`
            csv += `"${responses.comentariosAdicionales || ''}"\n`
          } else {
            csv += `"${student.name}","${student.studentId}","${student.email}","${weekStart}","${weekEnd}","No","","","","","",""\n`
          }
        }
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="reporte-progreso-${monthName}-${year}.csv"`
        }
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })

  } catch (error) {
    console.error("Error generating download:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}