/**
 * Instructor Authorization Functions
 * Ensures instructors can only access data for their assigned subjects and students
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logRoleViolation, SecurityEventType, securityLogger } from '@/lib/security-logger';

export interface InstructorPermissions {
  canAccessSubject: (subject: string) => boolean;
  canAccessStudent: (studentId: string, subject: string) => boolean;
  canExportData: (dataType: 'complete' | 'subject' | 'student', subject?: string) => boolean;
  authorizedSubjects: string[];
  instructorId: string;
}

/**
 * Get instructor permissions based on their role and assignments
 * Currently, this is a basic implementation that will need to be enhanced
 * with proper instructor-subject assignments from the database
 */
export async function getInstructorPermissions(): Promise<InstructorPermissions | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    return null;
  }

  // TODO: In future implementations, fetch instructor's assigned subjects from database
  // For now, we'll allow access to all subjects but log the access
  const authorizedSubjects: string[] = ['all']; // This should be fetched from DB

  return {
    instructorId: session.user.id,
    authorizedSubjects,
    
    canAccessSubject: (subject: string) => {
      // Log subject access attempt
      securityLogger.log({
        event: SecurityEventType.DATA_ACCESS,
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        userRole: session.user.role || undefined,
        action: `Subject access check: ${subject}`,
        resource: subject,
        success: true,
        details: { requestedSubject: subject, authorizedSubjects }
      });
      
      // For now, allow all subjects (in production, check against authorized list)
      return true;
    },
    
    canAccessStudent: (studentId: string, subject: string) => {
      // Log student access attempt
      securityLogger.log({
        event: SecurityEventType.DATA_ACCESS,
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        userRole: session.user.role || undefined,
        action: `Student access check: ${studentId} for subject: ${subject}`,
        resource: `student:${studentId}`,
        success: true,
        details: { studentId, subject }
      });
      
      // For now, allow access to all students (in production, verify instructor teaches this student)
      return true;
    },
    
    canExportData: (dataType: 'complete' | 'subject' | 'student', subject?: string) => {
      // Complete exports should be restricted
      if (dataType === 'complete') {
        securityLogger.log({
          event: SecurityEventType.EXPORT_ACTION,
          userId: session.user.id,
          userEmail: session.user.email || undefined,
          userRole: session.user.role || undefined,
          action: 'Complete data export attempt',
          success: false,
          details: { dataType, reason: 'Complete exports not allowed for regular instructors' }
        });
        return false;
      }
      
      // Subject and student exports are allowed
      securityLogger.log({
        event: SecurityEventType.EXPORT_ACTION,
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        userRole: session.user.role || undefined,
        action: `Export permission granted: ${dataType}`,
        resource: subject || 'unknown',
        success: true,
        details: { dataType, subject }
      });
      
      return true;
    }
  };
}

/**
 * Check if instructor has permission for a specific action
 */
export async function checkInstructorPermission(
  action: 'view_subject' | 'view_student' | 'export_data',
  resource: string,
  additionalData?: Record<string, any>
): Promise<boolean> {
  const permissions = await getInstructorPermissions();
  
  if (!permissions) {
    return false;
  }

  switch (action) {
    case 'view_subject':
      return permissions.canAccessSubject(resource);
    
    case 'view_student':
      const subject = additionalData?.subject || 'unknown';
      return permissions.canAccessStudent(resource, subject);
    
    case 'export_data':
      const exportType = additionalData?.type || 'unknown';
      return permissions.canExportData(exportType, resource);
    
    default:
      securityLogger.log({
        event: SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId: permissions.instructorId,
        action: `Unknown permission check: ${action}`,
        resource,
        success: false,
        details: { action, resource, additionalData }
      });
      return false;
  }
}

/**
 * Validate instructor access to specific API endpoints
 */
export async function validateInstructorApiAccess(
  endpoint: string,
  parameters: Record<string, string | null>
): Promise<{ allowed: boolean; reason?: string }> {
  const permissions = await getInstructorPermissions();
  
  if (!permissions) {
    return { allowed: false, reason: 'Invalid instructor session' };
  }

  // Validate specific endpoints
  switch (endpoint) {
    case 'export-complete':
      if (!permissions.canExportData('complete')) {
        logRoleViolation(
          'ADMIN', 
          'INSTRUCTOR', 
          'export-complete', 
          permissions.instructorId,
          undefined
        );
        return { allowed: false, reason: 'Complete exports require admin privileges' };
      }
      break;
      
    case 'subjects':
    case 'navigation':
    case 'subject-statistics':
      // These are generally allowed for instructors
      break;
      
    case 'students':
    case 'student-reports':
      const subject = parameters.subject;
      if (subject && !permissions.canAccessSubject(subject)) {
        return { allowed: false, reason: `Not authorized for subject: ${subject}` };
      }
      break;
      
    default:
      // Allow other endpoints by default, but log them
      securityLogger.log({
        event: SecurityEventType.DATA_ACCESS,
        userId: permissions.instructorId,
        action: `API access: ${endpoint}`,
        resource: endpoint,
        success: true,
        details: { endpoint, parameters }
      });
  }

  return { allowed: true };
}

/**
 * Security audit function to check for suspicious patterns
 */
export function auditInstructorActivity(instructorId: string): {
  suspiciousActivities: number;
  totalActions: number;
  recentFailures: any[];
} {
  const logs = securityLogger.getLogsByUser(instructorId, 100);
  const suspicious = logs.filter(log => 
    log.event === SecurityEventType.ROLE_VIOLATION ||
    log.event === SecurityEventType.UNAUTHORIZED_ACCESS ||
    log.event === SecurityEventType.SUSPICIOUS_ACTIVITY ||
    !log.success
  );
  
  const recentFailures = logs
    .filter(log => !log.success)
    .slice(-10);

  return {
    suspiciousActivities: suspicious.length,
    totalActions: logs.length,
    recentFailures
  };
}