import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emailService, getWeekDates, formatDateForEmail } from '@/lib/email-service'
import { getAllUsers, findUsersByRole, getAllProgressReports } from '@/lib/hybrid-storage'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow instructors or admin to trigger emails
    if (!session?.user?.id || session.user.role === 'STUDENT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { type, ...params } = await request.json()

    switch (type) {
      case 'test':
        return await handleTestEmail(params)
      
      case 'report_submission':
        return await handleReportSubmissionEmail(params)
      
      case 'weekly_reminder':
        return await handleWeeklyReminderEmail(params)
      
      case 'weekly_summary':
        return await handleWeeklySummaryEmail(params)
      
      case 'bulk_reminders':
        return await handleBulkReminders()
      
      default:
        return NextResponse.json({ error: 'Tipo de email no válido' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in email API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function handleTestEmail(params: { email: string }) {
  try {
    const result = await emailService.sendTestEmail(params.email)
    return NextResponse.json({ 
      success: true, 
      message: 'Email de prueba enviado exitosamente',
      result 
    })
  } catch (error) {
    throw new Error(`Error sending test email: ${error}`)
  }
}

async function handleReportSubmissionEmail(params: {
  studentId: string
  instructorId: string
  reportId: string
}) {
  try {
    const allUsers = await getAllUsers()
    const allReports = await getAllProgressReports()
    
    const student = allUsers.find(u => u.id === params.studentId)
    const instructor = allUsers.find(u => u.id === params.instructorId)
    const report = allReports.find(r => r.id === params.reportId)
    
    if (!student || !instructor || !report) {
      return NextResponse.json({ error: 'Usuario o reporte no encontrado' }, { status: 404 })
    }

    const result = await emailService.notifyInstructorOfSubmission(
      {
        name: student.name,
        email: student.email,
        id: student.id
      },
      {
        name: instructor.name,
        email: instructor.email,
        id: instructor.id
      },
      {
        weekStart: formatDateForEmail(new Date(report.weekStart)),
        weekEnd: formatDateForEmail(new Date(report.weekEnd)),
        submittedAt: formatDateForEmail(new Date(report.submittedAt)),
        id: report.id
      }
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Notificación enviada al instructor',
      result 
    })
  } catch (error) {
    throw new Error(`Error sending report submission email: ${error}`)
  }
}

async function handleWeeklyReminderEmail(params: {
  studentId: string
  daysLeft?: number
}) {
  try {
    const allUsers = await getAllUsers()
    const student = allUsers.find(u => u.id === params.studentId)
    
    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    const weekDates = getWeekDates()
    const daysLeft = params.daysLeft ?? 3

    const result = await emailService.sendWeeklyReminder(
      {
        name: student.name,
        email: student.email,
        id: student.id
      },
      weekDates.startFormatted,
      weekDates.endFormatted,
      daysLeft
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Recordatorio enviado al estudiante',
      result 
    })
  } catch (error) {
    throw new Error(`Error sending weekly reminder email: ${error}`)
  }
}

async function handleWeeklySummaryEmail(params: {
  instructorId: string
  weekStart?: string
  weekEnd?: string
}) {
  try {
    const allUsers = await getAllUsers()
    const allReports = await getAllProgressReports()
    
    const instructor = allUsers.find(u => u.id === params.instructorId)
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor no encontrado' }, { status: 404 })
    }

    // Get week dates
    const weekDates = params.weekStart && params.weekEnd 
      ? {
          startFormatted: params.weekStart,
          endFormatted: params.weekEnd,
          start: new Date(params.weekStart),
          end: new Date(params.weekEnd)
        }
      : getWeekDates()

    // Calculate statistics
    const students = await findUsersByRole('STUDENT')
    const weekReports = allReports.filter(report => {
      const reportDate = new Date(report.weekStart)
      return reportDate >= weekDates.start && reportDate <= weekDates.end
    })

    const stats = {
      totalStudents: students.length,
      submittedReports: weekReports.length,
      pendingReports: students.length - weekReports.length,
      submissionRate: students.length > 0 ? (weekReports.length / students.length) * 100 : 0
    }

    const result = await emailService.sendWeeklySummary(
      {
        name: instructor.name,
        email: instructor.email,
        id: instructor.id
      },
      weekDates.startFormatted,
      weekDates.endFormatted,
      stats
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Resumen semanal enviado al instructor',
      result,
      stats 
    })
  } catch (error) {
    throw new Error(`Error sending weekly summary email: ${error}`)
  }
}

async function handleBulkReminders() {
  try {
    const students = await findUsersByRole('STUDENT')
    const allReports = await getAllProgressReports()
    const weekDates = getWeekDates()
    
    // Find students who haven't submitted this week's report
    const studentsWithoutReport = students.filter(student => {
      const hasReportThisWeek = allReports.some(report => 
        report.userId === student.id &&
        new Date(report.weekStart) >= weekDates.start &&
        new Date(report.weekStart) <= weekDates.end
      )
      return !hasReportThisWeek
    })

    // Calculate days left (assuming week ends on Sunday)
    const now = new Date()
    const weekEnd = weekDates.end
    const daysLeft = Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Send reminders to all students without reports
    const results = await Promise.allSettled(
      studentsWithoutReport.map(student =>
        emailService.sendWeeklyReminder(
          {
            name: student.name,
            email: student.email,
            id: student.id
          },
          weekDates.startFormatted,
          weekDates.endFormatted,
          Math.max(daysLeft, 0)
        )
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Recordatorios masivos enviados`,
      stats: {
        totalStudents: students.length,
        studentsWithoutReport: studentsWithoutReport.length,
        emailsSent: successful,
        emailsFailed: failed,
        daysLeft
      }
    })
  } catch (error) {
    throw new Error(`Error sending bulk reminders: ${error}`)
  }
}