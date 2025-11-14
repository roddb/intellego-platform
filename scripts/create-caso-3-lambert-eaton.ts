/**
 * Script para crear Caso Clínico 3: Síndrome de Lambert-Eaton
 *
 * Caso: Debilidad Muscular con Mejoría al Ejercicio (Síndrome Paraneoplásico)
 * Preguntas: 17 (4 cálculos + 13 conceptuales)
 *
 * Run: npx tsx scripts/create-caso-3-lambert-eaton.ts
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
// CASO 3: SÍNDROME DE LAMBERT-EATON
// ============================================

const lambertEatonActivity = {
  id: generateId(),
  title: 'Caso Clínico 3: Debilidad Muscular con Mejoría al Ejercicio (Lambert-Eaton)',
  description: 'Análisis bioeléctrico de síndrome paraneoplásico que afecta la transmisión neuromuscular. Incluye cálculos de liberación cuántica de ACh, factor de seguridad, facilitación post-ejercicio y análisis de acoplamiento excitación-secreción.',
  caseText: `**PRESENTACIÓN DEL CASO**

Roberto, un hombre de 61 años con antecedentes de tabaquismo de 40 paquetes/año, consulta al servicio de neurología por un cuadro de 4 meses de evolución caracterizado por debilidad muscular proximal progresiva, principalmente en miembros inferiores, que le dificulta levantarse de una silla o subir escaleras. Lo particular del cuadro es que Roberto refiere que la debilidad es **más pronunciada al inicio de las actividades**, pero **mejora transitoriamente con el ejercicio o los movimientos repetidos**. Describe que "necesita calentamiento" antes de poder realizar tareas que requieren fuerza sostenida.

Además, Roberto menciona otros síntomas que considera molestos: sequedad de boca intensa (xerostomía) que interfiere con la alimentación, estreñimiento persistente, y ocasionalmente visión borrosa transitoria. Estos síntomas autonómicos coexisten con la debilidad muscular. No refiere ptosis palpebral (caída del párpado) ni diplopía (visión doble), a diferencia de lo que ocurriría en otras patologías neuromusculares.

En el interrogatorio dirigido sobre antecedentes, Roberto comenta que hace 6 meses le diagnosticaron un cáncer de pulmón de células pequeñas (carcinoma microcítico pulmonar), por el cual está recibiendo quimioterapia. La oncóloga le sugirió consultar a neurología porque algunos pacientes con este tipo de cáncer desarrollan "síndromes paraneoplásicos", es decir, manifestaciones neurológicas causadas por una respuesta autoinmune del organismo contra el tumor que afecta también al sistema nervioso.

Al examen físico se observa un paciente con buen estado general a pesar de la quimioterapia, consciente y orientado. La evaluación de la fuerza muscular revela debilidad proximal simétrica (fuerza 3/5 en músculos proximales de miembros inferiores), que **mejora transitoriamente a 4/5 tras realizar 10 contracciones voluntarias repetidas** (fenómeno de facilitación). Los reflejos osteotendinosos están **disminuidos o ausentes** (arreflexia), pero reaparecen brevemente tras ejercicio vigoroso. No hay atrofia muscular significativa. La sensibilidad es normal. No se observan fasciculaciones (contracciones espontáneas de fascículos musculares).

La médica neuróloga, sospechando un **síndrome paraneoplásico que afecta la transmisión neuromuscular**, solicita estudios complementarios.

### Datos de Estudios Complementarios

**Estudio de Conducción Nerviosa (Electroneurografía):**

Velocidad de conducción nerviosa sensitiva y motora: **Normal**
Amplitud basal del CMAP (Potencial de Acción Muscular Compuesto): **Disminuida** (1.8 mV vs normal >4.0 mV)

**Test de Estimulación Nerviosa Repetitiva:**

Se realizó un test de estimulación repetitiva del nervio cubital, registrando la respuesta en el músculo abductor del dedo meñique. Protocolo:
1. **Estimulación a baja frecuencia (3 Hz):** 10 estímulos consecutivos
2. **Ejercicio voluntario máximo:** 30 segundos de contracción voluntaria sostenida
3. **Estimulación inmediatamente post-ejercicio:** 1 estímulo único
4. **Estimulación de seguimiento:** A los 30 segundos, 1 minuto, 2 minutos, 3 minutos post-ejercicio

| Momento | Amplitud CMAP (mV) | Cambio respecto a Basal |
|---------|-------------------|-------------------------|
| **Basal (reposo)** | 1.8 mV | - |
| **Estímulo #3 (3 Hz)** | 1.7 mV | -5.5% (leve decreción) |
| **Estímulo #10 (3 Hz)** | 1.6 mV | -11% (decreción leve) |
| **Inmediatamente post-ejercicio** | **7.2 mV** | **+300%** (facilitación marcada) |
| **30 seg post-ejercicio** | 5.1 mV | +183% |
| **1 min post-ejercicio** | 3.8 mV | +111% |
| **2 min post-ejercicio** | 2.6 mV | +44% |
| **3 min post-ejercicio** | 2.0 mV | +11% (retorno casi basal) |

**Interpretación crítica:** Este patrón de **facilitación post-ejercicio** (incremento >100% de la amplitud del CMAP tras ejercicio) es altamente específico de un defecto **presináptico** de la transmisión neuromuscular.

**Anticuerpos séricos:**
- **Anticuerpos anti-canales de Ca²⁺ voltaje-dependientes tipo P/Q:** **Positivos** (título elevado)
- Anticuerpos anti-receptor de acetilcolina (AChR): Negativos
- Anticuerpos anti-MuSK: Negativos

**Tomografía de Tórax:**
- Masa pulmonar hiliar derecha de 3.5 cm, compatible con carcinoma de células pequeñas conocido
- Adenopatías mediastinales`,
  subject: 'Bioelectricidad',
  difficulty: 'hard' as const,
  estimatedTime: 70,
  activityType: 'clinical' as const,
  status: 'active' as const,
  questions: [
    // CÁLCULO 1
    {
      id: generateQuestionId(),
      text: 'En condiciones normales, cada vesícula sináptica contiene ~7,500 moléculas de ACh (1 cuanto) y se liberan ~100 cuantos por potencial de acción. Calcule el número total de moléculas de ACh liberadas en la hendidura sináptica por un único potencial de acción: $$\\text{ACh total} = m \\times q$$ donde m = número de cuantos (100) y q = moléculas por cuanto (7,500).',
      placeholder: 'Calcule el total de moléculas de ACh liberadas...',
      wordLimit: 100,
      questionType: 'calculation' as const,
      expectedFormula: 'ACh total = m × q',
      correctAnswer: 750000,
      expectedUnit: 'moléculas',
      tolerancePercentage: 5,
      rubric: {
        excellent: 'Cálculo correcto: 750,000 moléculas (±5%). Fórmula explícita, sustitución correcta, unidades presentes.',
        good: 'Cálculo correcto con fórmula y unidades.',
        satisfactory: 'Método correcto pero error menor en cálculo o sin unidades.',
        insufficient: 'Fórmula incorrecta o cálculo erróneo sin método válido.',
      },
    },
    // CÁLCULO 2
    {
      id: generateQuestionId(),
      text: 'El margen de seguridad de la transmisión neuromuscular se define como la relación entre ACh liberada y ACh mínima requerida. Si la ACh mínima para transmisión exitosa es el 10% de lo normal: (A) ¿Cuántas moléculas de ACh son suficientes como mínimo? (B) Calcule el factor de seguridad: $$SF = \\frac{\\text{ACh liberada}}{\\text{ACh mínima requerida}}$$',
      placeholder: 'Calcule ACh mínima y factor de seguridad...',
      wordLimit: 150,
      questionType: 'calculation' as const,
      expectedFormula: 'SF = ACh liberada / ACh mínima requerida',
      correctAnswer: 10,
      expectedUnit: 'SF',
      tolerancePercentage: 5,
      rubric: {
        excellent: 'Cálculo completo: (A) 75,000 moléculas, (B) SF = 10. Fórmula explícita, interpretación del margen de seguridad robusto.',
        good: 'Ambos cálculos correctos con fórmula.',
        satisfactory: 'Un cálculo correcto o método correcto con error menor.',
        insufficient: 'Error en aplicación de fórmula o cálculos incorrectos.',
      },
    },
    // CÁLCULO 3
    {
      id: generateQuestionId(),
      text: 'En el Síndrome de Lambert-Eaton, la liberación de ACh se reduce a ~10% del normal (10 cuantos en lugar de 100). (A) Calcule la ACh liberada en LEMS en reposo usando la fórmula de la pregunta 1. (B) Compare con el mínimo requerido (pregunta 2A). (C) Calcule el nuevo factor de seguridad en LEMS en reposo. ¿Es suficiente para transmisión exitosa?',
      placeholder: 'Calcule ACh en LEMS, compare con mínimo y calcule SF...',
      wordLimit: 200,
      questionType: 'calculation' as const,
      expectedFormula: 'ACh_LEMS = 10 × 7500; SF_LEMS = ACh_LEMS / ACh_mínima',
      correctAnswer: 1,
      expectedUnit: 'SF',
      tolerancePercentage: 10,
      rubric: {
        excellent: 'Cálculos completos: (A) 75,000 moléculas, (B) igual al mínimo requerido, (C) SF ≈ 1. Interpreta que SF=1 está en umbral crítico → fallo de transmisión frecuente → debilidad muscular. Fundamentación clara.',
        good: 'Cálculos correctos con interpretación del SF crítico.',
        satisfactory: 'Cálculos mayormente correctos pero interpretación superficial.',
        insufficient: 'Errores en cálculos o no interpreta significado de SF=1.',
      },
    },
    // CÁLCULO 4
    {
      id: generateQuestionId(),
      text: 'Tras ejercicio vigoroso, se acumula Ca²⁺ residual que aumenta la liberación a ~80 cuantos. (A) Calcule ACh liberada post-ejercicio. (B) Calcule el nuevo SF post-ejercicio. (C) Relacione el aumento de SF con: (1) la mejoría de fuerza muscular (de 3/5 a 4/5), (2) el incremento de amplitud del CMAP (de 1.8 mV a 7.2 mV, +300%).',
      placeholder: 'Calcule ACh post-ejercicio, SF y relacione con manifestaciones clínicas...',
      wordLimit: 250,
      questionType: 'calculation' as const,
      expectedFormula: 'ACh_post = 80 × 7500; SF_post = ACh_post / ACh_mínima',
      correctAnswer: 8,
      expectedUnit: 'SF',
      tolerancePercentage: 10,
      rubric: {
        excellent: 'Cálculos completos: (A) 600,000 moléculas, (B) SF ≈ 8. Relaciona SF 1→8 con: (1) casi todas uniones transmiten → más fibras contraen → fuerza mejora, (2) más fibras activadas sincrónicamente → amplitud aumenta 4x. Conexión clara entre cálculos y manifestaciones.',
        good: 'Cálculos correctos con conexión adecuada a manifestaciones clínicas.',
        satisfactory: 'Cálculos correctos pero conexión superficial con clínica.',
        insufficient: 'Errores en cálculos o no relaciona con manifestaciones.',
      },
    },
    // CONCEPTUAL 1
    {
      id: generateQuestionId(),
      text: 'Explique detalladamente la secuencia normal de acoplamiento excitación-secreción en la unión neuromuscular: (1) Despolarización de terminal presináptica, (2) Apertura de canales de Ca²⁺ tipo P/Q, (3) Entrada masiva de Ca²⁺ (de ~100 nM a ~100 μM), (4) Unión de Ca²⁺ a sinaptotagmina, (5) Fusión vesicular mediada por complejo SNARE, (6) Liberación de ACh. Luego explique cómo este mecanismo falla en LEMS.',
      placeholder: 'Explique la secuencia completa de acoplamiento excitación-secreción y su falla en LEMS...',
      wordLimit: 400,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Secuencia completa explicada con detalle molecular. Falla en LEMS: anticuerpos bloquean canales P/Q → entrada de Ca²⁺ reducida (100 μM → 10-20 μM) → relación cooperativa (Liberación ∝ [Ca²⁺]⁴) → reducción dramática de fusión vesicular (100→10 cuantos) → ACh insuficiente → fallo de transmisión. Vocabulario técnico preciso, fundamentación biofísica sólida.',
        good: 'Secuencia correcta explicada, identifica bloqueo de Ca²⁺ como causa principal en LEMS, conecta con reducción de liberación.',
        satisfactory: 'Secuencia básica correcta pero explicación superficial de mecanismo en LEMS.',
        insufficient: 'Secuencia incompleta o no explica falla en LEMS correctamente.',
      },
    },
    // CONCEPTUAL 2
    {
      id: generateQuestionId(),
      text: 'Diferencie Miastenia Gravis (MG) vs Lambert-Eaton (LEMS) completando la tabla y explicando las razones biofísicas: | Característica | MG | LEMS | |----------------|-----|------| | Sitio del defecto | ? | ? | | Liberación de ACh | ? | ? | | Receptores de ACh | ? | ? | | Patrón clínico con ejercicio | ? | ? | | Amplitud CMAP basal | ? | ? | | Facilitación post-ejercicio | ? | ? |',
      placeholder: 'Complete la tabla comparativa y explique las diferencias biofísicas...',
      wordLimit: 400,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Tabla completa correcta: MG (postsináptico, ACh normal, receptores reducidos, empeora con ejercicio, CMAP normal/leve↓, facilitación <25%) vs LEMS (presináptico, ACh reducida, receptores normales, mejora con ejercicio, CMAP muy↓, facilitación >100%). Explica razones biofísicas: MG→déficit de receptores con depleción de ACh por estimulación repetida; LEMS→déficit de ACh que se compensa con acumulación de Ca²⁺ residual. Fundamentación diferencial sólida.',
        good: 'Tabla mayormente correcta con explicación adecuada de diferencias biofísicas entre MG y LEMS.',
        satisfactory: 'Tabla parcialmente completa o explicación superficial de mecanismos.',
        insufficient: 'Tabla incorrecta o no diferencia mecanismos fisiopatológicos.',
      },
    },
    // CONCEPTUAL 3
    {
      id: generateQuestionId(),
      text: 'Explique el mecanismo paraneoplásico del Síndrome de Lambert-Eaton: (1) ¿Por qué el carcinoma de pulmón de células pequeñas expresa canales de Ca²⁺ P/Q? (2) ¿Cómo se generan los anticuerpos? (3) ¿Qué es el mimetismo molecular? (4) ¿Por qué se clasifica como síndrome paraneoplásico (no metástasis)? (5) ¿Por qué puede aparecer antes del diagnóstico del cáncer?',
      placeholder: 'Explique el mecanismo paraneoplásico completo del LEMS...',
      wordLimit: 400,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación completa: (1) SCLC es tumor neuroendocrino que expresa canales P/Q aberrantemente, (2) Sistema inmune genera anticuerpos anti-tumor que incluyen anti-P/Q, (3) Mimetismo: anticuerpos reconocen epítopos compartidos entre células tumorales y neuronas → ataque cruzado, (4) Paraneoplásico porque daño es mediado por respuesta inmune (no invasión directa del tumor), (5) Respuesta inmune se genera cuando tumor es pequeño → síntomas neurológicos preceden síntomas oncológicos. Fundamentación inmunológica precisa.',
        good: 'Explica mecanismo paraneoplásico correctamente, identifica rol de anticuerpos y mimetismo molecular.',
        satisfactory: 'Explicación básica del mecanismo autoinmune pero superficial en detalles moleculares.',
        insufficient: 'No explica mecanismo paraneoplásico o confunde con otros procesos.',
      },
    },
    // CONCEPTUAL 4
    {
      id: generateQuestionId(),
      text: 'Explique la cinética temporal de la facilitación post-ejercicio usando los datos del caso: amplitud aumenta de 1.8 a 7.2 mV inmediatamente post-ejercicio, luego decae progresivamente (5.1→3.8→2.6→2.0 mV) en 3 minutos. Incluya: (1) Acumulación de Ca²⁺ residual durante ejercicio, (2) Mayor liberación de ACh post-ejercicio por Ca²⁺ elevado, (3) Decaimiento exponencial por remoción de Ca²⁺ (bombas SERCA, constante de tiempo τ≈1 min).',
      placeholder: 'Explique la cinética de facilitación y su decaimiento temporal...',
      wordLimit: 350,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación completa de cinética: (1) Ejercicio→entrada repetida de Ca²⁺ excede capacidad de remoción→[Ca²⁺] aumenta de 100 nM a 500-1000 nM, (2) Estímulo post-ejercicio sobre Ca²⁺ elevado→[Ca²⁺]local alcanza 30-40 μM→liberación aumenta por relación cooperativa (∝[Ca²⁺]⁴)→80 cuantos vs 10, (3) En reposo, bombas eliminan Ca²⁺ con τ≈1 min→decaimiento exponencial de facilitación. Fundamentación cuantitativa con datos del caso.',
        good: 'Explica acumulación de Ca²⁺ y decaimiento temporal correctamente, usa datos del caso.',
        satisfactory: 'Identificaelementos básicos pero explicación superficial de cinética.',
        insufficient: 'No explica mecanismo temporal o no usa datos del caso.',
      },
    },
    // CONCEPTUAL 5
    {
      id: generateQuestionId(),
      text: 'Analice por qué en MG la fatiga **empeora** con ejercicio repetido mientras que en LEMS **mejora** con ejercicio. Considere: En MG hay receptores reducidos pero ACh normal→con estimulación repetida, ACh se depleta localmente por acetilcolinesterasa→fallo progresivo. En LEMS hay receptores normales pero ACh reducida→con ejercicio, Ca²⁺ residual acumula→mayor liberación de ACh→transmisión exitosa.',
      placeholder: 'Explique las razones biofísicas de patrones opuestos con ejercicio...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación diferencial clara: MG→liberación normal pero receptores insuficientes + depleción local de ACh con estimulación repetida + desensibilización de receptores→decreción progresiva. LEMS→receptores normales pero liberación insuficiente + acumulación de Ca²⁺ con ejercicio→compensación temporal del déficit→facilitación. Fundamentación biofísica precisa de patrones opuestos.',
        good: 'Diferencia mecanismos correctamente, explica por qué patrones clínicos son opuestos.',
        satisfactory: 'Identificadiferencias básicas pero explicación superficial de mecanismos.',
        insufficient: 'No diferencia mecanismos o explicación confusa.',
      },
    },
    // CONCEPTUAL 6
    {
      id: generateQuestionId(),
      text: 'Explique por qué la amplitud del CMAP basal es **mucho más baja en LEMS (1.8 mV) que en MG (3-4 mV)**. Considere que la amplitud refleja el número de fibras musculares activadas sincrónicamente. En MG: ACh normal (SF≈3-5) permite que 80-90% de uniones transmitan en reposo. En LEMS: ACh muy reducida (SF≈1) causa que solo 20-30% de uniones transmitan en reposo.',
      placeholder: 'Explique la diferencia en amplitud basal entre LEMS y MG...',
      wordLimit: 250,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación clara: Amplitud CMAP = proporción de fibras activadas. MG: SF≈3-5 → 80-90% uniones transmiten → amplitud normal/leve↓ (3-4 mV). LEMS: SF≈1 → solo 20-30% uniones transmiten (variabilidad estocástica) → amplitud muy↓ (1-2 mV). Post-ejercicio en LEMS: SF≈8 → 100% transmiten → amplitud normaliza (7-8 mV). Fundamentación cuantitativa.',
        good: 'Conecta SF con proporción de uniones exitosas y amplitud del CMAP correctamente.',
        satisfactory: 'Identificarelación básica entre transmisión y amplitud pero explicación superficial.',
        insufficient: 'No explica por qué amplitudes son diferentes o no conecta con SF.',
      },
    },
    // CONCEPTUAL 7
    {
      id: generateQuestionId(),
      text: 'Explique las manifestaciones **autonómicas** en Roberto (xerostomía, estreñimiento, alteraciones visuales). ¿Por qué los anticuerpos anti-canales P/Q afectan también el sistema nervioso autónomo? ¿Qué neuronas autonómicas están afectadas? ¿Cómo se relaciona esto con la distribución de canales P/Q en terminales presinápticas autonómicas?',
      placeholder: 'Explique las manifestaciones autonómicas del LEMS...',
      wordLimit: 250,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación completa: Anticuerpos anti-P/Q atacan también neuronas preganglionares autonómicas (simpáticas y parasimpáticas) que expresan canales P/Q. Bloqueo de liberación de ACh en sinapsis autonómicas→xerostomía (↓secreción salival parasimpática), estreñimiento (↓motilidad intestinal), alteraciones pupilares, hipotensión ortostática. Distribución amplia de canales P/Q en SN autónomo explica síntomas multiorgánicos. Fundamentación anatómica-funcional.',
        good: 'Identifica afectación de sistema autonómico por mismo mecanismo que unión neuromuscular, explica síntomas principales.',
        satisfactory: 'Menciona síntomas autonómicos pero explicación superficial del mecanismo.',
        insufficient: 'No explica por qué hay síntomas autonómicos o no conecta con canales P/Q.',
      },
    },
    // CONCEPTUAL 8
    {
      id: generateQuestionId(),
      text: 'Analice por qué Roberto **NO presenta ptosis ni diplopía** (síntomas oculares característicos de MG). Considere que los músculos extraoculares tienen uniones neuromusculares con características específicas y menor dependencia de canales P/Q tipo comparado con músculos proximales. En contraste, explique por qué la debilidad afecta principalmente músculos **proximales** (cintura pélvica/escapular).',
      placeholder: 'Explique el patrón de distribución muscular afectado en LEMS vs MG...',
      wordLimit: 250,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación diferencial: Músculos extraoculares en LEMS están relativamente preservados porque sus uniones tienen menor dependencia de canales P/Q (usan canales alternativos tipo N/R más eficientemente) o menor densidad de sitios de unión de anticuerpos. Músculos proximales más afectados por mayor dependencia de canales P/Q para liberación de ACh. Contrasta con MG donde músculos oculares son típicamente primeros afectados. Fundamentación anatomo-funcional.',
        good: 'Identifica distribución diferente de afectación muscular entre LEMS y MG, explica razonablemente.',
        satisfactory: 'Menciona diferencia de distribución pero explicación superficial.',
        insufficient: 'No explica patrón de distribución muscular o confunde con MG.',
      },
    },
    // CONCEPTUAL 9
    {
      id: generateQuestionId(),
      text: 'Explique la **relación cooperativa** entre [Ca²⁺] y liberación de neurotransmisores: $$\\text{Liberación} \\propto [Ca^{2+}]^n$$ donde n=3-4. Use esta relación para explicar: (1) Por qué una reducción del 80% en [Ca²⁺] (de 100 μM a 20 μM) causa una reducción del 99% en liberación, (2) Por qué un aumento modesto de [Ca²⁺] con ejercicio (de 20 μM a 40 μM) causa aumento dramático de liberación (factor de 16x).',
      placeholder: 'Explique la relación cooperativa y sus implicancias cuantitativas...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación cuantitativa completa: (1) Reducción 80%: (20/100)⁴ = 0.0016 → liberación cae a 0.16% (reducción 99.84%). (2) Aumento 2x: (40/20)⁴ = 16 → liberación aumenta 16 veces. Relación cooperativa (n=3-4) amplifica cambios en [Ca²⁺] exponencialmente. Explica por qué pequeñas reducciones de Ca²⁺ causan gran déficit y pequeños aumentos (Ca²⁺ residual) causan gran facilitación. Fundamentación matemática precisa.',
        good: 'Explica relación cooperativa correctamente con cálculos cuantitativos, interpreta implicancias.',
        satisfactory: 'Identifica relación cooperativa pero cálculos incompletos o interpretación superficial.',
        insufficient: 'No explica relación cooperativa o no realiza cálculos cuantitativos.',
      },
    },
    // CONCEPTUAL 10
    {
      id: generateQuestionId(),
      text: 'Explique el fenómeno de **arreflexia con reaparición post-ejercicio** en Roberto. Los reflejos osteotendinosos dependen de transmisión neuromuscular efectiva en el arco reflejo. Con SF<1 en reposo, las sinapsis neuromusculares de las motoneuronas alfa fallan→reflejos ausentes. Tras ejercicio, SF≈8→sinapsis transmiten→reflejos reaparecen transitoriamente. ¿Por qué este hallazgo es diagnóstico de LEMS?',
      placeholder: 'Explique el mecanismo de arreflexia transitoria y su valor diagnóstico...',
      wordLimit: 250,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación completa: Reflejos requieren transmisión neuromuscular efectiva (SF>1) en arco monosináptico. LEMS en reposo: SF≈1→fallo de transmisión→reflejos ausentes. Post-ejercicio: Ca²⁺ residual→SF≈8→transmisión restaurada→reflejos reaparecen transitoriamente (2-3 min). Fenómeno diagnóstico de defecto presináptico (específico de LEMS, no ocurre en MG ni neuropatías). Paralelo con facilitación electrofisiológica del CMAP. Fundamentación clara.',
        good: 'Explica mecanismo de arreflexia dependiente de SF, identifica valor diagnóstico.',
        satisfactory: 'Identificaconexión básica entre transmisión y reflejos pero explicación superficial.',
        insufficient: 'No explica por qué reflejos ausentes o no identifica valor diagnóstico.',
      },
    },
    // CONCEPTUAL 11
    {
      id: generateQuestionId(),
      text: 'Seleccione el diagnóstico correcto: **A)** Miastenia Gravis (bloqueo postsináptico de receptores ACh). **B)** Síndrome de Lambert-Eaton (bloqueo presináptico de canales Ca²⁺ P/Q, síndrome paraneoplásico, facilitación >100% post-ejercicio). **C)** Esclerosis Lateral Amiotrófica (degeneración de motoneuronas). **D)** Polineuropatía desmielinizante. Justifique su selección con evidencia clínica, electrofisiológica e inmunológica del caso.',
      placeholder: 'Seleccione la opción correcta y justifique exhaustivamente...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Selecciona OPCIÓN B correctamente. Justificación completa: Clínica (debilidad proximal con mejoría al ejercicio, síntomas autonómicos, asociación con SCLC), Electrofisiológica (amplitud CMAP muy↓ + facilitación marcada >100% post-ejercicio = defecto presináptico), Inmunológica (anticuerpos anti-canales Ca²⁺ P/Q positivos). Descarta otras opciones con fundamento: A (MG→empeora con ejercicio), C (ELA→degeneración sin facilitación), D (neuropatía→velocidad↓ sin facilitación). Diagnóstico diferencial sólido.',
        good: 'Selecciona opción B con justificación adecuada basada en hallazgos principales, descarta algunas alternativas.',
        satisfactory: 'Selecciona opción correcta pero justificación incompleta o no descarta alternativas.',
        insufficient: 'Selecciona opción incorrecta o justificación no basada en evidencia.',
      },
    },
    // CONCEPTUAL 12
    {
      id: generateQuestionId(),
      text: 'Desarrolle una justificación fisiopatológica integral conectando: (1) Mecanismo autoinmune paraneoplásico (SCLC→anticuerpos anti-P/Q→mimetismo molecular), (2) Alteración presináptica (bloqueo Ca²⁺→reducción liberación ACh de 100 a 10 cuantos), (3) Caída de factor de seguridad (SF: 10→1 en reposo, 1→8 post-ejercicio), (4) Facilitación post-ejercicio (acumulación Ca²⁺ residual, cinética τ≈1 min), (5) Manifestaciones clínicas (debilidad mejora con ejercicio, síntomas autonómicos, facilitación +300%).',
      placeholder: 'Desarrolle la justificación fisiopatológica integral completa...',
      wordLimit: 450,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Justificación integral excepcional conectando todos niveles: (1) SCLC expresa canales P/Q→anticuerpos IgG anti-P/Q→mimetismo con neuronas, (2) Bloqueo/internalización canales→entrada Ca²⁺ reducida (100→20 μM)→liberación cooperativa→10 cuantos vs 100, (3) SF cae de 10 a 1 (umbral crítico)→fallo transmisión→debilidad; post-ejercicio SF=8→transmisión exitosa, (4) Ejercicio→Ca²⁺ residual acumula→siguiente estímulo alcanza 40 μM→liberación aumenta 8x (cooperatividad)→decae con τ≈1 min, (5) Clínica: mejoría 3/5→4/5, CMAP 1.8→7.2 mV, síntomas autonómicos. Integración perfecta con cálculos previos citados.',
        good: 'Integra 4-5 niveles correctamente, conecta mecanismo con manifestaciones, cita algunos cálculos.',
        satisfactory: 'Cubre 3 niveles pero integración superficial o falta conexión entre elementos.',
        insufficient: 'Respuesta fragmentada sin integración coherente o errores conceptuales.',
      },
    },
    // CONCEPTUAL 13
    {
      id: generateQuestionId(),
      text: 'Cite explícitamente conceptos del curso aplicados a este caso: (1) Acoplamiento excitación-secreción y rol del Ca²⁺ (Clase 6), (2) Liberación cuántica de neurotransmisores (Clase 6), (3) Margen de seguridad de transmisión neuromuscular (Clase 6), (4) Canales de Ca²⁺ voltaje-dependientes (Clase 4), (5) Relación cooperativa [Ca²⁺]-exocitosis (Clase 6), (6) Transporte activo y bombas Ca²⁺-ATPasa (Clase 1).',
      placeholder: 'Liste y explique cada concepto del curso aplicado al caso de Roberto...',
      wordLimit: 350,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Cita los 6 conceptos explícitamente con referencias a clases. Explica aplicación al caso: (1) Clase 6→secuencia PA→Ca²⁺→ACh interrumpida en LEMS, (2) Clase 6→liberación cuántica reducida de 100 a 10 vesículas, (3) Clase 6→SF=10 normal vs SF=1 en LEMS, (4) Clase 4→canales P/Q bloqueados por anticuerpos, (5) Clase 6→Liberación∝[Ca²⁺]⁴ explica facilitación dramática, (6) Clase 1→bombas SERCA eliminan Ca²⁺ residual (τ≈1 min). Conexión precisa curso-caso.',
        good: 'Cita 5-6 conceptos con referencias y conexión con el caso.',
        satisfactory: 'Cita 3-4 conceptos o conexiones superficiales.',
        insufficient: 'Cita <3 conceptos o no conecta con caso específicamente.',
      },
    },
    // CONCEPTUAL 14
    {
      id: generateQuestionId(),
      text: 'Explique las opciones de tratamiento para LEMS: (1) **3,4-Diaminopiridina (3,4-DAP)**: bloquea canales de K⁺→prolonga despolarización→aumenta entrada de Ca²⁺ por canales residuales. (2) **Plasmaféresis/IVIg**: eliminan anticuerpos. (3) **Inmunosupresores** (corticoides, azatioprina): reducen producción de anticuerpos. (4) **Quimioterapia del SCLC**: reduce carga antigénica. ¿Por qué SCLC con LEMS tiene mejor pronóstico oncológico?',
      placeholder: 'Explique tratamientos y pronóstico en LEMS...',
      wordLimit: 350,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación completa de tratamientos: (1) 3,4-DAP→bloqueo K⁺→despolarización prolongada→más tiempo canales Ca²⁺ abiertos→compensa déficit de canales bloqueados, (2) Plasmaféresis/IVIg→eliminan/neutralizan anticuerpos patogénicos, (3) Inmunosupresores→reducen producción de anticuerpos a largo plazo, (4) Quimioterapia→reduce tumor→menos antígeno→menos anticuerpos. Mejor pronóstico oncológico: respuesta inmune que causa LEMS también ataca tumor→control parcial del crecimiento tumoral (sobrevida 14 vs 7 meses). Fundamentación terapéutica completa.',
        good: 'Explica 3-4 tratamientos correctamente, menciona mejor pronóstico con LEMS.',
        satisfactory: 'Menciona 2 tratamientos o explicación superficial de mecanismos.',
        insufficient: 'Menciona <2 tratamientos o no explica mecanismos.',
      },
    },
    // CONCEPTUAL 15
    {
      id: generateQuestionId(),
      text: 'Analice el **decaimiento exponencial** de la facilitación observado en los datos: 7.2→5.1→3.8→2.6→2.0 mV en 3 minutos. Modele el decaimiento como: $$\\text{Amplitud}(t) = 1.8 + 5.4 \\cdot e^{-t/\\tau}$$ donde 1.8 mV es el basal y τ es la constante de tiempo. Usando el dato de 1 minuto (3.8 mV), estime τ. ¿Qué proceso biológico determina esta constante de tiempo?',
      placeholder: 'Analice el decaimiento exponencial y estime la constante de tiempo...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Análisis cuantitativo: 3.8 = 1.8 + 5.4·e^(-1/τ) → 2.0 = 5.4·e^(-1/τ) → e^(-1/τ) = 0.37 → τ≈1.1 min. Interpreta que τ refleja eficiencia de bombas de Ca²⁺ (SERCA principalmente) eliminando Ca²⁺ residual del citoplasma. Valor consistente con cinética reportada de SERCA en terminales presinápticas (~1-2 min). Decaimiento exponencial típico de procesos de eliminación de primer orden. Fundamentación matemática y biológica.',
        good: 'Estima τ correctamente (~1 min), identifica que refleja remoción de Ca²⁺ por bombas.',
        satisfactory: 'Intenta estimación o identificación cualitativa de proceso pero análisis superficial.',
        insufficient: 'No realiza estimación o no identifica proceso biológico responsable.',
      },
    },
    // CONCEPTUAL 16
    {
      id: generateQuestionId(),
      text: 'Explique por qué el patrón de **facilitación >100% post-ejercicio** es **patognomónico** (altamente específico) de defecto presináptico como LEMS, y NO se observa en: (1) Miastenia Gravis (defecto postsináptico), (2) Neuropatías (defecto de conducción axonal), (3) Miopatías (defecto muscular). Conecte con el concepto de que solo un déficit de liberación de neurotransmisor puede ser compensado por acumulación de Ca²⁺.',
      placeholder: 'Explique la especificidad diagnóstica de la facilitación marcada...',
      wordLimit: 300,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Explicación diferencial completa: Facilitación >100% indica defecto de liberación presináptica que puede compensarse con Ca²⁺ residual. (1) MG: receptores reducidos (estructura postsináptica)→Ca²⁺ no compensa falta de receptores→facilitación <25%, (2) Neuropatías: mielina/axones dañados→Ca²⁺ no afecta conducción→sin facilitación, (3) Miopatías: fibras musculares dañadas→Ca²⁺ presináptico no repara músculo→sin facilitación. Solo déficit de Ca²⁺/liberación (LEMS) responde a acumulación de Ca²⁺. Facilitación >100% = firma diagnóstica de defecto presináptico. Fundamentación diferencial sólida.',
        good: 'Explica especificidad de facilitación para defecto presináptico, diferencia de otras patologías.',
        satisfactory: 'Identificaespecificidad básica pero explicación superficial de por qué otras condiciones no facilitan.',
        insufficient: 'No explica especificidad o no diferencia de otras patologías neuromusculares.',
      },
    },
    // CONCEPTUAL 17
    {
      id: generateQuestionId(),
      text: 'Analice críticamente: Si Roberto tuviera **Miastenia Gravis** en lugar de LEMS, ¿cómo cambiarían los siguientes hallazgos? (1) Patrón clínico con ejercicio, (2) Músculos típicamente afectados, (3) Amplitud basal del CMAP, (4) Test de estimulación repetitiva, (5) Facilitación post-ejercicio, (6) Anticuerpos séricos. Use este análisis contrafactual para demostrar por qué el diagnóstico de LEMS es correcto.',
      placeholder: 'Desarrolle análisis contrafactual MG vs LEMS...',
      wordLimit: 350,
      questionType: 'text' as const,
      rubric: {
        excellent: 'Análisis contrafactual completo: MG→(1) Empeora con ejercicio (depleción ACh), (2) Músculos oculares/bulbares (ptosis, diplopía), (3) Amplitud normal/leve↓ (3-4 mV), (4) Decreción >10% a 3 Hz, (5) Facilitación <25% (no significativa), (6) Anticuerpos anti-AChR o anti-MuSK. Contrasta con Roberto: mejora con ejercicio, músculos proximales, amplitud muy↓ (1.8 mV), leve decreción, facilitación +300%, anti-canales Ca²⁺ P/Q. Demuestra razonamiento diagnóstico diferencial excepcional.',
        good: 'Compara 4-5 aspectos correctamente, demuestra por qué diagnóstico es LEMS.',
        satisfactory: 'Compara 2-3 aspectos o análisis superficial.',
        insufficient: 'No diferencia patrones o análisis confuso sin conclusión diagnóstica.',
      },
    },
  ],
};

// ============================================
// FUNCIÓN PARA INSERTAR ACTIVIDAD
// ============================================

async function insertActivity(activity: typeof lambertEatonActivity, instructorId: string) {
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
  console.log(`   Preguntas: ${activity.questions.length} (4 cálculos + 13 conceptuales)`);
  console.log(`   Dificultad: ${activity.difficulty}`);
  console.log(`   Tiempo estimado: ${activity.estimatedTime} minutos`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 Creando Caso Clínico 3: Síndrome de Lambert-Eaton...\n');

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

    // Insertar Caso 3: Lambert-Eaton
    await insertActivity(lambertEatonActivity, instructorId);

    console.log('\n✨ Caso Clínico 3 creado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   - Caso: Síndrome de Lambert-Eaton (Síndrome Paraneoplásico)');
    console.log('   - Total preguntas: 17');
    console.log('   - Preguntas de cálculo: 4');
    console.log('   - Preguntas conceptuales: 13');
    console.log('   - Temas: Transmisión sináptica, liberación cuántica, margen de seguridad, facilitación post-ejercicio');
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
