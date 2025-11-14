/**
 * Script para crear Caso Clínico 2: Esclerosis Múltiple
 *
 * Caso: Fatiga y Alteraciones Visuales Progresivas (Desmielinización)
 * Preguntas: 11 (3 cálculos + 8 conceptuales)
 *
 * Run: npx tsx scripts/create-caso-2-esclerosis-multiple.ts
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
// CASO 2: ESCLEROSIS MÚLTIPLE
// ============================================

const esclerosisMultipleActivity = {
  id: generateId(),
  title: 'Caso Clínico 2: Fatiga y Alteraciones Visuales Progresivas (Esclerosis Múltiple)',
  description: 'Análisis bioeléctrico de un caso de desmielinización. Incluye cálculos de velocidad de conducción nerviosa, interpretación de estudios electrofisiológicos y fisiopatología de la conducción saltatoria.',
  caseText: `**PRESENTACIÓN DEL CASO**

Carolina, una mujer de 28 años, consulta al servicio de neurología por un cuadro de 3 semanas de evolución caracterizado por visión borrosa en el ojo derecho asociada a dolor al mover el globo ocular. En el interrogatorio dirigido, la paciente refiere que hace aproximadamente 4 meses presentó un episodio de "hormigueo" y debilidad en el brazo izquierdo que duró alrededor de 2 semanas y se resolvió espontáneamente, sin que consultara en ese momento. También menciona fatiga excesiva que empeora con el calor ambiental y sensación de "falta de coordinación" en las piernas al caminar distancias largas.

Carolina trabaja como diseñadora gráfica y comenta que los síntomas visuales le están dificultando significativamente su desempeño laboral. Niega antecedentes familiares de enfermedades neurológicas, no consume medicamentos regularmente y no tiene hábitos tóxicos.

Al examen físico neurológico se observa una agudeza visual disminuida en ojo derecho (20/80), con dolor a la movilización del globo ocular y alteración en la visión de colores (discromatopsia). El resto del examen oftalmológico es normal. La evaluación de la fuerza muscular muestra una leve debilidad (4+/5) en miembro superior izquierdo, sin atrofia muscular evidente. Los reflejos osteotendinosos están aumentados (hiperreflexia) en miembros inferiores de forma bilateral, con presencia del signo de Babinski bilateral (reflejo patológico que indica afectación de la vía piramidal). La marcha es ligeramente atáxica (descoordinada), con aumento de la base de sustentación.

La médica neuróloga, sospechando una **enfermedad desmielinizante**, solicita estudios complementarios.

### Datos de Estudios Complementarios

**Resonancia Magnética de Cráneo y Columna (RMN):**
- Múltiples lesiones hiperintensas en sustancia blanca periventricular, corpus callosum y cerebelo en secuencias T2 y FLAIR.
- Lesiones con distribución espacial característica (localizaciones típicas de desmielinización).
- Algunas lesiones muestran realce con gadolinio (indicando actividad inflamatoria reciente).
- Lesiones en médula espinal cervical a nivel C5-C6.

**Estudio de Conducción Nerviosa (Electroneurografía):**

Se realizó un estudio de conducción nerviosa sensitiva y motora bilateral, estimulando el nervio mediano (motor) en la muñeca y registrando la respuesta en el músculo abductor del pulgar.

| Parámetro | Nervio Mediano Derecho | Nervio Mediano Izquierdo | Valores Normales |
|-----------|----------------------|------------------------|------------------|
| **Latencia Distal (ms)** | 5.8 ms | 6.2 ms | < 4.4 ms |
| **Amplitud CMAP (mV)** | 8.2 mV | 7.8 mV | > 4.0 mV |
| **Velocidad de Conducción (m/s)** | **28 m/s** | **26 m/s** | > 49 m/s |

**CMAP:** Potencial de acción muscular compuesto (refleja la respuesta sincrónica de las fibras musculares al estímulo nervioso)

**Nota interpretativa:** La **amplitud del CMAP se encuentra preservada** (normal), indicando que la masa axonal está intacta (no hay pérdida de axones). Sin embargo, la **velocidad de conducción está marcadamente disminuida** y la **latencia está aumentada**, hallazgos característicos de un proceso de **desmielinización** que enlentece la propagación del potencial de acción sin destruir los axones subyacentes.

**Potenciales Evocados Visuales:**
- Latencia P100 prolongada en ojo derecho: **145 ms** (normal: < 100 ms)
- Indicativo de desmielinización del nervio óptico derecho

**Líquido Cefalorraquídeo (Punción Lumbar):**
- Presencia de bandas oligoclonales (indicativo de síntesis intratecal de inmunoglobulinas)
- Pleocitosis linfocitaria leve`,
  subject: 'Bioelectricidad',
  difficulty: 'hard' as const,
  estimatedTime: 60,
  activityType: 'clinical' as const,
  status: 'active' as const,
  questions: [
    // CÁLCULO 1
    {
      id: generateQuestionId(),
      text: 'Calcule la velocidad de conducción teórica esperada para una fibra nerviosa mielinizada del nervio mediano con diámetro de 10 μm en condiciones normales. Use la relación empírica: $$\\text{Velocidad (m/s)} = 6 \\times \\text{Diámetro (μm)}$$',
      placeholder: 'Muestre el cálculo completo con unidades...',
      wordLimit: 100,
      questionType: 'calculation' as const,
      expectedFormula: 'Velocidad = 6 × Diámetro',
      correctAnswer: 60,
      expectedUnit: 'm/s',
      tolerancePercentage: 5,
      rubric: {
        excellent: 'Cálculo correcto con resultado 60 m/s (±5%), fórmula explícita, sustitución correcta de valores y unidades.',
        good: 'Cálculo correcto con fórmula presente y unidades.',
        satisfactory: 'Método correcto identificado pero error menor en cálculo o sin unidades.',
        insufficient: 'Fórmula incorrecta, cálculo erróneo sin método válido, o respuesta sin fundamentación.',
      },
    },
    // CÁLCULO 2
    {
      id: generateQuestionId(),
      text: 'Calcule el porcentaje de reducción de la velocidad de conducción en el nervio mediano izquierdo de Carolina (26 m/s) comparado con el valor normal (use el valor calculado en la pregunta anterior). Fórmula: $$\\text{% Reducción} = \\frac{\\text{VCN}_{normal} - \\text{VCN}_{paciente}}{\\text{VCN}_{normal}} \\times 100$$',
      placeholder: 'Desarrolle el cálculo del porcentaje de reducción...',
      wordLimit: 150,
      questionType: 'calculation' as const,
      expectedFormula: '% Reducción = ((VCN_normal - VCN_paciente) / VCN_normal) × 100',
      correctAnswer: 56.7,
      expectedUnit: '%',
      tolerancePercentage: 3,
      rubric: {
        excellent: 'Resultado 56.7% (±3%), fórmula explícita, cálculo paso a paso, interpretación de severidad de desmielinización.',
        good: 'Cálculo correcto con fórmula y unidades presentes.',
        satisfactory: 'Método correcto pero error en cálculo o sin interpretación clínica.',
        insufficient: 'Error en aplicación de fórmula o cálculo incorrecto sin método válido.',
      },
    },
    // CÁLCULO 3
    {
      id: generateQuestionId(),
      text: 'Calcule el tiempo que tarda el potencial de acción en recorrer un segmento nervioso de **15 cm** (0.15 m) en: (A) un nervio normal con velocidad de 60 m/s, (B) el nervio desmielinizado de Carolina con velocidad de 26 m/s. (C) ¿Cuál es el retraso adicional que introduce la desmielinización? Fórmula: $$\\text{Tiempo} = \\frac{\\text{Distancia}}{\\text{Velocidad}}$$',
      placeholder: 'Calcule los tres valores solicitados con unidades en milisegundos (ms)...',
      wordLimit: 200,
      questionType: 'calculation' as const,
      expectedFormula: 'Tiempo = Distancia / Velocidad',
      correctAnswer: 3.27,
      expectedUnit: 'ms',
      tolerancePercentage: 5,
      rubric: {
        excellent: 'Tres cálculos correctos: (A) 2.5 ms, (B) 5.77 ms, (C) 3.27 ms (±5% cada uno). Conversión de unidades correcta, explicación del retraso acumulativo.',
        good: 'Cálculos correctos con fórmulas y conversión de unidades adecuada.',
        satisfactory: 'Método correcto en 2 de 3 cálculos, o errores menores de conversión de unidades.',
        insufficient: 'Error en aplicación de fórmula, conversión incorrecta, o menos de 2 cálculos correctos.',
      },
    },
    // CONCEPTUAL 1
    {
      id: generateQuestionId(),
      text: 'Explique detalladamente el mecanismo de conducción saltatoria normal en fibras mielinizadas, incluyendo: (1) el papel de la mielina como aislante eléctrico, (2) por qué los canales de Na⁺ se concentran en los nodos de Ranvier, (3) cómo la corriente "salta" entre nodos. Luego explique qué ocurre cuando la mielina se pierde en la desmielinización y por qué se mantiene la amplitud del CMAP.',
      placeholder: 'Desarrolle el mecanismo bioeléctrico completo de conducción saltatoria y su alteración...',
      wordLimit: 350,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica conducción saltatoria completa: mielina aumenta R_m y disminuye C_m, canales Na⁺ en nodos permiten regeneración, corriente salta sin despolarizar internodos. Desmielinización: pérdida de aislante → conducción continua lenta → velocidad disminuye. Amplitud preservada porque axones intactos. Fundamentación sólida con vocabulario técnico.',
        good: 'Describe conducción saltatoria y alteración por desmielinización correctamente, conecta con preservación axonal, fundamentación adecuada.',
        satisfactory: 'Identifica elementos básicos de conducción saltatoria y desmielinización pero explicación superficial o incompleta.',
        insufficient: 'Confusión conceptual, no explica mecanismo saltatoria, o no conecta con preservación de amplitud.',
      },
    },
    // CONCEPTUAL 2
    {
      id: generateQuestionId(),
      text: 'Explique cómo la pérdida de mielina afecta la **constante de espacio (λ)** y consecuentemente la velocidad de conducción. Incluya: (1) la fórmula $\\lambda = \\sqrt{R_m / R_i}$, (2) qué le ocurre a R_m cuando se pierde mielina, (3) cómo esto impacta λ, (4) por qué una λ menor resulta en conducción más lenta. Relacione con conducción electrotónica.',
      placeholder: 'Explique la relación entre mielina, constante de espacio y velocidad de conducción...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica que pérdida de mielina → R_m disminuye (~100x) → λ disminuye (~10x) → despolarización pasiva decae más rápido → no alcanza nodo siguiente → requiere regeneración más frecuente → conducción lenta. Conecta con conducción electrotónica. Fundamentación cuantitativa.',
        good: 'Identifica relación R_m-λ-velocidad correctamente, explica decaimiento más rápido de despolarización, fundamentación adecuada.',
        satisfactory: 'Menciona que λ disminuye y afecta conducción pero explicación superficial del mecanismo.',
        insufficient: 'No explica relación entre variables o confunde conceptos de propagación pasiva.',
      },
    },
    // CONCEPTUAL 3
    {
      id: generateQuestionId(),
      text: 'Explique el **fenómeno de Uhthoff** (empeoramiento de síntomas con calor) en enfermedades desmielinizantes. Incluya: (1) cómo el aumento de temperatura afecta los canales de Na⁺, (2) el concepto de "margen de seguridad" de la conducción saltatoria, (3) por qué fibras desmielinizadas con margen reducido sufren bloqueo de conducción con calor, (4) por qué es reversible al enfriarse.',
      placeholder: 'Explique el mecanismo biofísico del fenómeno de Uhthoff...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica que calor aumenta inactivación de canales Na⁺ → menor corriente disponible. Margen de seguridad (SF) normal ~5-7, en desmielinización ~1-1.5. Con calor, corriente cae por debajo de umbral → bloqueo de conducción. Reversible porque al enfriarse, canales recuperan función normal. Fundamentación sólida.',
        good: 'Identifica efecto térmico en canales Na⁺ y concepto de margen de seguridad reducido, conecta con bloqueo transitorio.',
        satisfactory: 'Menciona que calor empeora síntomas por afectación de canales pero explicación superficial del mecanismo.',
        insufficient: 'No explica mecanismo iónico o confunde causa del bloqueo de conducción.',
      },
    },
    // CONCEPTUAL 4
    {
      id: generateQuestionId(),
      text: 'Complete la tabla comparativa entre desmielinización y degeneración axonal, y explique por qué los hallazgos de Carolina (velocidad muy disminuida, amplitud preservada, latencia aumentada) son compatibles con desmielinización primaria: | Parámetro | Desmielinización | Degeneración Axonal | |-----------|------------------|---------------------| | Velocidad de conducción | ? | ? | | Amplitud del CMAP | ? | ? | | Latencia distal | ? | ? | | Morfología del axón | ? | ? |',
      placeholder: 'Complete la tabla y justifique el diagnóstico de desmielinización...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Tabla completa correcta: Desmielinización (velocidad muy↓, amplitud normal, latencia↑, axón intacto) vs Degeneración (velocidad normal/leve↓, amplitud muy↓, latencia normal/leve↑, pérdida axonal). Explica que en Carolina: axones intactos → todas fibras activadas → amplitud normal, pero mielina perdida → conducción lenta. Fundamentación diferencial clara.',
        good: 'Tabla mayormente correcta, identifica diferencias clave y conecta con hallazgos de Carolina.',
        satisfactory: 'Tabla parcialmente completa o explicación superficial de diferencias fisiopatológicas.',
        insufficient: 'Tabla incorrecta o no diferencia entre ambos procesos patológicos.',
      },
    },
    // CONCEPTUAL 5
    {
      id: generateQuestionId(),
      text: 'Seleccione el diagnóstico fisiopatológico correcto basándose en la presentación clínica y estudios: **A)** Degeneración axonal progresiva por proceso neurodegenerativo primario. **B)** Desmielinización segmentaria multifocal autoinmune con axones intactos, conducción enlentecida, latencias prolongadas pero amplitud preservada. **C)** Bloqueo de canales de Na⁺ por toxinas que impide generación de potenciales de acción. **D)** Alteración de transmisión neuromuscular por déficit de acetilcolina. Justifique su selección.',
      placeholder: 'Seleccione la opción correcta y justifique detalladamente...',
      wordLimit: 250,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Selecciona OPCIÓN B correctamente. Justifica con evidencia clínica (episodios recurrentes, neuritis óptica, síntomas multifocales), radiológica (lesiones desmielinizantes en RMN), electrofisiológica (velocidad↓ + amplitud preservada = axones intactos), y laboratorio (bandas oligoclonales). Descarta otras opciones con fundamento.',
        good: 'Selecciona opción B con justificación adecuada basada en hallazgos principales.',
        satisfactory: 'Selecciona opción correcta pero justificación incompleta o sin descartar alternativas.',
        insufficient: 'Selecciona opción incorrecta o justificación no basada en evidencia del caso.',
      },
    },
    // CONCEPTUAL 6
    {
      id: generateQuestionId(),
      text: 'Desarrolle una justificación fisiopatológica integral del caso de Carolina conectando: (1) Proceso autoinmune de desmielinización (mecanismo, estructuras atacadas), (2) Consecuencias estructurales (pérdida de mielina, preservación axonal, evidencia en RMN), (3) Alteraciones de conducción nerviosa (use cálculos previos de velocidad y retraso), (4) Manifestaciones clínicas (neuritis óptica, déficits episódicos, empeoramiento con calor).',
      placeholder: 'Desarrolle la justificación completa integrando todos los niveles de análisis...',
      wordLimit: 400,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Justificación integral completa: (1) Ataque autoinmune a mielina por linfocitos T y anticuerpos, (2) Lesiones desmielinizantes en SNC con axones preservados (RMN), (3) Velocidad reducida 56.7%, retraso 3.27 ms, amplitud preservada (cálculos citados), (4) Neuritis óptica, episodios recurrentes, Uhthoff, hiperreflexia. Conecta todos niveles coherentemente con vocabulario técnico preciso.',
        good: 'Integra mayoría de elementos solicitados, conecta mecanismo con manifestaciones, cita algunos cálculos.',
        satisfactory: 'Cubre algunos aspectos pero integración superficial o falta conexión entre niveles.',
        insufficient: 'Respuesta fragmentada sin integración o con errores conceptuales significativos.',
      },
    },
    // CONCEPTUAL 7
    {
      id: generateQuestionId(),
      text: 'Cite explícitamente conceptos del material del curso que se aplican a este caso: (1) Conducción saltatoria y rol de la mielina (Clase 5), (2) Constante de espacio (λ) y su relación con R_m (Clase 5), (3) Velocidad de conducción en fibras mielinizadas vs amielínicas (Clase 5), (4) Canales de Na⁺ concentrados en nodos de Ranvier (Clase 4), (5) Diferencia entre conducción saltatoria y conducción continua (Clase 5).',
      placeholder: 'Liste y explique brevemente cada concepto del curso aplicado al caso...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Cita los 5 conceptos explícitamente con referencia a clases específicas. Explica cómo cada concepto se aplica al caso de Carolina (ej: "Clase 5 explica conducción saltatoria que está alterada en Carolina por pérdida de mielina..."). Conexión precisa curso-caso.',
        good: 'Cita 4-5 conceptos con referencias a clases y conexión con el caso.',
        satisfactory: 'Cita 3 conceptos o conexiones superficiales con material del curso.',
        insufficient: 'Cita <3 conceptos o no conecta con contenido específico del curso.',
      },
    },
    // CONCEPTUAL 8
    {
      id: generateQuestionId(),
      text: 'Explique el pronóstico del caso de Carolina: (1) ¿Por qué un patrón de desmielinización con preservación axonal tiene mejor pronóstico que degeneración axonal? (2) ¿Qué implica el patrón de "recaídas y remisiones" observado en sus episodios previos? (3) ¿Qué tratamientos inmunomoduladores podrían prevenir nuevas lesiones? (4) ¿Es posible la remielinización parcial?',
      placeholder: 'Desarrolle el pronóstico y opciones terapéuticas del caso...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica que preservación axonal → potencial de recuperación vs pérdida axonal irreversible. Recaídas-remisiones típico de EM → enfermedad crónica con brotes. Tratamientos: interferones, glatiramer, natalizumab, fingolimod (inmunomoduladores). Remielinización parcial posible pero incompleta. Pronóstico variable pero mejor que degeneración. Fundamentación clínica sólida.',
        good: 'Identifica mejor pronóstico por preservación axonal, menciona tratamientos inmunomoduladores, remielinización posible.',
        satisfactory: 'Aspectos básicos de pronóstico pero explicación superficial de opciones terapéuticas.',
        insufficient: 'No diferencia pronósticos o no menciona opciones de tratamiento relevantes.',
      },
    },
    // CONCEPTUAL 9
    {
      id: generateQuestionId(),
      text: 'Explique la base bioeléctrica de los siguientes hallazgos clínicos en Carolina: (1) **Hiperreflexia y signo de Babinski** (lesión de vía piramidal en médula), (2) **Neuritis óptica con latencia P100 prolongada** (desmielinización de nervio óptico), (3) **Ataxia** (lesiones cerebelosas), (4) **Episodios previos autolimitados** (brotes con remielinización parcial). Conecte cada hallazgo con el proceso de desmielinización.',
      placeholder: 'Explique la base bioeléctrica de cada manifestación clínica...',
      wordLimit: 350,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica cada hallazgo: (1) Hiperreflexia: lesión desmielinizante de tracto corticoespinal → pérdida de inhibición descendente → reflejos exagerados, Babinski por lesión neurona motora superior. (2) Neuritis óptica: desmielinización nervio óptico → conducción lenta → latencia P100 prolongada (145 vs 100 ms). (3) Ataxia: lesiones cerebelosas → alteración de coordinación. (4) Remielinización parcial tras brote → mejoría transitoria. Conecta anatomía-función-bioelectricidad.',
        good: 'Explica 3-4 hallazgos correctamente con conexión a desmielinización.',
        satisfactory: 'Explica 2 hallazgos o explicaciones superficiales sin conexión bioeléctrica clara.',
        insufficient: 'Explica <2 hallazgos o no conecta con proceso de desmielinización.',
      },
    },
    // CONCEPTUAL 10
    {
      id: generateQuestionId(),
      text: 'Interprete las **bandas oligoclonales en LCR** en el contexto de este caso: (1) ¿Qué representan las bandas oligoclonales? (2) ¿Por qué su presencia indica síntesis intratecal de inmunoglobulinas? (3) ¿Cómo confirma esto el mecanismo autoinmune del proceso desmielinizante? (4) ¿Son específicas de Esclerosis Múltiple o se ven en otras enfermedades?',
      placeholder: 'Interprete el significado de las bandas oligoclonales en este contexto...',
      wordLimit: 250,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explica que bandas oligoclonales = clones específicos de células B produciendo IgG en SNC. Síntesis intratecal (no provienen de sangre) confirma proceso inmune activo en SNC. Apoya diagnóstico EM pero no específico (también en neurosífilis, neuroborreliosis, otras encefalitis). Indica actividad inflamatoria autoinmune contra mielina del SNC. Fundamentación inmunológica precisa.',
        good: 'Identifica bandas oligoclonales como evidencia de respuesta inmune intratecal, conecta con proceso autoinmune.',
        satisfactory: 'Menciona significado inmunológico básico pero explicación superficial.',
        insufficient: 'No explica significado de bandas oligoclonales o no conecta con autoinmunidad.',
      },
    },
    // CONCEPTUAL 11
    {
      id: generateQuestionId(),
      text: 'Analice críticamente: Si Carolina tuviera **degeneración axonal** en lugar de desmielinización, ¿cómo cambiarían los siguientes hallazgos? (1) Velocidad de conducción nerviosa, (2) Amplitud del CMAP, (3) Pronóstico de recuperación, (4) Reversibilidad de síntomas. Use este análisis contrafactual para demostrar por qué el diagnóstico de desmielinización es correcto.',
      placeholder: 'Desarrolle el análisis contrafactual comparativo...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Análisis contrafactual completo: Degeneración axonal → (1) Velocidad normal/leve↓ (fibras remanentes mielinizadas), (2) Amplitud muy↓ (pérdida de axones → menos fibras activadas), (3) Pronóstico pobre (pérdida neuronal irreversible), (4) No reversible (neuronas muertas no regeneran). En contraste, Carolina: velocidad muy↓ + amplitud preservada + episodios reversibles → confirma desmielinización con axones intactos. Demuestra razonamiento diagnóstico diferencial sólido.',
        good: 'Compara 3-4 aspectos correctamente entre degeneración y desmielinización, demuestra por qué diagnóstico es desmielinización.',
        satisfactory: 'Compara 2 aspectos o análisis superficial sin demostración clara del diagnóstico.',
        insufficient: 'No diferencia patrones o análisis confuso sin conclusión diagnóstica.',
      },
    },
  ],
};

// ============================================
// FUNCIÓN PARA INSERTAR ACTIVIDAD
// ============================================

async function insertActivity(activity: typeof esclerosisMultipleActivity, instructorId: string) {
  const now = getCurrentISODate();

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
  console.log(`   Preguntas: ${activity.questions.length} (3 cálculos + 8 conceptuales)`);
  console.log(`   Dificultad: ${activity.difficulty}`);
  console.log(`   Tiempo estimado: ${activity.estimatedTime} minutos`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 Creando Caso Clínico 2: Esclerosis Múltiple...\n');

  try {
    // Obtener instructor ID
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

    // Insertar Caso 2: Esclerosis Múltiple
    await insertActivity(esclerosisMultipleActivity, instructorId);

    console.log('\n✨ Caso Clínico 2 creado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   - Caso: Esclerosis Múltiple (Desmielinización)');
    console.log('   - Total preguntas: 11');
    console.log('   - Preguntas de cálculo: 3');
    console.log('   - Preguntas conceptuales: 8');
    console.log('   - Temas: Conducción saltatoria, constante de espacio, velocidad de conducción, diagnóstico diferencial');
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
