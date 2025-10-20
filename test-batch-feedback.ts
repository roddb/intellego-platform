/**
 * Test de Batch Feedback Processing
 *
 * Valida el sistema completo de procesamiento en batch:
 * - getPendingReportsForFeedback()
 * - FeedbackQueueManager.processReports()
 * - Rate limiting y retry logic
 * - Error handling
 * - Cost tracking
 */

import dotenv from 'dotenv';
dotenv.config();

import { getPendingReportsForFeedback, countPendingReportsBySubject } from './src/lib/db-operations';
import queueManager from './src/services/ai/feedback-queue-manager';

console.log('🧪 Test de Batch Feedback Processing\n');
console.log('=' .repeat(80));

async function testBatchProcessing() {
  try {
    // ========================================================================
    // PASO 1: Verificar reportes pendientes
    // ========================================================================
    console.log('\n📊 PASO 1: Verificando reportes pendientes...\n');

    const counts = await countPendingReportsBySubject();
    console.log('Reportes sin feedback:');
    console.log(`  Física: ${counts.Física}`);
    console.log(`  Química: ${counts.Química}`);
    console.log(`  Total: ${counts.total}`);

    if (counts.total === 0) {
      console.log('\n⚠️ No hay reportes pendientes para testear');
      console.log('💡 Tip: Puedes crear reportes de prueba o usar un reporte existente sin feedback');
      return;
    }

    // ========================================================================
    // PASO 2: Obtener reportes pendientes (límite 3 para testing)
    // ========================================================================
    console.log('\n📋 PASO 2: Obteniendo reportes pendientes (límite: 3)...\n');

    const pendingReports = await getPendingReportsForFeedback({ limit: 3 });
    console.log(`Reportes a procesar: ${pendingReports.length}`);

    if (pendingReports.length === 0) {
      console.log('⚠️ No se encontraron reportes pendientes');
      return;
    }

    pendingReports.forEach((report, idx) => {
      console.log(`  ${idx + 1}. ${report.id}`);
      console.log(`     Materia: ${report.subject}`);
      console.log(`     Semana: ${report.weekStart}`);
      console.log(`     Enviado: ${report.submittedAt}`);
    });

    // ========================================================================
    // PASO 3: Validar reportes antes de procesar
    // ========================================================================
    console.log('\n🔍 PASO 3: Validando reportes...\n');

    for (const report of pendingReports) {
      const validation = await queueManager.validateReport(report.id);
      if (validation.valid) {
        console.log(`  ✅ ${report.id}: Válido (${validation.answersCount} respuestas)`);
      } else {
        console.log(`  ❌ ${report.id}: Inválido - ${validation.error}`);
      }
    }

    // ========================================================================
    // PASO 4: Procesar reportes con queue manager
    // ========================================================================
    console.log('\n🤖 PASO 4: Procesando reportes con AI...\n');
    console.log('Configuración:');
    console.log('  - Max concurrent: 2 (para testing)');
    console.log('  - Retry attempts: 3');
    console.log('  - Progress tracking: Enabled');
    console.log('\nIniciando procesamiento...\n');

    const result = await queueManager.processReports(
      pendingReports.map(r => r.id),
      {
        maxConcurrent: 2,  // Menos concurrencia para testing
        retryAttempts: 3,
        onProgress: (current, total) => {
          const percentage = Math.round((current / total) * 100);
          console.log(`\n⏳ Progreso: ${current}/${total} (${percentage}%)`);
        }
      }
    );

    // ========================================================================
    // PASO 5: Mostrar resultados
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('✅ RESULTADOS DEL BATCH PROCESSING');
    console.log('='.repeat(80));

    console.log('\n📊 Estadísticas:');
    console.log(`  Total reportes: ${result.total}`);
    console.log(`  ✅ Exitosos: ${result.successful}`);
    console.log(`  ❌ Fallidos: ${result.failed}`);
    console.log(`  Tasa de éxito: ${((result.successful / result.total) * 100).toFixed(1)}%`);

    console.log('\n💰 Costos:');
    console.log(`  Total: $${result.totalCost.toFixed(6)}`);
    console.log(`  Promedio por reporte: $${(result.totalCost / result.total).toFixed(6)}`);
    console.log(`  Estimado para ${counts.total} reportes: $${(counts.total * (result.totalCost / result.total)).toFixed(2)}`);

    console.log('\n⏱️ Performance:');
    console.log(`  Tiempo total: ${(result.latencyMs / 1000).toFixed(1)}s`);
    console.log(`  Promedio por reporte: ${(result.latencyMs / result.total / 1000).toFixed(1)}s`);
    console.log(`  Throughput: ${(result.total / (result.latencyMs / 1000)).toFixed(2)} reportes/seg`);

    if (result.failed > 0) {
      console.log('\n❌ ERRORES:');
      result.errors.forEach((error, idx) => {
        console.log(`  ${idx + 1}. Reporte ${error.reportId}:`);
        console.log(`     Error: ${error.error}`);
      });
    }

    // ========================================================================
    // PASO 6: Validaciones automáticas
    // ========================================================================
    console.log('\n🔍 VALIDACIONES AUTOMÁTICAS:');

    const validations = [];

    // Validación 1: Total matches
    if (result.successful + result.failed === result.total) {
      validations.push('✅ Total count correcto (successful + failed = total)');
    } else {
      validations.push('❌ Total count incorrecto');
    }

    // Validación 2: Tasa de éxito
    const successRate = (result.successful / result.total) * 100;
    if (successRate >= 90) {
      validations.push(`✅ Tasa de éxito aceptable (${successRate.toFixed(1)}% >= 90%)`);
    } else if (successRate >= 70) {
      validations.push(`⚠️ Tasa de éxito media (${successRate.toFixed(1)}%)`);
    } else {
      validations.push(`❌ Tasa de éxito baja (${successRate.toFixed(1)}% < 70%)`);
    }

    // Validación 3: Costo por reporte
    const avgCost = result.totalCost / result.total;
    if (avgCost <= 0.015) {
      validations.push(`✅ Costo promedio aceptable ($${avgCost.toFixed(6)} <= $0.015)`);
    } else {
      validations.push(`⚠️ Costo promedio elevado ($${avgCost.toFixed(6)} > $0.015)`);
    }

    // Validación 4: Latencia
    const avgLatency = result.latencyMs / result.total / 1000;
    if (avgLatency <= 10) {
      validations.push(`✅ Latencia aceptable (${avgLatency.toFixed(1)}s <= 10s)`);
    } else {
      validations.push(`⚠️ Latencia elevada (${avgLatency.toFixed(1)}s > 10s)`);
    }

    // Validación 5: Total time
    if (result.latencyMs < 300000) { // < 5 min
      validations.push(`✅ Tiempo total aceptable (${(result.latencyMs / 1000).toFixed(1)}s < 5 min)`);
    } else {
      validations.push(`⚠️ Tiempo total elevado (${(result.latencyMs / 1000 / 60).toFixed(1)} min)`);
    }

    validations.forEach(v => console.log(`  ${v}`));

    // ========================================================================
    // PASO 7: Resumen y recomendaciones
    // ========================================================================
    console.log('\n' + '='.repeat(80));

    const allPassed = validations.every(v => v.startsWith('  ✅'));

    if (allPassed) {
      console.log('🎉 TODAS LAS VALIDACIONES PASARON');
      console.log('\n✅ El sistema de batch processing está listo para producción');
      console.log('\n📋 Próximos pasos:');
      console.log('  1. Implementar UI component (BatchFeedbackGenerator)');
      console.log('  2. Implementar cron job nocturno (/api/cron/auto-feedback)');
      console.log('  3. Testing con volumen mayor (50-100 reportes)');
      console.log('  4. Deploy a staging para validación');
    } else {
      console.log('⚠️ ALGUNAS VALIDACIONES FALLARON');
      console.log('\n📋 Revisar:');
      if (successRate < 90) {
        console.log('  - Tasa de éxito baja: Revisar logs de errores');
      }
      if (avgCost > 0.015) {
        console.log('  - Costo elevado: Verificar prompt caching');
      }
      if (avgLatency > 10) {
        console.log('  - Latencia alta: Considerar ajustar timeout');
      }
    }

    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// ============================================================================
// EJECUTAR TEST
// ============================================================================

testBatchProcessing()
  .then(() => {
    console.log('\n✅ Test completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ El test falló:', error);
    process.exit(1);
  });
