import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tempWeeklyReports, findUserById } from '@/lib/temp-storage'

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

    // Buscar el reporte
    const report = tempWeeklyReports.find(r => r.id === reportId)
    if (!report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    if (session.user.role !== 'INSTRUCTOR' && session.user.id !== report.userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener información del usuario
    const user = findUserById(report.userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Generar contenido según el formato
    let content: string
    let contentType: string
    let filename: string

    const weekStartFormatted = new Date(report.weekStart).toLocaleDateString('es-ES')
    const weekEndFormatted = new Date(report.weekEnd).toLocaleDateString('es-ES')
    const submittedAtFormatted = new Date(report.submittedAt).toLocaleDateString('es-ES')

    if (format === 'markdown') {
      content = generateMarkdownReport(report, user, weekStartFormatted, weekEndFormatted, submittedAtFormatted)
      contentType = 'text/markdown'
      filename = `reporte-${new Date(report.weekStart).toISOString().split('T')[0]}.md`
    } else if (format === 'pdf') {
      // Para PDF, por ahora retornamos texto plano
      // En una implementación real, usarías una librería como puppeteer o jsPDF
      content = generateTextReport(report, user, weekStartFormatted, weekEndFormatted, submittedAtFormatted)
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
  user: any, 
  weekStart: string, 
  weekEnd: string, 
  submittedAt: string
): string {
  return `# Reporte Semanal de Progreso

## Información del Estudiante
- **Nombre:** ${user.name}
- **Email:** ${user.email}
- **ID Estudiante:** ${user.studentId || 'N/A'}

## Información del Reporte
- **Período:** ${weekStart} - ${weekEnd}
- **Fecha de Envío:** ${submittedAt}
- **ID del Reporte:** ${report.id}

---

## 1. Temas y Dominio
${report.responses.temasYDominio}

## 2. Evidencia de Aprendizaje
${report.responses.evidenciaAprendizaje}

## 3. Dificultades y Estrategias
${report.responses.dificultadesEstrategias}

## 4. Conexiones y Aplicación
${report.responses.conexionesAplicacion}

${report.responses.comentariosAdicionales ? `## 5. Comentarios Adicionales
${report.responses.comentariosAdicionales}` : ''}

${report.attachments && report.attachments.length > 0 ? `
## Archivos Adjuntos
${report.attachments.map((file: any) => `- ${file.originalName} (${(file.size / 1024).toFixed(1)} KB)`).join('\n')}
` : ''}

---

*Reporte generado por Intellego Platform*
*Fecha de generación: ${new Date().toLocaleDateString('es-ES')}*
`
}

function generateTextReport(
  report: any, 
  user: any, 
  weekStart: string, 
  weekEnd: string, 
  submittedAt: string
): string {
  return `REPORTE SEMANAL DE PROGRESO
===============================

INFORMACIÓN DEL ESTUDIANTE
- Nombre: ${user.name}
- Email: ${user.email}
- ID Estudiante: ${user.studentId || 'N/A'}

INFORMACIÓN DEL REPORTE
- Período: ${weekStart} - ${weekEnd}
- Fecha de Envío: ${submittedAt}
- ID del Reporte: ${report.id}

===============================

1. TEMAS Y DOMINIO
${report.responses.temasYDominio}

2. EVIDENCIA DE APRENDIZAJE
${report.responses.evidenciaAprendizaje}

3. DIFICULTADES Y ESTRATEGIAS
${report.responses.dificultadesEstrategias}

4. CONEXIONES Y APLICACIÓN
${report.responses.conexionesAplicacion}

${report.responses.comentariosAdicionales ? `5. COMENTARIOS ADICIONALES
${report.responses.comentariosAdicionales}` : ''}

${report.attachments && report.attachments.length > 0 ? `
ARCHIVOS ADJUNTOS
${report.attachments.map((file: any) => `- ${file.originalName} (${(file.size / 1024).toFixed(1)} KB)`).join('\n')}
` : ''}

===============================
Reporte generado por Intellego Platform
Fecha de generación: ${new Date().toLocaleDateString('es-ES')}
`
}