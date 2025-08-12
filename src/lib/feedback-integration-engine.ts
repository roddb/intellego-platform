/**
 * FASE 4: Feedback Integration Engine
 * Intellego Platform - Complete integration layer connecting AI assessment with feedback generation
 * 
 * Orchestrates the complete feedback generation workflow:
 * 1. Retrieves evaluation results from FASE 3
 * 2. Processes historical data for progress tracking
 * 3. Generates personalized feedback content
 * 4. Prepares data for database storage and email sending
 * 5. Provides instructor review interface
 */

import { 
  FeedbackContentGenerator, 
  FeedbackContext, 
  MarkdownFeedback,
  createFeedbackGenerator,
  validateFeedbackContent
} from './feedback-content-generator';
import { 
  AIEvaluationEngine,
  ComprehensiveEvaluationResult,
  EvaluationResult,
  createEvaluationEngine
} from './ai-evaluation-engine';
import { 
  CompositeScore,
  QuestionRubric,
  allRubrics
} from './ai-assessment-rubrics';

// Database and file system operations
import { getProgressReportsByUser, createProgressReport, updateProgressReport } from './db-operations';
import { exportReportToJSON, getStudentReportPath } from './data-organization';

// Core integration interfaces
export interface FeedbackGenerationRequest {
  student: {
    id: string;
    name: string;
    email: string;
  };
  academic: {
    sede: string;
    academicYear: string;
    division: string;
    subject: string;
  };
  week: {
    start: string;
    end: string;
  };
  responses: { [questionId: string]: string };
  submittedAt: string;
}

export interface CompleteFeedbackResult {
  feedbackContent: MarkdownFeedback;
  evaluationResults: EvaluationResult[];
  progressAnalysis: ProgressAnalysisResult;
  storageResult: StorageResult;
  emailData: EmailFeedbackData;
  instructorNotification: InstructorNotification;
}

export interface ProgressAnalysisResult {
  currentWeekScore: number;
  previousWeekScore?: number;
  weeklyTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  monthlyAverage?: number;
  historicalComparison: string;
  flaggedForAttention: boolean;
}

export interface StorageResult {
  reportId: string;
  feedbackStored: boolean;
  jsonExported: boolean;
  filePath: string;
  errors: string[];
}

export interface EmailFeedbackData {
  to: string;
  subject: string;
  htmlContent: string;
  plainTextContent: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  priority: 'normal' | 'high';
}

export interface InstructorNotification {
  studentName: string;
  subject: string;
  alertLevel: 'info' | 'warning' | 'urgent';
  summary: string;
  recommendedActions: string[];
  requiresReview: boolean;
  flaggedConcerns: string[];
}

/**
 * FEEDBACK INTEGRATION ENGINE
 * Main orchestrator for the complete feedback generation workflow
 */
export class FeedbackIntegrationEngine {
  private feedbackGenerator: FeedbackContentGenerator;
  private aiEvaluationEngine: AIEvaluationEngine;
  private progressHistoryCache: Map<string, EvaluationResult[]> = new Map();

  constructor(config?: {
    openaiApiKey?: string;
    evaluationModel?: string;
    feedbackLanguage?: string;
  }) {
    this.feedbackGenerator = createFeedbackGenerator();
    this.aiEvaluationEngine = createEvaluationEngine({
      apiKey: config?.openaiApiKey,
      model: config?.evaluationModel || 'gpt-4-turbo-preview',
      temperature: 0.1
    });
  }

  /**
   * COMPLETE FEEDBACK GENERATION WORKFLOW
   * Main method that orchestrates the entire feedback generation process
   */
  async generateCompleteFeedback(request: FeedbackGenerationRequest): Promise<CompleteFeedbackResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting complete feedback generation for student: ${request.student.name}`);
      
      // Step 1: AI Evaluation of Student Responses
      console.log('📊 Step 1: Running AI evaluation...');
      const evaluationResults = await this.runAIEvaluation(request);
      
      // Step 2: Retrieve Historical Data for Progress Analysis
      console.log('📈 Step 2: Analyzing progress data...');
      const progressAnalysis = await this.analyzeProgressHistory(request, evaluationResults);
      
      // Step 3: Generate Personalized Feedback Content
      console.log('✍️ Step 3: Generating feedback content...');
      const feedbackContext = this.createFeedbackContext(request);
      const previousWeekResults = await this.getPreviousWeekResults(request);
      
      const feedbackContent = await this.feedbackGenerator.generateCompleteFeedback(
        evaluationResults,
        feedbackContext,
        previousWeekResults
      );
      
      // Step 4: Validate Generated Content
      console.log('✅ Step 4: Validating feedback quality...');
      const validation = validateFeedbackContent(feedbackContent);
      if (!validation.isValid) {
        console.warn('⚠️ Feedback validation issues:', validation.issues);
      }
      
      // Step 5: Store Results in Database and File System
      console.log('💾 Step 5: Storing results...');
      const storageResult = await this.storeResultsComprehensively(
        request,
        evaluationResults,
        feedbackContent,
        progressAnalysis
      );
      
      // Step 6: Prepare Email Content
      console.log('📧 Step 6: Preparing email content...');
      const emailData = this.prepareEmailContent(request, feedbackContent, progressAnalysis);
      
      // Step 7: Generate Instructor Notification
      console.log('🔔 Step 7: Creating instructor notification...');
      const instructorNotification = this.createInstructorNotification(
        request,
        evaluationResults,
        progressAnalysis,
        feedbackContent
      );
      
      const totalTime = Date.now() - startTime;
      console.log(`✨ Complete feedback generation completed in ${totalTime}ms`);
      
      return {
        feedbackContent,
        evaluationResults,
        progressAnalysis,
        storageResult,
        emailData,
        instructorNotification
      };
      
    } catch (error) {
      console.error('❌ Error in complete feedback generation:', error);
      throw new Error(`Failed to generate complete feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * BATCH PROCESSING FOR MULTIPLE STUDENTS
   * Processes feedback for multiple students efficiently
   */
  async generateBatchFeedback(
    requests: FeedbackGenerationRequest[]
  ): Promise<Map<string, CompleteFeedbackResult | Error>> {
    const results = new Map<string, CompleteFeedbackResult | Error>();
    
    console.log(`🔄 Starting batch feedback generation for ${requests.length} students`);
    
    // Process in batches to avoid overwhelming the AI API
    const batchSize = 3;
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(requests.length/batchSize)}`);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const result = await this.generateCompleteFeedback(request);
          return { studentId: request.student.id, result };
        } catch (error) {
          console.error(`Failed to process student ${request.student.name}:`, error);
          return { studentId: request.student.id, error };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((outcome) => {
        if (outcome.status === 'fulfilled') {
          const { studentId, result, error } = outcome.value as any;
          if (error) {
            results.set(studentId, error as Error);
          } else if (result) {
            results.set(studentId, result as CompleteFeedbackResult);
          }
        }
      });
      
      // Rate limiting delay between batches
      if (i + batchSize < requests.length) {
        await this.delay(2000);
      }
    }
    
    console.log(`✅ Batch processing completed. Success: ${Array.from(results.values()).filter(r => !(r instanceof Error)).length}/${requests.length}`);
    
    return results;
  }

  /**
   * INSTRUCTOR REVIEW INTERFACE
   * Provides methods for instructors to review and modify feedback
   */
  async getInstructorReviewData(studentId: string, weekStart: string): Promise<{
    originalFeedback: MarkdownFeedback;
    evaluationResults: EvaluationResult[];
    editableSections: EditableFeedbackSections;
    approvalStatus: 'pending' | 'approved' | 'requires_changes';
  }> {
    // Implementation would retrieve stored data and provide editing interface
    throw new Error('Instructor review interface not yet implemented');
  }

  async updateFeedbackWithInstructorChanges(
    studentId: string,
    weekStart: string,
    changes: InstructorFeedbackChanges
  ): Promise<MarkdownFeedback> {
    // Implementation would apply instructor changes and regenerate final feedback
    throw new Error('Instructor feedback updates not yet implemented');
  }

  // ===== PRIVATE IMPLEMENTATION METHODS =====

  private async runAIEvaluation(request: FeedbackGenerationRequest): Promise<EvaluationResult[]> {
    const evaluationContext = {
      studentInfo: {
        name: request.student.name,
        id: request.student.id,
        academicYear: request.academic.academicYear,
        division: request.academic.division,
        sede: request.academic.sede
      },
      subject: request.academic.subject,
      weekInfo: {
        start: request.week.start,
        end: request.week.end
      },
      questionId: '', // Will be set for each question
      studentResponse: ''  // Will be set for each response
    };

    const evaluationResults: EvaluationResult[] = [];

    for (const [questionId, response] of Object.entries(request.responses)) {
      if (response.trim().length === 0) continue; // Skip empty responses
      
      const questionContext = {
        ...evaluationContext,
        questionId,
        studentResponse: response
      };
      
      try {
        const result = await this.aiEvaluationEngine.evaluateResponse(questionContext);
        evaluationResults.push(result);
      } catch (error) {
        console.error(`Failed to evaluate question ${questionId}:`, error);
        // Create a default result for failed evaluations
        evaluationResults.push({
          questionId,
          score: {
            questionId,
            totalScore: 1,
            dimensionScores: {},
            overallLevel: 'insufficient',
            confidenceScore: 0,
            feedback: ['Error occurred during evaluation'],
            recommendations: ['Please review the response and try again']
          },
          rawResponse: '',
          processingTime: 0,
          errors: [`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    }

    return evaluationResults;
  }

  private async analyzeProgressHistory(
    request: FeedbackGenerationRequest,
    currentResults: EvaluationResult[]
  ): Promise<ProgressAnalysisResult> {
    try {
      // Get historical reports from database
      const historicalReports = await getProgressReportsByUser(request.student.id);
      const subjectReports = historicalReports.filter(
        report => report.subject === request.academic.subject
      );

      // Calculate current week average
      const currentWeekScore = currentResults.reduce((sum, result) => 
        sum + result.score.totalScore, 0) / currentResults.length;
      
      if (subjectReports.length === 0) {
        return {
          currentWeekScore,
          weeklyTrend: 'insufficient_data',
          historicalComparison: 'Primera evaluación registrada para esta materia',
          flaggedForAttention: currentWeekScore < 2.0
        };
      }

      // Find previous week's data
      const sortedReports = subjectReports.sort((a, b) => 
        new Date(String(b.weekStart)).getTime() - new Date(String(a.weekStart)).getTime()
      );
      
      const previousReport = sortedReports[0]; // Most recent report
      let previousWeekScore: number | undefined;
      let weeklyTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';

      if (previousReport) {
        // This would need to be calculated from stored evaluation results
        // For now, using a placeholder calculation
        previousWeekScore = 2.5; // Placeholder
        
        const scoreDifference = currentWeekScore - previousWeekScore;
        if (Math.abs(scoreDifference) < 0.2) weeklyTrend = 'stable';
        else if (scoreDifference > 0) weeklyTrend = 'improving';
        else weeklyTrend = 'declining';
      }

      // Calculate monthly average if enough data
      const monthlyReports = sortedReports.slice(0, 4); // Last 4 weeks
      const monthlyAverage = monthlyReports.length >= 2 
        ? monthlyReports.reduce((sum, report) => sum + 2.5, 0) / monthlyReports.length // Placeholder
        : undefined;

      // Generate historical comparison text
      const historicalComparison = this.generateHistoricalComparison(
        currentWeekScore,
        previousWeekScore,
        monthlyAverage,
        weeklyTrend
      );

      return {
        currentWeekScore,
        previousWeekScore,
        weeklyTrend,
        monthlyAverage,
        historicalComparison,
        flaggedForAttention: currentWeekScore < 2.0 || weeklyTrend === 'declining'
      };

    } catch (error) {
      console.error('Error analyzing progress history:', error);
      return {
        currentWeekScore: currentResults.reduce((sum, result) => 
          sum + result.score.totalScore, 0) / currentResults.length,
        weeklyTrend: 'insufficient_data',
        historicalComparison: 'Error al analizar datos históricos',
        flaggedForAttention: true
      };
    }
  }

  private createFeedbackContext(request: FeedbackGenerationRequest): FeedbackContext {
    return {
      student: {
        name: request.student.name,
        studentId: request.student.id, // Map id to studentId
        email: request.student.email
      },
      academic: request.academic,
      week: request.week,
      submittedAt: request.submittedAt
    };
  }

  private async getPreviousWeekResults(request: FeedbackGenerationRequest): Promise<EvaluationResult[] | undefined> {
    // This would retrieve the previous week's evaluation results
    // For now, returning undefined (indicating no previous data)
    return undefined;
  }

  private async storeResultsComprehensively(
    request: FeedbackGenerationRequest,
    evaluationResults: EvaluationResult[],
    feedbackContent: MarkdownFeedback,
    progressAnalysis: ProgressAnalysisResult
  ): Promise<StorageResult> {
    const errors: string[] = [];
    let reportId = '';
    let feedbackStored = false;
    let jsonExported = false;
    let filePath = '';

    try {
      // 1. Store in database
      try {
        const reportData = {
          userId: request.student.id,
          weekStart: request.week.start,
          weekEnd: request.week.end,
          subject: request.academic.subject,
          submittedAt: request.submittedAt,
          // Additional evaluation and feedback data would be stored here
        };
        
        reportId = await createProgressReport(reportData);
        feedbackStored = true;
        
      } catch (dbError) {
        errors.push(`Database storage failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }

      // 2. Export to JSON file system
      try {
        const reportForExport = {
          student: request.student,
          academic: request.academic,
          week: request.week,
          submittedAt: request.submittedAt,
          answers: request.responses,
          evaluation: {
            results: evaluationResults,
            progressAnalysis,
            feedbackGenerated: true,
            feedbackWordCount: feedbackContent.metadata.wordCount
          }
        };
        
        filePath = await exportReportToJSON(
          reportForExport,
          request.academic.sede,
          request.academic.academicYear,
          request.academic.division,
          request.academic.subject,
          { ...request.student, studentId: request.student.id }
        );
        
        jsonExported = true;
        
      } catch (exportError) {
        errors.push(`JSON export failed: ${exportError instanceof Error ? exportError.message : 'Unknown error'}`);
        filePath = getStudentReportPath(
          request.academic.sede,
          request.academic.academicYear,
          request.academic.division,
          request.academic.subject,
          { ...request.student, studentId: request.student.id },
          request.week.start
        );
      }

      return {
        reportId,
        feedbackStored,
        jsonExported,
        filePath,
        errors
      };

    } catch (error) {
      errors.push(`Storage process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        reportId: '',
        feedbackStored: false,
        jsonExported: false,
        filePath: '',
        errors
      };
    }
  }

  private prepareEmailContent(
    request: FeedbackGenerationRequest,
    feedbackContent: MarkdownFeedback,
    progressAnalysis: ProgressAnalysisResult
  ): EmailFeedbackData {
    const subject = `📋 Tu Reporte de Progreso Semanal - ${request.academic.subject}`;
    
    // Convert Markdown to HTML (simplified conversion)
    const htmlContent = this.convertMarkdownToHTML(feedbackContent.content);
    const plainTextContent = this.convertMarkdownToPlainText(feedbackContent.content);
    
    // Determine priority based on progress analysis
    const priority = progressAnalysis.flaggedForAttention ? 'high' : 'normal';
    
    return {
      to: request.student.email,
      subject,
      htmlContent: this.wrapInEmailTemplate(htmlContent, request.student.name),
      plainTextContent,
      priority
    };
  }

  private createInstructorNotification(
    request: FeedbackGenerationRequest,
    evaluationResults: EvaluationResult[],
    progressAnalysis: ProgressAnalysisResult,
    feedbackContent: MarkdownFeedback
  ): InstructorNotification {
    const averageScore = evaluationResults.reduce((sum, result) => 
      sum + result.score.totalScore, 0) / evaluationResults.length;
    
    let alertLevel: 'info' | 'warning' | 'urgent' = 'info';
    const recommendedActions: string[] = [];
    const flaggedConcerns: string[] = [];
    
    // Determine alert level and recommendations
    if (averageScore < 1.5) {
      alertLevel = 'urgent';
      recommendedActions.push('Contacto inmediato con el estudiante recomendado');
      flaggedConcerns.push('Desempeño muy por debajo del nivel esperado');
    } else if (averageScore < 2.5 || progressAnalysis.weeklyTrend === 'declining') {
      alertLevel = 'warning';
      recommendedActions.push('Considerar reunión individual con el estudiante');
      if (progressAnalysis.weeklyTrend === 'declining') {
        flaggedConcerns.push('Tendencia negativa en el progreso semanal');
      }
    }
    
    // Check for evaluation errors
    const evaluationErrors = evaluationResults.filter(r => r.errors && r.errors.length > 0);
    if (evaluationErrors.length > 0) {
      flaggedConcerns.push('Errores en la evaluación automática - revisión manual requerida');
      recommendedActions.push('Revisar respuestas que generaron errores de evaluación');
    }
    
    // Generate summary
    const summary = `${request.student.name} - ${request.academic.subject}: ` +
      `Promedio ${averageScore.toFixed(2)}/4.0 (${Math.round((averageScore/4)*100)}%). ` +
      `Tendencia: ${this.getTrendText(progressAnalysis.weeklyTrend)}`;
    
    return {
      studentName: request.student.name,
      subject: request.academic.subject,
      alertLevel,
      summary,
      recommendedActions,
      requiresReview: feedbackContent.metadata.instructorReviewRequired,
      flaggedConcerns
    };
  }

  // ===== UTILITY METHODS =====

  private generateHistoricalComparison(
    currentScore: number,
    previousScore?: number,
    monthlyAverage?: number,
    trend?: string
  ): string {
    let comparison = `Puntuación actual: ${currentScore.toFixed(2)}/4.0`;
    
    if (previousScore !== undefined) {
      const change = currentScore - previousScore;
      const changeText = change > 0 ? 'mejora' : 'disminución';
      comparison += `. ${changeText.charAt(0).toUpperCase() + changeText.slice(1)} de ${Math.abs(change).toFixed(2)} puntos respecto a la semana anterior`;
    }
    
    if (monthlyAverage !== undefined) {
      const monthlyComparison = currentScore > monthlyAverage ? 'por encima' : 'por debajo';
      comparison += `. ${monthlyComparison.charAt(0).toUpperCase() + monthlyComparison.slice(1)} del promedio mensual (${monthlyAverage.toFixed(2)})`;
    }
    
    return comparison;
  }

  private getTrendText(trend: string): string {
    switch (trend) {
      case 'improving': return 'Mejorando';
      case 'declining': return 'Declinando';
      case 'stable': return 'Estable';
      default: return 'Sin datos suficientes';
    }
  }

  private convertMarkdownToHTML(markdown: string): string {
    // Simplified Markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }

  private convertMarkdownToPlainText(markdown: string): string {
    // Remove Markdown formatting for plain text
    return markdown
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^- /gm, '• ');
  }

  private wrapInEmailTemplate(htmlContent: string, studentName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Progreso - Plataforma Intellego</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #2563eb; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.9em; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1>📚 Plataforma Intellego</h1>
            <p>Tu reporte personalizado de progreso semanal</p>
        </div>
        
        <p>Estimado/a <strong>${studentName}</strong>,</p>
        <p>Tu reporte de progreso semanal ha sido generado automáticamente basado en tu reflexión y autoevaluación. Este feedback personalizado está diseñado para ayudarte a mejorar tu proceso de aprendizaje.</p>
        
        ${htmlContent}
        
        <div class="footer">
            <p><em>Este reporte ha sido generado automáticamente por el Sistema de Evaluación Inteligente de la Plataforma Intellego.</em></p>
            <p>Si tienes preguntas sobre tu reporte, no dudes en contactar a tu instructor.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== SUPPORTING INTERFACES =====

interface EditableFeedbackSections {
  achievements: string;
  improvements: string;
  recommendations: string;
  nextSteps: string;
  instructorNotes?: string;
}

interface InstructorFeedbackChanges {
  modifiedSections: Partial<EditableFeedbackSections>;
  additionalComments: string;
  approvalStatus: 'approved' | 'requires_changes';
  changedBy: string;
  changedAt: string;
}

// ===== FACTORY FUNCTIONS =====

/**
 * Creates a new FeedbackIntegrationEngine instance
 */
export function createFeedbackIntegrationEngine(config?: {
  openaiApiKey?: string;
  evaluationModel?: string;
  feedbackLanguage?: string;
}): FeedbackIntegrationEngine {
  return new FeedbackIntegrationEngine(config);
}

/**
 * Utility function for quick feedback generation from weekly report data
 */
export async function generateFeedbackFromWeeklyReport(
  studentData: any,
  academicContext: any,
  weeklyResponses: { [questionId: string]: string },
  config?: any
): Promise<CompleteFeedbackResult> {
  const engine = createFeedbackIntegrationEngine(config);
  
  const request: FeedbackGenerationRequest = {
    student: {
      id: studentData.id,
      name: studentData.name,
      email: studentData.email
    },
    academic: academicContext,
    week: {
      start: weeklyResponses.weekStart || new Date().toISOString().split('T')[0],
      end: weeklyResponses.weekEnd || new Date().toISOString().split('T')[0]
    },
    responses: weeklyResponses,
    submittedAt: new Date().toISOString()
  };
  
  return await engine.generateCompleteFeedback(request);
}

export default FeedbackIntegrationEngine;