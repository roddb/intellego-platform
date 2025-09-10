import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';import { 
  getFeedbackByWeek,
  getFeedbacksByStudent 
} from '@/lib/db-operations';
import { logDataAccess, logUnauthorizedAccess } from '@/lib/security-logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    
    if (!session?.user) {
      logUnauthorizedAccess('/api/student/feedback');
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }
    
    // Students can only access their own feedback
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'This endpoint is for students only' },
        { status: 403 }
      );
    }
    
    // Log data access
    logDataAccess(
      'feedback-retrieval',
      '/api/student/feedback',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown'
    );
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    const subject = searchParams.get('subject');
    
    // If specific week and subject provided, get that feedback
    if (weekStart && subject) {
      const feedback = await getFeedbackByWeek(
        session.user.studentId || session.user.id,
        weekStart,
        subject
      );
      
      if (!feedback) {
        return NextResponse.json(
          { 
            exists: false,
            message: 'No feedback available for this week' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        exists: true,
        feedback: {
          id: feedback.id,
          weekStart: feedback.weekStart,
          subject: feedback.subject,
          score: feedback.score,
          generalComments: feedback.generalComments,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          aiAnalysis: feedback.aiAnalysis,
          skillsMetrics: feedback.skillsMetrics,
          createdAt: feedback.createdAt,
          instructor: {
            name: feedback.instructorName,
            email: feedback.instructorEmail
          }
        }
      });
    }
    
    // Otherwise, get all feedbacks for the student
    const feedbacks = await getFeedbacksByStudent(session.user.studentId || session.user.id);
    
    // Transform feedbacks for response
    const transformedFeedbacks = feedbacks.map(fb => ({
      id: fb.id,
      weekStart: fb.weekStart,
      subject: fb.subject,
      score: fb.score,
      generalComments: fb.generalComments,
      strengths: fb.strengths,
      improvements: fb.improvements,
      aiAnalysis: fb.aiAnalysis,
      skillsMetrics: fb.skillsMetrics,
      createdAt: fb.createdAt,
      instructor: {
        name: fb.instructorName,
        email: fb.instructorEmail
      }
    }));
    
    return NextResponse.json({
      feedbacks: transformedFeedbacks,
      total: transformedFeedbacks.length
    });
    
  } catch (error) {
    console.error('Error in student feedback API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}