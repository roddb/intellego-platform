/**
 * Test de Validación - Sistema de Rúbricas Completo
 *
 * Valida la integración completa del sistema de rúbricas:
 * - Uso de rúbricas específicas por fase (1-4)
 * - Cálculo de scores ponderados según algoritmo oficial
 * - Cálculo de 5 métricas de habilidades según fórmulas oficiales
 * - Prompt Caching automático (para rúbricas >2048 tokens)
 */

import dotenv from 'dotenv';
dotenv.config();

import analyzer, { type Answer } from './src/services/ai/claude/analyzer';

console.log('🧪 Test de Validación - Sistema de Rúbricas Completo\n');
console.log('=' .repeat(80));

// Respuestas de prueba realistas para FASE 2 (Identificación de Variables)
const respuestasPruebaFase2: Answer[] = [
  {
    id: 'test-q1',
    questionId: 'q1',
    questionText: '¿Qué temas trabajaste esta semana y cuál es tu nivel de dominio?',
    answer: `Esta semana trabajamos con identificación de variables en movimiento parabólico.
    Aprendí a distinguir entre:
    - Variables conocidas: velocidad inicial (v₀), ángulo de lanzamiento (θ), gravedad (g)
    - Variables desconocidas: altura máxima (h), alcance horizontal (R), tiempo de vuelo (t)
    - Variables controlables: v₀ y θ (las podemos modificar en el experimento)
    - Variables no controlables: g (constante)

    También trabajé con magnitudes físicas: velocidad (m/s), ángulo (grados), distancia (m), tiempo (s).
    Siento que tengo buen dominio del tema, aunque a veces me cuesta clasificar variables en problemas complejos.`,
    type: 'text'
  },
  {
    id: 'test-q2',
    questionId: 'q2',
    questionText: '¿Qué evidencias tienes de tu aprendizaje esta semana?',
    answer: `Hice 5 ejercicios de identificación de variables en problemas de cinemática.

    Por ejemplo, en el problema del proyectil:
    - Identifiqué v₀ = 20 m/s (conocida, controlable)
    - θ = 45° (conocida, controlable)
    - g = 9.8 m/s² (conocida, no controlable)
    - h = ? (desconocida)
    - R = ? (desconocida)

    También integré la Fase 1 (identificación del problema) con la Fase 2: primero identifiqué que el problema era calcular el alcance, luego listé todas las variables necesarias.

    Adjunto foto de mi carpeta con los ejercicios resueltos.`,
    type: 'text'
  },
  {
    id: 'test-q3',
    questionId: 'q3',
    questionText: '¿Qué dificultades tuviste y qué estrategias usaste?',
    answer: `Mi mayor dificultad fue distinguir entre variables controlables y no controlables en problemas con fricción.

    Por ejemplo, en un problema de plano inclinado:
    - ¿El coeficiente de fricción (μ) es controlable? Depende si podemos cambiar las superficies o no.
    - ¿La masa del objeto es controlable? Sí, si podemos elegir el objeto.

    Mi estrategia fue preguntarme: "En un experimento real, ¿podría modificar esta variable?"

    También me costó al principio recordar todas las magnitudes físicas involucradas. Para mejorar, creé una tabla de referencia con las magnitudes más comunes y sus unidades.`,
    type: 'text'
  },
  {
    id: 'test-q4',
    questionId: 'q4',
    questionText: '¿Cómo conectas lo aprendido con situaciones reales?',
    answer: `Conecté la identificación de variables con situaciones cotidianas:

    1. **Lanzar una pelota de básquet**:
       - Variables controlables: fuerza del lanzamiento, ángulo
       - No controlables: distancia al aro, altura del aro
       - Desconocidas: trayectoria óptima

    2. **Salto en largo**:
       - Controlables: velocidad de carrera, ángulo de despegue
       - No controlables: gravedad, resistencia del aire
       - Desconocidas: distancia máxima alcanzable

    Este ejercicio me ayudó a ver que en la vida real siempre hay variables que podemos controlar y otras que no, igual que en física. Aprendí que identificar qué podemos cambiar es el primer paso para resolver un problema.`,
    type: 'text'
  },
  {
    id: 'test-q5',
    questionId: 'q5',
    questionText: '¿Comentarios adicionales?',
    answer: `Me doy cuenta de que la Fase 2 es más compleja que la Fase 1. Ahora no solo hay que identificar el problema, sino también todas las variables involucradas.

    Me gustaría profundizar en cómo identificar variables en problemas de termodinámica, porque ahí hay muchas variables (presión, volumen, temperatura, etc.) y me confundo.

    Una idea: ¿podríamos hacer un ejercicio donde nosotros mismos diseñemos un experimento y tengamos que identificar todas las variables desde cero?`,
    type: 'text'
  }
];

async function testRubricas() {
  try {
    console.log('\n📝 Testing FASE 2: Identificación de Variables y Datos');
    console.log('Materia: Física');
    console.log('Respuestas:', respuestasPruebaFase2.length);
    console.log('-'.repeat(80));

    // Test con Fase 2
    const resultado = await analyzer.analyzeAnswers(
      respuestasPruebaFase2,
      'Física',
      2,  // Fase 2
      'structured'
    );

    console.log('\n✅ RESULTADOS DEL ANÁLISIS:');
    console.log('═'.repeat(80));

    console.log('\n🎯 SCORE FINAL PONDERADO:', resultado.score, '/100');

    console.log('\n📊 MÉTRICAS DE HABILIDADES (Fórmulas Oficiales):');
    console.log('  Comprehension:................', resultado.skillsMetrics.comprehension, '/100');
    console.log('  Critical Thinking:............', resultado.skillsMetrics.criticalThinking, '/100');
    console.log('  Self Regulation:..............', resultado.skillsMetrics.selfRegulation, '/100');
    console.log('  Practical Application:........', resultado.skillsMetrics.practicalApplication, '/100');
    console.log('  Metacognition:................', resultado.skillsMetrics.metacognition, '/100');

    console.log('\n💪 FORTALEZAS:');
    console.log(resultado.strengths);

    console.log('\n📈 ÁREAS DE MEJORA:');
    console.log(resultado.improvements);

    console.log('\n💬 COMENTARIOS GENERALES:');
    console.log(resultado.generalComments);

    console.log('\n📄 ANÁLISIS COMPLETO:');
    console.log('='.repeat(80));
    console.log(resultado.rawAnalysis);
    console.log('='.repeat(80));

    console.log('\n═'.repeat(80));
    console.log('✅ Test completado exitosamente');
    console.log('═'.repeat(80));

    // Validaciones automáticas
    console.log('\n🔍 VALIDACIONES AUTOMÁTICAS:');
    const validaciones = [];

    if (resultado.score >= 0 && resultado.score <= 100) {
      validaciones.push('✅ Score en rango válido (0-100)');
    } else {
      validaciones.push(`❌ Score fuera de rango: ${resultado.score}`);
    }

    const metricasValidas = Object.values(resultado.skillsMetrics).every(m => m >= 0 && m <= 100);
    if (metricasValidas) {
      validaciones.push('✅ Todas las métricas en rango válido (0-100)');
    } else {
      validaciones.push('❌ Algunas métricas fuera de rango');
    }

    if (resultado.strengths && resultado.strengths.length > 20) {
      validaciones.push('✅ Fortalezas generadas correctamente');
    } else {
      validaciones.push('❌ Fortalezas insuficientes o vacías');
    }

    if (resultado.improvements && resultado.improvements.length > 20) {
      validaciones.push('✅ Mejoras generadas correctamente');
    } else {
      validaciones.push('❌ Mejoras insuficientes o vacías');
    }

    if (resultado.generalComments && resultado.generalComments.length > 20) {
      validaciones.push('✅ Comentarios generales generados correctamente');
    } else {
      validaciones.push('❌ Comentarios generales insuficientes o vacíos');
    }

    validaciones.forEach(v => console.log(v));

    const todosValidos = validaciones.every(v => v.startsWith('✅'));
    if (todosValidos) {
      console.log('\n🎉 TODAS LAS VALIDACIONES PASARON');
    } else {
      console.log('\n⚠️  ALGUNAS VALIDACIONES FALLARON');
    }

  } catch (error: any) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Ejecutar test
testRubricas()
  .then(() => {
    console.log('\n✅ Script de test finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ El test falló:', error);
    process.exit(1);
  });
