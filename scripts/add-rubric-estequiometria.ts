/**
 * Script: Agregar Rúbrica de Estequiometría
 *
 * Usage: npx tsx scripts/add-rubric-estequiometria.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_ESTEQUIOMETRIA = `# RÚBRICA DE CORRECCIÓN
## Recuperatorio - Química: Estequiometría
**Puntaje Total: 100 puntos**

**Colegio Santo Tomás de Aquino | Química - 5to Año**

---

**Instrucciones:** Esta rúbrica evalúa 2 ejercicios de estequiometría con 4 fases cada uno. Cada fase vale 12.5 puntos (50 pts por ejercicio).

**Contenidos Evaluados:**
- Cálculos estequiométricos con pureza de reactivos
- Reactivo limitante
- Rendimiento de reacción

---

## EJERCICIO 1: Pureza de Reactivos (50 pts)

**Contexto típico:** Se tiene una muestra de reactivo con cierto porcentaje de pureza. Calcular la masa de producto que se puede obtener.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica: masa de muestra, % pureza, masas molares, ecuación balanceada. Comprende que solo el % puro reacciona. | Identifica datos principales. Comprende el concepto de pureza. | Datos parciales. Comprensión superficial de pureza. | No identifica datos o no comprende pureza. |
| **F2: Identificación de Variables** | m_muestra (g), % pureza, m_pura = m_muestra × %/100, MM (g/mol), n = m/MM. | Variables correctas con error menor. | Algunas variables. Error en cálculo de masa pura. | Variables incorrectas o sin considerar pureza. |
| **F3: Selección de Herramientas** | Relación estequiométrica mol:mol de ecuación balanceada. Conversión g→mol→mol→g. | Relación estequiométrica correcta con algún error en el camino de conversión. | Relación parcialmente correcta. Camino de conversión incompleto. | Sin relación estequiométrica o incorrecta. |
| **F4: Estrategia y Ejecución** | Calcula masa pura, moles de reactivo, moles de producto (por estequiometría), masa de producto. Resultado con unidades. | Procedimiento correcto con error de cálculo. Resultado cercano. | Procedimiento reconocible con varios errores. | Sin procedimiento o cálculos erróneos. |

**Subtotal Ejercicio 1: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Reacción: CaCO₃(s) → CaO(s) + CO₂(g)
Datos: m_muestra = 250.0 g, pureza = 80.0%, MM(CaCO₃) = 100.0 g/mol, MM(CaO) = 56.0 g/mol

Paso 1: Masa pura de CaCO₃
m_pura = 250.0 × (80.0/100) = 200.0 g

Paso 2: Moles de CaCO₃
n(CaCO₃) = 200.0 g / 100.0 g/mol = 2.00 mol

Paso 3: Moles de CaO (relación 1:1)
n(CaO) = 2.00 mol

Paso 4: Masa de CaO
m(CaO) = 2.00 mol × 56.0 g/mol = 112.0 g
\`\`\`

---

## EJERCICIO 2: Reactivo Limitante y Rendimiento (50 pts)

**Contexto típico:** Se mezclan cantidades conocidas de dos reactivos. Determinar el reactivo limitante y la masa real de producto considerando el rendimiento.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica: masas de ambos reactivos, masas molares, % rendimiento, ecuación balanceada. Comprende que el limitante determina el producto teórico. | Identifica datos. Comprende reactivo limitante pero con imprecisiones. | Datos parciales. Idea vaga de limitante. | No identifica datos o no comprende limitante. |
| **F2: Identificación de Variables** | m₁, m₂ (g), MM₁, MM₂, MM_producto, n₁ = m₁/MM₁, n₂ = m₂/MM₂, % rendimiento. | Variables correctas con error menor. | Algunas variables correctas. | Variables muy incompletas. |
| **F3: Selección de Herramientas** | Comparar n₁/coef₁ vs n₂/coef₂ (el menor es limitante). Producto teórico por estequiometría. Producto real = teórico × %rendimiento/100. | Método de comparación correcto. Fórmula de rendimiento con imprecisión. | Método parcial para identificar limitante. | Sin método claro o fórmulas incorrectas. |
| **F4: Estrategia y Ejecución** | Identifica limitante correctamente. Calcula producto teórico. Aplica rendimiento. Resultado final con unidades. | Limitante correcto, error en cálculo de producto o rendimiento. | Limitante incorrecto pero procedimiento coherente. | Sin identificación de limitante o cálculos erróneos. |

**Subtotal Ejercicio 2: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Reacción: 2Na(s) + Cl₂(g) → 2NaCl(s)
Datos: m(Na) = 46.0 g, m(Cl₂) = 71.0 g, rendimiento = 90.0%
       MM(Na) = 23.0 g/mol, MM(Cl₂) = 71.0 g/mol, MM(NaCl) = 58.5 g/mol

Paso 1: Moles de cada reactivo
n(Na) = 46.0/23.0 = 2.00 mol
n(Cl₂) = 71.0/71.0 = 1.00 mol

Paso 2: Identificar reactivo limitante
Según estequiometría: 2 mol Na : 1 mol Cl₂
n(Na)/2 = 2.00/2 = 1.00
n(Cl₂)/1 = 1.00/1 = 1.00
→ Están en proporción exacta (o cualquiera es limitante)

Paso 3: Producto teórico (usando Na como referencia)
n(NaCl)_teórico = 2.00 mol (relación 2:2 con Na)
m(NaCl)_teórico = 2.00 × 58.5 = 117.0 g

Paso 4: Producto real
m(NaCl)_real = 117.0 × (90.0/100) = 105.3 g
\`\`\`

---

## MÉTODO PARA IDENTIFICAR REACTIVO LIMITANTE

Para una reacción: aA + bB → productos

| **Paso** | **Acción** |
|----------|------------|
| 1 | Calcular n(A) y n(B) |
| 2 | Calcular n(A)/a y n(B)/b |
| 3 | El MENOR valor indica el reactivo limitante |
| 4 | Usar el limitante para calcular producto teórico |

---

## FÓRMULAS CLAVE

| **Concepto** | **Fórmula** |
|--------------|-------------|
| Masa pura | m_pura = m_muestra × (%pureza/100) |
| Moles | n = m/MM |
| Masa | m = n × MM |
| Rendimiento | m_real = m_teórico × (%rendimiento/100) |
| % Rendimiento | %R = (m_real/m_teórico) × 100 |

---

## ERRORES COMUNES A DETECTAR

| **Error** | **Penalización sugerida** |
|-----------|--------------------------|
| No aplicar el porcentaje de pureza | -5 pts en Fase 1 o 2 |
| Usar la masa total en vez de la masa pura | -4 pts en Fase 4 |
| Identificar mal el reactivo limitante | -4 pts en Fase 4 |
| Olvidar aplicar el rendimiento | -3 pts en Fase 4 |
| Invertir coeficientes estequiométricos | -3 pts en Fase 3 |
| Error en conversión de unidades | -2 pts donde ocurra |

---

## RESUMEN DE CALIFICACIÓN

| **Ejercicio** | **Puntaje obtenido** | **Puntaje máximo** |
|--------------|---------------------|-------------------|
| Ejercicio 1: Pureza | | 50 |
| Ejercicio 2: Limitante + Rendimiento | | 50 |
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

async function addRubricEstequiometria(): Promise<void> {
  console.log('🌱 Agregando rúbrica: Estequiometría...\n');

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
    const rubricId = `rubric-quimica-estequiometria`;

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
    console.log('📝 Creating rubric: "Estequiometría"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Estequiometría',
        'Rúbrica para recuperatorio de Química - 5to Año: Pureza de reactivos, reactivo limitante y rendimiento de reacción',
        RUBRICA_ESTEQUIOMETRIA,
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

addRubricEstequiometria();
