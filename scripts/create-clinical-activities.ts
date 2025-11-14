/**
 * Script para crear las 3 actividades clínicas de Bioelectricidad
 *
 * Casos:
 * 1. Hipocalemia - Debilidad Muscular y Arritmias
 * 2. Esclerosis Múltiple - Desmielinización
 * 3. Síndrome Lambert-Eaton - Transmisión Sináptica
 *
 * Run: npx tsx scripts/create-clinical-activities.ts
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
// CASO 1: HIPOCALEMIA
// ============================================

const hipocalemiaActivity = {
  id: generateId(),
  title: 'Caso Clínico 1: Debilidad Muscular y Arritmias (Hipocalemia)',
  description: 'Análisis bioeléctrico de un caso de hipocalemia inducida por diuréticos. Incluye cálculos de potencial de Nernst e interpretación fisiopatológica.',
  caseText: `**PRESENTACIÓN DEL CASO**

María, una mujer de 52 años con antecedentes de hipertensión arterial, consulta al servicio de urgencias por debilidad muscular progresiva de 3 días de evolución. La paciente refiere que la debilidad comenzó en los miembros inferiores y se ha extendido a los superiores, dificultando actividades cotidianas como subir escaleras o levantar objetos. Además, menciona episodios de palpitaciones irregulares que la alarman, especialmente durante el reposo nocturno.

En el interrogatorio dirigido, María comenta que viene tomando furosemida (un diurético) desde hace 6 meses para controlar su presión arterial, pero reconoce que no ha realizado controles de laboratorio recientes. También refiere episodios ocasionales de calambres musculares y sensación de hormigueo en las extremidades.

Al examen físico se observa una paciente lúcida y orientada, con presión arterial de 145/90 mmHg y frecuencia cardíaca de 88 latidos por minuto con ritmo irregular. La evaluación neurológica revela hiporreflexia generalizada (reflejos osteotendinosos disminuidos) y debilidad muscular proximal simétrica, con fuerza muscular 3/5 en miembros inferiores y 4/5 en miembros superiores. No se observan alteraciones sensitivas. El electrocardiograma muestra ondas U prominentes y aplanamiento de las ondas T, hallazgos característicos de alteraciones en la repolarización cardíaca.

**Datos de Laboratorio**

| Ion | Concentración Plasmática | Valores Normales |
|-----|-------------------------|------------------|
| K⁺ | **2.1 mEq/L** | 3.5 - 5.0 mEq/L |
| Na⁺ | 138 mEq/L | 135 - 145 mEq/L |
| Ca²⁺ | 9.5 mg/dL | 8.5 - 10.5 mg/dL |
| Cl⁻ | 98 mEq/L | 95 - 105 mEq/L |

**Nota importante:** Se asume que las concentraciones intracelulares de K⁺ permanecen relativamente estables debido a la acción de la bomba Na⁺/K⁺-ATPasa, con un valor intracelular aproximado de 140 mEq/L para K⁺ (valor fisiológico normal).`,
  subject: 'Bioelectricidad',
  difficulty: 'medium' as const,
  estimatedTime: 60,
  activityType: 'clinical' as const,
  status: 'active' as const,
  questions: [
    {
      id: generateQuestionId(),
      text: 'Utilizando la ecuación de Nernst, calcule el potencial de equilibrio del ion potasio ($E_K$) en condiciones fisiológicas normales. Considere: [K⁺]ext = 4.5 mEq/L, [K⁺]int = 140 mEq/L, constante simplificada = 61.5 mV a 37°C. Ecuación: $$E_K = 61.5 \\times \\log_{10}\\left(\\frac{[K^+]_{ext}}{[K^+]_{int}}\\right)$$',
      placeholder: 'Muestre su desarrollo del cálculo paso a paso, incluyendo la fórmula, sustitución de valores y resultado con unidades...',
      wordLimit: 150,
      questionType: 'calculation' as const,
      expectedFormula: 'E_K = 61.5 * log10([K+]ext / [K+]int)',
      correctAnswer: -90.5,
      expectedUnit: 'mV',
      tolerancePercentage: 3,
      rubric: {
        excellent: 'Cálculo correcto con resultado -90.5 mV (±3%), fórmula de Nernst explícita, sustitución de valores mostrada, unidades correctas e interpretación del signo negativo.',
        good: 'Cálculo correcto o con error menor (<5%), fórmula presente, unidades correctas.',
        satisfactory: 'Método correcto identificado (ecuación de Nernst), pero error en cálculo o sin unidades.',
        insufficient: 'Fórmula incorrecta, cálculo erróneo sin método válido, o respuesta sin fundamentación.',
      },
    },
    {
      id: generateQuestionId(),
      text: 'Calcule el potencial de equilibrio del K⁺ ($E_K$) en las condiciones actuales de la paciente María: [K⁺]ext = 2.1 mEq/L, [K⁺]int = 140 mEq/L. Use la misma ecuación de Nernst.',
      placeholder: 'Desarrolle el cálculo completo...',
      wordLimit: 150,
      questionType: 'calculation' as const,
      expectedFormula: 'E_K = 61.5 * log10([K+]ext / [K+]int)',
      correctAnswer: -109.8,
      expectedUnit: 'mV',
      tolerancePercentage: 3,
      rubric: {
        excellent: 'Resultado -109.8 mV (±3%), desarrollo completo, comparación con valor normal mencionada.',
        good: 'Cálculo correcto o con error menor, fórmula y unidades presentes.',
        satisfactory: 'Método correcto pero error en cálculo final o sin comparación con valor normal.',
        insufficient: 'Error en aplicación de fórmula o cálculo incorrecto sin método válido.',
      },
    },
    {
      id: generateQuestionId(),
      text: 'Calcule la variación del potencial de equilibrio: $$\\Delta E_K = E_K(\\text{hipocalemia}) - E_K(\\text{normal})$$ Interprete el significado de este cambio.',
      placeholder: 'Calcule ΔE_K y explique qué significa fisiológicamente...',
      wordLimit: 200,
      questionType: 'calculation' as const,
      expectedFormula: 'ΔE_K = E_K(hipocalemia) - E_K(normal)',
      correctAnswer: -19.3,
      expectedUnit: 'mV',
      tolerancePercentage: 5,
      rubric: {
        excellent: 'Resultado -19.3 mV (±5%), interpretación correcta de hiperpolarización (potencial más negativo, alejado del umbral).',
        good: 'Cálculo correcto, interpretación básica de cambio en dirección negativa.',
        satisfactory: 'Cálculo con método correcto pero error menor, o interpretación incompleta.',
        insufficient: 'Error en resta o interpretación incorrecta del signo.',
      },
    },
    {
      id: generateQuestionId(),
      text: 'Explique cómo la hiperpolarización causada por la hipocalemia (cambio de aprox. -19 mV en $E_K$) reduce la excitabilidad de las células musculares. Relacione con la distancia entre potencial de reposo ($V_m$) y umbral de disparo ($V_{umbral} \\approx -55$ mV), y conecte con los síntomas clínicos de debilidad muscular e hiporreflexia.',
      placeholder: 'Explique el mecanismo bioeléctrico y su manifestación clínica...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica que V_m sigue a E_K volviéndose más negativo (ej: -85 mV → -95 mV), aumenta distancia a umbral (-55 mV), requiere mayor despolarización para disparar PA, conecta con debilidad/hiporreflexia. Fundamentación teórica sólida.',
        good: 'Menciona hiperpolarización y mayor distancia al umbral, conecta con síntomas clínicos, fundamentación adecuada.',
        satisfactory: 'Identifica que la membrana está más polarizada y afecta excitabilidad, pero explicación superficial o sin conexión clínica clara.',
        insufficient: 'Confusión conceptual (ej: dice que aumenta excitabilidad), no conecta con clínica, o explicación irrelevante.',
      },
    },
    {
      id: generateQuestionId(),
      text: 'Explique cómo la hipocalemia afecta la repolarización cardíaca (fase 3 del PA cardíaco). Considere que la fuerza impulsora para salida de K⁺ depende de (V_m - E_K). Relacione con ondas U prominentes y aplanamiento de ondas T en el ECG de María.',
      placeholder: 'Describa el mecanismo de repolarización alterada...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica que E_K más negativo reduce gradiente electroquímico para salida de K⁺ durante fase 3, enlentece repolarización, prolonga duración del PA cardíaco, conecta con manifestaciones ECG (ondas U, aplanamiento T). Fundamentación sólida.',
        good: 'Menciona alteración en salida de K⁺ y prolongación de repolarización, conecta con ECG.',
        satisfactory: 'Identifica problema en repolarización pero explicación incompleta del mecanismo iónico.',
        insufficient: 'No menciona papel del K⁺ en repolarización o explicación confusa sin conexión ECG.',
      },
    },
    {
      id: generateQuestionId(),
      text: 'Explique el mecanismo por el cual el uso prolongado de furosemida (diurético de asa que inhibe cotransportador Na⁺-K⁺-2Cl⁻ en riñón) condujo a la hipocalemia en María. ¿Por qué son fundamentales los controles periódicos de ionograma en pacientes con diuréticos?',
      placeholder: 'Describa el mecanismo de pérdida de K⁺...',
      wordLimit: 250,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica inhibición de cotransportador → mayor excreción renal de K⁺, pérdidas superan ingesta sin suplementación, disminuye K⁺ plasmático progresivamente. Menciona importancia de monitoreo para prevenir complicaciones. Fundamentación clara.',
        good: 'Identifica pérdida renal aumentada de K⁺ por diurético, menciona necesidad de controles.',
        satisfactory: 'Menciona que diurético causa pérdida de K⁺ pero explicación superficial del balance.',
        insufficient: 'No explica mecanismo renal o confunde con otros procesos.',
      },
    },
  ],
};

// ============================================
// FUNCIÓN PARA INSERTAR ACTIVIDAD
// ============================================

async function insertActivity(activity: typeof hipocalemiaActivity, instructorId: string) {
  const now = getCurrentISODate();

  // Insertar actividad con questions como JSON
  await db.execute({
    sql: `INSERT INTO ConsudecActivity (
      id, title, description, caseText, questions, subject, difficulty, estimatedTime,
      activityType, status, createdBy, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      instructorId,
      now,
      now,
    ],
  });

  console.log(`✅ Actividad creada: ${activity.title}`);
  console.log(`   ID: ${activity.id}`);
  console.log(`   Preguntas: ${activity.questions.length}`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 Creando actividades clínicas de Bioelectricidad...\n');

  try {
    // Obtener instructor ID (debe existir un instructor en la BD)
    const instructors = await db.execute({
      sql: 'SELECT id FROM User WHERE role = ? LIMIT 1',
      args: ['INSTRUCTOR'],
    });

    if (instructors.rows.length === 0) {
      console.error('❌ No se encontró ningún instructor en la base de datos');
      process.exit(1);
    }

    const instructorId = (instructors.rows[0] as { id: string }).id;
    console.log(`👤 Instructor ID: ${instructorId}\n`);

    // Insertar Caso 1: Hipocalemia
    await insertActivity(hipocalemiaActivity, instructorId);

    console.log('\n✨ Actividades clínicas creadas exitosamente!');
    console.log('\n📝 Nota: Solo se creó el Caso 1 (Hipocalemia) como ejemplo.');
    console.log('   Los casos 2 y 3 se pueden agregar siguiendo el mismo patrón.');
  } catch (error: unknown) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
