/**
 * Script de testing para validar el parseo mejorado de feedbacks
 *
 * Ejecutar:
 * npx ts-node scripts/test-feedback-parsing.ts
 */

// Test cases con diferentes formatos de respuesta
const testCases = [
  {
    name: 'Formato con dos puntos',
    text: `
Q1_NIVEL: 3
Q1_JUSTIFICACIÓN: Buen trabajo

FORTALEZAS:
- Fortaleza 1 con detalles
- Fortaleza 2 aquí
- Fortaleza 3 adicional
- Fortaleza 4 que no debería aparecer

MEJORAS:
- Mejora 1
- Mejora 2
- Mejora 3
- Mejora 4 excedente

COMENTARIOS_GENERALES:
Este es un buen reporte. Continúa así.

ANÁLISIS_AI:
Recomendaciones técnicas.
`,
    expectedStrengths: 3,
    expectedImprovements: 3
  },
  {
    name: 'Formato sin dos puntos',
    text: `
Q1_NIVEL: 2

FORTALEZAS

1. Primera fortaleza bien explicada
2. Segunda fortaleza con ejemplo
3. Tercera fortaleza
4. Cuarta fortaleza no debería aparecer

MEJORAS

• Mejora uno aquí
• Mejora dos allá
• Mejora tres
• Mejora cuatro extra

COMENTARIOS_GENERALES

Comentario general del reporte.
`,
    expectedStrengths: 3,
    expectedImprovements: 3
  },
  {
    name: 'Formato con saltos de línea extras',
    text: `
Q1_NIVEL: 4


FORTALEZAS:

- Fortaleza A
- Fortaleza B
- Fortaleza C


MEJORAS:

- Mejora X
- Mejora Y

COMENTARIOS_GENERALES:

Texto del comentario general.
`,
    expectedStrengths: 3,
    expectedImprovements: 2
  }
];

// Funciones de parseo simuladas (copiadas del analyzer.ts)
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/###?\s*/g, '')
    .replace(/---+/g, '')
    .replace(/^\s*[-•]\s*/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractBulletPoints(text: string, maxItems: number = 3): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  const lines = text.split('\n').map(line => line.trim());
  const bulletLines: string[] = [];
  let currentItem = '';

  for (const line of lines) {
    const isBullet = /^[-•\d]+\.?\s/.test(line);

    if (isBullet) {
      if (currentItem) {
        bulletLines.push(currentItem.trim());
      }
      currentItem = line;
    } else if (line.length > 0 && currentItem) {
      currentItem += ' ' + line;
    }
  }

  if (currentItem) {
    bulletLines.push(currentItem.trim());
  }

  const limitedItems = bulletLines.slice(0, maxItems);
  return limitedItems.join('\n');
}

function parseFortalezas(text: string): string {
  const match = text.match(/FORTALEZAS:?[\s\n]*([\s\S]*?)(?=MEJORAS:?|COMENTARIOS_GENERALES:?|ANÁLISIS_AI:?|$)/i);

  if (match && match[1].trim().length > 0) {
    const rawStrengths = match[1].trim();
    const cleanedStrengths = cleanMarkdown(rawStrengths);
    const strengths = extractBulletPoints(cleanedStrengths, 3);

    if (!strengths || strengths.length === 0) {
      return cleanedStrengths;
    }

    return strengths;
  }

  return 'No se identificaron fortalezas específicas.';
}

function parseMejoras(text: string): string {
  const match = text.match(/MEJORAS:?[\s\n]*([\s\S]*?)(?=COMENTARIOS_GENERALES:?|ANÁLISIS_AI:?|$)/i);

  if (match && match[1].trim().length > 0) {
    const rawImprovements = match[1].trim();
    const cleanedImprovements = cleanMarkdown(rawImprovements);
    const improvements = extractBulletPoints(cleanedImprovements, 3);

    if (!improvements || improvements.length === 0) {
      return cleanedImprovements;
    }

    return improvements;
  }

  return 'No se identificaron áreas de mejora específicas.';
}

// Ejecutar tests
console.log('🧪 Iniciando tests de parseo de feedback\n');
console.log('='.repeat(60));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(60));

  const strengths = parseFortalezas(testCase.text);
  const improvements = parseMejoras(testCase.text);

  // Contar items extraídos
  const strengthsCount = strengths.split('\n').filter(l => l.trim().length > 0).length;
  const improvementsCount = improvements.split('\n').filter(l => l.trim().length > 0).length;

  console.log(`\n📊 Resultados:`);
  console.log(`   Fortalezas extraídas: ${strengthsCount} (esperado: máx ${testCase.expectedStrengths})`);
  console.log(`   Mejoras extraídas: ${improvementsCount} (esperado: máx ${testCase.expectedImprovements})`);

  console.log(`\n✨ Fortalezas:`);
  console.log(strengths);

  console.log(`\n🔧 Mejoras:`);
  console.log(improvements);

  // Validar
  const strengthsOk = strengthsCount <= testCase.expectedStrengths && strengthsCount > 0;
  const improvementsOk = improvementsCount <= testCase.expectedImprovements && improvementsCount > 0;

  if (strengthsOk && improvementsOk) {
    console.log(`\n✅ Test PASADO`);
    passedTests++;
  } else {
    console.log(`\n❌ Test FALLADO`);
    if (!strengthsOk) console.log(`   - Fortalezas: esperado máx ${testCase.expectedStrengths}, obtenido ${strengthsCount}`);
    if (!improvementsOk) console.log(`   - Mejoras: esperado máx ${testCase.expectedImprovements}, obtenido ${improvementsCount}`);
    failedTests++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resumen de Tests:`);
console.log(`   ✅ Pasados: ${passedTests}/${testCases.length}`);
console.log(`   ❌ Fallados: ${failedTests}/${testCases.length}`);
console.log(`   📈 Tasa de éxito: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log(`\n🎉 Todos los tests pasaron correctamente!`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Algunos tests fallaron. Revisar implementación.`);
  process.exit(1);
}
