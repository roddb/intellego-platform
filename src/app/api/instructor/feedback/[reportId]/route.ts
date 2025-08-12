import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getProgressReportWithFeedback, 
  getFeedbackData,
  storeFeedbackData,
  markReportAsReviewed
} from "@/lib/db-operations"

export interface FeedbackUpdateRequest {
  action: 'approve' | 'request_changes' | 'update_content' | 'mark_sent'
  modifiedContent?: string
  instructorNotes?: string
  changes?: {
    achievements?: string
    improvements?: string
    recommendations?: string
    nextSteps?: string
  }
}

export interface FeedbackResponse {
  success: boolean
  reportId: string
  feedbackStatus: 'ai_generated' | 'under_review' | 'approved' | 'sent'
  updatedFeedback?: any
  message: string
}

/**
 * FASE 5: Feedback management API for instructor review and approval workflow
 * Handles instructor modifications to AI-generated feedback
 */

// GET: Retrieve feedback data for a specific report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    const { reportId } = await params
    
    if (!reportId) {
      return NextResponse.json({ error: "ID de reporte requerido" }, { status: 400 })
    }

    console.log(`📋 Fetching feedback data for report: ${reportId}`)

    // Get complete report with feedback data
    const reportWithFeedback = await getProgressReportWithFeedback(reportId)
    
    if (!reportWithFeedback) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
    }

    console.log(`✅ Successfully retrieved feedback for report: ${reportId}`)

    return NextResponse.json({
      reportId,
      student: {
        name: (reportWithFeedback as any).userName,
        email: (reportWithFeedback as any).userEmail,
        studentId: (reportWithFeedback as any).studentId
      },
      academic: {
        sede: (reportWithFeedback as any).sede,
        academicYear: (reportWithFeedback as any).academicYear,
        division: (reportWithFeedback as any).division,
        subject: (reportWithFeedback as any).subject
      },
      week: {
        start: (reportWithFeedback as any).weekStart,
        end: (reportWithFeedback as any).weekEnd
      },
      submittedAt: (reportWithFeedback as any).submittedAt,
      answers: (reportWithFeedback as any).answers,
      feedback: (reportWithFeedback as any).feedback
    })

  } catch (error) {
    console.error(`❌ Error fetching feedback for report:`, error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT: Update feedback based on instructor review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    const { reportId } = await params
    
    if (!reportId) {
      return NextResponse.json({ error: "ID de reporte requerido" }, { status: 400 })
    }

    const updateData: FeedbackUpdateRequest = await request.json()
    
    console.log(`🔄 Processing feedback update for report: ${reportId}, action: ${updateData.action}`)

    // Get current feedback data
    const currentFeedback = await getFeedbackData(reportId) || {}
    
    let updatedFeedback = { ...currentFeedback }
    let feedbackStatus: string = currentFeedback.status || 'ai_generated'
    let message = ''

    switch (updateData.action) {
      case 'approve':
        updatedFeedback = {
          ...updatedFeedback,
          instructorReviewed: true,
          reviewedAt: new Date().toISOString(),
          reviewedBy: session.user.id,
          status: 'approved',
          instructorNotes: updateData.instructorNotes || updatedFeedback.instructorNotes
        }
        feedbackStatus = 'approved'
        message = 'Feedback aprobado exitosamente'
        
        // Mark report as reviewed in system
        await markReportAsReviewed(reportId, session.user.id)
        break

      case 'request_changes':
        updatedFeedback = {
          ...updatedFeedback,
          status: 'under_review',
          instructorNotes: updateData.instructorNotes || 'Requiere modificaciones',
          reviewedAt: new Date().toISOString(),
          reviewedBy: session.user.id,
          changesRequested: true
        }
        feedbackStatus = 'under_review'
        message = 'Cambios solicitados para el feedback'
        break

      case 'update_content':
        // Apply instructor modifications to feedback content
        if (updateData.modifiedContent) {
          updatedFeedback = {
            ...updatedFeedback,
            feedbackContent: updateData.modifiedContent,
            modifiedByInstructor: true,
            lastModifiedAt: new Date().toISOString(),
            lastModifiedBy: session.user.id,
            instructorNotes: updateData.instructorNotes || updatedFeedback.instructorNotes
          }
        }
        
        if (updateData.changes) {
          updatedFeedback = {
            ...updatedFeedback,
            instructorChanges: updateData.changes,
            modifiedByInstructor: true,
            lastModifiedAt: new Date().toISOString(),
            lastModifiedBy: session.user.id
          }
        }
        
        feedbackStatus = 'under_review'
        message = 'Contenido del feedback actualizado'
        break

      case 'mark_sent':
        updatedFeedback = {
          ...updatedFeedback,
          emailSent: true,
          sentAt: new Date().toISOString(),
          sentBy: session.user.id,
          status: 'sent'
        }
        feedbackStatus = 'sent'
        message = 'Feedback marcado como enviado'
        break

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    // Store updated feedback data
    await storeFeedbackData(reportId, updatedFeedback)
    
    console.log(`✅ Successfully updated feedback for report: ${reportId}`)

    const response: FeedbackResponse = {
      success: true,
      reportId,
      feedbackStatus: feedbackStatus as any,
      updatedFeedback,
      message
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error(`❌ Error updating feedback for report:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: "Error interno del servidor",
        message: "No se pudo actualizar el feedback"
      },
      { status: 500 }
    )
  }
}