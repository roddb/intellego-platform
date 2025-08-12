/**
 * FASE 4: Feedback Generation API Endpoint
 * Integrates the intelligent feedback system with the Intellego Platform
 * 
 * POST /api/feedback/generate
 * Generates personalized educational feedback from student weekly reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createFeedbackIntegrationEngine,
  generateFeedbackFromWeeklyReport
} from '@/lib/feedback-integration-engine';
import { 
  getProgressReportWithFeedback,
  markReportAsReviewed,
  updateProgressReport
} from '@/lib/db-operations';
import { ratelimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting for AI operations
    const identifier = session.user.email || 'anonymous';
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { reportId, studentId, weeklyResponses, forceRegenerate = false } = body;

    // Validate required fields
    if (!reportId && !studentId && !weeklyResponses) {
      return NextResponse.json(
        { error: 'Missing required parameters: reportId, studentId, or weeklyResponses' },
        { status: 400 }
      );
    }

    // Check if feedback already exists (unless forcing regeneration)
    if (reportId && !forceRegenerate) {
      const existingReport = await getProgressReportWithFeedback(reportId);
      if (existingReport?.feedback?.feedbackContent) {
        return NextResponse.json({
          success: true,
          cached: true,
          reportId,
          feedbackContent: existingReport.feedback.feedbackContent,
          metadata: {
            generatedAt: existingReport.feedback.generatedAt,
            progressScore: existingReport.feedback.progressScore,
            wordCount: existingReport.feedback.wordCount,
            instructorReviewRequired: existingReport.feedback.instructorReviewRequired
          }
        });
      }
    }

    // Initialize feedback integration engine
    const feedbackEngine = createFeedbackIntegrationEngine({
      openaiApiKey: process.env.OPENAI_API_KEY,
      evaluationModel: 'gpt-4-turbo-preview',
      feedbackLanguage: 'es'
    });

    let result;

    // Generate feedback based on available data
    if (reportId) {
      // Generate feedback from existing report
      const report = await getProgressReportWithFeedback(reportId);
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      const request = {
        student: {
          id: (report as any).userId,
          name: (report as any).userName,
          email: (report as any).userEmail
        },
        academic: {
          sede: (report as any).sede,
          academicYear: (report as any).academicYear,
          division: (report as any).division,
          subject: (report as any).subject
        },
        week: {
          start: (report as any).weekStart,
          end: (report as any).weekEnd
        },
        responses: (report as any).answers || {},
        submittedAt: (report as any).submittedAt
      };

      result = await feedbackEngine.generateCompleteFeedback(request);

    } else if (weeklyResponses && studentId) {
      // Generate feedback from provided data
      result = await generateFeedbackFromWeeklyReport(
        { id: studentId },
        weeklyResponses.academic,
        weeklyResponses.responses,
        {
          openaiApiKey: process.env.OPENAI_API_KEY
        }
      );
    }

    if (!result) {
      throw new Error('Failed to generate feedback');
    }

    // Log successful generation
    console.log(`✅ Feedback generated for student: ${result.feedbackContent.metadata.studentInfo.name}`);
    console.log(`📊 Progress Score: ${result.feedbackContent.metadata.progressScore}%`);
    console.log(`🔍 Requires Review: ${result.feedbackContent.metadata.instructorReviewRequired}`);

    // Prepare response
    const response = {
      success: true,
      cached: false,
      reportId: result.storageResult.reportId,
      feedbackContent: result.feedbackContent.content,
      metadata: result.feedbackContent.metadata,
      evaluation: {
        averageScore: result.evaluationResults.reduce((sum, r) => sum + r.score.totalScore, 0) / result.evaluationResults.length,
        totalQuestions: result.evaluationResults.length,
        resultsBreakdown: result.evaluationResults.map(r => ({
          questionId: r.questionId,
          score: r.score.totalScore,
          level: r.score.overallLevel,
          hasErrors: (r.errors && r.errors.length > 0)
        }))
      },
      progress: {
        currentScore: result.progressAnalysis.currentWeekScore,
        trend: result.progressAnalysis.weeklyTrend,
        flagged: result.progressAnalysis.flaggedForAttention
      },
      instructor: {
        notificationLevel: result.instructorNotification.alertLevel,
        requiresReview: result.instructorNotification.requiresReview,
        summary: result.instructorNotification.summary,
        concerns: result.instructorNotification.flaggedConcerns
      },
      storage: {
        stored: result.storageResult.feedbackStored,
        exported: result.storageResult.jsonExported,
        filePath: result.storageResult.filePath,
        errors: result.storageResult.errors
      }
    };

    // Return different status based on success level
    if (result.storageResult.errors.length > 0) {
      return NextResponse.json(response, { status: 207 }); // Partial success
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('❌ Feedback generation error:', error);

    // Return appropriate error response
    const errorResponse = {
      error: 'Failed to generate feedback',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    };

    // Check for specific error types
    if (error.message.includes('Rate limit')) {
      return NextResponse.json(errorResponse, { status: 429 });
    }
    
    if (error.message.includes('Authentication') || error.message.includes('API key')) {
      return NextResponse.json(errorResponse, { status: 401 });
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(errorResponse, { status: 404 });
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Missing reportId parameter' },
        { status: 400 }
      );
    }

    // Get existing feedback
    const report = await getProgressReportWithFeedback(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this report
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN' && 
        (report as any).userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (!report.feedback) {
      return NextResponse.json(
        { error: 'Feedback not generated for this report' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId,
      feedbackContent: report.feedback.feedbackContent || 'No content available',
      metadata: {
        generatedAt: report.feedback.generatedAt,
        progressScore: report.feedback.progressScore || 0,
        wordCount: report.feedback.wordCount || 0,
        instructorReviewRequired: report.feedback.instructorReviewRequired || false,
        instructorReviewed: report.feedback.instructorReviewed || false,
        reviewedAt: report.feedback.reviewedAt,
        reviewedBy: report.feedback.reviewedBy
      },
      studentInfo: {
        name: (report as any).userName,
        email: (report as any).userEmail,
        studentId: (report as any).studentId
      },
      academicInfo: {
        sede: (report as any).sede,
        academicYear: (report as any).academicYear,
        division: (report as any).division,
        subject: (report as any).subject
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Authentication check - only instructors can update feedback
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Instructor access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reportId, action, changes } = body;

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters: reportId and action' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'review':
        // Mark feedback as reviewed by instructor
        await markReportAsReviewed(reportId, session.user.id);
        return NextResponse.json({
          success: true,
          message: 'Report marked as reviewed',
          reviewedBy: session.user.name,
          reviewedAt: new Date().toISOString()
        });

      case 'modify':
        // Apply instructor modifications to feedback
        if (!changes) {
          return NextResponse.json(
            { error: 'Changes required for modify action' },
            { status: 400 }
          );
        }

        // This would implement feedback modification logic
        // For now, just update with instructor notes
        const updatedData = {
          instructorReviewed: true,
          reviewedAt: new Date().toISOString(),
          reviewedBy: session.user.id,
          instructorChanges: changes
        };

        await updateProgressReport(reportId, updatedData);

        return NextResponse.json({
          success: true,
          message: 'Feedback updated with instructor changes',
          changes: changes
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: review, modify' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('❌ Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback', message: error.message },
      { status: 500 }
    );
  }
}