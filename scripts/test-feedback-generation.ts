/**
 * Script de testing para generar feedbacks reales
 * y validar que Fase 1 + Fase 2 funcionan correctamente
 *
 * Ejecutar:
 * npx ts-node scripts/test-feedback-generation.ts
 */

import analyzer from '../src/services/ai/claude/analyzer';
import { getProgressReportAnswers, getProgressReportWithStudent } from '../src/lib/db-operations';

// ID del reporte de prueba (Emma Bono - Física)
const TEST_REPORT_ID = '10f545f5-1007-4b28-960a-6231f5e3bd42';

async function testFeedbackGeneration() {
  console.log('🧪 TESTING: Generación de Feedback con Fase 1 + Fase 2\n');
  console.log('='.repeat(70));

  try {
    // 1. Obtener datos del reporte
    console.log('\n📊 Paso 1: Obteniendo datos del reporte...');
    const report = await getProgressReportWithStudent(TEST_REPORT_ID);

    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    console.log(`   ✅ Reporte encontrado: ${report.studentName} - ${report.subject}`);
    console.log(`   📅 Semana: ${report.weekStart}`);

    // 2. Obtener respuestas
    console.log('\n📝 Paso 2: Obteniendo respuestas del estudiante...');
    const answers = await getProgressReportAnswers(TEST_REPORT_ID);

    console.log(`   ✅ Respuestas encontradas: ${answers.length}`);

    if (answers.length === 0) {
      throw new Error('No hay respuestas para este reporte');
    }

    // Mostrar preview de respuestas
    answers.slice(0, 2).forEach((a, idx) => {
      console.log(`   Q${idx + 1}: ${a.questionText.substring(0, 60)}...`);
      console.log(`       R: ${a.answer.substring(0, 80)}...`);
    });

    // 3. Generar feedback con Claude Haiku
    console.log('\n🤖 Paso 3: Generando feedback con Claude Haiku...');
    console.log('   (Esto puede tardar 5-10 segundos)\n');

    const startTime = Date.now();
    const analysisResult = await analyzer.analyzeAnswers(
      answers,
      report.subject,
      2, // Fase 2 por defecto
      'structured'
    );
    const duration = Date.now() - startTime;

    console.log(`   ✅ Feedback generado en ${(duration / 1000).toFixed(1)}s`);
    console.log(`   💰 Costo: $${analysisResult.actualCost.toFixed(6)}`);

    // 4. Validar resultados (Fase 1: Parseo)
    console.log('\n' + '='.repeat(70));
    console.log('📊 VALIDACIÓN DE FASE 1: PARSEO ROBUSTO\n');

    const validations = {
      scoreValid: analysisResult.score >= 0 && analysisResult.score <= 100,
      strengthsNotEmpty: analysisResult.strengths !== 'No se identificaron fortalezas específicas.',
      improvementsNotEmpty: analysisResult.improvements !== 'No se identificaron áreas de mejora específicas.',
      generalCommentsNotEmpty: analysisResult.generalComments !== 'Continuar con el trabajo actual y buscar retroalimentación adicional.',
      strengthsCount: analysisResult.strengths.split('\n').filter(l => l.trim().length > 0).length,
      improvementsCount: analysisResult.improvements.split('\n').filter(l => l.trim().length > 0).length
    };

    console.log('✅ Score válido:', validations.scoreValid ? `${analysisResult.score}/100` : '❌ FALLO');
    console.log('✅ Fortalezas parseadas:', validations.strengthsNotEmpty ? 'SÍ' : '❌ FALLO');
    console.log('✅ Mejoras parseadas:', validations.improvementsNotEmpty ? 'SÍ' : '❌ FALLO');
    console.log('✅ Comentarios parseados:', validations.generalCommentsNotEmpty ? 'SÍ' : '❌ FALLO');
    console.log(`✅ Número de fortalezas: ${validations.strengthsCount} (esperado: ≤3)`);
    console.log(`✅ Número de mejoras: ${validations.improvementsCount} (esperado: ≤3)`);

    // 5. Validar Fase 2: Calidad del contenido
    console.log('\n' + '='.repeat(70));
    console.log('📊 VALIDACIÓN DE FASE 2: PROMPTS OPTIMIZADOS\n');

    console.log('📌 FORTALEZAS (máx 3):');
    console.log(analysisResult.strengths);
    console.log('');

    console.log('📌 MEJORAS (máx 3):');
    console.log(analysisResult.improvements);
    console.log('');

    console.log('📌 COMENTARIOS GENERALES:');
    console.log(analysisResult.generalComments);
    console.log('');

    console.log('📌 ANÁLISIS AI (primeras 200 chars):');
    console.log(analysisResult.rawAnalysis.substring(0, 200) + '...');

    // 6. Resumen de validación
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE VALIDACIÓN\n');

    const allValidationsPassed =
      validations.scoreValid &&
      validations.strengthsNotEmpty &&
      validations.improvementsNotEmpty &&
      validations.generalCommentsNotEmpty &&
      validations.strengthsCount <= 3 &&
      validations.improvementsCount <= 3;

    if (allValidationsPassed) {
      console.log('✅ TODAS LAS VALIDACIONES PASARON');
      console.log('');
      console.log('🎉 Fase 1 (Parseo) + Fase 2 (Prompts) funcionan correctamente!');
    } else {
      console.log('❌ ALGUNAS VALIDACIONES FALLARON');
      if (!validations.strengthsNotEmpty) console.log('   - Fortalezas quedaron vacías');
      if (!validations.improvementsNotEmpty) console.log('   - Mejoras quedaron vacías');
      if (!validations.generalCommentsNotEmpty) console.log('   - Comentarios quedaron vacíos');
      if (validations.strengthsCount > 3) console.log(`   - Demasiadas fortalezas: ${validations.strengthsCount}`);
      if (validations.improvementsCount > 3) console.log(`   - Demasiadas mejoras: ${validations.improvementsCount}`);
    }

    console.log('\n' + '='.repeat(70));

    process.exit(allValidationsPassed ? 0 : 1);

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar test
testFeedbackGeneration();
