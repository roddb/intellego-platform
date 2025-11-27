/**
 * Script: Agregar Rúbrica de Bioelectricidad (Biofísica)
 *
 * Usage: npx tsx scripts/add-rubric-bioelectricidad.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_BIOELECTRICIDAD = `# RÚBRICA DE CORRECCIÓN

## Examen de Bioelectricidad - Profesorado Superior en Física

| | |
|---|---|
| **Institución:** CONSUDEC | **Materia:** Biofísica - Unidad 3 |
| **Curso:** 4to año - Profesorado Superior en Física | **Puntaje Total:** 10 puntos |

---

## PARTE A: ESTRUCTURA GENERAL DEL EXAMEN

Todos los temas siguen la misma estructura de tres secciones:

| SECCIÓN | CONTENIDO | COMPETENCIA | PUNTAJE |
|---------|-----------|-------------|---------|
| **Sección 1: Cálculos** | 2-3 cálculos con ecuación de Nernst | Matemática cuantitativa | 4 puntos (40%) |
| **Sección 2: Interpretación** | 3 preguntas guiadas con hints | Análisis conceptual | 3 puntos (30%) |
| **Sección 3: Diagnóstico** | Selección + justificación escrita | Razonamiento integrador | 3 puntos (30%) |

---

## PARTE B: CRITERIOS DETALLADOS POR SECCIÓN

### SECCIÓN 1: CÁLCULOS (4 puntos)

| CRITERIO | EXCELENTE | BUENO | REGULAR | INSUFICIENTE | MAX |
|----------|-----------|-------|---------|--------------|-----|
| **Planteo fórmula** | Fórmula correcta con variables | Fórmula correcta, variables parciales | Fórmula con error menor | Fórmula incorrecta/ausente | 1.0 |
| **Sustitución datos** | Datos correctos con unidades | Datos correctos, unidades parciales | Error en un dato | Múltiples errores | 1.0 |
| **Operaciones** | Cálculos y logaritmos correctos | Error aritmético menor | Error en logaritmos | Operaciones incorrectas | 1.0 |
| **Resultado** | Valor correcto con mV | Valor ±5% con unidades | Error >5% procedimiento OK | Resultado incorrecto | 1.0 |

> *Nota: Se acepta 61 mV o 61.5 mV como constante de Nernst a 37°C.*

---

### SECCIÓN 2: INTERPRETACIÓN GUIADA (3 puntos)

| CRITERIO | EXCELENTE | BUENO | REGULAR | INSUFICIENTE | MAX |
|----------|-----------|-------|---------|--------------|-----|
| **Pregunta 1** | Respuesta correcta | — | Razonamiento parcial correcto | Incorrecta sin fundamento | 1.0 |
| **Pregunta 2** | Respuesta correcta | — | Razonamiento parcial correcto | Incorrecta sin fundamento | 1.0 |
| **Pregunta 3** | Respuesta correcta | — | Razonamiento parcial correcto | Incorrecta sin fundamento | 1.0 |

> *Nota: Otorgar 0.5 pts si el razonamiento es correcto aunque la respuesta sea incorrecta.*

---

### SECCIÓN 3: RAZONAMIENTO DIAGNÓSTICO (3 puntos)

| CRITERIO | EXCELENTE | BUENO | REGULAR | INSUFICIENTE | MAX |
|----------|-----------|-------|---------|--------------|-----|
| **Selección Dx** | Diagnóstico correcto | — | — | Diagnóstico incorrecto | 1.0 |
| **Mecanismo** | Explica mecanismo bioeléctrico | Mecanismo parcial | Mecanismo vago | Ausente/Incorrecto | 1.0 |
| **Conexión cálculos** | Vincula cálculos con síntomas | Vincula parcialmente | Mención superficial | Sin conexión | 1.0 |

---

## ESCALA DE CALIFICACIÓN

| Puntaje | Calificación | Nivel |
|---------|--------------|-------|
| 9-10 | Sobresaliente | Excelente |
| 7-8.9 | Distinguido | Muy Bueno |
| 6-6.9 | Bueno | Bueno |
| 4-5.9 | Aprobado | Suficiente |
| 0-3.9 | Desaprobado | Insuficiente |

---

*Rúbrica desarrollada para el Profesorado Superior en Física - CONSUDEC*
`;

async function addRubricBioelectricidad(): Promise<void> {
  console.log('🌱 Agregando rúbrica: Bioelectricidad (Biofísica)...\n');

  try {
    const client = db();

    // Get an instructor user
    const usersResult = await client.execute(`
      SELECT id FROM User WHERE role = 'INSTRUCTOR' LIMIT 1
    `);

    if (usersResult.rows.length === 0) {
      throw new Error('No instructor found. Please create an instructor user first.');
    }

    const instructorId = (usersResult.rows[0] as unknown as { id: string }).id;
    const now = new Date().toISOString();
    const rubricId = `rubric-biofisica-bioelectricidad`;

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
    console.log('📝 Creating rubric: "Bioelectricidad"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Bioelectricidad',
        'Rúbrica para examen de Biofísica - Unidad 3: Ecuación de Nernst, potenciales de membrana y diagnóstico clínico',
        RUBRICA_BIOELECTRICIDAD,
        'Biofísica',
        'Parcial',
        1, // isActive
        instructorId,
        now,
        now,
      ],
    });

    console.log('✅ Rubric created successfully\n');

    // Verify creation
    console.log('🔍 Verifying rubric creation...');
    const verifyResult = await client.execute({
      sql: 'SELECT id, name, description, subject FROM Rubric WHERE id = ?',
      args: [rubricId],
    });

    if (verifyResult.rows.length > 0) {
      const rubric = verifyResult.rows[0] as unknown as { id: string; name: string; subject: string; description: string };
      console.log('✅ Rubric verified:');
      console.log(`   ID: ${rubric.id}`);
      console.log(`   Name: ${rubric.name}`);
      console.log(`   Subject: ${rubric.subject}`);
      console.log(`   Description: ${rubric.description}\n`);
    } else {
      throw new Error('❌ Rubric not found after creation');
    }

    console.log('🎉 Script completed successfully!\n');

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

addRubricBioelectricidad();
