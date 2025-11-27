/**
 * Script: Agregar Rúbrica de Uniones Químicas
 *
 * Usage: npx tsx scripts/add-rubric-uniones-quimicas.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_UNIONES_QUIMICAS = `# RÚBRICA DE CORRECCIÓN
## Examen - Uniones Químicas
**Puntaje Total: 100 puntos**

**Colegio Santo Tomás de Aquino | Química - 4to Año**

---

**Instrucciones:** Esta rúbrica es válida para los 4 temas del examen. Marque el nivel alcanzado por el estudiante en cada criterio y sume los puntos.

---

## EJERCICIO 1: Símbolos de Lewis (25 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **Símbolos de Lewis (10 pts)** | **9-10 pts:** Los 5 símbolos correctos con número exacto de e⁻ y distribución adecuada. Cargas indicadas. | **6-8 pts:** 3-4 símbolos correctos. Errores menores de distribución. | **3-5 pts:** 1-2 símbolos correctos. Errores en número de e⁻ o cargas. | **0-2 pts:** Mayoría incorrectos o no entiende concepto de Lewis. |
| **Justificación formación ion (7.5 pts)** | **7-7.5 pts:** Menciona grupo/config. electrónica + tendencia a perder/ganar e⁻ + estabilidad del octeto. Respuesta completa y clara. | **5-6.5 pts:** Menciona 2 de los 3 elementos clave. Idea correcta pero incompleta. | **2.5-4.5 pts:** Menciona solo 1 elemento o justificación confusa pero con idea correcta. | **0-2 pts:** Justificación incorrecta o no responde. |
| **Gas noble isoelectrónico (7.5 pts)** | **7-7.5 pts:** Identifica gas noble correcto Y justifica con número de e⁻ o config. electrónica. | **5-6.5 pts:** Gas noble correcto pero justificación incompleta o poco clara. | **2.5-4.5 pts:** Gas noble correcto sin justificación. | **0-2 pts:** Gas noble incorrecto o no responde. |

**Subtotal Ejercicio 1: _____ / 25 pts**

---

## EJERCICIO 2: Tipo de Enlace (15 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **Clasificación de enlaces (10 pts)** | **9-10 pts:** Los 5 compuestos clasificados correctamente (iónico, covalente polar o no polar). | **7-8 pts:** 4 compuestos correctos. Un error menor. | **4-6 pts:** 2-3 compuestos correctos. | **0-3 pts:** 0-1 correcto o no entiende criterios de clasificación. |
| **Cálculo ΔEN (5 pts)** | **5 pts:** Calcula ΔEN para los 5 compuestos correctamente y justifica clasificación. | **3-4 pts:** 3-4 cálculos correctos con justificación. | **1-2 pts:** 1-2 cálculos correctos o cálculos sin justificación. | **0 pts:** No calcula ΔEN o todos incorrectos. |

**Subtotal Ejercicio 2: _____ / 15 pts**

---

## EJERCICIO 3: Estructuras de Lewis (20 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **Estructuras Lewis completas (20 pts)** | **18-20 pts:** Las 4 estructuras correctas: e⁻ totales, enlaces (simples/dobles/triples) y pares libres bien ubicados. | **13-17 pts:** 3 estructuras correctas o 4 con errores menores (faltan pares libres). | **7-12 pts:** 2 estructuras correctas o errores de octeto/enlaces. | **0-6 pts:** 0-1 correcta o no comprende cómo dibujar estructuras Lewis. |

**Subtotal Ejercicio 3: _____ / 20 pts**

---

## EJERCICIO 4: Geometría Molecular (20 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **Dominios electrónicos (4 pts)** | **4 pts:** Cuenta correctamente dominios para las 4 moléculas. | **3 pts:** 3 correctos. | **2 pts:** 2 correctos. | **0-1 pts:** 0-1 correcto. |
| **Geometría TRPECV (12 pts)** | **11-12 pts:** Identifica correctamente geometría de las 4 moléculas según TRPECV. | **8-10 pts:** 3 geometrías correctas. | **5-7 pts:** 2 geometrías correctas. | **0-4 pts:** 0-1 correcta o no comprende TRPECV. |
| **Ángulos de enlace (4 pts)** | **4 pts:** Los 4 ángulos aproximados correctos (±5°). | **3 pts:** 3 ángulos correctos. | **2 pts:** 2 ángulos correctos. | **0-1 pts:** 0-1 correcto. |

**Subtotal Ejercicio 4: _____ / 20 pts**

---

## EJERCICIO 5: Polaridad Molecular (10 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **Clasificación polar/apolar (4 pts)** | **4 pts:** Clasifica correctamente las 2 moléculas. | **3 pts:** 1 correcta. | **0-2 pts:** Ninguna correcta. | --- |
| **Justificación (6 pts)** | **5-6 pts:** Menciona geometría + distribución de cargas/simetría + momento dipolar resultante para ambas moléculas. | **3-4 pts:** Justifica con 2 elementos clave o justificación completa solo para 1 molécula. | **1-2 pts:** Justificación superficial (solo 1 elemento) o confusa. | **0 pts:** No justifica o justificación incorrecta. |

**Subtotal Ejercicio 5: _____ / 10 pts**

---

## EJERCICIO 6: Fuerzas Intermoleculares (10 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **Identificación fuerzas (10 pts)** | **9-10 pts:** Identifica correctamente tipo principal de fuerza para las 3 sustancias. Menciona London cuando aplica. | **6-8 pts:** 2 sustancias correctas o 3 con identificación parcial (falta London). | **3-5 pts:** 1 sustancia correcta o confunde fuerzas. | **0-2 pts:** No identifica correctamente o no comprende tipos de fuerzas. |

**Subtotal Ejercicio 6: _____ / 10 pts**

---

## RESUMEN DE CALIFICACIÓN

| **Ejercicio** | **Puntaje obtenido** | **Puntaje máximo** |
|--------------|---------------------|-------------------|
| Ejercicio 1: Símbolos de Lewis | | 25 |
| Ejercicio 2: Tipo de Enlace | | 15 |
| Ejercicio 3: Estructuras de Lewis | | 20 |
| Ejercicio 4: Geometría Molecular | | 20 |
| Ejercicio 5: Polaridad Molecular | | 10 |
| Ejercicio 6: Fuerzas Intermoleculares | | 10 |
| **TOTAL** | | **100** |

---

## Escala de Calificación

| **Puntaje** | **Nota** |
|------------|---------|
| 90-100 | 9-10 |
| 80-89 | 8 |
| 70-79 | 7 |
| 60-69 | 6 |
| 50-59 | 5 |
| 40-49 | 4 |
| 0-39 | 1-3 |

---

## Notas

**Referencia rápida - Fuerzas Intermoleculares:**

- **Puente H:** H unido a N, O o F (H₂O, NH₃, HF)
- **Dipolo-dipolo:** Moléculas polares sin puente H (HCl, H₂S, PH₃, HBr)
- **London:** Todas las moléculas, única fuerza en apolares (N₂, CO₂, CH₄, CCl₄, Br₂)
`;

async function addRubricUnionesQuimicas() {
  console.log('🌱 Agregando rúbrica: Uniones Químicas...\n');

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
    const rubricId = `rubric-uniones-quimicas`;

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
    console.log('📝 Creating rubric: "Uniones Químicas"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Uniones Químicas',
        'Rúbrica para examen de Uniones Químicas - 4to Año: Símbolos de Lewis, Tipos de Enlace, Estructuras Lewis, Geometría Molecular (TRPECV), Polaridad, Fuerzas Intermoleculares',
        RUBRICA_UNIONES_QUIMICAS,
        'Química',
        'Examen Teórico-Práctico',
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
      const rubric = verifyResult.rows[0] as any;
      console.log('✅ Rubric verified:');
      console.log(`   ID: ${rubric.id}`);
      console.log(`   Name: ${rubric.name}`);
      console.log(`   Subject: ${rubric.subject}`);
      console.log(`   Description: ${rubric.description}\n`);
    } else {
      throw new Error('❌ Rubric not found after creation');
    }

    console.log('🎉 Script completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Refresh the evaluation page');
    console.log('2. You should now see 2 rubrics in the dropdown');
    console.log('3. Test evaluating the same exam with both rubrics\n');

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

addRubricUnionesQuimicas();
