import { NextRequest, NextResponse } from 'next/server';
import queueManager from '@/services/ai/feedback-queue-manager';
import { getPendingReportsForFeedback } from '@/lib/db-operations';
import { sendBatchResultEmail } from '@/lib/email-notifications';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes (Vercel free tier limit)

/**
 * GET /api/cron/auto-feedback
 *
 * Cron job que se ejecuta automáticamente cada noche (2:00 AM ART)
 * para generar feedback AI de todos los reportes semanales pendientes
 *
 * Configurado en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/auto-feedback",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 *
 * Seguridad:
 * - Requiere CRON_SECRET en Authorization header
 * - Solo accesible desde Vercel Cron Scheduler
 *
 * Flujo:
 * 1. Verificar autenticación (CRON_SECRET)
 * 2. Obtener reportes pendientes
 * 3. Procesar en batch con rate limiting
 * 4. Enviar email con resultados
 * 5. Retornar resumen
 *
 * Response:
 * {
 *   "success": true,
 *   "result": {
 *     "total": 47,
 *     "successful": 45,
 *     "failed": 2,
 *     "failedReports": ["id1", "id2"],
 *     "totalCost": 0.235,
 *     "totalTimeMs": 127340
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. VERIFICACIÓN DE SEGURIDAD
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Validar que el secret está configurado
    if (!cronSecret) {
      console.error('🚨 CRITICAL: CRON_SECRET not configured in environment variables');
      return NextResponse.json(
        {
          error: 'Server misconfiguration',
          message: 'CRON_SECRET not configured'
        },
        { status: 500 }
      );
    }

    // Validar autenticación
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('⚠️ Unauthorized cron attempt', {
        hasAuthHeader: !!authHeader,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('\n' + '='.repeat(80));
    console.log('🤖 AUTO-FEEDBACK CRON JOB STARTED');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'full',
      timeStyle: 'long'
    })}`);
    console.log('Trigger: Vercel Cron Scheduler');
    console.log('='.repeat(80) + '\n');

    // ========================================================================
    // 2. OBTENER REPORTES PENDIENTES
    // ========================================================================
    console.log('📊 Step 1: Getting pending reports...\n');

    const pendingReports = await getPendingReportsForFeedback();

    console.log(`Found ${pendingReports.length} pending reports`);

    if (pendingReports.length === 0) {
      console.log('✅ No pending reports to process');
      console.log('   System is up to date - all reports have feedback\n');

      // Send notification (success with 0 reports)
      await sendBatchResultEmail({
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
        totalCost: 0,
        latencyMs: Date.now() - startTime,
        triggeredBy: 'cron'
      });

      return NextResponse.json({
        success: true,
        message: 'No pending reports',
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Mostrar distribución por materia
    const bySubject = pendingReports.reduce((acc, r) => {
      acc[r.subject] = (acc[r.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Distribution by subject:');
    Object.entries(bySubject).forEach(([subject, count]) => {
      console.log(`  ${subject}: ${count} reports`);
    });
    console.log('');

    // ========================================================================
    // 3. PROCESAR REPORTES CON BATCH QUEUE MANAGER
    // ========================================================================
    console.log('🤖 Step 2: Processing reports with AI...\n');
    console.log('Configuration:');
    console.log('  Max concurrent: 5');
    console.log('  Retry attempts: 3');
    console.log('  Rate limiting: 1s between chunks');
    console.log('');

    const result = await queueManager.processReports(
      pendingReports.map(r => r.id),
      {
        maxConcurrent: 5,
        retryAttempts: 3,
        onProgress: (current, total) => {
          // Log progress every 10 reports
          if (current % 10 === 0 || current === total) {
            console.log(`⏳ Progress: ${current}/${total} (${Math.round((current / total) * 100)}%)`);
          }
        }
      }
    );

    const totalTime = Date.now() - startTime;

    // ========================================================================
    // 4. LOGGING DE RESULTADOS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('✅ AUTO-FEEDBACK CRON JOB COMPLETED');
    console.log('='.repeat(80));
    console.log('\nResults:');
    console.log(`  Total: ${result.total}`);
    console.log(`  ✅ Successful: ${result.successful}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    console.log(`  Success rate: ${((result.successful / result.total) * 100).toFixed(1)}%`);
    console.log('\nMetrics:');
    console.log(`  💰 Total cost: $${result.totalCost.toFixed(4)}`);
    console.log(`  💵 Avg cost: $${(result.totalCost / result.total).toFixed(6)}/report`);
    console.log(`  ⏱️ Total time: ${(totalTime / 1000).toFixed(1)}s (${(totalTime / 1000 / 60).toFixed(1)} min)`);
    console.log(`  ⚡ Avg time: ${(totalTime / result.total / 1000).toFixed(1)}s/report`);

    if (result.failed > 0) {
      console.log('\n⚠️ Failed reports:');
      result.errors.forEach((e, idx) => {
        console.log(`  ${idx + 1}. ${e.reportId}: ${e.error}`);
      });
    }

    console.log('='.repeat(80) + '\n');

    // ========================================================================
    // 5. ENVIAR NOTIFICACIÓN POR EMAIL
    // ========================================================================
    console.log('📧 Step 3: Sending email notification...\n');

    await sendBatchResultEmail({
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      errors: result.errors,
      totalCost: result.totalCost,
      latencyMs: result.latencyMs,
      triggeredBy: 'cron'
    });

    // ========================================================================
    // 6. RETORNAR RESPUESTA
    // ========================================================================
    return NextResponse.json({
      success: true,
      result: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        failedReports: result.errors.map(e => e.reportId),
        totalCost: result.totalCost,
        totalTimeMs: totalTime
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('\n' + '='.repeat(80));
    console.error('❌ ERROR IN AUTO-FEEDBACK CRON JOB');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Time elapsed:', `${totalTime}ms`);
    console.error('='.repeat(80) + '\n');

    // Send critical error notification
    await sendBatchResultEmail({
      total: 0,
      successful: 0,
      failed: 0,
      errors: [{ reportId: 'SYSTEM', error: error.message }],
      totalCost: 0,
      latencyMs: totalTime,
      triggeredBy: 'cron',
      criticalError: true
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
