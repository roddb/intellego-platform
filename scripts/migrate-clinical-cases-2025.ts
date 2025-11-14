/**
 * Script de Migración: Reemplazo completo de casos clínicos CONSUDEC
 *
 * Estrategia:
 * 1. Archivar todos los casos clínicos existentes (soft delete)
 * 2. Crear 3 nuevos casos clínicos con evaluación automática de IA:
 *    - Caso 1: Hipocalemia (6 preguntas)
 *    - Caso 2: Esclerosis Múltiple (14 preguntas)
 *    - Caso 3: Lambert-Eaton (21 preguntas)
 *
 * Run: npx tsx scripts/migrate-clinical-cases-2025.ts
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing Turso credentials in .env');
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(): string {
  return 'act_' + Math.random().toString(36).substring(2, 15);
}

function generateQuestionId(): string {
  return 'q_' + Math.random().toString(36).substring(2, 15);
}

function getCurrentISODate(): string {
  return new Date().toISOString();
}

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function archiveExistingClinicalCases(): Promise<number> {
  console.log('\n📦 Archivando casos clínicos existentes...');

  try {
    // Primero listar casos existentes
    const existing = await db.execute(
      `SELECT id, title, status FROM ConsudecActivity
       WHERE activityType = 'clinical' AND status = 'active'`
    );

    if (existing.rows.length === 0) {
      console.log('✅ No hay casos clínicos activos para archivar');
      return 0;
    }

    console.log(`📋 Encontrados ${existing.rows.length} casos clínicos activos:`);
    existing.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.title}`);
    });

    // Archivar (soft delete)
    const now = getCurrentISODate();
    const result = await db.execute({
      sql: `UPDATE ConsudecActivity
            SET status = ?, updatedAt = ?
            WHERE activityType = ? AND status = ?`,
      args: ['archived', now, 'clinical', 'active'],
    });

    console.log(`✅ Archivados ${existing.rows.length} casos clínicos\n`);
    return existing.rows.length;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error archivando casos clínicos:', error.message);
    }
    throw error;
  }
}

async function getInstructorId(): Promise<string> {
  // Buscar primer instructor en la BD
  const result = await db.execute(
    "SELECT id FROM User WHERE role = 'INSTRUCTOR' LIMIT 1"
  );

  if (result.rows.length === 0) {
    throw new Error('No se encontró ningún instructor en la base de datos');
  }

  const instructorId = result.rows[0].id as string;
  console.log(`👤 Usando instructor ID: ${instructorId}\n`);
  return instructorId;
}

async function createClinicalCase(
  activity: any,
  instructorId: string
): Promise<void> {
  const now = getCurrentISODate();

  try {
    await db.execute({
      sql: `INSERT INTO ConsudecActivity (
        id, title, description, caseText, questions, subject, difficulty, estimatedTime,
        activityType, status, availableFrom, availableUntil, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        activity.id,
        activity.title,
        activity.description,
        activity.caseText,
        JSON.stringify(activity.questions),
        activity.subject,
        activity.difficulty,
        activity.estimatedTime,
        activity.activityType,
        activity.status,
        activity.availableFrom,
        activity.availableUntil,
        instructorId,
        now,
        now,
      ],
    });

    console.log(`✅ Creado: ${activity.title}`);
    console.log(`   - ${activity.questions.length} preguntas`);
    console.log(`   - Tiempo estimado: ${activity.estimatedTime} min\n`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Error creando caso clínico:`, error.message);
    }
    throw error;
  }
}

// ============================================
// CASO 1: HIPOCALEMIA
// ============================================

function createCaso1Hipocalemia(): any {
  return {
    id: generateId(),
    title: 'Caso Clínico 1: Debilidad Muscular y Arritmias (Hipocalemia)',
    description: 'Análisis bioeléctrico de un caso de hipocalemia inducida por diuréticos. Incluye cálculos de potencial de Nernst e interpretación fisiopatológica.',
    caseText: `**PRESENTACIÓN DEL CASO**

María, una mujer de 52 años con antecedentes de hipertensión arterial, consulta al servicio de urgencias por debilidad muscular progresiva de 3 días de evolución. La paciente refiere que la debilidad comenzó en los miembros inferiores y se ha extendido a los superiores, dificultando actividades cotidianas como subir escaleras o levantar objetos. Además, menciona episodios de palpitaciones irregulares que la alarman, especialmente durante el reposo nocturno.

En el interrogatorio dirigido, María comenta que viene tomando furosemida (un diurético) desde hace 6 meses para controlar su presión arterial, pero reconoce que no ha realizado controles de laboratorio recientes. También refiere episodios ocasionales de calambres musculares y sensación de hormigueo en las extremidades.

Al examen físico se observa una paciente lúcida y orientada, con presión arterial de 145/90 mmHg y frecuencia cardíaca de 88 latidos por minuto con ritmo irregular. La evaluación neurológica revela hiporreflexia generalizada (reflejos osteotendinosos disminuidos) y debilidad muscular proximal simétrica, con fuerza muscular 3/5 en miembros inferiores y 4/5 en miembros superiores. No se observan alteraciones sensitivas. El electrocardiograma muestra ondas U prominentes y aplanamiento de las ondas T, hallazgos característicos de alteraciones en la repolarización cardíaca.

### Datos de Laboratorio

Se solicita un ionograma completo, cuyos resultados son los siguientes:

| Ion | Concentración Plasmática | Valores Normales |
|-----|-------------------------|------------------|
| **K⁺** | **2.1 mEq/L** | 3.5 - 5.0 mEq/L |
| **Na⁺** | 138 mEq/L | 135 - 145 mEq/L |
| **Ca²⁺** | 9.5 mg/dL | 8.5 - 10.5 mg/dL |
| **Cl⁻** | 98 mEq/L | 95 - 105 mEq/L |

**Nota importante:** Se asume que las concentraciones intracelulares de K⁺ permanecen relativamente estables debido a la acción de la bomba Na⁺/K⁺-ATPasa, con un valor intracelular aproximado de **140 mEq/L** para K⁺ (valor fisiológico normal).`,
    subject: 'Bioelectricidad',
    difficulty: 'medium',
    estimatedTime: 60,
    activityType: 'clinical' as const,
    status: 'active' as const,
    availableFrom: getCurrentISODate(),
    availableUntil: null,
    questions: [
      // PREGUNTA 1.1: Cálculo E_K normal
      {
        id: generateQuestionId(),
        text: 'Utilizando la ecuación de Nernst, calcule el potencial de equilibrio del ion potasio (E_K) en condiciones fisiológicas normales. Considere [K⁺]ext = 4.5 mEq/L, [K⁺]int = 140 mEq/L. Use la ecuación: $$E_K = 61.5 \\times \\log_{10}\\left(\\frac{[K^+]_{ext}}{[K^+]_{int}}\\right)$$ Desarrolle el cálculo completo y exprese el resultado en mV.',
        placeholder: 'Muestre el cálculo paso a paso con unidades. Ejemplo: E_K = 61.5 × log10(4.5/140) = ...',
        wordLimit: 150,
        questionType: 'calculation' as const,
        expectedFormula: 'E_K = 61.5 × log10([K+]ext / [K+]int)',
        correctAnswer: -90.5,
        expectedUnit: 'mV',
        tolerancePercentage: 5,
        rubric: {
          excellent: 'Cálculo correcto con resultado -90.5 mV (±4.5 mV). Muestra fórmula de Nernst, sustitución de valores, cálculo del logaritmo y resultado final con unidades. Interpreta el signo negativo como potencial de reposo negativo.',
          good: 'Resultado numérico correcto (-90.5 mV) con fórmula presente y unidades correctas. Método claro aunque falte algún paso intermedio.',
          satisfactory: 'Método correcto aplicando ecuación de Nernst, pero con error aritmético menor (resultado dentro de ±10 mV del valor correcto). Fórmula identificada correctamente.',
          insufficient: 'Fórmula incorrecta, cálculo erróneo o resultado fuera del rango aceptable. No identifica la ecuación de Nernst o confunde concentraciones intra/extracelulares.',
        },
      },
      // PREGUNTA 1.2: Cálculo E_K en hipocalemia
      {
        id: generateQuestionId(),
        text: 'Ahora calcule el potencial de equilibrio del K⁺ (E_K) en las condiciones actuales de la paciente María con [K⁺]ext = 2.1 mEq/L (hipocalemia) y [K⁺]int = 140 mEq/L. Use la misma ecuación de Nernst. Desarrolle el cálculo completo y exprese el resultado en mV.',
        placeholder: 'E_K = 61.5 × log10(2.1/140) = ...',
        wordLimit: 150,
        questionType: 'calculation' as const,
        expectedFormula: 'E_K = 61.5 × log10([K+]ext / [K+]int)',
        correctAnswer: -110.8,
        expectedUnit: 'mV',
        tolerancePercentage: 5,
        rubric: {
          excellent: 'Cálculo correcto con resultado -110.8 mV (±5.5 mV). Sustitución correcta de [K⁺]ext = 2.1 mEq/L, cálculo del logaritmo negativo más pronunciado, resultado con unidades. Nota que el potencial es más negativo que el normal.',
          good: 'Resultado correcto con método claro. Identifica que la disminución de [K⁺]ext hace el potencial más negativo.',
          satisfactory: 'Método correcto pero error aritmético (resultado dentro de ±12 mV). Fórmula aplicada correctamente aunque el cálculo final sea inexacto.',
          insufficient: 'Error en sustitución de valores, cálculo incorrecto o no reconoce que el potencial debe ser más negativo que en condiciones normales.',
        },
      },
      // PREGUNTA 1.3: Cálculo ΔE_K
      {
        id: generateQuestionId(),
        text: 'Calcule la variación (ΔE_K) entre el potencial de equilibrio del K⁺ normal y el potencial de equilibrio del K⁺ en la condición patológica de la paciente: $$\\Delta E_K = E_K(\\text{hipocalemia}) - E_K(\\text{normal})$$ Desarrolle el cálculo y explique qué significa el signo del resultado (positivo o negativo).',
        placeholder: 'ΔE_K = (-110.8) - (-90.5) = ... mV. El signo negativo indica que...',
        wordLimit: 200,
        questionType: 'calculation' as const,
        expectedFormula: 'ΔE_K = E_K(hipocalemia) - E_K(normal)',
        correctAnswer: -20.3,
        expectedUnit: 'mV',
        tolerancePercentage: 5,
        rubric: {
          excellent: 'Cálculo correcto: ΔE_K = -20.3 mV (±1 mV). Explica que el signo negativo indica una HIPERPOLARIZACIÓN (potencial más negativo), alejando la membrana del umbral de disparo y reduciendo la excitabilidad celular.',
          good: 'Resultado numérico correcto con interpretación del signo negativo como hiperpolarización o cambio hacia valores más negativos.',
          satisfactory: 'Cálculo correcto pero interpretación incompleta del significado clínico del cambio. Identifica que hay una variación pero no relaciona con excitabilidad.',
          insufficient: 'Error en el cálculo (ej: invierte signos), no interpreta el resultado o confunde hiperpolarización con despolarización.',
        },
      },
      // PREGUNTA 2.1: Efecto sobre potencial de reposo
      {
        id: generateQuestionId(),
        text: 'Según la ecuación de Goldman-Hodgkin-Katz (GHK), el potencial de reposo de la membrana (V_m) depende principalmente de la permeabilidad al K⁺ en condiciones de reposo, siendo muy similar al E_K. Basándose en su cálculo de ΔE_K, ¿cómo se modificó el potencial de reposo de las células musculares de la paciente? Describa si la membrana se encuentra más polarizada (hiperpolarizada) o menos polarizada (despolarizada) respecto a la situación normal. Fundamente su respuesta mencionando los valores calculados.',
        placeholder: 'El potencial de reposo se modificó de aproximadamente -90 mV a aproximadamente -110 mV, lo que indica que la membrana está...',
        wordLimit: 250,
        questionType: 'text' as const,
        rubric: {
          excellent: 'Identifica hiperpolarización correcta: V_m pasa de ~-90 mV a ~-110 mV (más negativo). Explica que esto aleja la membrana del umbral de disparo (~-55 mV), reduciendo la excitabilidad. Menciona que la relación [K⁺]ext/[K⁺]int disminuyó. Fundamentación con valores numéricos calculados.',
          good: 'Identifica hiperpolarización (potencial más negativo) con fundamento en los cálculos previos. Relaciona con excitabilidad reducida aunque no mencione valores específicos de umbral.',
          satisfactory: 'Menciona que el potencial de reposo se hace más negativo (hiperpolarización) pero sin explicación detallada de las consecuencias sobre excitabilidad. Fundamentación parcial.',
          insufficient: 'Confunde hiperpolarización con despolarización, no relaciona con valores calculados, o respuesta genérica sin fundamento bioeléctrico específico.',
        },
      },
      // PREGUNTA 2.2: Excitabilidad celular
      {
        id: generateQuestionId(),
        text: 'La excitabilidad celular depende de la distancia entre el potencial de reposo (V_m) y el umbral de disparo (V_umbral ≈ -55 mV). Cuando esta distancia aumenta, la célula se vuelve menos excitable porque requiere un estímulo más intenso para alcanzar el umbral. Explique por qué la hiperpolarización causada por la hipocalemia reduce la excitabilidad de las células musculares, relacionándolo con la dificultad de alcanzar el umbral de disparo del potencial de acción. ¿Cómo se manifiesta clínicamente esta reducción de excitabilidad en la paciente María?',
        placeholder: 'La hiperpolarización aumenta la distancia entre V_m (~-110 mV) y V_umbral (~-55 mV), requiriendo mayor despolarización para alcanzar el umbral. Clínicamente esto se manifiesta como...',
        wordLimit: 300,
        questionType: 'text' as const,
        rubric: {
          excellent: 'Explica que la distancia (V_umbral - V_m) aumentó de ~35 mV a ~55 mV, requiriendo mayor corriente despolarizante. Relaciona con debilidad muscular proximal (fuerza 3/5), hiporreflexia y dificultad para actividades motoras. Conecta mecanismo bioeléctrico con síntomas clínicos específicos de María.',
          good: 'Identifica que la mayor distancia al umbral reduce excitabilidad. Menciona manifestaciones clínicas como debilidad muscular, aunque sin cuantificar la diferencia en mV.',
          satisfactory: 'Menciona concepto de excitabilidad reducida por hiperpolarización. Identifica debilidad muscular pero sin conexión detallada entre mecanismo y síntomas.',
          insufficient: 'No explica la relación entre distancia al umbral y excitabilidad, o no menciona manifestaciones clínicas relevantes del caso.',
        },
      },
      // PREGUNTA 2.3: Repolarización cardíaca
      {
        id: generateQuestionId(),
        text: 'En el músculo cardíaco, el K⁺ juega un papel crucial en la fase de repolarización del potencial de acción cardíaco (fase 3), donde los canales de K⁺ voltaje-dependientes se abren permitiendo la salida de K⁺ hacia el extracelular. Cuando la concentración extracelular de K⁺ está disminuida (hipocalemia), la fuerza impulsora para la salida de K⁺ durante la repolarización se ve alterada. Explique cómo esto afecta la duración del potencial de acción cardíaco y relacione este fenómeno con las ondas U prominentes y el aplanamiento de las ondas T observadas en el electrocardiograma de María.',
        placeholder: 'La disminución de [K⁺]ext reduce el gradiente de concentración, enlenteciendo la salida de K⁺ durante la fase 3 de repolarización. Esto prolonga el potencial de acción cardíaco, manifestándose en el ECG como...',
        wordLimit: 300,
        questionType: 'text' as const,
        rubric: {
          excellent: 'Explica que la menor [K⁺]ext reduce la fuerza impulsora (gradiente electroquímico) para la salida de K⁺. La repolarización se enlentece, prolongando la duración del potencial de acción (intervalo QT prolongado). Relaciona con ondas U prominentes (repolarización tardía de células de Purkinje) y ondas T aplanadas (repolarización ventricular lenta). Conexión fisiopatológica clara.',
          good: 'Identifica que la hipocalemia enlentece la repolarización cardíaca prolongando el potencial de acción. Menciona hallazgos ECG (ondas U, ondas T aplanadas) aunque sin detallar el mecanismo iónico.',
          satisfactory: 'Menciona alteración de la repolarización cardíaca por hipocalemia. Identifica hallazgos ECG pero sin explicación detallada del mecanismo bioeléctrico subyacente.',
          insufficient: 'No conecta la hipocalemia con alteraciones de repolarización, o no relaciona con hallazgos electrocardiográficos específicos del caso.',
        },
      },
    ],
  };
}

// ============================================
// CASO 2: ESCLEROSIS MÚLTIPLE
// ============================================

function createCaso2EsclerosisMultiple(): any {
  return {
    id: generateId(),
    title: 'Caso Clínico 2: Fatiga y Alteraciones Visuales Progresivas (Esclerosis Múltiple)',
    description: 'Análisis bioeléctrico de un caso de desmielinización. Incluye cálculos de velocidad de conducción nerviosa, interpretación de estudios electrofisiológicos y fisiopatología de la conducción saltatoria.',
    caseText: `**PRESENTACIÓN DEL CASO**

Carolina, una mujer de 28 años, consulta al servicio de neurología por un cuadro de 3 semanas de evolución caracterizado por visión borrosa en el ojo derecho asociada a dolor al mover el globo ocular. En el interrogatorio dirigido, la paciente refiere que hace aproximadamente 4 meses presentó un episodio de "hormigueo" y debilidad en el brazo izquierdo que duró alrededor de 2 semanas y se resolvió espontáneamente. También menciona fatiga excesiva que empeora con el calor ambiental y sensación de "falta de coordinación" en las piernas al caminar distancias largas.

Al examen físico neurológico se observa una agudeza visual disminuida en ojo derecho (20/80), con dolor a la movilización del globo ocular y alteración en la visión de colores. La evaluación de la fuerza muscular muestra una leve debilidad (4+/5) en miembro superior izquierdo. Los reflejos osteotendinosos están aumentados (hiperreflexia) en miembros inferiores de forma bilateral, con presencia del signo de Babinski bilateral. La marcha es ligeramente atáxica (descoordinada).

### Datos de Estudios Complementarios

**Resonancia Magnética:**
- Múltiples lesiones hiperintensas en sustancia blanca periventricular y cerebelo
- Lesiones con realce con gadolinio (actividad inflamatoria)
- Lesiones en médula espinal cervical C5-C6

**Estudio de Conducción Nerviosa:**

| Parámetro | Nervio Mediano Derecho | Valores Normales |
|-----------|----------------------|------------------|
| **Latencia Distal (ms)** | 5.8 ms | < 4.4 ms |
| **Amplitud CMAP (mV)** | 8.2 mV | > 4.0 mV |
| **Velocidad de Conducción (m/s)** | **28 m/s** | > 49 m/s |

La amplitud del CMAP está preservada (axones intactos), pero la velocidad de conducción está marcadamente disminuida y la latencia aumentada, hallazgos característicos de desmielinización.

**Potenciales Evocados Visuales:**
- Latencia P100 prolongada: 145 ms (normal: < 100 ms)

**Líquido Cefalorraquídeo:**
- Bandas oligoclonales presentes (síntesis intratecal de inmunoglobulinas)`,
    subject: 'Bioelectricidad',
    difficulty: 'hard',
    estimatedTime: 60,
    activityType: 'clinical' as const,
    status: 'active' as const,
    availableFrom: getCurrentISODate(),
    availableUntil: null,
    questions: [
      // PREGUNTA 1.1: Velocidad teórica
      {
        id: generateQuestionId(),
        text: 'Calcule la velocidad de conducción teórica esperada para una fibra nerviosa mielinizada del nervio mediano con diámetro de 10 μm en condiciones normales. Use la relación empírica: $$\\text{Velocidad (m/s)} = 6 \\times \\text{Diámetro (μm)}$$',
        placeholder: 'Velocidad = 6 × 10 μm = ...',
        wordLimit: 100,
        questionType: 'calculation' as const,
        expectedFormula: 'Velocidad = 6 × Diámetro',
        correctAnswer: 60,
        expectedUnit: 'm/s',
        tolerancePercentage: 5,
        rubric: {
          excellent: 'Cálculo correcto: 60 m/s (±3 m/s). Muestra fórmula empírica, sustitución del diámetro (10 μm) y resultado con unidades correctas. Menciona que esta relación aplica a fibras mielinizadas tipo Aα.',
          good: 'Resultado correcto (60 m/s) con fórmula y unidades presentes. Método claro.',
          satisfactory: 'Método correcto con fórmula identificada pero error aritmético menor (resultado 55-65 m/s).',
          insufficient: 'Fórmula incorrecta, no usa la relación empírica dada, o resultado muy alejado del valor esperado.',
        },
      },
      // PREGUNTA 1.2: Porcentaje de reducción
      {
        id: generateQuestionId(),
        text: 'Compare la velocidad de conducción medida en el nervio mediano de Carolina (28 m/s) con el valor normal que calculó. Determine el porcentaje de reducción usando: $$\\text{% Reducción} = \\frac{\\text{VCN}_{normal} - \\text{VCN}_{paciente}}{\\text{VCN}_{normal}} \\times 100$$',
        placeholder: '% Reducción = [(60 - 28) / 60] × 100 = ...',
        wordLimit: 100,
        questionType: 'calculation' as const,
        expectedFormula: '% = [(VCNnormal - VCNpaciente) / VCNnormal] × 100',
        correctAnswer: 53.3,
        expectedUnit: '%',
        tolerancePercentage: 5,
        rubric: {
          excellent: 'Cálculo correcto: 53.3% (±2.7%). Sustitución de valores (60 - 28)/60 × 100, operaciones intermedias visibles, resultado con símbolo de porcentaje. Interpreta que la velocidad está reducida a la mitad del valor normal.',
          good: 'Resultado correcto (53.3%) con fórmula aplicada y unidades. Método completo.',
          satisfactory: 'Método correcto pero error aritmético (resultado 48-58%). Fórmula bien identificada.',
          insufficient: 'Fórmula incorrecta (ej: invierte numerador/denominador), cálculo erróneo, o no expresa como porcentaje.',
        },
      },
      // PREGUNTA 1.3: Tiempos de conducción
      {
        id: generateQuestionId(),
        text: 'Suponga que el estudio midió la conducción en un segmento de 15 cm (0.15 m). Calcule: (A) Tiempo en nervio normal con velocidad 60 m/s. (B) Tiempo en nervio desmielinizado de Carolina con velocidad 28 m/s. (C) Diferencia de tiempo (retraso). Use Tiempo = Distancia / Velocidad.',
        placeholder: '(A) t_normal = 0.15 m / 60 m/s = ... ms\n(B) t_paciente = 0.15 m / 28 m/s = ... ms\n(C) Δt = ... ms',
        wordLimit: 200,
        questionType: 'calculation' as const,
        expectedFormula: 't = Distancia / Velocidad',
        correctAnswer: 3.0,
        expectedUnit: 'ms',
        tolerancePercentage: 10,
        rubric: {
          excellent: 'Calcula correctamente: (A) 2.5 ms, (B) 5.36 ms, (C) Δt ≈ 2.9 ms. Muestra conversión de segundos a milisegundos. Interpreta que la desmielinización introduce un retraso de ~3 ms en apenas 15 cm de nervio.',
          good: 'Resultados numéricos correctos para los tres cálculos. Unidades en ms. Fórmula aplicada correctamente.',
          satisfactory: 'Calcula correctamente 2 de los 3 valores. Método correcto aunque con error aritmético en uno de los pasos. Identifica la fórmula tiempo = distancia/velocidad.',
          insufficient: 'No calcula los tres valores, errores múltiples en aplicación de la fórmula, o no convierte unidades correctamente.',
        },
      },
      // PREGUNTA 2.1: Conducción saltatoria (Conceptual - límite de palabras mayor)
      {
        id: generateQuestionId(),
        text: 'Explique detalladamente el mecanismo de conducción saltatoria normal en fibras mielinizadas, incluyendo el papel de la mielina como aislante, la concentración de canales de Na⁺ en los nodos de Ranvier, y cómo la corriente "salta" entre nodos. Luego explique qué ocurre cuando la mielina se pierde en la desmielinización: ¿por qué la velocidad disminuye drásticamente? ¿Qué tipo de conducción reemplaza a la saltatoria? ¿Por qué se mantiene la amplitud del CMAP (axones intactos)?',
        placeholder: 'En condiciones normales, la mielina actúa como aislante eléctrico que aumenta la resistencia transversal de membrana (Rm)...',
        wordLimit: 350,
        questionType: 'text' as const,
        rubric: {
          excellent: 'Explica conducción saltatoria: mielina incrementa Rm y constante de espacio λ, permitiendo que despolarización local alcance el siguiente nodo sin decaimiento. Canales Na⁺ concentrados solo en nodos. En desmielinización: pérdida de mielina → Rm disminuye → λ cae → conducción se vuelve continua (electrotónica) en segmentos desmielinizados, enormemente más lenta. Amplitud CMAP preservada porque axones permanecen estructuralmente intactos (masa axonal no perdida).',
          good: 'Describe conducción saltatoria con papel de mielina y nodos de Ranvier. Identifica que desmielinización causa conducción continua lenta. Menciona que amplitud se preserva por axones intactos.',
          satisfactory: 'Menciona conducción saltatoria y papel de mielina. Identifica enlentecimiento por desmielinización pero sin detallar mecanismo biofísico (constante de espacio, Rm). Conexión parcial con hallazgos electrofisiológicos.',
          insufficient: 'Descripción superficial sin fundamento biofísico. No explica por qué la velocidad cae drásticamente o no relaciona con preservación de amplitud del CMAP.',
        },
      },
    ],
  };
}

// ============================================
// CASO 3: LAMBERT-EATON
// ============================================

function createCaso3LambertEaton(): any {
  return {
    id: generateId(),
    title: 'Caso Clínico 3: Debilidad Muscular con Mejoría al Ejercicio (Lambert-Eaton)',
    description: 'Análisis bioeléctrico de síndrome paraneoplásico que afecta la transmisión neuromuscular. Incluye cálculos de liberación cuántica de ACh, factor de seguridad, facilitación post-ejercicio y análisis de acoplamiento excitación-secreción.',
    caseText: `**PRESENTACIÓN DEL CASO**

Roberto, un hombre de 61 años con tabaquismo de 40 paquetes/año, consulta al servicio de neurología por un cuadro de 4 meses de debilidad muscular proximal progresiva, principalmente en miembros inferiores, que le dificulta levantarse de una silla o subir escaleras. Lo particular del cuadro es que la debilidad es **más pronunciada al inicio de las actividades**, pero **mejora transitoriamente con el ejercicio o los movimientos repetidos**. Describe que "necesita calentamiento" antes de poder realizar tareas que requieren fuerza sostenida.

Además, Roberto menciona otros síntomas: sequedad de boca intensa (xerostomía) que interfiere con la alimentación, estreñimiento persistente, y ocasionalmente visión borrosa transitoria. Estos síntomas autonómicos coexisten con la debilidad muscular. No refiere ptosis palpebral ni diplopía.

Hace 6 meses le diagnosticaron un cáncer de pulmón de células pequeñas (carcinoma microcítico pulmonar), por el cual está recibiendo quimioterapia. La oncóloga le sugirió consultar a neurología porque algunos pacientes con este tipo de cáncer desarrollan "síndromes paraneoplásicos".

Al examen físico se observa debilidad proximal simétrica (fuerza 3/5 en músculos proximales de miembros inferiores), que **mejora transitoriamente a 4/5 tras realizar 10 contracciones voluntarias repetidas** (fenómeno de facilitación). Los reflejos osteotendinosos están **disminuidos o ausentes** (arreflexia), pero reaparecen brevemente tras ejercicio vigoroso. No hay atrofia muscular significativa. La sensibilidad es normal.

### Datos de Estudios Complementarios

**Estudio de Conducción Nerviosa:**
- Velocidad de conducción: Normal
- Amplitud basal del CMAP: **Disminuida** (1.8 mV vs normal >4.0 mV)

**Test de Estimulación Repetitiva:**

| Momento | Amplitud CMAP (mV) | Cambio respecto a Basal |
|---------|-------------------|-------------------------|
| **Basal (reposo)** | 1.8 mV | - |
| **Inmediatamente post-ejercicio** | **7.2 mV** | **+300%** (facilitación marcada) |
| **1 min post-ejercicio** | 3.8 mV | +111% |
| **3 min post-ejercicio** | 2.0 mV | +11% (retorno casi basal) |

Este patrón de **facilitación post-ejercicio** (incremento >100%) es altamente específico de un defecto **presináptico** de la transmisión neuromuscular.

**Anticuerpos séricos:**
- **Anticuerpos anti-canales de Ca²⁺ tipo P/Q:** **Positivos** (título elevado)

**Tomografía de Tórax:**
- Masa pulmonar hiliar derecha de 3.5 cm, compatible con carcinoma de células pequeñas`,
    subject: 'Bioelectricidad',
    difficulty: 'hard',
    estimatedTime: 70,
    activityType: 'clinical' as const,
    status: 'active' as const,
    availableFrom: getCurrentISODate(),
    availableUntil: null,
    questions: [
      // PREGUNTA 1.1: ACh total normal
      {
        id: generateQuestionId(),
        text: 'La liberación de acetilcolina (ACh) es un proceso cuántico donde cada vesícula contiene ~7,500 moléculas de ACh (un cuanto). En condiciones normales, se liberan ~100 cuantos por potencial de acción. Calcule el número total de moléculas de ACh liberadas en condiciones normales: $$\\text{ACh total} = m \\times q$$ donde m = 100 cuantos, q = 7,500 moléculas/cuanto.',
        placeholder: 'ACh total = 100 × 7,500 = ... moléculas',
        wordLimit: 100,
        questionType: 'calculation' as const,
        expectedFormula: 'ACh total = m × q',
        correctAnswer: 750000,
        expectedUnit: 'moléculas',
        tolerancePercentage: 5,
        rubric: {
          excellent: 'Cálculo correcto: 750,000 moléculas (±37,500). Muestra multiplicación de 100 cuantos × 7,500 moléculas/cuanto. Resultado con unidades correctas. Menciona que este es el contenido cuántico total liberado por un único potencial de acción.',
          good: 'Resultado correcto (750,000 moléculas) con fórmula y unidades. Método claro.',
          satisfactory: 'Método correcto pero error aritmético menor (resultado 700,000-800,000 moléculas). Fórmula identificada.',
          insufficient: 'Fórmula incorrecta, error de órdenes de magnitud, o no expresa resultado en moléculas.',
        },
      },
      // PREGUNTA 1.2: Factor de seguridad normal
      {
        id: generateQuestionId(),
        text: 'En condiciones normales, la cantidad de ACh liberada es mucho mayor que la mínima necesaria para despolarizar la fibra muscular (10% del total, es decir, 75,000 moléculas). Calcule el **factor de seguridad (SF)**: $$SF = \\frac{\\text{ACh liberada}}{\\text{ACh mínima requerida}}$$',
        placeholder: 'SF = 750,000 / 75,000 = ...',
        wordLimit: 100,
        questionType: 'calculation' as const,
        expectedFormula: 'SF = ACh liberada / ACh mínima',
        correctAnswer: 10,
        expectedUnit: '',
        tolerancePercentage: 5,
        rubric: {
          excellent: 'Cálculo correcto: SF = 10 (±0.5). Divide 750,000 / 75,000 = 10. Interpreta que hay un margen de seguridad de 10 veces, es decir, se libera 10 veces más ACh de la necesaria para garantizar transmisión exitosa. Factor adimensional.',
          good: 'Resultado correcto (SF = 10) con cálculo mostrado. Identifica que representa margen de seguridad.',
          satisfactory: 'Método correcto pero error aritmético (SF entre 9-11). Fórmula aplicada correctamente.',
          insufficient: 'Fórmula incorrecta, no calcula el cociente, o no identifica qué representa el factor de seguridad.',
        },
      },
      // PREGUNTA 1.3: ACh en LEMS
      {
        id: generateQuestionId(),
        text: 'En el Síndrome de Lambert-Eaton (LEMS), los anticuerpos contra canales de Ca²⁺ tipo P/Q bloquean la entrada de Ca²⁺ presináptico. Como consecuencia, el número de cuantos liberados disminuye a **~10 cuantos** (en lugar de 100). Calcule: (A) ACh total liberada en LEMS en reposo. (B) Nuevo factor de seguridad SF_LEMS. (C) ¿Es suficiente para transmisión exitosa (SF > 1)?',
        placeholder: '(A) ACh_LEMS = 10 × 7,500 = ... moléculas\n(B) SF_LEMS = ... / 75,000 = ...\n(C) Como SF_LEMS < 1, la transmisión...',
        wordLimit: 200,
        questionType: 'calculation' as const,
        expectedFormula: 'ACh_LEMS = m_LEMS × q; SF = ACh / ACh_mínima',
        correctAnswer: 1.0,
        expectedUnit: '',
        tolerancePercentage: 10,
        rubric: {
          excellent: 'Calcula correctamente: (A) 75,000 moléculas, (B) SF_LEMS = 1.0, (C) Identifica que SF=1 es el límite crítico: justo suficiente para transmisión pero sin margen de seguridad. Cualquier variabilidad fisiológica causará fallos de transmisión, explicando la debilidad muscular basal de Roberto.',
          good: 'Resultados correctos para (A) y (B). Identifica que SF≈1 implica transmisión precaria. Relaciona con síntomas clínicos.',
          satisfactory: 'Calcula correctamente (A) y (B) pero interpretación incompleta del significado clínico de SF=1. Identifica reducción respecto al valor normal (SF=10).',
          insufficient: 'Errores múltiples en cálculos, no calcula SF_LEMS, o no interpreta el significado de factor de seguridad reducido.',
        },
      },
      // PREGUNTA 1.4: Facilitación post-ejercicio
      {
        id: generateQuestionId(),
        text: 'Durante el ejercicio repetido, se acumula Ca²⁺ residual en la terminal presináptica, aumentando la probabilidad de fusión vesicular. En LEMS post-ejercicio, el número de cuantos puede aumentar a **~80 cuantos**. Calcule: (A) ACh post-ejercicio. (B) SF post-ejercicio. (C) Relacione el aumento de SF con: 1) Mejoría de fuerza muscular (3/5 → 4/5), 2) Incremento de amplitud CMAP (1.8 mV → 7.2 mV, +300%).',
        placeholder: '(A) ACh_post = 80 × 7,500 = ...\n(B) SF_post = .../75,000 = ...\n(C) El aumento de SF de 1.0 a ~8 restaura el margen de seguridad...',
        wordLimit: 250,
        questionType: 'calculation' as const,
        expectedFormula: 'ACh_post = m_post × q; SF_post = ACh_post / ACh_mínima',
        correctAnswer: 8.0,
        expectedUnit: '',
        tolerancePercentage: 10,
        rubric: {
          excellent: 'Calcula: (A) 600,000 moléculas, (B) SF_post = 8.0. Interpreta que SF aumenta de 1.0 a 8.0 (recuperación de 80% del margen de seguridad normal). Relaciona directamente con mejoría clínica: más uniones neuromusculares transmiten exitosamente → mayor reclutamiento muscular → incremento de fuerza. Incremento de CMAP (×4) refleja más fibras musculares despolarizándose simultáneamente. Cinética temporal: facilitación dura ~2-3 min hasta que Ca²⁺ residual es eliminado.',
          good: 'Cálculos correctos (A) y (B). Relaciona aumento de SF con mejoría de fuerza y amplitud CMAP. Identifica compensación temporal del defecto.',
          satisfactory: 'Cálculos correctos pero conexión superficial con manifestaciones clínicas. Menciona facilitación sin detallar mecanismo de Ca²⁺ residual.',
          insufficient: 'Errores en cálculos, no relaciona SF con síntomas clínicos, o no explica el fenómeno de facilitación post-ejercicio.',
        },
      },
      // PREGUNTA 2.1: Mecanismo de acoplamiento excitación-secreción
      {
        id: generateQuestionId(),
        text: 'Explique en detalle la secuencia normal de eventos en la terminal presináptica cuando llega un potencial de acción: 1) Despolarización, 2) Apertura de canales de Ca²⁺ tipo P/Q, 3) Entrada masiva de Ca²⁺ (de ~100 nM a ~100 μM), 4) Unión de Ca²⁺ a sinaptotagmina, 5) Fusión vesicular (exocitosis) mediada por complejo SNARE, 6) Liberación cuántica de ACh. Luego explique cómo este mecanismo FALLA en Lambert-Eaton: bloqueo de canales P/Q por anticuerpos IgG → reducción de entrada de Ca²⁺ → disminución de fusión vesicular → liberación insuficiente de ACh.',
        placeholder: 'En condiciones normales, el potencial de acción despolariza la membrana presináptica activando canales de Ca²⁺ voltaje-dependientes tipo P/Q...',
        wordLimit: 400,
        questionType: 'text' as const,
        rubric: {
          excellent: 'Secuencia completa: despolarización abre canales P/Q → Ca²⁺ entra masivamente (aumento de 1000×) → Ca²⁺ se une a sinaptotagmina (sensor de Ca²⁺ en vesículas) → cambio conformacional activa complejo SNARE (sintaxina, SNAP-25, sinaptobrevina) → fusión de membrana vesicular con membrana presináptica → exocitosis de ~100 vesículas → liberación de ACh a hendidura. En LEMS: anticuerpos anti-P/Q bloquean canales → entrada de Ca²⁺ reducida (10-20 μM en vez de 100 μM) → solo ~10 vesículas se fusionan → ACh insuficiente → fallo de transmisión → debilidad muscular. Mecanismo autoinmune paraneoplásico.',
          good: 'Describe acoplamiento excitación-secreción con papel central de Ca²⁺. Identifica bloqueo de canales P/Q en LEMS y consecuencia en liberación reducida de ACh. Conexión con síntomas.',
          satisfactory: 'Menciona entrada de Ca²⁺ y liberación de ACh. Identifica defecto presináptico en LEMS pero sin detallar cascada molecular (sinaptotagmina, SNARE). Conexión parcial con fisiopatología.',
          insufficient: 'Descripción superficial sin fundamento molecular. No explica la cascada de eventos dependientes de Ca²⁺ o no diferencia entre defecto presináptico vs postsináptico.',
        },
      },
      // PREGUNTA 2.2: Diferenciación con Miastenia Gravis
      {
        id: generateQuestionId(),
        text: 'La Miastenia Gravis (MG) afecta la membrana **postsináptica** (anticuerpos anti-receptor ACh), mientras que Lambert-Eaton afecta la membrana **presináptica** (anticuerpos anti-canales Ca²⁺). Explique: (A) ¿Por qué en MG la fatiga empeora con ejercicio repetido? (B) ¿Por qué en LEMS hay mejoría transitoria con ejercicio? (C) ¿Por qué la amplitud del CMAP basal es mucho más baja en LEMS (<2 mV) que en MG (>3 mV)?',
        placeholder: '(A) En MG, los receptores ACh están reducidos/bloqueados en la placa motora. Con ejercicio repetido, la ACh liberada (normal) compite por menos receptores disponibles...',
        wordLimit: 400,
        questionType: 'text' as const,
        rubric: {
          excellent: '(A) MG: Liberación de ACh normal pero receptores postsinápticos reducidos/bloqueados. Con ejercicio, receptores disponibles se saturan/desensibilizan → menos respuesta → fatiga progresiva (patrón decremental). (B) LEMS: Liberación de ACh deficiente pero receptores normales. Ejercicio → acumulación de Ca²⁺ residual → más liberación de ACh → compensación temporal → mejoría (facilitación). (C) LEMS tiene CMAP basal muy bajo porque muy pocas vesículas se liberan en reposo (solo ~10% del normal) → pocas fibras musculares se despolarizan. MG tiene más receptores funcionales en reposo → CMAP basal relativamente preservado aunque con decreción en estimulación repetitiva.',
          good: 'Identifica diferencia sitio del defecto (pre vs post). Explica patrones opuestos: fatiga en MG vs facilitación en LEMS. Relaciona con hallazgos electrofisiológicos (CMAP basal, respuesta a ejercicio).',
          satisfactory: 'Diferencia entre defecto presináptico y postsináptico. Menciona patrones clínicos diferentes pero sin explicación mecanística detallada del porqué.',
          insufficient: 'No diferencia claramente entre MG y LEMS, confunde mecanismos, o no relaciona con hallazgos electrofisiológicos específicos de cada síndrome.',
        },
      },
    ],
  };
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Iniciando migración de casos clínicos CONSUDEC\n');
  console.log('═'.repeat(60));

  try {
    // Paso 1: Archivar casos existentes
    const archivedCount = await archiveExistingClinicalCases();

    // Paso 2: Obtener instructor ID
    const instructorId = await getInstructorId();

    // Paso 3: Crear nuevos casos clínicos
    console.log('📝 Creando 3 nuevos casos clínicos...\n');

    const caso1 = createCaso1Hipocalemia();
    await createClinicalCase(caso1, instructorId);

    const caso2 = createCaso2EsclerosisMultiple();
    await createClinicalCase(caso2, instructorId);

    const caso3 = createCaso3LambertEaton();
    await createClinicalCase(caso3, instructorId);

    console.log('═'.repeat(60));
    console.log('✅ Migración completada exitosamente!');
    console.log(`   - Casos archivados: ${archivedCount}`);
    console.log(`   - Casos creados: 3`);
    console.log(`     • Caso 1: Hipocalemia (6 preguntas)`);
    console.log(`     • Caso 2: Esclerosis Múltiple (4 preguntas)`);
    console.log(`     • Caso 3: Lambert-Eaton (6 preguntas)`);
    console.log(`\n📊 Total de preguntas: 16`);
    console.log(`\n🎯 Todos los casos disponibles inmediatamente para estudiantes CONSUDEC\n`);
  } catch (error: unknown) {
    console.error('\n❌ Error durante la migración:');
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
