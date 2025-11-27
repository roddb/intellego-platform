/**
 * Script: Agregar Rúbrica de Termodinámica (Física)
 *
 * Usage: npx tsx scripts/add-rubric-termodinamica.ts
 */

import { db } from '../src/lib/db';

const RUBRICA_TERMODINAMICA = `# RÚBRICA DE CORRECCIÓN
## Recuperatorio - Física: Termodinámica
**Puntaje Total: 100 puntos**

**Colegio Santo Tomás de Aquino | Física - 5to Año**

---

**Instrucciones:** Esta rúbrica evalúa 2 ejercicios de termodinámica con 4 fases cada uno. Cada fase vale 12.5 puntos (50 pts por ejercicio).

**Contenidos Evaluados:**
- Calor sensible (Q = m·c·ΔT)
- Relación potencia-energía-tiempo (P = E/t)
- Equilibrio térmico / Calorimetría (Q_cedido = Q_absorbido)

---

## EJERCICIO 1: Calor Sensible y Potencia (50 pts)

**Contexto típico:** Un calentador de potencia P calienta una masa m de material desde Ti hasta Tf. Calcular el tiempo necesario.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica: masa, temperaturas inicial y final, potencia del calentador, calor específico. Comprende que la energía del calentador se transforma en calor. | Identifica la mayoría de datos. Comprende la relación energía-calor pero con imprecisiones. | Identifica algunos datos. Confunde potencia con energía. | No identifica datos clave o confunde conceptos básicos. |
| **F2: Identificación de Variables** | m (kg), Ti (°C), Tf (°C), P (W o kW→W), c (J/kg·K), ΔT (K o °C), Q (J), t (s). Conversiones correctas. | Variables principales correctas. Error menor en unidades o conversiones. | Algunas variables correctas. Errores en conversiones (ej: kW a W). | Variables incorrectas o ausentes. Sin conversiones necesarias. |
| **F3: Selección de Herramientas** | Q = m·c·ΔT y P = E/t → t = Q/P. Justifica que ΔT = Tf - Ti y que Q = E. | Ecuaciones correctas con justificación incompleta. | Una ecuación correcta, falta la otra o mal combinadas. | Ecuaciones incorrectas o inaplicables. |
| **F4: Estrategia y Ejecución** | Calcula Q correctamente, despeja t = Q/P, obtiene resultado en segundos (puede convertir a minutos). Verifica orden de magnitud. | Procedimiento correcto con error de cálculo menor. Resultado con error <20%. | Procedimiento reconocible con varios errores. Resultado incorrecto. | Sin procedimiento claro o cálculos completamente erróneos. |

**Subtotal Ejercicio 1: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Datos: m = 0.4 kg, Ti = 20°C, Tf = 100°C, P = 1500 W, c = 900 J/(kg·K)

1. ΔT = 100 - 20 = 80 K
2. Q = m·c·ΔT = 0.4 × 900 × 80 = 28800 J
3. t = Q/P = 28800/1500 = 19.2 s
\`\`\`

---

## EJERCICIO 2: Equilibrio Térmico - Calorimetría (50 pts)

**Contexto típico:** Un cuerpo caliente se introduce en agua fría dentro de un recipiente aislado. Calcular la temperatura final de equilibrio.

| **Fase** | **Excelente (12.5-11 pts)** | **Bueno (10-8 pts)** | **Regular (7-5 pts)** | **Insuficiente (4-0 pts)** |
|----------|---------------------------|---------------------|----------------------|---------------------------|
| **F1: Comprensión del Problema** | Identifica los dos cuerpos, sus masas, temperaturas iniciales y calores específicos. Comprende que el calor cedido = calor absorbido en sistema aislado. | Identifica datos de ambos cuerpos. Comprende el principio de equilibrio con alguna imprecisión. | Datos parciales. Comprensión superficial del equilibrio térmico. | No identifica los dos sistemas o no comprende el equilibrio. |
| **F2: Identificación de Variables** | m₁, m₂ (kg), T₁, T₂ (°C), c₁, c₂ (J/kg·K), Tf (incógnita). Convierte L a kg si aplica (ρ_agua = 1 kg/L). | Variables correctas con error menor en alguna conversión. | Algunas variables correctas. Omite algún calor específico. | Variables incorrectas o muy incompletas. |
| **F3: Selección de Herramientas** | Q_cedido = Q_absorbido → m₁·c₁·(T₁-Tf) = m₂·c₂·(Tf-T₂). Justifica signos y direcciones de flujo de calor. | Ecuación correcta con justificación parcial de signos. | Ecuación parcialmente correcta. Confusión en signos. | Ecuación incorrecta o mal planteada. |
| **F4: Estrategia y Ejecución** | Despeja Tf correctamente: Tf = (m₁c₁T₁ + m₂c₂T₂)/(m₁c₁ + m₂c₂). Resultado coherente (entre T₁ y T₂). | Procedimiento correcto con error de cálculo. Resultado plausible. | Despeje incorrecto pero con idea del procedimiento. | Sin despeje o cálculos completamente erróneos. |

**Subtotal Ejercicio 2: _____ / 50 pts**

### Ejemplo de resolución esperada:

\`\`\`
Datos: m₁ = 2 kg (hierro), T₁ = 90°C, c₁ = 450 J/(kg·K)
       m₂ = 5 kg (agua), T₂ = 20°C, c₂ = 4186 J/(kg·K)

Planteamiento: m₁·c₁·(T₁-Tf) = m₂·c₂·(Tf-T₂)

2 × 450 × (90-Tf) = 5 × 4186 × (Tf-20)
900(90-Tf) = 20930(Tf-20)
81000 - 900Tf = 20930Tf - 418600
499600 = 21830Tf
Tf = 22.9°C
\`\`\`

---

## VERIFICACIÓN DE COHERENCIA

| **Aspecto** | **Verificación** |
|-------------|------------------|
| Ejercicio 1 | El tiempo debe ser positivo y del orden de segundos/minutos para calentadores domésticos |
| Ejercicio 2 | Tf debe estar ENTRE las temperaturas iniciales de ambos cuerpos |
| Unidades | Resultado final con unidades correctas (s, min, °C) |

---

## RESUMEN DE CALIFICACIÓN

| **Ejercicio** | **Puntaje obtenido** | **Puntaje máximo** |
|--------------|---------------------|-------------------|
| Ejercicio 1: Calor/Potencia | | 50 |
| Ejercicio 2: Equilibrio Térmico | | 50 |
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

async function addRubricTermodinamica(): Promise<void> {
  console.log('🌱 Agregando rúbrica: Termodinámica (Física)...\n');

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
    const rubricId = `rubric-fisica-termodinamica`;

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
    console.log('📝 Creating rubric: "Termodinámica"...');
    await client.execute({
      sql: `
        INSERT INTO Rubric (id, name, description, rubricText, subject, examType, isActive, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        rubricId,
        'Termodinámica',
        'Rúbrica para recuperatorio de Física - 5to Año: Calor sensible, potencia-energía-tiempo, equilibrio térmico y calorimetría',
        RUBRICA_TERMODINAMICA,
        'Física',
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

addRubricTermodinamica();
