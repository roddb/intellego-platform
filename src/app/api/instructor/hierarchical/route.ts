import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hierarchicalApiRateLimit, exportApiRateLimit } from '@/lib/rate-limit';
import { 
  logUnauthorizedAccess, 
  logRoleViolation, 
  logDataAccess, 
  logExportAction, 
  logRateLimitExceeded 
} from '@/lib/security-logger';
import { validateInstructorApiAccess } from '@/lib/instructor-authorization';
import { 
  buildCompleteHierarchicalData,
  getHierarchicalNavigation,
  getSubjectStatistics,
  getSubjectsByInstructor,
  getYearsBySubject,
  getCoursesBySubjectAndYear,
  getStudentsByCourse,
  getWeeklyReportsByStudent,
  generateCompleteHierarchicalJSON,
  generateStudentSubjectJSON,
  generateReportJSON,
  getReportWithAnswers
} from '@/lib/db-operations';

export async function GET(request: Request) {
  try {
    // Enhanced session validation
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/hierarchical');
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required.' }, 
        { status: 401 }
      );
    }

    if (session.user.role !== 'INSTRUCTOR') {
      logRoleViolation('INSTRUCTOR', session.user.role || 'unknown', '/api/instructor/hierarchical', session.user.id, session.user.email || undefined);
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' }, 
        { status: 403 }
      );
    }

    // Extract request parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const subject = searchParams.get('subject');
    const year = searchParams.get('year');
    const course = searchParams.get('course');
    const userId = searchParams.get('userId');
    const reportId = searchParams.get('reportId');
    
    // Apply rate limiting based on action type
    const isExportAction = ['export-complete', 'export-student-subject', 'export-report'].includes(action || '');
    const rateLimiter = isExportAction ? exportApiRateLimit : hierarchicalApiRateLimit;
    
    const rateLimitResult = await rateLimiter.limit(session.user.id);
    if (!rateLimitResult.success) {
      logRateLimitExceeded(session.user.id, session.user.email || 'unknown', action || 'unknown', rateLimitResult.limit);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.reset
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // Validate instructor access to specific endpoint
    const accessValidation = await validateInstructorApiAccess(action || 'unknown', {
      subject,
      year,
      course,
      userId,
      reportId
    });
    
    if (!accessValidation.allowed) {
      logRoleViolation('AUTHORIZED_INSTRUCTOR', session.user.role || 'unknown', action || 'unknown', session.user.id, session.user.email || undefined);
      return NextResponse.json(
        { error: `Access denied: ${accessValidation.reason}` },
        { status: 403 }
      );
    }

    // Log data access for audit trail
    logDataAccess(action || 'unknown', '/api/instructor/hierarchical', session.user.id, session.user.email || 'unknown', session.user.role || 'unknown');

    console.log(`📊 Hierarchical API called with action: ${action}`);

    switch (action) {
      case 'navigation':
        // Fast navigation structure for UI
        const navigation = await getHierarchicalNavigation();
        return NextResponse.json({ 
          success: true, 
          data: navigation,
          timestamp: new Date().toISOString()
        });

      case 'subjects':
        // Get all subjects
        const subjects = await getSubjectsByInstructor();
        return NextResponse.json({ 
          success: true, 
          data: subjects,
          count: subjects.length,
          timestamp: new Date().toISOString()
        });

      case 'years':
        // Get years for a specific subject
        if (!subject) {
          return NextResponse.json(
            { error: 'Subject parameter is required for years action' },
            { status: 400 }
          );
        }
        const years = await getYearsBySubject(subject);
        return NextResponse.json({ 
          success: true, 
          data: years,
          subject,
          count: years.length,
          timestamp: new Date().toISOString()
        });

      case 'courses':
        // Get courses for a specific subject and year
        if (!subject || !year) {
          return NextResponse.json(
            { error: 'Subject and year parameters are required for courses action' },
            { status: 400 }
          );
        }
        const courses = await getCoursesBySubjectAndYear(subject, year);
        return NextResponse.json({ 
          success: true, 
          data: courses,
          subject,
          year,
          count: courses.length,
          timestamp: new Date().toISOString()
        });

      case 'students':
        // Get students for a specific subject, year, and course
        if (!subject || !year || !course) {
          return NextResponse.json(
            { error: 'Subject, year, and course parameters are required for students action' },
            { status: 400 }
          );
        }
        const students = await getStudentsByCourse(subject, year, course);
        return NextResponse.json({ 
          success: true, 
          data: students,
          subject,
          year,
          course,
          count: students.length,
          timestamp: new Date().toISOString()
        });

      case 'student-reports':
        // Get weekly reports for a specific student and subject
        if (!userId || !subject) {
          return NextResponse.json(
            { error: 'UserId and subject parameters are required for student-reports action' },
            { status: 400 }
          );
        }
        const reports = await getWeeklyReportsByStudent(userId, subject);
        return NextResponse.json({ 
          success: true, 
          data: reports,
          userId,
          subject,
          count: reports.length,
          timestamp: new Date().toISOString()
        });

      case 'subject-statistics':
        // Get aggregated statistics for a subject
        if (!subject) {
          return NextResponse.json(
            { error: 'Subject parameter is required for subject-statistics action' },
            { status: 400 }
          );
        }
        const statistics = await getSubjectStatistics(subject);
        return NextResponse.json({ 
          success: true, 
          data: statistics,
          subject,
          timestamp: new Date().toISOString()
        });

      case 'complete':
        // Get complete hierarchical structure (WARNING: This can be large!)
        console.log('⚠️  Building complete hierarchical data - this may take time for large datasets');
        const completeData = await buildCompleteHierarchicalData();
        return NextResponse.json({ 
          success: true, 
          data: completeData,
          timestamp: new Date().toISOString()
        });

      case 'export-complete':
        // Export complete hierarchical data as JSON
        logExportAction('complete-hierarchical', 'all-data', session.user.id, session.user.email || 'unknown');
        const jsonData = await generateCompleteHierarchicalJSON();
        return new NextResponse(jsonData, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="intellego_hierarchical_data_${new Date().toISOString().split('T')[0]}.json"`
          }
        });

      case 'export-student-subject':
        // Export all reports for a specific student and subject
        if (!userId || !subject) {
          return NextResponse.json(
            { error: 'UserId and subject parameters are required for export-student-subject action' },
            { status: 400 }
          );
        }
        logExportAction('student-subject', `student:${userId}, subject:${subject}`, session.user.id, session.user.email || 'unknown');
        const studentSubjectJSON = await generateStudentSubjectJSON(userId, subject);
        return new NextResponse(studentSubjectJSON, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="student_${userId}_${subject}_reports.json"`
          }
        });

      case 'export-report':
        // Export single report as JSON
        if (!reportId) {
          return NextResponse.json(
            { error: 'ReportId parameter is required for export-report action' },
            { status: 400 }
          );
        }
        logExportAction('single-report', `report:${reportId}`, session.user.id, session.user.email || 'unknown');
        const reportJSON = await generateReportJSON(reportId);
        return new NextResponse(reportJSON, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="report_${reportId}.json"`
          }
        });

      case 'report-details':
        // Get detailed report with answers
        if (!reportId) {
          return NextResponse.json(
            { error: 'ReportId parameter is required for report-details action' },
            { status: 400 }
          );
        }
        const reportDetails = await getReportWithAnswers(reportId);
        if (!reportDetails) {
          return NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ 
          success: true, 
          data: reportDetails,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter. Supported actions: navigation, subjects, years, courses, students, student-reports, subject-statistics, complete, export-complete, export-student-subject, export-report, report-details' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in hierarchical API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 
      { status: 500 }
    );
  }
}