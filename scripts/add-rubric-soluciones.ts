/**
 * Script: Agregar Rúbrica de Soluciones
 *
 * Usage: npx tsx scripts/add-rubric-soluciones.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_SOLUCIONES = `# RÚBRICA DE CORRECCIÓN
## Recuperatorio - Química: Soluciones
**Puntaje Total: 100 puntos**

**Colegio Santo Tomás de Aquino | Química - 5to Año**

---

**Instrucciones:** Esta rúbrica evalúa 2 ejercicios de soluciones con 4 fases cada uno. Cada fase vale 12.5 puntos (50 pts por ejercicio).

**Contenidos Evaluados:**
- Molaridad (M = n/V)
- Dilución (C₁V₁ = C₂V₂)
- Conversiones de unidades (g↔mol, mL↔L)

---

## EJERCICIO 1: Cálculo de Molaridad (50 pts)

**Contexto típico:** Se disuelve una masa de soluto en un volumen de solución. Calcular la molaridad.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica: masa de soluto, volumen de solución, masa molar. Comprende que molaridad = moles/litros de solución. | Identifica datos. Comprende molaridad con alguna imprecisión. | Datos parciales. Confunde soluto con solución o solvente. | No identifica datos o no comprende molaridad. |
| **F2: Identificación de Variables** | m_soluto (g), V_solución (L o mL→L), MM (g/mol), n = m/MM, M (mol/L). | Variables correctas con error menor en conversión de volumen. | Algunas variables. Error en conversión mL a L. | Variables incorrectas o ausentes. |
| **F3: Selección de Herramientas** | n = m/MM y M = n/V. Escribe ambas fórmulas correctamente y las combina: M = m/(MM·V). | Fórmulas correctas con notación imprecisa. | Una fórmula correcta, la otra con error. | Fórmulas incorrectas. |
| **F4: Estrategia y Ejecución** | Calcula n correctamente. Convierte V a litros si necesario. Calcula M con unidades (mol/L o M). | Procedimiento correcto con error de cálculo menor. | Procedimiento reconocible con errores. | Sin procedimiento o cálculos erróneos. |

**Subtotal Ejercicio 1: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Datos: m_glucosa = 45.0 g, V_solución = 500.0 mL, MM(glucosa) = 180.0 g/mol

Paso 1: Convertir volumen a litros
V = 500.0 mL = 0.500 L

Paso 2: Calcular moles de soluto
n = m/MM = 45.0 g / 180.0 g/mol = 0.250 mol

Paso 3: Calcular molaridad
M = n/V = 0.250 mol / 0.500 L = 0.50 M (o 0.50 mol/L)
\`\`\`

---

## EJERCICIO 2: Dilución (50 pts)

**Contexto típico:** Se tiene una solución concentrada y se desea preparar un volumen de solución diluida. Calcular el volumen de solución madre necesario.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica: C₁ (concentrada), C₂ (diluida), V₂ (volumen final deseado). Comprende que los moles de soluto se conservan en la dilución. | Identifica datos. Comprende dilución con alguna imprecisión. | Datos parciales. Comprensión superficial del proceso. | No identifica datos o no comprende dilución. |
| **F2: Identificación de Variables** | C₁ (M) = concentración inicial, V₁ (incógnita) = volumen a tomar, C₂ (M) = concentración final, V₂ = volumen final. Unidades consistentes. | Variables correctas con error menor. | Algunas variables. Confusión entre C₁ y C₂. | Variables incorrectas o incompletas. |
| **F3: Selección de Herramientas** | C₁V₁ = C₂V₂ (conservación de moles). Despeje correcto: V₁ = C₂V₂/C₁. | Ecuación correcta con despeje correcto. | Ecuación correcta pero despeje incorrecto. | Ecuación incorrecta. |
| **F4: Estrategia y Ejecución** | Sustituye valores correctamente. Calcula V₁ con unidades correctas. Resultado coherente (V₁ < V₂). | Procedimiento correcto con error de cálculo. | Procedimiento con errores pero idea correcta. | Sin procedimiento o resultado incoherente (V₁ > V₂). |

**Subtotal Ejercicio 2: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Datos: C₁ = 2.50 M (solución madre), C₂ = 0.50 M (solución diluida), V₂ = 250.0 mL

Planteamiento: C₁V₁ = C₂V₂

Despeje: V₁ = C₂V₂/C₁

Sustitución: V₁ = (0.50 M × 250.0 mL) / 2.50 M = 125.0 mL / 2.50 = 50.0 mL

Verificación:
- V₁ < V₂ ✓ (lógico: tomamos menos volumen del concentrado)
- n₁ = C₁V₁ = 2.50 × 0.050 = 0.125 mol
- n₂ = C₂V₂ = 0.50 × 0.250 = 0.125 mol ✓ (moles conservados)
\`\`\`

---

## PROCEDIMIENTO DE DILUCIÓN (Contexto práctico)

| **Paso** | **Acción en laboratorio** |
|----------|--------------------------|
| 1 | Calcular V₁ necesario |
| 2 | Medir V₁ de la solución concentrada con pipeta |
| 3 | Transferir a matraz aforado de capacidad V₂ |
| 4 | Agregar agua destilada hasta la marca de aforo |
| 5 | Homogeneizar |

---

## FÓRMULAS CLAVE

| **Concepto** | **Fórmula** | **Unidades** |
|--------------|-------------|--------------|
| Moles | n = m/MM | mol |
| Molaridad | M = n/V | mol/L o M |
| Molaridad directa | M = m/(MM·V) | mol/L |
| Dilución | C₁V₁ = C₂V₂ | (mol/L)(L) = (mol/L)(L) |

---

## CONVERSIONES IMPORTANTES

| **De** | **A** | **Factor** |
|--------|-------|------------|
| mL | L | ÷ 1000 |
| L | mL | × 1000 |
| g | mg | × 1000 |
| kg | g | × 1000 |

---

## VERIFICACIONES DE COHERENCIA

| **Ejercicio** | **Verificación** |
|---------------|------------------|
| Molaridad | M debe ser positiva y generalmente entre 0.001 y 18 M para soluciones acuosas comunes |
| Dilución | V₁ SIEMPRE < V₂ (se toma menos volumen del concentrado) |
| Dilución | C₁ SIEMPRE > C₂ (la solución madre es más concentrada) |

---

## ERRORES COMUNES A DETECTAR

| **Error** | **Penalización sugerida** |
|-----------|--------------------------|
| No convertir mL a L | -3 pts en Fase 2 |
| Confundir soluto con solución | -2 pts en Fase 1 |
| Invertir C₁ y C₂ en la fórmula | -4 pts en Fase 3 |
| V₁ > V₂ (resultado ilógico sin detectar) | -3 pts en Fase 4 |
| Olvidar unidades en resultado | -1 pt en Fase 4 |
| Error de cálculo aritmético | -2 pts en Fase 4 |

---

## RESUMEN DE CALIFICACIÓN

| **Ejercicio** | **Puntaje obtenido** | **Puntaje máximo** |
|--------------|---------------------|-------------------|
| Ejercicio 1: Molaridad | | 50 |
| Ejercicio 2: Dilución | | 50 |
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

*Instituto Santo Tomás de Aquino - 2025*
`;

async function addRubricSoluciones(): Promise<void> {
  console.log('🌱 Agregando rúbrica: Soluciones...\n');

  try {
    const client = db();

    // Get an instructor user
    const usersResult = await client.execute(`
      SELECT id FROM User WHERE role = 'INSTRUCTOR' LIMIT 1
    `);

    if (usersResult.rows.length === 0) {
      throw new Error('No instructor found. Please create an instructor user first.');
    }

    const instructorId = (usersResult.rows[0] as { id: string }).id;
    const now = new Date().toISOString();
    const rubricId = `rubric-quimica-soluciones`;

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
    console.log('📝 Creating rubric: "Soluciones"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Soluciones',
        'Rúbrica para recuperatorio de Química - 5to Año: Molaridad, dilución y conversiones de unidades',
        RUBRICA_SOLUCIONES,
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
      sql: 'SELECT id, name, description, subject FROM Rubric WHERE id = ?',
      args: [rubricId],
    });

    if (verifyResult.rows.length > 0) {
      const rubric = verifyResult.rows[0] as { id: string; name: string; subject: string; description: string };
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

addRubricSoluciones();
