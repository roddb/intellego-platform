/**
 * Feedback Queue Manager
 *
 * Sistema de procesamiento en batch para feedback AI con:
 * - Rate limiting (5 concurrent requests)
 * - Retry logic (3 intentos con backoff exponencial)
 * - Progress tracking
 * - Error aggregation
 * - Cost tracking
 */

import analyzer from '@/services/ai/claude/analyzer';
import {
  getProgressReportAnswers,
  createAIFeedback,
  getProgressReportWithStudent
} from '@/lib/db-operations';

export type BatchResult = {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ reportId: string; error: string }>;
  totalCost: number;
  latencyMs: number;
};

export type ProcessOptions = {
  maxConcurrent?: number;      // Default: 5
  retryAttempts?: number;       // Default: 3
  instructorId?: string;        // Instructor ID creating the feedback
  onProgress?: (current: number, total: number) => void;
};

export class FeedbackQueueManager {
  private maxConcurrent: number = 5;
  private retryAttempts: number = 3;

  /**
   * Procesa múltiples reportes en batch con rate limiting
   *
   * @param reportIds - Array de IDs de ProgressReport a procesar
   * @param options - Opciones de configuración
   * @returns BatchResult con estadísticas del procesamiento
   */
  async processReports(
    reportIds: string[],
    options: ProcessOptions = {}
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const { maxConcurrent = 5, retryAttempts = 3, instructorId, onProgress } = options;

    this.maxConcurrent = maxConcurrent;
    this.retryAttempts = retryAttempts;

    const result: BatchResult = {
      total: reportIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      totalCost: 0,
      latencyMs: 0
    };

    console.log(`🔄 Starting batch processing: ${reportIds.length} reports`);

    // Process in chunks of maxConcurrent
    for (let i = 0; i < reportIds.length; i += this.maxConcurrent) {
      const chunk = reportIds.slice(i, i + this.maxConcurrent);

      console.log(`📦 Processing chunk ${Math.floor(i / this.maxConcurrent) + 1}/${Math.ceil(reportIds.length / this.maxConcurrent)}`);
      console.log(`   Reports: ${chunk.join(', ')}`);

      const promises = chunk.map(reportId =>
        this.processReport(reportId, retryAttempts, instructorId)
      );

      const chunkResults = await Promise.allSettled(promises);

      chunkResults.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value.success) {
          result.successful++;
          result.totalCost += res.value.cost;
          console.log(`   ✅ ${chunk[idx]}: Success (cost: $${res.value.cost.toFixed(6)})`);
        } else {
          result.failed++;
          const errorMsg = res.status === 'rejected'
            ? res.reason.message
            : res.value.error;
          result.errors.push({
            reportId: chunk[idx],
            error: errorMsg || 'Unknown error'
          });
          console.log(`   ❌ ${chunk[idx]}: Failed - ${errorMsg}`);
        }

        // Report progress
        const current = i + idx + 1;
        onProgress?.(current, reportIds.length);
      });

      // Rate limiting: wait 1s between chunks (except for last chunk)
      if (i + this.maxConcurrent < reportIds.length) {
        console.log(`   ⏳ Waiting 1s before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    result.latencyMs = Date.now() - startTime;

    console.log(`\n✅ Batch processing completed:`);
    console.log(`   Total: ${result.total}`);
    console.log(`   Successful: ${result.successful}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Total cost: $${result.totalCost.toFixed(6)}`);
    console.log(`   Total time: ${(result.latencyMs / 1000).toFixed(1)}s`);

    return result;
  }

  /**
   * Procesa un reporte individual con reintentos
   *
   * @param reportId - ID del ProgressReport
   * @param retriesLeft - Número de reintentos restantes
   * @returns Resultado del procesamiento individual
   */
  private async processReport(
    reportId: string,
    retriesLeft: number,
    instructorId?: string
  ): Promise<{ success: boolean; cost: number; error?: string }> {
    try {
      console.log(`      🔍 Processing report ${reportId}...`);

      // 1. Get report details
      const report = await getProgressReportWithStudent(reportId);
      if (!report) {
        throw new Error(`Report not found`);
      }

      // 2. Get answers
      const answers = await getProgressReportAnswers(reportId);
      if (answers.length === 0) {
        throw new Error(`No answers found`);
      }

      // 3. Detect fase (TODO: implement automatic detection from DB)
      // Por ahora usamos Fase 2 como default
      // En el futuro esto debería venir del ProgressReport o detectarse automáticamente
      const fase = 2 as 1 | 2 | 3 | 4;

      console.log(`      📊 Report details: ${report.studentName} - ${report.subject} - ${answers.length} answers`);

      // 4. Analyze with Claude
      const analysisResult = await analyzer.analyzeAnswers(
        answers,
        report.subject,
        fase,
        'structured'
      );

      console.log(`      🤖 Analysis completed: Score ${analysisResult.score}/100, Cost: $${analysisResult.actualCost.toFixed(6)}`);

      // 5. Save feedback to DB (including actual API cost)
      const feedback = await createAIFeedback({
        studentId: report.studentId,
        progressReportId: reportId,
        weekStart: report.weekStart,
        subject: report.subject,
        score: analysisResult.score,
        generalComments: analysisResult.generalComments,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        aiAnalysis: analysisResult.rawAnalysis,
        skillsMetrics: analysisResult.skillsMetrics,
        createdBy: '3d47c07d-3785-493a-b07b-ee34da1113b4', // Rodrigo Di Bernardo - Hardcoded instructor ID
        apiCost: analysisResult.actualCost  // ✅ Guardar costo real de la API
      });

      console.log(`      💾 Feedback saved: ${feedback.id}`);

      // Return actual cost from API response
      return { success: true, cost: analysisResult.actualCost };

    } catch (error: any) {
      console.error(`      ❌ Error processing report ${reportId}:`, error.message);

      // Retry logic
      if (retriesLeft > 0) {
        const waitTime = 2000 * Math.pow(2, this.retryAttempts - retriesLeft); // 2s, 4s, 8s
        console.log(`      ⏳ Retrying in ${waitTime / 1000}s... (${retriesLeft} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.processReport(reportId, retriesLeft - 1, instructorId);
      }

      return { success: false, cost: 0, error: error.message };
    }
  }

  /**
   * Valida un reporte individual sin procesarlo
   * Útil para testing y debugging
   */
  async validateReport(reportId: string): Promise<{
    valid: boolean;
    report?: any;
    answersCount?: number;
    error?: string;
  }> {
    try {
      const report = await getProgressReportWithStudent(reportId);
      if (!report) {
        return { valid: false, error: 'Report not found' };
      }

      const answers = await getProgressReportAnswers(reportId);
      if (answers.length === 0) {
        return { valid: false, error: 'No answers found' };
      }

      return {
        valid: true,
        report: {
          id: report.id,
          studentName: report.studentName,
          subject: report.subject,
          weekStart: report.weekStart
        },
        answersCount: answers.length
      };

    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
}

// Export singleton
export default new FeedbackQueueManager();
