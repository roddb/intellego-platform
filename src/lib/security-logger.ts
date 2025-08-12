/**
 * Security Logging System for Intellego Platform
 * Centralized logging for security events, access control, and audit trails
 */

export enum SecurityEventType {
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE', 
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ROLE_VIOLATION = 'ROLE_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATA_ACCESS = 'DATA_ACCESS',
  EXPORT_ACTION = 'EXPORT_ACTION',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

export interface SecurityLogEntry {
  timestamp: string;
  event: SecurityEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private maxLogs: number = 1000; // Keep last 1000 entries in memory

  /**
   * Log a security event
   */
  public log(entry: Omit<SecurityLogEntry, 'timestamp'>): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Add to memory store
    this.logs.push(logEntry);
    
    // Maintain max size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for development/production monitoring
    const logLevel = this.getLogLevel(entry.event);
    const message = this.formatLogMessage(logEntry);
    
    switch (logLevel) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
      default:
        console.log(message);
        break;
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logEntry);
    }
  }

  /**
   * Get recent security logs (for admin dashboard)
   */
  public getRecentLogs(limit: number = 100): SecurityLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by user
   */
  public getLogsByUser(userId: string, limit: number = 50): SecurityLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Get suspicious activities
   */
  public getSuspiciousActivities(): SecurityLogEntry[] {
    const suspiciousTypes = [
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventType.ROLE_VIOLATION,
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityEventType.AUTH_FAILURE
    ];

    return this.logs.filter(log => 
      suspiciousTypes.includes(log.event) || !log.success
    );
  }

  /**
   * Clear old logs
   */
  public clearOldLogs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp) > cutoffTime
    );
  }

  private getLogLevel(event: SecurityEventType): 'error' | 'warn' | 'info' {
    switch (event) {
      case SecurityEventType.AUTH_FAILURE:
      case SecurityEventType.UNAUTHORIZED_ACCESS:
      case SecurityEventType.ROLE_VIOLATION:
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return 'error';
      
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
      case SecurityEventType.SESSION_EXPIRED:
        return 'warn';
      
      default:
        return 'info';
    }
  }

  private formatLogMessage(entry: SecurityLogEntry): string {
    const status = entry.success ? '✅' : '❌';
    const user = entry.userEmail ? ` [${entry.userEmail}]` : '';
    const role = entry.userRole ? ` (${entry.userRole})` : '';
    
    return `${status} [SECURITY] ${entry.event}${user}${role}: ${entry.action} - ${entry.timestamp}`;
  }

  private sendToExternalLogger(entry: SecurityLogEntry): void {
    // TODO: Implement external logging service integration
    // Examples: Datadog, Sentry, CloudWatch, etc.
    // For now, this is a placeholder
    console.log('📤 Would send to external logger:', entry);
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

// Helper functions for common logging scenarios
export const logAuthSuccess = (userId: string, userEmail: string, userRole: string) => {
  securityLogger.log({
    event: SecurityEventType.AUTH_SUCCESS,
    userId,
    userEmail,
    userRole,
    action: 'User authentication successful',
    success: true
  });
};

export const logAuthFailure = (email: string, reason: string) => {
  securityLogger.log({
    event: SecurityEventType.AUTH_FAILURE,
    userEmail: email,
    action: `Authentication failed: ${reason}`,
    success: false
  });
};

export const logUnauthorizedAccess = (path: string, userId?: string, userEmail?: string, userRole?: string) => {
  securityLogger.log({
    event: SecurityEventType.UNAUTHORIZED_ACCESS,
    userId,
    userEmail,
    userRole,
    action: `Unauthorized access attempt to: ${path}`,
    resource: path,
    success: false
  });
};

export const logRoleViolation = (requiredRole: string, actualRole: string, resource: string, userId?: string, userEmail?: string) => {
  securityLogger.log({
    event: SecurityEventType.ROLE_VIOLATION,
    userId,
    userEmail,
    userRole: actualRole,
    action: `Role violation: Required ${requiredRole}, got ${actualRole}`,
    resource,
    success: false,
    details: { requiredRole, actualRole }
  });
};

export const logDataAccess = (action: string, resource: string, userId: string, userEmail: string, userRole: string) => {
  securityLogger.log({
    event: SecurityEventType.DATA_ACCESS,
    userId,
    userEmail,
    userRole,
    action: `Data access: ${action}`,
    resource,
    success: true
  });
};

export const logExportAction = (exportType: string, resource: string, userId: string, userEmail: string) => {
  securityLogger.log({
    event: SecurityEventType.EXPORT_ACTION,
    userId,
    userEmail,
    action: `Data export: ${exportType}`,
    resource,
    success: true,
    details: { exportType }
  });
};

export const logRateLimitExceeded = (userId: string, userEmail: string, action: string, limit: number) => {
  securityLogger.log({
    event: SecurityEventType.RATE_LIMIT_EXCEEDED,
    userId,
    userEmail,
    action: `Rate limit exceeded for: ${action}`,
    success: false,
    details: { limit, action }
  });
};