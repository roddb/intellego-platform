import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getProgressReportWithFeedback,
  storeFeedbackData,
  findUserById
} from "@/lib/db-operations"
import { 
  createFeedbackIntegrationEngine,
  FeedbackGenerationRequest
} from "@/lib/feedback-integration-engine"

/**
 * FASE 5: On-demand AI feedback generation for instructor workflow
 * Allows instructors to generate AI feedback for reports that don't have it yet
 */
export async function POST(
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

    console.log(`🤖 Starting AI feedback generation for report: ${reportId}`)

    // Get the complete report data
    const reportData = await getProgressReportWithFeedback(reportId)
    
    if (!reportData) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
    }

    // Get user details
    const userData = await findUserById((reportData as any).userId)
    
    if (!userData) {
      return NextResponse.json({ error: "Datos de usuario no encontrados" }, { status: 404 })
    }

    // Check if feedback already exists
    if (reportData.feedback && reportData.feedback.feedbackContent) {
      return NextResponse.json({ 
        error: "Este reporte ya tiene feedback generado",
        existingFeedback: true,
        feedbackStatus: reportData.feedback.status || 'ai_generated'
      }, { status: 409 })
    }

    // Prepare the feedback generation request
    const feedbackRequest: FeedbackGenerationRequest = {
      student: {
        id: String(userData.id),
        name: String(userData.name),
        email: String(userData.email)
      },
      academic: {
        sede: String(userData.sede || ''),
        academicYear: String(userData.academicYear || ''),
        division: String(userData.division || ''),
        subject: String((reportData as any).subject || '')
      },
      week: {
        start: String((reportData as any).weekStart),
        end: String((reportData as any).weekEnd)
      },
      responses: (reportData as any).answers || {},
      submittedAt: String((reportData as any).submittedAt)
    }

    // Initialize the feedback engine
    const feedbackEngine = createFeedbackIntegrationEngine({
      openaiApiKey: process.env.OPENAI_API_KEY,
      evaluationModel: 'gpt-4-turbo-preview',
      feedbackLanguage: 'es'
    })

    console.log(`⚡ Generating AI feedback using integration engine...`)

    // Generate complete feedback
    const feedbackResult = await feedbackEngine.generateCompleteFeedback(feedbackRequest)

    // Store the generated feedback in database
    const feedbackDataToStore = {
      evaluationResults: feedbackResult.evaluationResults,
      feedbackContent: feedbackResult.feedbackContent.content,
      progressScore: feedbackResult.progressAnalysis.currentWeekScore,
      instructorReviewRequired: feedbackResult.feedbackContent.metadata.instructorReviewRequired,
      generatedAt: new Date().toISOString(),
      aiGenerationModel: 'gpt-4-turbo-preview',
      status: 'ai_generated',
      emailData: feedbackResult.emailData,
      instructorNotification: feedbackResult.instructorNotification
    }

    await storeFeedbackData(reportId, feedbackDataToStore)

    console.log(`✅ AI feedback generated and stored successfully for report: ${reportId}`)

    // Determine feedback status based on review requirements
    let feedbackStatus = 'ai_generated'
    if (feedbackResult.feedbackContent.metadata.instructorReviewRequired || 
        feedbackResult.progressAnalysis.flaggedForAttention) {
      feedbackStatus = 'under_review'
    }

    return NextResponse.json({
      success: true,
      reportId,
      feedbackStatus,
      feedback: {
        content: feedbackResult.feedbackContent.content,
        progressScore: feedbackResult.progressAnalysis.currentWeekScore,
        wordCount: feedbackResult.feedbackContent.metadata.wordCount,
        requiresReview: feedbackResult.feedbackContent.metadata.instructorReviewRequired,
        generatedAt: new Date().toISOString()
      },
      evaluation: {
        totalQuestions: feedbackResult.evaluationResults.length,
        averageScore: feedbackResult.evaluationResults.reduce((sum, r) => sum + r.score.totalScore, 0) / feedbackResult.evaluationResults.length,
        flaggedForAttention: feedbackResult.progressAnalysis.flaggedForAttention
      },
      progressAnalysis: {
        currentWeekScore: feedbackResult.progressAnalysis.currentWeekScore,
        weeklyTrend: feedbackResult.progressAnalysis.weeklyTrend,
        historicalComparison: feedbackResult.progressAnalysis.historicalComparison
      },
      instructorNotification: feedbackResult.instructorNotification,
      message: `Feedback generado exitosamente. ${feedbackResult.feedbackContent.metadata.instructorReviewRequired ? 'Requiere revisión del instructor.' : 'Listo para envío.'}`
    })

  } catch (error) {
    console.error(`❌ Error generating AI feedback for report:`, error)
    
    // Check if it's an API key issue
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { 
          error: "Error de configuración de IA",
          message: "La clave API de OpenAI no está configurada correctamente",
          technical: error.message
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Error generando feedback",
        message: "No se pudo generar el feedback automático",
        technical: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}