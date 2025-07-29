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
    const userId = searchParams.get('userId') || session.user.id

    // Verificar que el usuario puede acceder a estos reportes
    if (session.user.role !== 'INSTRUCTOR' && session.user.id !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Verificar que el usuario existe
    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener todos los reportes del usuario, ordenados por fecha más reciente primero
    const userReports = tempWeeklyReports
      .filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    // Calcular estadísticas
    const statistics = {
      totalReports: userReports.length,
      firstReportDate: userReports.length > 0 ? userReports[userReports.length - 1].submittedAt : null,
      lastReportDate: userReports.length > 0 ? userReports[0].submittedAt : null,
      averageWordsPerReport: userReports.length > 0 
        ? Math.round(userReports.reduce((acc, report) => {
            const wordCount = Object.values(report.responses).join(' ').split(' ').length
            return acc + wordCount
          }, 0) / userReports.length)
        : 0,
      reportsWithAttachments: userReports.filter(report => report.attachments && report.attachments.length > 0).length,
      totalAttachments: userReports.reduce((acc, report) => acc + (report.attachments?.length || 0), 0)
    }

    // Preparar reportes para el frontend
    const reports = userReports.map(report => ({
      id: report.id,
      userId: report.userId,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      submittedAt: report.submittedAt,
      responses: report.responses,
      attachments: report.attachments || []
    }))

    return NextResponse.json({
      reports,
      statistics,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId
      }
    })

  } catch (error) {
    console.error('Error fetching reports history:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}