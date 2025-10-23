# Diagrama de Flujo - Sistema de Corrección Automática

**Fecha**: 21 de Octubre, 2025
**Versión**: 1.0

---

## 🔄 Flujo Principal: End-to-End

```
┌─────────────────────────────────────────────────────────────────┐
│                         INICIO                                  │
│              Instructor sube archivo(s) .md                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   API ENDPOINT: POST          │
         │   /api/instructor/            │
         │   evaluation/correct          │
         │                               │
         │   Body: {                     │
         │     files: File[],            │
         │     metadata: {               │
         │       subject: string,        │
         │       examTopic: string,      │
         │       examDate: string,       │
         │       instructorId: string    │
         │     }                         │
         │   }                           │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   VALIDACIÓN INICIAL          │
         │   - Auth check (instructor?)  │
         │   - Validar archivos .md      │
         │   - Validar metadata          │
         │   - Rate limiting check       │
         └───────────────┬───────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         [✅ VÁLIDO]      [❌ ERROR]
                │                 │
                │                 └──> Return 400 Bad Request
                │
                ▼
         ┌───────────────────────────────┐
         │   CREAR BATCH ID              │
         │   batchId = "batch_" + UUID   │
         │   Status: PROCESSING          │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   ITERAR POR CADA ARCHIVO     │
         │   for (file of files) { ... } │
         └───────────────┬───────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    COMPONENTE 1: PARSER                        │
│                                                                │
│  Input: file (Buffer), metadata                               │
│  Proceso:                                                      │
│    1. Extraer apellido del filename                           │
│       - filename: "Gonzalez.md" → apellido: "Gonzalez"       │
│       - filename: "Di_Bernardo.md" → apellido: "Di Bernardo"│
│       - Normalizar: remover tildes, espacios, etc.           │
│                                                                │
│    2. Leer contenido del archivo                              │
│       - Parsear markdown                                       │
│       - Identificar ejercicios (## Ejercicio 1, 2, ...)      │
│       - Extraer desarrollo del alumno                         │
│                                                                │
│  Output: {                                                     │
│    apellido: string,                                          │
│    rawContent: string,                                        │
│    exercises: Exercise[]                                      │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                  COMPONENTE 2: MATCHER                         │
│                                                                │
│  Input: apellido (string)                                      │
│  Proceso:                                                      │
│    1. Query DB: User table                                     │
│       SELECT * FROM User                                       │
│       WHERE role = 'STUDENT'                                   │
│         AND status = 'ACTIVE'                                  │
│         AND name LIKE '%[apellido]%'                          │
│                                                                │
│    2. Fuzzy matching si múltiples matches                      │
│       - Levenshtein distance                                   │
│       - Score de similitud                                     │
│       - Threshold: 90%                                         │
│                                                                │
│    3. Si no hay match → ERROR                                  │
│                                                                │
│  Output: {                                                     │
│    student: {                                                  │
│      id: string,                                              │
│      name: string,                                            │
│      academicYear: string,                                    │
│      division: string                                         │
│    },                                                          │
│    matchConfidence: number                                     │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         [✅ MATCH]       [❌ NO MATCH]
                │                 │
                │                 └──> Log error, continue next file
                │
                ▼
┌────────────────────────────────────────────────────────────────┐
│           COMPONENTE 3: HISTORY CHECKER                        │
│                                                                │
│  Input: studentId (string)                                     │
│  Proceso:                                                      │
│    1. Query DB: Feedback table                                 │
│       SELECT COUNT(*) as feedbackCount                         │
│       FROM Feedback                                            │
│       WHERE studentId = ?                                      │
│         AND createdAt > (now() - 90 days)                     │
│                                                                │
│    2. Determinar workflow                                      │
│       if (feedbackCount >= 3) {                               │
│         workflow = "W103" (COMPARATIVO)                        │
│         categoryData = "DATOS_COMPLETOS"                       │
│       } else if (feedbackCount > 0) {                         │
│         workflow = "W103" (COMPARATIVO)                        │
│         categoryData = "DATOS_INSUFICIENTES"                   │
│       } else {                                                 │
│         workflow = "W104" (BASICO)                             │
│         categoryData = "SIN_HISTORIAL"                         │
│       }                                                         │
│                                                                │
│  Output: {                                                     │
│    workflow: "W103" | "W104",                                 │
│    feedbackCount: number,                                     │
│    categoryData: string                                        │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        [WORKFLOW 103]    [WORKFLOW 104]
                │                 │
                │                 │
┌───────────────┴─────────────────┴───────────────────────────────┐
│                                                                  │
│            BIFURCACIÓN: W103 vs W104                            │
│                                                                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [W103 PATH]               [W104 PATH]
        │                         │
        │                         │
        ▼                         ▼
```

---

## 🔀 WORKFLOW 103: Comparativo con Historial

```
┌────────────────────────────────────────────────────────────────┐
│           COMPONENTE 4A: DATABASE EXTRACTOR (W103)             │
│                                                                │
│  Input: studentId, categoryData                                │
│  Proceso:                                                      │
│    1. Query Feedback histórico                                 │
│       SELECT skillsMetrics, createdAt                          │
│       FROM Feedback                                            │
│       WHERE studentId = ?                                      │
│       ORDER BY createdAt DESC                                  │
│       LIMIT 10                                                 │
│                                                                │
│    2. Extraer competencias por fase                            │
│       - CU (Comprensión)                                       │
│       - AP (Análisis y Planificación)                         │
│       - RC (Razonamiento Crítico)                             │
│       - etc.                                                   │
│                                                                │
│    3. Calcular Score_Base                                      │
│       Score_Base = promedio ponderado de competencias         │
│                                                                │
│    4. Query Evaluation histórico                               │
│       SELECT score, examDate                                   │
│       FROM Evaluation                                          │
│       WHERE studentId = ?                                      │
│       ORDER BY examDate DESC                                   │
│       LIMIT 3                                                  │
│                                                                │
│    5. Calcular tendencias                                      │
│       - Tendencia ascendente/descendente                       │
│       - Promedio histórico                                     │
│       - Consistencia                                           │
│                                                                │
│  Output: {                                                     │
│    historicalData: {                                          │
│      competencies: Competency[],                              │
│      scoreBase: number,                                       │
│      evaluations: Evaluation[],                               │
│      trends: Trend[]                                          │
│    },                                                          │
│    confidenceFactor: 0.3 | 0.7 | 1.0                         │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│       COMPONENTE 5A: EXPECTATION CALCULATOR (W103)             │
│                                                                │
│  Input: historicalData                                         │
│  Proceso:                                                      │
│    1. Calcular expectativa por fase usando fórmulas PRD:       │
│                                                                │
│       F1 (Comprensión) = CU×0.7 + RC×0.3                      │
│       F2 (Variables)   = AP×0.8 + RC×0.2                      │
│       F3 (Herramientas)= CU×0.3 + AP×0.5 + EH×0.2            │
│       F4 (Ejecución)   = AP×0.6 + EH×0.4                      │
│       F5 (Verificación)= RC×0.8 + EH×0.2                      │
│                                                                │
│    2. Normalizar a porcentaje (0-100%)                        │
│                                                                │
│  Output: {                                                     │
│    expectedPerformance: {                                      │
│      F1: number,  // 0-100%                                   │
│      F2: number,                                              │
│      F3: number,                                              │
│      F4: number,                                              │
│      F5: number                                               │
│    }                                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│         COMPONENTE 6A: MATH VERIFIER (OBLIGATORIO)             │
│                                                                │
│  Input: exercises[], examTopic, subject                        │
│  Proceso:                                                      │
│    1. Por cada ejercicio:                                      │
│       a. Enviar a Claude Haiku (pequeño prompt):              │
│          "Resuelve este problema paso a paso:                 │
│           [enunciado del ejercicio]"                          │
│                                                                │
│       b. Obtener solución del sistema                         │
│                                                                │
│       c. Comparar con resultado del alumno                    │
│          error_percentage = |system - student| / system × 100│
│                                                                │
│       d. Clasificar:                                          │
│          if (error < 5%) → CORRECTO                           │
│          else → INCORRECTO                                    │
│                                                                │
│    2. Documentar verificación                                  │
│       - Datos del problema                                     │
│       - Solución del sistema                                   │
│       - Resultado del alumno                                   │
│       - Porcentaje de error                                    │
│       - Estado (CORRECTO/INCORRECTO)                          │
│                                                                │
│  Output: {                                                     │
│    verifications: Verification[]                              │
│  }                                                             │
│                                                                │
│  CRÍTICO: Este paso es OBLIGATORIO antes de evaluar F4        │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│        COMPONENTE 7A: COMPARATIVE ANALYZER (W103)              │
│                                                                │
│  Input:                                                        │
│    - parsedExam                                               │
│    - expectedPerformance                                       │
│    - verifications                                            │
│    - metadata (subject, examTopic, examDate)                  │
│                                                                │
│  Proceso:                                                      │
│    1. Construir System Prompt (CACHEABLE):                    │
│       - Rúbrica 5-FASE completa                               │
│       - Descriptores nivel 1-4 por fase                       │
│       - Indicaciones para análisis comparativo                │
│                                                                │
│    2. Construir User Prompt:                                   │
│       - Nombre del estudiante                                  │
│       - Materia y tema                                         │
│       - Transcripción del examen                              │
│       - Expectativas por fase                                 │
│       - Verificaciones matemáticas                            │
│       - Instrucciones: "Evalúa cada ejercicio..."            │
│                                                                │
│    3. Llamada a Claude Haiku API:                             │
│       POST https://api.anthropic.com/v1/messages              │
│       Model: claude-haiku-4.5                                 │
│       Max tokens: 4000                                         │
│       Prompt caching: enabled                                 │
│                                                                │
│    4. Parsear respuesta JSON:                                  │
│       {                                                        │
│         scores: {                                             │
│           F1: { nivel: 1-4, puntaje: 0-100 },                │
│           F2: { ... },                                        │
│           ...                                                  │
│         },                                                     │
│         examScore: number,  // 0-100 puro                    │
│         exerciseAnalysis: [...],                              │
│         comparativeAnalysis: [...],                           │
│         recommendations: [...]                                │
│       }                                                        │
│                                                                │
│    5. VALIDAR REGLA CRÍTICA:                                  │
│       for (verification of verifications) {                   │
│         if (verification.status === "CORRECTO") {            │
│           if (scores.F4.puntaje < 75) {                      │
│             // AJUSTAR: resultado correcto no puede ser bajo │
│             scores.F4.nivel = 3 or 4;                        │
│             scores.F4.puntaje = min(85, recalculate());      │
│           }                                                    │
│         }                                                      │
│       }                                                        │
│                                                                │
│  Output: {                                                     │
│    aiAnalysis: {                                              │
│      scores: PhaseScores,                                     │
│      examScore: number,                                       │
│      exerciseAnalysis: ExerciseAnalysis[],                    │
│      comparativeAnalysis: ComparativeAnalysis[],              │
│      recommendations: Recommendation[]                         │
│    }                                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│          COMPONENTE 8A: GRADE CALCULATOR (W103)                │
│                                                                │
│  Input:                                                        │
│    - aiAnalysis.scores                                        │
│    - aiAnalysis.examScore                                     │
│    - expectedPerformance                                       │
│    - scoreBase                                                │
│    - confidenceFactor                                         │
│                                                                │
│  Proceso:                                                      │
│    1. Nota_Examen = aiAnalysis.examScore (ya calculado)      │
│                                                                │
│    2. Calcular ajustes por fase:                              │
│       const weights = { F1: 0.15, F2: 0.20, F3: 0.25,        │
│                         F4: 0.30, F5: 0.10 };                │
│                                                                │
│       for (fase in [F1, F2, F3, F4, F5]) {                   │
│         actual = scores[fase].puntaje / 100;                 │
│         esperado = expectedPerformance[fase] / 100;          │
│         diferencia = actual - esperado;                       │
│                                                                │
│         // Cap en [-0.20, +0.20]                             │
│         factor = Math.max(-0.20,                              │
│                   Math.min(0.20, diferencia));               │
│                                                                │
│         impacto = scoreBase * factor * weights[fase]         │
│                   * confidenceFactor;                         │
│                                                                │
│         adjustments[fase] = {                                 │
│           expected: esperado * 100,                           │
│           actual: actual * 100,                               │
│           diff: diferencia * 100,                             │
│           factor: factor,                                     │
│           impact: impacto                                     │
│         };                                                     │
│       }                                                        │
│                                                                │
│    3. Calcular Nota_Final:                                    │
│       totalAdjustment = sum(adjustments[].impact);            │
│       Nota_Final = Math.round(scoreBase + totalAdjustment);  │
│                                                                │
│       // Limitar a [0, 100]                                   │
│       Nota_Final = Math.max(0, Math.min(100, Nota_Final));  │
│                                                                │
│    4. Generar interpretación:                                  │
│       if (Nota_Final > scoreBase) {                           │
│         interpretation = "Tu nota final es MAYOR...";        │
│       } else if (Nota_Final < scoreBase) {                    │
│         interpretation = "Tu nota final es MENOR...";        │
│       } else {                                                 │
│         interpretation = "Tu nota final coincide...";        │
│       }                                                        │
│                                                                │
│  Output: {                                                     │
│    grading: {                                                 │
│      examScore: number,      // Nota pura del examen         │
│      finalScore: number,     // Nota ajustada (ESTE VA A DB)│
│      scoreBase: number,      // Punto de partida histórico   │
│      adjustments: Adjustment[],                               │
│      totalAdjustment: number,                                │
│      interpretation: string                                   │
│    }                                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│       COMPONENTE 9A: FEEDBACK GENERATOR (W103)                 │
│                                                                │
│  Input:                                                        │
│    - student                                                   │
│    - metadata                                                  │
│    - aiAnalysis                                               │
│    - grading                                                   │
│    - historicalData                                           │
│    - verifications                                            │
│                                                                │
│  Proceso:                                                      │
│    1. Cargar template W103                                     │
│       template = FEEDBACK_TEMPLATE_W103.md                    │
│                                                                │
│    2. Reemplazar variables:                                    │
│       - {{STUDENT_NAME}} = student.name                       │
│       - {{SUBJECT}} = metadata.subject                        │
│       - {{EXAM_TOPIC}} = metadata.examTopic                   │
│       - {{EXAM_DATE}} = metadata.examDate                     │
│       - {{FINAL_SCORE}} = grading.finalScore                  │
│       - {{EXAM_SCORE}} = grading.examScore                    │
│       - {{BASE_SCORE}} = grading.scoreBase                    │
│       - ... (todas las variables del template)                │
│                                                                │
│    3. Generar tablas dinámicas:                               │
│       - Tabla de ajustes por fase                             │
│       - Tabla de predicciones vs realidad                     │
│       - Gráficos de progreso histórico                        │
│                                                                │
│    4. Compilar secciones:                                     │
│       - Justificación de tu Nota (con tabla)                  │
│       - Tu Progreso Histórico                                 │
│       - Verificación Matemática del Sistema                   │
│       - Análisis Ejercicio por Ejercicio                      │
│       - Validación de tu Progreso                             │
│       - Recomendaciones Personalizadas                        │
│       - Próximos Pasos                                        │
│       - Mensaje Final                                         │
│                                                                │
│  Output: {                                                     │
│    feedbackMarkdown: string  // 3000-5000 palabras           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         └──> CONTINUAR A PERSISTENCIA
```

---

## 🔀 WORKFLOW 104: Básico sin Historial

```
┌────────────────────────────────────────────────────────────────┐
│         COMPONENTE 6B: MATH VERIFIER (OBLIGATORIO)             │
│                                                                │
│  [IDÉNTICO AL W103 - Ver arriba]                              │
│                                                                │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│            COMPONENTE 7B: BASIC ANALYZER (W104)                │
│                                                                │
│  Input:                                                        │
│    - parsedExam                                               │
│    - verifications                                            │
│    - metadata (subject, examTopic, examDate)                  │
│                                                                │
│  Proceso:                                                      │
│    1. Construir System Prompt (CACHEABLE):                    │
│       - Rúbrica 5-FASE completa                               │
│       - Descriptores nivel 1-4 por fase                       │
│       - Indicaciones para evaluación absoluta                 │
│       - NO incluir análisis comparativo                       │
│                                                                │
│    2. Construir User Prompt (MÁS CORTO que W103):             │
│       - Nombre del estudiante                                  │
│       - Materia y tema                                         │
│       - Transcripción del examen                              │
│       - Verificaciones matemáticas                            │
│       - Instrucciones: "Evalúa absolutamente..."             │
│                                                                │
│    3. Llamada a Claude Haiku API:                             │
│       [Mismo que W103 pero prompt más corto]                  │
│                                                                │
│    4. Parsear respuesta JSON:                                  │
│       {                                                        │
│         scores: {                                             │
│           F1: { nivel: 1-4, puntaje: 0-100 },                │
│           F2: { ... },                                        │
│           ...                                                  │
│         },                                                     │
│         totalScore: number,  // 0-100                        │
│         exerciseAnalysis: [...],                              │
│         recommendations: [...]                                │
│       }                                                        │
│                                                                │
│    5. VALIDAR REGLA CRÍTICA:                                  │
│       [Mismo que W103]                                         │
│                                                                │
│  Output: {                                                     │
│    aiAnalysis: {                                              │
│      scores: PhaseScores,                                     │
│      totalScore: number,                                      │
│      exerciseAnalysis: ExerciseAnalysis[],                    │
│      recommendations: Recommendation[]                         │
│    }                                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│          COMPONENTE 8B: GRADE CALCULATOR (W104)                │
│                                                                │
│  Input: aiAnalysis.scores                                      │
│  Proceso:                                                      │
│    1. Calcular nota como promedio ponderado simple:           │
│       const weights = { F1: 0.15, F2: 0.20, F3: 0.25,        │
│                         F4: 0.30, F5: 0.10 };                │
│                                                                │
│       score = Math.round(                                      │
│         scores.F1.puntaje * 0.15 +                            │
│         scores.F2.puntaje * 0.20 +                            │
│         scores.F3.puntaje * 0.25 +                            │
│         scores.F4.puntaje * 0.30 +                            │
│         scores.F5.puntaje * 0.10                              │
│       );                                                       │
│                                                                │
│    2. NO calcular ajustes comparativos                        │
│    3. NO calcular Score_Base                                   │
│                                                                │
│  Output: {                                                     │
│    grading: {                                                 │
│      score: number  // 0-100 (ESTE VA A DB)                  │
│    }                                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│       COMPONENTE 9B: FEEDBACK GENERATOR (W104)                 │
│                                                                │
│  Input:                                                        │
│    - student                                                   │
│    - metadata                                                  │
│    - aiAnalysis                                               │
│    - grading                                                   │
│    - verifications                                            │
│                                                                │
│  Proceso:                                                      │
│    1. Cargar template W104                                     │
│       template = FEEDBACK_TEMPLATE_W104.md                    │
│                                                                │
│    2. Reemplazar variables (MÁS SIMPLE que W103):             │
│       - {{STUDENT_NAME}} = student.name                       │
│       - {{SUBJECT}} = metadata.subject                        │
│       - {{SCORE}} = grading.score                             │
│       - ... (variables del template W104)                     │
│                                                                │
│    3. Generar tablas dinámicas:                               │
│       - Tabla de distribución por fases                       │
│       - Tabla de niveles de desempeño                         │
│                                                                │
│    4. Compilar secciones (6 secciones, no 7):                │
│       - Resumen de tu Desempeño                               │
│       - Verificación Matemática del Sistema                   │
│       - Análisis Ejercicio por Ejercicio                      │
│       - Recomendaciones para Mejorar                          │
│       - Próximos Pasos                                        │
│       - Mensaje Final                                         │
│                                                                │
│  Output: {                                                     │
│    feedbackMarkdown: string  // 2000-3000 palabras           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         └──> CONTINUAR A PERSISTENCIA
```

---

## 🔄 Convergencia: Persistencia (W103 & W104)

```
┌────────────────────────────────────────────────────────────────┐
│                COMPONENTE 10: DATABASE UPLOADER                │
│                                                                │
│  Input:                                                        │
│    - student                                                   │
│    - metadata                                                  │
│    - grading (finalScore o score)                             │
│    - feedbackMarkdown                                         │
│    - instructorId                                             │
│                                                                │
│  Proceso:                                                      │
│    1. Generar evaluationId único:                             │
│       const hash = SHA256(                                     │
│         studentId +                                           │
│         examDate +                                            │
│         examTopic +                                           │
│         timestamp                                             │
│       );                                                       │
│       evaluationId = "eval_" + hash.substring(0, 16);        │
│                                                                │
│    2. Normalizar datos:                                        │
│       subject = metadata.subject.trim();                      │
│       examDate = new Date(metadata.examDate).toISOString();  │
│       examTopic = metadata.examTopic.trim();                  │
│                                                                │
│    3. Construir record:                                        │
│       const record = {                                         │
│         id: evaluationId,                                     │
│         studentId: student.id,                                │
│         subject: subject,                                     │
│         examDate: examDate,                                   │
│         examTopic: examTopic,                                 │
│         score: grading.finalScore || grading.score,          │
│         feedback: feedbackMarkdown,                           │
│         createdBy: instructorId,                              │
│         createdAt: new Date().toISOString(),                  │
│         updatedAt: new Date().toISOString()                   │
│       };                                                       │
│                                                                │
│    4. INSERT en DB:                                            │
│       INSERT INTO Evaluation (                                 │
│         id, studentId, subject, examDate,                     │
│         examTopic, score, feedback,                           │
│         createdBy, createdAt, updatedAt                       │
│       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);               │
│                                                                │
│    5. Logging:                                                 │
│       console.log({                                           │
│         action: "EVALUATION_CREATED",                         │
│         evaluationId,                                         │
│         studentId: student.id,                                │
│         workflow: "W103" | "W104",                            │
│         score: record.score,                                  │
│         timestamp: new Date()                                 │
│       });                                                      │
│                                                                │
│  Output: {                                                     │
│    evaluationId: string,                                      │
│    success: boolean,                                          │
│    record: EvaluationRecord                                   │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   RETURN RESULT                │
         │                               │
         │   Response: {                 │
         │     batchId: string,          │
         │     results: [                │
         │       {                       │
         │         fileName: string,     │
         │         studentName: string,  │
         │         evaluationId: string, │
         │         score: number,        │
         │         workflow: string,     │
         │         status: "success",    │
         │         duration: number      │
         │       },                      │
         │       ...                     │
         │     ],                        │
         │     summary: {                │
         │       total: number,          │
         │       successful: number,     │
         │       failed: number,         │
         │       avgScore: number,       │
         │       totalDuration: number   │
         │     }                         │
         │   }                           │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   FIN DEL PROCESO              │
         │   Status 200 OK                │
         └───────────────────────────────┘
```

---

## ⚠️ Manejo de Errores por Componente

### Error Handling Strategy

```typescript
// Componente 1: PARSER
try {
  const parsed = await parseExamFile(file);
} catch (error) {
  return {
    status: "error",
    fileName: file.name,
    error: "PARSE_ERROR",
    message: "No se pudo parsear el archivo. Verifica el formato.",
    details: error.message
  };
}

// Componente 2: MATCHER
try {
  const student = await matchStudent(apellido);
  if (!student) {
    return {
      status: "error",
      fileName: file.name,
      error: "STUDENT_NOT_FOUND",
      message: `No se encontró estudiante con apellido: ${apellido}`,
      suggestion: "Verifica el nombre del archivo o agrega el estudiante a la BD."
    };
  }
} catch (error) {
  // DB error, skip file but continue batch
}

// Componente 6: MATH VERIFIER
try {
  const verifications = await verifyMath(exercises);
} catch (error) {
  // Si falla verificación, loggear pero continuar
  // No bloquear la corrección
  console.warn("Math verification failed:", error);
  verifications = []; // Empty array
}

// Componente 7: ANALYZER (CRÍTICO)
try {
  const analysis = await analyzeExam(prompt);
} catch (error) {
  if (error.type === "overloaded_error") {
    // Retry con exponential backoff
    await sleep(2000);
    return retry(analyzeExam, prompt);
  }

  if (error.type === "rate_limit_error") {
    // Esperar y reintentar
    await sleep(60000);
    return retry(analyzeExam, prompt);
  }

  // Si falla después de retries, marcar como error
  return {
    status: "error",
    fileName: file.name,
    error: "AI_ANALYSIS_FAILED",
    message: "No se pudo analizar el examen con IA.",
    details: error.message
  };
}

// Componente 10: DATABASE UPLOADER (CRÍTICO)
try {
  await db.insert(record);
} catch (error) {
  if (error.code === "SQLITE_CONSTRAINT") {
    // Duplicate entry - regenerar ID
    record.id = generateNewId();
    return retry(db.insert, record);
  }

  // Error crítico - rollback y notificar
  return {
    status: "error",
    fileName: file.name,
    error: "DB_INSERT_FAILED",
    message: "No se pudo guardar en base de datos.",
    details: error.message,
    critical: true  // Requiere atención inmediata
  };
}
```

---

## 📊 Métricas y Tiempos Estimados

### W103 (Comparativo)
```
Componente 1 (Parser):              ~2 segundos
Componente 2 (Matcher):             ~1 segundo
Componente 3 (History Checker):     ~1 segundo
Componente 4A (DB Extractor):       ~3 segundos
Componente 5A (Expectation Calc):   ~1 segundo
Componente 6A (Math Verifier):      ~5-7 segundos
Componente 7A (Analyzer):           ~10-12 segundos
Componente 8A (Grade Calculator):   ~1 segundo
Componente 9A (Feedback Gen):       ~2-3 segundos
Componente 10 (DB Uploader):        ~1 segundo

TOTAL W103: ~27-33 segundos por examen
```

### W104 (Básico)
```
Componente 1 (Parser):              ~2 segundos
Componente 2 (Matcher):             ~1 segundo
Componente 3 (History Checker):     ~1 segundo
Componente 6B (Math Verifier):      ~5-7 segundos
Componente 7B (Analyzer):           ~6-8 segundos (prompt más corto)
Componente 8B (Grade Calculator):   ~0.5 segundos
Componente 9B (Feedback Gen):       ~1-2 segundos
Componente 10 (DB Uploader):        ~1 segundo

TOTAL W104: ~17-22 segundos por examen
```

### Modo Paralelo (≥9 exámenes)
```
Si tenemos 30 exámenes:
- División en 3 batches de 10 exámenes
- Cada batch en paralelo: ~27s × 10 = 4.5 minutos
- Total: ~4.5 minutos (vs. ~13.5 minutos secuencial)
- Speedup: 3x
```

---

## 🔑 Decisiones de Diseño Clave

### 1. ¿Por qué separar W103 y W104?
- **Performance**: W104 es 40% más rápido (no necesita DB extraction ni expectation calc)
- **Calidad**: W103 da feedback más personalizado cuando hay datos
- **Costo**: W104 es 30% más barato (prompts más cortos)

### 2. ¿Por qué Math Verifier es obligatorio?
- **Validación**: Evita que el sistema evalúe mal un resultado correcto
- **Transparencia**: Documenta la verificación del sistema
- **Regla crítica**: Resultado correcto nunca puede tener F4 < 75

### 3. ¿Por qué Prompt Caching?
- **Ahorro**: 70-90% reducción en costos de input tokens
- **Performance**: Respuestas más rápidas
- **Rúbrica constante**: La rúbrica 5-FASE no cambia entre exámenes

### 4. ¿Por qué Score_Base en W103?
- **Pedagógico**: Permite comparar desempeño real vs. esperado
- **Motivacional**: Muestra progreso o regresión del alumno
- **Científico**: Valida predicciones del sistema

---

**Versión:** 1.0
**Fecha:** 21 de Octubre, 2025
**Autor:** Claude Code (Sonnet 4.5)
