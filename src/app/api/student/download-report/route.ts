import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db-operations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const format = searchParams.get('format') || 'markdown'

    if (!reportId) {
      return NextResponse.json({ error: 'ID de reporte requerido' }, { status: 400 })
    }

    // Buscar el reporte en la base de datos
    const report = await prisma.progressReport.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    if (session.user.role !== 'INSTRUCTOR' && session.user.id !== report.userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Generar contenido según el formato
    let content: string
    let contentType: string
    let filename: string

    const weekStartFormatted = new Date(report.weekStart).toLocaleDateString('es-ES')
    const weekEndFormatted = new Date(report.weekEnd).toLocaleDateString('es-ES')
    const submittedAtFormatted = new Date(report.submittedAt).toLocaleDateString('es-ES')

    if (format === 'markdown') {
      content = generateMarkdownReport(report, weekStartFormatted, weekEndFormatted, submittedAtFormatted)
      contentType = 'text/markdown'
      filename = `reporte-${new Date(report.weekStart).toISOString().split('T')[0]}.md`
    } else if (format === 'pdf') {
      // Para PDF, por ahora retornamos texto plano
      // En una implementación real, usarías una librería como puppeteer o jsPDF
      content = generateTextReport(report, weekStartFormatted, weekEndFormatted, submittedAtFormatted)
      contentType = 'text/plain'
      filename = `reporte-${new Date(report.weekStart).toISOString().split('T')[0]}.txt`
    } else {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })
    }

    // Configurar headers para descarga
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new NextResponse(content, { headers })

  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

function generateMarkdownReport(
  report: any, 
  weekStart: string, 
  weekEnd: string, 
  submittedAt: string
): string {
  return `# Reporte Semanal de Progreso

## Información del Estudiante
- **Nombre:** ${report.user.name}
- **Email:** ${report.user.email}
- **ID Estudiante:** ${report.user.studentId || 'N/A'}

## Información del Reporte
- **Período:** ${weekStart} - ${weekEnd}
- **Fecha de Envío:** ${submittedAt}
- **ID del Reporte:** ${report.id}

---

${report.answers.map((answer: any, index: number) => `## ${index + 1}. ${answer.question.text}
${answer.answer}
`).join('\n')}

---

*Reporte generado por Intellego Platform*
*Fecha de generación: ${new Date().toLocaleDateString('es-ES')}*
`
}

function generateTextReport(
  report: any,
  weekStart: string, 
  weekEnd: string, 
  submittedAt: string
): string {
  return `REPORTE SEMANAL DE PROGRESO
===============================

INFORMACIÓN DEL ESTUDIANTE
- Nombre: ${report.user.name}
- Email: ${report.user.email}
- ID Estudiante: ${report.user.studentId || 'N/A'}

INFORMACIÓN DEL REPORTE
- Período: ${weekStart} - ${weekEnd}
- Fecha de Envío: ${submittedAt}
- ID del Reporte: ${report.id}

===============================

${report.answers.map((answer: any, index: number) => `${index + 1}. ${answer.question.text.toUpperCase()}
${answer.answer}
`).join('\n')}

===============================
Reporte generado por Intellego Platform
Fecha de generación: ${new Date().toLocaleDateString('es-ES')}
`
}