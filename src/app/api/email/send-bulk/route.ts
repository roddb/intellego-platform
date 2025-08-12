/**
 * FASE 6: Bulk Email Sending API Endpoint
 * 
 * This endpoint handles bulk email sending for multiple approved reports.
 * Allows instructors to send feedback to multiple students at once.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getProgressReportWithFeedback,
  getFeedbackData,
  storeFeedbackData,
  findUserById,
  initializeEmailTables
} from "@/lib/db-operations"
import { getGmailService, SendEmailRequest } from "@/lib/gmail-service"
import { initializeDefaultEmailTemplates } from "@/lib/email-templates"

export interface BulkEmailRequest {
  reportIds: string[]
  priority?: 'high' | 'medium' | 'low'
  templateName?: string
}

export interface BulkEmailResponse {
  success: boolean
  totalRequested: number
  totalSent: number
  totalFailed: number
  results: Array<{
    reportId: string
    studentName: string
    studentEmail: string
    success: boolean
    deliveryId?: string
    gmailMessageId?: string
    error?: string
  }>
  message: string
}

/**
 * POST: Send feedback emails for multiple reports
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

    // Initialize email system
    try {
      await initializeEmailTables()
      await initializeDefaultEmailTemplates()
    } catch (error) {
      console.log('Email tables already initialized:', error)
    }

    const requestData: BulkEmailRequest = await request.json()
    
    if (!requestData.reportIds || !Array.isArray(requestData.reportIds) || requestData.reportIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "IDs de reportes requeridos",
        message: "Debe especificar al menos un reporte para enviar"
      }, { status: 400 })
    }

    if (requestData.reportIds.length > 50) {
      return NextResponse.json({ 
        success: false, 
        error: "Demasiados reportes",
        message: "Máximo 50 reportes por operación de envío masivo"
      }, { status: 400 })
    }

    console.log(`📧 Processing bulk email send for ${requestData.reportIds.length} reports`)

    // Get instructor information
    const instructor = await findUserById(session.user.id)
    if (!instructor) {
      return NextResponse.json({ 
        success: false, 
        error: "Instructor no encontrado",
        message: "Error al obtener información del instructor"
      }, { status: 400 })
    }

    // Get Gmail service
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

    // Prepare email requests
    const emailRequests: SendEmailRequest[] = []
    const results: BulkEmailResponse['results'] = []

    for (const reportId of requestData.reportIds) {
      try {
        // Get the report with feedback data
        const reportWithFeedback = await getProgressReportWithFeedback(reportId)
        
        if (!reportWithFeedback) {
          results.push({
            reportId,
            studentName: 'Desconocido',
            studentEmail: 'Desconocido',
            success: false,
            error: 'Reporte no encontrado'
          })
          continue
        }

        // Get detailed feedback data
        const feedbackData = await getFeedbackData(reportId)
        
        if (!feedbackData || feedbackData.status !== 'approved') {
          results.push({
            reportId,
            studentName: (reportWithFeedback as any).userName || 'Desconocido',
            studentEmail: (reportWithFeedback as any).userEmail || 'Desconocido',
            success: false,
            error: 'Feedback no aprobado'
          })
          continue
        }

        // Prepare email request
        const emailRequest: SendEmailRequest = {
          reportId,
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

        emailRequests.push(emailRequest)

      } catch (error: any) {
        console.error(`❌ Error preparing email for report ${reportId}:`, error)
        results.push({
          reportId,
          studentName: 'Desconocido',
          studentEmail: 'Desconocido',
          success: false,
          error: `Error de preparación: ${error.message}`
        })
      }
    }

    // Send bulk emails
    console.log(`📧 Sending ${emailRequests.length} emails via Gmail API`)
    const sendResults = await gmailService.sendBulkEmails(emailRequests)

    // Process results and update feedback status
    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < emailRequests.length; i++) {
      const emailRequest = emailRequests[i]
      const sendResult = sendResults[i]

      if (sendResult.success) {
        totalSent++
        
        // Update feedback status to sent
        try {
          const feedbackData = await getFeedbackData(emailRequest.reportId)
          const updatedFeedback = {
            ...feedbackData,
            emailSent: true,
            sentAt: new Date().toISOString(),
            sentBy: session.user.id,
            status: 'sent'
          }
          await storeFeedbackData(emailRequest.reportId, updatedFeedback)
        } catch (error) {
          console.error(`❌ Error updating feedback status for ${emailRequest.reportId}:`, error)
        }

        results.push({
          reportId: emailRequest.reportId,
          studentName: emailRequest.recipientName,
          studentEmail: emailRequest.recipientEmail,
          success: true,
          deliveryId: sendResult.deliveryId,
          gmailMessageId: sendResult.gmailMessageId
        })
      } else {
        totalFailed++
        
        results.push({
          reportId: emailRequest.reportId,
          studentName: emailRequest.recipientName,
          studentEmail: emailRequest.recipientEmail,
          success: false,
          deliveryId: sendResult.deliveryId,
          error: sendResult.error
        })
      }
    }

    // Also account for preparation failures
    totalFailed += results.filter(r => !r.success && !emailRequests.find(req => req.reportId === r.reportId)).length

    console.log(`📊 Bulk email complete: ${totalSent} sent, ${totalFailed} failed`)

    const response: BulkEmailResponse = {
      success: totalSent > 0,
      totalRequested: requestData.reportIds.length,
      totalSent,
      totalFailed,
      results,
      message: `Envío masivo completado: ${totalSent} enviados exitosamente, ${totalFailed} fallaron${totalFailed > 0 ? ' (se reintentarán automáticamente si es posible)' : ''}`
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`❌ Bulk email API error:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor",
      message: "Error inesperado al procesar envío masivo de emails"
    }, { status: 500 })
  }
}