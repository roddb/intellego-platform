/**
 * FASE 6: Email Sending API Endpoint
 * 
 * This endpoint handles email sending requests from the instructor interface.
 * Integrates with the existing feedback approval workflow to send emails
 * when instructors approve and want to send feedback to students.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getProgressReportWithFeedback,
  getFeedbackData,
  updateEmailDeliveryStatus,
  initializeEmailTables,
  findUserById
} from "@/lib/db-operations"
import { getGmailService, SendEmailRequest } from "@/lib/gmail-service"
import { initializeDefaultEmailTemplates } from "@/lib/email-templates"

export interface EmailSendApiRequest {
  reportId: string
  priority?: 'high' | 'medium' | 'low'
  templateName?: string
  sendToInstructor?: boolean // Send copy to instructor
}

export interface EmailSendApiResponse {
  success: boolean
  deliveryId?: string
  gmailMessageId?: string
  message: string
  error?: string
}

/**
 * POST: Send feedback email for a specific report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No autorizado",
        message: "Debe iniciar sesión para enviar emails"
      }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ 
        success: false, 
        error: "Solo instructores pueden enviar emails",
        message: "Acceso denegado"
      }, { status: 403 })
    }

    // Initialize email system on first use
    try {
      await initializeEmailTables()
      await initializeDefaultEmailTemplates()
    } catch (error) {
      console.log('Email tables already initialized or error initializing:', error)
    }

    const requestData: EmailSendApiRequest = await request.json()
    
    if (!requestData.reportId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de reporte requerido",
        message: "Debe especificar el reporte para enviar"
      }, { status: 400 })
    }

    console.log(`📧 Processing email send request for report: ${requestData.reportId}`)

    // Get the report with feedback data
    const reportWithFeedback = await getProgressReportWithFeedback(requestData.reportId)
    
    if (!reportWithFeedback) {
      return NextResponse.json({ 
        success: false, 
        error: "Reporte no encontrado",
        message: "El reporte especificado no existe"
      }, { status: 404 })
    }

    // Get detailed feedback data
    const feedbackData = await getFeedbackData(requestData.reportId)
    
    if (!feedbackData || feedbackData.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: "Feedback no aprobado",
        message: "El feedback debe estar aprobado antes de enviar por email"
      }, { status: 400 })
    }

    // Get instructor information
    const instructor = await findUserById(session.user.id)
    if (!instructor) {
      return NextResponse.json({ 
        success: false, 
        error: "Instructor no encontrado",
        message: "Error al obtener información del instructor"
      }, { status: 400 })
    }

    // Prepare email request
    const emailRequest: SendEmailRequest = {
      reportId: requestData.reportId,
      userId: (reportWithFeedback as any).userId,
      recipientEmail: (reportWithFeedback as any).userEmail,
      recipientName: (reportWithFeedback as any).userName,
      instructorId: session.user.id,
      instructorName: String(instructor.name || 'Instructor'),
      feedbackData: {
        subject: (reportWithFeedback as any).subject || 'Materia',
        weekStart: (reportWithFeedback as any).weekStart,
        weekEnd: (reportWithFeedback as any).weekEnd,
        progressScore: feedbackData.progressScore || 0,
        feedbackContent: feedbackData.feedbackContent || '',
        achievements: feedbackData.achievements || 'Sin logros específicos registrados.',
        improvements: feedbackData.improvements || 'Continuar con el buen trabajo.',
        recommendations: feedbackData.recommendations || 'Seguir las indicaciones del instructor.',
        nextSteps: feedbackData.nextSteps || 'Continuar con el progreso académico.'
      },
      priority: requestData.priority || 'medium',
      templateName: requestData.templateName || 'student_feedback'
    }

    // Get Gmail service and send email
    try {
      const gmailService = getGmailService()
      
      // Test connection first
      const isConnected = await gmailService.testConnection()
      if (!isConnected) {
        return NextResponse.json({ 
          success: false, 
          error: "Servicio de email no disponible",
          message: "No se pudo conectar con Gmail. Verifique la configuración."
        }, { status: 503 })
      }

      // Send the email
      const result = await gmailService.sendEmail(emailRequest)
      
      if (result.success) {
        console.log(`✅ Email sent successfully for report ${requestData.reportId}`)
        
        // Update feedback status to sent
        const updatedFeedback = {
          ...feedbackData,
          emailSent: true,
          sentAt: new Date().toISOString(),
          sentBy: session.user.id,
          status: 'sent'
        }
        
        // Store the updated feedback
        const { storeFeedbackData } = await import('@/lib/db-operations')
        await storeFeedbackData(requestData.reportId, updatedFeedback)
        
        const response: EmailSendApiResponse = {
          success: true,
          deliveryId: result.deliveryId,
          gmailMessageId: result.gmailMessageId,
          message: `Feedback enviado exitosamente a ${(reportWithFeedback as any).userEmail}`
        }
        
        return NextResponse.json(response)
        
      } else {
        console.error(`❌ Failed to send email for report ${requestData.reportId}:`, result.error)
        
        const response: EmailSendApiResponse = {
          success: false,
          deliveryId: result.deliveryId,
          error: result.error,
          message: result.retryable 
            ? "Error temporal. El email se reintentará automáticamente."
            : "Error permanente al enviar email. Contacte soporte técnico."
        }
        
        return NextResponse.json(response, { status: result.retryable ? 503 : 500 })
      }
      
    } catch (gmailError: any) {
      console.error(`❌ Gmail service error for report ${requestData.reportId}:`, gmailError)
      
      return NextResponse.json({ 
        success: false, 
        error: "Error del servicio Gmail",
        message: "Error interno al enviar email. Intente nuevamente más tarde."
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error(`❌ Email API error:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor",
      message: "Error inesperado al procesar solicitud de email"
    }, { status: 500 })
  }
}

/**
 * GET: Get email sending status and history for instructor
 */
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
    const reportId = searchParams.get('reportId')

    if (reportId) {
      // Get email delivery records for specific report
      const { getEmailDeliveryRecords } = await import('@/lib/db-operations')
      const deliveryRecords = await getEmailDeliveryRecords(reportId)
      
      return NextResponse.json({
        reportId,
        deliveryRecords
      })
    } else {
      // Get email delivery statistics for instructor
      const { getEmailDeliveryStats } = await import('@/lib/db-operations')
      const stats = await getEmailDeliveryStats(session.user.id)
      
      return NextResponse.json({
        instructorId: session.user.id,
        emailStats: stats
      })
    }

  } catch (error: any) {
    console.error(`❌ Email status API error:`, error)
    
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}