import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  validateJSONStructure, 
  processFeedbackJSON,
  FeedbackJSON 
} from '@/lib/feedback-processor';
import { logDataAccess, logUnauthorizedAccess, logRoleViolation } from '@/lib/security-logger';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    
    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/feedback/upload');
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      );
    }
    
    // Check instructor role
    if (session.user.role !== 'INSTRUCTOR') {
      logRoleViolation(
        'INSTRUCTOR',
        session.user.role || 'unknown',
        '/api/instructor/feedback/upload',
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' },
        { status: 403 }
      );
    }
    
    // Log data access
    logDataAccess(
      'feedback-upload',
      '/api/instructor/feedback/upload',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown'
    );
    
    console.log(`📤 Feedback upload requested by instructor: ${session.user.email}`);
    
    // Parse JSON body
    let jsonData: FeedbackJSON;
    try {
      jsonData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }
    
    // Validate JSON structure
    const validation = validateJSONStructure(jsonData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid feedback JSON structure',
          details: validation.error 
        },
        { status: 400 }
      );
    }
    
    // Process the feedback data
    const result = await processFeedbackJSON(jsonData, session.user.id);
    
    // Log the processing result
    console.log(`📊 Feedback processing complete:`, {
      total: result.summary.total,
      successful: result.summary.successful,
      failed: result.summary.failed,
      instructor: session.user.email
    });
    
    // Return appropriate response based on result
    if (!result.success && result.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Feedback processing completed with errors',
          summary: result.summary,
          errors: result.errors
        },
        { status: 207 } // Multi-status
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Feedback uploaded successfully',
      summary: result.summary,
      errors: result.errors
    });
    
  } catch (error) {
    console.error('Error in feedback upload API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve sample JSON format
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Return sample JSON format
    const sampleJSON: FeedbackJSON = {
      metadata: {
        instructor: session.user.email || 'instructor@demo.com',
        generated_at: new Date().toISOString(),
        version: '1.0',
        academic_year: '2025'
      },
      feedbacks: [
        {
          student_email: 'estudiante@demo.com',
          student_id: 'EST-2025-001',
          week_start: '2025-01-06',
          subject: 'Física',
          feedback: {
            score: 85,
            general_comments: 'Excelente comprensión de los conceptos...',
            strengths: [
              'Análisis detallado',
              'Buena aplicación de fórmulas'
            ],
            improvements: [
              'Revisar unidades de medida'
            ],
            ai_analysis: 'El estudiante demuestra progreso consistente...'
          }
        }
      ]
    };
    
    return NextResponse.json(sampleJSON, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="feedback_template.json"'
      }
    });
    
  } catch (error) {
    console.error('Error in feedback template API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}