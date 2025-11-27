/**
 * Script: Agregar Rúbrica de Equilibrio Químico
 *
 * Usage: npx tsx scripts/add-rubric-equilibrio-quimico.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_EQUILIBRIO_QUIMICO = `# RÚBRICA DE CORRECCIÓN
## Recuperatorio - Química: Equilibrio Químico
**Puntaje Total: 100 puntos**

**Colegio Santo Tomás de Aquino | Química - 5to Año**

---

**Instrucciones:** Esta rúbrica evalúa 2 ejercicios de equilibrio químico con 4 fases cada uno. Cada fase vale 12.5 puntos (50 pts por ejercicio).

**Contenidos Evaluados:**
- Constante de equilibrio Kc
- Tabla ICE (Inicial-Cambio-Equilibrio)
- Cociente de reacción Qc
- Predicción de la dirección del equilibrio

---

## EJERCICIO 1: Cálculo de Kc (50 pts)

**Contexto típico:** En un reactor de volumen V se introducen cantidades iniciales de reactivos. Al equilibrio, se conoce la concentración de una especie. Calcular Kc.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica: volumen, moles iniciales, concentración en equilibrio del producto/reactivo dado. Comprende que debe construir tabla ICE. | Identifica datos principales. Comprende la necesidad de tabla ICE. | Datos parciales. Idea vaga de cómo proceder. | No identifica datos clave o no comprende el equilibrio. |
| **F2: Identificación de Variables** | V (L), n iniciales (mol), [X]eq (M), [Y]₀ = n/V. Define "x" como avance de reacción según estequiometría. | Variables correctas con error menor. Define x pero con imprecisión. | Algunas variables. No define x o lo hace incorrectamente. | Variables incorrectas o ausentes. |
| **F3: Selección de Herramientas** | Tabla ICE completa. Kc = [productos]^coef / [reactivos]^coef. Relaciona x con dato de equilibrio dado. | Tabla ICE con error menor. Expresión de Kc correcta. | Tabla ICE incompleta. Expresión de Kc con errores en exponentes. | Sin tabla ICE o expresión de Kc incorrecta. |
| **F4: Estrategia y Ejecución** | Calcula x a partir del dato dado. Completa concentraciones de equilibrio. Calcula Kc correctamente con unidades apropiadas (o adimensional). | Procedimiento correcto con error de cálculo. Kc con error <30%. | Procedimiento reconocible con varios errores. Kc muy diferente. | Sin procedimiento o Kc completamente erróneo. |

**Subtotal Ejercicio 1: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Reacción: H₂(g) + I₂(g) ⇌ 2HI(g)
Datos: V = 5.00 L, n₀(H₂) = 0.50 mol, n₀(I₂) = 0.50 mol, [HI]eq = 0.16 M

Concentraciones iniciales:
[H₂]₀ = 0.50/5.00 = 0.10 M
[I₂]₀ = 0.50/5.00 = 0.10 M
[HI]₀ = 0 M

Tabla ICE:
           H₂    +    I₂    ⇌    2HI
I:        0.10       0.10         0
C:         -x         -x        +2x
E:      0.10-x     0.10-x       2x

Del dato: 2x = 0.16 M → x = 0.08 M

[H₂]eq = 0.10 - 0.08 = 0.02 M
[I₂]eq = 0.10 - 0.08 = 0.02 M
[HI]eq = 0.16 M

Kc = [HI]²/([H₂][I₂]) = (0.16)²/((0.02)(0.02)) = 0.0256/0.0004 = 64
\`\`\`

---

## EJERCICIO 2: Cálculo de Qc y Predicción de Dirección (50 pts)

**Contexto típico:** En un reactor se tienen cantidades conocidas de todas las especies. Dado Kc, determinar si el sistema está en equilibrio y, si no, hacia dónde evoluciona.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica: volumen, moles de cada especie, Kc dado. Comprende que debe comparar Qc con Kc para predecir dirección. | Identifica datos. Comprende que Qc indica si está en equilibrio. | Datos parciales. Idea vaga de Qc. | No identifica datos o no comprende Qc. |
| **F2: Identificación de Variables** | V (L), n de cada especie, [X] = n/V para cada una, Kc (dato). | Variables correctas con error menor en alguna concentración. | Algunas concentraciones correctas. | Concentraciones incorrectas o ausentes. |
| **F3: Selección de Herramientas** | Qc = [productos]^coef / [reactivos]^coef (misma forma que Kc). Criterio: Qc < Kc → productos; Qc > Kc → reactivos; Qc = Kc → equilibrio. | Expresión de Qc correcta. Criterio de comparación con alguna imprecisión. | Expresión de Qc con errores. Criterio incompleto. | Expresión incorrecta o sin criterio de comparación. |
| **F4: Estrategia y Ejecución** | Calcula todas las concentraciones, Qc correctamente. Compara con Kc y predice dirección con justificación clara. | Qc correcto con predicción correcta pero justificación incompleta. | Qc con errores pero predicción coherente con su cálculo. | Qc erróneo y/o predicción incorrecta sin justificación. |

**Subtotal Ejercicio 2: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Reacción: 2SO₂(g) + O₂(g) ⇌ 2SO₃(g)
Datos: V = 4.00 L, n(SO₂) = 1.6 mol, n(O₂) = 0.8 mol, n(SO₃) = 2.4 mol, Kc = 5.0

Concentraciones:
[SO₂] = 1.6/4.00 = 0.40 M
[O₂] = 0.8/4.00 = 0.20 M
[SO₃] = 2.4/4.00 = 0.60 M

Qc = [SO₃]²/([SO₂]²[O₂]) = (0.60)²/((0.40)²(0.20)) = 0.36/(0.16 × 0.20) = 0.36/0.032 = 11.25

Comparación: Qc = 11.25 > Kc = 5.0

Conclusión:
a) El sistema NO está en equilibrio
b) Como Qc > Kc, el sistema evoluciona hacia los REACTIVOS (izquierda)
\`\`\`

---

## CRITERIO DE COMPARACIÓN Qc vs Kc

| **Relación** | **Situación** | **Dirección** |
|--------------|---------------|---------------|
| Qc < Kc | Exceso de reactivos | → Hacia productos (derecha) |
| Qc = Kc | En equilibrio | Sin cambio neto |
| Qc > Kc | Exceso de productos | ← Hacia reactivos (izquierda) |

---

## ERRORES COMUNES A DETECTAR

| **Error** | **Penalización sugerida** |
|-----------|--------------------------|
| Olvidar elevar concentraciones a sus coeficientes | -3 pts en Fase 3 |
| Invertir la expresión (reactivos arriba) | -5 pts en Fase 3 |
| Error en conversión mol → M | -2 pts en Fase 2 |
| Conclusión opuesta a su cálculo de Qc | -4 pts en Fase 4 |
| No incluir unidades o incluirlas mal | -1 pt en Fase 4 |

---

## RESUMEN DE CALIFICACIÓN

| **Ejercicio** | **Puntaje obtenido** | **Puntaje máximo** |
|--------------|---------------------|-------------------|
| Ejercicio 1: Cálculo de Kc | | 50 |
| Ejercicio 2: Qc y Predicción | | 50 |
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

async function addRubricEquilibrioQuimico(): Promise<void> {
  console.log('🌱 Agregando rúbrica: Equilibrio Químico...\n');

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
    const rubricId = `rubric-quimica-equilibrio`;

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
    console.log('📝 Creating rubric: "Equilibrio Químico"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Equilibrio Químico',
        'Rúbrica para recuperatorio de Química - 5to Año: Constante Kc, Tabla ICE, Cociente Qc y predicción de dirección del equilibrio',
        RUBRICA_EQUILIBRIO_QUIMICO,
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

addRubricEquilibrioQuimico();
