/**
 * Script: Agregar Rúbrica de Informe APP Dinámica
 *
 * Usage: npx tsx scripts/add-rubric-app-dinamica.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_APP_DINAMICA = `# RÚBRICA DE EVALUACIÓN - INFORME DE LABORATORIO
## APP Dinámica: Demostración de las Leyes de Newton
**Puntaje Total: 100 puntos**

**Física 4° - Módulo III: Dinámica | Instituto Intellego**

---

**Instrucciones:** Evalúe cada criterio según los niveles descritos. Marque el nivel alcanzado y asigne los puntos correspondientes. El sistema calculará automáticamente el puntaje total.

---

## DIMENSIÓN 1: CONTENIDO CIENTÍFICO (35 puntos)

### Criterio 1.1: Explicación de las Leyes de Newton (10 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Explica las 3 leyes con precisión conceptual, incluyendo enunciados formales y ecuaciones. Demuestra comprensión profunda sin errores. | 10 |
| **Muy Bueno** | Explica las 3 leyes correctamente con algún detalle menor faltante. Las ecuaciones son correctas. | 8.5 |
| **Bueno** | Explica las 3 leyes de forma básica. Puede haber alguna imprecisión menor en enunciados o ecuaciones. | 7 |
| **Suficiente** | Explica al menos 2 leyes de forma básica. Hay errores conceptuales menores. | 5.5 |
| **Insuficiente** | No explica las leyes o presenta errores conceptuales graves que demuestran incomprensión. | 3 |

### Criterio 1.2: Conexión teoría-dispositivo (10 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Relaciona de manera excelente cada ley con fenómenos específicos observados en SU dispositivo. Da ejemplos concretos y detallados. | 10 |
| **Muy Bueno** | Relaciona correctamente las leyes con el dispositivo. Los ejemplos son pertinentes. | 8.5 |
| **Bueno** | Relaciona las leyes con el dispositivo de forma general. Algunos ejemplos poco específicos. | 7 |
| **Suficiente** | Intenta relacionar las leyes con el dispositivo pero la conexión es superficial o incompleta. | 5.5 |
| **Insuficiente** | No establece conexión entre la teoría y el dispositivo, o la conexión es incorrecta. | 3 |

### Criterio 1.3: Análisis de resultados (8 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Interpreta los resultados con profundidad. Explica patrones, tendencias y anomalías. Compara con la hipótesis de forma crítica. | 8 |
| **Muy Bueno** | Interpreta los resultados correctamente. Identifica tendencias principales y compara con la hipótesis. | 6.8 |
| **Bueno** | Interpreta los resultados de forma básica. La comparación con la hipótesis es superficial. | 5.6 |
| **Suficiente** | Presenta interpretación limitada de los resultados. Omite comparación con hipótesis o es muy básica. | 4.4 |
| **Insuficiente** | No interpreta los resultados o la interpretación es incorrecta. | 2.4 |

### Criterio 1.4: Conclusiones fundamentadas (7 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Conclusiones sólidas, completamente respaldadas por los datos. Reconoce limitaciones y propone mejoras significativas. | 7 |
| **Muy Bueno** | Conclusiones correctas y respaldadas por datos. Menciona limitaciones. | 6 |
| **Bueno** | Conclusiones básicas con respaldo parcial de datos. Limitaciones mencionadas brevemente. | 4.9 |
| **Suficiente** | Conclusiones poco desarrolladas o con respaldo insuficiente en los datos. | 3.9 |
| **Insuficiente** | Conclusiones ausentes, incorrectas o sin respaldo en los resultados. | 2.1 |

**Subtotal Dimensión 1: _____ / 35 pts**

---

## DIMENSIÓN 2: METODOLOGÍA Y DATOS (25 puntos)

### Criterio 2.1: Procedimiento (7 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Procedimiento detallado, secuencial y perfectamente replicable. Incluye todas las variables (independiente, dependiente, controladas). | 7 |
| **Muy Bueno** | Procedimiento claro y replicable. Variables identificadas correctamente. | 6 |
| **Bueno** | Procedimiento comprensible pero con algunos pasos poco detallados. Variables parcialmente identificadas. | 4.9 |
| **Suficiente** | Procedimiento incompleto o confuso. Omite variables importantes. | 3.9 |
| **Insuficiente** | Procedimiento ausente, incomprensible o imposible de replicar. | 2.1 |

### Criterio 2.2: Registro de datos (7 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Datos completos, organizados en tablas claras con unidades. Múltiples repeticiones. Incluye datos cuantitativos y cualitativos. | 7 |
| **Muy Bueno** | Datos completos en tablas con unidades. Número adecuado de repeticiones. | 6 |
| **Bueno** | Datos en tablas básicas. Puede faltar alguna unidad o haber pocas repeticiones. | 4.9 |
| **Suficiente** | Datos incompletos o desorganizados. Faltan unidades o hay muy pocas mediciones. | 3.9 |
| **Insuficiente** | No presenta datos, o los datos están muy incompletos o son incoherentes. | 2.1 |

### Criterio 2.3: Gráficos y representaciones (6 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Gráficos apropiados, claros, con ejes etiquetados, unidades, título y numeración. Representan efectivamente los datos. | 6 |
| **Muy Bueno** | Gráficos correctos con todos los elementos necesarios. Buena representación visual. | 5.1 |
| **Bueno** | Gráficos básicos, puede faltar algún elemento (título, unidades) pero son comprensibles. | 4.2 |
| **Suficiente** | Gráficos incompletos o poco apropiados para los datos. Faltan varios elementos. | 3.3 |
| **Insuficiente** | No incluye gráficos o son inadecuados/incomprensibles. | 1.8 |

### Criterio 2.4: Análisis de errores (5 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Identifica múltiples fuentes de error (sistemáticos y aleatorios), analiza su impacto y propone formas de minimizarlos. | 5 |
| **Muy Bueno** | Identifica fuentes de error principales y comenta su posible impacto. | 4.3 |
| **Bueno** | Menciona algunas fuentes de error de forma general. | 3.5 |
| **Suficiente** | Menciona errores de forma muy superficial o incompleta. | 2.8 |
| **Insuficiente** | No analiza fuentes de error. | 1.5 |

**Subtotal Dimensión 2: _____ / 25 pts**

---

## DIMENSIÓN 3: REDACCIÓN Y ORGANIZACIÓN (20 puntos)

### Criterio 3.1: Estructura del informe (6 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Incluye todas las secciones requeridas en el orden correcto. Cada sección cumple su propósito específico. | 6 |
| **Muy Bueno** | Incluye todas las secciones en orden correcto. Alguna sección podría estar más desarrollada. | 5.1 |
| **Bueno** | Incluye la mayoría de las secciones. Puede haber alguna omisión menor o desorden. | 4.2 |
| **Suficiente** | Faltan varias secciones o el orden está alterado significativamente. | 3.3 |
| **Insuficiente** | Estructura incompleta, desorganizada o no sigue el formato solicitado. | 1.8 |

### Criterio 3.2: Calidad de redacción (6 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Excelente ortografía, gramática y sintaxis. Redacción fluida y coherente. Sin errores. | 6 |
| **Muy Bueno** | Muy buena redacción con errores mínimos (≤3). Texto coherente y fluido. | 5.1 |
| **Bueno** | Redacción aceptable con algunos errores (4-7). El texto se comprende sin dificultad. | 4.2 |
| **Suficiente** | Redacción con errores frecuentes (8-15). Afecta parcialmente la comprensión. | 3.3 |
| **Insuficiente** | Redacción deficiente con errores graves que dificultan la comprensión. | 1.8 |

### Criterio 3.3: Lenguaje científico (5 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Uso apropiado y consistente de terminología científica. Tiempo verbal impersonal. Vocabulario técnico preciso. | 5 |
| **Muy Bueno** | Buen uso del lenguaje científico con alguna inconsistencia menor. | 4.3 |
| **Bueno** | Uso básico de lenguaje científico. Mezcla de estilos (personal/impersonal). | 3.5 |
| **Suficiente** | Lenguaje científico limitado. Predomina lenguaje coloquial. | 2.8 |
| **Insuficiente** | No utiliza lenguaje científico o lo usa incorrectamente. | 1.5 |

### Criterio 3.4: Coherencia entre secciones (3 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Las secciones se conectan lógicamente. La hipótesis se retoma en análisis y conclusiones. Hilo conductor claro. | 3 |
| **Muy Bueno** | Buena conexión entre secciones. La hipótesis se retoma correctamente. | 2.6 |
| **Bueno** | Conexión básica entre secciones. Alguna desconexión menor. | 2.1 |
| **Suficiente** | Poca conexión entre secciones. La hipótesis no se retoma adecuadamente. | 1.7 |
| **Insuficiente** | Las secciones parecen independientes o contradictorias entre sí. | 0.9 |

**Subtotal Dimensión 3: _____ / 20 pts**

---

## DIMENSIÓN 4: FORMATO Y PRESENTACIÓN (10 puntos)

### Criterio 4.1: Carátula (2 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Carátula completa con todos los elementos requeridos. Diseño profesional y atractivo. | 2 |
| **Muy Bueno** | Carátula completa con diseño adecuado. | 1.7 |
| **Bueno** | Carátula con la mayoría de elementos. Diseño básico. | 1.4 |
| **Suficiente** | Carátula incompleta o con diseño descuidado. | 1.1 |
| **Insuficiente** | Sin carátula o muy incompleta. | 0.6 |

### Criterio 4.2: Calidad visual (4 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Documento muy prolijo. Imágenes de alta calidad, bien posicionadas y etiquetadas. Tablas claras y profesionales. | 4 |
| **Muy Bueno** | Documento prolijo con imágenes y tablas de buena calidad. | 3.4 |
| **Bueno** | Documento aceptable. Imágenes/tablas básicas pero funcionales. | 2.8 |
| **Suficiente** | Documento desprolijo. Imágenes de baja calidad o mal posicionadas. | 2.2 |
| **Insuficiente** | Documento muy descuidado. Sin imágenes o ilegibles. | 1.2 |

### Criterio 4.3: Diagrama del dispositivo (4 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Diagrama/foto del dispositivo con etiquetas claras de todas las partes. Escala apropiada. Incluye diagrama de fuerzas si corresponde. | 4 |
| **Muy Bueno** | Diagrama/foto con etiquetas de partes principales. Buena calidad. | 3.4 |
| **Bueno** | Diagrama/foto básico con algunas etiquetas. | 2.8 |
| **Suficiente** | Diagrama/foto de baja calidad o sin etiquetas. | 2.2 |
| **Insuficiente** | No incluye diagrama/foto del dispositivo. | 1.2 |

**Subtotal Dimensión 4: _____ / 10 pts**

---

## DIMENSIÓN 5: USO CRÍTICO DE RECURSOS (10 puntos)

### Criterio 5.1: Bibliografía (4 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Referencias completas en formato correcto. Variedad de fuentes (libros, web, apuntes). Ordenadas alfabéticamente. | 4 |
| **Muy Bueno** | Referencias en formato correcto. Variedad adecuada de fuentes. | 3.4 |
| **Bueno** | Referencias básicas, puede haber inconsistencias menores en formato. | 2.8 |
| **Suficiente** | Referencias incompletas o con formato incorrecto. Pocas fuentes. | 2.2 |
| **Insuficiente** | Sin bibliografía o fuentes no relacionadas. | 1.2 |

### Criterio 5.2: Transparencia en uso de IA (3 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | Declara explícitamente si usó IA, para qué y cómo. Demuestra uso crítico como herramienta de apoyo (no de copia). | 3 |
| **Muy Bueno** | Declara uso de IA y su propósito general. Uso apropiado. | 2.6 |
| **Bueno** | Menciona uso de IA pero sin detalles específicos. | 2.1 |
| **Suficiente** | Uso de IA evidente pero no declarado, o declaración muy vaga. | 1.7 |
| **Insuficiente** | Evidencia de copia directa de IA sin procesamiento propio. | 0.9 |

### Criterio 5.3: Originalidad y apropiación (3 pts)

| **Nivel** | **Descriptor** | **Puntos** |
|-----------|----------------|------------|
| **Excelente** | El análisis y reflexiones son claramente propios. Demuestra procesamiento personal de la información. Voz propia evidente. | 3 |
| **Muy Bueno** | Análisis mayormente original. Buena apropiación de la información. | 2.6 |
| **Bueno** | Análisis básico con cierta originalidad. Algunas secciones genéricas. | 2.1 |
| **Suficiente** | Análisis poco original. Mucho contenido genérico o copiado. | 1.7 |
| **Insuficiente** | Copia evidente de fuentes sin procesamiento. Plagio. | 0.9 |

**Subtotal Dimensión 5: _____ / 10 pts**

---

## RESUMEN DE CALIFICACIÓN

| **Dimensión** | **Puntos Máximos** |
|--------------|-------------------|
| 1. Contenido Científico | 35 |
| 2. Metodología y Datos | 25 |
| 3. Redacción y Organización | 20 |
| 4. Formato y Presentación | 10 |
| 5. Uso Crítico de Recursos | 10 |
| **TOTAL** | **100** |

---

## ESCALA DE CONVERSIÓN A NOTA (1-10)

| **Puntaje** | **Nota** | **Calificación** |
|-------------|----------|------------------|
| 95-100 | 10 | Sobresaliente |
| 85-94 | 9 | Distinguido |
| 75-84 | 8 | Muy Bueno |
| 65-74 | 7 | Bueno |
| 55-64 | 6 | Aprobado |
| 45-54 | 5 | Regular (Recuperatorio) |
| 35-44 | 4 | Insuficiente |
| 25-34 | 3 | Deficiente |
| 15-24 | 2 | Muy Deficiente |
| 0-14 | 1 | No presentado |

---

## PROYECTOS VÁLIDOS PARA ESTA RÚBRICA

- ☑ Cohete de Agua
- ☑ Catapulta
- ☑ Vehículo con Globo
- ☑ Sistema de Poleas
- ☑ Péndulo de Newton

**Fecha de entrega:** Tercera semana de noviembre 2025

---

*Física 4° - Instituto Intellego - Prof. Rodrigo Di Bernardo*
*Rúbrica APP Dinámica - Evaluación de Informes de Laboratorio*
`;

async function addRubricAPPDinamica() {
  console.log('🌱 Agregando rúbrica: Informe APP Dinámica...\n');

  try {
    const client = db();

    // Get an instructor user
    const usersResult = await client.execute(`
      SELECT id FROM User WHERE role = 'INSTRUCTOR' LIMIT 1
    `);

    if (usersResult.rows.length === 0) {
      throw new Error('No instructor found. Please create an instructor user first.');
    }

    const instructorId = (usersResult.rows[0] as any).id;
    const now = new Date().toISOString();
    const rubricId = `rubric-app-dinamica-fisica`;

    // Check if rubric already exists
    console.log('🔍 Checking if rubric already exists...');
    const existingRubric = await client.execute({
      sql: 'SELECT id FROM Rubric WHERE id = ?',
      args: [rubricId],
    });

    if (existingRubric.rows.length > 0) {
      console.log('ℹ️  Rubric already exists, skipping creation\n');
      console.log('✅ Script completed (rubric already exists)\n');
      return;
    }

    // Create rubric
    console.log('📝 Creating rubric: "Informe APP Dinámica"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt, rubricType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Informe de Laboratorio - APP Dinámica',
        'Rúbrica para evaluación de informes de laboratorio sobre Leyes de Newton - Física 4°: 5 dimensiones (Contenido Científico, Metodología, Redacción, Formato, Uso Crítico de Recursos)',
        RUBRICA_APP_DINAMICA,
        'Física',
        'Informe de Laboratorio',
        1, // isActive
        instructorId,
        now,
        now,
        'custom', // rubricType
      ],
    });

    console.log('✅ Rubric created successfully\n');

    // Verify creation
    console.log('🔍 Verifying rubric creation...');
    const verifyResult = await client.execute({
      sql: 'SELECT id, name, description, subject, examType, rubricType FROM Rubric WHERE id = ?',
      args: [rubricId],
    });

    if (verifyResult.rows.length > 0) {
      const rubric = verifyResult.rows[0] as any;
      console.log('✅ Rubric verified:');
      console.log(`   ID: ${rubric.id}`);
      console.log(`   Name: ${rubric.name}`);
      console.log(`   Subject: ${rubric.subject}`);
      console.log(`   Exam Type: ${rubric.examType}`);
      console.log(`   Rubric Type: ${rubric.rubricType}`);
      console.log(`   Description: ${rubric.description}\n`);
    } else {
      throw new Error('❌ Rubric not found after creation');
    }

    console.log('🎉 Script completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Refresh the evaluation page');
    console.log('2. You should now see "Informe APP Dinámica" in the rubric dropdown');
    console.log('3. Test evaluating a lab report with this rubric\n');

  } catch (error: unknown) {
    console.error('\n❌ Script failed:');
    if (error instanceof Error) {
      console.error(error.message);
      console.error('\nStack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

addRubricAPPDinamica();
