/**
 * FASE 6: Gmail API Service for Email Notifications
 * 
 * This service handles Gmail API integration for sending student feedback emails
 * with proper authentication, error handling, and delivery tracking.
 * 
 * Features:
 * - OAuth 2.0 authentication with Google
 * - HTML and plain text email sending
 * - Delivery tracking and status updates
 * - Rate limiting and retry logic
 * - Queue management for bulk operations
 * - Professional error handling
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { 
  createEmailDeliveryRecord, 
  updateEmailDeliveryStatus, 
  incrementEmailRetryCount,
  getPendingEmailRetries,
  EmailDeliveryRecord
} from './db-operations';
import { 
  EmailTemplateVariables, 
  replaceTemplateVariables,
  formatEmailDate,
  formatEmailDateTime,
  STUDENT_FEEDBACK_TEMPLATE 
} from './email-templates';

// Gmail API configuration
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 60,  // Conservative limit for Gmail API
  burstLimit: 10,         // Max concurrent requests
  retryDelayMs: 1000      // Base retry delay
};

// Service configuration
export interface GmailServiceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  maxRetries?: number;
  rateLimitRpm?: number;
}

// Email sending request
export interface SendEmailRequest {
  reportId: string;
  userId: string;
  recipientEmail: string;
  recipientName: string;
  instructorId: string;
  instructorName: string;
  feedbackData: {
    subject: string;
    weekStart: string;
    weekEnd: string;
    progressScore: number;
    feedbackContent: string;
    achievements: string;
    improvements: string;
    recommendations: string;
    nextSteps: string;
  };
  priority?: 'high' | 'medium' | 'low';
  templateName?: string;
}

// Email sending result
export interface EmailSendResult {
  success: boolean;
  deliveryId?: string;
  gmailMessageId?: string;
  error?: string;
  retryable?: boolean;
}

/**
 * Gmail Service class for handling email operations
 */
export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;
  private rateLimitQueue: Date[] = [];
  private config: Required<GmailServiceConfig>;

  constructor(config: GmailServiceConfig) {
    this.config = {
      maxRetries: 3,
      rateLimitRpm: RATE_LIMIT.requestsPerMinute,
      redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
      ...config
    };

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );

    // Initialize Gmail client
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Set OAuth2 credentials (from environment or user authorization)
   */
  setCredentials(credentials: any) {
    this.oauth2Client.setCredentials(credentials);
  }

  /**
   * Generate OAuth2 authorization URL for initial setup
   */
  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getAccessToken(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error exchanging authorization code:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Check rate limiting and wait if necessary
   */
  private async checkRateLimit(): Promise<void> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Remove requests older than 1 minute
    this.rateLimitQueue = this.rateLimitQueue.filter(date => date > oneMinuteAgo);

    // Check if we're at the limit
    if (this.rateLimitQueue.length >= this.config.rateLimitRpm) {
      const oldestRequest = this.rateLimitQueue[0];
      const waitTime = 60000 - (now.getTime() - oldestRequest.getTime()) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        console.log(`⏱️ Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Add current request to queue
    this.rateLimitQueue.push(now);
  }

  /**
   * Create base64url encoded email message
   */
  private createEmailMessage(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      textContent,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      htmlContent,
      '',
      `--${boundary}--`
    ].join('\n');

    return Buffer.from(message).toString('base64url');
  }

  /**
   * Send a single email via Gmail API
   */
  async sendEmail(request: SendEmailRequest): Promise<EmailSendResult> {
    let deliveryId: string | undefined;

    try {
      console.log(`📧 Starting email send for report ${request.reportId}`);
      
      // Create delivery record first
      deliveryId = await createEmailDeliveryRecord({
        reportId: request.reportId,
        userId: request.userId,
        recipientEmail: request.recipientEmail,
        subject: `Retroalimentación Semanal - ${request.feedbackData.subject}`,
        content: JSON.stringify(request.feedbackData),
        templateVersion: STUDENT_FEEDBACK_TEMPLATE.version,
        priority: request.priority || 'medium',
        instructorId: request.instructorId
      });

      // Update status to sending
      await updateEmailDeliveryStatus(deliveryId, 'sending');

      // Prepare template variables
      const templateVars: EmailTemplateVariables = {
        studentName: request.recipientName,
        studentId: request.userId, // In practice, get from user record
        instructorName: request.instructorName,
        subject: request.feedbackData.subject,
        weekStart: formatEmailDate(request.feedbackData.weekStart),
        weekEnd: formatEmailDate(request.feedbackData.weekEnd),
        progressScore: request.feedbackData.progressScore,
        feedbackContent: request.feedbackData.feedbackContent,
        achievements: request.feedbackData.achievements,
        improvements: request.feedbackData.improvements,
        recommendations: request.feedbackData.recommendations,
        nextSteps: request.feedbackData.nextSteps,
        platformUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
      };

      // Generate email content from template
      const subject = replaceTemplateVariables(STUDENT_FEEDBACK_TEMPLATE.subject, templateVars);
      const htmlContent = replaceTemplateVariables(STUDENT_FEEDBACK_TEMPLATE.htmlContent, templateVars);
      const textContent = replaceTemplateVariables(STUDENT_FEEDBACK_TEMPLATE.textContent, templateVars);

      // Check rate limiting
      await this.checkRateLimit();

      // Create Gmail message
      const encodedMessage = this.createEmailMessage(
        request.recipientEmail,
        subject,
        htmlContent,
        textContent
      );

      // Send via Gmail API
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      const gmailMessageId = response.data.id;
      const sentAt = new Date().toISOString();

      // Update delivery status to sent
      await updateEmailDeliveryStatus(deliveryId, 'sent', {
        gmailMessageId,
        sentAt,
        deliveredAt: sentAt // Assume delivered when Gmail accepts it
      });

      console.log(`✅ Email sent successfully: ${gmailMessageId}`);

      return {
        success: true,
        deliveryId,
        gmailMessageId
      };

    } catch (error: any) {
      console.error(`❌ Error sending email for report ${request.reportId}:`, error);
      
      const isRetryable = this.isRetryableError(error);
      const errorMessage = this.extractErrorMessage(error);

      if (deliveryId) {
        await updateEmailDeliveryStatus(deliveryId, 'failed', {
          failureReason: errorMessage
        });
      }

      return {
        success: false,
        deliveryId,
        error: errorMessage,
        retryable: isRetryable
      };
    }
  }

  /**
   * Process email queue with retry logic
   */
  async processEmailQueue(): Promise<void> {
    console.log('🔄 Processing email queue...');
    
    try {
      const pendingEmails = await getPendingEmailRetries(10);
      
      if (pendingEmails.length === 0) {
        console.log('📭 No pending emails to process');
        return;
      }

      console.log(`📧 Processing ${pendingEmails.length} pending emails`);

      for (const emailRecord of pendingEmails) {
        try {
          const feedbackData = JSON.parse(String(emailRecord.content));
          
          const request: SendEmailRequest = {
            reportId: String(emailRecord.reportId),
            userId: String(emailRecord.userId),
            recipientEmail: String(emailRecord.recipientEmail),
            recipientName: String(emailRecord.recipientName || 'Estudiante'),
            instructorId: String(emailRecord.instructorId),
            instructorName: 'Instructor', // Get from database
            feedbackData: feedbackData,
            priority: emailRecord.priority as any
          };

          const result = await this.sendEmail(request);

          if (!result.success && result.retryable) {
            await incrementEmailRetryCount(String(emailRecord.id));
            console.log(`🔄 Email ${emailRecord.id} will be retried later`);
          }

          // Add delay between emails to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Error processing email ${emailRecord.id}:`, error);
          await updateEmailDeliveryStatus(String(emailRecord.id), 'failed', {
            failureReason: `Processing error: ${error}`
          });
        }
      }

    } catch (error) {
      console.error('❌ Error processing email queue:', error);
    }
  }

  /**
   * Send bulk emails with queue management
   */
  async sendBulkEmails(requests: SendEmailRequest[]): Promise<EmailSendResult[]> {
    console.log(`📧 Starting bulk email send for ${requests.length} emails`);
    
    const results: EmailSendResult[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      console.log(`📧 Sending email ${i + 1}/${requests.length} for report ${request.reportId}`);
      
      try {
        const result = await this.sendEmail(request);
        results.push(result);
        
        // Add delay between emails for rate limiting
        if (i < requests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error: any) {
        console.error(`❌ Bulk email error for request ${i}:`, error);
        results.push({
          success: false,
          error: error.message,
          retryable: this.isRetryableError(error)
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Bulk email results: ${successCount}/${requests.length} successful`);
    
    return results;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors, rate limits, and temporary Google issues are retryable
    if (error.code) {
      const retryableCodes = [429, 500, 502, 503, 504];
      return retryableCodes.includes(error.code);
    }
    
    if (error.message) {
      const retryableMessages = [
        'rate limit',
        'timeout',
        'network',
        'connection',
        'temporary',
        'server error'
      ];
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      );
    }
    
    return false;
  }

  /**
   * Extract readable error message
   */
  private extractErrorMessage(error: any): string {
    if (error.message) return error.message;
    if (error.errors && error.errors.length > 0) {
      return error.errors[0].message;
    }
    return 'Unknown Gmail API error';
  }

  /**
   * Test Gmail connectivity and permissions
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      console.log('✅ Gmail API connection successful');
      return true;
    } catch (error) {
      console.error('❌ Gmail API connection failed:', error);
      return false;
    }
  }
}

/**
 * Create Gmail service instance with environment configuration
 */
export function createGmailService(): GmailService {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Gmail service configuration missing: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
  }
  
  const service = new GmailService({
    clientId,
    clientSecret,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
  });
  
  // Set up credentials from environment if available
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (refreshToken) {
    service.setCredentials({
      refresh_token: refreshToken
    });
  }
  
  return service;
}

/**
 * Singleton Gmail service instance
 */
let gmailServiceInstance: GmailService | null = null;

export function getGmailService(): GmailService {
  if (!gmailServiceInstance) {
    gmailServiceInstance = createGmailService();
  }
  return gmailServiceInstance;
}

/**
 * Background queue processor (for use in API routes or scheduled jobs)
 */
export async function processEmailQueueBackground(): Promise<void> {
  try {
    const service = getGmailService();
    await service.processEmailQueue();
  } catch (error) {
    console.error('❌ Background email queue processing failed:', error);
  }
}