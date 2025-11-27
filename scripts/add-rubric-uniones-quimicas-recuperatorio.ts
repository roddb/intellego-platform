/**
 * Script: Agregar Rúbrica de Uniones Químicas - Recuperatorio
 *
 * Usage: npx tsx scripts/add-rubric-uniones-quimicas-recuperatorio.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_UNIONES_QUIMICAS_RECUPERATORIO = `# RÚBRICA DE CORRECCIÓN
## Recuperatorio - Uniones Químicas
**Puntaje Total: 100 puntos**

**Colegio Santo Tomás de Aquino | Química - 4to Año**

---

**Instrucciones:** Marque el nivel alcanzado por el estudiante en cada criterio y sume los puntos.

---

## EJERCICIO 1: Estructuras de Lewis (50 pts)

**Moléculas evaluadas:** H₂O, NH₃, CO₂, CH₄

### Parte a) Estructuras de Lewis completas (40 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **H₂O (10 pts)** | **9-10 pts:** Estructura correcta con 2 enlaces O-H, 2 pares libres en O, 8 e⁻ totales. | **6-8 pts:** Estructura correcta pero falta 1 par libre o error menor de representación. | **3-5 pts:** Enlaces correctos pero pares libres incorrectos o ausentes. | **0-2 pts:** Estructura incorrecta o no comprende el concepto. |
| **NH₃ (10 pts)** | **9-10 pts:** Estructura correcta con 3 enlaces N-H, 1 par libre en N, 8 e⁻ totales. | **6-8 pts:** Estructura correcta pero falta el par libre o error menor. | **3-5 pts:** Enlaces correctos pero par libre incorrecto o ausente. | **0-2 pts:** Estructura incorrecta o no comprende el concepto. |
| **CO₂ (10 pts)** | **9-10 pts:** Estructura correcta con 2 dobles enlaces C=O, sin pares libres en C, 16 e⁻ totales. | **6-8 pts:** Dobles enlaces correctos pero error en pares libres de O. | **3-5 pts:** Solo enlaces simples o error en tipo de enlace. | **0-2 pts:** Estructura incorrecta o no comprende el concepto. |
| **CH₄ (10 pts)** | **9-10 pts:** Estructura correcta con 4 enlaces C-H, sin pares libres, 8 e⁻ totales. | **6-8 pts:** Estructura correcta con error menor de representación. | **3-5 pts:** Número incorrecto de enlaces o agrega pares libres inexistentes. | **0-2 pts:** Estructura incorrecta o no comprende el concepto. |

### Parte b) Electrones de valencia en NH₃ (10 pts)

| **Criterio** | **Excelente** | **Bueno** | **Regular** | **Insuficiente** |
|-------------|---------------|-----------|-------------|------------------|
| **Cálculo de e⁻ de valencia (10 pts)** | **9-10 pts:** Indica correctamente N=5 e⁻, H=1 e⁻ (×3), Total=8 e⁻. Cálculo completo y claro. | **6-8 pts:** Valores correctos pero presentación incompleta o sin mostrar suma. | **3-5 pts:** Error en uno de los valores o cálculo parcialmente correcto. | **0-2 pts:** No comprende el concepto de electrones de valencia o cálculo incorrecto. |

**Subtotal Ejercicio 1: _____ / 50 pts**

---

## EJERCICIO 2: Geometría Molecular - TRPECV (50 pts)

**Moléculas evaluadas:** H₂S, PH₃, CS₂, CCl₄

### Parte a) Dominios electrónicos (10 pts)

| **Molécula** | **Respuesta correcta** | **Puntaje** |
|--------------|------------------------|-------------|
| H₂S | Átomo central: S, Enlazantes: 2, No enlazantes: 2 | 2.5 pts |
| PH₃ | Átomo central: P, Enlazantes: 3, No enlazantes: 1 | 2.5 pts |
| CS₂ | Átomo central: C, Enlazantes: 2, No enlazantes: 0 | 2.5 pts |
| CCl₄ | Átomo central: C, Enlazantes: 4, No enlazantes: 0 | 2.5 pts |

**Criterio de evaluación:**
- **Completo (2.5 pts):** Los 3 datos correctos (átomo central, enlazantes, no enlazantes)
- **Parcial (1-2 pts):** 1-2 datos correctos
- **Incorrecto (0 pts):** Todos incorrectos

### Parte b) Geometría molecular (20 pts)

| **Molécula** | **Respuesta correcta** | **Puntaje** |
|--------------|------------------------|-------------|
| H₂S | Angular (o "forma de V") | 5 pts |
| PH₃ | Piramidal trigonal | 5 pts |
| CS₂ | Lineal | 5 pts |
| CCl₄ | Tetraédrica | 5 pts |

**Criterio de evaluación:**
- **Correcto (5 pts):** Geometría correcta con nombre preciso
- **Parcial (2-3 pts):** Descripción correcta pero terminología imprecisa
- **Incorrecto (0 pts):** Geometría incorrecta

### Parte c) Ángulos de enlace (20 pts)

| **Molécula** | **Respuesta correcta** | **Puntaje** |
|--------------|------------------------|-------------|
| H₂S | ~104.5° (aceptable: 104°-105° o "<109.5°") | 5 pts |
| PH₃ | ~107° (aceptable: 106°-108° o "<109.5°") | 5 pts |
| CS₂ | 180° | 5 pts |
| CCl₄ | 109.5° (aceptable: 109°-110°) | 5 pts |

**Criterio de evaluación:**
- **Correcto (5 pts):** Ángulo exacto o dentro del rango aceptable
- **Parcial (2-3 pts):** Ángulo aproximado con justificación coherente (ej: "menor a 109.5° por repulsión de pares libres")
- **Incorrecto (0 pts):** Ángulo incorrecto sin justificación válida

**Subtotal Ejercicio 2: _____ / 50 pts**

---

## RESUMEN DE CALIFICACIÓN

| **Ejercicio** | **Puntaje obtenido** | **Puntaje máximo** |
|--------------|---------------------|-------------------|
| Ejercicio 1: Estructuras de Lewis | | 50 |
| Ejercicio 2: Geometría Molecular (TRPECV) | | 50 |
| **TOTAL** | | **100** |

---

## Escala de Calificación

| **Puntaje** | **Nota** |
|------------|---------|
| 90-100 | 10 |
| 80-89 | 8-9 |
| 70-79 | 7 |
| 60-69 | 6 |
| 50-59 | 5 |
| 40-49 | 4 |
| 0-39 | 1-3 |

---

## Respuestas de Referencia

### Ejercicio 1 - Estructuras de Lewis

| **Molécula** | **e⁻ valencia totales** | **Enlaces** | **Pares libres** |
|--------------|------------------------|-------------|------------------|
| H₂O | 8 | 2 simples (O-H) | 2 en O |
| NH₃ | 8 | 3 simples (N-H) | 1 en N |
| CO₂ | 16 | 2 dobles (C=O) | 2 en cada O |
| CH₄ | 8 | 4 simples (C-H) | 0 |

### Ejercicio 2 - Geometría Molecular

| **Molécula** | **Dominios totales** | **Geometría electrónica** | **Geometría molecular** | **Ángulo** |
|--------------|---------------------|--------------------------|------------------------|-----------|
| H₂S | 4 | Tetraédrica | Angular | ~104.5° |
| PH₃ | 4 | Tetraédrica | Piramidal trigonal | ~107° |
| CS₂ | 2 | Lineal | Lineal | 180° |
| CCl₄ | 4 | Tetraédrica | Tetraédrica | 109.5° |

---

## Notas para el Corrector

- En estructuras de Lewis, aceptar notación de puntos o rayas para pares de electrones.
- Los ángulos pueden variar ligeramente según la fuente bibliográfica; aceptar rangos razonables.
- Si el estudiante justifica coherentemente un ángulo diferente basándose en repulsión de pares libres, considerar puntaje parcial.
- En geometría molecular, aceptar sinónimos (ej: "angular" = "forma de V" = "doblada").
`;

async function addRubricUnionesQuimicasRecuperatorio(): Promise<void> {
  console.log('🌱 Agregando rúbrica: Uniones Químicas - Recuperatorio...\n');

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
    const rubricId = `rubric-quimica-uniones-recuperatorio`;

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
    console.log('📝 Creating rubric: "Uniones Químicas - Recuperatorio"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Uniones Químicas - Recuperatorio',
        'Rúbrica para recuperatorio de Química - 4to Año: Estructuras de Lewis (H₂O, NH₃, CO₂, CH₄) y Geometría Molecular TRPECV (H₂S, PH₃, CS₂, CCl₄)',
        RUBRICA_UNIONES_QUIMICAS_RECUPERATORIO,
        'Química',
        'Recuperatorio',
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
      sql: 'SELECT id, name, description, subject, examType FROM Rubric WHERE id = ?',
      args: [rubricId],
    });

    if (verifyResult.rows.length > 0) {
      const rubric = verifyResult.rows[0] as unknown as { id: string; name: string; subject: string; examType: string; description: string };
      console.log('✅ Rubric verified:');
      console.log(`   ID: ${rubric.id}`);
      console.log(`   Name: ${rubric.name}`);
      console.log(`   Subject: ${rubric.subject}`);
      console.log(`   Exam Type: ${rubric.examType}`);
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

addRubricUnionesQuimicasRecuperatorio();
