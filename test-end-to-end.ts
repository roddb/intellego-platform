/**
 * Test End-to-End con Reporte Real
 *
 * Este test valida:
 * 1. getProgressReportAnswers() funciona con DB real
 * 2. analyzer.analyzeAnswers() funciona con datos reales
 * 3. createAIFeedback() guarda correctamente en DB
 * 4. Flujo completo sin errores
 */

import dotenv from 'dotenv';
dotenv.config();

import analyzer from './src/services/ai/claude/analyzer';
import {
  getProgressReportAnswers,
  getProgressReportWithStudent,
  createAIFeedback
} from './src/lib/db-operations';

// Reporte real de la base de datos
const TEST_REPORT_ID = 'e846955c-5410-40de-9f31-95d383dcb1ca';  // Mariana Donzelli - Química
const TEST_INSTRUCTOR_ID = 'test-instructor-id';  // ID ficticio para el test

async function testEndToEnd() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST END-TO-END CON REPORTE REAL');
  console.log('='.repeat(70) + '\n');

  const startTime = Date.now();

  try {
    // ============================================================
    // PASO 1: Obtener información del reporte
    // ============================================================
    console.log('📋 PASO 1: Obteniendo información del reporte...\n');

    const progressReport = await getProgressReportWithStudent(TEST_REPORT_ID);

    if (!progressReport) {
      throw new Error(`Reporte ${TEST_REPORT_ID} no encontrado en DB`);
    }

    console.log('✅ Reporte encontrado:');
    console.log('   Student: ' + progressReport.studentName);
    console.log('   Subject: ' + progressReport.subject);
    console.log('   Week: ' + progressReport.weekStart);
    console.log('   Student ID: ' + progressReport.studentId);
    console.log('');

    // ============================================================
    // PASO 2: Obtener respuestas del estudiante
    // ============================================================
    console.log('📝 PASO 2: Obteniendo respuestas del estudiante...\n');

    const answers = await getProgressReportAnswers(TEST_REPORT_ID);

    if (answers.length === 0) {
      throw new Error('No se encontraron respuestas para este reporte');
    }

    console.log(`✅ ${answers.length} respuestas encontradas:`);
    answers.forEach((answer, idx) => {
      console.log(`   ${idx + 1}. ${answer.questionText}`);
      console.log(`      → ${answer.answer.substring(0, 80)}${answer.answer.length > 80 ? '...' : ''}`);
    });
    console.log('');

    // ============================================================
    // PASO 3: Ejecutar análisis con Claude
    // ============================================================
    console.log('🤖 PASO 3: Analizando con Claude Haiku 4.5...\n');

    const analysisResult = await analyzer.analyzeAnswers(
      answers,
      progressReport.subject,
      1,  // Fase 1 para prueba
      'structured'
    );

    console.log('✅ Análisis completado:');
    console.log('   Score: ' + analysisResult.score + '/100');
    console.log('   Comprehension: ' + analysisResult.skillsMetrics.comprehension + '/100');
    console.log('   Critical Thinking: ' + analysisResult.skillsMetrics.criticalThinking + '/100');
    console.log('   Self Regulation: ' + analysisResult.skillsMetrics.selfRegulation + '/100');
    console.log('   Practical Application: ' + analysisResult.skillsMetrics.practicalApplication + '/100');
    console.log('   Metacognition: ' + analysisResult.skillsMetrics.metacognition + '/100');
    console.log('');

    // ============================================================
    // PASO 4: Guardar feedback en base de datos
    // ============================================================
    console.log('💾 PASO 4: Guardando feedback en base de datos...\n');

    const feedbackResult = await createAIFeedback({
      studentId: progressReport.studentId,
      progressReportId: TEST_REPORT_ID,
      weekStart: progressReport.weekStart,
      subject: progressReport.subject,
      score: analysisResult.score,
      generalComments: analysisResult.generalComments,
      strengths: analysisResult.strengths,
      improvements: analysisResult.improvements,
      aiAnalysis: analysisResult.rawAnalysis,
      skillsMetrics: analysisResult.skillsMetrics,
      createdBy: TEST_INSTRUCTOR_ID
    });

    console.log('✅ Feedback guardado exitosamente:');
    console.log('   Feedback ID: ' + feedbackResult.id);
    console.log('   Created At: ' + feedbackResult.createdAt);
    console.log('');

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    const totalTime = Date.now() - startTime;

    console.log('='.repeat(70));
    console.log('✅ TEST END-TO-END EXITOSO');
    console.log('='.repeat(70) + '\n');

    console.log('📊 RESUMEN:');
    console.log('   Estudiante: ' + progressReport.studentName);
    console.log('   Materia: ' + progressReport.subject);
    console.log('   Respuestas analizadas: ' + answers.length);
    console.log('   Puntaje asignado: ' + analysisResult.score + '/100');
    console.log('   Feedback ID: ' + feedbackResult.id);
    console.log('   Tiempo total: ' + totalTime + 'ms');
    console.log('');

    console.log('💪 FORTALEZAS IDENTIFICADAS:');
    console.log(analysisResult.strengths);
    console.log('');

    console.log('🎯 ÁREAS DE MEJORA:');
    console.log(analysisResult.improvements);
    console.log('');

    console.log('📝 COMENTARIOS GENERALES:');
    console.log(analysisResult.generalComments);
    console.log('');

    console.log('='.repeat(70));
    console.log('🎉 VALIDACIONES COMPLETADAS:');
    console.log('='.repeat(70));
    console.log('   ✅ DB Operations: getProgressReportWithStudent()');
    console.log('   ✅ DB Operations: getProgressReportAnswers()');
    console.log('   ✅ Analyzer: analyzeAnswers() con datos reales');
    console.log('   ✅ DB Operations: createAIFeedback()');
    console.log('   ✅ Flujo completo sin errores');
    console.log('');

    console.log('🚀 SIGUIENTE PASO: Continuar con Fase 3 (Prompt Caching + Rúbricas)');
    console.log('');

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(70));
    console.log('❌ TEST END-TO-END FALLÓ');
    console.log('='.repeat(70) + '\n');

    console.log('🔴 ERROR:');
    console.log('   Mensaje: ' + error.message);
    console.log('   Tiempo: ' + totalTime + 'ms');
    console.log('');

    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
    }

    console.log('\n💡 TROUBLESHOOTING:');
    console.log('   - Verificar que la DB esté accesible');
    console.log('   - Verificar que el reporte ID existe');
    console.log('   - Verificar API Key de Anthropic');
    console.log('   - Revisar logs de errores arriba');
    console.log('');

    process.exit(1);
  }
}

// Ejecutar test
testEndToEnd().catch((error) => {
  console.error('\n❌ Error inesperado:', error.message);
  if (error.stack) {
    console.error('\nStack trace:', error.stack);
  }
  process.exit(1);
});
