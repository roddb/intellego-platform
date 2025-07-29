import { Resend } from 'resend'
import { render } from '@react-email/render'
import ReportSubmissionEmail from '@/emails/ReportSubmissionEmail'
import WeeklyReminderEmail from '@/emails/WeeklyReminderEmail'

// Initialize Resend client (optional)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'Intellego Platform <noreply@intellego.edu>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@intellego.edu'

interface StudentInfo {
  name: string
  email: string
  id: string
}

interface InstructorInfo {
  name: string
  email: string
  id: string
}

interface ReportInfo {
  weekStart: string
  weekEnd: string
  submittedAt: string
  id: string
}

// Email service functions
export const emailService = {
  // Send notification to instructor when student submits report
  async notifyInstructorOfSubmission(
    student: StudentInfo,
    instructor: InstructorInfo,
    report: ReportInfo
  ) {
    if (!resend) {
      console.log('⚠️ Email service not configured (no RESEND_API_KEY), skipping notification')
      return null
    }
    
    try {
      const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/instructor`
      
      const emailHtml = render(ReportSubmissionEmail({
        studentName: student.name,
        instructorName: instructor.name,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        submittedAt: report.submittedAt,
        reportUrl: dashboardUrl
      }))

      const result = await resend!.emails.send({
        from: FROM_EMAIL,
        to: instructor.email,
        subject: `📚 Nuevo reporte semanal de ${student.name}`,
        html: emailHtml,
        tags: [
          { name: 'type', value: 'report_submission' },
          { name: 'student_id', value: student.id },
          { name: 'instructor_id', value: instructor.id }
        ]
      })

      console.log('✅ Report submission email sent to instructor:', instructor.email)
      return result

    } catch (error) {
      console.error('❌ Error sending report submission email:', error)
      throw error
    }
  },

  // Send reminder to student about pending report
  async sendWeeklyReminder(
    student: StudentInfo,
    weekStart: string,
    weekEnd: string,
    daysLeft: number
  ) {
    if (!resend) {
      console.log('⚠️ Email service not configured (no RESEND_API_KEY), skipping reminder')
      return null
    }
    
    try {
      const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/student`
      
      const emailHtml = render(WeeklyReminderEmail({
        studentName: student.name,
        weekStart,
        weekEnd,
        daysLeft,
        dashboardUrl
      }))

      const isUrgent = daysLeft <= 1
      const subject = isUrgent 
        ? `⚠️ Recordatorio urgente: Reporte semanal vence ${daysLeft === 0 ? 'hoy' : 'mañana'}`
        : '📝 Recordatorio: Reporte semanal pendiente'

      const result = await resend!.emails.send({
        from: FROM_EMAIL,
        to: student.email,
        subject,
        html: emailHtml,
        tags: [
          { name: 'type', value: 'weekly_reminder' },
          { name: 'student_id', value: student.id },
          { name: 'urgency', value: isUrgent ? 'urgent' : 'normal' }
        ]
      })

      console.log('✅ Weekly reminder email sent to student:', student.email)
      return result

    } catch (error) {
      console.error('❌ Error sending weekly reminder email:', error)
      throw error
    }
  },

  // Send weekly summary to instructor
  async sendWeeklySummary(
    instructor: InstructorInfo,
    weekStart: string,
    weekEnd: string,
    stats: {
      totalStudents: number
      submittedReports: number
      pendingReports: number
      submissionRate: number
    }
  ) {
    try {
      const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/instructor`
      
      const subject = `📊 Resumen semanal: ${stats.submittedReports}/${stats.totalStudents} reportes recibidos`
      
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Intellego Platform</h1>
              <h2 style="color: white; margin: 10px 0 0 0; font-size: 18px;">Resumen Semanal</h2>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h3 style="color: #1f2937; margin-bottom: 20px;">Hola ${instructor.name},</h3>
              
              <p style="color: #374151; line-height: 1.6;">
                Aquí tienes el resumen de reportes semanales para el período del <strong>${weekStart}</strong> al <strong>${weekEnd}</strong>:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h4 style="color: #1f2937; margin-bottom: 15px;">📊 Estadísticas</h4>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">📚 Total de estudiantes: <strong>${stats.totalStudents}</strong></li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">✅ Reportes enviados: <strong>${stats.submittedReports}</strong></li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">⏳ Reportes pendientes: <strong>${stats.pendingReports}</strong></li>
                  <li style="padding: 8px 0;">📈 Tasa de envío: <strong>${stats.submissionRate.toFixed(1)}%</strong></li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Ver Dashboard Completo
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Este es un resumen automático de Intellego Platform.
              </p>
            </div>
          </body>
        </html>
      `

      const result = await resend!.emails.send({
        from: FROM_EMAIL,
        to: instructor.email,
        subject,
        html: emailHtml,
        tags: [
          { name: 'type', value: 'weekly_summary' },
          { name: 'instructor_id', value: instructor.id }
        ]
      })

      console.log('✅ Weekly summary email sent to instructor:', instructor.email)
      return result

    } catch (error) {
      console.error('❌ Error sending weekly summary email:', error)
      throw error
    }
  },

  // Test email functionality
  async sendTestEmail(toEmail: string) {
    try {
      const result = await resend!.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: '🧪 Test Email - Intellego Platform',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 40px;">
                <h1 style="color: #14b8a6;">✅ Email Test Successful!</h1>
                <p style="color: #374151; font-size: 16px;">
                  If you're receiving this email, the Intellego Platform email system is working correctly.
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  Sent at: ${new Date().toLocaleString()}
                </p>
              </div>
            </body>
          </html>
        `,
        tags: [{ name: 'type', value: 'test_email' }]
      })

      console.log('✅ Test email sent successfully to:', toEmail)
      return result

    } catch (error) {
      console.error('❌ Error sending test email:', error)
      throw error
    }
  }
}

// Helper function to get formatted date string
export function formatDateForEmail(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper function to get week start and end dates
export function getWeekDates(date: Date = new Date()) {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
  weekEnd.setHours(23, 59, 59, 999)
  
  return {
    start: weekStart,
    end: weekEnd,
    startFormatted: formatDateForEmail(weekStart),
    endFormatted: formatDateForEmail(weekEnd)
  }
}