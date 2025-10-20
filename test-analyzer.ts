/**
 * Script de prueba para el analyzer educativo
 *
 * Uso: npx tsx test-analyzer.ts
 *
 * Este script:
 * 1. Carga dotenv para API Key
 * 2. Crea respuestas de prueba
 * 3. Llama al analyzer
 * 4. Muestra resultados y costos
 */

import dotenv from 'dotenv';
dotenv.config();

import analyzer from './src/services/ai/claude/analyzer';

// Respuestas de prueba simulando un reporte semanal real
const sampleAnswers = [
  {
    id: 'ans1',
    questionId: 'q1',
    questionText: '¿Qué aprendiste esta semana en la materia?',
    answer: 'Esta semana aprendí sobre las leyes de Newton y cómo se aplican en la vida cotidiana. Me pareció muy interesante el concepto de inercia y pude relacionarlo con situaciones que veo todos los días.',
    type: 'long_text'
  },
  {
    id: 'ans2',
    questionId: 'q2',
    questionText: '¿Qué dificultades encontraste?',
    answer: 'Tuve algunas dificultades con los ejercicios de fuerza y aceleración, especialmente cuando hay varias fuerzas actuando al mismo tiempo. A veces me confundo con los signos.',
    type: 'long_text'
  },
  {
    id: 'ans3',
    questionId: 'q3',
    questionText: '¿Cómo te organizaste para estudiar?',
    answer: 'Hice resúmenes de cada ley y practiqué con ejercicios del libro. También vi algunos videos en YouTube que explicaban los conceptos de forma visual.',
    type: 'long_text'
  },
  {
    id: 'ans4',
    questionId: 'q4',
    questionText: '¿Qué te gustaría mejorar para la próxima semana?',
    answer: 'Me gustaría practicar más ejercicios complejos y mejorar mi velocidad para resolver problemas. También quiero entender mejor el tema de la tercera ley de Newton.',
    type: 'long_text'
  }
];

async function testAnalyzer() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING EDUCATIONAL ANALYZER');
  console.log('='.repeat(70) + '\n');

  // Verificar API Key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY no encontrada en .env\n');
    process.exit(1);
  }

  console.log('✅ API Key encontrada');
  console.log('📚 Materia de prueba: Física');
  console.log('📝 Respuestas de prueba: ' + sampleAnswers.length + ' respuestas\n');

  console.log('━'.repeat(70));
  console.log('📋 RESPUESTAS DEL ESTUDIANTE:');
  console.log('━'.repeat(70));
  sampleAnswers.forEach((answer, idx) => {
    console.log(`\n${idx + 1}. ${answer.questionText}`);
    console.log(`   → ${answer.answer.substring(0, 100)}${answer.answer.length > 100 ? '...' : ''}`);
  });
  console.log('\n' + '━'.repeat(70) + '\n');

  console.log('🚀 Llamando a Claude API para análisis...\n');

  const startTime = Date.now();

  try {
    const result = await analyzer.analyzeAnswers(
      sampleAnswers,
      'Física',
      undefined,  // Sin rúbrica específica
      'structured'
    );

    const totalTime = Date.now() - startTime;

    console.log('✅ ANÁLISIS COMPLETADO EXITOSAMENTE\n');
    console.log('='.repeat(70));
    console.log('📊 RESULTADOS DEL ANÁLISIS');
    console.log('='.repeat(70) + '\n');

    console.log('📈 PUNTAJE GENERAL: ' + result.score + '/100\n');

    console.log('💪 FORTALEZAS:');
    console.log(result.strengths);
    console.log('');

    console.log('🎯 ÁREAS DE MEJORA:');
    console.log(result.improvements);
    console.log('');

    console.log('📝 COMENTARIOS GENERALES:');
    console.log(result.generalComments);
    console.log('');

    console.log('━'.repeat(70));
    console.log('📊 MÉTRICAS DE HABILIDADES:');
    console.log('━'.repeat(70));
    console.log('  Completeness (Completitud):  ' + result.skillsMetrics.completeness + '/100');
    console.log('  Clarity (Claridad):          ' + result.skillsMetrics.clarity + '/100');
    console.log('  Reflection (Reflexión):      ' + result.skillsMetrics.reflection + '/100');
    console.log('  Progress (Progreso):         ' + result.skillsMetrics.progress + '/100');
    console.log('  Engagement (Compromiso):     ' + result.skillsMetrics.engagement + '/100');
    console.log('');

    console.log('━'.repeat(70));
    console.log('⏱️  PERFORMANCE & COSTOS');
    console.log('━'.repeat(70));
    console.log('  Tiempo total:  ' + totalTime + 'ms');
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(70) + '\n');

    console.log('📋 PRÓXIMOS PASOS:');
    console.log('   1. El analyzer funciona correctamente ✅');
    console.log('   2. Probar con reportes reales de la base de datos');
    console.log('   3. Testear el endpoint /api/ai/analyze-report');
    console.log('   4. Validar costos en producción\n');

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.log('❌ TEST FAILED\n');
    console.log('━'.repeat(70));
    console.log('🔴 ERROR:');
    console.log('━'.repeat(70));
    console.log('  Mensaje: ' + error.message);
    console.log('  Tiempo:  ' + totalTime + 'ms\n');

    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
    }

    console.log('\n' + '='.repeat(70));
    console.log('❌ Fix el error antes de continuar');
    console.log('='.repeat(70) + '\n');

    process.exit(1);
  }
}

// Ejecutar test
testAnalyzer().catch((error) => {
  console.error('\n❌ Error inesperado:', error.message);
  if (error.stack) {
    console.error('\nStack trace:', error.stack);
  }
  process.exit(1);
});
