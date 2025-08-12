import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getAllWeeklyReports, 
  getProgressReportWithFeedback, 
  getFeedbackData,
  query 
} from "@/lib/db-operations"

export interface InstructorReportWithFeedback {
  id: string
  user: {
    name: string
    email: string
    studentId: string
  }
  weekStart: string
  weekEnd: string
  submittedAt: string
  subject: string
  feedbackStatus: 'ai_generated' | 'under_review' | 'approved' | 'sent' | 'pending_generation'
  progressScore?: number
  hasAiFeedback: boolean
  requiresReview: boolean
  answers: { [questionId: string]: string }
  feedback?: {
    content?: string
    evaluationResults?: any[]
    progressScore?: number
    instructorReviewed?: boolean
    reviewedAt?: string
    reviewedBy?: string
    emailSent?: boolean
    sentAt?: string
  }
}

/**
 * FASE 5: Enhanced instructor reports API with AI feedback integration
 * Provides comprehensive report data including AI evaluations and feedback status
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

    console.log('📊 Fetching enhanced instructor reports with feedback data...')

    // Get all weekly reports
    const rawReports = await getAllWeeklyReports()
    
    // Enhance each report with feedback data and status
    const enhancedReports: InstructorReportWithFeedback[] = []
    
    for (const report of rawReports) {
      try {
        // Get feedback data
        const feedbackData = await getFeedbackData(String(report.id))
        
        // Get answers for this report
        const answersResult = await query(`
          SELECT questionId, answer
          FROM Answer
          WHERE progressReportId = ? AND questionId != '__FEEDBACK_DATA__'
        `, [report.id])
        
        const answers: { [questionId: string]: string } = {}
        answersResult.rows.forEach((row: any) => {
          answers[row.questionId] = row.answer
        })
        
        // Determine feedback status
        let feedbackStatus: InstructorReportWithFeedback['feedbackStatus'] = 'pending_generation'
        let hasAiFeedback = false
        let requiresReview = false
        let progressScore: number | undefined
        
        if (feedbackData) {
          hasAiFeedback = true
          progressScore = feedbackData.progressScore
          
          if (feedbackData.emailSent) {
            feedbackStatus = 'sent'
          } else if (feedbackData.instructorReviewed) {
            feedbackStatus = 'approved'
          } else if (feedbackData.feedbackContent) {
            feedbackStatus = 'ai_generated'
            requiresReview = feedbackData.instructorReviewRequired || 
                            (progressScore !== undefined && progressScore < 50) ||
                            false
            
            if (requiresReview) {
              feedbackStatus = 'under_review'
            }
          }
        }

        const enhancedReport: InstructorReportWithFeedback = {
          id: String(report.id),
          user: {
            name: String(report.userName || report.name || ''),
            email: String(report.userEmail || report.email || ''),
            studentId: String(report.studentId || '')
          },
          weekStart: String(report.weekStart),
          weekEnd: String(report.weekEnd),
          submittedAt: String(report.submittedAt),
          subject: String(report.subject || ''),
          feedbackStatus,
          progressScore,
          hasAiFeedback,
          requiresReview,
          answers,
          feedback: feedbackData
        }

        enhancedReports.push(enhancedReport)
        
      } catch (reportError) {
        console.error(`Error processing report ${report.id}:`, reportError)
        // Include report with minimal data if processing fails
        enhancedReports.push({
          id: String(report.id),
          user: {
            name: String(report.userName || report.name || ''),
            email: String(report.userEmail || report.email || ''),
            studentId: String(report.studentId || '')
          },
          weekStart: String(report.weekStart),
          weekEnd: String(report.weekEnd),
          submittedAt: String(report.submittedAt),
          subject: String(report.subject || ''),
          feedbackStatus: 'pending_generation',
          hasAiFeedback: false,
          requiresReview: false,
          answers: {}
        })
      }
    }

    // Sort reports by submission date (most recent first)
    enhancedReports.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    console.log(`✅ Successfully enhanced ${enhancedReports.length} reports with feedback data`)

    return NextResponse.json({
      reports: enhancedReports,
      summary: {
        total: enhancedReports.length,
        pendingGeneration: enhancedReports.filter(r => r.feedbackStatus === 'pending_generation').length,
        aiGenerated: enhancedReports.filter(r => r.feedbackStatus === 'ai_generated').length,
        underReview: enhancedReports.filter(r => r.feedbackStatus === 'under_review').length,
        approved: enhancedReports.filter(r => r.feedbackStatus === 'approved').length,
        sent: enhancedReports.filter(r => r.feedbackStatus === 'sent').length,
        requiresReview: enhancedReports.filter(r => r.requiresReview).length
      }
    })

  } catch (error) {
    console.error("❌ Error getting enhanced instructor reports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}