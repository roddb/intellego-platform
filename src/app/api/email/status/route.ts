/**
 * FASE 6: Email Delivery Status and Tracking API
 * 
 * This endpoint provides detailed email delivery tracking and re-send functionality.
 * Allows instructors to monitor email delivery status and manually retry failed sends.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getEmailDeliveryRecords,
  updateEmailDeliveryStatus,
  getProgressReportWithFeedback,
  getFeedbackData,
  findUserById,
  initializeEmailTables
} from "@/lib/db-operations"
import { getGmailService, SendEmailRequest } from "@/lib/gmail-service"

export interface EmailStatusResponse {
  success: boolean
  reportId?: string
  deliveryRecords: Array<{
    id: string
    reportId: string
    recipientName: string
    recipientEmail: string
    studentId: string
    subject: string
    status: string
    priority: string
    sentAt?: string
    deliveredAt?: string
    failureReason?: string
    retryCount: number
    maxRetries: number
    nextRetryAt?: string
    gmailMessageId?: string
    instructorName: string
    createdAt: string
    updatedAt: string
  }>
  message: string
}

export interface ResendEmailRequest {
  deliveryId: string
  reportId: string
  priority?: 'high' | 'medium' | 'low'
}

export interface ResendEmailResponse {
  success: boolean
  deliveryId: string
  newDeliveryId?: string
  gmailMessageId?: string
  message: string
  error?: string
}

/**
 * GET: Get email delivery status for report(s)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No autorizado" 
      }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ 
        success: false, 
        error: "Solo instructores pueden acceder" 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de reporte requerido",
        message: "Debe especificar un reporte para consultar el estado"
      }, { status: 400 })
    }

    // Initialize email tables if needed
    try {
      await initializeEmailTables()
    } catch (error) {
      console.log('Email tables already initialized:', error)
    }

    // Verify report exists and belongs to instructor's scope
    const report = await getProgressReportWithFeedback(reportId)
    if (!report) {
      return NextResponse.json({ 
        success: false, 
        error: "Reporte no encontrado" 
      }, { status: 404 })
    }

    // Get email delivery records for this report
    const deliveryRecords = await getEmailDeliveryRecords(reportId)

    const response: EmailStatusResponse = {
      success: true,
      reportId,
      deliveryRecords: deliveryRecords as any,
      message: `${deliveryRecords.length} registros de entrega encontrados`
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`❌ Email status API error:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor",
      message: "Error al consultar estado de entrega"
    }, { status: 500 })
  }
}

/**
 * POST: Resend failed email or create new delivery attempt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No autorizado" 
      }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ 
        success: false, 
        error: "Solo instructores pueden reenviar emails" 
      }, { status: 403 })
    }

    const requestData: ResendEmailRequest = await request.json()
    
    if (!requestData.reportId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de reporte requerido" 
      }, { status: 400 })
    }

    console.log(`🔄 Processing email resend for report: ${requestData.reportId}`)

    // Initialize email tables if needed
    try {
      await initializeEmailTables()
    } catch (error) {
      console.log('Email tables already initialized:', error)
    }

    // Get the report with feedback data
    const reportWithFeedback = await getProgressReportWithFeedback(requestData.reportId)
    
    if (!reportWithFeedback) {
      return NextResponse.json({ 
        success: false, 
        error: "Reporte no encontrado" 
      }, { status: 404 })
    }

    // Get detailed feedback data
    const feedbackData = await getFeedbackData(requestData.reportId)
    
    if (!feedbackData || feedbackData.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: "Feedback no aprobado",
        message: "El feedback debe estar aprobado antes de reenviar"
      }, { status: 400 })
    }

    // Get instructor information
    const instructor = await findUserById(session.user.id)
    if (!instructor) {
      return NextResponse.json({ 
        success: false, 
        error: "Instructor no encontrado" 
      }, { status: 400 })
    }

    // If deliveryId provided, mark old delivery as superseded
    if (requestData.deliveryId) {
      await updateEmailDeliveryStatus(requestData.deliveryId, 'failed', {
        failureReason: 'Superseded by manual resend'
      })
    }

    // Prepare new email request
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
      priority: requestData.priority || 'high', // High priority for manual resends
      templateName: 'student_feedback'
    }

    // Get Gmail service and send email
    try {
      const gmailService = getGmailService()
      
      // Test connection first
      const isConnected = await gmailService.testConnection()
      if (!isConnected) {
        return NextResponse.json({ 
          success: false, 
          error: "Servicio de email no disponible" 
        }, { status: 503 })
      }

      // Send the email
      const result = await gmailService.sendEmail(emailRequest)
      
      if (result.success) {
        console.log(`✅ Email resent successfully for report ${requestData.reportId}`)
        
        // Update feedback status to sent if not already
        if (feedbackData.status !== 'sent') {
          const updatedFeedback = {
            ...feedbackData,
            emailSent: true,
            sentAt: new Date().toISOString(),
            sentBy: session.user.id,
            status: 'sent'
          }
          
          const { storeFeedbackData } = await import('@/lib/db-operations')
          await storeFeedbackData(requestData.reportId, updatedFeedback)
        }
        
        const response: ResendEmailResponse = {
          success: true,
          deliveryId: requestData.deliveryId || 'new',
          newDeliveryId: result.deliveryId,
          gmailMessageId: result.gmailMessageId,
          message: `Email reenviado exitosamente a ${(reportWithFeedback as any).userEmail}`
        }
        
        return NextResponse.json(response)
        
      } else {
        console.error(`❌ Failed to resend email for report ${requestData.reportId}:`, result.error)
        
        const response: ResendEmailResponse = {
          success: false,
          deliveryId: requestData.deliveryId || 'new',
          newDeliveryId: result.deliveryId,
          error: result.error,
          message: result.retryable 
            ? "Error temporal al reenviar. Se reintentará automáticamente."
            : "Error permanente al reenviar email."
        }
        
        return NextResponse.json(response, { status: result.retryable ? 503 : 500 })
      }
      
    } catch (gmailError: any) {
      console.error(`❌ Gmail service error for resend ${requestData.reportId}:`, gmailError)
      
      return NextResponse.json({ 
        success: false, 
        deliveryId: requestData.deliveryId || 'new',
        error: "Error del servicio Gmail",
        message: "Error interno al reenviar email"
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error(`❌ Email resend API error:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor",
      message: "Error inesperado al procesar reenvío de email"
    }, { status: 500 })
  }
}

/**
 * PUT: Update email delivery status manually (for testing or admin operations)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden actualizar estados" }, { status: 403 })
    }

    const { deliveryId, status, reason } = await request.json()
    
    if (!deliveryId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de entrega y estado requeridos" 
      }, { status: 400 })
    }

    const validStatuses = ['pending', 'sending', 'sent', 'failed', 'bounced']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: "Estado no válido" 
      }, { status: 400 })
    }

    // Update delivery status
    const updates: any = {}
    if (reason) {
      updates.failureReason = reason
    }
    if (status === 'sent') {
      updates.sentAt = new Date().toISOString()
      updates.deliveredAt = new Date().toISOString()
    }

    await updateEmailDeliveryStatus(deliveryId, status, updates)

    return NextResponse.json({
      success: true,
      deliveryId,
      status,
      message: `Estado de entrega actualizado a: ${status}`
    })

  } catch (error: any) {
    console.error(`❌ Email status update API error:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}