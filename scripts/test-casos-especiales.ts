/**
 * Script de testing para validar detección de casos especiales
 *
 * Ejecutar:
 * npx tsx scripts/test-casos-especiales.ts
 */

import type { Answer } from '../src/services/ai/claude/analyzer';

// Simular la lógica de detección (copiada del analyzer)
function detectarCasoEspecial(answers: Answer[]): boolean {
  // Caso 1: Respuestas muy cortas o vacías (4 de 5 preguntas)
  const respuestasVacias = answers.filter(a =>
    !a.answer || a.answer.trim().length < 10
  ).length;

  if (respuestasVacias >= 4) {
    console.log('   🔍 Detectado: 4+ respuestas vacías');
    return true;
  }

  // Caso 2: Palabras clave de ausencia/sin clases
  const keywordsAusencia = [
    'ausente', 'viaje', 'enfermo', 'enferma', 'no asistí', 'no asisti',
    'sin clases', 'feriado', 'no tuve clase', 'no hubo clase',
    'receso', 'vacaciones', 'emergencia', 'problema personal',
    'no pude venir', 'no pude asistir'
  ];

  const totalText = answers.map(a => a.answer.toLowerCase()).join(' ');
  const contieneKeyword = keywordsAusencia.some(k =>
    totalText.includes(k.toLowerCase())
  );

  if (contieneKeyword) {
    console.log('   🔍 Detectado: keyword de ausencia encontrada');
    return true;
  }

  // Caso 3: Todas las respuestas son muy similares
  const respuestasUnicas = new Set(answers.map(a => a.answer.trim().toLowerCase()));
  if (respuestasUnicas.size === 1 && answers.length > 1) {
    const textoUnico = Array.from(respuestasUnicas)[0];
    if (textoUnico.length < 20 && (
      textoUnico.includes('no') ||
      textoUnico === '.' ||
      textoUnico === '-'
    )) {
      console.log('   🔍 Detectado: respuestas idénticas muy cortas');
      return true;
    }
  }

  return false;
}

// Casos de prueba
const testCases = [
  {
    name: 'Caso Normal - Respuestas completas',
    answers: [
      { id: '1', questionId: 'q1', questionText: 'Pregunta 1', answer: 'Respuesta completa con más de 10 caracteres', type: 'text' },
      { id: '2', questionId: 'q2', questionText: 'Pregunta 2', answer: 'Otra respuesta con contenido significativo', type: 'text' },
      { id: '3', questionId: 'q3', questionText: 'Pregunta 3', answer: 'Más contenido relevante del estudiante', type: 'text' },
      { id: '4', questionId: 'q4', questionText: 'Pregunta 4', answer: 'Conexión con otros temas estudiados', type: 'text' },
      { id: '5', questionId: 'q5', questionText: 'Pregunta 5', answer: 'Reflexión final sobre el aprendizaje', type: 'text' }
    ],
    expectedSpecial: false
  },
  {
    name: 'Caso Especial 1 - Respuestas vacías (ausencia)',
    answers: [
      { id: '1', questionId: 'q1', questionText: 'Pregunta 1', answer: '', type: 'text' },
      { id: '2', questionId: 'q2', questionText: 'Pregunta 2', answer: '.', type: 'text' },
      { id: '3', questionId: 'q3', questionText: 'Pregunta 3', answer: '', type: 'text' },
      { id: '4', questionId: 'q4', questionText: 'Pregunta 4', answer: '-', type: 'text' },
      { id: '5', questionId: 'q5', questionText: 'Pregunta 5', answer: '', type: 'text' }
    ],
    expectedSpecial: true
  },
  {
    name: 'Caso Especial 2 - Keyword "ausente"',
    answers: [
      { id: '1', questionId: 'q1', questionText: 'Pregunta 1', answer: 'Estuve ausente esta semana por viaje', type: 'text' },
      { id: '2', questionId: 'q2', questionText: 'Pregunta 2', answer: 'No aplica', type: 'text' },
      { id: '3', questionId: 'q3', questionText: 'Pregunta 3', answer: 'No aplica', type: 'text' },
      { id: '4', questionId: 'q4', questionText: 'Pregunta 4', answer: 'No aplica', type: 'text' },
      { id: '5', questionId: 'q5', questionText: 'Pregunta 5', answer: '', type: 'text' }
    ],
    expectedSpecial: true
  },
  {
    name: 'Caso Especial 3 - Keyword "sin clases"',
    answers: [
      { id: '1', questionId: 'q1', questionText: 'Pregunta 1', answer: 'Esta semana no hubo clases por feriado', type: 'text' },
      { id: '2', questionId: 'q2', questionText: 'Pregunta 2', answer: '', type: 'text' },
      { id: '3', questionId: 'q3', questionText: 'Pregunta 3', answer: '', type: 'text' },
      { id: '4', questionId: 'q4', questionText: 'Pregunta 4', answer: '', type: 'text' },
      { id: '5', questionId: 'q5', questionText: 'Pregunta 5', answer: '', type: 'text' }
    ],
    expectedSpecial: true
  },
  {
    name: 'Caso Especial 4 - Keyword "enfermo"',
    answers: [
      { id: '1', questionId: 'q1', questionText: 'Pregunta 1', answer: 'No pude asistir porque estuve enfermo', type: 'text' },
      { id: '2', questionId: 'q2', questionText: 'Pregunta 2', answer: 'No hice la tarea', type: 'text' },
      { id: '3', questionId: 'q3', questionText: 'Pregunta 3', answer: '', type: 'text' },
      { id: '4', questionId: 'q4', questionText: 'Pregunta 4', answer: '', type: 'text' },
      { id: '5', questionId: 'q5', questionText: 'Pregunta 5', answer: '', type: 'text' }
    ],
    expectedSpecial: true
  },
  {
    name: 'Caso Especial 5 - Respuestas idénticas "no"',
    answers: [
      { id: '1', questionId: 'q1', questionText: 'Pregunta 1', answer: 'no', type: 'text' },
      { id: '2', questionId: 'q2', questionText: 'Pregunta 2', answer: 'no', type: 'text' },
      { id: '3', questionId: 'q3', questionText: 'Pregunta 3', answer: 'no', type: 'text' },
      { id: '4', questionId: 'q4', questionText: 'Pregunta 4', answer: 'no', type: 'text' },
      { id: '5', questionId: 'q5', questionText: 'Pregunta 5', answer: 'no', type: 'text' }
    ],
    expectedSpecial: true
  },
  {
    name: 'Caso Límite - 3 respuestas vacías (NO especial)',
    answers: [
      { id: '1', questionId: 'q1', questionText: 'Pregunta 1', answer: 'Respuesta válida con contenido', type: 'text' },
      { id: '2', questionId: 'q2', questionText: 'Pregunta 2', answer: 'Otra respuesta con información', type: 'text' },
      { id: '3', questionId: 'q3', questionText: 'Pregunta 3', answer: '', type: 'text' },
      { id: '4', questionId: 'q4', questionText: 'Pregunta 4', answer: '.', type: 'text' },
      { id: '5', questionId: 'q5', questionText: 'Pregunta 5', answer: '', type: 'text' }
    ],
    expectedSpecial: false
  }
];

// Ejecutar tests
console.log('🧪 TESTING: Detección de Casos Especiales\n');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(70));

  const detected = detectarCasoEspecial(testCase.answers as Answer[]);

  console.log(`   Resultado: ${detected ? '🔍 CASO ESPECIAL' : '📝 CASO NORMAL'}`);
  console.log(`   Esperado:  ${testCase.expectedSpecial ? '🔍 CASO ESPECIAL' : '📝 CASO NORMAL'}`);

  if (detected === testCase.expectedSpecial) {
    console.log(`   ✅ TEST PASADO`);
    passed++;
  } else {
    console.log(`   ❌ TEST FALLADO`);
    console.log(`      Se esperaba: ${testCase.expectedSpecial ? 'ESPECIAL' : 'NORMAL'}`);
    console.log(`      Se obtuvo:   ${detected ? 'ESPECIAL' : 'NORMAL'}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 RESUMEN DE TESTS:`);
console.log(`   ✅ Pasados: ${passed}/${testCases.length}`);
console.log(`   ❌ Fallados: ${failed}/${testCases.length}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log(`\n🎉 Todos los tests de detección pasaron correctamente!`);
  console.log(`\n✅ La lógica de detección de casos especiales está lista para uso.`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Algunos tests fallaron. Revisar lógica de detección.`);
  process.exit(1);
}
